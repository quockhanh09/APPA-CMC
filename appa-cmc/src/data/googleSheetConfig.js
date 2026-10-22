// Danh sách các Google Sheets Web App URLs (Metadata_A, Metadata_B, ...)
// Thêm mới bằng cách push URL vào mảng GOOGLE_SHEET_APIS
export const GOOGLE_SHEET_APIS = [
  'https://script.google.com/macros/s/AKfycbxEBA4qRAW7gUMDmz8IoJwM7E7VsxTYXiTA9gAl0J9SfzgAoUt2SJRww2_7eMysb9-xCg/exec', // Metadata_A
  'https://script.google.com/macros/s/AKfycby5_O7yixH_y_S_ObbLatUYnpL869GOtbJRjA8EaKGz7Z_DcbbBunr9q2IRzooukyt2TA/exec', // Metadata_B
  
  // Thêm các nguồn mới ở đây:
  // 'https://script.google.com/macros/s/...', // Metadata_C
  // 'https://script.google.com/macros/s/...', // Metadata_D
];

// Backend proxy batch endpoint
export const PROXY_BATCH_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') +
  '/proxy/google-sheets/batch';

// Cấu hình fetch
export const PROXY_CONFIG = {
  concurrency: 5, // fetch đồng thời tối đa 5 URL
  timeoutMs: 30000, // timeout 30s mỗi URL
  maxRetries: 2, // retry 2 lần nếu fail
};