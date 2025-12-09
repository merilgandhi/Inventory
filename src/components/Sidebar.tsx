import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiBox, FiLayers, FiEdit2, FiChevronDown, FiPackage } from "react-icons/fi";

const Sidebar: React.FC = () => {
  const [openProducts, setOpenProducts] = useState(false);

  return (
    <aside className="bg-slate-900 text-white w-64 h-screen p-5 space-y-6">

      <h2 className="text-xl font-bold mb-6">Inventory Panel</h2>

      <nav className="space-y-3">

        <div>
          <button
            className="flex items-center justify-between w-full text-left hover:text-amber-300"
            onClick={() => setOpenProducts(!openProducts)}
          >
            <span className="flex items-center space-x-2">
              <FiBox />
              <span>Manage Product</span>
            </span>
            <FiChevronDown className={`${openProducts ? "rotate-180" : ""} transition`} />
          </button>

          {openProducts && (
            <div className="ml-6 mt-2 space-y-2">
              <Link
                to="/products/edit"
                className="flex items-center space-x-2 hover:text-amber-300"
              >
                <FiEdit2 />
                <span>Products List</span>
              </Link>
            <Link
                to="/products/variations"
                className="flex items-center space-x-2 hover:text-amber-300"
              >
                <FiLayers />
                <span>Variations</span>
              </Link>

            </div>
          )}
        </div>

        <Link
          to="/stock"
          className="flex items-center space-x-2 hover:text-amber-300"
        >
          <FiPackage />
          <span>Stock</span>
        </Link>

      </nav>
    </aside>
  );
};

export default Sidebar;
