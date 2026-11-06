export const SERVICE_STATUS_LABELS = {
  new: 'Mới đăng ký',
  processing: 'Đang xử lý',
  licensed: 'Đã cấp phép',
  rejected: 'Từ chối',
}

const statusColors = {
  new: 'var(--yellow)',
  processing: 'var(--blue)',
  licensed: 'var(--green)',
  rejected: 'var(--red)',
}

function DonutChart({ data, total }) {
  let cursor = 0
  const stops = data
    .map((item) => {
      const start = (cursor / total) * 360
      cursor += item.value
      const end = (cursor / total) * 360
      return `${item.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
      <div className="donut-hole">
        <span className="donut-label">Tổng số</span>
        <span className="donut-value">{total}</span>
      </div>
    </div>
  )
}

export default function ServiceRegistrationsStats({ registrations = [] }) {
  const statusCounts = registrations.reduce((counts, registration) => {
    const status = registration.status || 'new'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})
  const stats = [
    { key: 'all', label: 'Tất cả', value: registrations.length, color: 'var(--purple)' },
    ...Object.keys(statusColors).map((key) => ({
      key,
      label: SERVICE_STATUS_LABELS[key],
      value: statusCounts[key] || 0,
      color: statusColors[key],
    })),
  ]
  const total = registrations.length
  const sliceData = stats.filter((stat) => stat.key !== 'all')

  return (
    <section className="stats-overview">
      <DonutChart data={sliceData} total={total || 1} />
      <div className="stats-cards">
        {stats.map((item) => (
          <div key={item.key} className="stat-card" style={{ '--stat-color': item.color }}>
            <span className="stat-label">{item.label}</span>
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
