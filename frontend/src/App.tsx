/* Author: Abdul Samad | */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { DocumentDetail } from './pages/DocumentDetail';
import { DocumentUpload } from './pages/DocumentUpload';
import { Ledger } from './pages/Ledger';
import { Risk } from './pages/Risk';
import { Transactions } from './pages/Transactions';
import { AuditLogs } from './pages/AuditLogs';

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Protected routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/documents"
                            element={
                                <ProtectedRoute>
                                    <Documents />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/documents/upload"
                            element={
                                <ProtectedRoute allowedRoles={['corporate']}>
                                    <DocumentUpload />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/documents/:id"
                            element={
                                <ProtectedRoute>
                                    <DocumentDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/ledger"
                            element={
                                <ProtectedRoute>
                                    <Ledger />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/ledger/document/:id"
                            element={
                                <ProtectedRoute>
                                    <Ledger />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/risk"
                            element={
                                <ProtectedRoute>
                                    <Risk />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/transactions"
                            element={
                                <ProtectedRoute>
                                    <Transactions />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/audit-logs"
                            element={
                                <ProtectedRoute>
                                    <AuditLogs />
                                </ProtectedRoute>
                            }
                        />

                        {/* Redirects */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
