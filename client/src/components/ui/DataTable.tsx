import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Database } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, emptyMessage = 'No data found', onRowClick, isLoading, pageSize, emptyTitle, emptyDescription,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const displayData = useMemo(() => {
    if (!pageSize) return sorted;
    return sorted.slice(0, pageSize);
  }, [sorted, pageSize]);

  if (isLoading) {
    return (
      <div style={{
        background: 'var(--bg-primary)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: 'var(--shadow-card)', overflow: 'hidden',
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 48, margin: '1px 0' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{
      overflow: 'auto', background: 'var(--bg-primary)',
      border: '1px solid var(--border)', borderRadius: 12,
      boxShadow: 'var(--shadow-card)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap', width: col.width,
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {col.header}
                  {col.sortable && (
                    sortKey === col.key
                      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      : <ChevronsUpDown size={12} color="var(--text-quaternary)" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{
                padding: '48px 16px', textAlign: 'center', color: 'var(--text-tertiary)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-quaternary)',
                  }}>
                    <Database size={18} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {emptyTitle || emptyMessage}
                  </div>
                  {emptyDescription && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-quaternary)', maxWidth: 280 }}>
                      {emptyDescription}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            displayData.map((row, i) => (
              <tr
                key={(row as any).id || i}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: '1px solid var(--border-light)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
              >
                {columns.map(col => (
                  <td key={col.key} style={{
                    padding: '11px 16px', fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)', verticalAlign: 'middle',
                  }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
