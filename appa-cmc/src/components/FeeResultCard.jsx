const baseSalary = 2_530_000

const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(Math.round(value))} ₫`

const formatNumber = (value, fractionDigits = 4) =>
  new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value)

function FeeResultCard({ feeResult }) {
  return (
    <section className="fee-result-stack" aria-live="polite">
      <article className="fee-summary-card">
        <div className="fee-summary-body">
          <div className="fee-hero">
            <p>Phí bản quyền năm (theo NĐ 17/2023)</p>
            <div className="fee-hero-sub">
              <span>Số tiền gốc: {formatVnd(feeResult.baseAmount)}</span><br />
              <span>Khu vực áp dụng: {feeResult.region?.label} (k = hệ số theo đô thị: {formatNumber(feeResult.region?.multiplier ?? 1, 2)})</span><br />
              <span>Phí bản quyền trước thuế: {formatVnd(feeResult.annualFee)}</span><br />
              <span>Thuế GTGT (8%): {formatVnd(feeResult.vat)}</span><br />
              <span className="fee-total-final">Tổng chi phí thanh toán: {formatVnd(feeResult.totalWithVat)}</span>
            </div>
          </div>

          <div className="fee-detail-card">
            {feeResult.capMultiplier ? (
              <>
                <h4>
                  Mức trần phí tối đa/năm: {feeResult.capMultiplier} x {formatNumber(baseSalary, 0)} ={' '}
                  <span style={{ color: '#ffea00' }}>
                    {formatVnd(feeResult.capMultiplier * baseSalary)}
                  </span>
                </h4>
                {feeResult.rawTotalA >= feeResult.capMultiplier && (
                  <p style={{ marginTop: '4px', fontSize: '13px', color: '#ff6b6b', fontWeight: 'bold' }}>
                    ⚠️ Cơ sở kinh doanh đã chạm mức bản quyền tối đa trong năm!
                  </p>
                )}
              </>
            ) : (
              <h4>Chi tiết tính toán phí bản quyền</h4>
            )}
          </div>

          <div className="fee-table-card">
            <table>
              <thead>
                <tr>
                  <th>HẠNG MỤC / BẬC</th>
                  <th>DIỆN TÍCH / SL</th>
                  <th>CÔNG THỨC TÍNH</th>
                  <th>THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody>
                {feeResult.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.label}</strong> <br /><small style={{ opacity: 0.7 }}>{row.range}</small></td>
                    <td>{formatNumber(row.quantity, 0)} {row.unit}</td>
                    <td>{row.formulaText}</td>
                    <td><strong>{formatVnd(row.contribution * baseSalary * (feeResult.region?.multiplier ?? 1))}</strong></td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3}>Tổng cộng (Chưa thuế VAT)</td>
                  <td><strong>{formatVnd(feeResult.annualFee)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  )
}

export default FeeResultCard
