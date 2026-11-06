import ServiceRegistrationsView, { formatDateTime, formatFee, StatusPill } from './ServiceRegistrationsView'
import { fetchCopyRegistrations, updateCopyRegistrationStatus } from '../api'

const typeOptions = [
  { value: 'movie', label: 'Phim điện ảnh' },
  { value: 'tvc', label: 'Quảng cáo TVC' },
  { value: 'album', label: 'Album biên tập' },
  { value: 'arcade', label: 'Máy chơi game Arcade' },
  { value: 'mv_audiovisual', label: 'Video ca nhạc và các tác phẩm nghe nhìn' },
]

const columns = [
  { key: 'stt', label: 'STT', render: (row, index) => index + 1 },
  { key: 'id', label: 'MÃ ĐƠN', className: 'cell-strong', render: (row) => row.id },
  {
    key: 'unit',
    label: 'ĐƠN VỊ ĐĂNG KÝ / MST',
    render: (row) => (
      <div className="unit-cell">
        <span className="unit-name">{row.orgNameVN}</span>
        <span className="unit-tax">{row.taxCode}</span>
      </div>
    ),
  },
  { key: 'type', label: 'LOẠI HÌNH SAO CHÉP', render: (row) => row.copyTypeLabel || row.copyType },
  { key: 'content', label: 'NỘI DUNG ĐĂNG KÝ', render: (row) => row.contentTitle || row.usageModel || '—' },
  { key: 'records', label: 'SỐ BẢN GHI', render: (row) => row.recordsCount },
  { key: 'status', label: 'TRẠNG THÁI', render: (row) => <StatusPill status={row.status} /> },
  { key: 'createdAt', label: 'NGÀY ĐĂNG KÝ', render: (row) => formatDateTime(row.createdAt) },
]

function buildDetailSections(row) {
  return [
    {
      title: 'THÔNG TIN ĐƠN VỊ ĐĂNG KÝ',
      fields: [
        { label: 'Tên đơn vị (tiếng Việt)', value: row.orgNameVN },
        { label: 'Tên đơn vị (tiếng Anh)', value: row.orgNameEN },
        { label: 'MST', value: row.taxCode },
        { label: 'Địa chỉ trụ sở', value: row.orgAddress },
        { label: 'Người đại diện pháp luật', value: row.legalRepresentative },
        { label: 'Người phụ trách', value: row.inChargePerson },
        { label: 'Số điện thoại', value: row.phone },
        { label: 'Email', value: row.email },
        { label: 'Email nhận hóa đơn', value: row.invoiceEmail },
      ],
    },
    {
      title: 'CHI TIẾT NỘI DUNG ĐĂNG KÝ',
      fields: [
        { label: 'Loại hình sao chép', value: row.copyTypeLabel },
        { label: 'Tên nội dung', value: row.contentTitle },
        { label: 'Chi tiết', value: row.contentDetail },
        { label: 'Mô hình / mục đích sử dụng', value: row.usageModel },
        { label: 'Định dạng sản xuất', value: row.productionFormat },
        { label: 'Giá xuất xưởng', value: formatFee(row.factoryPrice) },
        { label: 'Số lượng', value: row.quantity },
      ],
    },
    {
      title: 'THÔNG TIN KHÁC',
      fields: [
        { label: 'Số bản ghi đăng ký sử dụng', value: row.recordsCount },
        { label: 'Tệp đính kèm', value: row.fileName },
        { label: 'Ngày đăng ký', value: formatDateTime(row.createdAt) },
      ],
    },
  ]
}

function buildDetailList(row) {
  if (!Array.isArray(row.records) || row.records.length === 0) return null
  return {
    title: 'DANH SÁCH CÁC BẢN GHI ĐĂNG KÝ SỬ DỤNG',
    columns: ['STT', 'TÊN BÀI HÁT', 'TÊN ALBUM', 'NGHỆ SĨ BIỂU DIỄN', 'LINK BẢN GHI'],
    rows: row.records.map((record, index) => [
      index + 1,
      record.songTitle,
      record.albumTitle,
      record.performer,
      record.recordLink,
    ]),
  }
}

export default function CopyRegistrationsView({ canEdit = false }) {
  return (
    <ServiceRegistrationsView
      title="QUẢN LÝ ĐĂNG KÝ SAO CHÉP"
      subtitle="Theo dõi và xử lý các đơn đăng ký sao chép gửi về từ trang đăng ký trực tuyến"
      fetchRegistrations={fetchCopyRegistrations}
      updateRegistrationStatus={updateCopyRegistrationStatus}
      columns={columns}
      typeOptions={typeOptions}
      typeFilterKey="copyType"
      getSearchText={(row) =>
        `${row.id} ${row.orgNameVN} ${row.orgNameEN} ${row.taxCode} ${row.contentTitle} ${row.email} ${row.phone}`
      }
      buildDetailSections={buildDetailSections}
      buildDetailList={buildDetailList}
      canEdit={canEdit}
    />
  )
}
