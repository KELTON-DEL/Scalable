
import React, { useEffect, useState } from "react";
import "./ClientVerification.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ClientVerification() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchPendingUsers = async () => {
    const token = getToken();

    if (!token) {
      setError("Admin login is required before viewing pending applications.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/pending-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load applications.");
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleReview = async (userId, action) => {
    const actionLabel = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this client?`
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      setError("Please log in as an administrator first.");
      return;
    }

    try {
      setProcessingId(userId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Could not ${actionLabel} client.`);
      }

      setMessage(data.message);
      setUsers((previousUsers) =>
        previousUsers.filter((user) => user._id !== userId)
      );
    } catch (err) {
      setError(err.message || "The review action failed.");
    } finally {
      setProcessingId("");
    }
  };

  const handleViewDocument = async (userId) => {
    const token = getToken();

    if (!token) {
      setError("Please log in as an administrator first.");
      return;
    }

    // Open a blank tab immediately to avoid browser popup blocking.
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setError("Allow pop-ups to view identity documents.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/document`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Could not retrieve document.");
      }

      const blob = await response.blob();
      const documentUrl = URL.createObjectURL(blob);

      previewWindow.location.href = documentUrl;

      // Keep the URL available while the document is being viewed.
      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60000);
    } catch (err) {
      previewWindow.close();
      setError(err.message || "Could not open identity document.");
    }
  };

  return (
    <section className="verification-section">
      <div className="verification-heading">
        <div>
          <span className="verification-eyebrow">
            ACCOUNT VERIFICATION
          </span>
          <h2>Client Verification</h2>
          <p>Review identity documents and verify new client accounts.</p>
        </div>

        <button
          className="verification-refresh"
          onClick={fetchPendingUsers}
          disabled={loading}
          type="button"
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      <div className="verification-summary">
        <div>
          <span>Pending applications</span>
          <strong>{users.length}</strong>
        </div>
        <span className="verification-status">
          Awaiting review
        </span>
      </div>

      {message && (
        <div className="verification-message success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="verification-message error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="verification-empty">
          Loading client applications...
        </div>
      ) : users.length === 0 ? (
        <div className="verification-empty">
          <div className="verification-empty-icon">✓</div>
          <h3>No pending applications</h3>
          <p>
            New client registrations awaiting verification will appear here.
          </p>
        </div>
      ) : (
        <div className="verification-list">
          {users.map((user) => (
            <article className="verification-user-card" key={user._id}>
              <div className="verification-user-top">
                <div className="verification-avatar">
                  {(user.firstName || "C").charAt(0).toUpperCase()}
                </div>

                <div className="verification-user-info">
                  <h3>
                    {user.firstName} {user.lastName}
                  </h3>
                  <p>{user.email}</p>
                  <span>{user.phoneNumber}</span>
                </div>

                <span className="verification-pending">
                  Pending
                </span>
              </div>

              <div className="verification-details">
                <div>
                  <span>Country</span>
                  <strong>{user.country || "Not provided"}</strong>
                </div>

                <div>
                  <span>Document type</span>
                  <strong>{user.documentType || "Not provided"}</strong>
                </div>

                <div>
                  <span>Registration date</span>
                  <strong>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Not available"}
                  </strong>
                </div>
              </div>

              <div className="verification-actions">
                <button
                  type="button"
                  className="verification-document-button"
                  onClick={() => handleViewDocument(user._id)}
                >
                  View identity document
                </button>

                <button
                  type="button"
                  className="verification-approve-button"
                  disabled={processingId === user._id}
                  onClick={() => handleReview(user._id, "approve")}
                >
                  {processingId === user._id ? "Processing..." : "Approve"}
                </button>

                <button
                  type="button"
                  className="verification-reject-button"
                  disabled={processingId === user._id}
                  onClick={() => handleReview(user._id, "reject")}
                >
                  {processingId === user._id ? "Processing..." : "Reject"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
