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
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Start with loading state
  const [view, setView] = useState("default"); // default, profile, management

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
      setView("default");
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
      setView("default");
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
      setView("default");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render different content based on authentication state and user role
  const renderContent = () => {
    // Show loading indicator while checking auth state
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

    // Profile editing view
    if (view === "profile" && userRole === "student") {
      return (
        <div className="profile-editor">
          <h2>Edit Your Profile</h2>
          <StudentForm 
            student={studentProfile} 
            onSubmit={handleUpdateProfile} 
            buttonText="Save Profile" 
          />
          <button onClick={() => setView("default")}>Cancel</button>
        </div>
      );
    }

    // Student management view (for admins)
    if (view === "management" && userRole === "admin") {
      return <StudentManagement userRole={userRole} />;
    }

    // Attendance dashboard view (for admins)
    if (view === "attendance" && userRole === "admin") {
      return <AttendanceDashboard userRole={userRole} />;
    }
    
    // Payment dashboard view (for admins)
    if (view === "payments" && userRole === "admin") {
      return <PaymentDashboard userRole={userRole} />;
    }
    
    // Financial reports view (for admins)
    if (view === "financial-reports" && userRole === "admin") {
      return <FinancialReports userRole={userRole} />;
    }
    
    // Attendance reports view (for admins)
    if (view === "attendance-reports" && userRole === "admin") {
      return <AttendanceReports userRole={userRole} />;
    }

    // Default welcome view
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

  return (
    <Router>
      <div className="App" data-testid="app">
        {/* Navbar is only shown when user is authenticated */}
        <Navbar 
          user={user} 
          userRole={userRole} 
          onLogout={handleLogout} 
          setView={setView} 
        />
        
        {/* Only show the logo on login/register screen */}
        {!user && (
          <header className="App-header">
            <div className="logo-container">
              <img src={logo} alt="Company Logo" className="app-logo" />
            </div>
          </header>
        )}
        
        <main>
          {error && <ErrorMessage message={error} />}
          <Routes>
            {/* Public route accessible without authentication */}
            <Route path="/public-dashboard" element={<PublicDashboard />} />
            
            {/* All other routes render the main content with authentication checks */}
            <Route path="*" element={renderContent()} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;