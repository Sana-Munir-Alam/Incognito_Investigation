import React, { useState } from 'react';
import LoadingPage from './LoadingPage';
import LoadingPage2 from './LoadingPage2';
import HomePage from './HomePage';
import Login from './Login';
import AdminPage from './AdminPage';
import UserDashboard from './UserDashboard';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('loading');
  const [user, setUser] = useState(null);
  const [nextPage, setNextPage] = useState('');

  const handleLoadingFinish = () => {
    setCurrentPage('home');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    
    // Determine next page and show LoadingPage2
    const targetPage = userData.role === 'admin' ? 'admin' : 'user';
    setNextPage(targetPage);
    setCurrentPage('transition');
  };

  const handleTransitionFinish = () => {
    setCurrentPage(nextPage);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  return (
    <div className="App">
      {currentPage === 'loading' && <LoadingPage onFinish={handleLoadingFinish} />}
      {currentPage === 'home' && <HomePage onLoginClick={() => setCurrentPage('login')} />}
      {currentPage === 'login' && <Login onLogin={handleLogin} onBack={() => setCurrentPage('home')} />}
      {currentPage === 'transition' && (
        <LoadingPage2 onFinish={handleTransitionFinish} />
      )}
      {currentPage === 'admin' && <AdminPage onLogout={handleLogout} />}
      {currentPage === 'user' && user && <UserDashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}

export default App;