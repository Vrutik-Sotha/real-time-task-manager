import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Clock, User, RefreshCw, Filter } from 'lucide-react';

const ActivityLogs = () => {
  const { token, API_URL, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('All');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const getActionColor = (action) => {
    if (action.includes('Created')) return 'var(--success)';
    if (action.includes('Deleted')) return 'var(--danger)';
    if (action.includes('Updated') || action.includes('Status')) return 'var(--warning)';
    if (action.includes('Assigned')) return 'var(--info)';
    if (action.includes('Login') || action.includes('Logout')) return 'var(--primary)';
    return 'var(--text-secondary)';
  };

  const getActionIcon = (action) => {
    if (action.includes('Login') || action.includes('Logout')) return '🔑';
    if (action.includes('Created')) return '✨';
    if (action.includes('Deleted')) return '🗑️';
    if (action.includes('Updated') || action.includes('Status')) return '📝';
    if (action.includes('Assigned')) return '👤';
    return '📋';
  };

  const getRoleBadge = (role) => {
    let bg, color;
    switch (role) {
      case 'Admin':
        bg = 'rgba(239, 68, 68, 0.12)';
        color = 'var(--danger)';
        break;
      case 'Team Lead':
        bg = 'rgba(245, 158, 11, 0.12)';
        color = 'var(--warning)';
        break;
      default:
        bg = 'rgba(99, 102, 241, 0.12)';
        color = 'var(--primary)';
        break;
    }
    return (
      <span style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: bg,
        color,
        padding: '1px 6px',
        borderRadius: '3px',
      }}>
        {role}
      </span>
    );
  };

  // Unique action types for filter
  const actionTypes = ['All', ...new Set(logs.map(l => l.action))];

  const filteredLogs = filterAction === 'All'
    ? logs
    : logs.filter(l => l.action === filterAction);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
            Activity Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Monitor all system activity and user actions across the workspace.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{logs.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Total Events</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
            {logs.filter(l => l.action.includes('Created')).length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tasks Created</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
            {logs.filter(l => l.action.includes('Updated') || l.action.includes('Status')).length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Updates Made</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--info)' }}>
            {new Set(logs.map(l => l.user?._id)).size}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Active Users</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filter:</span>
        <select
          className="form-input"
          style={{ height: '36px', padding: '0 12px', width: '200px', background: 'rgba(255,255,255,0.02)', fontSize: '0.85rem' }}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          {actionTypes.map(a => (
            <option key={a} value={a} style={{ background: '#111827' }}>{a}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing {filteredLogs.length} of {logs.length} events
        </span>
      </div>

      {/* Log Timeline */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid rgba(99, 102, 241, 0.1)',
              borderTopColor: 'var(--primary)',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            Loading activity logs...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <ShieldAlert size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p>No activity logs found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '15px',
              top: '0',
              bottom: '0',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--primary), rgba(99, 102, 241, 0.05))',
            }} />

            {filteredLogs.map((log, index) => {
              const actionColor = getActionColor(log.action);
              return (
                <div 
                  key={log._id || index}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '14px 0',
                    position: 'relative',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Timeline dot */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-deep)',
                    border: `2px solid ${actionColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    {getActionIcon(log.action)}
                  </div>

                  {/* Log content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {/* User avatar */}
                      {log.user && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: log.user.avatarColor || '#6366f1',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                        }}>
                          {getInitials(log.user.username)}
                        </div>
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.user?.username || 'System'}
                      </span>
                      {log.user?.role && getRoleBadge(log.user.role)}

                      {/* Action badge */}
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: actionColor,
                        background: `${actionColor}15`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}>
                        {log.action}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                      {log.details}
                    </p>

                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
