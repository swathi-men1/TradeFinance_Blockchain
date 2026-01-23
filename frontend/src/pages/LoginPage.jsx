import React, { useState } from 'react'
import { authAPI } from '../api/auth'
import './LoginPage.css'

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('login') // login or signup

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 Attempting login with username:', username)
      const response = await authAPI.login(username, password)
      
      console.log('✅ Login successful!')
      console.log('   - User:', response.user.username)
      console.log('   - Role:', response.user.role)
      console.log('   - Token expires in:', response.tokens.expires_in, 'seconds')

      // Store tokens and user info
      localStorage.setItem('access_token', response.tokens.access_token)
      localStorage.setItem('refresh_token', response.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      onLoginSuccess(response.user)
    } catch (err) {
      console.error('❌ Login failed:', err.response?.data || err.message)
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const email = document.getElementById('signup-email')?.value
    const fullName = document.getElementById('signup-fullname')?.value
    const signupPassword = document.getElementById('signup-password')?.value

    if (!email || !fullName || !signupPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      console.log('📝 Attempting signup with username:', username)
      const response = await authAPI.signup(username, email, fullName, signupPassword)
      
      console.log('✅ Signup successful!')
      console.log('   - User:', response.user.username)
      console.log('   - Email:', response.user.email)

      localStorage.setItem('access_token', response.tokens.access_token)
      localStorage.setItem('refresh_token', response.tokens.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      onLoginSuccess(response.user)
    } catch (err) {
      console.error('❌ Signup failed:', err.response?.data || err.message)
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-blob blob-1"></div>
        <div className="gradient-blob blob-2"></div>
      </div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">🔗</div>
          <h1>ChainDocs</h1>
          <p>Trade Finance Blockchain Explorer</p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login')
              setError('')
            }}
          >
            Login
          </button>
          <button
            className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signup')
              setError('')
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Demo Credentials */}
            <div className="demo-credentials">
              <p>🧪 Demo Accounts:</p>
              <ul>
                <li><strong>admin_user</strong> / admin123</li>
                <li><strong>bank_user</strong> / bank123</li>
                <li><strong>corporate_user</strong> / corporate123</li>
                <li><strong>auditor_user</strong> / auditor123</li>
              </ul>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="login-form">
            <div className="form-group">
              <label htmlFor="signup-username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="signup-username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  minLength={3}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-fullname">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">📝</span>
                <input
                  id="signup-fullname"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>Secure Trade Finance Management Platform</p>
        </div>
      </div>
    </div>
  )
}
