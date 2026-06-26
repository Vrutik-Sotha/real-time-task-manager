import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckSquare, MessageSquare, LogOut, ShieldAlert } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare },
  ];

  if (user && (user.role === 'Admin' || user.role === 'Team Lead')) {
    navItems.push({ id: 'activities', label: 'Activity Logs', icon: ShieldAlert });
  }

  return (
    <aside className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '260px',
      height: 'calc(100vh - 40px)',
      padding: '24px 16px',
      margin: '20px 0 20px 20px',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '20px',
      zIndex: 10
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--info) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px var(--primary-glow)'
        }}>
          <CheckSquare size={20} color="#fff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          TaskFlow
        </span>
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'var(--transition-smooth)',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              }}
              className={!isActive ? 'sidebar-btn-hover' : ''}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile Card */}
      {user && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: user.avatarColor || 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.95rem',
              boxShadow: `0 0 10px ${user.avatarColor}40`,
              position: 'relative'
            }}>
              {getInitials(user.username)}
              <span 
                className="pulse-dot" 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  border: '2px solid var(--bg-deep)'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.username}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.role || 'Member'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: 'var(--danger)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      {/* Adding custom styling for hover buttons directly via styles tag */}
      <style>{`
        .sidebar-btn-hover:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          color: var(--text-primary) !important;
          transform: translateX(4px);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
