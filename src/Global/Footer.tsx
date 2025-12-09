import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          <div>
            <h2 className="text-lg font-semibold mb-4 text-white">
              InventoryApp
            </h2>
            <p className="text-sm text-gray-400">
              Manage your stock, track products, and control inventory with ease.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-white" to="/">Home</Link></li>
              <li><Link className="hover:text-white" to="/products">Products</Link></li>
              <li><Link className="hover:text-white" to="/stock">Stock</Link></li>
              <li><Link className="hover:text-white" to="/about">About</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-white">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Email: support@inventoryapp.com</li>
              <li>Phone: +91 98765 43210</li>
              <li>Location: Gujarat, India</li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} InventoryApp. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
