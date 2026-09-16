// 10 business types x 10 pages = 100 mock applications, one of each type per page.
const BUSINESS_TYPE_ORDER = [
  'coffee',
  'restaurant',
  'store',
  'gym',
  'karaokeRoom',
  'bar',
  'karaokeBox',
  'hotel',
  'supermarket',
  'mall',
]

const BASE_FEE = {
  coffee: 3500000,
  restaurant: 3500000,
  store: 4200000,
  gym: 8500000,
  karaokeRoom: 12000000,
  bar: 15000000,
  karaokeBox: 2400000,
  hotel: 9600000,
  supermarket: 6000000,
  mall: 18000000,
}

const DURATIONS = ['6 tháng', '12 tháng', '24 tháng', '36 tháng']

const STATUS_LABELS = {
  new: 'Mới đăng ký',
  pending: 'Chờ thanh toán',
  licensed: 'Đã cấp phép',
  expiring: 'Sắp hết hạn',
  expired: 'Quá hạn',
  select: 'Chọn tình trạng hồ sơ',
}

// One tone per row, rotated per page so each page shows a different mix.
const STATUS_SEQUENCE = ['new', 'select', 'licensed', 'pending', 'expiring', 'expired', 'select', 'expired', 'licensed', 'new']

const ACTION_BY_TONE = {
  new: { kind: 'button', label: 'Xử lý', tone: 'process' },
  pending: { kind: 'button', label: 'Duyệt UNC', tone: 'approve' },
  licensed: { kind: 'eye' },
  expiring: { kind: 'button', label: 'Xử lý', tone: 'process' },
  expired: { kind: 'info' },
  select: { kind: 'button', label: 'Chờ xử lý', tone: 'pending' },
}

