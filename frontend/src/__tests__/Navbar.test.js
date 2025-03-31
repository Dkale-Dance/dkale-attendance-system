import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Navbar from '../components/Navbar';

// Create a centralized mock for react-router-dom
const mockUseLocation = jest.fn();
mockUseLocation.mockReturnValue({ pathname: '/' });

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, className, onClick }) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
  useNavigate: () => jest.fn(),
  useLocation: () => mockUseLocation()
}));

describe('Navbar Component', () => {
  const mockUser = {
    email: 'test@example.com',
  };
  const mockUserRole = 'student';
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });
  
  test('should render public navbar when user is not authenticated on homepage', () => {
    render(<Navbar user={null} userRole={null} onLogout={mockLogout} />);
    
    // Should show the brand name and login link
    expect(screen.getByText('Dkale Dance')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
  
  test('should render public navbar when on public dashboard without authentication', () => {
    // Mock location to be on public dashboard
    mockUseLocation.mockReturnValue({ pathname: '/public-dashboard' });
    
    render(<Navbar user={null} userRole={null} onLogout={mockLogout} />);
    
    // Public navbar should be visible with login link
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Public Dashboard')).toBeInTheDocument();
  });

  test('should render when user is authenticated', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} />);
    
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    // No longer showing role label
    expect(screen.queryByText(`Role: ${mockUserRole}`)).not.toBeInTheDocument();
  });

  test('should show appropriate navigation links based on user role (student)', () => {
    render(<Navbar user={mockUser} userRole="student" onLogout={mockLogout} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Manage Students')).not.toBeInTheDocument();
  });

  test('should show appropriate navigation links based on user role (admin)', () => {
    render(<Navbar user={mockUser} userRole="admin" onLogout={mockLogout} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Manage Students')).toBeInTheDocument();
  });

  test('should have proper navigation links that go to correct routes', () => {
    render(<Navbar user={mockUser} userRole="admin" onLogout={mockLogout} />);
    
    // Test management link
    const manageLink = screen.getByText('Manage Students').closest('a');
    expect(manageLink).toHaveAttribute('href', '/manage-students');
    
    // Test home link
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  test('should call logout function when clicking on logout button', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} />);
    
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
  });

  test('should collapse and expand on mobile view', () => {
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} />);
    
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
    render(<Navbar user={mockUser} userRole={mockUserRole} onLogout={mockLogout} />);
    
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