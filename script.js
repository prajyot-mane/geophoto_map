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
        // Use embedded data from locations_data.js if available
        const photos = typeof locationsData !== 'undefined' ? locationsData : [];

        if (photos.length === 0) {
            console.warn("No photos found in data.");
            return;
        }

        // Initialize MarkerClusterGroup
        const markersCluster = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function (cluster) {
                const count = cluster.getChildCount();
                const markers = cluster.getAllChildMarkers();
                // Get the first marker's image to use as the cluster preview
                const firstMarker = markers[0];
                const imageUrl = firstMarker.photoData ? firstMarker.photoData.imageUrl : '';

                // Use a consistent image-based icon for all clusters
                // Displaying +{count} as requested, interpreting 'overlapping' as total count for clarity
                return L.divIcon({
                    className: 'custom-cluster-container',
                    html: `<div style="position: relative; width: 56px; height: 56px;">
                             <img referrerpolicy="no-referrer" src="${imageUrl}" class="cluster-img-icon" width="56" height="56" alt="Cluster" onerror="this.src='https://via.placeholder.com/56?text=Group'">
                             <span class="cluster-badge">+${count}</span>
                           </div>`,
                    iconSize: [56, 56],
                    iconAnchor: [28, 28]
                });
            }
        });

        const markersBounds = []; // To store markers for fitBounds

        photos.forEach(photo => {
            if (photo.lat && photo.lng) {

                // Try to extract the Google Drive File ID to construct a reliable thumbnail URL
                let imageUrl = photo.thumbnail; // Default to provided thumbnail
                const idMatch = photo.url.match(/id=([^&]+)/);
                if (idMatch && idMatch[1]) {
                    // Use the public thumbnail endpoint which is more reliable than the lh3 links
                    imageUrl = `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400`;
                }

                // Create custom icon using the image
                const customIcon = L.divIcon({
                    className: 'custom-marker-container',
                    html: `<img referrerpolicy="no-referrer" src="${imageUrl}" class="custom-marker-icon" width="48" height="48" alt="Marker" onerror="this.src='https://via.placeholder.com/48?text=Err'">`,
                    iconSize: [48, 48],
                    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
                    popupAnchor: [0, -48] // Point from which the popup should open relative to the iconAnchor
                });

                const marker = L.marker([photo.lat, photo.lng], { icon: customIcon });
                // Attach photo data to marker for easy access in cluster function
                marker.photoData = { ...photo, imageUrl: imageUrl };

                // Create Popup Content
                const popupContent = `
                    <div>
                        <div class="popup-image-container">
                            <img src="${imageUrl}" class="popup-image" onclick="window.open('${photo.url}', '_blank')" onerror="this.src='https://via.placeholder.com/300?text=Image+Load+Error'">
                        </div>
                        <div class="popup-info">
                            <div class="popup-date">${(() => {
                        try {
                            // Fix EXIF date format (YYYY:MM:DD HH:MM:SS -> YYYY-MM-DDTHH:MM:SS)
                            const isoDate = photo.date.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
                            const d = new Date(isoDate);
                            return isNaN(d) ? photo.date : d.toLocaleDateString();
                        } catch (e) { return photo.date; }
                    })()}</div>
                            <h3 class="popup-title" title="${photo.filename}">${photo.filename}</h3>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                markersCluster.addLayer(marker); // Add to cluster
                markersBounds.push(marker);
            }
        });

        // Add cluster group to map instead of individual markers
        map.addLayer(markersCluster);

        // Fit map execution to show all markers
        if (markersBounds.length > 0) {
            const group = new L.featureGroup(markersBounds);
            map.fitBounds(group.getBounds().pad(0.1));
        }

    } catch (error) {
        console.error("Error loading map data:", error);
        alert("Could not load map data.");
    }
}

// Start
loadMapData();
