
import React, { useState } from "react";
import axios from "axios";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./Auth.css";
import logo from "../Images/logo.png"
const API_URL = import.meta.env.VITE_API_URL || " http://localhost:5000";

export default function Auth() {
  const [activeTab, setActiveTab] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("KE");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [documentType, setDocumentType] = useState("National ID");
  const [identityDocument, setIdentityDocument] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const switchTab = (tab) => {
    setActiveTab(tab);
    setMessage("");
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!isValidPhoneNumber(phoneNumber || "")) {
      setError("Please enter a valid phone number for your selected country.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!identityDocument) {
      setError("Please upload your identity document.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf"
    ];

    if (!allowedTypes.includes(identityDocument.type)) {
      setError("Upload your document as JPG, PNG or PDF.");
      return;
    }

    if (identityDocument.size > 5 * 1024 * 1024) {
      setError("Your document must not exceed 5MB.");
      return;
    }

    const formData = new FormData();

    formData.append("firstName", firstName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("email", email.trim());
    formData.append("phoneNumber", phoneNumber);
    formData.append("country", country);
    formData.append("password", password);
    formData.append("documentType", documentType);
    formData.append("identityDocument", identityDocument);

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formData
      );

      setMessage(
        response.data.message ||
        "Registration submitted. Your identity is awaiting verification."
      );

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setConfirmPassword("");
      setIdentityDocument(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: loginEmail,
          password: loginPassword
        }
      );

      // Save the authentication token returned by your backend.
      localStorage.setItem("token", response.data.token);

      // Your backend should only issue a usable client session
      // after checking the account's verification status.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-logo">S </div>
          <h2>Scalable</h2>
          <p>Invest smarter. Grow together.</p>
        </div>

        <div className="auth-tabs">
          <button
            className={activeTab === "login" ? "active" : ""}
            onClick={() => switchTab("login")}
            type="button"
          >
            Login
          </button>

          <button
            className={activeTab === "signup" ? "active" : ""}
            onClick={() => switchTab("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {activeTab === "signup" ? (
          <form onSubmit={handleSignup}>
            <h3>Create your account</h3>
            <p className="auth-subtitle">
              Enter your details to get started with AssetWise.
            </p>

            <div className="auth-name-row">
              <div className="auth-field">
                <label>First Name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Second Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Second name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="auth-field">
              <label>Phone Number</label>
              <PhoneInput
                international
                country={country}
                onCountryChange={(value) => setCountry(value || "KE")}
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className="auth-field">
              <label>Identity Document</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option>National ID</option>
                <option>Passport</option>
                <option>Driving Licence</option>
              </select>
            </div>

            <div className="auth-field">
              <label>Upload {documentType}</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  setIdentityDocument(e.target.files[0] || null)
                }
                required
              />
              <small>Accepted: JPG, PNG or PDF. Maximum size: 5MB.</small>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button className="auth-submit" disabled={loading}>
              {loading ? "Submitting..." : "Create Account"}
            </button>

            <p className="auth-terms">
              By registering, you agree to our Terms and Privacy Policy.
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <h3>Welcome back</h3>
            <p className="auth-subtitle">
              Log in to access your investment dashboard.
            </p>

            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button className="auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Login to Scalable"}
            </button>

            <p className="auth-terms">
              Don't have an account?{" "}
              <span onClick={() => switchTab("signup")}>
                Create one
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

