import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import AdminNavbar from "./Components/Navbar/AdminNavbar";
import Footer from "./Components/Footer/Footer";

import Home from "./Components/Pages/Home";
import Shop from "./Components/Pages/Shop";
import Login from "./Components/Pages/Login";
import Signup from "./Components/Pages/Signup";
import AdminPage from "./Components/Pages/Adminpage";

// 🔹 Protected route for admin
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />; // Not logged in
  if (role !== "admin") return <Navigate to="/" />; // Not admin
  return children;
};

// 🔹 Protected route for normal logged-in users
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  const location = useLocation();
  const role = localStorage.getItem("role");

  return (
    <div className="App">
      {/* Render AdminNavbar for admin pages, otherwise normal Navbar */}
      {role === "admin" && location.pathname.startsWith("/admin") ? (
        <AdminNavbar />
      ) : (
        <Navbar />
      )}

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected User Routes */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/shop" element={<PrivateRoute><Shop /></PrivateRoute>} />
         
          {/* Admin Routes with nested paths */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
