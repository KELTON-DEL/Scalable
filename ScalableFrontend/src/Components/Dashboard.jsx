import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

const Icons = {
  GoldBar: () => <svg viewBox="0 0 24 24" className="icon gold" fill="currentColor"><path d="M4 8h16l-2 8H6L4 8z" opacity=".4"/><path d="M2 18h20v2H2zM5 5h14l1.5 3H3.5L5 5z"/></svg>,
  SilverBar: () => <svg viewBox="0 0 24 24" className="icon silver" fill="currentColor"><path d="M3 9h18l-2 7H5L3 9z" opacity=".5"/><path d="M2 18h20v2H2zM5 6h14l1.5 2H3.5L5 6z"/></svg>,
  OilBarrel: () => <svg viewBox="0 0 24 24" className="icon oil" fill="currentColor"><path d="M6 3h12v18H6z" opacity=".3"/><path d="M5 2h14v3H5zm0 17h14v3H5zm1-8h12v2H6z"/></svg>,
  Equity: () => <svg viewBox="0 0 24 24" className="icon positive" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10l5-5 4 4 8-8M14 4h6v6"/></svg>,
  Wallet: () => <svg viewBox="0 0 24 24" className="icon gold" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M16 12.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" className="icon positive" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" className="icon gold" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  ArrowUpRight: () => <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10"/></svg>,
  ArrowDownLeft: () => <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 7 7 17m10 0H7V7"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" className="small-icon spin" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.5 15"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" className="shield-icon" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" className="small-icon" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 6-12 12M6 6l12 12"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" className="check-icon" fill="none" stroke="currentColor" strokeWidth="3"><path d="m20 6-11 11-5-5"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" className="small-icon" fill="currentColor"><path d="m5 3 14 9-14 9z"/></svg>,
  Pause: () => <svg viewBox="0 0 24 24" className="small-icon" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
};

const money = value =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const packages = [
  { title: "Gold Package", iconType: "GoldBar", baseRate: 12, min: 500, max: 50000, style: "gold-package" },
  { title: "Silver Package", iconType: "SilverBar", baseRate: 10, min: 300, max: 30000, style: "silver-package" },
  { title: "Oil & Commodities", iconType: "OilBarrel", baseRate: 14, min: 1000, max: 100000, style: "oil-package" },
  { title: "Equity Portfolio", iconType: "Equity", baseRate: 15, min: 1000, max: 100000, style: "equity-package" }
];

