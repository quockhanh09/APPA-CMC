import { applications } from './applications'
import { calculateStatus } from '../utils/statusCalculator'

function parseAmount(feeText) {
  return Number(String(feeText).replace(/\D/g, '')) || 0
}

function parseIssuePeriod(issueDate, duration) {
  if (!issueDate) return null
  const date = new Date(issueDate)
  if (Number.isNaN(date.getTime())) return null
  return `${duration} (T${date.getMonth() + 1}/${date.getFullYear()})`
}

function buildRevenueRows() {
  return applications.map((row) => {
    const feeAmount = parseAmount(row.fee)
    const appStatus = calculateStatus({ issueDate: row.issueDate, paid: row.paid, duration: row.duration })
    const paid = Boolean(row.paid)

    let recognizedAmount = 0
    let pendingAmount = 0
    let periodLabel = '—'
    let tone = 'awaiting'
    let label = 'Chờ thanh toán'
    let sub = ''

    if (paid) {
      recognizedAmount = feeAmount
      tone = 'completed'
      label = 'Đã hoàn tất'
      periodLabel = parseIssuePeriod(row.issueDate, row.duration) || `${row.duration} (Kỳ hiện tại)`
    } else {
      pendingAmount = feeAmount
      tone = 'awaiting'
      label = 'Chờ thanh toán'
      sub = appStatus.label
    }

    return {
      id: row.id,
      unit: row.unit,
      taxCode: row.taxCode,
      facility: row.facility,
      type: row.type,
      feeAmount,
      recognizedAmount,
      pendingAmount,
      periodLabel,
      status: { tone, label, sub },
    }
  })
}

export const revenueRows = buildRevenueRows()

export function formatVND(amount) {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ`
}

export function formatVNDShort(amount) {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`
}
