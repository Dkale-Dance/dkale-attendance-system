import React, { useState } from "react";
import { authService } from "./services/AuthService";
import ErrorMessage from "./components/ErrorMessage"; // Import ErrorMessage component

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(""); // Store error messages

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(error.message); // Set error once, below the form
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
    <div className="App">
      <h1>{isRegister ? "Register" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">{isRegister ? "Register" : "Login"}</button>
        
        {/* ✅ Show error only once, below the form */}
        <ErrorMessage message={error} />
      </form>
      
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Switch to Login" : "Switch to Register"}
      </button>

      {user && (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default App;
