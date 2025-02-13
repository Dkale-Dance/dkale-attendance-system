import React, { useState } from "react";
import { authService } from "./services/AuthService";
import LoginForm from "./components/LoginForm";
import ErrorMessage from "./components/ErrorMessage";
import StudentList from "./components/admin/StudentList";
import { createStudentService } from "./services/StudentServiceFactory";
import { StudentListPresenter } from "./presenters/StudentListPresenter";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create presenter for StudentList
  const studentService = createStudentService();
  const presenter = new StudentListPresenter(studentService, {
    setStudents,
    setLoading: setIsLoading,
    setError
  });

  const handleAuth = async (email, password) => {
    setError(""); // Clear previous error messages
    try {
      let authenticatedUser;
      if (isRegister) {
        authenticatedUser = await authService.register(email, password);
      } else {
        authenticatedUser = await authService.login(email, password);
      }
      setUser(authenticatedUser);
    } catch (error) {
      setError(error.message);
      throw error; // Propagate error to LoginForm
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setStudents([]);
    } catch (error) {
      setError(error.message);
    }
  };

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

    if (user.role === 'admin') {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
          <StudentList
            presenter={presenter}
            students={students}
            isLoading={isLoading}
            error={error}
          />
        </div>
      );
    }

    return (
      <div className="user-welcome p-4" data-testid="welcome-section">
        <div className="flex justify-between items-center mb-4">
          <p data-testid="welcome-message" className="text-xl">
            Welcome, {user.email}
          </p>
          <button 
            onClick={handleLogout}
            data-testid="logout-button"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        {error && <ErrorMessage message={error} />}
      </div>
    );
  };

  return (
    <div className="App" data-testid="app">
      {renderContent()}
    </div>
  );
}

export default App;