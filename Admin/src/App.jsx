
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminPanel from "../AdminPanel";
import AdminLogin from "./pages/AdminLogin";

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const adminUser = JSON.parse(
    localStorage.getItem("adminUser") || "null"
  );

  if (!token || adminUser?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
 );
}

export default App;
