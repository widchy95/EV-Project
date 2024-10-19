// Load the stations data
fetch("stations_data.json")
    .then(response => response.json())
    .then(evData => {
        createEVChart(evData);
    })
    .catch(error => {
        console.error("Error loading the data:", error);
    });

function createEVChart(evData) {
    const yearPortCount = {};
    const yearStationCount = {};

    evData.fuel_stations.forEach(station => {
        // Only count stations with Fuel Type Code "ELEC"
        if (station["Fuel Type Code"] === "ELEC" && station["Date Last Confirmed"]) {
            const year = new Date(station["Date Last Confirmed"]).getFullYear();

            // Initialize counts if the year doesn't exist
            if (!yearPortCount[year]) yearPortCount[year] = 0;
            if (!yearStationCount[year]) yearStationCount[year] = 0;

            // Count the number of EV ports (Level 1, Level 2, DC Fast)
            const evPorts = (station["EV Level1 EVSE Num"] || 0) +
                            (station["EV Level2 EVSE Num"] || 0) +
                            (station["EV DC Fast Count"] || 0);

            yearPortCount[year] += evPorts;
            yearStationCount[year]++;
        }
    });

    const years = Object.keys(yearPortCount).sort();
    const portCounts = years.map(year => yearPortCount[year]);
    const stationCounts = years.map(year => yearStationCount[year]);

    // Create line chart using Chart.js
    const ctx = document.getElementById("evChart").getContext("2d");
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: "Charging Ports",
                    data: portCounts,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: "Stations",
                    data: stationCounts,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    zoom: {
                        enabled: true,
                        mode: 'x',
                    }
                },
                legend: {
                    position: 'top',
                },
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}
