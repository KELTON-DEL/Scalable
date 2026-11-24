import React, { useState, useRef } from "react";
import axios from "axios";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./Auth.css";
import "./Landing.css";
import logo from "../Images/logo.png";

const API_URL =
  import.meta.env.VITE_API_URL || "https://scalable-backend-h5su.onrender.com";

export default function Auth() {
  const [showLanding, setShowLanding] = useState(true);
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

  const howItWorksRef = useRef(null);
  const authSectionRef = useRef(null);

  const openAuth = (tab = "signup") => {
    setActiveTab(tab);
    setMessage("");
    setError("");
    setShowLanding(false);
    setTimeout(() => {
      authSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

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

      const response = await axios.post(`${API_URL}/api/auth/register`, formData);

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

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword
      });

      localStorage.setItem("token", response.data.token);
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

  if (showLanding) {
    return (
      <div className="landing-page">
        <header className="landing-nav">
          <div className="landing-brand">
            <div className="landing-logo-box">
              <img src={logo} alt="Scalable logo" />
            </div>
            <div>
              <span className="landing-brand-name">Scalable</span>
              <span className="landing-brand-tag">AssetWise</span>
            </div>
          </div>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-btn-ghost"
              onClick={() => openAuth("login")}
            >
              Login
            </button>
            <button
              type="button"
              className="landing-btn-primary"
              onClick={() => openAuth("signup")}
            >
              Start Investing
            </button>
          </div>
        </header>

        <main className="landing-container">
          <section className="landing-hero">
            <span className="landing-badge">STRUCTURED PORTFOLIO GROWTH</span>
            <h1>
              Put Your Capital to Work With <span>Scalable</span>
            </h1>
            <p className="landing-hero-text">
              Don&apos;t let idle cash lose value to inflation. Scalable helps you
              build disciplined wealth through structured investment packages, clear
              return projections, and transparent account tracking.
            </p>

            <div className="landing-hero-cta">
              <button
                type="button"
                className="landing-btn-primary landing-btn-lg"
                onClick={() => openAuth("signup")}
              >
                Create Free Account
              </button>
              <button
                type="button"
                className="landing-btn-secondary landing-btn-lg"
                onClick={scrollToHowItWorks}
              >
                How Scalable Works
              </button>
            </div>

            <div className="landing-highlights">
              <div className="landing-highlight-item">
                <strong>4+ Plans</strong>
                <span>Gold, Silver, Oil &amp; Equity</span>
              </div>
              <div className="landing-highlight-item">
                <strong>Verified</strong>
                <span>Identity-checked client accounts</span>
              </div>
              <div className="landing-highlight-item">
                <strong>7-Day Notice</strong>
                <span>Clear withdrawal workflow</span>
              </div>
            </div>
          </section>

          <section ref={howItWorksRef} className="landing-section">
            <div className="landing-section-head">
              <span>HOW IT WORKS</span>
              <h2>Three Simple Steps to Start Growing</h2>
              <p>
                Built to keep investing straightforward from day one—verify your
                profile, choose a plan, and monitor your portfolio.
              </p>
            </div>

            <div className="landing-steps-grid">
              <article className="landing-step-card">
                <div className="landing-step-num">01</div>
                <h3>Create &amp; Verify Account</h3>
                <p>
                  Sign up with your details and upload a valid ID, passport, or
                  driver&apos;s licence so your account can be verified securely.
                </p>
              </article>

              <article className="landing-step-card">
                <div className="landing-step-num">02</div>
                <h3>Fund &amp; Pick a Package</h3>
                <p>
                  Deposit to your wallet balance and allocate funds into a
                  package that matches your target duration and return goals.
                </p>
              </article>

              <article className="landing-step-card">
                <div className="landing-step-num">03</div>
                <h3>Track &amp; Withdraw</h3>
                <p>
                  Watch active positions in your dashboard, check ledger history,
                  and request withdrawals smoothly with a 7-day notice.
                </p>
              </article>
            </div>
          </section>

          <section className="landing-section">
            <div className="landing-section-head">
              <span>WHY INVEST NOW</span>
              <h2>Why Smart Investors Choose Scalable</h2>
              <p>
                Consistent investing beats waiting on the sidelines. Start with an
                amount that fits your budget and stay in control.
              </p>
            </div>

            <div className="landing-benefits-grid">
              <div className="landing-benefit-card">
                <h3>Disciplined Wealth Building</h3>
                <p>
                  Lock-up periods encourage steady compounding instead of impulse
                  spending, helping your money work on a clear schedule.
                </p>
              </div>

              <div className="landing-benefit-card">
                <h3>Clear ROI &amp; Ledger Visibility</h3>
                <p>
                  Preview estimated returns before committing funds and inspect
                  every balance change in your transaction ledger.
                </p>
              </div>

              <div className="landing-benefit-card">
                <h3>Dedicated Support Access</h3>
                <p>
                  Reach support directly inside your dashboard whenever you need
                  help with verification, deposits, or withdrawals.
                </p>
              </div>
            </div>
          </section>

          <section className="landing-final-cta">
            <div>
              <h2>Ready to Grow Your Portfolio?</h2>
              <p>
                Open your Scalable account in minutes or sign in if you already
                have an active profile.
              </p>
            </div>
            <div className="landing-hero-cta">
              <button
                type="button"
                className="landing-btn-primary"
                onClick={() => openAuth("signup")}
              >
                Create Account Now
              </button>
              <button
                type="button"
                className="landing-btn-ghost"
                onClick={() => openAuth("login")}
              >
                Existing Client Login
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div ref={authSectionRef} className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <img src={logo} alt="Scalable logo" />
          </div>
          <h2>Scalable</h2>
          <p>Invest smarter. Grow together.</p>
          <button
            type="button"
            className="landing-back-link"
            onClick={() => setShowLanding(true)}
          >
            ← Back to How Scalable Works
          </button>
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
              Don&apos;t have an account?{" "}
              <span onClick={() => switchTab("signup")}>Create one</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}