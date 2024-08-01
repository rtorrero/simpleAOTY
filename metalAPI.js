// Using metal archive API

async function getAlbumDetails(albumId) {
    const apiUrl = `https://metal-api.dev/albums/${albumId}`;

    try {
        const response = await fetch(apiUrl);

        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
            throw new Error(`Error fetching album: ${response.statusText}`);
        }

        const albumData = await response.json();

        // Extract the required fields
        const { name, releaseDate, coverUrl, type } = albumData;

        // Return the extracted fields
          return {
            name,
            releaseDate,
            coverUrl,
            type
        };
    } catch (error) {
        console.error('Failed to fetch album details:', error);
        return null; // or handle the error as needed
    }
}

module.exports = getAlbumDetails;