const STORAGE_KEYS = {
  INVESTMENTS: "scalable_active_investments",
  TRANSACTIONS: "scalable_transactions_ledger",
  BALANCE: "scalable_cached_balance"
};

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL || "https://scalable-backend-h5su.onrender.com";

  // Hydrate initial balance, investments, and transactions from localStorage so refreshes never wipe state.
  const [availableBalance, setAvailableBalance] = useState(() =>
    Number(readStorage(STORAGE_KEYS.BALANCE, 0))
  );

  const [activeTab, setActiveTab] = useState("Dashboard");

  const [investments, setInvestments] = useState(() =>
    readStorage(STORAGE_KEYS.INVESTMENTS, [])
  );

  const [transactions, setTransactions] = useState(() =>
    readStorage(STORAGE_KEYS.TRANSACTIONS, [])
  );

  const [isSimulating, setIsSimulating] = useState(false);
  const [swingHistory, setSwingHistory] = useState([0, 0, 0, 0, 0, 0, 0]);

  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [isSubmittingInvest, setIsSubmittingInvest] = useState(false);

  const [investAmount, setInvestAmount] = useState(500);
  const [customDays, setCustomDays] = useState(30);
  const [autoRenewInput, setAutoRenewInput] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [withdrawMethod, setWithdrawMethod] = useState("USDT (TRC20)");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawalReceiptModal, setWithdrawalReceiptModal] = useState(null);
  const [statusNotice, setStatusNotice] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState("");

  // Persist investments, transactions, and balance to localStorage whenever they change.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(availableBalance));
  }, [availableBalance]);

  // Load messages saved in MongoDB whenever the customer-care chat is opened.
  useEffect(() => {
    if (!depositModalOpen) return undefined;

    let isMounted = true;
    const fetchChatMessages = async (showLoader = false) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (isMounted) setChatError("Your session has expired. Please log in again.");
          return;
        }

        if (showLoader && isMounted) setChatLoading(true);

        const response = await fetch(`${API_URL}/api/support/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load customer-care messages.");
        }

        if (isMounted) {
          const messages = Array.isArray(data) ? data : (data.messages || []);
          setChatMessages(messages.map(item => ({
            ...item,
            id: item._id || item.id,
            time: item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : (item.time || "")
          })));
          setChatError("");
        }
      } catch (error) {
        if (isMounted) setChatError(error.message);
      } finally {
        if (showLoader && isMounted) setChatLoading(false);
      }
    };

    fetchChatMessages(true);
    const chatInterval = setInterval(() => fetchChatMessages(false), 4000);

    return () => {
      isMounted = false;
      clearInterval(chatInterval);
    };
  }, [depositModalOpen, API_URL]);

  // Sync balance & active investments with backend without overwriting locally invested capital if backend hasn't deducted it.
  useEffect(() => {
    const syncAccountData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();
        if (!response.ok) return;

        // If backend returns saved investments, merge/hydrate them so they stay persistent.
        if (Array.isArray(data.user?.investments) && data.user.investments.length > 0) {
          setInvestments(data.user.investments);
        }

        // Only update availableBalance from server if the user hasn't locally deducted capital that the server hasn't synced yet,
        // or if the server explicitly reflects the updated balance.
        if (typeof data.user?.balance === "number") {
          const serverBalance = Number(data.user.balance);
          const localInvestedTotal = readStorage(STORAGE_KEYS.INVESTMENTS, []).reduce(
            (sum, inv) => sum + (inv.syncedWithServer ? 0 : Number(inv.amount || 0)),
            0
          );
          const adjustedBalance = Math.max(0, serverBalance - localInvestedTotal);
          setAvailableBalance(adjustedBalance);
        }
      } catch (error) {
        console.error("Account sync error:", error.message);
      }
    };

    syncAccountData();
    const balanceInterval = setInterval(syncAccountData, 15000);
    return () => clearInterval(balanceInterval);
  }, [API_URL]);

  // Total profit earned from active investments.
  const totalEarnings = useMemo(
    () =>
      investments.reduce(
        (sum, item) => sum + (item.currentValue - item.amount),
        0
      ),
    [investments]
  );

  // Update investment values gradually after an investment is made.
  useEffect(() => {
    if (investments.length === 0) return undefined;

    const interval = setInterval(() => {
      setInvestments(previous =>
        previous.map(item => {
          if (item.status !== "Active") return item;

          const nextProfit = +(item.currentProfitPercent + 0.02).toFixed(2);
          return {
            ...item,
            currentProfitPercent: nextProfit,
            currentValue: +(item.amount * (1 + nextProfit / 100)).toFixed(2)
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [investments.length]);

  // Update line graph values.
  useEffect(() => {
    if (!isSimulating) return undefined;

    const interval = setInterval(() => {
      setSwingHistory(previous => {
        const latestProfit = investments.reduce(
          (sum, item) => sum + item.currentProfitPercent,
          0
        );
        const next = investments.length ? latestProfit / investments.length : 0;
        return [...previous.slice(1), +next.toFixed(2)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, investments]);

  const addTransaction = transaction =>
    setTransactions(previous => [
      {
        id: Date.now(),
        date: new Date().toLocaleString(),
        ...transaction
      },
      ...previous
    ]);

  const handleConfirmInvestment = async event => {
    event.preventDefault();
    if (isSubmittingInvest) return;

    const amount = Number(investAmount);

    if (amount > availableBalance) {
      return alert("Insufficient available balance. Please contact customer care to fund your account.");
    }

    if (amount < selectedPackageModal.min) {
      return alert(`Minimum investment for this package is $${selectedPackageModal.min}`);
    }

    if (amount > selectedPackageModal.max) {
      return alert(`Maximum investment for this package is $${selectedPackageModal.max.toLocaleString()}`);
    }

    setIsSubmittingInvest(true);
    const today = new Date();
    const maturityDate = new Date(today.getTime() + customDays * 86400000)
      .toISOString()
      .split("T")[0];

    let syncedWithServer = false;

    // Attempt to persist the investment and balance deduction on the backend
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const res = await fetch(`${API_URL}/api/investments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            packageName: selectedPackageModal.title,
            amount,
            durationDays: customDays,
            maturityDate,
            autoRenew: autoRenewInput
          })
        });
        if (res.ok) {
          syncedWithServer = true;
        }
      }
    } catch {
      // Fallback to localStorage persistence if endpoint is offline
    }

    const newInvestment = {
      id: Date.now(),
      packageName: selectedPackageModal.title,
      amount,
      currentValue: amount,
      currentProfitPercent: 0,
      maturityDate,
      status: "Active",
      syncedWithServer
    };

    // Deduct invested capital immediately from availableBalance and persist
    const updatedBalance = +(availableBalance - amount).toFixed(2);
    setAvailableBalance(updatedBalance);
    setInvestments(previous => [newInvestment, ...previous]);

    addTransaction({
      type: "Investment",
      title: `Investment: ${selectedPackageModal.title}`,
      amount,
      status: "Completed"
    });

    setIsSubmittingInvest(false);
    setSelectedPackageModal(null);
  };

  const handleConfirmWithdrawal = async event => {
    event.preventDefault();
    setWithdrawError("");

    const amount = Number(withdrawAmount);

    if (Number.isNaN(amount) || amount < 1000) {
      setWithdrawError("The withdrawal amount must not be less than $1,000.00.");
      return;
    }

    if (amount > availableBalance) {
      setWithdrawError("Withdrawal amount exceeds your available balance.");
      return;
    }

    if (!withdrawAddress.trim()) {
      setWithdrawError("Please enter a valid wallet address or bank account.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_URL}/api/withdrawals`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount,
            method: withdrawMethod,
            address: withdrawAddress.trim()
          })
        });
      }
    } catch {
      // Persist locally if backend endpoint isn't reachable
    }

    setAvailableBalance(previous => +(previous - amount).toFixed(2));

    addTransaction({
      type: "Withdrawal",
      title: `Withdrawal via ${withdrawMethod}`,
      amount,
      status: "Processing"
    });

    setWithdrawModalOpen(false);
    setWithdrawAddress("");
    setWithdrawalReceiptModal({
      amount,
      method: withdrawMethod
    });
    setStatusNotice(
      `Withdrawal of $${money(amount)} confirmed — will be processed in 7 days' time.`
    );
  };

  const handleSendChatMessage = async event => {
    event.preventDefault();

    const message = chatMessage.trim();
    if (!message || chatSending) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Your session has expired. Please log in again.");

      setChatSending(true);
      setChatError("");

      const response = await fetch(`${API_URL}/api/support/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Your message could not be sent.");
      }

      setChatMessage("");

      const messagesResponse = await fetch(`${API_URL}/api/support/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const messagesData = await messagesResponse.json();
      if (!messagesResponse.ok) {
        throw new Error(messagesData.message || "Message sent, but the chat could not refresh.");
      }

      const messages = Array.isArray(messagesData)
        ? messagesData
        : (messagesData.messages || []);
      setChatMessages(messages.map(item => ({
        ...item,
        id: item._id || item.id,
        time: item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : (item.time || "")
      })));
    } catch (error) {
      setChatError(error.message);
    } finally {
      setChatSending(false);
    }
  };

  const navItems = [
    { label: "Dashboard", icon: "☷" },
    { label: "My Investments", icon: "↗" },
    { label: "Deposit", icon: "+" },
    { label: "Withdraw", icon: "↓" },
    { label: "Transaction History", icon: "◷" }
  ];

  const chartPoints = swingHistory
    .map((value, index) => {
      const x = (index / Math.max(swingHistory.length - 1, 1)) * 300;
      const maxValue = Math.max(...swingHistory, 1);
      const y = 100 - (value / maxValue) * 75;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="dashboard-app">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <h1> Scalable<span>Investments</span></h1>
        </div>

        <div className="topbar-info">
          <div className="user-info">
            <div className="avatar">TT</div>
            <div>
              <p>Welcome back,</p>
              <strong>Client</strong>
            </div>
          </div>

          <div className="top-divider" />

          <div className="top-stat">
            <Icons.Wallet />
            <div>
              <small>Account Balance</small>
              <strong>${money(availableBalance)}</strong>
            </div>
          </div>

          <div className="top-stat portfolio-stat">
            <Icons.TrendingUp />
            <div>
              <small>Total Profit</small>
              <strong className="gold-text">
                ${money(totalEarnings)}
              </strong>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="side-nav">
            {navItems.map(item => (
              <button
                key={item.label}
                className={`nav-button ${activeTab === item.label ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(item.label);
                  if (item.label === "Withdraw") setWithdrawModalOpen(true);
                  if (item.label === "Deposit") setDepositModalOpen(true);
                }}
              >
                <span className="nav-symbol">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="security-card">
            <Icons.Shield />
            <h4>Secure &amp; Compliant</h4>
            <p>Your assets are managed through your AssetWise account.</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {statusNotice && (
            <div
              className="notice"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "12px",
                fontWeight: 600
              }}
            >
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>
          )}

          <section className="hero-banner">
            <div className="hero-copy">
              <span className="eyebrow">High Yield Growth</span>
              <h2>
                Grow Your Wealth <span>Globally</span>
              </h2>
              <p>
                Invest in commodities and monitor your investment
                performance from your dashboard.
              </p>

              <button
                className={`simulate-button ${isSimulating ? "simulating" : ""}`}
                onClick={() => setIsSimulating(!isSimulating)}
              >
                {isSimulating ? <Icons.Pause /> : <Icons.Play />}
                {isSimulating
                  ? "Pause Performance Graph"
                  : "View Investment Performance"}
              </button>
            </div>

            <div className="apy-card">
              <div className="apy-icon">
                <Icons.GoldBar />
              </div>
              <div>
                <p>Average Annualized Return</p>
                <strong>+14.8% APY</strong>
              </div>
            </div>
          </section>

          {/* Metrics */}
          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-heading">
                <span>Available Balance</span>
                <Icons.Wallet />
              </div>

              <strong className="metric-value">
                ${money(availableBalance)}
              </strong>

              <button
                className="primary-button full-button"
                onClick={() => setDepositModalOpen(true)}
              >
                Contact Customer Care
              </button>
            </article>

            <article className="metric-card">
              <div className="metric-heading">
                <span>Total Profit</span>
                <Icons.TrendingUp />
              </div>

              <strong className="metric-value positive">
                +${money(totalEarnings)}
              </strong>

              <p className="growth-note">
                <Icons.ArrowUpRight />
                Earnings from active investments
              </p>
            </article>

            <article className="metric-card">
              <div className="metric-heading">
                <span>Active Investments</span>
                <Icons.Calendar />
              </div>

              <strong className="metric-value">
                {investments.length}
              </strong>

              <p className="muted-note">
                Across {investments.length} active packages
              </p>
            </article>

            <article className="metric-card performance-card">
              <div className="metric-heading">
                <span>Investment Performance</span>
                <b className="positive">
                  {investments.length
                    ? `+${money(
                        investments.reduce(
                          (sum, item) => sum + item.currentProfitPercent,
                          0
                        ) / investments.length
                      )}%`
                    : "0.00%"}
                </b>
              </div>

              <div className="performance-line-chart">
                <svg
                  viewBox="0 0 300 110"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="Investment performance line graph"
                >
                  <line x1="0" y1="100" x2="300" y2="100" className="chart-axis" />
                  <line x1="0" y1="50" x2="300" y2="50" className="chart-grid-line" />
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="#28c98b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="muted-note">
                {investments.length
                  ? "Your investment profit is being updated gradually."
                  : "Your performance graph will begin after your first investment."}
              </p>
            </article>
          </section>

          {/* Investment packages */}
          <section className="packages-section">
            <div className="section-heading">
              <div>
                <h3>Investment Packages</h3>
                <p>Select an asset package and choose custom growth duration.</p>
              </div>
            </div>

            <div className="packages-grid">
              {packages.map((pkg, index) => (
                <article
                  className={`package-card ${pkg.style}`}
                  key={pkg.title}
                >
                  <div className="package-content">
                    <div className="package-title">
                      <h4>{pkg.title}</h4>
                      {index === 0 && (
                        <span className="popular-tag">Popular</span>
                      )}
                    </div>

                    <div className="package-rate">
                      <strong>{pkg.baseRate}%</strong>
                      <span>Base Expected Return / Month</span>
                    </div>

                    <ul>
                      <li><Icons.Check /> Min Investment: <b>${pkg.min.toLocaleString()}</b></li>
                      <li><Icons.Check /> Max Investment: <b>${pkg.max.toLocaleString()}</b></li>
                      <li><Icons.Check /> Custom Duration Lockup</li>
                      <li><Icons.Check /> Auto Renewal Supported</li>
                    </ul>
                  </div>

                  <button
                    className="primary-button invest-button"
                    onClick={() => {
                      setSelectedPackageModal(pkg);
                      setInvestAmount(pkg.min);
                    }}
                  >
                    Invest Now <Icons.ArrowUpRight />
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* Investments and wallet */}
          <section className="bottom-grid">
            <article className="panel investments-panel">
              <div className="panel-heading">
                <div>
                  <h3>My Active Investments</h3>
                  <p>Investment performance and maturity dates</p>
                </div>

                {investments.length > 0 && (
                  <span className="live-indicator">
                    <Icons.Refresh /> Profit tracking active
                  </span>
                )}
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>Current Value</th>
                      <th>Live Profit</th>
                      <th>Maturity Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {investments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-investments">
                          You have no active investments yet.
                          Choose an investment package to get started.
                        </td>
                      </tr>
                    ) : (
                      investments.map(item => (
                        <tr key={item.id}>
                          <td className="table-package">{item.packageName}</td>
                          <td>${money(item.amount)}</td>
                          <td className="table-value">${money(item.currentValue)}</td>
                          <td className="positive">+{item.currentProfitPercent.toFixed(2)}%</td>
                          <td className="muted-cell">{item.maturityDate}</td>
                          <td>
                            <span className="status-pill">{item.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel wallet-panel">
              <div>
                <h3>Fund &amp; Cash Out</h3>
                <p className="panel-description">
                  Contact customer care for account funding assistance.
                </p>

                <div className="wallet-actions">
                  <button
                    className="withdraw-button"
                    onClick={() => {
                      setWithdrawError("");
                      setWithdrawModalOpen(true);
                    }}
                  >
                    <Icons.ArrowDownLeft />
                    Withdraw Earnings / Balance
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => setDepositModalOpen(true)}
                  >
                    <Icons.ArrowUpRight />
                    Chat with Customer Care
                  </button>
                </div>
              </div>

              <div className="ledger">
                <h4>Recent Ledger</h4>

                {transactions.length === 0 ? (
                  <p className="muted-note">No transactions available yet.</p>
                ) : (
                  transactions.slice(0, 3).map(tx => (
                    <div className="ledger-row" key={tx.id}>
                      <div>
                        <strong>{tx.title.replace(/\s*\(\d+\s*Days\)/i, "")}</strong>
                      </div>

                      <b className={tx.type === "Deposit" ? "positive" : "gold-text"}>
                        ${money(Math.abs(Number(tx.amount)))}
                      </b>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </main>
      </div>

      {/* Investment modal */}
      {selectedPackageModal && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPackageModal(null)}
        >
          <section
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedPackageModal(null)}
            >
              <Icons.Close />
            </button>

            <div className="modal-heading">
              <span className="modal-eyebrow">New Investment Workflow</span>
              <h3>Invest in {selectedPackageModal.title}</h3>
              <p>Set your investment amount and growth lockup duration.</p>
            </div>

            <form onSubmit={handleConfirmInvestment} className="modal-form">
              <div className="form-group">
                <label>
                  <span>Investment Amount ($)</span>
                  <b>Available: ${money(availableBalance)}</b>
                </label>

                <input
                  type="number"
                  min={selectedPackageModal.min}
                  max={selectedPackageModal.max}
                  value={investAmount}
                  onChange={event => setInvestAmount(Number(event.target.value))}
                  required
                />

                <small>
                  Min: ${selectedPackageModal.min} | Max: ${selectedPackageModal.max.toLocaleString()}
                </small>
              </div>

              <div className="duration-box">
                <div className="duration-heading">
                  <label>Lockup Growth Duration:</label>
                  <strong>{customDays} Days</strong>
                </div>

                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={customDays}
                  onChange={event => setCustomDays(Number(event.target.value))}
                />

                <div className="range-labels">
                  <span>15 Days</span>
                  <span>60 Days</span>
                  <span>120 Days</span>
                  <span>180 Days</span>
                </div>
              </div>

              <div className="roi-preview">
                <div>
                  <span>Base Monthly ROI Rate:</span>
                  <b>{selectedPackageModal.baseRate}%</b>
                </div>

                <div>
                  <span>Projected Adjusted ROI ({customDays} Days):</span>
                  <b className="positive">
                    +{(selectedPackageModal.baseRate * customDays / 30).toFixed(1)}%
                  </b>
                </div>

                <div className="estimated-return">
                  <span>Estimated Total Return:</span>
                  <b>
                    ${(
                      investAmount *
                      (1 + selectedPackageModal.baseRate * customDays / 3000)
                    ).toFixed(2)}
                  </b>
                </div>
              </div>

              <label className="toggle-row">
                <span>Auto-renew package upon maturity</span>
                <input
                  type="checkbox"
                  checked={autoRenewInput}
                  onChange={event => setAutoRenewInput(event.target.checked)}
                />
              </label>

              <button
                type="submit"
                disabled={isSubmittingInvest}
                className="primary-button modal-submit"
              >
                {isSubmittingInvest ? "Processing..." : "Confirm Investment & Lock Funds"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Withdrawal modal */}
      {withdrawModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setWithdrawError("");
            setWithdrawModalOpen(false);
          }}
        >
          <section
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => {
                setWithdrawError("");
                setWithdrawModalOpen(false);
              }}
            >
              <Icons.Close />
            </button>

            <div className="modal-heading">
              <span className="modal-eyebrow green">Cash Out Workflow</span>
              <h3>Withdraw Funds</h3>
              <p>Available Balance: ${money(availableBalance)}</p>
            </div>

            <form onSubmit={handleConfirmWithdrawal} className="modal-form">
              <div className="form-group">
                <label><span>Payment Network</span></label>
                <select
                  value={withdrawMethod}
                  onChange={event => setWithdrawMethod(event.target.value)}
                >
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="USDT (ERC20)">USDT (ERC20)</option>
                  <option value="Bank Wire">Bank Wire Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label><span>Withdrawal Amount ($)</span></label>
                <input
                  type="number"
                  min="1000"
                  step="any"
                  max={availableBalance}
                  placeholder="Enter amount to withdraw (min $1,000)..."
                  value={withdrawAmount}
                  onChange={event => {
                    setWithdrawAmount(event.target.value);
                    if (withdrawError) setWithdrawError("");
                  }}
                  required
                />
                <small>Minimum withdrawal amount: $1,000.00</small>
              </div>

              <div className="form-group">
                <label><span>Wallet Address / Account Number</span></label>
                <input
                  type="text"
                  placeholder="Enter destination address..."
                  value={withdrawAddress}
                  onChange={event => {
                    setWithdrawAddress(event.target.value);
                    if (withdrawError) setWithdrawError("");
                  }}
                  required
                />
              </div>

              {withdrawError && <div className="notice">{withdrawError}</div>}

              <button type="submit" className="submit-green">
                Confirm Withdrawal
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Withdrawal 7-day confirmation pop-up modal */}
      {withdrawalReceiptModal && (
        <div
          className="modal-backdrop"
          onClick={() => setWithdrawalReceiptModal(null)}
        >
          <section
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setWithdrawalReceiptModal(null)}
            >
              <Icons.Close />
            </button>

            <div className="modal-heading">
              <span className="modal-eyebrow green">Withdrawal Request Submitted</span>
              <h3>Withdrawal Scheduled</h3>
              <p>
                Your withdrawal request of{" "}
                <strong className="gold-text">${money(withdrawalReceiptModal.amount)}</strong>{" "}
                via <strong>{withdrawalReceiptModal.method}</strong> has been received and will be
                processed in <strong>7 days&apos; time</strong>.
              </p>
            </div>

            <div className="roi-preview" style={{ marginBottom: "16px" }}>
              <div>
                <span>Amount Withdrawn:</span>
                <b className="gold-text">${money(withdrawalReceiptModal.amount)}</b>
              </div>
              <div>
                <span>Processing Time:</span>
                <b className="positive">7 Days</b>
              </div>
              <div>
                <span>Payment Method:</span>
                <b>{withdrawalReceiptModal.method}</b>
              </div>
            </div>

            <button
              type="button"
              className="primary-button modal-submit"
              onClick={() => setWithdrawalReceiptModal(null)}
            >
              Done
            </button>
          </section>
        </div>
      )}

      {/* Customer Care Chat modal */}
      {depositModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setDepositModalOpen(false)}
        >
          <section
            className="modal-card customer-chat-modal"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setDepositModalOpen(false)}
            >
              <Icons.Close />
            </button>

            <div className="modal-heading">
              <span className="modal-eyebrow">Funding Support</span>
              <h3>Customer Care Desk</h3>
              <p>Message our desk to fund your account balance.</p>
            </div>

            <div className="customer-care-profile">
              <div className="customer-care-avatar">CC</div>
              <div>
                <strong>Scalable Support Team</strong>
                <span>Account Funding &amp; Verification</span>
              </div>
              <span className="customer-care-status">● Online</span>
            </div>

            <div className="customer-chat-messages">
              {chatLoading ? (
                <p className="muted-note">Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <div className="chat-message admin-message">
                  <p>Hello! How much would you like to deposit into your investment account today?</p>
                  <small>Support Desk</small>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-message ${
                      msg.sender === "client" || msg.senderRole === "client"
                        ? "client-message"
                        : "admin-message"
                    }`}
                  >
                    <p>{msg.message || msg.text}</p>
                    <small>{msg.time}</small>
                  </div>
                ))
              )}
            </div>

            {chatError && <p className="notice" style={{ marginTop: "10px" }}>{chatError}</p>}

            <form onSubmit={handleSendChatMessage} className="customer-chat-form">
              <input
                type="text"
                placeholder="Type your deposit request..."
                value={chatMessage}
                onChange={event => setChatMessage(event.target.value)}
              />
              <button type="submit" disabled={chatSending || !chatMessage.trim()}>
                {chatSending ? "..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;