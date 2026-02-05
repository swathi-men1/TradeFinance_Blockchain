import { useEffect } from 'react';
import { Layout } from '../components/layout/MainLayout';
import { apiClient } from '../services/api';
import { RichAuditTable } from '../components/RichAuditTable';
import { ShieldCheck } from 'lucide-react';
import { useSafeFetch } from '../hooks/useSafeFetch';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface AuditEvent {
    id: number;
    severity: "CRITICAL" | "WARNING" | "INFO";
    timestamp: string;
    actor_name: string;
    actor_role?: string;
    action: string;
    target_type: "DOCUMENT" | "USER";
    target_id: string | number;
    target_display: string;
    evidence?: any;
}

export const AuditLogs = () => {
    const { execute, data, loading, error } = useSafeFetch<AuditEvent[]>();
    const logs = data || [];

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        await execute(() => apiClient.get<AuditEvent[]>('/compliance/audit-logs'));
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        System Audit Logs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Immutable record of all system-level administrative actions.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {loading ? (
                        <LoadingSpinner />
                    ) : logs.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                            <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No verifiable audit events recorded yet.</p>
                        </div>
                    ) : (
                        <RichAuditTable logs={logs} />
                    )}
                </div>
            </div>
        </Layout>
    );
};
