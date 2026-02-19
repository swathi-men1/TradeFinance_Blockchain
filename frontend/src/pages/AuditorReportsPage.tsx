/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { ElevatedPanel } from '../components/layout/ElevatedPanel';
import auditorService, { AuditReport as AuditorApiReport } from '../services/auditorService';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, RefreshCw, CheckCircle, AlertTriangle, Shield, Check } from 'lucide-react';
import { Button } from '../components/common/Button';

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
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <h1 className="text-2xl font-bold text-content-primary mb-2">Compliance Reports</h1>
      <p className="text-muted mb-5 text-secondary">Generate and export audit reports, compliance summaries, and integrity assessments</p>

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
          {message.type === 'success' ? <CheckCircle size={20} className="text-green-400" /> : <AlertTriangle size={20} className="text-red-400" />}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {reportTemplates.map((template) => (
          <ElevatedPanel
            key={template.id}
            className={`cursor-pointer transition-all duration-200 ${selectedTemplate === template.id
              ? 'ring-2 ring-lime-500 bg-lime-500/10'
              : 'hover:bg-white/5'
              }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10">
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-content-primary mb-1">{template.name}</h3>
                <p className="text-sm text-secondary">{template.description}</p>
              </div>
            </div>
            {selectedTemplate === template.id && (
              <div className="mt-4 flex items-center gap-2 text-lime text-sm font-semibold">
                <Check size={16} />
                <span>Selected</span>
              </div>
            )}
          </ElevatedPanel>
        ))}
      </div>

      {/* Report Configuration */}
      <ElevatedPanel className="mb-5">
        <h2 className="text-xl font-semibold text-content-primary mb-6">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">
              <span className="flex items-center gap-2"><Calendar size={16} /> Start Date</span>
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">
              <span className="flex items-center gap-2"><Calendar size={16} /> End Date</span>
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
          <Button
            onClick={handleGenerateReport}
            disabled={generating || !selectedTemplate}
            isLoading={generating}
            icon={<FileText size={16} />}
          >
            Generate Report
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedTemplate(null);
              setDateRange({ start: '', end: '' });
            }}
          >
            Clear Selection
          </Button>
        </div>
      </ElevatedPanel>

      {/* Generated Reports */}
      <ElevatedPanel>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-content-primary">Generated Reports</h2>
          <button
            onClick={loadReports}
            className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-white transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="animate-spin text-lime" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={48} className="text-secondary mx-auto mb-4" />
            <p className="text-secondary">No reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report: AuditorApiReport, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <FileText size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-content-primary">{getReportTypeName(report.report_type)}</h3>
                    <p className="text-sm text-secondary">
                      Generated: {new Date(report.generated_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-secondary mt-1 bg-black/20 px-2 py-0.5 rounded inline-block">
                      Period: {(report as any).filterParams?.start_date} to {(report as any).filterParams?.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1`}>
                    <CheckCircle size={12} />
                    Generated
                  </span>
                  <button
                    onClick={() => handleDownload(report)}
                    className="p-2 rounded-lg hover:bg-white/10 text-secondary hover:text-white transition-colors"
                    title="Download Report"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ElevatedPanel>
    </div>
  );
}
