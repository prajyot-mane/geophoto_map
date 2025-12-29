// Initialize the map
// We start with a default view, but will fitBounds to markers later
const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Function to fetch and display data
async function loadMapData() {
    try {
        const response = await fetch('locations.json');
        if (!response.ok) {
            throw new Error('Failed to load locations.json. Make sure the file exists.');
        }

        const photos = await response.json();

        if (photos.length === 0) {
            console.warn("No photos found in JSON.");
            return;
        }

        const markers = []; // To store markers for fitBounds

        photos.forEach(photo => {
            if (photo.lat && photo.lng) {

                // Create custom icon using the thumbnail
                const customIcon = L.divIcon({
                    className: 'custom-marker-container',
                    html: `<img referrerPolicy="no-referrer" src="${photo.thumbnail}" class="custom-marker-icon" width="48" height="48" alt="Marker">`,
                    iconSize: [48, 48],
                    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
                    popupAnchor: [0, -48] // Point from which the popup should open relative to the iconAnchor
                });

                const marker = L.marker([photo.lat, photo.lng], { icon: customIcon });

                // Create Popup Content
                const popupContent = `
                    <div>
                        <div class="popup-image-container">
                            <img referrerPolicy="no-referrer" src="${photo.thumbnail}" class="popup-image">
                        </div>
                        <div class="popup-info">
                            <div class="popup-date">${new Date(photo.date).toLocaleDateString()}</div>
                            <h3 class="popup-title" title="${photo.filename}">${photo.filename}</h3>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                marker.addTo(map);
                markers.push(marker);
            }
        });

        // Fit map execution to show all markers
        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

    } catch (error) {
        console.error("Error loading map data:", error);
        alert("Could not load map data. Please ensure 'locations.json' is in the project folder.");
    }
}

// Start
loadMapData();
