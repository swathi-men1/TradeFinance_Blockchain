/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { ComplianceAlert, AlertListResponse } from '../services/auditorService';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ArrowLeft, CheckCircle, AlertTriangle, Flag, Siren, Info, AlertOctagon } from 'lucide-react';
import { Button } from '../components/common/Button';

export default function AuditorAlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [summary, setSummary] = useState<AlertListResponse['by_severity'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    severity: ''
  });
  const [selectedAlert, setSelectedAlert] = useState<ComplianceAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await auditorService.getAlerts(
        filter.status || undefined,
        filter.severity || undefined,
        0,
        100
      );
      setAlerts(response.alerts);
      setSummary(response.by_severity);
    } catch (err) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectPatterns = async () => {
    setLoading(true);
    try {
      const result = await auditorService.detectPatterns();
      setSuccess(result.message);
      await fetchAlerts();
    } catch (err) {
      setError('Pattern detection failed');
    } finally {
      setLoading(false);
    }
  };

  const confirmResolve = async () => {
    if (!selectedAlert) return;

    try {
      await auditorService.updateAlertStatus(selectedAlert.id, 'RESOLVED', resolutionNotes);
      setSuccess('Alert resolved successfully');
      setShowResolveModal(false);
      setResolutionNotes('');
      setSelectedAlert(null);
      await fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update alert');
    }
  };

  const handleDismiss = async (alert: ComplianceAlert) => {
    try {
      await auditorService.updateAlertStatus(alert.id, 'DISMISSED');
      setSuccess('Alert dismissed successfully');
      await fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dismiss alert');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Siren size={16} className="text-red-400" />;
      case 'HIGH': return <AlertOctagon size={16} className="text-orange-400" />;
      case 'MEDIUM': return <AlertTriangle size={16} className="text-yellow-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'HIGH': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      default: return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-red-400';
      case 'INVESTIGATING': return 'text-yellow-400';
      case 'RESOLVED': return 'text-green-400';
      case 'DISMISSED': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <ElevatedPanel>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
              <Siren size={32} className="text-red-500" />
              <span>Compliance Alerts</span>
            </h1>
            <p className="text-secondary">
              Monitor and manage compliance violations, integrity alerts, and suspicious patterns
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleDetectPatterns}
              disabled={loading}
              variant="secondary"
              isLoading={loading}
              icon={<Search size={16} />}
            >
              Detect Patterns
            </Button>
            <Button
              onClick={() => navigate('/auditor')}
              variant="secondary"
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
          </div>
        </div>
      </ElevatedPanel>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ElevatedPanel className="text-center border-b-4 border-red-500">
            <div className="text-2xl font-bold text-content-primary mb-1">{summary.CRITICAL || 0}</div>
            <div className="text-sm text-secondary font-medium uppercase tracking-wider">Critical</div>
          </ElevatedPanel>
          <ElevatedPanel className="text-center border-b-4 border-orange-500">
            <div className="text-2xl font-bold text-content-primary mb-1">{summary.HIGH || 0}</div>
            <div className="text-sm text-secondary font-medium uppercase tracking-wider">High</div>
          </ElevatedPanel>
          <ElevatedPanel className="text-center border-b-4 border-yellow-500">
            <div className="text-2xl font-bold text-content-primary mb-1">{summary.MEDIUM || 0}</div>
            <div className="text-sm text-secondary font-medium uppercase tracking-wider">Medium</div>
          </ElevatedPanel>
          <ElevatedPanel className="text-center border-b-4 border-blue-500">
            <div className="text-2xl font-bold text-content-primary mb-1">{summary.LOW || 0}</div>
            <div className="text-sm text-secondary font-medium uppercase tracking-wider">Low</div>
          </ElevatedPanel>
        </div>
      )}

      {/* Filters */}
      <ElevatedPanel>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-secondary mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="input-field w-full"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-secondary mb-2">Severity</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="input-field w-full"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </ElevatedPanel>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 flex items-center gap-3">
          <AlertOctagon size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 flex items-center gap-3">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <ElevatedPanel
            key={alert.id}
            className={`border-l-4 ${alert.severity === 'CRITICAL' ? 'border-l-red-500' :
              alert.severity === 'HIGH' ? 'border-l-orange-500' :
                alert.severity === 'MEDIUM' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
              }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                    {alert.severity}
                  </span>
                  <span className={`text-sm font-semibold ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(alert.detected_at)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-content-primary mb-2">{alert.title}</h3>
                <p className="text-secondary mb-3">{alert.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded border border-gray-600">
                    Type: {alert.alert_type}
                  </span>
                  {alert.document_id && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                      Document #{alert.document_id}
                    </span>
                  )}
                  {alert.trade_id && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                      Trade #{alert.trade_id}
                    </span>
                  )}
                  {alert.user_id && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                      User #{alert.user_id}
                    </span>
                  )}
                </div>
              </div>
              {alert.status === 'OPEN' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setShowResolveModal(true);
                    }}
                    size="sm"
                    icon={<CheckCircle size={16} />}
                  >
                    Resolve
                  </Button>
                  <Button
                    onClick={() => handleDismiss(alert)}
                    variant="danger"
                    size="sm"
                    icon={<Flag size={16} />}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </ElevatedPanel>
        ))}

        {alerts.length === 0 && (
          <ElevatedPanel className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <CheckCircle size={64} className="text-green-500/50" />
            </div>
            <h3 className="text-xl font-bold text-content-primary mb-2">No Alerts Found</h3>
            <p className="text-secondary">
              {filter.status || filter.severity
                ? 'Try adjusting your filters'
                : 'The system is operating normally. No compliance issues detected.'}
            </p>
          </ElevatedPanel>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <ElevatedPanel className="max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-content-primary mb-4 flex items-center gap-2">
              <CheckCircle size={24} className="text-green-500" />
              <span>Resolve Alert</span>
            </h3>
            <p className="text-secondary mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
              {selectedAlert.title}
            </p>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter resolution notes..."
              className="input-field w-full mb-4 min-h-[100px]"
            />
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowResolveModal(false);
                  setResolutionNotes('');
                  setSelectedAlert(null);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmResolve}
                className="bg-green-600 hover:bg-green-700"
              >
                Resolve Alert
              </Button>
            </div>
          </ElevatedPanel>
        </div>
      )}
    </div>
  );
}
