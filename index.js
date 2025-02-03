// Add at the beginning of the file
const isTestEnvironment = typeof jest !== 'undefined';

// Sample census data (you can replace this)
const CENSUS_API_KEY = '53ec8130e4411ed08c1b622c878dd5676142791e';
const censusData = {};

// Function to format numbers with commas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to format percentages
function formatPercentage(value) {
    return `${parseFloat(value).toFixed(1)}%`;
}

// Function to fetch census data for a state
async function fetchStateCensusData(state) {
    if (!state || !state.properties || !state.properties.name) {
        return {
            population: 'Error loading data',
            medianIncome: 'Error loading data',
            education: 'Error loading data',
            medianAge: 'Error loading data',
            homeownership: 'Error loading data',
            capital: 'Error loading data'
        };
    }

    const stateName = state.properties.name;
    const stateId = stateIdMapping[stateName];

    // If we already have the data, return it from cache
    if (censusData[stateId]) {
        return censusData[stateId];
    }

    try {
        // Get population data (2020 Census)
        const popResponse = await fetch(
            `https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=state:${stateId}&key=${CENSUS_API_KEY}`
        );
        
        if (!popResponse.ok) throw new Error('Population API response was not ok');
        const popData = await popResponse.json();
        if (!popData?.[1]?.[0]) throw new Error('Invalid population data');

        // Get income data (ACS 5-year)
        const incomeResponse = await fetch(
            `https://api.census.gov/data/2021/acs/acs5?get=B19013_001E&for=state:${stateId}&key=${CENSUS_API_KEY}`
        );
        
        if (!incomeResponse.ok) throw new Error('Income API response was not ok');
        const incomeData = await incomeResponse.json();
        if (!incomeData?.[1]?.[0]) throw new Error('Invalid income data');

        // Get education data (% with Bachelor's or higher)
        const educationResponse = await fetch(
            `https://api.census.gov/data/2021/acs/acs5?get=B15003_022E,B15003_023E,B15003_024E,B15003_025E,B15003_001E&for=state:${stateId}&key=${CENSUS_API_KEY}`
        );
        
        if (!educationResponse.ok) throw new Error('Education API response was not ok');
        const educationData = await educationResponse.json();
        if (!educationData?.[1]) throw new Error('Invalid education data');
        
        // Calculate percentage with Bachelor's or higher
        const [bachelors, masters, professional, doctorate, total] = educationData[1].slice(0, 5).map(Number);
        const educationPercentage = ((bachelors + masters + professional + doctorate) / total) * 100;

        // Get median age data
        const ageResponse = await fetch(
            `https://api.census.gov/data/2021/acs/acs5?get=B01002_001E&for=state:${stateId}&key=${CENSUS_API_KEY}`
        );
        
        if (!ageResponse.ok) throw new Error('Age API response was not ok');
        const ageData = await ageResponse.json();
        if (!ageData?.[1]?.[0]) throw new Error('Invalid age data');

        // Get homeownership data
        const housingResponse = await fetch(
            `https://api.census.gov/data/2021/acs/acs5?get=B25003_002E,B25003_001E&for=state:${stateId}&key=${CENSUS_API_KEY}`
        );
        
        if (!housingResponse.ok) throw new Error('Housing API response was not ok');
        const housingData = await housingResponse.json();
        if (!housingData?.[1]) throw new Error('Invalid housing data');
        
        // Calculate homeownership rate
        const [ownerOccupied, totalHousing] = housingData[1].slice(0, 2).map(Number);
        const homeownershipRate = (ownerOccupied / totalHousing) * 100;

        // Format and cache the data
        const result = {
            population: numberWithCommas(popData[1][0]),
            medianIncome: `$${numberWithCommas(incomeData[1][0])}`,
            education: formatPercentage(educationPercentage),
            medianAge: `${ageData[1][0]} years`,
            homeownership: formatPercentage(homeownershipRate),
            capital: stateCapitals[stateName] || 'Data not available'
        };

        censusData[stateId] = result;
        return result;
    } catch (error) {
        console.error('Error fetching census data:', error);
        const errorResult = {
            population: 'Error loading data',
            medianIncome: 'Error loading data',
            education: 'Error loading data',
            medianAge: 'Error loading data',
            homeownership: 'Error loading data',
            capital: 'Error loading data'
        };
        censusData[stateId] = errorResult;
        return errorResult;
    }
}

