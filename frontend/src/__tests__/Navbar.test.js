import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Navbar from '../components/Navbar';

describe('Navbar Component', () => {
  const mockUser = {
    email: 'test@example.com',
  };
  const mockUserRole = 'student';
  const mockLogout = jest.fn();
  const mockSetView = jest.fn();

  test('should not render when user is not authenticated', () => {
    const { container } = render(<Navbar user={null} userRole={null} onLogout={mockLogout} setView={mockSetView} />);
    expect(container.firstChild).toBeNull();
  });

  test('should render when user is authenticated', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} setView={mockSetView} />);
    
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    // No longer showing role label
    expect(screen.queryByText(`Role: ${mockUserRole}`)).not.toBeInTheDocument();
  });

  test('should show appropriate navigation links based on user role (student)', () => {
    render(<Navbar user={mockUser} userRole="student" onLogout={mockLogout} setView={mockSetView} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Manage Students')).not.toBeInTheDocument();
  });

  test('should show appropriate navigation links based on user role (admin)', () => {
    render(<Navbar user={mockUser} userRole="admin" onLogout={mockLogout} setView={mockSetView} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Manage Students')).toBeInTheDocument();
  });

  test('should call setView when clicking on navigation links', () => {
    render(<Navbar user={mockUser} userRole="admin" onLogout={mockLogout} setView={mockSetView} />);
    
    // Test management link
    fireEvent.click(screen.getByText('Manage Students'));
    expect(mockSetView).toHaveBeenCalledWith('management');
    
    // Test home link
    fireEvent.click(screen.getByText('Home'));
    expect(mockSetView).toHaveBeenCalledWith('default');
  });

  test('should call logout function when clicking on logout button', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} setView={mockSetView} />);
    
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  test('should collapse and expand on mobile view', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} setView={mockSetView} />);
    
    // Initially, menu should be collapsed on mobile
    const menuButton = screen.getByLabelText('Toggle navigation');
    const navLinks = screen.getByTestId('nav-links');
    
    expect(navLinks).toHaveClass('collapsed');
    
    // Click to expand
    fireEvent.click(menuButton);
    expect(navLinks).not.toHaveClass('collapsed');
    
    // Click again to collapse
    fireEvent.click(menuButton);
    expect(navLinks).toHaveClass('collapsed');
  });
  
  test('should have correct layout structure with nav links in center and user info on right', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} setView={mockSetView} />);
    
    // Check that the elements exist in the correct containers
    const navLinksContainer = screen.getByTestId('nav-links');
    const userContainer = screen.getByTestId('user-container');
    
    // User info should be in user container
    expect(within(userContainer).getByText(mockUser.email)).toBeInTheDocument();
    expect(within(userContainer).getByText('Logout')).toBeInTheDocument();
    
    // Nav links should be in nav links container
    expect(within(navLinksContainer).getByText('Home')).toBeInTheDocument();
  });
});