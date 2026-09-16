import { stats } from '../data/applications'

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

export default function StatsOverview() {
  const total = stats.find((s) => s.key === 'all')?.value ?? 0
  const sliceData = stats.filter((s) => s.key !== 'all')

  return (
    <section className="stats-overview">
      <DonutChart data={sliceData} total={total} />
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
