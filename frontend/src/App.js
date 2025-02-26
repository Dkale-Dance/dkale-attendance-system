import React, { useState, useEffect } from "react";
import { authService } from "./services/AuthService";
import { studentService } from "./services/StudentService";
import LoginForm from "./components/LoginForm";
import StudentManagement from "./components/StudentManagement";
import StudentForm from "./components/StudentForm";
import ErrorMessage from "./components/ErrorMessage";
import "./App.css";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    }
  };

  // Effect to fetch user role when the user state changes
  useEffect(() => {
    if (user) {
      fetchUserRole(user.uid);
    } else {
      setUserRole(null);
      setStudentProfile(null);
    }
  }, [user]);

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
    if (!user) {
      return (
        <LoginForm
          onSubmit={handleAuth}
          isRegister={isRegister}
          onSwitchMode={() => setIsRegister(!isRegister)}
        />
      );
    }

    // Loading state while fetching role
    if (loading) {
      return <div className="loading">Loading...</div>;
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
        
        {userRole && (
          <p className="user-role">Role: {userRole}</p>
        )}
        
        {userRole === "student" && studentProfile && (
          <div className="student-profile">
            <h2>Your Student Profile</h2>
            <p>Name: {studentProfile.firstName || ''} {studentProfile.lastName || ''}</p>
            <p>Status: {studentProfile.enrollmentStatus || 'Pending Payment'}</p>
            <p>Balance: ${(studentProfile.balance || 0).toFixed(2)}</p>
            <button onClick={() => setView("profile")}>Edit Profile</button>
          </div>
        )}
        
        {userRole === "admin" && (
          <button onClick={() => setView("management")}>Manage Students</button>
        )}
        
        <button 
          onClick={handleLogout}
          data-testid="logout-button"
          className="logout-button"
        >
          Logout
        </button>
      </div>
    );
  };

  return (
    <div className="App" data-testid="app">
      <header className="App-header">
        <h1>Education Management System</h1>
      </header>
      
      <main>
        {error && <ErrorMessage message={error} />}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;