import React, { useState } from 'react';
import { Plus, Search, Calendar, User, Trash2, Edit2, AlertTriangle, ArrowUpDown, Clock, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TaskList = ({ tasks, users, onCreateTask, onEditTask, onDeleteTask }) => {
  const { user: currentUser, token, API_URL } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  const canManageTasks = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Team Lead');

  const getInitials = (name) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const getDueDateInfo = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isDueSoon: false };
    if (diffDays === 0) return { label: 'Due today', isOverdue: false, isDueSoon: true };
    if (diffDays <= 2) return { label: `${diffDays}d left`, isOverdue: false, isDueSoon: true };
    return { label: `${diffDays}d left`, isOverdue: false, isDueSoon: false };
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingTaskId(null);

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update task status.');
      }
    } catch (err) {
      console.error('Error updating task status via drag:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDraggingTaskId(null);
  };

  // Filter & Search logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;

    let matchesAssignee = true;
    if (filterAssignee !== 'All') {
      // Support both single assignedTo and array assignees
      if (Array.isArray(task.assignees)) {
        matchesAssignee = task.assignees.some(a => a._id === filterAssignee);
      } else {
        matchesAssignee = task.assignedTo && task.assignedTo._id === filterAssignee;
      }
    }

    return matchesSearch && matchesPriority && matchesAssignee;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const columns = [
    { id: 'Todo', title: 'To Do', color: 'var(--info)', bgHue: '190' },
    { id: 'In Progress', title: 'In Progress', color: 'var(--warning)', bgHue: '38' },
    { id: 'Completed', title: 'Completed', color: 'var(--success)', bgHue: '160' },
  ];

  // Helper: get assignees array regardless of data shape
  const getAssignees = (task) => {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) return task.assignees;
    if (task.assignedTo) return [task.assignedTo];
    return [];
  };

  // Avatar stack: shows up to maxVisible, then "+N" pill
  const AvatarStack = ({ people, maxVisible = 2 }) => {
    const visible = people.slice(0, maxVisible);
    const overflow = people.length - maxVisible;
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {visible.map((person, i) => (
          <div
            key={person._id || i}
            title={person.username}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: person.avatarColor || '#6366f1',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              border: '2px solid var(--bg-card, #111827)',
              marginLeft: i === 0 ? 0 : '-8px',
              zIndex: visible.length - i,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {getInitials(person.username)}
          </div>
        ))}
        {overflow > 0 && (
          <div
            title={`+${overflow} more`}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              border: '2px solid var(--bg-card, #111827)',
              marginLeft: '-8px',
              zIndex: 0,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            +{overflow}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="animate-fade"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', width: '100%', overflowX: 'hidden' }}
    >
      {/* Board Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tasks Board</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {canManageTasks
              ? 'Organize, assign, and manage collaborative team tasks.'
              : 'Drag tasks to update their status. View and manage your assigned work.'}
          </p>
        </div>
        {canManageTasks && (
          <button onClick={onCreateTask} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <Plus size={18} />
            Add New Task
          </button>
        )}
      </div>

      {/* Filter Toolbar Panel */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Priority:</span>
          <select
            className="form-input"
            style={{ height: '40px', padding: '0 12px', width: '110px', background: 'rgba(255,255,255,0.02)' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All" style={{ background: '#111827' }}>All</option>
            <option value="High" style={{ background: '#111827' }}>High</option>
            <option value="Medium" style={{ background: '#111827' }}>Medium</option>
            <option value="Low" style={{ background: '#111827' }}>Low</option>
          </select>
        </div>

        {/* Filter Assignee */}
        {canManageTasks && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Assignee:</span>
            <select
              className="form-input"
              style={{ height: '40px', padding: '0 12px', width: '160px', background: 'rgba(255,255,255,0.02)' }}
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="All" style={{ background: '#111827' }}>All Tasks</option>
              {users.map(u => (
                <option key={u._id} value={u._id} style={{ background: '#111827' }}>{u.username}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sort:</span>
          <button
            onClick={() => setSortBy(prev => prev === 'createdAt' ? 'dueDate' : 'createdAt')}
            className="btn btn-secondary"
            style={{ height: '40px', padding: '0 12px', fontSize: '0.85rem', gap: '6px' }}
          >
            <ArrowUpDown size={14} />
            {sortBy === 'createdAt' ? 'Newest First' : 'Due Date'}
          </button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        alignItems: 'start',
        overflowX: 'auto',
        paddingBottom: '20px'
      }}>
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const isDragTarget = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className="glass-panel"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                padding: '16px',
                background: isDragTarget ? 'rgba(99, 102, 241, 0.08)' : 'rgba(17, 24, 39, 0.4)',
                border: isDragTarget ? '2px dashed rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '450px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Column Title Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{col.title}</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)'
                }}>{colTasks.length}</span>
              </div>

              {/* Task Cards Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexGrow: 1 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    padding: '32px 0',
                    border: isDragTarget
                      ? '1px dashed rgba(99, 102, 241, 0.3)'
                      : '1px dashed rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    {isDragTarget ? '✨ Drop here to move' : 'No tasks here'}
                  </div>
                ) : (
                  colTasks.map(task => {
                    // Priority badge colors
                    let prioColor = 'var(--text-secondary)';
                    let prioBg = 'rgba(255, 255, 255, 0.05)';
                    if (task.priority === 'High') { prioColor = 'var(--danger)'; prioBg = 'rgba(239, 68, 68, 0.1)'; }
                    else if (task.priority === 'Medium') { prioColor = 'var(--warning)'; prioBg = 'rgba(245, 158, 11, 0.1)'; }
                    else if (task.priority === 'Low') { prioColor = 'var(--success)'; prioBg = 'rgba(16, 185, 129, 0.1)'; }

                    const formattedDate = task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : null;

                    const dueDateInfo = getDueDateInfo(task.dueDate, task.status);
                    const isOverdue = dueDateInfo?.isOverdue;
                    const isDueSoon = dueDateInfo?.isDueSoon;
                    const isDragging = draggingTaskId === task._id;

                    const assignees = getAssignees(task);

                    return (
                      <div
                        key={task._id}
                        className="glass-panel task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragEnd={handleDragEnd}
                        style={{
                          padding: '16px',
                          background: isOverdue ? 'rgba(239, 68, 68, 0.04)' : 'rgba(23, 29, 45, 0.65)',
                          position: 'relative',
                          cursor: 'grab',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          opacity: isDragging ? 0.5 : 1,
                          transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                          borderColor: isOverdue ? 'rgba(239, 68, 68, 0.2)' : undefined,
                        }}
                      >
                        {/* ── Row 1: Drag handle + Title + Priority badge ── */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <GripVertical
                            size={14}
                            style={{ color: 'var(--text-muted)', marginTop: '3px', flexShrink: 0, opacity: 0.5 }}
                          />
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, flex: 1 }}>
                            {task.title}
                          </h4>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: prioColor,
                            background: prioBg,
                            padding: '3px 9px',
                            borderRadius: '5px',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                            letterSpacing: '0.04em',
                          }}>
                            {task.priority}
                          </span>
                        </div>

                        {/* ── Row 2: Description ── */}
                        {task.description && (
                          <p style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            margin: 0,
                          }}>
                            {task.description}
                          </p>
                        )}

                        {/* ── Row 3: Due date countdown badge ── */}
                        {dueDateInfo && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: isOverdue
                              ? 'rgba(239, 68, 68, 0.12)'
                              : isDueSoon
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'rgba(255, 255, 255, 0.03)',
                            width: 'fit-content',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: isOverdue
                              ? 'var(--danger)'
                              : isDueSoon
                                ? 'var(--warning)'
                                : 'var(--text-secondary)',
                            border: `1px solid ${isOverdue
                              ? 'rgba(239,68,68,0.2)'
                              : isDueSoon
                                ? 'rgba(245,158,11,0.2)'
                                : 'rgba(255,255,255,0.04)'}`,
                          }}>
                            {isOverdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
                            {dueDateInfo.label}
                          </div>
                        )}

                        {/* ── Divider ── */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0' }} />

                        {/* ── Row 4: Due date + Category tag ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }} />
                            <span style={{
                              fontSize: '0.75rem',
                              color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)',
                              fontWeight: isOverdue ? 600 : 400,
                            }}>
                              {formattedDate || 'No date'}
                            </span>
                          </div>

                          {/* Category / tag badge (optional field) */}
                          {task.category && (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: 'var(--info, #38bdf8)',
                              background: 'rgba(56,189,248,0.08)',
                              border: '1px solid rgba(56,189,248,0.2)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}>
                              {task.category}
                            </span>
                          )}

                          {/* Completed badge */}
                          {task.status === 'Completed' && task.completionDate && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: 'var(--success)',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}>
                              ✓ Done
                            </span>
                          )}
                        </div>

                        {/* ── Row 5: Assignees + Creator (left) | Edit/Delete (right, same line) ── */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>

                          {/* Left: avatar groups */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Assignees */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Assignees
                              </span>
                              {assignees.length > 0 ? (
                                <AvatarStack people={assignees} maxVisible={2} />
                              ) : (
                                <div title="Unassigned" style={{
                                  width: '28px', height: '28px', borderRadius: '50%',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  color: 'var(--text-muted)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '1.5px dashed rgba(255,255,255,0.1)',
                                }}>
                                  <User size={12} />
                                </div>
                              )}
                            </div>

                            {/* Creator */}
                            {task.creator && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  Assigned by
                                </span>
                                <div
                                  title={`Creator: ${task.creator.username}`}
                                  style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    backgroundColor: task.creator.avatarColor || '#10b981',
                                    color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', fontWeight: 700,
                                    border: '2px solid var(--bg-card, #111827)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {getInitials(task.creator.username)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: Edit / Delete — always in DOM, invisible until hover, no layout shift */}
                          {canManageTasks && (
                            <div
                              className="task-actions"
                              style={{
                                display: 'flex',
                                gap: '6px',
                                alignItems: 'center',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.15s ease',
                                flexShrink: 0,
                              }}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  background: 'var(--bg-deep)',
                                  border: '1px solid var(--border-glow)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 500,
                                }}
                              >
                                <Edit2 size={11} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task._id); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: 'var(--danger)',
                                  cursor: 'pointer',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 500,
                                }}
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .task-card:hover .task-actions {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .task-card:hover {
          border-color: rgba(99, 102, 241, 0.4) !important;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.18) !important;
          transform: translateY(-2px);
        }
        .task-card[draggable="true"] {
          cursor: grab;
        }
        .task-card[draggable="true"]:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default TaskList;
