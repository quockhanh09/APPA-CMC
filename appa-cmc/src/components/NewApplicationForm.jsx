import { useEffect, useRef, useState } from 'react'
import { createRegistration } from '../api'
import { businessTypes } from '../data/businessTypes'
import { cities, getWardsByCity, getActiveRegion } from '../data/vietnamLocations'
import FeeResultCard from './FeeResultCard'

// Ánh xạ mã loại hình CMS -> mã loại hình phía backend đăng ký công khai
const PUBLIC_TYPE_MAP = {
  coffee: 'cafe',
  restaurant: 'restaurant',
  store: 'shop',
  gym: 'spa',
  karaokeRoom: 'karaoke',
  karaokeBox: 'karaoke',
  bar: 'bar',
  hotel: 'hotel',
  entertainment: 'playground',
  mall: 'mall',
  supermarket: 'supermarket',
}

const TYPE_ABBR = {
  coffee: 'CF',
  restaurant: 'NH',
  store: 'CH',
  gym: 'SPA',
  karaokeRoom: 'KRP',
  karaokeBox: 'KRB',
  bar: 'BAR',
  hotel: 'KS',
  entertainment: 'KVC',
  mall: 'TTTM',
  supermarket: 'ST',
}

function getNextDailyOrderNumber() {
  const now = new Date()
  const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const storageKey = `appa_daily_order_${dateKey}`
  let nextCount = 1
  try {
    nextCount = Number(window.localStorage.getItem(storageKey) || '0') + 1
    window.localStorage.setItem(storageKey, String(nextCount))
  } catch {}
  return String(nextCount).padStart(3, '0')
}

