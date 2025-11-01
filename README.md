# MGNREGA Tracker - Maharashtra

A web application for tracking and visualizing MGNREGA (Mahatma Gandhi National Rural Employment Guarantee Act) performance data across districts in Maharashtra.

## Overview

This application helps rural communities, administrators, and policymakers monitor MGNREGA implementation by providing easy-to-understand visualizations of employment, wages, and expenditure data.

## Key Features

- **District-wise Data**: View detailed MGNREGA metrics for all Maharashtra districts
- **Multi-year Comparison**: Compare performance across financial years (2020-21 to 2024-25)
- **Auto-location Detection**: Automatically detect user's district using geolocation
- **Bilingual Interface**: English and Marathi for better accessibility
- **Interactive Charts**: Visual representation of key metrics
- **Real-time Updates**: Data automatically refreshed daily from government API
- **Offline-first**: Fast responses from local database with API fallback

## Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Recharts (data visualization)
- React Router
- Axios

### Backend
- Node.js with Express.js
- SQLite3 database
- node-cron (scheduled updates)
- Axios (API integration)

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌──────────┐
│   Frontend  │────────▶│   Backend   │────────▶│ Database │
│   (React)   │  HTTP   │  (Express)  │  Query  │ (SQLite) │
└─────────────┘         └─────────────┘         └──────────┘
                              │                       ▲
                              │                       │
                              ▼                       │
                       ┌─────────────┐               │
                       │   Gov API   │───────────────┘
                       │(data.gov.in)│    Auto-update
                       └─────────────┘    (Daily 2 AM)
```

### Data Flow
1. User requests data → Backend checks database
2. If found → Return immediately (fast!)
3. If not found → Fetch from government API → Store in database → Return
4. Scheduler updates database daily at 2 AM IST

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd mgnrega-tracker
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
echo "PORT=5001" > .env
echo "API_KEY=579b464db66ec23bdd000001daca76d23bf8470b46288ea5ae2c17db" >> .env
echo "NODE_ENV=development" >> .env

# Populate database
npm run populate-db
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5001/api" > .env
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves built frontend)
cd ../backend
npm start
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with auto-updates
- `npm start` - Start production server
- `npm run populate-db` - Manually populate database
- `npm run clean-db` - Clean database
- `npm run refresh-db` - Clean and repopulate database

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## API Endpoints

### Data Endpoints
- `GET /api/districts` - Get list of all districts
- `GET /api/district/:district?year=YYYY-YY` - Get specific district data
- `GET /api/data?state&district&year` - Get filtered data

### Scheduler Endpoints
- `GET /api/scheduler/status` - Check auto-update status
- `POST /api/scheduler/update` - Trigger manual update

## Database Schema

The `district_data` table stores comprehensive MGNREGA metrics:
- Basic info: state, district, financial year, month
- Employment: households worked, individuals worked, persondays
- Financial: total expenditure, wages, material costs
- Performance: works completed, average wage per day
- Demographics: SC/ST workers, women persondays

## Auto-Update System

### Schedule
- **Daily Update**: 2:00 AM IST
- **Weekly Full Refresh**: Sundays 3:00 AM IST
- **On-Demand**: Fetches missing data automatically

### How It Works
1. Scheduler runs at scheduled time
2. Fetches latest data from government API
3. Updates database (INSERT OR REPLACE)
4. Logs completion
5. Next user request gets fresh data

## Key Metrics Explained

### 1. Households Worked (काम मिळालेली कुटुंबे)
Number of families who received employment under MGNREGA

### 2. Women Persondays (महिलांचे कामाचे दिवस)
Total work-days generated for women
- Formula: Number of women × Days worked
- Example: 5,000 women × 24 days = 120,000 persondays

### 3. Total Expenditure (एकूण खर्च)
Total amount spent on MGNREGA in the district
- Includes wages, materials, and administrative costs
- Displayed in Crores (1 Crore = 10 million)

### 4. Wages Paid (दिलेले वेतन)
Total wages paid directly to workers
- Part of total expenditure
- Excludes material and administrative costs

### 5. Works Completed (पूर्ण झालेली कामे)
Number of MGNREGA projects completed

### 6. Average Wage per Day (दररोजचे सरासरी वेतन)
Average daily wage paid to workers

## Features for Rural Users

### Bilingual Support
- All labels in English and Marathi
- Clear, simple language
- Visual icons for easy recognition

### Number Formatting
- Indian number system (1,19,959 not 119,959)
- Dual format: ₹14.91 Cr AND ₹14,91,12,087
- Large, bold numbers for key metrics

### Auto-location
- Detects user's district automatically
- Uses browser geolocation
- Falls back to manual selection if needed

### Simple Visualizations
- Color-coded cards
- Clear bar charts
- Tooltips with explanations

## Data Source

All data is sourced from the official MGNREGA API provided by data.gov.in:
- API Base: `https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722`
- Updated daily
- Covers all Maharashtra districts
- Financial years: 2020-21 to 2024-25

## Troubleshooting

### Backend won't start
- Check if port 5001 is available
- Verify `.env` file exists
- Run `npm install` again

### Frontend shows connection error
- Ensure backend is running on port 5001
- Check `REACT_APP_API_URL` in frontend `.env`
- Verify CORS is enabled in backend

### No data showing
- Run `npm run populate-db` in backend
- Check database file exists: `backend/data/mgnrega.db`
- Verify API key in backend `.env`

### Location detection not working
- Allow location access in browser
- Works only on HTTPS or localhost
- Falls back to manual selection

## Project Structure

```
mgnrega-tracker/
├── backend/
│   ├── data/              # SQLite database
│   ├── scripts/           # Database scripts
│   ├── scheduler.js       # Auto-update scheduler
│   ├── server.js          # Express server
│   ├── start.js           # Startup script
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context
│   │   ├── pages/         # Page components
│   │   └── App.js
│   └── package.json
└── README.md
```

## Performance

- **Database Response**: 10-50ms
- **API Fallback**: 2-5 seconds
- **Database Size**: ~500 KB for 5 years
- **Records**: ~2,000 (36 districts × 12 months × 5 years)

## Future Enhancements

- [ ] Add more states beyond Maharashtra
- [ ] District comparison feature
- [ ] Export data to PDF/CSV
- [ ] Mobile app (React Native)
- [ ] SMS alerts for updates
- [ ] Voice interface for accessibility
- [ ] Historical trend analysis
- [ ] Predictive analytics

## Contributing

This project was built for the Bharat Fellowship program to improve MGNREGA transparency and accessibility.

## License

MIT License

## Contact

For questions or support, please contact the development team.

---

**Built with ❤️ for rural India**
