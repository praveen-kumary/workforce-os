import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Plus, X } from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { KnowledgeArticle } from '../lib/types';

const CAT_COLORS: Record<string, string> = {
  Onboarding: '#16a34a',
  Engineering: '#2563eb',
  Finance: '#d97706',
  HR: '#7c3aed',
  IT: '#dc2626',
  Marketing: '#0891b2',
  Sales: '#6366f1',
};

export function Knowledge() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Engineering',
    content: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['knowledge-articles', category, search],
    queryFn: () => workplaceApi.getArticles(category, search),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => workplaceApi.createArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      addToast({ title: 'Article published to wiki' });
      setShowModal(false);
      setNewArticle({ title: '', category: 'Engineering', content: '' });
    },
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Knowledge Base</h1>
          <p className="page-subtitle">
            {articles.length} internal documentation guides and policies
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Article
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            className="input"
            placeholder="Search wiki articles by topic or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {['ALL', 'Onboarding', 'Engineering', 'Finance', 'HR', 'IT', 'Marketing', 'Sales'].map((c) => {
            const isSelected = category === c;
            return (
              <button
                key={c}
                type="button"
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)' }}
                onClick={() => setCategory(c)}
              >
                {c === 'ALL' ? 'All Categories' : c}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No articles found</h3>
          <p>Create your first internal wiki article or policy guide.</p>
        </div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {articles.map((article: KnowledgeArticle, i: number) => {
            const color = CAT_COLORS[article.category] || '#2563eb';
            return (
              <motion.div
                key={article.id}
                className="card card-interactive"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: `${color}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color,
                    }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="badge" style={{ background: `${color}14`, color }}>
                      {article.category}
                    </span>
                    {article.isPinned && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--accent)', marginLeft: 6, fontWeight: 700 }}>
                        PINNED
                      </span>
                    )}
                  </div>
                </div>

                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)', marginBottom: 6 }}>
                  {article.title}
                </h4>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                  {article.content.slice(0, 95)}...
                </p>

                <div className="flex-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                  <span>{article.authorName}</span>
                  <span>{article.views} views</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Article Viewer Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 600 }}
            >
              <div className="modal-header">
                <div>
                  <span className="badge badge-info" style={{ marginBottom: 4 }}>
                    {selectedArticle.category}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedArticle.title}</h3>
                </div>
                <button className="btn-ghost btn-icon" onClick={() => setSelectedArticle(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {selectedArticle.content}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedArticle(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Article Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 520 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>New Wiki Article</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Article Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Infrastructure Deployment Runbook"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select"
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Content / Documentation</label>
                  <textarea
                    className="textarea"
                    rows={6}
                    placeholder="Write your article documentation and instructions..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newArticle.title || !newArticle.content || createMutation.isPending}
                  onClick={() => createMutation.mutate(newArticle)}
                >
                  {createMutation.isPending ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Knowledge;
