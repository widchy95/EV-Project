import requests
from bs4 import BeautifulSoup
import json

# Base URL for scraping
base_url = 'https://afdc.energy.gov/vehicle-registration?year={}'

# Prepare a list to hold all the data
all_data = []

# Loop through the years from 2016 to 2023
for year in range(2016, 2024):
    # Send a GET request to the webpage
    response = requests.get(base_url.format(year))
    
    # Parse the page content with BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the vehicle registration table
    table = soup.find('table', {'id': 'vehicle_registration'})

    # Extract table headers
    headers = [th.get_text(strip=True) for th in table.find_all('th')[1:]]
    
    # Extract table rows
    rows = []
    for tr in table.find_all('tr')[2:]:
        # Get the state name
        state = tr.find('td', headers="state").get_text(strip=True)
        
        # Get vehicle registration counts as text
        cols = [td.get_text(strip=True).replace(',', '') for td in tr.find_all('td')]
        
        # Append data with the state name included
        rows.append([state] + cols)

    # Save the data for the current year
    for row in rows:
        all_data.append({ 'Year': year, 'State': row[0], **dict(zip(headers, row[1:])) })

# Save data to a JavaScript file
js_file = 'data.js'
with open(js_file, 'w') as file:
    file.write("const vehicleRegistrationData = ")
    json.dump(all_data, file, indent=4)
    file.write(";\n")

print(f"Data saved to {js_file}")
