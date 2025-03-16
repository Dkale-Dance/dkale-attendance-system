import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

// NavLink component - Single Responsibility Principle
const NavLink = ({ label, onClick, className = '', to = null }) => {
  // Use either Link or div based on whether a 'to' prop is provided
  if (to) {
    return (
      <Link to={to} className={`nav-link ${className}`}>
        {label}
      </Link>
    );
  }
  
  return (
    <div 
      className={`nav-link ${className}`} 
      onClick={onClick}
    >
      {label}
    </div>
  );
};

// UserInfo component - Single Responsibility Principle
const UserInfo = ({ user }) => (
  <div className="navbar-user-info">
    <p className="user-email">{user.email}</p>
  </div>
);

// NavigationLinks component - Single Responsibility Principle & Open/Closed Principle
const NavigationLinks = ({ userRole, setView, isExpanded }) => {
  const links = [];

  // Home link for all authenticated users
  links.push(
    <NavLink 
      key="home" 
      label="Home" 
      onClick={() => setView('default')} 
    />
  );

  // Adding links based on user role - Open/Closed for extension
  if (userRole === 'student') {
    links.push(
      <NavLink 
        key="profile" 
        label="Profile" 
        onClick={() => setView('profile')} 
      />
    );
  }

  if (userRole === 'admin') {
    links.push(
      <NavLink 
        key="management" 
        label="Manage Students" 
        onClick={() => setView('management')} 
      />
    );
    
    links.push(
      <NavLink 
        key="attendance" 
        label="Attendance" 
        onClick={() => setView('attendance')} 
      />
    );
    
    links.push(
      <NavLink 
        key="payments" 
        label="Payments" 
        onClick={() => setView('payments')} 
      />
    );
    
    // New report links for admins
    links.push(
      <NavLink 
        key="financial-reports" 
        label="Financial Reports" 
        onClick={() => setView('financial-reports')} 
      />
    );
    
    links.push(
      <NavLink 
        key="attendance-reports" 
        label="Attendance Reports" 
        onClick={() => setView('attendance-reports')} 
      />
    );
  }
  
  // Public dashboard link for everyone
  links.push(
    <NavLink 
      key="public-dashboard" 
      label="Public Dashboard" 
      to="/public-dashboard" 
    />
  );

  return (
    <div 
      className={`navbar-links ${isExpanded ? 'expanded' : 'collapsed'}`}
      data-testid="nav-links"
    >
      {links}
    </div>
  );
};

// UserSection component - Single Responsibility Principle
const UserSection = ({ user, onLogout }) => (
  <div className="navbar-user" data-testid="user-container">
    <UserInfo user={user} />
    <button 
      className="logout-button" 
      onClick={onLogout}
    >
      Logout
    </button>
  </div>
);

// PublicNavbar component for unauthenticated users
const PublicNavbar = ({ isExpanded, toggleNavbar }) => (
  <div className="navbar-container">
    <div className="navbar-top">
      <div className="navbar-brand">
        Dkale Dance
      </div>
      
      <button 
        className="navbar-toggle" 
        onClick={toggleNavbar}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
    </div>

    <div 
      className={`navbar-links ${isExpanded ? 'expanded' : 'collapsed'}`}
      data-testid="public-nav-links"
    >
      <NavLink 
        key="login" 
        label="Login" 
        to="/" 
      />
      <NavLink 
        key="public-dashboard" 
        label="Public Dashboard" 
        to="/public-dashboard" 
      />
    </div>
  </div>
);

// Navbar component - Composition over inheritance
const Navbar = ({ user, userRole, onLogout, setView }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Determine if we're on the public dashboard page
  const isPublicDashboard = window.location.pathname === '/public-dashboard';

  // If user is not authenticated and we're not on the public dashboard, don't render the navbar
  if (!user && !isPublicDashboard) return null;

  return (
    <nav className="navbar">
      {user ? (
        // Authenticated navbar
        <div className="navbar-container">
          <div className="navbar-top">
            <div className="navbar-brand">
              Dkale Dance
            </div>
            
            <button 
              className="navbar-toggle" 
              onClick={toggleNavbar}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
          </div>

          <NavigationLinks 
            userRole={userRole} 
            setView={setView} 
            isExpanded={isExpanded} 
          />

          <UserSection user={user} onLogout={onLogout} />
        </div>
      ) : (
        // Public navbar
        <PublicNavbar 
          isExpanded={isExpanded} 
          toggleNavbar={toggleNavbar} 
        />
      )}
    </nav>
  );
};

export default Navbar;