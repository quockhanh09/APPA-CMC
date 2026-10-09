import { Wallet, BadgeCheck, Clock3, Receipt } from 'lucide-react'
import { formatVND } from '../data/revenue'

const CARD_META = [
  { key: 'due', label: 'TỔNG DOANH THU CẦN THU', icon: Wallet, tone: 'blue' },
  { key: 'received', label: 'DOANH THU ĐÃ NHẬN', icon: BadgeCheck, tone: 'green' },
  { key: 'pending', label: 'DOANH THU CHỜ NHẬN (CÒN NỢ)', icon: Clock3, tone: 'orange' },
  { key: 'cost', label: 'TỔNG CHI PHÍ VẬN HÀNH (15%)', icon: Receipt, tone: 'red' },
]

export default function RevenueStats({ rows = [] }) {
  const totalDue = rows.reduce((sum, row) => sum + row.feeAmount, 0)
  const totalReceived = rows.reduce((sum, row) => sum + row.recognizedAmount, 0)
  const totalPending = rows.reduce((sum, row) => sum + row.pendingAmount, 0)
  const operatingCost = totalDue * 0.15

  const paidUnits = rows.filter((row) => row.recognizedAmount > 0).length
  const owingUnits = rows.filter((row) => row.pendingAmount > 0).length

  const values = {
    due: { value: totalDue, sub: `(${rows.length} Đơn vị sử dụng)` },
    received: { value: totalReceived, sub: `(${paidUnits} Đơn vị đã thanh toán)` },
    pending: { value: totalPending, sub: `(${owingUnits} Đơn vị chưa đóng / quá hạn)` },
    cost: { value: operatingCost, sub: '(Phí phân bổ quản lý)' },
  }

  return (
    <section className="revenue-stats">
      {CARD_META.map((card) => {
        const Icon = card.icon
        const data = values[card.key]
        return (
          <div key={card.key} className={`revenue-stat-card tone-${card.tone}`}>
            <span className="revenue-stat-icon">
              <Icon size={20} strokeWidth={2} />
            </span>
            <div className="revenue-stat-body">
              <span className="revenue-stat-label">{card.label}</span>
              <span className="revenue-stat-value">{formatVND(data.value)}</span>
              <span className="revenue-stat-sub">{data.sub}</span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
