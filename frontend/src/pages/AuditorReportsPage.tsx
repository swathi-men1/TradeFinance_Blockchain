import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import auditorService, { AuditReport as AuditorApiReport } from '../services/auditorService';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, Filter, RefreshCw, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  parameters: string[];
}

export default function AuditorReportsPage() {
  // Extended interface to store filter parameters with the report
  interface ExtendedAuditReport extends AuditorApiReport {
    filterParams?: {
      start_date?: string;
      end_date?: string;
      [key: string]: any;
    };
  }

  const { user } = useAuth();
  const [reports, setReports] = useState<ExtendedAuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'audit_summary',
      name: 'Audit Summary Report',
      description: 'Comprehensive overview of all audit activities and actions performed.',
      icon: <FileText className="w-8 h-8 text-blue-400" />,
      parameters: ['start_date', 'end_date', 'user_id']
    },
    {
      id: 'compliance_assessment',
      name: 'Compliance Assessment',
      description: 'Detailed compliance analysis with violations and recommendations.',
      icon: <Shield className="w-8 h-8 text-green-400" />,
      parameters: ['start_date', 'end_date', 'severity']
    },
    {
      id: 'integrity_check',
      name: 'System Integrity Report',
      description: 'Document integrity verification and anomaly detection results.',
      icon: <CheckCircle className="w-8 h-8 text-purple-400" />,
      parameters: ['start_date', 'end_date']
    },
    {
      id: 'risk_analysis',
      name: 'Risk Analysis Report',
      description: 'Risk score analysis with high-risk entities and trends.',
      icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
      parameters: ['start_date', 'end_date', 'risk_level']
    }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);

      // Default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Set default date range in UI
      setDateRange({
        start: startStr,
        end: endStr
      });

      // Generate initial System Overview report
      const reportData = await auditorService.generateAuditReport({
        report_type: 'audit_summary',
        start_date: startStr,
        end_date: endStr
      });

      const newReport: ExtendedAuditReport = {
        ...reportData,
        report_type: 'audit_summary',
        filterParams: {
          start_date: startStr,
          end_date: endStr
        }
      };

      setReports([newReport]);
    } catch (error) {
      console.error("Failed to load initial report", error);
      // We don't show a visible error on initial load to avoid annoyance if backend is waking up
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      setMessage({ type: 'error', text: 'Please select a report template' });
      return;
    }

    if (!dateRange.start || !dateRange.end) {
      setMessage({ type: 'error', text: 'Please specify a date range' });
      return;
    }

    try {
      setGenerating(true);
      setMessage(null);

      const filters = {
        start_date: dateRange.start,
        end_date: dateRange.end
      };

      // Call the actual API to generate the report
      // Note: backend expects ISO strings or similar, but the service handles params
      const reportData = await auditorService.generateAuditReport({
        report_type: selectedTemplate,
        ...filters,
        // user_id, trade_id etc could be added here if UI supported selecting them
      });

      // Augment the report with the type and params used
      const newReport: ExtendedAuditReport = {
        ...reportData,
        report_type: selectedTemplate, // Backend might return 'AUDIT' generic type, override if needed or trust backend
        filterParams: filters
      };

      // If backend returns generic "AUDIT", we might want to override it with the selected template name for display
      if (newReport.report_type === 'AUDIT' && selectedTemplate !== 'audit_summary') {
        newReport.report_type = selectedTemplate;
      }

      setReports([newReport, ...reports]);
      setMessage({ type: 'success', text: 'Report generated successfully!' });

      // Optional: Clear selection after success
      // setSelectedTemplate(null);
      // setDateRange({ start: '', end: '' });
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage({ type: 'error', text: 'Failed to generate report' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: AuditorApiReport, format: 'CSV' | 'PDF' = 'PDF') => {
    try {
      setMessage({ type: 'success', text: `Starting ${format} download...` });

      // Use filters stored with the report if available, otherwise fallback to current UI state
      const reportParams = (report as any).filterParams;
      const filters = {
        start_date: reportParams?.start_date || dateRange.start || undefined,
        end_date: reportParams?.end_date || dateRange.end || undefined
      };

      if (format === 'CSV') {
        const blob = await auditorService.exportReportCSV(report.report_type, filters);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.report_type}_report.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const blob = await auditorService.exportReportPDF(report.report_type, filters);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.report_type}_report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setMessage({ type: 'success', text: `${format} report downloaded successfully` });
    } catch (error) {
      console.error(`Error downloading ${format} report:`, error);
      setMessage({ type: 'error', text: `Failed to download ${format} report` });
    }
  };

  const getReportTypeName = (type: string) => {
    const template = reportTemplates.find(t => t.id === type);
    return template?.name || type;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Compliance Reports</h1>
      <p className="text-muted mb-8">Generate and export audit reports, compliance summaries, and integrity assessments</p>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportTemplates.map((template) => (
          <GlassCard
            key={template.id}
            className={`cursor-pointer transition-all duration-200 ${selectedTemplate === template.id
              ? 'ring-2 ring-blue-500 bg-blue-500/20'
              : 'hover:bg-white/5'
              }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10">
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-sm text-muted">{template.description}</p>
              </div>
            </div>
            {selectedTemplate === template.id && (
              <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Selected</span>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Report Configuration */}
      <GlassCard className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={generating || !selectedTemplate}
            className="btn-primary"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setDateRange({ start: '', end: '' });
            }}
            className="btn-secondary"
          >
            Clear Selection
          </button>
        </div>
      </GlassCard>

      {/* Generated Reports */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Generated Reports</h2>
          <button
            onClick={loadReports}
            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-muted">No reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report: AuditorApiReport, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{getReportTypeName(report.report_type)}</h3>
                    <p className="text-sm text-muted">
                      Generated: {new Date(report.generated_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                      Period: {(report as any).filterParams?.start_date} to {(report as any).filterParams?.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${'bg-green-500/20 text-green-400'
                    }`}>
                    Generated
                  </span>
                  <button
                    onClick={() => handleDownload(report)}
                    className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
