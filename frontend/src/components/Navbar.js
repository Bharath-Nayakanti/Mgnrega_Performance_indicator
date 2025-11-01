// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="text-xl font-bold text-blue-600 flex items-center"
              >
                <FaHome className="mr-2" />
                MGNREGA Maharashtra
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            
            <a
              href="https://nrega.dord.gov.in/MGNREGA_new/Nrega_home.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Official MGNREGA Portal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;