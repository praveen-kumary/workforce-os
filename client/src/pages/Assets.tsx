import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Laptop, DollarSign, CheckCircle, ShieldCheck, X,
} from 'lucide-react';
import { itApi, coreApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Device, Employee } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'In Use' },
  LOCKED: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'Locked' },
  WIPED: { bg: 'var(--error-bg)', text: 'var(--error-text)', label: 'Wiped' },
  RETURNED: { bg: 'var(--bg-tertiary)', text: 'var(--text-tertiary)', label: 'Available' },
};

export function Assets() {
  const [showModal, setShowModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    deviceType: 'Laptop',
    make: 'Apple',
    model: 'MacBook Pro 16" M3 Max',
    serialNumber: '',
    employeeId: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['it-devices'],
    queryFn: () => itApi.getDevices(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-short'],
    queryFn: () => coreApi.getEmployees({ pageSize: 50 }),
  });
  const employees = employeesResponse?.data || [];

  const addDeviceMutation = useMutation({
    mutationFn: (data: any) =>
      itApi.assignDevice({
        employeeId: data.employeeId,
        deviceType: data.deviceType,
        make: data.make,
        model: data.model,
        serialNumber: data.serialNumber || `C02${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-devices'] });
      addToast({ title: 'Device added to fleet' });
      setShowModal(false);
      setNewAsset({
        deviceType: 'Laptop',
        make: 'Apple',
        model: 'MacBook Pro 16" M3 Max',
        serialNumber: '',
        employeeId: '',
      });
    },
  });

  const totalValue = devices.length * 2800;
  const inUseCount = devices.filter((d: Device) => d.status === 'ACTIVE').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hardware & IT Assets</h1>
          <p className="page-subtitle">
            {devices.length} managed fleet endpoints · ${(totalValue / 1000).toFixed(0)}K total asset value
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (employees.length > 0 && !newAsset.employeeId) {
                setNewAsset({ ...newAsset, employeeId: employees[0].id });
              }
              setShowModal(true);
            }}
          >
            <Plus size={15} /> Add Endpoint Asset
          </button>
        </div>
      </div>

      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Fleet Devices', value: devices.length, icon: Laptop, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Active In Use', value: inUseCount, icon: CheckCircle, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Encrypted Endpoints', value: `${devices.filter((d: Device) => d.isEncrypted).length}/${devices.length}`, icon: ShieldCheck, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Total Valuation', value: `$${(totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: '#d97706', bg: 'var(--warning-bg)' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="kpi-card" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card-header"><div className="kpi-card-icon" style={{ background: kpi.bg }}><kpi.icon size={18} color={kpi.color} /></div></div>
            <div className="kpi-card-value">{kpi.value}</div>
            <div className="kpi-card-label">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : devices.length === 0 ? (
        <div className="empty-state">
          <Laptop size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No assets registered</h3>
          <p>Register enterprise hardware and laptops to monitor device health and MDM encryption.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Device Asset</th>
                <th>Serial Number</th>
                <th>Assigned Employee</th>
                <th>OS & Version</th>
                <th>Encryption</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d: Device) => {
                const sc = STATUS_MAP[d.status] || STATUS_MAP.ACTIVE;
                return (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Laptop size={15} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{d.make} {d.model}</div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>{d.deviceType}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)' }}>
                        {d.serialNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {d.employee ? `${d.employee.firstName} ${d.employee.lastName}` : 'Unassigned'}
                      </div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                        {d.employee?.department || 'IT Warehouse'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {d.osName} {d.osVersion}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <ShieldCheck size={11} /> FileVault
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 480 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add Hardware Endpoint</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Model Name *</label>
                  <input
                    className="input"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <select
                      className="select"
                      value={newAsset.make}
                      onChange={(e) => setNewAsset({ ...newAsset, make: e.target.value })}
                    >
                      <option value="Apple">Apple</option>
                      <option value="Dell">Dell</option>
                      <option value="Lenovo">Lenovo</option>
                      <option value="HP">HP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Device Type</label>
                    <select
                      className="select"
                      value={newAsset.deviceType}
                      onChange={(e) => setNewAsset({ ...newAsset, deviceType: e.target.value })}
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Server">Server</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignee Employee</label>
                  <select
                    className="select"
                    value={newAsset.employeeId}
                    onChange={(e) => setNewAsset({ ...newAsset, employeeId: e.target.value })}
                  >
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newAsset.model || !newAsset.employeeId || addDeviceMutation.isPending}
                  onClick={() => addDeviceMutation.mutate(newAsset)}
                >
                  {addDeviceMutation.isPending ? 'Provisioning...' : 'Provision Endpoint'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Assets;
