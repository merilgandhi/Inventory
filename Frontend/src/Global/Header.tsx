import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMenu, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { ErrorToast } from "../components/ToastStyles";
import logo from "/inventory.png";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user, loading } = useAuth();

  const hideAuthControls = location.pathname === "/" || location.pathname === "/login";

  const handleLogout = () => {
    logout();
    toast.custom(() => <ErrorToast message="Logged out" />);
    navigate("/");
  };

  return (
    <header className="bg-[#0B132B]/90 backdrop-blur-xl text-white shadow-xl border-b border-[#1C2541] sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#1C2541]/40 border border-amber-400 shadow-md flex items-center justify-center">
            <img
              src={logo}
              className="h-6 w-6 opacity-90 group-hover:opacity-100 transition"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-wide group-hover:text-amber-300 transition">
            <span className="text-amber-400">Stock</span> Up
          </h1>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {!loading && !hideAuthControls && isAuthenticated && user && (
            <div className="px-4 py-2 bg-[#1C2541]/40 rounded-lg border border-[#3A506B]/30 flex items-center gap-3">
              <FiUser className="text-amber-300" />
              {user.username || user.email}
            </div>
          )}

          {!loading && !hideAuthControls && isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg"
            >
              Logout
            </button>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md border border-[#1C2541] bg-[#1C2541]/40 hover:bg-[#1C2541]/70 text-amber-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0B132B]/95 border-t border-[#1C2541] px-6 py-4 space-y-4 animate-fadeIn">
          {!loading && !hideAuthControls && isAuthenticated && user && (
            <div className="flex items-center gap-3 px-4 py-2 bg-[#1C2541]/40 rounded-lg border border-[#3A506B]/30">
              <FiUser className="text-amber-300" />
              {user.username || user.email}
            </div>
          )}

          {!loading && !hideAuthControls && isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg">
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
