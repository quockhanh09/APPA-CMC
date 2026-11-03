import { addMonths, calculateStatus, EXPIRING_WARNING_DAYS, parseDuration } from '../utils/statusCalculator'

// Số ngày chờ khách thanh toán kể từ lúc hồ sơ được duyệt trước khi bị xem là quá hạn đóng
const PAYMENT_DUE_DAYS = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseAmount(feeText) {
  return Number(String(feeText).replace(/\D/g, '')) || 0
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function parseIssuePeriod(issueDate, duration) {
  if (!issueDate) return null
  const date = new Date(issueDate)
  if (Number.isNaN(date.getTime())) return null
  return `${duration} (T${date.getMonth() + 1}/${date.getFullYear()})`
}

function licenseExpiryDate(issueDate, duration) {
  const issue = new Date(issueDate)
  if (Number.isNaN(issue.getTime())) return null
  return addMonths(issue, parseDuration(duration))
}

// Chuyển tiến trình xử lý hồ sơ (bên BẢNG QUẢN LÝ HỒ SƠ ĐĂNG KÝ) thành trạng thái thanh toán
function buildRevenueRow(row) {
  const feeAmount = parseAmount(row.fee)
  const workflow = row.workflow
  const paid = workflow ? Boolean(workflow.payment?.confirmed) : Boolean(row.paid)
  const paidAt = workflow?.payment?.confirmedAt || row.issueDate
  const reviewAtRaw = workflow?.review?.at ? new Date(workflow.review.at) : null
  const reviewAt = reviewAtRaw && !Number.isNaN(reviewAtRaw.getTime()) ? reviewAtRaw : null

  const appStatus = calculateStatus({
    issueDate: paidAt,
    paid,
    duration: row.duration,
    reviewStatus: workflow?.review?.status,
    forcedTone: workflow?.review?.forcedTone,
  })

  let recognizedAmount = 0
  let pendingAmount = 0
  let periodLabel = '—'
  let tone = 'awaiting'
  let label = 'Chờ thanh toán'
  let sub = ''

  if (appStatus.tone === 'rejected') {
    // hồ sơ bị từ chối: không còn khoản phí phải thu
    tone = 'revoked'
    label = appStatus.label
  } else if (paid) {
    // đã thu tiền: trạng thái thanh toán suy ra từ thời hạn giấy phép thực tế
    recognizedAmount = feeAmount
    periodLabel = parseIssuePeriod(paidAt, row.duration) || `${row.duration} (Kỳ hiện tại)`
    const expiry = licenseExpiryDate(paidAt, row.duration)
    const daysLeft = expiry ? daysBetween(new Date(), expiry) : null
    if (daysLeft !== null && daysLeft < 0) {
      tone = 'revoked'
      label = 'Hết hạn'
      sub = `Quá hạn ${-daysLeft} ngày`
    } else if (daysLeft !== null && daysLeft <= EXPIRING_WARNING_DAYS) {
      tone = 'expiring'
      label = 'Sắp hết hạn'
      sub = `Còn ${daysLeft} ngày đến hạn`
    } else {
      tone = 'completed'
      label = 'Đã hoàn tất'
    }
  } else if (appStatus.tone === 'expired') {
    // đã gửi đề nghị thanh toán cho hồ sơ quá hạn nhưng khách chưa đóng
    pendingAmount = feeAmount
    tone = 'overdue'
    label = 'Quá hạn đóng'
  } else if (appStatus.tone === 'pending') {
    // hồ sơ đã duyệt, đang chờ khách thanh toán
    pendingAmount = feeAmount
    const daysWaiting = reviewAt ? daysBetween(reviewAt, new Date()) : 0
    if (daysWaiting > PAYMENT_DUE_DAYS) {
      tone = 'overdue'
      label = 'Quá hạn đóng'
      sub = `Quá hạn đóng ${daysWaiting - PAYMENT_DUE_DAYS} ngày`
    } else {
      tone = 'awaiting'
      label = 'Chờ thanh toán'
      sub = `Còn ${PAYMENT_DUE_DAYS - daysWaiting} ngày`
    }
  } else {
    // hồ sơ mới đăng ký / đang yêu cầu sửa: chưa tới bước thanh toán
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
}

// Doanh thu luôn được suy ra từ danh sách hồ sơ đăng ký lấy từ máy chủ
export function buildRevenueRows(applications = []) {
  return applications.map(buildRevenueRow)
}

export function formatVND(amount) {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} VNĐ`
}

export function formatVNDShort(amount) {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`
}
