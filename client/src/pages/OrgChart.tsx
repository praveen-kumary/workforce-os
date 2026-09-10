import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, UserPlus, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { coreApi } from '../lib/api';

const fetchOrgChart = () => coreApi.getOrgChart();



const DEPT_COLORS: Record<string, string> = {
  Executive: '#7c3aed',
  Engineering: '#2563eb',
  People: '#16a34a',
  Finance: '#d97706',
  Sales: '#0891b2',
  Marketing: '#ec4899',
};

interface OrgNodeProps { node: any; depth?: number; }

const OrgTreeNode: React.FC<OrgNodeProps> = ({ node, depth = 0 }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubordinates = node.subordinates && node.subordinates.length > 0;
  const accentColor = DEPT_COLORS[node.department] || 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node Card */}
      <div
        onClick={() => navigate(`/employees/${node.id}`)}
        style={{
          width: 240, padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
          background: depth === 0 ? 'var(--accent-subtle)' : 'var(--bg-primary)',
          border: `1.5px solid ${depth === 0 ? 'var(--accent-muted)' : 'var(--border)'}`,
          boxShadow: 'var(--shadow-card)', position: 'relative',
          transition: 'all 0.2s var(--ease-spring)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={`${node.firstName} ${node.lastName}`} src={node.avatarUrl} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.firstName} {node.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.roleTitle}
            </div>
            <div style={{
              fontSize: '0.625rem', fontWeight: 700, color: accentColor,
              textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2,
            }}>
              {node.department}
            </div>
          </div>
        </div>

        {hasSubordinates && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            style={{
              position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
              width: 24, height: 24, borderRadius: 12, cursor: 'pointer',
              background: 'var(--bg-primary)', border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)', zIndex: 10, color: 'var(--text-tertiary)',
              transition: 'all 0.15s',
            }}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasSubordinates && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ position: 'relative', paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Vertical line from parent */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 2, height: 24, background: 'var(--border-strong)',
            }} />

            <div style={{ display: 'flex', gap: 32, position: 'relative' }}>
              {/* Horizontal line across children */}
              {node.subordinates.length > 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: 120, right: 120,
                  height: 2, background: 'var(--border-strong)',
                }} />
              )}

              {node.subordinates.map((sub: any) => (
                <div key={sub.id} style={{ position: 'relative', paddingTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 2, height: 24, background: 'var(--border-strong)',
                  }} />
                  <OrgTreeNode node={sub} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OrgChart: React.FC = () => {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: apiData = [], isLoading } = useQuery({
    queryKey: ['org-chart'],
    queryFn: fetchOrgChart,
  });

  const treeData = apiData.length > 0 ? apiData : [];

  return (
    <div>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-heading)' }}>
              Organization
            </h1>
            <Badge variant="info" dot>Live</Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
            Visual reporting tree connecting executives, department heads, and team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: 4, borderRadius: 10, background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))}
              style={{
                padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-tertiary)',
              }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
              padding: '0 6px', fontFamily: 'monospace',
            }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
              style={{
                padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-tertiary)',
              }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              style={{
                padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-tertiary)', marginLeft: 2,
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <Button variant="primary" size="sm" leftIcon={<UserPlus size={15} />} onClick={() => navigate('/onboarding/new')}>
            Add Member
          </Button>
        </div>
      </div>

      {/* Tree Canvas */}
      <Card padding={false} style={{ padding: 48, overflow: 'auto', minHeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <Skeleton variant="rectangular" style={{ height: 80, width: 240, borderRadius: 14 }} />
            <div style={{ display: 'flex', gap: 32 }}>
              <Skeleton variant="rectangular" style={{ height: 80, width: 240, borderRadius: 14 }} />
              <Skeleton variant="rectangular" style={{ height: 80, width: 240, borderRadius: 14 }} />
            </div>
          </div>
        ) : (
          <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {treeData.map((rootNode: any) => (
              <OrgTreeNode key={rootNode.id} node={rootNode} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
