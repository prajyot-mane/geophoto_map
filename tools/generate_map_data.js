/**
 * GeoPhoto Map Data Generator
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/home and create a "New Project".
 * 2. Paste this code into the editor (replace everything).
 * 3. On the left sidebar, click the "+" next to "Services".
 * 4. Select "Drive API", assume identifier is "Drive", and click "Add". 
 *    IMPORTANT: If asked for a version, choose v2 if available, as it has better metadata support. 
 *    However, this script tries to be compatible with v3 logic where possible, but v2 is safest for EXIF.
 * 5. Update the FOLDER_ID variable below with the ID of your Google Drive folder containing photos.
 * 6. Run the `generateLocationData` function.
 * 7. Copy the output JSON from the "Execution Log".
 */

// REPLACE THIS WITH YOUR FOLDER ID
// (The ID is the long string of characters at the end of your Drive Folder URL)
const FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

function generateLocationData() {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const output = [];

    Logger.log('Scanning folder: ' + folder.getName());

    while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();

        // Process images only
        if (mimeType.startsWith('image/')) {
            try {
                const fileId = file.getId();
                // Use Advanced Drive Service to get EXIF
                const metadata = Drive.Files.get(fileId, {
                    fields: 'title, thumbnailLink, webContentLink, imageMediaMetadata'
                });

                const gps = metadata.imageMediaMetadata ? metadata.imageMediaMetadata.location : null;

                if (gps && gps.latitude && gps.longitude) {
                    output.push({
                        filename: metadata.title,
                        lat: gps.latitude,
                        lng: gps.longitude,
                        date: metadata.imageMediaMetadata.date,
                        url: metadata.webContentLink,
                        thumbnail: metadata.thumbnailLink
                    });
                    Logger.log('[OK] Found GPS for: ' + metadata.title);
                }
            } catch (e) {
                Logger.log('[ERROR] ' + file.getName() + ': ' + e.message);
            }
        }
    }

    const jsonContent = JSON.stringify(output, null, 2);
    const fileName = 'locations.json';

    // Create the file in the SAME folder as the images
    const localFile = folder.createFile(fileName, jsonContent, MimeType.PLAIN_TEXT);

    Logger.log('------------------------------------------------');
    Logger.log('SUCCESS! Created file: ' + fileName);
    Logger.log('Check your Google Drive folder. You should see "locations.json" there now.');
    Logger.log('Download that file to your computer.');
    Logger.log('------------------------------------------------');
}
