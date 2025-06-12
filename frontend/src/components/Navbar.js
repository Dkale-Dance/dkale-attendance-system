import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

// NavLink component - Single Responsibility Principle
const NavLink = ({ label, to, className = '' }) => {
  return (
    <Link to={to} className={`nav-link ${className}`}>
      {label}
    </Link>
  );
};

// UserInfo component - Single Responsibility Principle
const UserInfo = ({ user }) => (
  <div className="navbar-user-info">
    <p className="user-email">{user.email}</p>
  </div>
);

// NavigationLinks component - Single Responsibility Principle & Open/Closed Principle
const NavigationLinks = ({ userRole, isExpanded }) => {
  const links = [];

  // Add public dashboard link first for better mobile visibility
  links.push(
    <NavLink 
      key="public-dashboard" 
      label="Public Dashboard" 
      to="/public-dashboard"
    />
  );

  // Home link for all authenticated users
  links.push(
    <NavLink 
      key="home" 
      label="Home" 
      to="/"
    />
  );

  // Adding links based on user role - Open/Closed for extension
  if (userRole === 'student') {
    links.push(
      <NavLink 
        key="profile" 
        label="Profile" 
        to="/profile"
      />
    );
  }

  if (userRole === 'admin') {
    links.push(
      <NavLink 
        key="management" 
        label="Manage Students" 
        to="/manage-students"
      />
    );
    
    links.push(
      <NavLink 
        key="attendance" 
        label="Attendance" 
        to="/attendance"
      />
    );
    
    links.push(
      <NavLink 
        key="payments" 
        label="Payments" 
        to="/payments"
      />
    );
    
    links.push(
      <NavLink 
        key="expenses" 
        label="Expenses" 
        to="/expenses"
      />
    );
    
    links.push(
      <NavLink 
        key="financial-reports" 
        label="Financial Reports" 
        to="/financial-reports"
      />
    );
    
    links.push(
      <NavLink 
        key="attendance-reports" 
        label="Attendance Reports" 
        to="/attendance-reports"
      />
    );
  }

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
    </div>
  </div>
);

// Navbar component - Composition over inheritance
const Navbar = ({ user, userRole, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Determine if we're on the public dashboard page
  const isPublicDashboard = location.pathname === '/public-dashboard';

  // Always show a navbar, but the content will vary based on authentication

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