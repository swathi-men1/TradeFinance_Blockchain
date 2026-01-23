import React, { useState, useEffect } from 'react'
import './index.css'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import { authAPI } from './api/auth'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          console.log('✅ User loaded from storage:', JSON.parse(storedUser).username)
        } catch (e) {
          console.error('Error parsing stored user:', e)
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = (userData) => {
    console.log('🎉 Login successful, user:', userData)
    setUser(userData)
  }

  const handleLogout = () => {
    console.log('👋 Logging out user:', user.username)
    authAPI.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-3xl font-bold text-white mb-2">ChainDocs</h1>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  )
}
