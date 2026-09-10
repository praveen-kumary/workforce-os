import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 120px)',
      padding: 32, textAlign: 'center',
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <div style={{
          fontSize: '6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em',
          color: 'var(--border-strong)', marginBottom: 8,
        }}>404</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-heading)' }}>Page not found</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 320 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Go Back</button>
          <button className="btn btn-primary" onClick={() => navigate('/')}><Home size={15} /> Dashboard</button>
        </div>
      </motion.div>
    </div>
  );
}
