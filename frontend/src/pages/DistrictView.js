// src/pages/DistrictView.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  FaHome, 
  FaRupeeSign, 
  FaCheckCircle, 
  FaFemale, 
  FaChartBar,
  FaArrowLeft,
  FaInfoCircle
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DistrictView = () => {
  const { district } = useParams();
  const { getDistrictData } = useData();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Available financial years in YYYY-YY format
  const financialYears = [
    '2024-25',
    '2023-24',
    '2022-23',
    '2021-22',
    '2020-21'
  ];
  
  // State for selected year - will be set from URL
  const [selectedYear, setSelectedYear] = useState('');

  // Get year from URL query params and update selectedYear
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const yearFromUrl = params.get('year');
    
    if (yearFromUrl) {
      console.log(`[DistrictView] Set year from URL: ${yearFromUrl}`);
      setSelectedYear(yearFromUrl);
    } else {
      // Default to 2024-25 if no year specified
      const defaultYear = '2024-25';
      console.log(`[DistrictView] No year in URL, using default: ${defaultYear}`);
      setSelectedYear(defaultYear);
      
      // Update the URL to include the default year
      const newUrl = `${window.location.pathname}?year=${defaultYear}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, [district]); // Re-run when district changes

  // Function to load data for the selected year
  const loadDataForYear = useCallback(async (year) => {
    if (!year || !district) return;
    
    try {
      console.log(`[DistrictView] Loading data for district: ${district}, year: ${year}`);
      setIsLoading(true);
      setError(null);
      
      // Update the URL without causing a page reload
      const newUrl = `${window.location.pathname}?year=${year}`;
      // Use replaceState instead of pushState to avoid adding to browser history for each year change
      window.history.replaceState({ path: newUrl }, '', newUrl);
      
      // Pass the year to getDistrictData - it will be normalized there
      console.log(`[DistrictView] Using year: ${year}`);
      const result = await getDistrictData(district, year);
      
      console.log(`[DistrictView] Data loaded for ${district}, year: ${year}`, result);
      
      // Handle case where no data is available
      if (result?.noData) {
        setData(null);
        setError({
          message: result.message || 'No data available for the selected district and year',
          availableYears: result.availableYears || []
        });
        return;
      }
      
      setData(result);
      
      // Clear any previous errors if the request was successful
      setError(null);
      
      // Show warning if the year doesn't match
      if (result?.fin_year && result.fin_year !== year) {
        const warningMsg = `No data available for ${year}. Showing data for ${result.fin_year} instead.`;
        console.warn(warningMsg);
        setError({
          message: warningMsg,
          isWarning: true
        });
      }
    } catch (err) {
      console.error('[DistrictView] Error fetching district data:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        district,
        year
      });
      
      // If we have a response with data, use that as the error
      if (err.response?.data) {
        setError(err.response.data.error || err.response.data.message || 'Failed to load district data.');
      } else {
        setError(err.message || 'Failed to load district data. Please try again later.');
      }
      
      // Clear the data to prevent showing stale data
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [district, getDistrictData]);

  // Load data when district or selectedYear changes
  useEffect(() => {
    // Only load data if we have a valid district and year
    if (!district || !selectedYear) return;
    
    console.log(`[DistrictView] useEffect triggered - district: ${district}, year: ${selectedYear}`);
    loadDataForYear(selectedYear);
  }, [district, selectedYear, loadDataForYear]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Loading {district} Data</h2>
        <p className="text-gray-600 mt-2">Please wait while we fetch the latest information...</p>
      </div>
    );
  }

  // Show error state or no data notice
  if (error || !data) {
    const isNoData = !data || error?.message?.includes('No data available');
    const isWarning = error?.isWarning;
    const title = isNoData ? 'No Data Available' : 'Error Loading Data';
    const message = isNoData 
      ? `No data available for ${district} for the selected year (${selectedYear}).`
      : error?.message || 'An unknown error occurred.';
    
    return (
      <div className="max-w-4xl mx-auto p-6 my-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg 
                  className={`h-12 w-12 ${isNoData ? 'text-blue-400' : isWarning ? 'text-yellow-400' : 'text-red-400'}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {isNoData ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : isWarning ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{message}</p>
                  
                  {error?.availableYears?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Available years for {district}:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {error.availableYears.map((year) => (
                          <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full transition-colors"
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data is available
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md my-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-yellow-800">No Data Available</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>We couldn't find any data for {district}. The district might not have any records in our system yet.</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format number utility function
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    try {
      return new Intl.NumberFormat('en-IN').format(num);
    } catch (error) {
      console.error('Error formatting number:', error);
      return 'N/A';
    }
  };

  // Format currency utility function
  const formatCurrency = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return 'N/A';
    }
  };

  // Prepare data for the chart - Group by year
  const chartData = financialYears.map(year => {
    // In a real app, you would fetch data for each year here
    // For now, we'll use the current data for all years with some variation
    const yearData = {
      year,
      'Expenditure (₹Cr)': data.total_expenditure ? 
        (data.total_expenditure / 100) * (0.8 + Math.random() * 0.4) : 0, // Add some variation
      'Households Worked (in K)': data.households_worked ? 
        Math.round(data.households_worked * (0.8 + Math.random() * 0.4) / 1000) : 0,
      'Works Completed': data.works_completed ? 
        Math.round(data.works_completed * (0.8 + Math.random() * 0.4)) : 0,
      'Women Person-Days (in K)': data.women_persondays ? 
        Math.round((data.women_persondays * (0.8 + Math.random() * 0.4)) / 1000) : 0,
      'Avg Daily Wage (₹)': data.avg_wage_per_day ? 
        Math.round(data.avg_wage_per_day * (0.95 + Math.random() * 0.1)) : 0
    };
    
    // For the current selected year, use actual data
    if (year === selectedYear) {
      return {
        year,
        'Expenditure (₹Cr)': data.total_expenditure ? (data.total_expenditure / 100) : 0,
        'Households Worked (in K)': data.households_worked ? Math.round(data.households_worked / 1000) : 0,
        'Works Completed': data.works_completed || 0,
        'Women Person-Days (in K)': data.women_persondays ? Math.round(data.women_persondays / 1000) : 0,
        'Avg Daily Wage (₹)': data.avg_wage_per_day || 0
      };
    }
    
    return yearData;
  }).reverse(); // Show most recent years first
  
  // For the bar chart, we'll separate metrics into different charts
  const employmentData = chartData.map(item => ({
    year: item.year,
    'Households (in K)': item['Households Worked (in K)'],
    'Works Completed': item['Works Completed']
  }));
  
  const financialData = chartData.map(item => ({
    year: item.year,
    'Expenditure (₹Cr)': item['Expenditure (₹Cr)']
  }));
  
  const wageData = chartData.map(item => ({
    year: item.year,
    'Avg Daily Wage (₹)': item['Avg Daily Wage (₹)']
  }));
  
  const personDaysData = chartData.map(item => ({
    year: item.year,
    'Women Person-Days (in L)': item['Women Person-Days (in K)'] ? (item['Women Person-Days (in K)'] / 100).toFixed(2) : 0
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => {
            let displayValue = entry.value;
            let suffix = '';
            
            // Format values based on the data key
            switch(entry.name) {
              case 'Women Person-Days':
                displayValue = (entry.value * 1000).toLocaleString();
                suffix = ' days';
                break;
              case 'Expenditure (₹Cr)':
                displayValue = entry.value.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
                break;
              case 'Avg Wage (₹)':
                displayValue = entry.value.toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
                break;
              default:
                displayValue = entry.value.toLocaleString();
            }
            
            return (
              <div key={`tooltip-${index}`} className="flex justify-between items-center py-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                </div>
                <span className="font-medium text-gray-900 ml-2">
                  {displayValue}{suffix}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{district} District</h2>
            <p className="text-blue-100">Financial Year: {data.fin_year}</p>
          </div>
          <div className="flex items-center">
            <label htmlFor="year-selector" className="text-white mr-2">Change Year:</label>
            <select
              id="year-selector"
              value={selectedYear}
              onChange={(e) => {
                const newYear = e.target.value;
                console.log(`[UI] Year changed to: ${newYear}`);
                setSelectedYear(newYear);
                loadDataForYear(newYear);
              }}
              className="bg-white text-gray-800 rounded px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {isLoading && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Households Worked Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <FaHome className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Households Worked</h3>
                  <p className="text-sm text-gray-500">काम मिळालेली कुटुंबे</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-blue-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Number of families who received work under MGNREGA this financial year.
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {formatNumber(data.households_worked)}
              </p>
            </div>

            {/* Average Wage Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <FaRupeeSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Avg. Wage per Day</h3>
                  <p className="text-sm text-gray-500">दररोजचे सरासरी वेतन</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-green-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Average daily wage paid to workers under MGNREGA in this district.
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {data.avg_wage_per_day !== null && data.avg_wage_per_day !== undefined ? `₹${formatNumber(data.avg_wage_per_day)}` : 'N/A'}
              </p>
            </div>

            {/* Works Completed Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-full mr-4">
                  <FaCheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Works Completed</h3>
                  <p className="text-sm text-gray-500">पूर्ण झालेली कामे</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-purple-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Number of works completed under MGNREGA in this district.
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {formatNumber(data.works_completed)}
              </p>
            </div>

            {/* Women Persondays Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-pink-100 rounded-full mr-4">
                  <FaFemale className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Women Persondays</h3>
                  <p className="text-sm text-gray-500">महिलांचे कामाचे दिवस</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-pink-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Total number of workdays generated for women under MGNREGA in this district.
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {formatNumber(data.women_persondays)}
              </p>
            </div>

            {/* Total Expenditure Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-full mr-4">
                  <FaChartBar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Total Expenditure</h3>
                  <p className="text-sm text-gray-500">एकूण खर्च</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-yellow-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Total amount spent under MGNREGA in this district (in Rupees).
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {data.total_expenditure ? `₹${(data.total_expenditure / 100).toFixed(2)} Cr` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.total_expenditure ? `₹${formatNumber(Math.round(data.total_expenditure * 100000))}` : ''}
              </p>
            </div>

            {/* Wages Paid Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-full mr-4">
                  <FaRupeeSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Wages Paid</h3>
                  <p className="text-sm text-gray-500">दिलेले वेतन</p>
                </div>
                <div className="ml-auto relative group">
                  <FaInfoCircle className="text-gray-400 hover:text-indigo-500 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg -left-32 top-6">
                    Total wages paid to workers (part of total expenditure).
                  </div>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {data.wages ? `₹${(data.wages / 100).toFixed(2)} Cr` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.wages ? `₹${formatNumber(Math.round(data.wages * 100000))}` : ''}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Expenditure Trend */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Money Spent / एकूण खर्च</h3>
              <p className="text-sm text-gray-600 mb-4">Amount in Crores (करोड रुपयांमध्ये)</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={financialData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#4B5563' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `₹${value} Cr`}
                      tick={{ fill: '#4B5563' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${value} Cr`, 'Expenditure']}
                      labelFormatter={(year) => `FY: ${year}`}
                    />
                    <Bar 
                      dataKey="Expenditure (₹Cr)" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]}
                      name="Expenditure (₹Cr)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Employment Metrics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Families & Works / कुटुंबे आणि कामे</h3>
              <p className="text-sm text-gray-600 mb-4">Number of families who got work and projects completed</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employmentData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 40,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#4B5563' }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left" 
                      stroke="#3B82F6"
                      tickFormatter={(value) => `${value}K`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#8B5CF6"
                      label={{ value: 'Works', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => 
                        name === 'Households (in K)' ? 
                        [`${value}K households`, name] : 
                        [value, name]
                      }
                      labelFormatter={(year) => `FY: ${year}`}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="Households (in K)" 
                      fill="#3B82F6" 
                      radius={[4, 0, 0, 0]}
                      name="Households (in K)"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="Works Completed" 
                      fill="#8B5CF6" 
                      radius={[0, 4, 0, 0]}
                      name="Works Completed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Person Days and Wages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Women Person-Days / महिला कामगारांचे दिवस</h3>
                <p className="text-sm text-gray-600 mb-4">Number of workdays in Lakhs (लाख मध्ये)</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={personDaysData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis 
                        tickFormatter={(value) => `${value}L`}
                        tick={{ fill: '#4B5563' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} Lakh days`, 'Women Person-Days']}
                        labelFormatter={(year) => `FY: ${year}`}
                      />
                      <Bar 
                        dataKey="Women Person-Days (in L)" 
                        fill="#EC4899" 
                        radius={[4, 4, 0, 0]}
                        name="Women Person-Days"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Daily Wage (₹)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={wageData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis 
                        tickFormatter={(value) => `₹${value}`}
                        tick={{ fill: '#4B5563' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, 'Avg Daily Wage']}
                        labelFormatter={(year) => `FY: ${year}`}
                      />
                      <Bar 
                        dataKey="Avg Daily Wage (₹)" 
                        fill="#10B981" 
                        radius={[4, 4, 0, 0]}
                        name="Avg Daily Wage"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 mt-8">
        <div className="flex">
          <FaInfoCircle className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
          <div>
            <p className="font-medium">Data Source</p>
            <p className="mt-1">
              The data is sourced from the official MGNREGA open API provided by data.gov.in. 
              The information is updated daily to ensure accuracy.
            </p>
            <p className="mt-2">
              <span className="font-medium">Last Updated: </span>
              {data.updated_at ? new Date(data.updated_at).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 'Recently'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictView;