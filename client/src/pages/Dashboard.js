import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admins to admin dashboard - they shouldn't access the chatbot dashboard
    if (user?.role === 'admin') {
      navigate('/admin/tickets', { replace: true });
    }
  }, [user, navigate]);

  // Don't render anything if user is admin (will redirect)
  if (user?.role === 'admin') {
    return null;
  }

  return (
    <div className="dashboard-container">
      <Header />

      <div className="dashboard-content">
        <Chatbot />
      </div>
    </div>
  );
};

export default Dashboard;
