export const STATUS_LABELS = {
  new: 'Mới đăng ký',
  pending: 'Chờ thanh toán',
  licensed: 'Đã cấp phép',
  expiring: 'Sắp hết hạn',
  expired: 'Quá hạn',
  edit_requested: 'Yêu cầu sửa hồ sơ',
  rejected: 'Đã từ chối hồ sơ',
}

const EXPIRING_WARNING_DAYS = 30

function formatISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addMonths(date, months) {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() + months)
  if (result.getDate() < day) {
    result.setDate(0)
  }
  return result
}

function differenceInDays(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((a - b) / msPerDay)
}

export function parseDuration(duration) {
  const match = String(duration).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export function calculateStatus({ issueDate = null, paid = false, duration = '', reviewStatus } = {}) {
  // hành động (review) quyết định trạng thái khi hồ sơ chưa được duyệt & thanh toán xong
  const effectiveReviewStatus = reviewStatus || (issueDate ? 'approved' : 'pending')

  if (effectiveReviewStatus === 'rejected') {
    return { label: STATUS_LABELS.rejected, tone: 'rejected' }
  }
  if (effectiveReviewStatus === 'edit_requested') {
    return { label: STATUS_LABELS.edit_requested, tone: 'edit_requested' }
  }
  if (effectiveReviewStatus === 'pending') {
    return { label: STATUS_LABELS.new, tone: 'new' }
  }
  if (!paid) {
    return { label: STATUS_LABELS.pending, tone: 'pending' }
  }
  // đã duyệt & đã thanh toán: trạng thái còn lại phụ thuộc thời hạn cấp phép
  const issue = new Date(issueDate)
  if (Number.isNaN(issue.getTime())) {
    return { label: STATUS_LABELS.new, tone: 'new' }
  }
  const months = parseDuration(duration)
  const expiry = addMonths(issue, months)
  const today = new Date()
  const diffDays = differenceInDays(today, expiry)
  if (diffDays < 0) {
    return { label: STATUS_LABELS.expired, tone: 'expired' }
  }
  if (diffDays <= EXPIRING_WARNING_DAYS) {
    return { label: STATUS_LABELS.expiring, tone: 'expiring' }
  }
  return { label: STATUS_LABELS.licensed, tone: 'licensed' }
}

export function issueDataFor(tone, duration) {
  const today = new Date()
  const months = parseDuration(duration)
  const iso = (d) => formatISO(d)
  switch (tone) {
    case 'new':
    case 'select':
      return { issueDate: null, paid: false }
    case 'pending':
      return { issueDate: iso(addMonths(today, -2)), paid: false }
    case 'licensed':
      return { issueDate: iso(addMonths(today, -Math.max(Math.floor(months / 2), 1))), paid: true }
    case 'expiring':
      return { issueDate: iso(addMonths(today, -(months - 1))), paid: true }
    case 'expired':
      return { issueDate: iso(addMonths(today, -(months + 6))), paid: true }
    default:
      return { issueDate: iso(addMonths(today, -6)), paid: true }
  }
}
