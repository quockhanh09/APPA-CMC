const TOKEN_KEY = 'appa_cmc_token'
const USER_KEY = 'appa_cmc_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Đã có lỗi xảy ra')
  }
  return data
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function updateProfile(payload) {
  return request('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function changePassword(currentPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function fetchStaff() {
  return request('/staff')
}

export function createStaff(payload) {
  return request('/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function toggleStaffLock(id) {
  return request(`/staff/${id}/lock`, { method: 'PATCH' })
}
