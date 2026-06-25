import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, ListTodo, Activity, Award, Calendar, AlertCircle, Users, Shield, Clock, TrendingUp, BarChart3 } from 'lucide-react';

const Dashboard = ({ tasks, users, setActiveTab }) => {
  const { user: currentUser, notifications, token, API_URL } = useAuth();
  const [activityLogs, setActivityLogs] = useState([]);

  const isAdminOrLead = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Team Lead');

  // Fetch activity logs for admin panel
  useEffect(() => {
    if (isAdminOrLead && token) {
      const fetchLogs = async () => {
        try {
          const res = await fetch(`${API_URL}/activities`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setActivityLogs(data.logs.slice(0, 8)); // Latest 8
          }
        } catch (err) {
          console.error('Error fetching logs:', err);
        }
      };
      fetchLogs();
    }
  }, [isAdminOrLead, token]);

  // Statistics calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'Todo').length;

  const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority count
  const highPriority = tasks.filter(t => t.priority === 'High').length;
  const mediumPriority = tasks.filter(t => t.priority === 'Medium').length;
  const lowPriority = tasks.filter(t => t.priority === 'Low').length;

  // Overdue tasks
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => 
    t.dueDate && t.status !== 'Completed' && new Date(t.dueDate) < now
  );

  // Filter out offline and online users
  const onlineUsers = users.filter(u => u.isOnline);
  const totalUsers = users.length;

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const getActionColor = (action) => {
    if (action?.includes('Created')) return 'var(--success)';
    if (action?.includes('Deleted')) return 'var(--danger)';
    if (action?.includes('Updated') || action?.includes('Status')) return 'var(--warning)';
    if (action?.includes('Assigned')) return 'var(--info)';
    return 'var(--primary)';
  };

  const formatTimeAgo = (timestamp) => {
    const d = new Date(timestamp);
    const seconds = Math.floor((new Date() - d) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '100%' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Workspace Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time overview of tasks, team activity, and progress.</p>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Calendar size={16} color="var(--primary)" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {/* Total Tasks */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Tasks</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px' }}>{totalTasks}</h3>
          </div>
        </div>

        {/* Todo Tasks */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--info)' }}>
            <ListTodo size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>To Do</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px' }}>{todoTasks}</h3>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>In Progress</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px' }}>{inProgressTasks}</h3>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Completed</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px' }}>{completedTasks}</h3>
          </div>
        </div>

        {/* Overdue */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Overdue</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px', color: overdueTasks.length > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {overdueTasks.length}
            </h3>
          </div>
        </div>

        {/* Active Users (Admin/Lead only) */}
        {isAdminOrLead && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <Users size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Users</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2px' }}>
                {onlineUsers.length}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/{totalUsers}</span>
              </h3>
            </div>
          </div>
        )}
      </div>

      {/* Main Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Side: Analytics & Priority distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Progress Overview Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              Completion Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Circular Progress (CSS simulation) */}
              <div style={{
                position: 'relative',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(var(--primary) ${completedPercentage * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute',
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  background: 'var(--bg-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem'
                }}>
                  {completedPercentage}%
                </div>
              </div>
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>You've finished {completedTasks} out of {totalTasks} tasks!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Keep going! {totalTasks - completedTasks} more task{totalTasks - completedTasks === 1 ? '' : 's'} remaining to achieve full completion.
                </p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="btn btn-primary"
                  style={{ marginTop: '16px', padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Go to Tasks Board
                </button>
              </div>
            </div>
          </div>

          {/* Priority Breakdowns */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} style={{ color: 'var(--warning)' }} />
              Priority Classification
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* High Priority Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                    High Priority
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{highPriority} tasks</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (highPriority / totalTasks) * 100 : 0}%`,
                    background: 'var(--danger)',
                    boxShadow: '0 0 8px var(--danger-glow)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>

              {/* Medium Priority Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)' }} />
                    Medium Priority
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{mediumPriority} tasks</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (mediumPriority / totalTasks) * 100 : 0}%`,
                    background: 'var(--warning)',
                    boxShadow: '0 0 8px var(--warning-glow)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>

              {/* Low Priority Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                    Low Priority
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{lowPriority} tasks</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (lowPriority / totalTasks) * 100 : 0}%`,
                    background: 'var(--success)',
                    boxShadow: '0 0 8px var(--success-glow)',
                    borderRadius: '4px',
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Tasks Panel (shown when overdue tasks exist) */}
          {overdueTasks.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                Overdue Tasks ({overdueTasks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overdueTasks.slice(0, 5).map(task => {
                  const daysOverdue = Math.ceil((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={task._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.04)',
                      border: '1px solid rgba(239, 68, 68, 0.08)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {task.assignedTo?.username || 'Unassigned'}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: task.priority === 'High' ? 'var(--danger)' : task.priority === 'Medium' ? 'var(--warning)' : 'var(--success)',
                          }}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--danger)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                      }}>
                        {daysOverdue}d overdue
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Users, Activity Feed, & Admin Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Online Team Members */}
          <div className="glass-panel" style={{ padding: '20px', maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--success)' }} />
              Online Team ({onlineUsers.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
              {onlineUsers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
                  No other members online
                </div>
              ) : (
                onlineUsers.map(user => (
                  <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: user.avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '0.75rem',
                      position: 'relative'
                    }}>
                      {getInitials(user.username)}
                      <span className="pulse-dot" style={{ position: 'absolute', bottom: 0, right: 0, width: '6px', height: '6px', border: '1px solid var(--bg-deep)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.username}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user.role || 'Member'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time Activity Feed (Notifications) */}
          <div className="glass-panel" style={{ padding: '20px', height: '310px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
              Activity Feed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexGrow: 1, paddingRight: '4px' }}>
              {notifications.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <Award size={36} style={{ strokeWidth: 1.5 }} />
                  <span style={{ fontSize: '0.85rem' }}>No recent activity to report. All quiet here!</span>
                </div>
              ) : (
                notifications.slice(0, 10).map(notif => {
                  let badgeColor = 'var(--primary)';
                  if (notif.type === 'assignment') badgeColor = 'var(--info)';
                  if (notif.type === 'completion') badgeColor = 'var(--success)';
                  if (notif.type === 'update') badgeColor = 'var(--warning)';

                  return (
                    <div key={notif._id || notif.id} style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      borderLeft: `3px solid ${badgeColor}`,
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start'
                    }}>
                      <AlertCircle size={14} style={{ color: badgeColor, marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{notif.message}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Admin Activity Logs Stream (Admin/Lead only) */}
          {isAdminOrLead && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} style={{ color: 'var(--primary)' }} />
                  Recent Admin Logs
                </h3>
                <button
                  onClick={() => setActiveTab('activities')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    color: 'var(--primary)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'; }}
                >
                  View All →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {activityLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                    No activity logs recorded yet.
                  </div>
                ) : (
                  activityLogs.map((log, idx) => (
                    <div key={log._id || idx} style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                      borderLeft: `2px solid ${getActionColor(log.action)}`,
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: log.user?.avatarColor || '#6366f1',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '1px',
                      }}>
                        {getInitials(log.user?.username)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          <span style={{ fontWeight: 600 }}>{log.user?.username}</span>
                          {' '}
                          <span style={{ color: 'var(--text-secondary)' }}>{log.details}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
