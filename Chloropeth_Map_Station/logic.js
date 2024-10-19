// Define the map, centered on the USA
var map = L.map('map').setView([37.8, -96], 4);

// Use a clean tile layer for the basemap
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a> contributors',
    maxZoom: 18,
}).addTo(map);

// Mapping of state abbreviations to full state names
const stateNameMap = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
    "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
    "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
};

// Load the stations data JSON file
fetch('stations_data.json')
    .then(response => response.json())
    .then(data => {
        const stationsData = data.fuel_stations; // Access the fuel stations data in the JSON file

        // Filter for electric vehicle charging stations (Fuel Type Code = 'ELEC')
        const evStations = stationsData.filter(station => station["Fuel Type Code"] === 'ELEC');

        // Count EV stations by state (using full state names) and sum the number of ports
        const stateCounts = {};
        const statePublicCounts = {};
        const statePrivateCounts = {};

        evStations.forEach(station => {
            const stateAbbr = station.State;
            const fullStateName = stateNameMap[stateAbbr];
            if (fullStateName) {
                const portCount = 
                    (station["EV DC Fast Count"] || 0) + 
                    (station["EV Level1 EVSE Num"] || 0) + 
                    (station["EV Level2 EVSE Num"] || 0);

                // Update counts based on access code
                if (station["Access Code"] === 'public') {
                    statePublicCounts[fullStateName] = (statePublicCounts[fullStateName] || 0) + portCount;
                } else if (station["Access Code"] === 'private') {
                    statePrivateCounts[fullStateName] = (statePrivateCounts[fullStateName] || 0) + portCount;
                }

                // Total count for the state (public + private)
                stateCounts[fullStateName] = (stateCounts[fullStateName] || 0) + portCount;
            }
        });

        // Set up color scale (greens) from max to min
        const maxCount = Math.max(...Object.values(stateCounts));
        const colorScale = d3.scaleSequential(d3.interpolateYlGn)
                                .domain([0, maxCount * 0.5]); // Adjust the maximum value to make it darker

        // Function to style the states
        function style(feature) {
            const state = feature.properties.name;  // Full state name in GeoJSON
            const count = stateCounts[state] || 0;
            return {
                fillColor: colorScale(count),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }

        // Add GeoJSON layer to the map
        fetch('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
            .then(response => response.json())
            .then(geoData => {
                L.geoJson(geoData, {
                    style: style,
                    onEachFeature: function(feature, layer) {
                        const state = feature.properties.name;  // Full state name in GeoJSON
                        const totalCount = stateCounts[state] || 0;
                        const publicCount = statePublicCounts[state] || 0;
                        const privateCount = statePrivateCounts[state] || 0;
                        layer.bindPopup(`${state}: ${totalCount} Charging Ports<br>
                                         Public: ${publicCount}<br>
                                         Private: ${privateCount}`);
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Error loading GeoJSON data:', error));

        // Add the legend
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [0, maxCount * 0.2, maxCount * 0.4, maxCount * 0.6, maxCount * 0.8, maxCount];
            const labels = [];

            // Loop through density intervals and generate a label with a colored square for each interval
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + colorScale(grades[i]) + '"></i> ' +
                    Math.round(grades[i]) + (grades[i + 1] ? '&ndash;' + Math.round(grades[i + 1]) + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(map);

        // Filter functionality
        const publicCheckbox = document.getElementById('publicCheckbox');
        const privateCheckbox = document.getElementById('privateCheckbox');

        publicCheckbox.addEventListener('change', updateMap);
        privateCheckbox.addEventListener('change', updateMap);

        function updateMap() {
            // Clear the map before re-rendering
            map.eachLayer(layer => {
                if (layer instanceof L.GeoJSON) {
                    map.removeLayer(layer);
                }
            });

            // Re-calculate the stateCounts based on the selected filters
            const filteredStateCounts = {};
            const filteredStatePublicCounts = {};
            const filteredStatePrivateCounts = {};

            // Calculate counts based on checkboxes
            evStations.forEach(station => {
                const stateAbbr = station.State;
                const fullStateName = stateNameMap[stateAbbr];
                if (fullStateName) {
                    const portCount = 
                        (station["EV DC Fast Count"] || 0) + 
                        (station["EV Level1 EVSE Num"] || 0) + 
                        (station["EV Level2 EVSE Num"] || 0);

                    if (publicCheckbox.checked && station["Access Code"] === 'public') {
                        filteredStatePublicCounts[fullStateName] = (filteredStatePublicCounts[fullStateName] || 0) + portCount;
                        filteredStateCounts[fullStateName] = (filteredStateCounts[fullStateName] || 0) + portCount;
                    }

                    if (privateCheckbox.checked && station["Access Code"] === 'private') {
                        filteredStatePrivateCounts[fullStateName] = (filteredStatePrivateCounts[fullStateName] || 0) + portCount;
                        filteredStateCounts[fullStateName] = (filteredStateCounts[fullStateName] || 0) + portCount;
                    }
                }
            });

            // Darker color scale for filtered data
            const maxFilteredCount = Math.max(...Object.values(filteredStateCounts), 0);
            const filteredColorScale = d3.scaleSequential(d3.interpolateYlGn)
                                        .domain([0, maxFilteredCount * 0.5]); // Adjust the maximum value

            // Re-add the GeoJSON layer with the filtered data
            fetch('https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json')
                .then(response => response.json())
                .then(geoData => {
                    L.geoJson(geoData, {
                        style: function(feature) {
                            const state = feature.properties.name;
                            const count = filteredStateCounts[state] || 0;
                            return {
                                fillColor: filteredColorScale(count),
                                weight: 2,
                                opacity: 1,
                                color: 'white',
                                dashArray: '3',
                                fillOpacity: 0.7
                            };
                        },
                        onEachFeature: function(feature, layer) {
                            const state = feature.properties.name;
                            const totalCount = filteredStateCounts[state] || 0;
                            const publicCount = filteredStatePublicCounts[state] || 0;
                            const privateCount = filteredStatePrivateCounts[state] || 0;
                            layer.bindPopup(`${state}: ${totalCount} Charging Ports<br>
                                             Public: ${publicCount}<br>
                                             Private: ${privateCount}`);
                        }
                    }).addTo(map);
                });
        }
    })
    .catch(error => console.error('Error loading station data:', error));
