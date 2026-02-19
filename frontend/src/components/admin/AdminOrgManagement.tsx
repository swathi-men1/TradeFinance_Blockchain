/* Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance */
import React, { useState, useEffect } from 'react';
import { adminService, Organization } from '../../services/adminService';
import { ElevatedPanel } from '../layout/ElevatedPanel';
import { useToast } from '../../context/ToastContext';
import { Building2, Globe, MoreVertical, Plus, Power, ShieldAlert, CheckCircle2, Users } from 'lucide-react';

export default function AdminOrgManagement() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrg, setNewOrg] = useState({ org_name: '', status: 'active' });
    const toast = useToast();

    useEffect(() => {
        loadOrgs();
    }, []);

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const data = await adminService.getOrganizations();
            setOrgs(data);
        } catch (error) {
            console.error("Failed to load organizations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newOrg.org_name) return;
        try {
            await adminService.createOrganization(newOrg);
            setNewOrg({ org_name: '', status: 'active' });
            loadOrgs();
            toast.success('Organization created successfully');
        } catch (error) {
            toast.error('Failed to create organization');
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await adminService.updateOrganization(id, { status });
            loadOrgs();
            toast.success(`Organization ${status}`);
        } catch (error) {
            toast.error('Failed to update organization');
        }
    };

    return (
        <div className="space-y-6">
            <ElevatedPanel>
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-content-primary flex items-center gap-2 mb-2">
                            <Building2 size={24} className="text-blue-400" />
                            <span>Organization Management</span>
                        </h3>
                        <p className="text-secondary text-sm">Manage participating banks and corporate entities</p>
                    </div>

                    <div className="flex w-full md:w-auto gap-2 p-2 bg-black/20 rounded-xl border border-white/5">
                        <input
                            type="text"
                            placeholder="New Organization Name"
                            className="flex-1 bg-transparent border-none text-sm text-content-primary focus:ring-0 placeholder-white/20"
                            value={newOrg.org_name}
                            onChange={(e) => setNewOrg({ ...newOrg, org_name: e.target.value })}
                        />
                        <div className="h-6 w-px bg-white/10 mx-2 self-center"></div>
                        <select
                            className="bg-transparent border-none text-sm text-secondary focus:ring-0 cursor-pointer"
                            value={newOrg.status}
                            onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                        </select>
                        <button
                            onClick={handleCreate}
                            disabled={!newOrg.org_name}
                            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors ml-2"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </ElevatedPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-surface-elevated rounded-xl animate-pulse border border-white/5"></div>
                    ))
                ) : (
                    orgs.map((org) => (
                        <div key={org.id} className="group relative bg-surface-card hover:bg-surface-elevated transition-all duration-300 rounded-xl p-6 border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Globe size={24} />
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${org.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    org.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {org.status}
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-content-primary mb-1">{org.org_name}</h4>
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-secondary text-xs font-mono">ID: #{org.id.toString().padStart(4, '0')}</span>
                                <span className="text-secondary text-xs flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                                    <Users size={12} />
                                    {org.member_count} Members
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                {org.status !== 'active' ? (
                                    <button
                                        onClick={() => handleStatusUpdate(org.id, 'active')}
                                        className="flex-1 py-2 text-xs font-bold text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={14} /> Activate
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleStatusUpdate(org.id, 'suspended')}
                                        className="flex-1 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Power size={14} /> Suspend
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