async function updateStateInfo(state, isPersistent = false) {
    const stateInfo = document.getElementById('state-info');
    
    if (!state) {
        stateInfo.innerHTML = '<p class="placeholder">Hover over a state to see its information</p>';
        return;
    }

    try {
        if (!state.properties || !state.properties.name) {
            stateInfo.innerHTML = `
                <p class="error">Error loading state data. Please try again.</p>
            `;
            return;
        }

        const stateName = state.properties.name;
        
        // Show loading state
        stateInfo.innerHTML = `
            <h3>${stateName}</h3>
            <p>Loading state data...</p>
        `;

        const data = await fetchStateCensusData(state);

        if (!data || data.population === 'Error loading data') {
            stateInfo.innerHTML = `
                <h3>${stateName}</h3>
                <p class="error">Error loading state data. Please try again.</p>
            `;
            return;
        }

        stateInfo.innerHTML = `
            <h2>${state.properties.name}</h2>
            <table>
                <tr>
                    <td>Population (2020)</td>
                    <td>${data.population}</td>
                </tr>
                <tr>
                    <td>Median Household Income</td>
                    <td>${data.medianIncome}</td>
                </tr>
                <tr>
                    <td>Education (Bachelor's or higher)</td>
                    <td>${data.education}</td>
                </tr>
                <tr>
                    <td>Median Age</td>
                    <td>${data.medianAge}</td>
                </tr>
                <tr>
                    <td>Homeownership Rate</td>
                    <td>${data.homeownership}</td>
                </tr>
                <tr>
                    <td>Capital</td>
                    <td>${data.capital}</td>
                </tr>
            </table>
        `;
    } catch (error) {
        stateInfo.innerHTML = `
            <p class="error">Error loading state data. Please try again.</p>
        `;
    }
}

// Static data for state capitals and largest cities (as these aren't available in the Census API)
const stateCapitals = {
    "Alabama": "Montgomery",
    "Alaska": "Juneau",
    "Arizona": "Phoenix",
    "Arkansas": "Little Rock",
    "California": "Sacramento",
    "Colorado": "Denver",
    "Connecticut": "Hartford",
    "Delaware": "Dover",
    "Florida": "Tallahassee",
    "Georgia": "Atlanta",
    "Hawaii": "Honolulu",
    "Idaho": "Boise",
    "Illinois": "Springfield",
    "Indiana": "Indianapolis",
    "Iowa": "Des Moines",
    "Kansas": "Topeka",
    "Kentucky": "Frankfort",
    "Louisiana": "Baton Rouge",
    "Maine": "Augusta",
    "Maryland": "Annapolis",
    "Massachusetts": "Boston",
    "Michigan": "Lansing",
    "Minnesota": "St. Paul",
    "Mississippi": "Jackson",
    "Missouri": "Jefferson City",
    "Montana": "Helena",
    "Nebraska": "Lincoln",
    "Nevada": "Carson City",
    "New Hampshire": "Concord",
    "New Jersey": "Trenton",
    "New Mexico": "Santa Fe",
    "New York": "Albany",
    "North Carolina": "Raleigh",
    "North Dakota": "Bismarck",
    "Ohio": "Columbus",
    "Oklahoma": "Oklahoma City",
    "Oregon": "Salem",
    "Pennsylvania": "Harrisburg",
    "Rhode Island": "Providence",
    "South Carolina": "Columbia",
    "South Dakota": "Pierre",
    "Tennessee": "Nashville",
    "Texas": "Austin",
    "Utah": "Salt Lake City",
    "Vermont": "Montpelier",
    "Virginia": "Richmond",
    "Washington": "Olympia",
    "West Virginia": "Charleston",
    "Wisconsin": "Madison",
    "Wyoming": "Cheyenne"
};

const stateAbbreviations = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
};

