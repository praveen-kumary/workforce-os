import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toaster';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowApi } from '../lib/api';

const fetchWorkflows = () => workflowApi.getWorkflows();
const fetchExecutions = () => workflowApi.getExecutions();

const listVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
};

export const WorkflowStudio: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('rules');
  const [showBuilder, setShowBuilder] = useState(false);

  // New Rule Form
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    triggerType: 'employee.hired',
    conditionField: 'department',
    conditionOperator: 'equals',
    conditionValue: 'Engineering',
    actions: [
      { type: 'provision_app', params: { appName: 'GitHub Enterprise' } },
      { type: 'assign_device', params: { make: 'Apple', model: 'MacBook Pro 16"' } },
    ],
  });

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });

  const { data: executions = [], isLoading: loadingExecutions } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: fetchExecutions,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => workflowApi.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast('Workflow rule status updated', 'success');
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ ruleId, employeeId }: { ruleId: string; employeeId: string }) =>
      workflowApi.testWorkflow(ruleId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast('⚡ Workflow executed successfully across HR, IT, and Finance!', 'success');
    },
    onError: () => {
      toast('Failed to test workflow.', 'error');
    },
  });

  const createMutation = useMutation({
    mutationFn: () => workflowApi.createWorkflow({
      name: newRule.name,
      description: newRule.description,
      triggerType: newRule.triggerType,
      conditions: [
        { field: newRule.conditionField, operator: newRule.conditionOperator, value: newRule.conditionValue }
      ],
      actions: newRule.actions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast('New workflow automation rule deployed!', 'success');
      setShowBuilder(false);
      setNewRule({
        name: '',
        description: '',
        triggerType: 'employee.hired',
        conditionField: 'department',
        conditionOperator: 'equals',
        conditionValue: 'Engineering',
        actions: [{ type: 'provision_app', params: { appName: 'GitHub Enterprise' } }],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowApi.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast('Workflow deleted', 'info');
    },
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              Workflow Studio
            </h1>
            <Badge variant="workflow" dot pulse>
              Live Automator Engine
            </Badge>
          </div>
          <p className="page-subtitle mt-1">
            Build zero-code triggers and multi-cloud actions across HR, IT, and Finance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="workflow"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowBuilder(!showBuilder)}
          >
            {showBuilder ? 'Close Builder' : 'New Automation Recipe'}
          </Button>
        </div>
      </div>

      {/* Builder Modal / Accordion */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 md:p-8 space-y-6" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Visual Automation Rule Builder</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Configure trigger conditions and multi-system execution steps.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>Recipe Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Auto-Enroll Full-Time Hires in Platinum Health Plan"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Automatically assigns health coverage upon onboarding completion."
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Visual Flow Blocks */}
              <div className="space-y-4">
                {/* 1. WHEN (Trigger) */}
                <div className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-white font-extrabold text-xs uppercase tracking-wider" style={{ backgroundColor: 'var(--info)' }}>
                      WHEN
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>System Event Fires:</span>
                  </div>
                  <select
                    value={newRule.triggerType}
                    onChange={(e) => setNewRule({ ...newRule, triggerType: e.target.value })}
                    className="input font-bold"
                    style={{ color: 'var(--info)' }}
                  >
                    <option value="employee.hired">Employee is Hired (employee.hired)</option>
                    <option value="employee.terminated">Employee is Terminated (employee.terminated)</option>
                    <option value="leave.approved">Leave is Approved (leave.approved)</option>
                    <option value="expense.submitted">Expense is Submitted (expense.submitted)</option>
                    <option value="employee.promoted">Employee is Promoted (employee.promoted)</option>
                  </select>
                </div>

                {/* 2. IF (Condition) */}
                <div className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md text-white font-extrabold text-xs uppercase tracking-wider" style={{ backgroundColor: 'var(--accent)' }}>
                      IF
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Target Condition Matches:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={newRule.conditionField}
                      onChange={(e) => setNewRule({ ...newRule, conditionField: e.target.value })}
                      className="input py-2 text-xs"
                    >
                      <option value="department">Department</option>
                      <option value="employmentType">Employment Type</option>
                      <option value="roleTitle">Role Title</option>
                      <option value="location">Location</option>
                    </select>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>EQUALS</span>
                    <input
                      type="text"
                      value={newRule.conditionValue}
                      onChange={(e) => setNewRule({ ...newRule, conditionValue: e.target.value })}
                      className="input py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 3. THEN (Actions) */}
                <div className="p-4 rounded-xl space-y-3 bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider">
                        THEN
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Execute Multi-System Actions:</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {newRule.actions.map((act, i) => (
                      <div key={i} className="p-3 rounded-lg flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Action {i + 1}:</span>
                          <span className="font-mono" style={{ color: 'var(--warning)' }}>{act.type}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>({JSON.stringify(act.params)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowBuilder(false)}>
                  Cancel
                </Button>
                <Button
                  variant="workflow"
                  size="md"
                  onClick={() => createMutation.mutate()}
                  isLoading={createMutation.isPending}
                  disabled={!newRule.name}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Deploy Automation Recipe
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Tabs
          tabs={[
            { id: 'rules', label: 'Active Automation Rules', icon: <Zap className="w-4 h-4" />, badge: workflows.length },
            { id: 'executions', label: 'Live Execution Logs', icon: <Layers className="w-4 h-4" />, badge: executions.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          module="workflow"
        />
      </div>

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-4">
          {isLoading ? (
            <Skeleton variant="card" count={3} />
          ) : workflows.length === 0 ? (
            <EmptyState icon={<Zap className="w-8 h-8"/>} title="No Workflows" description="No workflow rules deployed yet. Click 'New Automation Recipe' above to create one." />
          ) : (
            workflows.map((wf: any) => {
              const actions = Array.isArray(wf.actions) ? wf.actions : [];

              return (
                <motion.div key={wf.id} variants={itemVariant}>
                  <Card
                    className="p-6 transition-all duration-300 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{wf.name}</h3>
                          <Badge variant={wf.isActive ? 'workflow' : 'inactive'} dot pulse={wf.isActive}>
                            {wf.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        {wf.description && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{wf.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Test trigger button */}
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Play className="w-3.5 h-3.5 text-amber-400" />}
                          onClick={() => testMutation.mutate({ ruleId: wf.id, employeeId: 'jane-doe-id' })}
                          isLoading={testMutation.isPending}
                        >
                          Simulate
                        </Button>

                        <Button
                          variant={wf.isActive ? 'secondary' : 'workflow'}
                          size="xs"
                          onClick={() => toggleMutation.mutate(wf.id)}
                        >
                          {wf.isActive ? 'Disable' : 'Enable'}
                        </Button>

                        <button
                          onClick={() => deleteMutation.mutate(wf.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
                          title="Delete Rule"
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Flow Steps Pills */}
                    <div className="p-3.5 rounded-xl flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div className="flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-lg shrink-0" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--accent)', border: '1px solid var(--info-border)' }}>
                        <Zap className="w-3.5 h-3.5" />
                        <span>{wf.triggerType}</span>
                      </div>

                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />

                      {actions.map((act: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-lg shrink-0" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                            <span>{act.type}</span>
                          </div>
                          {idx < actions.length - 1 && (
                            <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Executions: <strong style={{ color: 'var(--text-secondary)' }}>{wf.executionCount || 0} times</strong></span>
                      <span>Created by <strong style={{ color: 'var(--text-secondary)' }}>{wf.createdBy}</strong></span>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* EXECUTIONS TAB */}
      {activeTab === 'executions' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Automation Execution History</h3>
            <Badge variant="workflow">{executions.length} Events Processed</Badge>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar" style={{ borderColor: 'var(--border-light)' }}>
            {loadingExecutions ? (
              <div className="p-8">
                <Skeleton variant="table-row" count={4} />
              </div>
            ) : executions.length === 0 ? (
              <EmptyState icon={<Layers className="w-8 h-8"/>} title="No Executions" description="No executions recorded yet. Click 'Simulate' on any workflow rule to test live triggers!" />
            ) : (
              executions.map((exec: any) => (
                <motion.div key={exec.id} variants={itemVariant} className="p-4 flex items-center justify-between transition-colors hover:bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{exec.rule?.name || 'Automation Event'}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        Triggered by <code className="font-mono" style={{ color: 'var(--accent)' }}>{exec.triggeredBy}</code> for {exec.employee?.firstName} {exec.employee?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">{exec.status}</Badge>
                    <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(exec.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </Card>
      )}
    </div>
  );
};
