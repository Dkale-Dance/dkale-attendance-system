import React, { useState } from "react";
import { authService } from "./services/AuthService";
import LoginForm from "./components/LoginForm";
import ErrorMessage from "./components/ErrorMessage";

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

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
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="App" data-testid="app">
      {!user ? (
        <LoginForm
          onSubmit={handleAuth}
          isRegister={isRegister}
          onSwitchMode={() => setIsRegister(!isRegister)}
        />
      ) : (
        <div className="user-welcome" data-testid="welcome-section">
          <p data-testid="welcome-message">Welcome, {user.email}</p>
          <button 
            onClick={handleLogout}
            data-testid="logout-button"
          >
            Logout
          </button>
          {error && <ErrorMessage message={error} />}
        </div>
      )}
    </div>
  );
}

export default App;