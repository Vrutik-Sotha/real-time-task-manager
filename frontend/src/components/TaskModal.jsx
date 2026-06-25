import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, onSave, task, users }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Todo');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'Todo');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setAssignedTo(task.assignedTo ? task.assignedTo._id || task.assignedTo : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('Todo');
      setDueDate('');
      setAssignedTo('');
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-scale" 
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          position: 'relative',
          background: 'rgba(20, 26, 42, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px', background: 'linear-gradient(to right, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {task ? 'Edit Task Details' : 'Create New Task'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., Implement Socket.io handler"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Description</label>
            <textarea
              placeholder="Describe the scope, objectives or references for this task..."
              className="form-input"
              style={{ minHeight: '90px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Priority & Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select 
                className="form-input" 
                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low" style={{ background: '#111827', color: 'var(--text-primary)' }}>Low</option>
                <option value="Medium" style={{ background: '#111827', color: 'var(--text-primary)' }}>Medium</option>
                <option value="High" style={{ background: '#111827', color: 'var(--text-primary)' }}>High</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select 
                className="form-input" 
                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Todo" style={{ background: '#111827', color: 'var(--text-primary)' }}>Todo</option>
                <option value="In Progress" style={{ background: '#111827', color: 'var(--text-primary)' }}>In Progress</option>
                <option value="Completed" style={{ background: '#111827', color: 'var(--text-primary)' }}>Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Assignee row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                style={{ colorScheme: 'dark' }}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assign To</label>
              <select 
                className="form-input" 
                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="" style={{ background: '#111827', color: 'var(--text-muted)' }}>Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id} style={{ background: '#111827', color: 'var(--text-primary)' }}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons Footer */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
