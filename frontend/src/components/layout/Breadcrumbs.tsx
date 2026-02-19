/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    documents: 'Certificates',
    upload: 'Ingest Certificate',
    trades: 'Transactions',
    create: 'Initiate',
    'risk-score': 'Threat Assessment',
    monitoring: 'System Monitoring',
    ledger: 'Audit Chain',
    admin: 'Administration',
    users: 'Accounts',
    orgs: 'Entities',
    audit: 'Activity Logs',
    auditor: 'Compliance Console',
    alerts: 'Compliance Alerts',
    reports: 'Compliance Reports',
    risk: 'Risk Analysis',
};

export function Breadcrumbs() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) return null;

    return (
        <nav className="breadcrumb-bar" aria-label="Breadcrumb">
            <ol className="breadcrumb-list">
                <li className="breadcrumb-item">
                    <Link to="/dashboard" className="breadcrumb-link">
                        <Home size={16} />
                    </Link>
                </li>
                {pathSegments.map((segment, index) => {
                    const path = '/' + pathSegments.slice(0, index + 1).join('/');
                    const isLast = index === pathSegments.length - 1;
                    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                    const displayLabel = /^\d+$/.test(segment) ? 'Details' : label;

                    return (
                        <li key={path} className="breadcrumb-item">
                            <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
                            {isLast ? (
                                <span className="breadcrumb-current">{displayLabel}</span>
                            ) : (
                                <Link to={path} className="breadcrumb-link">
                                    {displayLabel}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
