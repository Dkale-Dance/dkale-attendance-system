import React, { useState } from 'react';
import './Navbar.css';

// NavLink component - Single Responsibility Principle
const NavLink = ({ label, onClick, className = '' }) => (
  <div 
    className={`nav-link ${className}`} 
    onClick={onClick}
  >
    {label}
  </div>
);

// UserInfo component - Single Responsibility Principle
const UserInfo = ({ user, userRole }) => (
  <div className="navbar-user-info">
    <p className="user-email">{user.email}</p>
    {userRole && (
      <div className="user-role-badge">
        Role: {userRole}
      </div>
    )}
  </div>
);

// NavigationLinks component - Single Responsibility Principle & Open/Closed Principle
const NavigationLinks = ({ userRole, setView, isExpanded }) => {
  const links = [];

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

// Navbar component - Composition over inheritance
const Navbar = ({ user, userRole, onLogout, setView }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If user is not authenticated, don't render the navbar
  if (!user) return null;

  const toggleNavbar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <nav className="navbar">
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

      <div className="navbar-user">
        <UserInfo user={user} userRole={userRole} />
        <button 
          className="logout-button" 
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      <NavigationLinks 
        userRole={userRole} 
        setView={setView} 
        isExpanded={isExpanded} 
      />
    </nav>
  );
};

export default Navbar;