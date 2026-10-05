import html2pdf from 'html2pdf.js'
import QRCode from 'qrcode'

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

export async function createCertificatePdf({ row, application, verificationUrl, businessType }) {
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 240,
  })
  const issuedAt = application.certificate.issuedAt
    ? new Date(application.certificate.issuedAt).toLocaleDateString('vi-VN')
    : '—'
  const element = document.createElement('div')
  element.style.cssText = 'box-sizing:border-box;width:720px;padding:48px;color:#172033;font-family:Arial,sans-serif;background:#fff'
  element.innerHTML = `
    <div style="border:3px double #4e45e4;padding:38px;text-align:center">
      <div style="color:#4e45e4;font-size:16px;font-weight:700;letter-spacing:2px">APPA CMC</div>
      <div style="margin-top:12px;color:#667085;font-size:12px">HỆ THỐNG QUẢN LÝ CẤP PHÉP</div>
      <h1 style="margin:30px 0 8px;font-size:26px">GIẤY CHỨNG NHẬN CẤP PHÉP</h1>
      <div style="color:#4e45e4;font-weight:700">Mã đơn: ${escapeHtml(row.id)}</div>
      <div style="margin:32px 0;text-align:left;font-size:15px;line-height:1.8">
        <div><b>Đơn vị sử dụng:</b> ${escapeHtml(row.unit)}</div>
        <div><b>Mã số thuế:</b> ${escapeHtml(row.taxCode || '—')}</div>
        <div><b>Cơ sở kinh doanh:</b> ${escapeHtml(row.facility)}</div>
        <div><b>Loại hình kinh doanh:</b> ${escapeHtml(businessType)}</div>
        <div><b>Thời hạn cấp phép:</b> ${escapeHtml(row.duration)}</div>
        <div><b>Ngày cấp:</b> ${escapeHtml(issuedAt)}</div>
      </div>
      <div style="margin:0 auto;width:190px;text-align:center">
        <img src="${qrDataUrl}" alt="QR xác minh giấy phép" style="width:150px;height:150px">
        <div style="font-size:11px;color:#667085">Quét mã để xác minh giấy phép trực tuyến</div>
      </div>
      <div style="margin-top:28px;color:#667085;font-size:10px;overflow-wrap:anywhere">${escapeHtml(verificationUrl)}</div>
    </div>
  `
  document.body.appendChild(element)
  try {
    return await html2pdf()
      .set({
        margin: 0,
        filename: `Giay-cap-phep-${String(row.id).replace(/[^\w.-]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .outputPdf('blob')
  } finally {
    element.remove()
  }
}

export function downloadCertificatePdf(blob, applicationId) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Giay-cap-phep-${String(applicationId).replace(/[^\w.-]/g, '_')}.pdf`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
