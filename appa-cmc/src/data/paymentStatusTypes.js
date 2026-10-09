// Màu sắc hiển thị cho các trạng thái thanh toán ở bảng Doanh thu thu phí
export const PAYMENT_STATUS_LABELS = {
  awaiting: 'Chờ thanh toán',
  overdue: 'Quá hạn đóng',
  completed: 'Đã hoàn tất',
  expiring: 'Sắp hết hạn',
  revoked: 'Thu hồi giấy phép',
}

export const paymentStatusTypes = {
  awaiting: { bg: '#F6F0B2', dot: '#EAB308', border: '#EAB308', text: '#8A6D1B' },
  overdue: { bg: '#FFD0D1', dot: '#FF383C', border: '#FF383C', text: '#C62828' },
  completed: { bg: '#C9E5CA', dot: '#388E3B', border: '#388E3B', text: '#2E7D32' },
  expiring: { bg: '#FFE3C2', dot: '#FB923C', border: '#FB923C', text: '#C2630B' },
  revoked: { bg: '#E7E7EC', dot: '#6B7280', border: '#9CA3AF', text: '#4B5563' },
}
