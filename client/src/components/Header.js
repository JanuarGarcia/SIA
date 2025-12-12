import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    return user?.username || 'User';
  };

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    // Admin users don't have chatbot tab, so don't return 'chatbot' for them
    if (!isAdmin && (path === '/dashboard' || path === '/')) return 'chatbot';
    if (path.startsWith('/admin/tickets')) return 'admin';
    if (isAdmin && path === '/admin/analytics') return 'analytics';
    if (!isAdmin && path.startsWith('/tickets')) return 'tickets';
    if (path === '/profile') return 'profile';
    return '';
  };

  const handleTabClick = (tab) => {
    if (tab === 'chatbot') {
      navigate('/dashboard');
    } else if (tab === 'tickets') {
      navigate('/tickets');
    } else if (tab === 'admin') {
      navigate('/admin/tickets');
    } else if (tab === 'profile') {
      navigate('/profile');
    } else if (tab === 'analytics') {
      navigate('/admin/analytics');
    }
  };

  const isAdmin = user?.role === 'admin';

  const activeTab = getActiveTab();

  return (
    <div className="unified-header">
      <div className="header-title">
        <h1>AI Chatbot & Ticketing System</h1>
        <div className="welcome-message">
          <div className="greeting-text">
            <span className="greeting">{getGreeting()},</span>
            <span className="username">{getUserDisplayName()}!</span>
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <nav className="header-nav">
          {!isAdmin && (
            <button
              className={`nav-tab ${activeTab === 'chatbot' ? 'active' : ''}`}
              onClick={() => handleTabClick('chatbot')}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-text">Chatbot</span>
            </button>
          )}
          {!isAdmin && (
            <button
              className={`nav-tab ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => handleTabClick('tickets')}
            >
              <span className="nav-icon">🎫</span>
              <span className="nav-text">Tickets</span>
            </button>
          )}
          {isAdmin && (
            <button
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabClick('admin')}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Admin</span>
            </button>
          )}
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </button>
          {isAdmin && (
            <button
              className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleTabClick('analytics')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Analytics</span>
            </button>
          )}
        </nav>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;

