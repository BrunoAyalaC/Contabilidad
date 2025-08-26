import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/api/v1/cuentas')
        setCuentas(res.data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Error fetching cuentas')
      }
    }
    fetch()
  }, [])

  const navigate = useNavigate()
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await api.post('/api/v1/auth/logout', { refreshToken })
    } catch (_) {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <div className="page cuentas">
      <h1>Cuentas</h1>
      {error && <div className="error">{error}</div>}
      <ul>
        {cuentas.map(c => (
          <li key={c.id}>{c.codigo} - {c.nombre}</li>
        ))}
      </ul>
  <button onClick={logout}>Logout</button>
    </div>
  )
}
