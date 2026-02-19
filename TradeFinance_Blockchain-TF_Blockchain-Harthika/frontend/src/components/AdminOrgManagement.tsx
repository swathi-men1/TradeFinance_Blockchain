import React, { useState, useEffect } from 'react';
import { adminService, Organization } from '../services/adminService';
import { GlassCard } from './GlassCard';

export default function AdminOrgManagement() {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrg, setNewOrg] = useState({ org_name: '', status: 'active' });

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
        } catch (error) {
            alert('Failed to create organization');
        }
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await adminService.updateOrganization(id, { status });
            loadOrgs();
        } catch (error) {
            alert('Failed to update organization');
        }
    };

    return (
        <GlassCard>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🏢</span> Organization Management
            </h3>

            {/* Create Form */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Organization Name"
                    className="input-field flex-1"
                    value={newOrg.org_name}
                    onChange={(e) => setNewOrg({ ...newOrg, org_name: e.target.value })}
                />
                <select
                    className="input-field w-40"
                    value={newOrg.status}
                    onChange={(e) => setNewOrg({ ...newOrg, status: e.target.value })}
                >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                </select>
                <button onClick={handleCreate} className="btn-primary">
                    Create Org
                </button>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-secondary border-b border-white/10">
                            <th className="p-3">ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>
                        ) : (
                            orgs.map((org) => (
                                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-white">#{org.id}</td>
                                    <td className="p-3 text-white font-bold">{org.org_name}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${org.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                            org.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {org.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 flex gap-2">
                                        {org.status !== 'active' && (
                                            <button onClick={() => handleStatusUpdate(org.id, 'active')} className="text-green-400 text-sm hover:underline">Activate</button>
                                        )}
                                        {org.status !== 'suspended' && (
                                            <button onClick={() => handleStatusUpdate(org.id, 'suspended')} className="text-red-400 text-sm hover:underline">Suspend</button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}
