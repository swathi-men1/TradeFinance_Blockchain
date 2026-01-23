import React from 'react'

export default function Dashboard({ user, onLogout }) {
  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'bank': return 'bg-blue-100 text-blue-800'
      case 'corporate': return 'bg-green-100 text-green-800'
      case 'auditor': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleEmoji = (role) => {
    switch(role) {
      case 'admin': return '👨‍💼'
      case 'bank': return '🏦'
      case 'corporate': return '🏢'
      case 'auditor': return '📋'
      default: return '👤'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="corporate-header border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">🔗 ChainDocs</h1>
            <p className="text-slate-300">Trade Finance Blockchain Explorer</p>
          </div>
          <button
            onClick={onLogout}
            className="corporate-btn-secondary hover:bg-slate-700 text-white"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Card */}
        <div className="corporate-card p-8 mb-8 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{getRoleEmoji(user.role)}</div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Welcome, {user.full_name}!</h2>
              <p className="text-slate-700 mt-2">You are logged in as <strong>{user.username}</strong></p>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${getRoleColor(user.role)}`}>
                {user.role.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="corporate-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">👤 Profile Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Username</p>
                <p className="text-lg font-bold text-slate-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="text-lg font-bold text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">User ID</p>
                <p className="text-lg font-bold text-slate-900">#{user.id}</p>
              </div>
            </div>
          </div>

          <div className="corporate-card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🔐 Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-slate-700">Account is <strong>Active</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-slate-700">Authenticated with JWT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-slate-700">Database connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role-Specific Content */}
        <div className="corporate-card p-8 mb-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">📊 Available Features</h3>
          
          {user.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-bold text-purple-900 mb-2">👨‍💼 Admin Panel</h4>
                <p className="text-purple-800 text-sm">Manage users, view system logs, configure settings</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-bold text-purple-900 mb-2">📈 Analytics</h4>
                <p className="text-purple-800 text-sm">System-wide analytics and reporting</p>
              </div>
            </div>
          )}

          {user.role === 'bank' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-bold text-blue-900 mb-2">🏦 Trade Finance</h4>
                <p className="text-blue-800 text-sm">Manage trade transactions and documents</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-bold text-blue-900 mb-2">📋 Verification</h4>
                <p className="text-blue-800 text-sm">Verify and approve documents</p>
              </div>
            </div>
          )}

          {user.role === 'corporate' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-bold text-green-900 mb-2">📄 Document Upload</h4>
                <p className="text-green-800 text-sm">Upload and manage trade documents</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-bold text-green-900 mb-2">📊 Dashboard</h4>
                <p className="text-green-800 text-sm">View transaction status and history</p>
              </div>
            </div>
          )}

          {user.role === 'auditor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-lg font-bold text-orange-900 mb-2">🔍 Audit Trail</h4>
                <p className="text-orange-800 text-sm">View complete transaction audit logs</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-lg font-bold text-orange-900 mb-2">📋 Reports</h4>
                <p className="text-orange-800 text-sm">Generate compliance reports</p>
              </div>
            </div>
          )}
        </div>

        {/* Phase Status */}
        <div className="corporate-card p-8 bg-yellow-50 border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold text-yellow-900 mb-4">✅ Phase 2 Complete: Authentication</h3>
          <p className="text-yellow-800 mb-4">
            You are successfully logged in with JWT authentication. Your session is secure and your role determines what features you can access.
          </p>
          <ul className="text-yellow-800 space-y-2 text-sm">
            <li>✓ JWT access token generated (15 min expiry)</li>
            <li>✓ Refresh token created (7 days expiry)</li>
            <li>✓ Role-based dashboard shown</li>
            <li>✓ Ready for Phase 3: Dashboard & Layout</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
