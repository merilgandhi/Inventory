import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiShoppingBag,
  FiList,
  FiGitMerge,
  FiUserCheck,
  FiChevronDown,
  FiMenu,
  FiX,
  FiShoppingCart,
  FiClipboard,
  FiFilePlus,
} from "react-icons/fi";

const Sidebar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);

  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-[#0B132B]/95 border-r border-[#1C2541] shadow-xl backdrop-blur-xl fixed left-0 top-0 z-40">
        {/* LOGO TITLE */}
        <div className="px-6 py-6 border-b border-[#1C2541]">
          <h1 className="text-2xl font-bold tracking-wide text-slate-200">
            <span className="text-amber-400">Stock</span> Up
          </h1>
        </div>

        {/* MENU */}
        <nav className="mt-6 px-4 space-y-5">
          {/* MANAGE PRODUCT */}
          <div>
            <button
              onClick={() => setProductOpen(!productOpen)}
              className="w-full flex justify-between items-center px-4 py-3
              rounded-xl bg-[#1C2541] border border-[#3A506B]/30
              hover:border-amber-400 hover:bg-[#1C2541]/95 transition"
            >
              <span className="flex items-center gap-3 text-slate-200 font-medium">
                <FiShoppingBag className="text-amber-300" size={18} />
                Manage Product
              </span>
              <FiChevronDown
                className={`${
                  productOpen ? "rotate-180" : ""
                } transition text-slate-200`}
              />
            </button>

            {productOpen && (
              <div className="ml-6 mt-3 space-y-3 animate-fadeIn">
                <Link
                  to="/products/edit"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/products/edit")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiList size={16} className="text-amber-300" />
                  Products List
                </Link>

                <Link
                  to="/products/variations"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/products/variations")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiGitMerge size={16} className="text-amber-300" />
                  Variations
                </Link>
              </div>
            )}
          </div>

          {/* SELLERS */}
          <Link
            to="/sellers"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1C2541]
              border border-[#3A506B]/30 transition hover:border-amber-400
              ${
                isActive("/sellers") ? "border-amber-400 bg-amber-400/20" : ""
              } text-slate-200`}
          >
            <FiUserCheck className="text-amber-300" size={18} />
            Sellers
          </Link>
          {/* ORDERS */}
          <div>
            <button
              onClick={() => setOrdersOpen(!ordersOpen)}
              className="w-full flex justify-between items-center px-4 py-3
              rounded-xl bg-[#1C2541] border border-[#3A506B]/30
              hover:border-amber-400 hover:bg-[#1C2541]/95 transition"
            >
              <span className="flex items-center gap-3 text-slate-200 font-medium">
                <FiShoppingCart className="text-amber-300" size={18} />
                Orders
              </span>
              <FiChevronDown
                className={`${
                  ordersOpen ? "rotate-180" : ""
                } transition text-slate-200`}
              />
            </button>

            {ordersOpen && (
              <div className="ml-6 mt-3 space-y-3 animate-fadeIn">
                <Link
                  to="/orders"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/orders")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiFilePlus size={16} className="text-amber-300" />
                  Create Order
                </Link>

                <Link
                  to="/products/variations"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/products/variations")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiClipboard size={16} className="text-amber-300" />
                  Orders List
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-[#1C2541]/70 
        border border-[#3A506B]/30 rounded-xl text-amber-300 shadow-xl backdrop-blur-md"
      >
        <FiMenu size={22} />
      </button>

      {/* MOBILE SLIDE-IN SIDEBAR */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <aside className="w-64 h-full bg-[#0B132B] fixed left-0 top-0 shadow-xl p-4 animate-slideIn">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-md bg-[#1C2541] text-slate-200"
            >
              <FiX size={20} />
            </button>

            {/* LOGO */}
            <div className="px-4 py-6 border-b border-[#1C2541]">
              <h1 className="text-2xl font-bold tracking-wide text-slate-200">
                <span className="text-amber-400">Stock</span> Up
              </h1>
            </div>

            {/* MOBILE MENU */}
            <nav className="mt-6 px-2 space-y-5">
              {/* MANAGE PRODUCT */}
              <div>
                <button
                  onClick={() => setProductOpen(!productOpen)}
                  className="w-full flex justify-between items-center px-4 py-3
                  rounded-xl bg-[#1C2541] border border-[#3A506B]/30
                  hover:border-amber-400 transition text-slate-200"
                >
                  <span className="flex items-center gap-3">
                    <FiShoppingBag className="text-amber-300" size={18} />
                    Manage Product
                  </span>
                  <FiChevronDown
                    className={`${productOpen ? "rotate-180" : ""} transition`}
                  />
                </button>

                {productOpen && (
                  <div className="ml-6 mt-2 space-y-2 animate-fadeIn text-slate-200">
                    <Link
                      to="/products/edit"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1C2541]"
                    >
                      <FiList size={16} className="text-amber-300" />
                      Products List
                    </Link>

                    <Link
                      to="/products/variations"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1C2541]"
                    >
                      <FiGitMerge size={16} className="text-amber-300" />
                      Variations
                    </Link>
                  </div>
                )}
              </div>

              {/* SELLERS */}
              <Link
                to="/sellers"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1C2541]
                border border-[#3A506B]/30 hover:border-amber-400 transition text-slate-200"
              >
                <FiUserCheck size={18} className="text-amber-300" />
                Sellers
              </Link>

              <div>
            <button
              onClick={() => setOrdersOpen(!ordersOpen)}
              className="w-full flex justify-between items-center px-4 py-3
              rounded-xl bg-[#1C2541] border border-[#3A506B]/30
              hover:border-amber-400 hover:bg-[#1C2541]/95 transition"
            >
              <span className="flex items-center gap-3 text-slate-200 font-medium">
                <FiShoppingCart className="text-amber-300" size={18} />
                Orders
              </span>
              <FiChevronDown
                className={`${
                  ordersOpen ? "rotate-180" : ""
                } transition text-slate-200`}
              />
            </button>

            {ordersOpen && (
              <div className="ml-6 mt-3 space-y-3 animate-fadeIn">
                <Link
                  to="/orders"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/orders")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiFilePlus size={16} className="text-amber-300" />
                  Create Order
                </Link>

                <Link
                  to="/products/variations"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition border 
                  ${
                    isActive("/products/variations")
                      ? "bg-amber-400/20 border-amber-300"
                      : "border-transparent hover:bg-[#1C2541]"
                  } text-slate-200`}
                >
                  <FiClipboard size={16} className="text-amber-300" />
                  Orders List
                </Link>
              </div>
            )}
          </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
