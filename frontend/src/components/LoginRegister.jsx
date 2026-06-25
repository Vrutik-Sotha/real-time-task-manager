import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, ShieldCheck, AlertCircle } from 'lucide-react';

const LoginRegister = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Email serves as username or email on backend
        const result = await login(email, password);
        if (!result.success) {
          setError(result.message || 'Login failed. Please check credentials.');
        }
      } else {
        if (username.length < 3) {
          setError('Username must be at least 3 characters.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const result = await register(username, email, password);
        if (!result.success) {
          setError(result.message || 'Registration failed. Try a different username/email.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div 
        className="glass-panel animate-scale" 
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 32px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Logo/Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--info) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 8px 24px var(--primary-glow)'
          }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Join Workspace'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
            {isLogin ? 'Sign in to access your collaborative dashboard' : 'Create an account to manage tasks in real-time'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Username (Register mode only) */}
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g., alex_dev"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email / Login Credential */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{isLogin ? 'Email or Username' : 'Email Address'}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={isLogin ? 'text' : 'email'}
                required
                placeholder={isLogin ? 'Enter email or username' : 'you@example.com'}
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Form Mode Toggle Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>{' '}
          <button
            onClick={switchMode}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
