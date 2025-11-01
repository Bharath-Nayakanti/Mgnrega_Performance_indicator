// src/pages/Dashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { FaSearch, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';

const Dashboard = () => {
  const { districts, loading, error } = useData();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const navigate = useNavigate();
  
  // Available financial years in YYYY-YY format
  const financialYears = [
    '2024-25',
    '2023-24',
    '2022-23',
    '2021-22',
    '2020-21'
  ];
  
  // Default to the first year in the list
  const [selectedYear, setSelectedYear] = useState(financialYears[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDistrict) {
      const yearParam = encodeURIComponent(selectedYear);
      navigate(`/district/${selectedDistrict}?year=${yearParam}`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading districts...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading districts</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!districts || districts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No districts available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>We couldn't find any district data. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          MGNREGA Tracker - Maharashtra
        </h1>
        <p className="text-gray-600">
          Check how your district is performing in MGNREGA
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                Select Your District
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="district"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md h-12"
                  required
                >
                  <option value="">Select a district</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Financial Year
              </label>
              <div className="mt-1">
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-3 text-base border-gray-300 rounded-md h-12"
                >
                  {financialYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              disabled={!selectedDistrict}
            >
              <FaSearch className="mr-2 h-5 w-5" />
              View District Data
            </button>
          </div>
        </form>

        {/* ✅ Fixed "Use My Location" Section */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            onClick={async () => {
              if (!navigator.geolocation) {
                setLocationStatus('❌ Location not supported by browser');
                return;
              }
              
              setLocationStatus('📍 Detecting location...');
              
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const detectedDistrict = data.address?.state_district || data.address?.county || '';
                    const matchedDistrict = districts.find(d => 
                      d.toUpperCase().includes(detectedDistrict.toUpperCase()) ||
                      detectedDistrict.toUpperCase().includes(d.toUpperCase())
                    );
                    if (matchedDistrict) {
                      setSelectedDistrict(matchedDistrict);
                      setLocationStatus(`✅ Location detected: ${matchedDistrict}`);
                    } else {
                      setLocationStatus(`⚠️ Detected: ${detectedDistrict}. Please select manually.`);
                    }
                  } catch {
                    setLocationStatus('❌ Could not determine district. Please select manually.');
                  }
                },
                () => setLocationStatus('⚠️ Location access denied. Please select manually.')
              );
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-2"
          >
            <FaMapMarkerAlt className="text-blue-600 h-4 w-4" />
            Use My Location
          </button>

          {locationStatus && (
            <p className="text-gray-600 text-sm text-center max-w-md">{locationStatus}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
        <div className="flex">
          <FaInfoCircle className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
          <div>
            <p className="font-medium">About MGNREGA</p>
            <p className="mt-1">
              The Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA) aims to enhance livelihood security 
              in rural areas by providing at least 100 days of wage employment in a financial year to every household.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
