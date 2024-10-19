// Vehicle types
const vehicleTypes = [
    'Electric (EV)', 'Plug-In Hybrid Electric (PHEV)', 'Hybrid Electric (HEV)', 'Biodiesel', 
    'Ethanol/Flex (E85)', 'Compressed Natural Gas (CNG)', 'Propane', 'Hydrogen', 
    'Methanol', 'Gasoline', 'Diesel', 'Unknown Fuel'
];

// Populate vehicle type dropdown
const vehicleTypeSelect = document.getElementById('vehicleTypeSelect');
vehicleTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    vehicleTypeSelect.appendChild(option);
});

// Years
const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

// Populate year dropdown
const yearSelect = document.getElementById('yearSelect');
years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
});

// Default selected values
let selectedYear = 2023;
let selectedVehicleType = 'Electric (EV)';

// Set up map
const map = L.map('map').setView([37.8, -96], 4);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Color scale for vehicle counts
function getColor(d) {
    return d > 100000 ? '#005a32' :
           d > 50000  ? '#238b45' :
           d > 10000  ? '#41ab5d' :
           d > 5000   ? '#74c476' :
           d > 1000   ? '#a1d99b' :
           d > 500    ? '#c7e9c0' :
           d > 100    ? '#e5f5e0' :
                        '#f7fcf5';
}

// Style function for each feature (state)
function style(feature) {
    return {
        fillColor: getColor(feature.properties.vehicleCount || 0),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// GeoJSON layer
let geojsonLayer = L.geoJson(null, {
    style: style,
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>${feature.properties.name}</strong><br>Vehicle Count: ${feature.properties.vehicleCount || 0}`);
    }
}).addTo(map);

// Fetch the GeoJSON data
fetch('us-states.json')
    .then(response => response.json())
    .then(data => {
        geojsonData = data; // Store GeoJSON data
        updateMap(selectedYear, selectedVehicleType); // Initialize map with default values
    });

// Update the map based on the selected year and vehicle type
const updateMap = (selectedYear, selectedType) => {
    // Update each feature in geojsonData with the vehicle count for the selected year and type
    geojsonData.features.forEach(feature => {
        const stateData = vehicleRegistrationData.find(data => data.State === feature.properties.name && data.Year === selectedYear);
        feature.properties.vehicleCount = stateData ? parseInt(stateData[selectedType]) : 0;
    });

    // Update the GeoJSON layer with the new data
    geojsonLayer.clearLayers();
    geojsonLayer.addData(geojsonData);
    geojsonLayer.setStyle(style);
};

// Add event listeners for dropdown changes
yearSelect.addEventListener('change', function () {
    selectedYear = parseInt(this.value);
    updateMap(selectedYear, selectedVehicleType);
});

vehicleTypeSelect.addEventListener('change', function () {
    selectedVehicleType = this.value;
    updateMap(selectedYear, selectedVehicleType);
});

// Legend control
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 100, 500, 1000, 5000, 10000, 50000, 100000],
        labels = [];

    div.innerHTML = '<strong>Vehicle Count</strong><br>';
    // Loop through intervals and generate a label with a colored square for each interval
    for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(map);
