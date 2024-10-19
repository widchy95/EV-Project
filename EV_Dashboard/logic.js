// Assuming the `vehicleRegistrationData` is already defined in data.js

// Initialize the dashboard
function init() {
    // Populate year dropdown
    const yearDropdown = d3.select("#yearDropdown");
    const years = [...new Set(vehicleRegistrationData.map(d => d.Year))];
    yearDropdown.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Populate vehicle type dropdown
    const vehicleTypeDropdown = d3.select("#vehicleTypeDropdown");
    const vehicleTypes = [
        "Electric (EV)",
        "Plug-In Hybrid Electric (PHEV)",
        "Hybrid Electric (HEV)",
        "Gasoline",
        "Diesel",
        "Biodiesel",
        "Compressed Natural Gas (CNG)",
        "Propane",
        "Hydrogen",
        "Methanol",
        "Unknown Fuel"
    ];
    vehicleTypeDropdown.selectAll("option")
        .data(vehicleTypes)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Populate state dropdown (including "United States")
    const stateDropdown = d3.select("#stateDropdown");
    const states = [...new Set(vehicleRegistrationData.map(d => d.State))];
    states.unshift("United States"); // Add "United States" at the beginning
    stateDropdown.selectAll("option")
        .data(states)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Load initial charts for the latest year and first vehicle type
    const initialYear = d3.max(years);
    const initialVehicleType = vehicleTypes[0];
    const initialState = states[0]; // Set initial state to "United States"
    updateCharts(initialYear, initialVehicleType, initialState);
}

// Function to update charts based on selected year, vehicle type, and state
function updateCharts(selectedYear, selectedVehicleType, selectedState) {
    // Filter out entries for the "United States" in bar and line charts
    const yearData = vehicleRegistrationData.filter(d => d.Year == selectedYear && d.State !== "United States");

    // Bar chart for top 10 states by selected vehicle type registrations
    const top10States = yearData
        .sort((a, b) => b[selectedVehicleType] - a[selectedVehicleType])
        .slice(0, 10);

    const barTrace = {
        x: top10States.map(d => d.State),
        y: top10States.map(d => d[selectedVehicleType]),
        type: "bar",
        text: top10States.map(d => `${d[selectedVehicleType]} ${selectedVehicleType}`),
        marker: {
            color: 'green'
        }
    };

    const barLayout = {
        title: `Top 10 States by ${selectedVehicleType} Registrations (${selectedYear})`,
        xaxis: { title: "State" },
        yaxis: { title: `Number of ${selectedVehicleType}` }
    };

    Plotly.newPlot("barChart", [barTrace], barLayout);

    // Pie chart for fuel type breakdown of the selected state
    const selectedStateData = vehicleRegistrationData.find(d => d.State === selectedState && d.Year == selectedYear);

    const pieData = {
        labels: [
            "EV",
            "PHEV",
            "HEV",
            "Gasoline",
            "Diesel",
            "Unknown Fuel"
        ],
        values: [
            selectedStateData ? selectedStateData["Electric (EV)"] : 0,
            selectedStateData ? selectedStateData["Plug-In Hybrid Electric (PHEV)"] : 0,
            selectedStateData ? selectedStateData["Hybrid Electric (HEV)"] : 0,
            selectedStateData ? selectedStateData["Gasoline"] : 0,
            selectedStateData ? selectedStateData["Diesel"] : 0,
            selectedStateData ? selectedStateData["Unknown Fuel"] : 0
        ],
        type: "pie"
    };

    const pieLayout = {
        title: `Fuel Type Breakdown for ${selectedState} (${selectedYear})`
    };

    Plotly.newPlot("pieChart", [pieData], pieLayout);

    // Line chart for vehicle registration trends over the years for selected state
    const stateTrends = vehicleRegistrationData
        .filter(d => d.State === selectedState);

    const lineTrace = {
        x: stateTrends.map(d => d.Year),
        y: stateTrends.map(d => d[selectedVehicleType]),
        type: "scatter",
        mode: "lines+markers",
        name: selectedState,
        marker: { color: 'blue' }
    };

    const lineLayout = {
        title: `${selectedVehicleType} Registration Trends in ${selectedState}`,
        xaxis: { title: "Year" },
        yaxis: { title: `Number of ${selectedVehicleType}` }
    };

    Plotly.newPlot("lineChart", [lineTrace], lineLayout);

    // Metadata panel for the selected state
    d3.select("#metadata").html(`
        <strong>State:</strong> ${selectedState}<br>
        <strong>Year:</strong> ${selectedYear}<br>
        <strong>${selectedVehicleType} Registrations:</strong> ${selectedStateData ? selectedStateData[selectedVehicleType] : 0}<br>
    `);
}

// Event listener for year dropdown change
d3.select("#yearDropdown").on("change", function() {
    const selectedYear = d3.select(this).property("value");
    const selectedVehicleType = d3.select("#vehicleTypeDropdown").property("value");
    const selectedState = d3.select("#stateDropdown").property("value");
    updateCharts(selectedYear, selectedVehicleType, selectedState);
});

// Event listener for vehicle type dropdown change
d3.select("#vehicleTypeDropdown").on("change", function() {
    const selectedYear = d3.select("#yearDropdown").property("value");
    const selectedVehicleType = d3.select(this).property("value");
    const selectedState = d3.select("#stateDropdown").property("value");
    updateCharts(selectedYear, selectedVehicleType, selectedState);
});

// Event listener for state dropdown change (for pie chart)
d3.select("#stateDropdown").on("change", function() {
    const selectedYear = d3.select("#yearDropdown").property("value");
    const selectedVehicleType = d3.select("#vehicleTypeDropdown").property("value");
    const selectedState = d3.select(this).property("value");
    updateCharts(selectedYear, selectedVehicleType, selectedState);
});

// Initialize dashboard on load
init();
