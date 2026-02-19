/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AssessmentWidget from '../components/common/AssessmentWidget';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import BankDashboard from '../components/dashboard/BankDashboard';
import CorporateDashboard from '../components/dashboard/CorporateDashboard';
import { MetricTile } from '../components/dashboard/MetricTile';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import { PrivilegeTooltip } from '../components/common/PrivilegeTooltip';
import { tradeService } from '../services/tradeService';
import { documentService } from '../services/documentService';

import {
    FileText,
    Shield,
    User,
    Briefcase,
    CheckCircle2,
    XCircle,
    CheckCircle,
    Clock,
    BookOpen,
    Upload,
    Plus,
    Lock
} from 'lucide-react';

const rolePrivileges: Record<string, { title: string; description: string; privileges: string[] }> = {
    admin: {
        title: 'System Administrator',
        description: 'Full system access with oversight capabilities.',
        privileges: ['System Access & Configuration', 'User Management', 'Audit Oversight', 'Integrity Monitoring'],
    },
    bank: {
        title: 'Banking Officer',
        description: 'Trade initiation and financial instrument management.',
        privileges: ['Trade Initiation & Approval', 'Document Upload & Verification', 'Risk Score Monitoring'],
    },
    corporate: {
        title: 'Corporate User',
        description: 'Trade management and document certification.',
        privileges: ['Trade Management', 'Certificate Upload', 'Portfolio Overview', 'Status Tracking'],
    },
    auditor: {
        title: 'Compliance Auditor',
        description: 'Read-only compliance and verification access.',
        privileges: ['Read-Only Compliance View', 'Ledger Verification', 'Report Generation', 'Risk Analysis'],
    },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalDocuments: 0,
        completedTrades: 0,
        pendingTrades: 0,
        activeTrades: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [trades, documents] = await Promise.all([
                tradeService.getTrades(),
                documentService.getDocuments()
            ]);

            const completed = trades.filter(t => t.status === 'completed' || t.status === 'paid').length;
            const pending = trades.filter(t => t.status === 'pending').length;
            const active = trades.filter(t => t.status === 'in_progress').length;

            setStats({
                totalDocuments: documents.length,
                completedTrades: completed,
                pendingTrades: pending,
                activeTrades: active
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    const roleInfo = rolePrivileges[user.role] || rolePrivileges.corporate;

    return (
        <div className="dashboard-grid fade-in">
            {/* Welcome Header */}
            <ElevatedPanel className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary mb-1">
                            Welcome back, {user.name || 'User'}!
                        </h1>
                        <div className="flex items-center gap-3">
                            <PrivilegeTooltip
                                title={roleInfo.title}
                                description={roleInfo.description}
                                privileges={roleInfo.privileges}
                            >
                                <span className={`access-level-tag role-${user.role} cursor-help`}>
                                    {user.role?.toUpperCase() || 'USER'}
                                </span>
                            </PrivilegeTooltip>
                            <span className="text-secondary text-sm">
                                Blockchain-secured trade finance platform
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:flex w-12 h-12 bg-gradient-brand rounded-xl items-center justify-center text-content-primary shadow-lg shadow-blue-500/20">
                        <User size={24} />
                    </div>
                </div>
            </ElevatedPanel>

            {/* Main Dashboard Widget view */}
            <DashboardOverview />
        </div>
    );
}
