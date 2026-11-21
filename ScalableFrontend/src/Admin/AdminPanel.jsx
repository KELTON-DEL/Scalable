
import React, { useEffect, useMemo, useState } from "react";
import "./AdminPanel.css";
import ClientVerification from "./ClientVerification";
import SupportInbox from "./Supportinbox";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPanel() {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientError, setClientError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [creditSearch, setCreditSearch] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");

  // Get the admin token
  const getToken = () => localStorage.getItem("token");

  // Get client name
  const getClientName = (client) => {
    return (
      client.name ||
      `${client.firstName || ""} ${client.lastName || ""}`.trim() ||
      "Unnamed Client"
    );
  };

  // Get client ID
  const getClientId = (client) => {
    return String(client._id || client.id || "");
  };

  // Format money
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  // Fetch all clients from backend
  const fetchClients = async () => {
    const token = getToken();

    if (!token) {
      setClientError("Admin login is required. Please log in again.");
      setLoadingClients(false);
      return;
    }

    try {
      setLoadingClients(true);
      setClientError("");

      const response = await fetch(`${API_URL}/api/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to retrieve clients.");
      }

      setClients(data.clients || []);
    } catch (error) {
      setClientError(
        error.message || "Could not load client accounts."
      );
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Dashboard statistics
  const verifiedClients = clients.filter(
    (client) => client.verificationStatus === "APPROVED"
  );

  const pendingClients = clients.filter(
    (client) =>
      client.verificationStatus === "PENDING_VERIFICATION"
  );

  const totalClients = clients.length;

  // Search clients in balance management form
  const filteredClients = useMemo(() => {
    const term = creditSearch.trim().toLowerCase();

    if (!term) return clients;

    return clients.filter((client) =>
      `${getClientName(client)} ${client.email || ""} ${
        client.phoneNumber || ""
      }`
        .toLowerCase()
        .includes(term)
    );
  }, [clients, creditSearch]);

  // Search verified clients directory
  const filteredVerifiedClients = useMemo(() => {
    const term = directorySearch.trim().toLowerCase();

    if (!term) return verifiedClients;

    return verifiedClients.filter((client) =>
      [
        getClientName(client),
        client.email,
        client.phoneNumber,
        client.country
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [verifiedClients, directorySearch]);

  // Find selected client
  const selectedClient = clients.find(
    (client) => getClientId(client) === selectedUserId
  );

  // Update selected client's balance
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const newBalance = Number(amount);

    if (!selectedClient) {
      setFeedback({
        type: "error",
        message: "Please select a client."
      });
      return;
    }

    if (
      amount.trim() === "" ||
      !Number.isFinite(newBalance) ||
      newBalance < 0
    ) {
      setFeedback({
        type: "error",
        message: "Enter a valid balance of zero or more."
      });
      return;
    }

    const token = getToken();

    if (!token) {
      setFeedback({
        type: "error",
        message: "Your admin session has expired. Please log in again."
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/admin/users/${getClientId(selectedClient)}/balance`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            balance: newBalance
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update client balance."
        );
      }

      setFeedback({
        type: "success",
        message: `${getClientName(selectedClient)}'s balance has been updated to $${formatMoney(data.balance)}.`
      });

      setAmount("");

      // Refresh clients to display the updated balance
      await fetchClients();

    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.message || "Could not update client balance."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-panel">

      {/* Header */}
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">
            ASSETWISE MANAGEMENT
          </span>

          <h1>Admin Panel</h1>

          <p>
            Manage client accounts, verify users and update account balances.
          </p>
        </div>

        <div className="admin-role">
          <span className="admin-role-dot" />
          Administrator
        </div>
      </header>

      {/* Dashboard statistics */}
      <section className="admin-stat-grid">

        <article className="admin-stat-card">
          <span>Total Clients</span>
          <strong>
            {loadingClients ? "..." : totalClients}
          </strong>
          <small>All registered client accounts</small>
        </article>

        <article className="admin-stat-card admin-stat-highlight">
          <span>Verified Clients</span>
          <strong>
            {loadingClients ? "..." : verifiedClients.length}
          </strong>
          <small>Approved client accounts</small>
        </article>

        <article className="admin-stat-card">
          <span>Pending Verification</span>
          <strong>
            {loadingClients ? "..." : pendingClients.length}
          </strong>
          <small>Accounts awaiting approval</small>
        </article>

      </section>

      {/* Client loading errors */}
      {clientError && (
        <div className="admin-feedback error" role="alert">
          {clientError}

          <button type="button" onClick={fetchClients}>
            Retry
          </button>
        </div>
      )}

      {/* Client verification */}
      <ClientVerification onUpdated={fetchClients} />

      <div className="admin-content-grid">

        {/* Update client balance */}
        <section className="admin-card credit-card">

          <div className="admin-card-heading">
            <div>
              <span className="admin-section-label">
                ACCOUNT MANAGEMENT
              </span>

              <h2>Update Client Balance</h2>

              <p>
                Set the available balance for a selected client account.
              </p>
            </div>

            <div className="admin-credit-icon">＋</div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="admin-credit-form"
          >

            {/* Search client */}
            <div className="admin-field">
              <label htmlFor="client-search">
                Find Client
              </label>

              <input
                id="client-search"
                type="search"
                placeholder="Search by name, email or phone..."
                value={creditSearch}
                onChange={(event) =>
                  setCreditSearch(event.target.value)
                }
              />
            </div>

            {/* Select client */}
            <div className="admin-field">
              <label htmlFor="client-select">
                Select Client
              </label>

              <select
                id="client-select"
                value={selectedUserId}
                onChange={(event) => {
                  setSelectedUserId(event.target.value);
                  setAmount("");
                  setFeedback(null);
                }}
                required
              >
                <option value="">
                  Choose a client account
                </option>

                {filteredClients.map((client) => (
                  <option
                    key={getClientId(client)}
                    value={getClientId(client)}
                  >
                    {getClientName(client)} — {client.email || "No email"}
                  </option>
                ))}
              </select>

              {filteredClients.length === 0 && (
                <small className="admin-field-help">
                  No matching clients found.
                </small>
              )}
            </div>

            {/* Selected client details */}
            {selectedClient && (
              <div className="admin-selected-client">

                <div className="admin-client-avatar">
                  {getClientName(selectedClient)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="admin-client-details">
                  <strong>
                    {getClientName(selectedClient)}
                  </strong>

                  <span>
                    {selectedClient.email || "No email provided"}
                  </span>
                </div>

                <div className="admin-client-balance">
                  <small>Current Balance</small>

                  <strong>
                    ${formatMoney(selectedClient.balance)}
                  </strong>
                </div>

              </div>
            )}

            {/* New balance input */}
            <div className="admin-field">
              <label htmlFor="credit-amount">
                New Client Balance (USD)
              </label>

              <div className="admin-amount-input">
                <span>$</span>

                <input
                  id="credit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter new balance"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  required
                />
              </div>

              <small className="admin-field-help">
                Enter the complete balance you want the client to have.
                You can also enter 0 to reset the balance.
              </small>
            </div>

            {/* New balance preview */}
            {selectedClient &&
              amount.trim() !== "" &&
              Number.isFinite(Number(amount)) &&
              Number(amount) >= 0 && (
                <div className="admin-credit-preview">
                  <span>New Client Balance</span>

                  <strong>
                    ${formatMoney(Number(amount))}
                  </strong>
                </div>
              )}

            {/* Feedback */}
            {feedback && (
              <div
                className={`admin-feedback ${feedback.type}`}
                role="status"
              >
                {feedback.message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="admin-submit-button"
              disabled={
                isSubmitting ||
                loadingClients ||
                !selectedClient
              }
            >
              {isSubmitting
                ? "Updating Balance..."
                : "Update Client Balance"}
            </button>

            <p className="admin-form-disclaimer">
              Only authorized administrators can update client balances.
            </p>

          </form>
        </section>

        {/* Verified client directory */}
        <section className="admin-card clients-card">

          <div className="admin-card-heading">
            <div>
              <span className="admin-section-label">
                CLIENT DIRECTORY
              </span>

              <h2>Verified Clients</h2>

              <p>
                Details of clients whose accounts have been approved.
              </p>
            </div>

            <div className="verified-count">
              {verifiedClients.length} Verified
            </div>
          </div>

          {/* Directory search */}
          <div className="admin-field client-directory-search">
            <input
              type="search"
              placeholder="Search by name, email or phone number..."
              value={directorySearch}
              onChange={(event) =>
                setDirectorySearch(event.target.value)
              }
            />
          </div>

          {loadingClients ? (
            <div className="admin-empty-state">
              Loading client accounts...
            </div>
          ) : filteredVerifiedClients.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">♙</div>

              <strong>No verified clients found</strong>

              <p>
                Approved client accounts will appear here once their
                verification is complete.
              </p>
            </div>
          ) : (
            <div className="verified-client-table-wrapper">

              <table className="verified-client-table">

                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Country</th>
                    <th>Document Type</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVerifiedClients.map((client) => (
                    <tr key={getClientId(client)}>

                      <td>
                        <div className="verified-client-name">

                          <span className="admin-client-avatar">
                            {getClientName(client)
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <strong>
                            {getClientName(client)}
                          </strong>

                        </div>
                      </td>

                      <td>{client.email || "—"}</td>
                      <td>{client.phoneNumber || "—"}</td>
                      <td>{client.country || "—"}</td>
                      <td>{client.documentType || "—"}</td>

                      <td>
                        <span className="verified-status">
                          <span />
                          Verified
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    <SupportInbox />
      {/* Security reminder */}
      <aside className="admin-security-note">
        <strong>Security Reminder</strong>

        <p>
          Client balance updates must be validated by the backend.
          This page uses a protected administrator endpoint to update
          balances in the database. Ensure that the backend restricts
          this operation to authorized administrators.
        </p>
      </aside>

    </div>
  );
}
