import React, { useCallback, useEffect, useState } from "react";
import "./SupportInbox.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SupportInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/support/admin/conversations`,
        { headers: authHeaders }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load inbox.");
      }

      setConversations(data.conversations || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const loadMessages = useCallback(async clientId => {
    if (!clientId) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/support/admin/conversations/${clientId}/messages`,
        { headers: authHeaders }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load conversation.");
      }

      setMessages(data.messages || []);
      setSelectedClient(data.client);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConversations();

    const interval = setInterval(loadConversations, 5000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedClient?._id) return;

    const interval = setInterval(() => {
      loadMessages(selectedClient._id);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedClient?._id, loadMessages]);

  const sendReply = async event => {
    event.preventDefault();

    const cleanReply = reply.trim();

    if (!cleanReply || !selectedClient || sending) return;

    try {
      setSending(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/support/admin/conversations/${selectedClient._id}/reply`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ message: cleanReply })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send reply.");
      }

      setMessages(previous => [
        ...previous,
        data.supportMessage
      ]);

      setReply("");
      loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-inbox">
      <div className="support-inbox-heading">
        <div>
          <h2>Customer Care Inbox</h2>
          <p>Read and respond to client messages.</p>
        </div>

        <button onClick={loadConversations}>Refresh Inbox</button>
      </div>

      {error && <p className="support-inbox-error">{error}</p>}

      <div className="support-inbox-layout">
        <aside className="support-conversation-list">
          <h3>Client Conversations</h3>

          {conversations.length === 0 && (
            <p className="support-empty">No client messages yet.</p>
          )}

          {conversations.map(item => (
            <button
              key={item.client._id}
              className={`support-conversation ${
                selectedClient?._id === item.client._id ? "selected" : ""
              }`}
              onClick={() => loadMessages(item.client._id)}
            >
              <span className="support-client-avatar">
                {(item.client.firstName || "C").charAt(0).toUpperCase()}
              </span>

              <span className="support-conversation-details">
                <strong>
                  {item.client.firstName} {item.client.lastName}
                </strong>

                <small>{item.client.email}</small>

                <span className="support-last-message">
                  {item.lastMessage.message}
                </span>
              </span>

              {item.unreadCount > 0 && (
                <span className="support-unread">
                  {item.unreadCount}
                </span>
              )}
            </button>
          ))}
        </aside>

        <section className="support-admin-chat">
          {!selectedClient ? (
            <div className="support-select-prompt">
              <span>💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a client on the left to read and reply.</p>
            </div>
          ) : (
            <>
              <header className="support-admin-chat-header">
                <div>
                  <strong>
                    {selectedClient.firstName} {selectedClient.lastName}
                  </strong>
                  <small>{selectedClient.email}</small>
                </div>
              </header>

              <div className="support-admin-messages">
                {loading && messages.length === 0 && (
                  <p className="support-empty">Loading messages...</p>
                )}

                {messages.map(item => (
                  <div
                    key={item._id}
                    className={`support-admin-message ${
                      item.sender === "admin" ? "admin-sent" : "client-sent"
                    }`}
                  >
                    <div className="support-admin-bubble">
                      <small>
                        {item.sender === "admin" ? "You (Admin)" : "Client"}
                      </small>

                      <p>{item.message}</p>

                      <time>
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </div>
                ))}
              </div>

              <form className="support-admin-reply" onSubmit={sendReply}>
                <input
                  type="text"
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  placeholder="Write a reply to this client..."
                  maxLength={3000}
                />

                <button type="submit" disabled={sending || !reply.trim()}>
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}