import React from 'react'
import './index.css'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="corporate-header border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">🔗 ChainDocs</h1>
          <p className="text-slate-300 text-lg">Trade Finance Blockchain Explorer</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="corporate-card p-8">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Welcome to Phase 1</h2>
          <p className="text-lg text-slate-700 mb-4">
            Database foundation and backend setup is complete.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Backend Status */}
            <div className="corporate-card p-6 bg-green-50 border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-900 mb-2">✅ Backend Ready</h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• FastAPI running on http://localhost:8000</li>
                <li>• PostgreSQL connected</li>
                <li>• Database auto-created</li>
                <li>• Tables initialized</li>
                <li>• Dummy users created</li>
              </ul>
            </div>

            {/* Frontend Status */}
            <div className="corporate-card p-6 bg-blue-50 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-900 mb-2">🎨 Frontend Ready</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• React + Vite configured</li>
                <li>• Tailwind CSS active</li>
                <li>• Running on http://localhost:5173</li>
                <li>• Corporate theme applied</li>
                <li>• Ready for Phase 2</li>
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">📋 Phase 1 Complete</h3>
            <p className="text-yellow-800 mb-4">
              The foundation is set. Next: Authentication with JWT in Phase 2.
            </p>
            <p className="text-sm text-yellow-700">
              Check backend console for database logs and dummy user credentials.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