// 10 real-world-style companies per business type, one used on each of the 10 pages.
const COMPANY_DATA = {
  coffee: [
    { unit: 'Highlands Coffee', taxCode: '0309985814', facility: 'Highlands Coffee 287 Âu Cơ' },
    { unit: 'The Coffee House', taxCode: '0310112233', facility: 'The Coffee House Nguyễn Huệ' },
    { unit: 'Trung Nguyên Legend', taxCode: '0300456789', facility: 'Trung Nguyên Legend Café Đồng Khởi' },
    { unit: 'Phúc Long Coffee & Tea', taxCode: '0311224455', facility: 'Phúc Long Lê Văn Sỹ' },
    { unit: 'Cộng Cà Phê', taxCode: '0312335566', facility: 'Cộng Cà Phê Hai Bà Trưng' },
    { unit: 'Starbucks Việt Nam', taxCode: '0313446677', facility: 'Starbucks Reserve Hàn Thuyên' },
    { unit: 'Ông Bầu Coffee', taxCode: '0314557788', facility: 'Ông Bầu Coffee Tân Bình' },
    { unit: 'Milano Coffee', taxCode: '0315668899', facility: 'Milano Coffee Gò Vấp' },
    { unit: 'Napoli Coffee', taxCode: '0316779900', facility: 'Napoli Coffee Bình Thạnh' },
    { unit: 'Katinat Saigon Kafe', taxCode: '0317880011', facility: 'Katinat Nguyễn Đình Chiểu' },
  ],
  restaurant: [
    { unit: 'Công ty TNHH Nhà hàng Hương Việt', taxCode: '0102165360', facility: 'Nhà hàng Hương Việt Trần Hưng Đạo' },
    { unit: 'Nhà hàng Sen Tây Hồ', taxCode: '0103276471', facility: 'Sen Tây Hồ Quảng An' },
    { unit: 'Golden Gate Restaurant', taxCode: '0104387582', facility: 'Kichi Kichi Vincom Đồng Khởi' },
    { unit: 'Nhà hàng Ngon', taxCode: '0105498693', facility: 'Quán Ăn Ngon Pasteur' },
    { unit: 'Sushi Tei Việt Nam', taxCode: '0106509704', facility: 'Sushi Tei Union Square' },
    { unit: 'Nhà hàng Ashima', taxCode: '0107610815', facility: 'Ashima Buffet Landmark 81' },
    { unit: 'Redsun ITI', taxCode: '0108721926', facility: 'King BBQ Aeon Mall' },
    { unit: 'Nhà hàng Blue Ginger', taxCode: '0109832037', facility: 'Blue Ginger Restaurant Hai Bà Trưng' },
    { unit: 'Trung tâm Hội nghị Adora', taxCode: '0110943148', facility: 'Adora Center Phú Nhuận' },
    { unit: 'Nhà hàng Tiệc cưới Riverside', taxCode: '0111054259', facility: 'Riverside Palace Tân Cảng' },
  ],
  store: [
    { unit: 'Công ty Cổ phần Bán lẻ An Phước', taxCode: '0304829102', facility: 'Showroom An Phước Nguyễn Trãi' },
    { unit: 'Thế Giới Di Động', taxCode: '0305930213', facility: 'TGDĐ Cộng Hòa' },
    { unit: 'FPT Retail', taxCode: '0306041324', facility: 'FPT Shop Lê Văn Việt' },
    { unit: 'Điện Máy Xanh', taxCode: '0307152435', facility: 'Điện Máy Xanh Phan Văn Trị' },
    { unit: 'CellphoneS', taxCode: '0308263546', facility: 'CellphoneS Nguyễn Oanh' },
    { unit: 'Canifa', taxCode: '0309374657', facility: 'Canifa Vincom Bà Triệu' },
    { unit: 'Việt Tiến', taxCode: '0310485768', facility: 'Cửa hàng Việt Tiến Hoàng Văn Thụ' },
    { unit: 'Uniqlo Việt Nam', taxCode: '0311596879', facility: 'Uniqlo Vincom Center' },
    { unit: 'Routine', taxCode: '0312607980', facility: 'Routine Nguyễn Trãi' },
    { unit: 'Guardian', taxCode: '0313719091', facility: 'Guardian Aeon Tân Phú' },
  ],
  gym: [
    { unit: 'Công ty TNHH California Fitness', taxCode: '0305578912', facility: 'California Fitness & Yoga Landmark 81' },
    { unit: 'Elite Fitness', taxCode: '0306689023', facility: 'Elite Fitness Sala' },
    { unit: 'CITIGYM', taxCode: '0307790134', facility: 'CITIGYM Phú Mỹ Hưng' },
    { unit: 'Getfit Gym', taxCode: '0308801245', facility: 'Getfit Gym Tân Bình' },
    { unit: 'Fit24', taxCode: '0309912356', facility: 'Fit24 Nguyễn Văn Linh' },
    { unit: 'The New Gym', taxCode: '0310023467', facility: 'The New Gym Bình Thạnh' },
    { unit: "L'Apogee Spa", taxCode: '0311134578', facility: "L'Apogee Spa Thảo Điền" },
    { unit: 'Serenity Spa', taxCode: '0312245689', facility: 'Serenity Spa Quận 3' },
    { unit: 'Amaya Spa', taxCode: '0313356790', facility: 'Amaya Spa Phú Nhuận' },
    { unit: 'Sky Fitness Center', taxCode: '0314467801', facility: 'Sky Fitness Quận 7' },
  ],
  karaokeRoom: [
    { unit: 'Dịch vụ Giải trí ICOOL', taxCode: '0313456789', facility: 'Karaoke ICOOL Phan Xích Long' },
    { unit: 'Karaoke MTV', taxCode: '0314567890', facility: 'MTV Nguyễn Trãi' },
    { unit: 'Karaoke Nnice', taxCode: '0315678901', facility: 'Nnice Cộng Hòa' },
    { unit: 'Karaoke Việt Music', taxCode: '0316789012', facility: 'Việt Music Lê Đại Hành' },
    { unit: 'Karaoke Idol', taxCode: '0317890123', facility: 'Idol Karaoke Tân Phú' },
    { unit: 'Karaoke Starlight', taxCode: '0318901234', facility: 'Starlight Bình Thạnh' },
    { unit: 'Karaoke Bò Húc', taxCode: '0319012345', facility: 'Bò Húc Phú Nhuận' },
    { unit: 'Karaoke Number One', taxCode: '0320123456', facility: 'Number One Gò Vấp' },
    { unit: 'Karaoke Thiên Thai', taxCode: '0321234567', facility: 'Thiên Thai Quận 5' },
    { unit: 'Karaoke Hoàng Yến', taxCode: '0322345678', facility: 'Hoàng Yến Quận 10' },
  ],
  bar: [
    { unit: 'Công ty TNHH Nightlife Saigon', taxCode: '0316901234', facility: 'Lush Bar Lý Tự Trọng' },
    { unit: 'Chill Skybar', taxCode: '0317012345', facility: 'Chill Skybar AB Tower' },
    { unit: 'Air 360', taxCode: '0318123456', facility: 'Air 360 Sky Bar' },
    { unit: 'Glow Skybar', taxCode: '0319234567', facility: 'Glow Skybar Bùi Viện' },
    { unit: 'Republic Club', taxCode: '0320345678', facility: 'Republic Club Quận 1' },
    { unit: 'Envy Club', taxCode: '0321456789', facility: 'Envy Club Nguyễn Huệ' },
    { unit: 'Level 23', taxCode: '0322567890', facility: 'Level 23 Melia' },
    { unit: 'Bang Bar', taxCode: '0323678901', facility: 'Bang Bar Bùi Viện' },
    { unit: 'Alibi Rooftop', taxCode: '0324789012', facility: 'Alibi Rooftop Quận 1' },
    { unit: 'Ren Club', taxCode: '0325890123', facility: 'Ren Club Quận 1' },
  ],
  karaokeBox: [
    { unit: 'Hộ kinh doanh K-Box Mini', taxCode: '8492019283', facility: 'Mini Box Karaoke Vạn Hạnh Mall' },
    { unit: 'Karaoke Box 88', taxCode: '8492019284', facility: 'Box 88 Tân Bình' },
    { unit: 'Karaoke Hộp Nhạc', taxCode: '8492019285', facility: 'Hộp Nhạc Gò Vấp' },
    { unit: 'Karaoke Music Box', taxCode: '8492019286', facility: 'Music Box Phú Nhuận' },
    { unit: 'Karaoke Sing Sing', taxCode: '8492019287', facility: 'Sing Sing Bình Tân' },
    { unit: 'Karaoke Vip Box', taxCode: '8492019288', facility: 'Vip Box Quận 5' },
    { unit: 'Karaoke Song Ca', taxCode: '8492019289', facility: 'Song Ca Quận 8' },
    { unit: 'Karaoke Nốt Nhạc', taxCode: '8492019290', facility: 'Nốt Nhạc Thủ Đức' },
    { unit: 'Karaoke Family Box', taxCode: '8492019291', facility: 'Family Box Quận 12' },
    { unit: 'Karaoke Hộp Đêm', taxCode: '8492019292', facility: 'Hộp Đêm Bình Chánh' },
  ],
  hotel: [
    { unit: 'Công ty CP Du lịch Mường Mây', taxCode: '0109876543', facility: 'Mường Mây Hotel & Spa Đà Lạt' },
    { unit: 'Vinpearl Resort', taxCode: '0110987654', facility: 'Vinpearl Resort Nha Trang' },
    { unit: 'Mường Thanh Hotel', taxCode: '0111098765', facility: 'Mường Thanh Grand Sài Gòn' },
    { unit: 'InterContinental', taxCode: '0112109876', facility: 'InterContinental Saigon' },
    { unit: 'Sheraton Saigon', taxCode: '0113210987', facility: 'Sheraton Saigon Hotel & Towers' },
    { unit: 'Rex Hotel Saigon', taxCode: '0114321098', facility: 'Rex Hotel Nguyễn Huệ' },
    { unit: 'Caravelle Saigon', taxCode: '0115432109', facility: 'Caravelle Hotel Lam Sơn' },
    { unit: 'Fusion Suites', taxCode: '0116543210', facility: 'Fusion Suites Vũng Tàu' },
    { unit: 'Furama Resort', taxCode: '0117654321', facility: 'Furama Resort Đà Nẵng' },
    { unit: 'Anantara Villas', taxCode: '0118765432', facility: 'Anantara Villas Mũi Né' },
  ],
  supermarket: [
    { unit: 'Hệ thống Siêu thị WinMart+', taxCode: '0104918273', facility: 'Siêu thị WinMart+ Thảo Điền' },
    { unit: 'Co.opmart', taxCode: '0105029384', facility: 'Co.opmart Nguyễn Đình Chiểu' },
    { unit: 'Big C / GO!', taxCode: '0106130495', facility: 'GO! An Lạc' },
    { unit: 'Aeon Mall', taxCode: '0107241506', facility: 'Aeon Citimart Tân Phú' },
    { unit: 'Bách Hóa Xanh', taxCode: '0108352617', facility: 'Bách Hóa Xanh Gò Vấp' },
    { unit: 'Lotte Mart', taxCode: '0109463728', facility: 'Lotte Mart Quận 7' },
    { unit: 'MM Mega Market', taxCode: '0110574839', facility: 'MM Mega Market Bình Phú' },
    { unit: 'Satra Mart', taxCode: '0111685940', facility: 'Satra Mart Củ Chi' },
    { unit: 'Emart Việt Nam', taxCode: '0112796051', facility: 'Emart Gò Vấp' },
    { unit: 'VinMart', taxCode: '0113807162', facility: 'VinMart Lê Văn Việt' },
  ],
  mall: [
    { unit: 'Tập đoàn Geleximco', taxCode: '0101482910', facility: 'Tòa nhà Geleximco Tower Hoàng Cầu' },
    { unit: 'Bitexco Financial', taxCode: '0102593021', facility: 'Bitexco Financial Tower' },
    { unit: 'Saigon Centre', taxCode: '0103604132', facility: 'Saigon Centre Tower' },
    { unit: 'Diamond Plaza', taxCode: '0104715243', facility: 'Diamond Plaza Lê Duẩn' },
    { unit: 'Vincom Center', taxCode: '0105826354', facility: 'Vincom Center Đồng Khởi' },
    { unit: 'Landmark 81 Office', taxCode: '0106937465', facility: 'Landmark 81 Office Tower' },
    { unit: 'Bitexco Office', taxCode: '0107048576', facility: 'Bitexco Office Quận 1' },
    { unit: 'Kumho Asiana Plaza', taxCode: '0108159687', facility: 'Kumho Asiana Plaza Quận 1' },
    { unit: 'Times Square', taxCode: '0109260798', facility: 'Times Square Đồng Khởi' },
    { unit: 'The Nexus Tower', taxCode: '0110371809', facility: 'The Nexus Tower Quận 3' },
  ],
}

