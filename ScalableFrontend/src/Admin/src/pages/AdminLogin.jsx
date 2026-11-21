
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhohttps://scalable-backend-h5su.onrender.com";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          username: username.trim().toLowerCase(),
          password
        }
      );

      const { token, user } = response.data;

      if (user.role !== "admin") {
        throw new Error(
          "Access denied. Administrator account required."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("adminUser", JSON.stringify(user));

      navigate("/dashboard");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-brand">
          <div className="admin-login-logo">A</div>
          <h1>AssetWise</h1>
          <span>ADMINISTRATION PORTAL</span>
        </div>

        <div className="admin-login-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to manage client accounts and investments.
          </p>
        </div>

        <form onSubmit={handleLogin}>

          <div className="admin-login-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to dashboard"}
          </button>

        </form>

        <div className="admin-login-footer">
          <span>SECURE ADMIN ACCESS</span>
          <p>AssetWise Management System</p>
        </div>

      </div>
    </div>
  );
}
