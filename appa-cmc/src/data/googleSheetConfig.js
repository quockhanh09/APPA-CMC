// Danh sách các Google Sheets Web App URLs (Metadata_A, Metadata_B, ...)
// Thêm mới bằng cách push URL vào mảng GOOGLE_SHEET_APIS
export const GOOGLE_SHEET_APIS = [
  'https://script.google.com/macros/s/AKfycbxEBA4qRAW7gUMDmz8IoJwM7E7VsxTYXiTA9gAl0J9SfzgAoUt2SJRww2_7eMysb9-xCg/exec', // Metadata_A
  'https://script.google.com/macros/s/AKfycby5_O7yixH_y_S_ObbLatUYnpL869GOtbJRjA8EaKGz7Z_DcbbBunr9q2IRzooukyt2TA/exec', // Metadata_B
  'https://script.google.com/macros/s/AKfycbzhFdiBTrh5V4QjNboY5yEJpUdRymnGJKihiaeVV6ZvtJsaFdSJZgwtOBs7MZbZP050PA/exec', // Metadata_C
  'https://script.google.com/macros/s/AKfycbxcOfnCA_DR_6YLdn4b4OQimOW7h0A9Knt2rEQ0NEyVHBtHGczBJu3jOW744UGF8SPvoQ/exec', // Metadata_D
  'https://script.google.com/macros/s/AKfycbwoAxG8_4t5jEe2wXlPsZnaGxCFlLaTv3FSWDrrqRHDTJD0J-sCnCFRQWksLDMKc3LgzA/exec', // Metadata_Đ
  'https://script.google.com/macros/s/AKfycbzE88KOIWbOl9aEmhfAaOGPlFJEpHR8haNfTzjv7dRUgqcAGK6lAzHyFYG29it7oTP2/exec',// Metadata_E F G
  'https://script.google.com/macros/s/AKfycbzKnFzWz2jIIKlLl7-rIPiCf8DqOOXFyze2DN_01kQ1XKQ2utDUxAb47trdb_oIJe-P/exec', // Metadata_H
  'https://script.google.com/macros/s/AKfycbx3hZU7xmWkSc51qYrr_BQ23FxkYlcCmZse7xeHEDK69BQFQcRLZTM5iik2dFpyob9b/exec', // Metadata_I+J
  'https://script.google.com/macros/s/AKfycbwsDuKhx8PHEsMBsq5Xx6WBoXk-HK8NPNE2GT8sw_zQMEuotVFXTx4SLRsWGpLpppFZ/exec', // Metadata_K
  'https://script.google.com/macros/s/AKfycbzBg0_XsI1T2AIzaCjIS9v60npUVN-Tq91gflU1qhJWdifMR9O_9qDGp1Emc79ZIYA6pw/exec', // Metadata_L
  'https://script.google.com/macros/s/AKfycbxyKtHA7lN1Bnxw5Y-61WqrpOJbbaYFeVh2Rf1YSWniffxhI0ir_wRhCgbtc5_j-ozi/exec', // Metadata_M
  'https://script.google.com/macros/s/AKfycbz1YWdTXLBJecYOePSALeNJB9GuhCyDE-2sQ_T6QmvaDou34Cs-YC8kgfHG-wXVMDu4/exec', // Metadata_N
  'https://script.google.com/macros/s/AKfycbwfLF_GVz-h84yIXrR9xO6tQzSeJaSNSHOPjmXoCXFNOd733DK2YJXf2e_3EftqtQm7/exec', // Metadata_O + P
  'https://script.google.com/macros/s/AKfycbwZ4LZ5lUfolnP8E2TqnT0zk6_GD7W9araRnzJD31-R6fw9qHmfWaSRlCOMl-LMVm5N/exec', // Metadata_Q 
  'https://script.google.com/macros/s/AKfycbzjuDoxP5eldbugL1a0SE0BVtgHXrWusg0Otzq7pUhoKc1cR0C_dtIve0MMPFAG8f6-4g/exec', // Metadata_R + S
  'https://script.google.com/macros/s/AKfycbzWbP0NGThUvFkXXYVhcBLEiU2_t1UD3LrSfHMCMksdTt1YnjtNC7iFjlSWCD1L6EV4/exec',//Metadata_T list
  'https://script.google.com/macros/s/AKfycbz6WuTV5B0B6bv19EhcYIHqOs2RSquvGUTeMMA8v_s-F_jrSCEaGISbdd28rrFpjyFjEA/exec', //Metadata_U+V list
  'https://script.google.com/macros/s/AKfycbxrDam0-oE8QSknC3xzxxFOEWbPbfaKg8J9g0bPKQ0CXDRH-8QL5125_AviForBbifd/exec', // Metadata_W+X+Y+Z+ list
];

// Backend proxy batch endpoint
export const PROXY_BATCH_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') +
  '/proxy/google-sheets/batch';

// Cấu hình fetch
export const PROXY_CONFIG = {
  concurrency: 18, // fetch đồng thời tối đa 11 URL
  timeoutMs: 30000, // timeout 30s mỗi URL
  maxRetries:18, // retry 11 lần nếu fail
};