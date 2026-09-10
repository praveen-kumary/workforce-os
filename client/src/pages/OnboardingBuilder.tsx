import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toaster';
import { useMutation } from '@tanstack/react-query';
import { GripVertical, Plus, Trash2, CheckCircle, Mail, Laptop, Save, Loader2 } from 'lucide-react';
import { hrApi } from '../lib/api';

const initialSteps = [
  { id: 'step-1', type: 'email', title: 'Send Welcome Email', description: 'Auto-send day 1 info' },
  { id: 'step-2', type: 'device', title: 'Provision Laptop', description: 'Trigger IT asset request' },
  { id: 'step-3', type: 'task', title: 'Manager 1:1', description: 'Schedule introductory meeting' },
];

function SortableItem({ id, step, onRemove }: { id: string; step: any; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = step.type === 'email' ? Mail : step.type === 'device' ? Laptop : CheckCircle;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        background: 'var(--bg-secondary)',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-quaternary)',
          cursor: 'grab',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <GripVertical size={18} />
      </button>

      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-subtle)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)', margin: 0 }}>
          {step.title}
        </h4>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
          {step.description}
        </p>
      </div>

      <button
        onClick={() => onRemove(id)}
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-quaternary)',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 'var(--radius-sm)',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-quaternary)')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export const OnboardingBuilder: React.FC = () => {
  const [steps, setSteps] = useState(initialSteps);
  const [templateName, setTemplateName] = useState('Standard Company Onboarding');
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      hrApi.saveOnboardingTemplate({
        name: templateName,
        department: 'All',
        steps: steps.map((s) => s.title),
      }),
    onSuccess: () => {
      addToast({
        title: 'Template Saved',
        description: 'Onboarding template saved to database successfully!',
        type: 'success',
      });
    },
    onError: (err: any) => {
      addToast({
        title: 'Error',
        description: err.message || 'Failed to save template.',
        type: 'error',
      });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        type: 'task',
        title: 'New Onboarding Step',
        description: 'Configure automated provisioning or verification task',
      },
    ]);
  };

  return (
    <div className="page-content" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="input"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--border-light)',
              borderRadius: 0,
              padding: '4px 0',
              maxWidth: 400,
            }}
          />
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6 }}>
            Drag and drop to configure the automated workforce onboarding sequence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" leftIcon={<Plus size={15} />} onClick={addStep}>
            Add Step
          </Button>
          <Button
            variant="primary"
            leftIcon={saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Template
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ padding: 'var(--space-4)' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div>
                {steps.map((step) => (
                  <SortableItem
                    key={step.id}
                    id={step.id}
                    step={step}
                    onRemove={(id: string) => setSteps((s) => s.filter((i) => i.id !== id))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </Card>
    </div>
  );
};
export default OnboardingBuilder;
