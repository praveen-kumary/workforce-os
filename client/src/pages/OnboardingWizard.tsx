import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Laptop,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StepWizard } from '../components/ui/StepWizard';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { coreApi } from '../lib/api';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    pronouns: 'they/them',
    department: 'Engineering',
    roleTitle: 'Senior Software Engineer',
    employmentType: 'FULL_TIME',
    hireDate: new Date().toISOString().split('T')[0],
    deviceType: 'Laptop',
    deviceModel: 'MacBook Pro 16" M3 Max (Apple Silicon)',
    selectedApps: ['Google Workspace', 'Slack Enterprise', '1Password Business', 'GitHub Enterprise', 'AWS Console'],
    baseSalary: '165000',
    payFrequency: 'MONTHLY',
    bankName: 'JPMorgan Chase',
    accountNumber: '8941',
    routingNumber: '021000021',
    sendWelcomeEmail: true,
  });

  const steps = [
    { id: 'personal', title: 'Personal Info', description: 'Name, contact & location' },
    { id: 'role', title: 'Employment', description: 'Department & role title' },
    { id: 'it', title: 'IT & Hardware', description: 'Device & apps provisioning' },
    { id: 'finance', title: 'Compensation', description: 'Salary & direct deposit' },
    { id: 'documents', title: 'Documents', description: 'Agreements & policies' },
    { id: 'review', title: 'Review & Launch', description: 'Execute zero-touch onboarding' },
  ];

  const hireMutation = useMutation({
    mutationFn: (payload: any) => coreApi.createEmployee({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      location: payload.location,
      pronouns: payload.pronouns,
      department: payload.department,
      roleTitle: payload.roleTitle,
      employmentType: payload.employmentType,
      hireDate: new Date(payload.hireDate).toISOString(),
      status: 'ACTIVE',
    }),
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast(`🎉 ${formData.firstName} ${formData.lastName} successfully onboarded! Automated IT & Finance provisioning triggered.`, 'success');
      navigate(`/employees/${newEmployee.id}`);
    },
    onError: (err: any) => {
      toast(`Error creating employee: ${err.message}`, 'error');
    },
  });

  const handleNext = () => {
    if (currentStep === 0 && (!formData.firstName || !formData.lastName || !formData.email)) {
      toast('Please complete all required fields.', 'error');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      hireMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleApp = (app: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedApps: prev.selectedApps.includes(app)
        ? prev.selectedApps.filter((a) => a !== app)
        : [...prev.selectedApps, app],
    }));
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserPlus size={28} color="var(--accent)" />
            Zero-Touch Employee Onboarding
          </h1>
          <p className="page-subtitle mt-1">
            Automate employee provisioning across HR records, fleet hardware, SSO apps, and payroll.
          </p>
        </div>
      </div>

      {/* Step Progress Line */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <StepWizard steps={steps} currentStepIndex={currentStep} onStepClick={setCurrentStep} />
      </div>

      {/* Wizard Step Body */}
      <div className="card" style={{ padding: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {/* STEP 0: Personal Details */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>1. Personal Information</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Basic details to generate workforce node and SSO identity.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>First Name *</label>
                  <input
                    type="text" required placeholder="e.g. Alexander"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Last Name *</label>
                  <input
                    type="text" required placeholder="e.g. Wright"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Work Email *</label>
                  <input
                    type="email" required placeholder="e.g. alex.wright@uos.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Role & Department */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>2. Department & Employment Terms</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Defines access permission tiers, manager reporting, and onboarding tasks.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product & Design</option>
                    <option value="Sales">Sales & BD</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance & Ops</option>
                    <option value="HR">People & Culture</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Job Role Title</label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="input"
                  >
                    <option value="FULL_TIME">Full-time Regular</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACTOR">Independent Contractor</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Official Start Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: IT Hardware & Apps */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>3. Zero-Touch IT Provisioning</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Select pre-configured laptop and SaaS applications for automatic single sign-on.</p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Assigned Hardware</label>
                <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--info-border)', background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Laptop size={24} color="var(--info)" />
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--info-text)' }}>{formData.deviceModel}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--info)', opacity: 0.8, fontFamily: 'monospace' }}>FileVault 256-Bit Pre-encrypted • Zero-touch MDM</p>
                    </div>
                  </div>
                  <Badge variant="success">Included</Badge>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  SSO Applications ({formData.selectedApps.length} Selected)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                  {[
                    'Google Workspace',
                    'Slack Enterprise',
                    '1Password Business',
                    'GitHub Enterprise',
                    'AWS Console',
                    'Figma Enterprise',
                    'Datadog Monitoring',
                    'Notion Team',
                  ].map((app) => {
                    const isSelected = formData.selectedApps.includes(app);
                    return (
                      <button
                        key={app}
                        type="button"
                        onClick={() => toggleApp(app)}
                        style={{
                          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}>{app}</span>
                        {isSelected ? (
                          <CheckCircle2 size={16} color="var(--accent)" />
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-quaternary)' }}>+ Add</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Compensation & Payroll */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>4. Compensation & Direct Deposit</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Generates employee payroll profile and issues virtual corporate card.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Annual Base Salary (USD)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className="input" style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pay Frequency</label>
                  <select
                    value={formData.payFrequency}
                    onChange={(e) => setFormData({ ...formData, payFrequency: e.target.value })}
                    className="input"
                  >
                    <option value="MONTHLY">Monthly (Last business day)</option>
                    <option value="BIWEEKLY">Bi-weekly (Every other Friday)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Direct Deposit Bank</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Corporate Card Limit</label>
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success-text)' }}>Virtual Spend Card Issued</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success-text)', fontFamily: 'monospace' }}>$5,000 / mo</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Compliance Documents */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>5. E-Signatures & Compliance Pack</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Automated packets dispatched to employee upon creation.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { title: 'Standard Employment Agreement & Offer Letter', status: 'Pre-filled' },
                  { title: 'Proprietary Inventions & Non-Disclosure Agreement (NDA)', status: 'Required' },
                  { title: 'Form W-4 (Federal Employee Tax Withholding)', status: 'Digital E-sign' },
                  { title: 'Company Culture & Security Code of Conduct', status: 'Acknowledgement' },
                ].map((doc, idx) => (
                  <div key={idx} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={20} color="var(--accent)" />
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{doc.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{doc.status}</p>
                      </div>
                    </div>
                    <Badge variant="info">Ready to Dispatch</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 5: Final Review & Launch */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}
            >
              <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>6. Review & Launch Zero-Touch Onboarding</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Clicking launch will write to the employee graph and trigger asynchronous multi-cloud workers.</p>
              </div>

              {/* Summary Card */}
              <div style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--accent-subtle)', background: 'var(--accent-subtle)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar name={`${formData.firstName || 'New'} ${formData.lastName || 'Hire'}`} size="xl" />
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-text)' }}>{formData.firstName} {formData.lastName}</h3>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent)' }}>{formData.roleTitle} • {formData.department}</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{formData.email} • {formData.location}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Annual Base</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--success)', fontFamily: 'monospace' }}>${Number(formData.baseSalary).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Assigned Device</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>MacBook Pro 16"</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Apps Provisioned</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{formData.selectedApps.length} Applications</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Start Date</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{formData.hireDate}</span>
                  </div>
                </div>
              </div>

              {/* Event Bus Banner */}
              <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--warning-border)', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Zap size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-text)' }}>
                  <strong style={{ fontWeight: 700 }}>Automated Pipeline:</strong> Emits <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>employee.hired</code> event → auto-generates 5 onboarding tasks, provisions Google Workspace/Slack, creates payroll profile, and assigns hardware.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Footer Controls */}
        <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 0 || hireMutation.isPending}
            icon={<ArrowLeft size={16} />}
          >
            Previous
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            loading={hireMutation.isPending}
            icon={currentStep === steps.length - 1 ? <Sparkles size={16} /> : <ArrowRight size={16} />}
          >
            {currentStep === steps.length - 1 ? 'Launch Onboarding' : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  );
};