function formatFee(amount) {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`
}

function buildApplications() {
  const rows = []
  const pageCount = 10

  for (let page = 0; page < pageCount; page += 1) {
    BUSINESS_TYPE_ORDER.forEach((type, typeIndex) => {
      const company = COMPANY_DATA[type][page]
      const tone = STATUS_SEQUENCE[(typeIndex + page) % STATUS_SEQUENCE.length]
      const duration = DURATIONS[(typeIndex + page) % DURATIONS.length]
      const fee = BASE_FEE[type] + page * 200000
      const orderNumber = page * BUSINESS_TYPE_ORDER.length + typeIndex + 1

      rows.push({
        id: `#APPA_CMC_${String(orderNumber).padStart(4, '0')}`,
        unit: company.unit,
        taxCode: company.taxCode,
        facility: company.facility,
        type,
        fee: formatFee(fee),
        status: { label: STATUS_LABELS[tone], tone },
        duration,
        action: ACTION_BY_TONE[tone],
      })
    })
  }

  return rows
}

export const applications = buildApplications()

export const stats = [
  { key: 'all', label: 'Tất cả', value: applications.length, color: 'var(--purple)' },
  { key: 'new', label: 'Mới đăng ký', value: 40, color: 'var(--yellow)' },
  { key: 'pending', label: 'Chờ thanh toán', value: 10, color: 'var(--blue)' },
  { key: 'licensed', label: 'Đã cấp phép', value: 30, color: 'var(--green)' },
  { key: 'cancelled', label: 'Hủy', value: 20, color: 'var(--red)' },
]