const stateIdMapping = {
    "Alabama": "01",
    "Alaska": "02",
    "Arizona": "04",
    "Arkansas": "05",
    "California": "06",
    "Colorado": "08",
    "Connecticut": "09",
    "Delaware": "10",
    "Florida": "12",
    "Georgia": "13",
    "Hawaii": "15",
    "Idaho": "16",
    "Illinois": "17",
    "Indiana": "18",
    "Iowa": "19",
    "Kansas": "20",
    "Kentucky": "21",
    "Louisiana": "22",
    "Maine": "23",
    "Maryland": "24",
    "Massachusetts": "25",
    "Michigan": "26",
    "Minnesota": "27",
    "Mississippi": "28",
    "Missouri": "29",
    "Montana": "30",
    "Nebraska": "31",
    "Nevada": "32",
    "New Hampshire": "33",
    "New Jersey": "34",
    "New Mexico": "35",
    "New York": "36",
    "North Carolina": "37",
    "North Dakota": "38",
    "Ohio": "39",
    "Oklahoma": "40",
    "Oregon": "41",
    "Pennsylvania": "42",
    "Rhode Island": "44",
    "South Carolina": "45",
    "South Dakota": "46",
    "Tennessee": "47",
    "Texas": "48",
    "Utah": "49",
    "Vermont": "50",
    "Virginia": "51",
    "Washington": "53",
    "West Virginia": "54",
    "Wisconsin": "55",
    "Wyoming": "56"
};

async function map(mapdata) {
    const width = 975;
    const height = 610;
    const margin = { top: 30, right: 0, bottom: 0, left: 0 };
    let selectedState = null;

    // Create SVG element
    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", [0, 0, width, height + margin.top + margin.bottom])
        .attr("style", "width: 100%; height: auto; height: intrinsic;");

    // Add background rect to handle clicks outside states
    svg.append("rect")
        .attr("width", width)
        .attr("height", height + margin.top + margin.bottom)
        .attr("fill", "transparent")
        .on("click", function() {
            selectedState = null;
            d3.selectAll('.state').classed('selected', false);
            updateStateInfo(null);
        });

    // Create separate groups for states and labels
    const statesGroup = svg.append('g')
        .attr("transform", `translate(0, ${margin.top})`);
    
    const labelsGroup = svg.append('g')
        .attr("transform", `translate(0, ${margin.top})`)
        .attr("class", "labels-group");

    // Create the US boundary with no fill
    statesGroup.append('path')
        .datum(topojson.feature(mapdata, mapdata.objects.nation))
        .attr('d', d3.geoPath())
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', '1.5');

    // Create the states
    const states = statesGroup.selectAll('path.state')
        .data(topojson.feature(mapdata, mapdata.objects.states).features)
        .join('path')
        .attr('class', 'state')
        .attr('d', d3.geoPath())
        .attr('vector-effect', 'non-scaling-stroke')
        .attr('stroke', '#444')
        .attr('stroke-width', '1.5')
        .attr('fill', '#eee')
        .attr('pointer-events', 'all');

    // Add state labels in a separate group that's always on top
    const path = d3.geoPath();
    const labels = labelsGroup.selectAll('text')
        .data(topojson.feature(mapdata, mapdata.objects.states).features)
        .join('text')
        .attr('class', 'state-label')
        .attr('transform', d => {
            const centroid = path.centroid(d);
            switch(d.properties.name) {
                case "Rhode Island":
                case "Delaware":
                case "Maryland":
                    return `translate(${centroid[0]}, ${centroid[1]}) scale(0.8)`;
                case "New Jersey":
                case "Connecticut":
                case "Massachusetts":
                    return `translate(${centroid[0]}, ${centroid[1]}) scale(0.9)`;
                default:
                    return `translate(${centroid[0]}, ${centroid[1]})`;
            }
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', d => {
            const area = path.area(d);
            if (area < 1000) return '8px';
            if (area < 3000) return '10px';
            return '12px';
        })
        .text(d => stateAbbreviations[d.properties.name]);

    // Add interactions to states
    states.on('mouseover', function(event, d) {
            const elem = d3.select(this);
            elem.classed('hover', true);
            if (!selectedState) {
                updateStateInfo(d);
            }
        })
        .on('mouseout', function(event, d) {
            d3.select(this).classed('hover', false);
            if (!selectedState) {
                updateStateInfo(null);
            }
        })
        .on('click', function(event, d) {
            event.stopPropagation();
            
            if (selectedState === d) {
                selectedState = null;
                d3.selectAll('.state').classed('selected', false);
                updateStateInfo(null);
            } else {
                selectedState = d;
                d3.selectAll('.state').classed('selected', false);
                d3.select(this).classed('selected', true);
                updateStateInfo(d, true);
            }
        });
}

window.addEventListener('DOMContentLoaded', async (event) => {
    try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json');
        const mapJson = await res.json();
        map(mapJson);
    } catch (error) {
        console.error('Error loading the map:', error);
        document.getElementById('map').innerHTML = 'Error loading the map';
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchStateCensusData,
        updateStateInfo,
        censusData
    };
}
