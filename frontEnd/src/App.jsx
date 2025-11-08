import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./Components/Navbar/Navbar";
import AdminNavbar from "./Components/Navbar/AdminNavbar";
import Footer from "./Components/Footer/Footer";

import Home from "./Components/Pages/Home";
import Shop from "./Components/Pages/Shop";
import Design from "./Components/Pages/Design";
import Planner from "./Components/Pages/Planner";
import About from "./Components/Pages/About";
import Contact from "./Components/Pages/Contact";
import Cart from "./Components/Pages/Cart";
import Login from "./Components/Pages/Login";
import Signup from "./Components/Pages/Signup";
import AdminPage from "./Components/Pages/Adminpage";
import AddPlant from "./Components/Pages/AddPlant";
import ManagePlant from "./Components/Pages/ManagePlant";

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
          <Route path="/design" element={<PrivateRoute><Design /></PrivateRoute>} />
          <Route path="/planner" element={<PrivateRoute><Planner /></PrivateRoute>} />
          <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
          <Route path="/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />

          {/* Admin Routes with nested paths */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add"
            element={
              <AdminRoute>
                <AddPlant />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/manage"
            element={
              <AdminRoute>
                <ManagePlant />
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
