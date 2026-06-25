import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastAlerts, setToastAlerts] = useState([]);

  const API_URL = 'http://localhost:5000/api';

  // Fetch current profile if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('token', token);
          fetchNotifications();
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error loading user:', err);
        // Don't log out immediately on network errors, just stop loading
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Handle Socket.io client lifecycle
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket
    const socketClient = io('http://localhost:5000', {
      auth: { token },
    });

    setSocket(socketClient);

    socketClient.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socketClient.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Listen for custom targeted database notifications in real-time
    socketClient.on('new_notification', (data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
      
      // Also show as a floating toast alert
      addToastAlert({
        id: Date.now(),
        type: data.type === 'assignment' ? 'info' : 'success',
        message: data.message,
        createdAt: new Date(),
      });
    });

    // Listen for global user online/offline status updates
    socketClient.on('user_status_change', (data) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === data.userId ? { ...u, isOnline: data.isOnline } : u))
      );
    });

    // Listen for global task updates to generate floating toast alerts
    socketClient.on('task_created', (data) => {
      addToastAlert({
        id: Date.now(),
        type: 'info',
        message: `Task "${data.task.title}" created by ${data.sender}`,
        createdAt: new Date(),
      });
    });

    socketClient.on('task_updated', (data) => {
      addToastAlert({
        id: Date.now(),
        type: 'success',
        message: `Task "${data.task.title}" updated by ${data.sender}`,
        createdAt: new Date(),
      });
    });

    socketClient.on('task_deleted', (data) => {
      addToastAlert({
        id: Date.now(),
        type: 'danger',
        message: `A task was deleted by ${data.sender}`,
        createdAt: new Date(),
      });
    });

    return () => {
      socketClient.disconnect();
    };
  }, [user, token]);

  const addToastAlert = (toast) => {
    setToastAlerts((prev) => [toast, ...prev].slice(0, 10)); // Limit to last 10 toast alerts
  };

  const clearToastAlert = (id) => {
    setToastAlerts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  const register = async (username, email, password, role) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Server error. Please try again later.' };
    }
  };

  const logout = async () => {
    // Notify server of logout to record the activity
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Error logging out from server:', err);
      }
    }

    setToken('');
    setUser(null);
    setUsers([]);
    setNotifications([]);
    setUnreadCount(0);
    setToastAlerts([]);
    localStorage.removeItem('token');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        socket,
        users,
        notifications,
        unreadCount,
        toastAlerts,
        login,
        register,
        logout,
        fetchUsers,
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        clearToastAlert,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
