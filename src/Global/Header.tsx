import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { ErrorToast } from "../components/ToastStyles";

import logo from "/inventory.png";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.custom(() => <ErrorToast message="Logged out" />);
    navigate("/");
  };

  return (
    <header className="bg-slate-950 text-white shadow-md">
      <div className="max-w-7xl ml-10 px-6 py-4 flex justify-between items-center">

        {/* LOGO + APP NAME */}
        <Link to="/home" className="flex items-center space-x-3 group">
          <img
            src={logo}
            alt="App Logo"
            className="h-10 w-10 object-contain rounded-md group-hover:opacity-90 transition"
          />
          <span className="text-2xl font-bold tracking-wide group-hover:text-amber-100 transition">
            Stock Up  
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center space-x-6">

          {/* SHOW CURRENT USER */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-2">
              <FiUser className="text-xl" />
              <span className="text-sm font-medium">
                {user.username || user.name || user.email}
              </span>
            </div>
          )}

          {/* LOGOUT BUTTON */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-1.5 rounded-md hover:bg-red-600 transition text-sm"
            >
              Logout
            </button>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 px-6 pb-4 space-y-4 text-sm font-medium animate-slideDown">

          {/* USER INFO ON MOBILE */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-2">
              <FiUser className="text-xl" />
              <span>{user.username || user.email || "User"}</span>
            </div>
          )}

          {/* LOGOUT BUTTON MOBILE */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded-md transition text-left"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
