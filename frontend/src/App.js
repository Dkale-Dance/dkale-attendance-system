import React, { useState, useEffect } from "react";
import { authService } from "./services/AuthService";
import { studentService } from "./services/StudentService";
import LoginForm from "./components/LoginForm";
import StudentManagement from "./components/StudentManagement";
import StudentForm from "./components/StudentForm";
import AttendanceDashboard from "./components/AttendanceDashboard";
import PaymentDashboard from "./components/PaymentDashboard";
import FinancialReports from "./components/FinancialReports";
import AttendanceReports from "./components/AttendanceReports";
import PublicDashboard from "./components/PublicDashboard";
import ErrorMessage from "./components/ErrorMessage";
import Navbar from "./components/Navbar";
import logo from "./assets/logo.png";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Start with loading state

  // Function to fetch user role when user is authenticated
  const fetchUserRole = async (userId) => {
    try {
      const userRepository = authService.userRepository;
      
      // Make sure we have a valid userId before attempting to fetch role
      if (!userId) {
        setError("Invalid user ID");
        setUserRole(null);
        setLoading(false);
        return;
      }
      
      // Get the user role
      const role = await userRepository.getRole(userId);
      setUserRole(role);

      // If the user is a student, fetch their profile
      if (role === "student") {
        try {
          const profile = await studentService.getStudentById(userId);
          setStudentProfile(profile || { id: userId });
        } catch (profileError) {
          console.error("Error fetching student profile:", profileError);
          // Don't fail the entire auth process if profile fetch fails
          setStudentProfile({ id: userId });
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setError("Failed to fetch user role: " + error.message);
      // Clear user role but maintain user authenticated state
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Effect to set up the auth state listener on component mount
  useEffect(() => {
    const authRepository = authService.authRepository;
    
    // Set up the auth state change listener
    const unsubscribe = authRepository.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is signed in
        setUser(authUser);
        fetchUserRole(authUser.uid);
      } else {
        // User is signed out
        setUser(null);
        setUserRole(null);
        setStudentProfile(null);
        setLoading(false);
      }
    });
    
    // Clean up the subscription when the component unmounts
    return () => {
      // Check if unsubscribe is a function before calling it
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);
  
  const handleAuth = async (email, password) => {
    setLoading(true);
    setError(""); // Clear previous error messages
    try {
      let authenticatedUser;
      if (isRegister) {
        authenticatedUser = await authService.register(email, password);
      } else {
        // Here's where we need to modify the login to save credentials for admin users
        authenticatedUser = await authService.login(email, password);
        
        // Note: The login method in AuthService now saves admin credentials securely if user is an admin
      }
      setUser(authenticatedUser);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setUserRole(null);
      setStudentProfile(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      setLoading(true);
      setError("");
      
      // Update student profile
      const updatedProfile = await studentService.updateStudent(user.uid, formData);
      setStudentProfile(updatedProfile);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Home page component based on user role
  const HomePage = () => {
    if (loading) {
      return <div className="loading" data-testid="loading-indicator">Loading...</div>;
    }
    
    if (!user) {
      return (
        <LoginForm
          onSubmit={handleAuth}
          isRegister={isRegister}
          onSwitchMode={() => setIsRegister(!isRegister)}
        />
      );
    }

    return (
      <div className="user-welcome" data-testid="welcome-section">
        <p data-testid="welcome-message">Welcome, {user.email}</p>
        
        {userRole === "student" && studentProfile && (
          <div className="student-profile">
            <h2>Your Student Profile</h2>
            <p>Name: {studentProfile.firstName || ''} {studentProfile.lastName || ''}</p>
            <p>Status: {studentProfile.enrollmentStatus || 'Pending Payment'}</p>
            <p>Balance: ${(studentProfile.balance || 0).toFixed(2)}</p>
          </div>
        )}
      </div>
    );
  };

  // Profile editor component
  const ProfileEditor = () => {
    if (!user || userRole !== "student") {
      return <Navigate to="/" />;
    }

    return (
      <div className="profile-editor">
        <h2>Edit Your Profile</h2>
        <StudentForm 
          student={studentProfile} 
          onSubmit={handleUpdateProfile} 
          buttonText="Save Profile" 
        />
      </div>
    );
  };

  // Render content with auth protection
  const ProtectedRoute = ({ element, requiredRole }) => {
    if (loading) {
      return <div className="loading" data-testid="loading-indicator">Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/" />;
    }

    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/" />;
    }

    return element;
  };

  return (
    <Router>
      <div className="App" data-testid="app">
        {/* Navbar is shown for authenticated users and on the public dashboard */}
        <Navbar 
          user={user} 
          userRole={userRole} 
          onLogout={handleLogout} 
        />
        
        {/* Only show the logo on login/register screen */}
        {!user && window.location.pathname === "/" && (
          <header className="App-header">
            <div className="logo-container">
              <img src={logo} alt="Company Logo" className="app-logo" />
            </div>
          </header>
        )}
        
        <main>
          {error && <ErrorMessage message={error} />}
          <Routes>
            {/* Public route accessible without authentication, but with userRole for admin features */}
            <Route path="/public-dashboard" element={<PublicDashboard userRole={userRole} />} />
            
            {/* Profile route for students */}
            <Route path="/profile" element={<ProtectedRoute element={<ProfileEditor />} requiredRole="student" />} />
            
            {/* Admin routes */}
            <Route path="/manage-students" element={<ProtectedRoute element={<StudentManagement userRole={userRole} />} requiredRole="admin" />} />
            <Route path="/attendance" element={<ProtectedRoute element={<AttendanceDashboard userRole={userRole} />} requiredRole="admin" />} />
            <Route path="/payments" element={<ProtectedRoute element={<PaymentDashboard userRole={userRole} />} requiredRole="admin" />} />
            <Route path="/financial-reports" element={<ProtectedRoute element={<FinancialReports userRole={userRole} />} requiredRole="admin" />} />
            <Route path="/attendance-reports" element={<ProtectedRoute element={<AttendanceReports userRole={userRole} />} requiredRole="admin" />} />
            
            {/* Home route */}
            <Route path="/" element={<HomePage />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;