function generateCodeTail() {
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${random}-${getNextDailyOrderNumber()}`
}

function buildRegistrationCode(typeKey, tail) {
  const abbr = TYPE_ABBR[typeKey] || 'KH'
  return `APPA-CMC-${abbr}-${tail}`
}

function formatFeeValue(digits) {
  if (!digits) return ''
  return new Intl.NumberFormat('vi-VN').format(Number(digits))
}

const baseSalary = 2_530_000
const vatRate = 0.08

const karaokeRoomRules = [
  { key: 'roomSmall', label: 'Phòng ≤ 20m²', coefficients: [1.5, 1.2, 1.05] },
  { key: 'roomMid', label: 'Phòng 20-30m²', coefficients: [1.6, 1.28, 1.12] },
  { key: 'roomLarge', label: 'Phòng > 30m²', coefficients: [1.7, 1.36, 1.19] },
]

const karaokeBoxRule = { key: 'vipBox', label: 'Box karaoke (cố định)', fixed: 0.85 }

const hotelRules = [
  { key: 'room45', label: 'Phòng 4 - 5 sao (hoặc tương đương)', rate: 0.03 },
  { key: 'room13', label: 'Phòng 1 - 3 sao (hoặc tương đương)', rate: 0.02 },
]

const feeConfigs = {
  coffee: { capMultiplier: 8, tiers: [
    { label: 'Bậc 1', range: '0 - 15 m²', min: 0, max: 15, rate: 0.35, isFlatFirst: true },
    { label: 'Bậc 2', range: '15 - 50 m²', min: 15, max: 50, rate: 0.04 },
    { label: 'Bậc 3', range: '> 50 m²', min: 50, max: Number.POSITIVE_INFINITY, rate: 0.02 },
  ]},
  restaurant: { capMultiplier: 8, tiers: [
    { label: 'Bậc 1', range: '0 - 50 m²', min: 0, max: 50, rate: 2.0, isFlatFirst: true },
    { label: 'Bậc 2', range: '50 - 100 m²', min: 50, max: 100, rate: 0.05 },
    { label: 'Bậc 3', range: '> 100 m²', min: 100, max: Number.POSITIVE_INFINITY, rate: 0.03 },
  ]},
  store: { capMultiplier: 5, tiers: [
    { label: 'Bậc 1', range: '0 - 50 m²', min: 0, max: 50, rate: 0.35, isFlatFirst: true },
    { label: 'Bậc 2', range: '50 - 100 m²', min: 50, max: 100, rate: 0.008 },
    { label: 'Bậc 3', range: '> 100 m²', min: 100, max: Number.POSITIVE_INFINITY, rate: 0.006 },
  ]},
  gym: { capMultiplier: 10, tiers: [
    { label: 'Bậc 1', range: '0 - 50 m²', min: 0, max: 50, rate: 0.5, isFlatFirst: true },
    { label: 'Bậc 2', range: '50 - 100 m²', min: 50, max: 100, rate: 0.011 },
    { label: 'Bậc 3', range: '> 100 m²', min: 100, max: Number.POSITIVE_INFINITY, rate: 0.009 },
  ]},
  bar: { capMultiplier: 27, tiers: [
    { label: 'Bậc 1', range: '0 - 50 m²', min: 0, max: 50, rate: 2.35, isFlatFirst: true },
    { label: 'Bậc 2', range: '50 - 200 m²', min: 50, max: 200, rate: 0.06 },
    { label: 'Bậc 3', range: '> 200 m²', min: 200, max: Number.POSITIVE_INFINITY, rate: 0.05 },
  ]},
  entertainment: { capMultiplier: 12, tiers: [
    { label: 'Bậc 1', range: '0 - 200 m²', min: 0, max: 200, rate: 0.7, isFlatFirst: true },
    { label: 'Bậc 2', range: '200 - 500 m²', min: 200, max: 500, rate: 0.003 },
    { label: 'Bậc 3', range: '> 500 m²', min: 500, max: Number.POSITIVE_INFINITY, rate: 0.001 },
  ]},
  mall: { capMultiplier: 50, tiers: [
    { label: 'Bậc 1', range: '0 - 200 m²', min: 0, max: 200, rate: 1.5, isFlatFirst: true },
    { label: 'Bậc 2', range: '200 - 500 m²', min: 200, max: 500, rate: 0.003 },
    { label: 'Bậc 3', range: '> 500 m²', min: 500, max: Number.POSITIVE_INFINITY, rate: 0.002 },
  ]},
  supermarket: { capMultiplier: 10, tiers: [
    { label: 'Bậc 1', range: '0 - 500 m²', min: 0, max: 500, rate: 1.25, isFlatFirst: true },
    { label: 'Bậc 2', range: '500 - 1000 m²', min: 500, max: 1000, rate: 0.003 },
    { label: 'Bậc 3', range: '> 1000 m²', min: 1000, max: Number.POSITIVE_INFINITY, rate: 0.002 },
  ]},
}

const businessTypeCaps = {
  coffee: 8, restaurant: 8, store: 5, gym: 10, bar: 27, entertainment: 12, mall: 50, supermarket: 10,
  karaokeRoom: null, karaokeBox: null, hotel: null,
}

function formatNumber(value, fractionDigits = 4) {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: fractionDigits }).format(value)
}

function calculateTierQuantity(area, min, max) {
  if (area <= min) return 0
  const upper = Number.isFinite(max) ? max : area
  return Math.min(area, upper) - min
}

function parseAreaFromValue(val) {
  if (!val) return 0
  const m = String(val).match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return 0
  const v = Number.parseFloat(m[1].replace(',', '.'))
  return Number.isFinite(v) && v > 0 ? v : 0
}

export default function NewApplicationForm({ onClose, onCreated }) {
  const [selectedType, setSelectedType] = useState('coffee')
  const [codeTail, setCodeTail] = useState(() => generateCodeTail())
  const registrationCode = buildRegistrationCode(selectedType, codeTail)

  const [unit, setUnit] = useState('')
  const [legalRepresentative, setLegalRepresentative] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [facility, setFacility] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [area, setArea] = useState('')
  const [duration, setDuration] = useState('')

  const [feeDigits, setFeeDigits] = useState('')

  const [licenseFileName, setLicenseFileName] = useState('')
  const [licenseFileMime, setLicenseFileMime] = useState('')

  const [isAgreed, setIsAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const [selectedCity, setSelectedCity] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [karaokeRoomCounts, setKaraokeRoomCounts] = useState({ roomSmall: '', roomMid: '', roomLarge: '', vipBox: '' })
  const [karaokeBoxCount, setKaraokeBoxCount] = useState('')
  const [hotelStar, setHotelStar] = useState('')
  const [hotelRooms, setHotelRooms] = useState('')
  const [feeResult, setFeeResult] = useState(null)

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--panel)',
    color: 'var(--text-h)',
    fontWeight: '600',
    fontSize: '13px',
    boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '11px', color: 'var(--text)', marginBottom: '4px', display: 'block' }
  const cardStyle = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }
  const cardTitleStyle = { fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)', marginBottom: '14px' }
  const fieldColStyle = { display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }

  const buildScaleDetails = () => {
    const publicType = PUBLIC_TYPE_MAP[selectedType]
    if (publicType === 'karaoke') {
      if (selectedType === 'karaokeBox') {
        if (karaokeBoxCount.trim()) return `Số Karaoke Box: ${karaokeBoxCount.trim()}`
        return ''
      }
      const parts = []
      karaokeRoomRules.forEach((rule) => {
        const val = karaokeRoomCounts[rule.key]
        if (val && Number(val) > 0) parts.push(`${rule.label}: ${val}`)
      })
      if (karaokeRoomCounts.vipBox && Number(karaokeRoomCounts.vipBox) > 0) {
        parts.push(`${karaokeBoxRule.label}: ${karaokeRoomCounts.vipBox}`)
      }
      return parts.join(' | ')
    }
    if (publicType === 'hotel') {
      const parts = []
      if (hotelStar) parts.push(`Hạng sao: ${hotelStar} sao`)
      if (hotelRooms.trim()) parts.push(`Số phòng: ${hotelRooms.trim()}`)
      return parts.join(', ')
    }
    if (area.trim()) return `Diện tích: ${area.trim()} m2`
    return ''
  }

  const buildPayload = (code) => {
    const isKaraoke = selectedType === 'karaokeRoom' || selectedType === 'karaokeBox'
    return {
      registrationCode: code,
      businessType: PUBLIC_TYPE_MAP[selectedType],
      karaokeSubType: isKaraoke ? (selectedType === 'karaokeBox' ? 'box' : 'room') : '',
      businessTypeLabel: businessTypes[selectedType]?.label || selectedType,
      companyName: unit.trim(),
      taxCode: taxCode.trim(),
      companyAddress: companyAddress.trim(),
      legalRepresentative: legalRepresentative.trim(),
      phone: phone.trim(),
      email: email.trim(),
      storeName: facility.trim(),
      storeAddress: storeAddress.trim(),
      paymentCycle: duration.trim(),
      scaleDetails: buildScaleDetails(),
      feeAmount: feeResult?.totalWithVat ? Math.round(feeResult.totalWithVat) : (feeDigits ? Number(feeDigits) : undefined),
      fileName: licenseFileName,
      fileMimeType: licenseFileMime,
    }
  }

  const attemptCreate = async (code, attemptsLeft) => {
    try {
      const data = await createRegistration(buildPayload(code))
      return data.registration
    } catch (err) {
      const isDuplicate = err.message && err.message.includes('đã tồn tại')
      if (isDuplicate && attemptsLeft > 0) {
        const nextTail = generateCodeTail()
        setCodeTail(nextTail)
        return attemptCreate(buildRegistrationCode(selectedType, nextTail), attemptsLeft - 1)
      }
      throw err
    }
  }

  useEffect(() => {
    if (!selectedCity || !selectedWard) {
      setFeeResult(null)
      return
    }

    let rows = []
    let totalA = 0
    let rawTotalA = 0
    let annualFee = 0
    let safeArea = 0
    let hasValidInput = false

    const activeRegion = getActiveRegion(selectedCity, selectedWard)
    const k = activeRegion?.multiplier ?? 1
    const kText = formatNumber(k, 2)

    const typeKey = selectedType
    const capMultiplier = businessTypeCaps[typeKey] ?? null

    try {
      if (typeKey === 'karaokeRoom') {
        rows = karaokeRoomRules.flatMap((rule) => {
          const totalRooms = Number(karaokeRoomCounts[rule.key]) || 0
          const tier1Qty = Math.min(totalRooms, 4)
          const tier2Qty = Math.max(Math.min(totalRooms, 10) - 4, 0)
          const tier3Qty = Math.max(totalRooms - 10, 0)
          return [
            {
              label: `${rule.label} (Phòng 1-4)`, range: 'Bậc 1-4 phòng', quantity: tier1Qty,
              contribution: tier1Qty * rule.coefficients[0],
              formulaText: k !== 1 ? `${tier1Qty} x ${formatNumber(rule.coefficients[0], 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${tier1Qty} x ${formatNumber(rule.coefficients[0], 2)} x ${formatNumber(baseSalary, 0)}`,
              unit: 'phòng',
            },
            {
              label: `${rule.label} (Phòng 5-10)`, range: 'Bậc 5-10 phòng', quantity: tier2Qty,
              contribution: tier2Qty * rule.coefficients[1],
              formulaText: k !== 1 ? `${tier2Qty} x ${formatNumber(rule.coefficients[1], 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${tier2Qty} x ${formatNumber(rule.coefficients[1], 2)} x ${formatNumber(baseSalary, 0)}`,
              unit: 'phòng',
            },
            {
              label: `${rule.label} (Phòng 11+)`, range: 'Bậc >10 phòng', quantity: tier3Qty,
              contribution: tier3Qty * rule.coefficients[2],
              formulaText: k !== 1 ? `${tier3Qty} x ${formatNumber(rule.coefficients[2], 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${tier3Qty} x ${formatNumber(rule.coefficients[2], 2)} x ${formatNumber(baseSalary, 0)}`,
              unit: 'phòng',
            },
          ].filter((r) => r.quantity > 0)
        })
        const boxQuantity = Number(karaokeRoomCounts.vipBox) || 0
        if (boxQuantity > 0) {
          rows.push({
            label: karaokeBoxRule.label, range: 'Box karaoke', quantity: boxQuantity,
            contribution: boxQuantity * karaokeBoxRule.fixed,
            formulaText: k !== 1 ? `${boxQuantity} x ${formatNumber(karaokeBoxRule.fixed, 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${boxQuantity} x ${formatNumber(karaokeBoxRule.fixed, 2)} x ${formatNumber(baseSalary, 0)}`,
            unit: 'box',
          })
        }
        if (rows.length === 0) {
          setFeeResult(null)
          return
        }
        rawTotalA = rows.reduce((sum, row) => sum + row.contribution, 0)
        totalA = rawTotalA
        annualFee = totalA * baseSalary * k
        hasValidInput = true
      } else if (typeKey === 'karaokeBox') {
        const boxQuantity = Number(karaokeBoxCount) || 0
        if (boxQuantity > 0) {
          rows = [{
            label: karaokeBoxRule.label, range: 'Box karaoke', quantity: boxQuantity,
            contribution: boxQuantity * karaokeBoxRule.fixed,
            formulaText: k !== 1 ? `${boxQuantity} x ${formatNumber(karaokeBoxRule.fixed, 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${boxQuantity} x ${formatNumber(karaokeBoxRule.fixed, 2)} x ${formatNumber(baseSalary, 0)}`,
            unit: 'box',
          }]
        }
        if (rows.length === 0) {
          setFeeResult(null)
          return
        }
        rawTotalA = rows.reduce((sum, row) => sum + row.contribution, 0)
        totalA = rawTotalA
        annualFee = totalA * baseSalary * k
        hasValidInput = true
      } else if (typeKey === 'hotel') {
        const starValue = Number(hotelStar)
        const roomQty = Number(hotelRooms)
        const rule = Number.isFinite(starValue) && starValue >= 4 ? hotelRules[0] : hotelRules[1]
        if (roomQty > 0 && Number.isFinite(starValue) && starValue >= 1 && starValue <= 5) {
          rows = [{
            label: rule.label, range: 'Theo số lượng phòng', quantity: roomQty,
            contribution: roomQty * rule.rate,
            formulaText: k !== 1 ? `${roomQty} x ${formatNumber(rule.rate, 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${roomQty} x ${formatNumber(rule.rate, 2)} x ${formatNumber(baseSalary, 0)}`,
            unit: 'phòng',
          }]
        }
        if (rows.length === 0) {
          setFeeResult(null)
          return
        }
        rawTotalA = rows.reduce((sum, row) => sum + row.contribution, 0)
        totalA = rawTotalA
        annualFee = totalA * baseSalary * k
        hasValidInput = true
      } else {
        const cfg = feeConfigs[typeKey]
        safeArea = Number(area)
        if (!cfg || !(safeArea > 0)) {
          setFeeResult(null)
          return
        }
        const tierConfigs = cfg.tiers
        let cap = capMultiplier ? capMultiplier : Number.POSITIVE_INFINITY
        rows = tierConfigs.map((tier) => {
          const qty = calculateTierQuantity(safeArea, tier.min, tier.max)
          let contrib = 0, formula = ''
          if (tier.isFlatFirst) {
            contrib = qty > 0 ? tier.rate : 0
            formula = qty > 0 ? (k !== 1 ? `${formatNumber(tier.rate, 2)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${formatNumber(tier.rate, 2)} x ${formatNumber(baseSalary, 0)}`) : '0 ₫'
          } else {
            contrib = qty * tier.rate
            formula = k !== 1 ? `${formatNumber(qty, 0)} x ${formatNumber(tier.rate, 4)} x ${formatNumber(baseSalary, 0)} x k(${kText})` : `${formatNumber(qty, 0)} x ${formatNumber(tier.rate, 4)} x ${formatNumber(baseSalary, 0)}`
          }
          return { label: tier.label, range: tier.range, quantity: qty, contribution: contrib, formulaText: formula, unit: 'm²' }
        })
        rawTotalA = rows.reduce((sum, r) => sum + r.contribution, 0)
        totalA = Math.min(rawTotalA, cap)
        annualFee = totalA * baseSalary * k
        hasValidInput = true
      }

      if (!hasValidInput) {
        setFeeResult(null)
        return
      }

      const baseAmount = totalA * baseSalary
      const vat = annualFee * vatRate
      const totalWithVat = annualFee + vat

      setFeeResult({
        safeArea,
        rows,
        totalA,
        baseAmount,
        annualFee,
        vat,
        totalWithVat,
        region: activeRegion,
        rawTotalA,
        capMultiplier,
      })
    } catch (e) {
      setFeeResult(null)
    }
  }, [selectedType, selectedCity, selectedWard, area, facility, karaokeRoomCounts, karaokeBoxCount, hotelStar, hotelRooms])

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (submitting) return
    setError('')

    if (!unit.trim()) {
      setError('Vui lòng nhập tên đơn vị sử dụng')
      return
    }
    if (!facility.trim()) {
      setError('Vui lòng nhập tên cơ sở kinh doanh')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không hợp lệ')
      return
    }
    if (!feeResult && !feeDigits) {
      setError('Vui lòng điền đủ thông tin để hệ thống tự tính phí hoặc nhập phí thủ công')
      return
    }
    if (!isAgreed) {
      setError('Vui lòng xác nhận cam kết và pháp lý trước khi tạo đơn')
      return
    }

    setSubmitting(true)
    try {
      const registration = await attemptCreate(registrationCode, 2)
      onCreated?.(registration)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePickLicenseFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLicenseFileName(file.name)
    setLicenseFileMime(file.type || '')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1300px', width: '100%', padding: '24px 32px', background: 'var(--panel)', color: 'var(--text-h)' }}
      >
        <div className="detail-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)' }}>
                TẠO ĐƠN MỚI
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#673ab7' }}>
                MÃ ĐƠN: {registrationCode}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
              Điền đầy đủ thông tin để tạo hồ sơ đăng ký mới
            </div>
          </div>

          <button type="button" className="icon-btn table-icon-btn" aria-label="Đóng" onClick={onClose} style={{ borderRadius: '50%' }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', border: '1px solid #f8d7da', color: '#d93838', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={cardStyle}>
                <div style={cardTitleStyle}>THÔNG TIN ĐƠN VỊ SỬ DỤNG</div>
                <div style={fieldColStyle}>
                  <div>
                    <label style={labelStyle}>TÊN ĐƠN VỊ SỬ DỤNG *</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Nhập tên đơn vị / công ty"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>NGƯỜI ĐẠI DIỆN</label>
                      <input
                        type="text"
                        value={legalRepresentative}
                        onChange={(e) => setLegalRepresentative(e.target.value)}
                        placeholder="Họ và tên"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>MÃ SỐ THUẾ</label>
                      <input
                        type="text"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="Mã số thuế"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>ĐỊA CHỈ TRỤ SỞ</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>SỐ ĐIỆN THOẠI</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>EMAIL LIÊN HỆ</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>GIẤY ĐĂNG KÝ KINH DOANH</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handlePickLicenseFile}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>
                        {licenseFileName ? `Đã chọn: ${licenseFileName}` : 'Chưa đính kèm'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '4px 12px', fontSize: '11px' }}
                      >
                        Chọn tệp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={cardTitleStyle}>THÔNG TIN ĐỊA ĐIỂM &amp; THÔNG SỐ TÍNH PHÍ</div>
                <div style={fieldColStyle}>
                  <div>
                    <label style={labelStyle}>LOẠI HÌNH KINH DOANH</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {Object.entries(businessTypes).map(([key, type]) => (
                        <option key={key} value={key}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>TỈNH/THÀNH PHỐ</label>
                      <select
                        value={selectedCity}
                        onChange={(e) => {
                          const cityId = e.target.value
                          setSelectedCity(cityId)
                          const wards = getWardsByCity(cityId) || []
                          setSelectedWard(wards[0]?.id || '')
                        }}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="" disabled hidden>Chọn tỉnh/thành phố</option>
                        {(cities || []).map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>PHƯỜNG/XÃ</label>
                      <select
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        disabled={!selectedCity}
                      >
                        <option value="" disabled hidden>Chọn phường/xã</option>
                        {selectedCity && (getWardsByCity(selectedCity) || []).map((ward) => (
                          <option key={ward.id} value={ward.id}>{ward.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>ĐỊA CHỈ SỬ DỤNG (SỐ NHÀ, TÊN ĐƯỜNG)</label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Nhập số nhà, tên đường"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>TÊN CƠ SỞ KINH DOANH *</label>
                    <input
                      type="text"
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      placeholder="Nhập tên cơ sở kinh doanh"
                      style={inputStyle}
                      required
                    />
                  </div>

                  {selectedType === 'karaokeRoom' ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {karaokeRoomRules.map((rule) => (
                          <div key={rule.key}>
                            <label style={labelStyle}>{rule.label}</label>
                            <input
                              type="number"
                              min="0"
                              value={karaokeRoomCounts[rule.key]}
                              onChange={(e) => setKaraokeRoomCounts((prev) => ({ ...prev, [rule.key]: e.target.value }))}
                              placeholder="Nhập số phòng"
                              style={inputStyle}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={labelStyle}>{karaokeBoxRule.label}</label>
                        <input
                          type="number"
                          min="0"
                          value={karaokeRoomCounts.vipBox}
                          onChange={(e) => setKaraokeRoomCounts((prev) => ({ ...prev, vipBox: e.target.value }))}
                          placeholder="Nhập số box"
                          style={inputStyle}
                        />
                      </div>
                    </>
                  ) : selectedType === 'karaokeBox' ? (
                    <div>
                      <label style={labelStyle}>SỐ KARAOKE BOX *</label>
                      <input
                        type="number"
                        min="0"
                        value={karaokeBoxCount}
                        onChange={(e) => setKaraokeBoxCount(e.target.value)}
                        placeholder="Nhập số karaoke box"
                        style={inputStyle}
                      />
                    </div>
                  ) : selectedType === 'hotel' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>HẠNG SAO *</label>
                        <select value={hotelStar} onChange={(e) => setHotelStar(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="" disabled hidden>Chọn hạng sao</option>
                          <option value="1">1 sao</option>
                          <option value="2">2 sao</option>
                          <option value="3">3 sao</option>
                          <option value="4">4 sao</option>
                          <option value="5">5 sao</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>SỐ PHÒNG *</label>
                        <input
                          type="number"
                          min="0"
                          value={hotelRooms}
                          onChange={(e) => setHotelRooms(e.target.value)}
                          placeholder="Nhập số phòng"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={labelStyle}>DIỆN TÍCH (m²) *</label>
                        <input
                          type="number"
                          min="0"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="0"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>THỜI HẠN TÍNH PHÍ</label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="VD: 12 tháng"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: '#312E81', color: '#fff', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  CAM KẾT VÀ PHÁP LÝ
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#4caf50', cursor: 'pointer' }}
                  />
                  Đã tích chọn chấp thuận Điều khoản dịch vụ và Cam kết sử dụng v2
                </label>
                <div style={{ fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>
                  Hồ sơ sẽ được tạo ở trạng thái chờ duyệt và xử lý thanh toán như quy trình thông thường
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', color: '#1a1a1a' }}>CHI TIẾT PHÍ DỰ TÍNH</span>
                  <span style={{ fontSize: '11px', color: '#5c6bc0', fontWeight: '700' }}>NĐ 17/2023/NĐ-CP &amp; NĐ 134/2026/NĐ-CP</span>
                </div>

                {feeResult ? (
                  <FeeResultCard feeResult={feeResult} />
                ) : (
                  <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                      Vui lòng chọn đầy đủ:
                      <br />- Loại hình kinh doanh
                      <br />- Tỉnh/Thành phố &amp; Phường/Xã
                      <br />- Thông số tính phí (Diện tích / Số phòng theo loại phòng / Số box / Hạng sao + Số phòng)
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: '#6A6E71' }}>
                  HÀNH ĐỘNG
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="btn btn-outline"
                    style={{ justifyContent: 'center', background: '#ffffff', fontWeight: '700', padding: '12px', fontSize: '13px', borderRadius: '12px', opacity: submitting ? 0.6 : 1 }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn"
                    style={{ justifyContent: 'center', background: submitting ? '#a29bfe' : '#4E45E4', color: '#fff', padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo đơn'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
