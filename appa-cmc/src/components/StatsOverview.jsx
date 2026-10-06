import { calculateStatus, STATUS_LABELS } from '../utils/statusCalculator'

const statusColors = {
  new: 'var(--yellow)',
  pending: 'var(--blue)',
  licensed: 'var(--green)',
  expiring: 'var(--orange)',
  expired: 'var(--red)',
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

export default function StatsOverview({ applications = [] }) {
  const statusCounts = applications.reduce((counts, application) => {
    const workflow = application.workflow
    const status = calculateStatus({
      issueDate: workflow?.payment?.confirmedAt || application.issueDate,
      paid: workflow?.payment?.confirmed ?? application.paid,
      duration: application.duration,
      reviewStatus: workflow?.review?.status,
      forcedTone: workflow?.review?.forcedTone,
    })
    counts[status.tone] = (counts[status.tone] || 0) + 1
    return counts
  }, {})
  const stats = [
    { key: 'all', label: 'Tất cả', value: applications.length, color: 'var(--purple)' },
    ...Object.keys(statusColors).map((key) => ({
      key,
      label: STATUS_LABELS[key],
      value: statusCounts[key] || 0,
      color: statusColors[key],
    })),
  ]
  const total = applications.length
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
