import axios from 'axios'

const api = axios.create({ baseURL: '/', withCredentials: true })

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function processQueue(token: string | null) {
  refreshQueue.forEach(cb => cb(token))
  refreshQueue = []
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token: string | null) => {
            if (token) {
              original.headers['Authorization'] = `Bearer ${token}`
              resolve(axios(original))
            } else reject(error)
          })
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        // backend stores refresh token as httpOnly cookie; request with credentials
        const resp = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const { accessToken } = resp.data
        localStorage.setItem('accessToken', accessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        processQueue(accessToken)
        return axios(original)
      } catch (e) {
        processQueue(null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
