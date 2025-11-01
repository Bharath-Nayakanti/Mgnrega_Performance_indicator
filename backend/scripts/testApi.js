const axios = require('axios');

const API_URL = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

async function testApi() {
  try {
    console.log('Testing API connection...');
    
    // Try with different parameters
    const testCases = [
      {
        name: 'Original query with Telangana and 2024',
        params: {
          'api-key': API_KEY,
          format: 'json',
          offset: '0',
          limit: '5',
          'filters[state_name]': 'Telangana',
          'filters[fin_year]': '2024'
        }
      },
      {
        name: 'Without fin_year filter',
        params: {
          'api-key': API_KEY,
          format: 'json',
          limit: '5',
          'filters[state_name]': 'Telangana'
        }
      },
      {
        name: 'With different state (Karnataka)',
        params: {
          'api-key': API_KEY,
          format: 'json',
          limit: '5',
          'filters[state_name]': 'Karnataka'
        }
      },
      {
        name: 'Without any filters (just get any data)',
        params: {
          'api-key': API_KEY,
          format: 'json',
          limit: '5'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n=== Testing: ${testCase.name} ===`);
      const params = new URLSearchParams(testCase.params);
      const url = `${API_URL}?${params.toString()}`;
      console.log('Request URL:', url);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US',
            'User-Agent': 'MGNREGA-Tracker/1.0'
          },
          params: {}
        });

        console.log('API Response Status:', response.status);
        
        if (response.data && response.data.records && response.data.records.length > 0) {
          console.log('Success! Found', response.data.records.length, 'records');
          console.log('First record:', JSON.stringify(response.data.records[0], null, 2));
          return; // Stop testing if we find data
        } else {
          console.log('No records found in response');
          console.log('Response keys:', Object.keys(response.data));
        }
      } catch (error) {
        console.error('Error in test case:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
    }
    
    console.log('\nAll test cases completed without finding any data.');
    return;

    // The test cases are now handled in the loop above
    
  } catch (error) {
    console.error('\nError fetching data from API:');
    console.error('---------------------------');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request details:');
      console.error('Method:', error.request.method);
      console.error('URL:', error.request.url);
      console.error('Headers:', error.request.headers);
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
    
    console.error('\nError config:', {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      params: error.config?.params
    });
  }
}

// Run the test
testApi();
