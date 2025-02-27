import React, { useState, useEffect } from "react";
import { authService } from "./services/AuthService";
import { studentService } from "./services/StudentService";
import LoginForm from "./components/LoginForm";
import StudentManagement from "./components/StudentManagement";
import StudentForm from "./components/StudentForm";
import ErrorMessage from "./components/ErrorMessage";
import Navbar from "./components/Navbar";
import logo from "./assets/logo.png";
import "./App.css";

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
      const role = await userRepository.getRole(userId);
      setUserRole(role);

      // If the user is a student, fetch their profile
      if (role === "student") {
        const profile = await studentService.getStudentById(userId);
        setStudentProfile(profile || { id: userId });
      }
    } catch (error) {
      setError("Failed to fetch user role: " + error.message);
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
        authenticatedUser = await authService.login(email, password);
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
        {renderContent()}
      </main>
    </div>
  );
}

export default App;