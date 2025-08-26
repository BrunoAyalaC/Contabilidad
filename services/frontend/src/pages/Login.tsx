import React, { useState } from 'react'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('P@ssw0rd!')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/v1/auth/login', { username, password })
      const { accessToken } = res.data
      if (remember) localStorage.setItem('accessToken', accessToken)
      else sessionStorage.setItem('accessToken', accessToken)
      navigate('/cuentas')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card" role="main" aria-labelledby="login-title">
        <div className="brand">
          <div className="logo" aria-hidden />
          <h1 id="login-title">Contabilidad · PCGE</h1>
          <p className="tag">Acceso seguro para gestión contable</p>
        </div>

        <form className="login-form" onSubmit={submit} aria-describedby={error ? 'login-error' : undefined}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input id="username" name="username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="meta">
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Mantener sesión
            </label>
            <a className="help-link" href="#">¿Olvidaste tu contraseña?</a>
          </div>

          {error && <div id="login-error" className="error">{error}</div>}

          <div className="actions">
            <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
            <button type="button" className="btn secondary" onClick={() => { setUsername(''); setPassword(''); setError(null) }}>Limpiar</button>
          </div>
        </form>

        <footer className="auth-footer">© {new Date().getFullYear()} Contabilidad · Equipo</footer>
      </div>
    </div>
  )
}
