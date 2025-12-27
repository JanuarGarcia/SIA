import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTicketsList from './pages/admin/AdminTicketsList';
import AdminTicketReview from './pages/admin/AdminTicketReview';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCategoryManagement from './pages/admin/AdminCategoryManagement';
import AdminCourseManagement from './pages/admin/AdminCourseManagement';
import AdminOfficeManagement from './pages/admin/AdminOfficeManagement';
import AdminRoute from './components/AdminRoute';
import './styles/App.css';

// Component to handle root route redirect based on user role
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/tickets" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <PrivateRoute>
                  <Tickets />
                </PrivateRoute>
              }
            />
            <Route
              path="/tickets/create"
              element={
                <PrivateRoute>
                  <CreateTicket />
                </PrivateRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <PrivateRoute>
                  <TicketDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tickets/all"
              element={
                <AdminRoute>
                  <AdminTicketsList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tickets/:id"
              element={
                <AdminRoute>
                  <AdminTicketReview />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalytics />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategoryManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <AdminRoute>
                  <AdminCourseManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/offices"
              element={
                <AdminRoute>
                  <AdminOfficeManagement />
                </AdminRoute>
              }
            />
            <Route path="/" element={<RootRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

