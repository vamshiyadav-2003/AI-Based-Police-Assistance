import axios from 'axios'

let url = import.meta.env.VITE_API_URL || ''
if (url.endsWith('/')) {
  url = url.slice(0, -1)
}

const api = axios.create({
  baseURL: url,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
