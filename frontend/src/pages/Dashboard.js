// src/pages/Dashboard.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { FaSearch, FaMapMarkerAlt, FaInfoCircle } from "react-icons/fa";

const Dashboard = () => {
  const { districts, loading, error } = useData();
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedYear, setSelectedYear] = useState("2024-25");
  const [locationStatus, setLocationStatus] = useState("");
  const navigate = useNavigate();

  const financialYears = [
    "2024-25",
    "2023-24",
    "2022-23",
    "2021-22",
    "2020-21",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDistrict) {
      navigate(`/district/${selectedDistrict}?year=${selectedYear}`);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading districts...</p>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <h3 className="text-sm font-medium text-red-800 mb-2">
          Error loading districts
        </h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // EMPTY STATE
  if (!districts || districts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <h3 className="text-sm font-medium text-yellow-800">
            No districts available
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            We couldn't find any district data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="max-w-3xl mx-auto">
      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          MGNREGA Tracker - Maharashtra
        </h1>
        <p className="text-gray-600">
          Check how your district is performing in MGNREGA
        </p>
      </div>

      {/* SELECTION FORM */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-10 border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* District */}
            <div>
              <label
                htmlFor="district"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Your District
              </label>
              <select
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="block w-full py-2 pl-3 pr-4 border border-gray-300 rounded-md text-gray-700 focus:ring-blue-500 focus:border-blue-500 h-11"
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

            {/* Year */}
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Financial Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="block w-full py-2 pl-3 pr-10 border border-gray-300 rounded-md text-gray-700 focus:ring-blue-500 focus:border-blue-500 h-11"
              >
                {financialYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition duration-200"
            disabled={!selectedDistrict}
          >
            <FaSearch className="mr-2 h-5 w-5" />
            View District Data
          </button>
        </form>

        {/* LOCATION DETECTION */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            onClick={async () => {
              if (!navigator.geolocation) {
                setLocationStatus("❌ Location not supported by browser");
                return;
              }

              setLocationStatus("📍 Detecting location...");

              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const detectedDistrict =
                      data.address?.state_district ||
                      data.address?.county ||
                      "";
                    const matchedDistrict = districts.find(
                      (d) =>
                        d.toUpperCase().includes(detectedDistrict.toUpperCase()) ||
                        detectedDistrict.toUpperCase().includes(d.toUpperCase())
                    );
                    if (matchedDistrict) {
                      setSelectedDistrict(matchedDistrict);
                      setLocationStatus(`✅ Location detected: ${matchedDistrict}`);
                    } else {
                      setLocationStatus(
                        `⚠️ Detected: ${detectedDistrict}. Please select manually.`
                      );
                    }
                  } catch {
                    setLocationStatus(
                      "❌ Could not determine district. Please select manually."
                    );
                  }
                },
                () =>
                  setLocationStatus(
                    "⚠️ Location access denied. Please select manually."
                  )
              );
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-2"
          >
            <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
            Use My Location
          </button>

          {locationStatus && (
            <p className="text-gray-600 text-sm text-center max-w-md">
              {locationStatus}
            </p>
          )}
        </div>
      </div>

      {/* ABOUT SECTION */}
      <div className="bg-blue-50 rounded-xl p-5 text-sm text-blue-800 border border-blue-100 shadow-sm">
        <div className="flex items-start">
          <FaInfoCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">About MGNREGA</p>
            <p className="mb-2 leading-relaxed">
              The Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)
              aims to enhance livelihood security in rural areas by providing at
              least 100 days of wage employment in a financial year to every
              household.
            </p>
            <p className="italic text-blue-900 leading-relaxed">
              "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार हमी योजना (मनरेगा) चा उद्देश
              ग्रामीण भागातील कुटुंबांना दर आर्थिक वर्षात किमान 100 दिवसांचे मजुरीचे
              रोजगार उपलब्ध करून देऊन त्यांच्या उपजीविकेची सुरक्षितता वाढविणे आहे."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
