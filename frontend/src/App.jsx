import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import ChatRoom from './components/ChatRoom';
import LoginRegister from './components/LoginRegister';
import ActivityLogs from './components/ActivityLogs';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import TeamManagement from "./components/TeamManagement";

function App() {
  const { 
    user, 
    token, 
    loading, 
    socket, 
    users, 
    fetchUsers, 
    notifications,
    unreadCount,
    toastAlerts,
    clearToastAlert,
    markAllAsRead,
    markAsRead,
    API_URL 
  } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Notification dropdown state
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all tasks
  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUsers();
    }
  }, [user, token]);

  // Socket.io Real-Time Task State Synchronizer
  useEffect(() => {
    if (!socket || !user) return;

    const getId = (value) => {
      if (!value) return '';
      return typeof value === 'string' ? value : value._id || value.id || '';
    };

    const canViewTask = (task) => {
      if (!task) return false;
      if (user.role === 'Admin' || user.role === 'Team Lead') return true;

      const userId = user._id || user.id;
      return [task.creator, task.assignedTo, task.taskOwner]
        .some((value) => getId(value) === userId);
    };

    const handleTaskCreated = (data) => {
      if (!canViewTask(data.task)) return;
      setTasks((prev) => {
        // Prevent duplicate appending
        if (prev.some(t => t._id === data.task._id)) return prev;
        return [data.task, ...prev];
      });
    };

    const handleTaskUpdated = (data) => {
      setTasks((prev) => {
        if (!canViewTask(data.task)) {
          return prev.filter(t => t._id !== data.task._id);
        }
        if (prev.some(t => t._id === data.task._id)) {
          return prev.map(t => t._id === data.task._id ? data.task : t);
        }
        return [data.task, ...prev];
      });
    };

    const handleTaskDeleted = (data) => {
      setTasks((prev) => prev.filter(t => t._id !== data.taskId));
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [socket, user]);

  // CRUD API Handlers
  const handleCreateOrUpdateTask = async (taskData) => {
    try {
      let url = `${API_URL}/tasks`;
      let method = 'POST';
      
      if (selectedTask) {
        url = `${API_URL}/tasks/${selectedTask._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      
      const data = await res.json();
      if (data.success) {
        // Close modal
        setIsModalOpen(false);
        setSelectedTask(null);
      } else {
        alert(data.message || 'Failed to save task.');
      }
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Error saving task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to delete task.');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const openCreateModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Get notification type color
  const getNotifTypeColor = (type) => {
    switch (type) {
      case 'assignment': return 'var(--info)';
      case 'completion': return 'var(--success)';
      case 'update': return 'var(--warning)';
      case 'chat': return 'var(--primary)';
      case 'mention': return '#f472b6';
      default: return 'var(--text-secondary)';
    }
  };

  // Loading Screen Spinner
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        backgroundColor: 'var(--bg-deep)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Synchronizing Workspace...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return <LoginRegister />;
  }

  // Logged In Application Scaffold
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Navbar with Notification Bell */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '12px 24px',
          gap: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        }}>
          {/* User role badge */}
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: user.role === 'Admin' ? 'var(--danger)' : user.role === 'Team Lead' ? 'var(--warning)' : 'var(--primary)',
            background: user.role === 'Admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'Team Lead' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
          }}>
            {user.role || 'Member'}
          </span>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              id="notification-bell"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                position: 'relative',
                background: showNotifDropdown ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '8px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!showNotifDropdown) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px var(--danger-glow)',
                  animation: 'pulseGlow 2s infinite ease-in-out',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div 
                className="glass-panel animate-scale"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '380px',
                  maxHeight: '480px',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 100,
                  overflow: 'hidden',
                  background: 'rgba(11, 15, 25, 0.97)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.08)',
                }}
              >
                {/* Dropdown Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    Notifications
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        marginLeft: '8px',
                      }}>
                        ({unreadCount} new)
                      </span>
                    )}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        color: 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      }}
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}>
                      <Bell size={32} style={{ marginBottom: '10px', opacity: 0.2 }} />
                      <p style={{ fontSize: '0.85rem' }}>No notifications yet</p>
                      <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        You'll be notified about task assignments and updates.
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 30).map((notif) => {
                      const typeColor = getNotifTypeColor(notif.type);
                      return (
                        <div
                          key={notif._id}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                            background: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.03)',
                            cursor: notif.isRead ? 'default' : 'pointer',
                            transition: 'background 0.2s ease',
                          }}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif._id);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.03)';
                          }}
                        >
                          {/* Type indicator dot */}
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: typeColor,
                            marginTop: '6px',
                            flexShrink: 0,
                            boxShadow: notif.isRead ? 'none' : `0 0 6px ${typeColor}`,
                          }} />

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.82rem',
                              color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                              fontWeight: notif.isRead ? 400 : 500,
                              lineHeight: 1.4,
                              margin: 0,
                            }}>
                              {notif.message}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' · '}
                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span style={{
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: typeColor,
                              }}>
                                {notif.type}
                              </span>
                            </div>
                          </div>

                          {/* Read indicator */}
                          {!notif.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif._id);
                              }}
                              title="Mark as read"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Tab Content panel */}
        <main style={{ flexGrow: 1, display: 'flex', minWidth: 0, overflow: 'auto' }}>
          {activeTab === 'dashboard' && <Dashboard tasks={tasks} users={users} setActiveTab={setActiveTab} />}
          {activeTab === 'tasks' && (
            <TaskList 
              tasks={tasks} 
              users={users} 
              onCreateTask={openCreateModal}
              onEditTask={openEditModal}
              onDeleteTask={handleDeleteTask}
            />
          )}
          {activeTab === 'chat' && <ChatRoom users={users} />}
          {activeTab === 'activities' && <ActivityLogs />}
          {activeTab === "team" && (
    <TeamManagement />
)}
        </main>
      </div>

      {/* Floating Real-Time Toast Notifications List */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
        maxWidth: '320px'
      }}>
        {toastAlerts.slice(0, 3).map((notif) => {
          let accent = 'var(--primary)';
          if (notif.type === 'success') accent = 'var(--success)';
          if (notif.type === 'danger') accent = 'var(--danger)';

          return (
            <div 
              key={notif.id} 
              className="glass-panel animate-scale"
              style={{
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.9)',
                borderLeft: `4px solid ${accent}`,
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Activity Alert</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {notif.message}
                </span>
              </div>
              <button 
                onClick={() => clearToastAlert(notif.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Task Creation/Editing Modal Dialog */}
      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
        onSave={handleCreateOrUpdateTask}
        task={selectedTask}
        users={users}
      />
    </div>
  );
}

export default App;
