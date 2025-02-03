# Census State Profiles

An interactive visualization of US state census data using D3.js and the Census API.

## Features
- Interactive US map with state-by-state visualization
- Real-time census data display on hover
- Population data from the 2020 Census
- Responsive design and error handling
- Caching for improved performance

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/MahiaRahman9971/cs1060hw1.git
cd cs1060hw1
```

2. Install dependencies:
```bash
npm install
```

3. Start the local server:
```bash
python -m http.server 8000
# or if you have Python 3:
python3 -m http.server 8000
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Running Tests
Run the test suite with:
```bash
npm test
```

The test suite covers:
- UI interactions
- API integration
- Error handling
- Data processing
- State caching

## Dependencies
All dependencies are managed through npm:
- D3.js (v7) - For map visualization
- TopoJSON (v3) - For geographic data handling
- Jest (v29) - For testing
- Jest-Environment-JSDOM - For DOM testing

## Development
The main components are:
- `index.html` - Main page structure
- `index.js` - Core application logic and API integration
- `styles.css` - Application styling
- `index.test.js` - Test suite

## Contact
If you encounter any issues with setup or running the application, please reach out:
- Mahia Rahman
- mahiarahman@college.harvard.edu
- GitHub: MahiaRahman9971

## Notes
- The application uses the Census API with a provided key
- All data is fetched from the 2020 Census
- Internet connection required for API calls
- Tested on modern browsers (Chrome, Firefox, Safari)
