// src/context/DataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  console.error('REACT_APP_API_URL is not set in the environment variables');
  console.log('Current environment variables:', process.env);
}

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState(null);

  const fetchDistricts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/districts`);
      setDistricts(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching districts:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load districts. Please try again later.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Normalize year format (convert YYYY-YYYY to YYYY-YY)
  const normalizeYear = (year) => {
    if (!year) return '2023-24';
    
    // If already in YYYY-YY format, return as is
    if (/^\d{4}-\d{2}$/.test(year)) {
      return year;
    }
    
    // Convert YYYY-YYYY to YYYY-YY
    const match = year.match(/^(\d{4})-(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2].substring(2)}`;
    }
    
    return year; // Return as is if format is unexpected
  };

  // Fetch data for a specific district and year
  const getDistrictData = async (district, year = '2023-24') => {
    if (!district) {
      console.error('No district provided to getDistrictData');
      throw new Error('District name is required');
    }

    // Ensure year is in YYYY-YY format
    const normalizedYear = normalizeYear(year);
    const url = `${API_BASE_URL}/district/${encodeURIComponent(district)}`;
    console.log(`[FRONTEND] Fetching data from: ${url}`, { district, year: normalizedYear });
    
    try {
      const response = await axios.get(url, {
        params: { 
          year: normalizedYear,
          _: new Date().getTime() // Add cache buster to prevent caching
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 10000, // 10 second timeout
        withCredentials: false // Ensure credentials are not sent
      });
      
      console.log('[FRONTEND] Received data from API:', response.data);
      
      // If the response indicates no data is available
      if (response.status === 404) {
        return {
          district_name: district,
          fin_year: normalizedYear,
          noData: true,
          message: response.data?.message || 'No data available for the selected district and year',
          availableYears: response.data?.availableYears || []
        };
      }
      
      return response.data;
      
    } catch (err) {
      console.error(`[FRONTEND] Error fetching data for ${district}:`, {
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        stack: err.stack
      });
      
      // Handle 404 - No data available
      if (err.response?.status === 404) {
        return {
          district_name: district,
          fin_year: normalizeYear(year),
          noData: true,
          message: err.response.data?.message || 'No data available for the selected district and year',
          availableYears: err.response.data?.availableYears || []
        };
      }
      
      // If we have a response with data, use that as the error
      if (err.response?.data) {
        console.error('Error details:', err.response.data);
        throw new Error(err.response.data.error || err.response.data.message || 'Failed to fetch district data');
      }
      
      // If no response, use the error message or a generic one
      throw new Error(err.message || 'Failed to fetch district data. Please try again later.');
    }
  };

  // Fetch multi-year data for a specific district
  const getMultiYearDistrictData = async (district) => {
    if (!district) {
      console.error('No district provided to getMultiYearDistrictData');
      throw new Error('District name is required');
    }

    const url = `${API_BASE_URL}/district/${encodeURIComponent(district)}/all-years`;
    console.log(`[FRONTEND] Fetching multi-year data from: ${url}`, { district });
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000, // 15 second timeout for multi-year data
        withCredentials: false
      });
      
      console.log('[FRONTEND] Received multi-year data from API:', response.data);
      return response.data;
      
    } catch (err) {
      console.error(`[FRONTEND] Error fetching multi-year data for ${district}:`, {
        message: err.message,
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        stack: err.stack
      });
      
      // Handle 404 - No data available
      if (err.response?.status === 404) {
        return {
          district_name: district,
          years: {},
          availableYears: [],
          noData: true,
          message: err.response.data?.message || 'No multi-year data available for the selected district'
        };
      }
      
      // If we have a response with data, use that as the error
      if (err.response?.data) {
        console.error('Error details:', err.response.data);
        throw new Error(err.response.data.error || err.response.data.message || 'Failed to fetch multi-year district data');
      }
      
      // If no response, use the error message or a generic one
      throw new Error(err.message || 'Failed to fetch multi-year district data. Please try again later.');
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Initial districts fetch
  useEffect(() => {
    fetchDistricts();
  }, []);

  return (
    <DataContext.Provider value={{ districts, error, fetchDistricts, getDistrictData, getMultiYearDistrictData }}>
      {children}
    </DataContext.Provider>
  );
};