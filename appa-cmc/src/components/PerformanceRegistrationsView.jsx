import ServiceRegistrationsView, { formatDateTime, formatFee, StatusPill } from './ServiceRegistrationsView'
import { fetchPerformanceRegistrations, updatePerformanceRegistrationStatus } from '../api'

const typeOptions = [
  { value: 'hotel_4plus', label: 'Khách sạn 4 sao trở lên' },
  { value: 'hotel_3minus', label: 'Khách sạn 3 sao trở xuống' },
  { value: 'tea_room', label: 'Phòng trà / nhà hàng / cà phê / vũ trường' },
  { value: 'concert', label: 'Concert (có sử dụng bản ghi)' },
]

const columns = [
  { key: 'stt', label: 'STT', render: (row, index) => index + 1 },
  { key: 'id', label: 'MÃ ĐƠN', className: 'cell-strong', render: (row) => row.id },
  {
    key: 'unit',
    label: 'ĐƠN VỊ TỔ CHỨC / MST',
    render: (row) => (
      <div className="unit-cell">
        <span className="unit-name">{row.orgName}</span>
        <span className="unit-tax">{row.taxCode}</span>
      </div>
    ),
  },
  { key: 'type', label: 'LOẠI HÌNH BIỂU DIỄN', render: (row) => row.performanceTypeLabel || row.performanceType },
  { key: 'program', label: 'CHƯƠNG TRÌNH', render: (row) => row.programName || '—' },
  { key: 'songs', label: 'SỐ TÁC PHẨM', render: (row) => row.songsCount },
  { key: 'fee', label: 'PHÍ DỰ KIẾN', render: (row) => formatFee(row.feeAmount) },
  { key: 'status', label: 'TRẠNG THÁI', render: (row) => <StatusPill status={row.status} /> },
  { key: 'createdAt', label: 'NGÀY ĐĂNG KÝ', render: (row) => formatDateTime(row.createdAt) },
]

function buildDetailSections(row) {
  return [
    {
      title: 'THÔNG TIN ĐƠN VỊ TỔ CHỨC',
      fields: [
        { label: 'Tên đơn vị tổ chức', value: row.orgName },
        { label: 'MST / Giấy ĐKKD', value: row.taxCode },
        { label: 'Địa chỉ trụ sở', value: row.orgAddress },
        { label: 'Người đại diện', value: row.representative },
        { label: 'Người đại diện pháp luật', value: row.legalRepresentative },
        { label: 'Số điện thoại', value: row.phone },
        { label: 'Email', value: row.email },
      ],
    },
    {
      title: 'THÔNG TIN CHƯƠNG TRÌNH BIỂU DIỄN',
      fields: [
        { label: 'Loại hình biểu diễn', value: row.performanceTypeLabel },
        { label: 'Hình thức', value: row.ticketMode === 'paid' ? 'Có bán vé' : 'Không bán vé' },
        { label: 'Tên chương trình', value: row.programName },
        { label: 'Thời gian tổ chức', value: row.programTime },
        { label: 'Địa điểm tổ chức', value: row.programAddress },
        { label: 'Sức chứa / khán giả dự kiến', value: row.venueCapacity },
        { label: 'Bình quân giá vé', value: formatFee(row.avgTicketPrice) },
      ],
    },
    {
      title: 'THÔNG TIN NGƯỜI LIÊN HỆ',
      fields: [
        { label: 'Họ tên người liên hệ', value: row.contactName },
        { label: 'Chức vụ', value: row.contactPosition },
        { label: 'Số điện thoại', value: row.contactPhone },
        { label: 'Email', value: row.contactEmail },
        { label: 'Địa chỉ liên hệ', value: row.contactAddress },
      ],
    },
    {
      title: 'THÔNG TIN KHÁC',
      fields: [
        { label: 'Số tác phẩm biểu diễn', value: row.songsCount },
        { label: 'Phí bản quyền dự kiến', value: formatFee(row.feeAmount) },
        { label: 'Tệp đính kèm', value: row.fileName },
        { label: 'Ngày đăng ký', value: formatDateTime(row.createdAt) },
      ],
    },
  ]
}

function buildDetailList(row) {
  if (!Array.isArray(row.songs) || row.songs.length === 0) return null
  return {
    title: 'DANH SÁCH TÁC PHẨM BIỂU DIỄN',
    columns: ['STT', 'TÊN TÁC PHẨM', 'TÁC GIẢ', 'NGHỆ SĨ BIỂU DIỄN', 'LINK BẢN GHI'],
    rows: row.songs.map((song, index) => [
      index + 1,
      song.title,
      song.author,
      song.performer,
      song.link,
    ]),
  }
}

export default function PerformanceRegistrationsView({ canEdit = false }) {
  return (
    <ServiceRegistrationsView
      title="QUẢN LÝ ĐĂNG KÝ TỔ CHỨC BIỂU DIỄN"
      subtitle="Theo dõi và xử lý các đơn đăng ký tổ chức biểu diễn gửi về từ trang đăng ký trực tuyến"
      fetchRegistrations={fetchPerformanceRegistrations}
      updateRegistrationStatus={updatePerformanceRegistrationStatus}
      columns={columns}
      typeOptions={typeOptions}
      typeFilterKey="performanceType"
      getSearchText={(row) =>
        `${row.id} ${row.orgName} ${row.taxCode} ${row.programName} ${row.email} ${row.phone}`
      }
      buildDetailSections={buildDetailSections}
      buildDetailList={buildDetailList}
      canEdit={canEdit}
    />
  )
}
