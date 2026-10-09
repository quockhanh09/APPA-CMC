import { applications } from './applications'

// Chu kỳ 5 trạng thái thanh toán lặp lại trên danh sách đơn, phỏng theo thiết kế mẫu
const PAYMENT_CYCLE = ['awaiting', 'overdue', 'completed', 'expiring', 'revoked']

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
  return applications.map((row, index) => {
    const tone = PAYMENT_CYCLE[index % PAYMENT_CYCLE.length]
    const feeAmount = parseAmount(row.fee)
    // ngày lệch hạn được suy ra có quy luật từ vị trí dòng để demo dữ liệu ổn định
    const daysLeft = 3 + (index % 10)
    const daysOverdue = 5 + ((index * 3) % 20)
    const daysToRenew = 1 + (index % 7)
    const daysRevoked = 15 + ((index * 5) % 40)

    let recognizedAmount = 0
    let pendingAmount = 0
    let periodLabel = '—'
    let status = { tone, label: '', sub: '' }

    switch (tone) {
      case 'completed':
        recognizedAmount = feeAmount
        periodLabel = parseIssuePeriod(row.issueDate, row.duration) || `${row.duration} (Kỳ hiện tại)`
        status = { tone, label: 'Đã hoàn tất', sub: '' }
        break
      case 'overdue':
        pendingAmount = feeAmount
        status = { tone, label: 'Quá hạn đóng', sub: `Quá hạn đóng ${daysOverdue} ngày` }
        break
      case 'expiring':
        pendingAmount = feeAmount
        periodLabel = `${row.duration} (Kỳ cũ)`
        status = { tone, label: 'Sắp hết hạn', sub: `Còn ${daysToRenew} ngày đến hạn` }
        break
      case 'revoked':
        pendingAmount = feeAmount
        status = { tone, label: 'Thu hồi giấy phép', sub: `Quá hạn ${daysRevoked} ngày` }
        break
      case 'awaiting':
      default:
        pendingAmount = feeAmount
        status = { tone: 'awaiting', label: 'Chờ thanh toán', sub: `Còn ${daysLeft} ngày` }
        break
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
      status,
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
