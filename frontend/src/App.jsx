import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ResumeMatcher from './pages/ResumeMatcher';
import './index.css';

function App() {
  const [page, setPage] = useState('landing');
  const [userRole, setUserRole] = useState('recruiter');
  const [user, setUser] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUserRole(userData.role);
        setPage('dashboard');
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (result) => {
    setUser({
      username: result.username,
      full_name: result.full_name,
      role: result.role
    });
    setUserRole(result.role);
    setPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPage('landing');
  };

  return (
    <div className="min-h-screen">
      {page === 'landing' && <LandingPage setPage={setPage} setUserRole={setUserRole} />}
      {page === 'auth' && (
        <AuthPage 
          setPage={setPage} 
          userRole={userRole} 
          setUserRole={setUserRole}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {page === 'dashboard' && user && (
        user.role === 'recruiter' ? (
          <RecruiterDashboard user={user} onLogout={handleLogout} />
        ) : (
          <ResumeMatcher user={user} onLogout={handleLogout} />
        )
      )}
    </div>
  );
}

export default App;
