// Using metal archive API

async function getAlbumDetails(albumId, bandId) {
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

        // FETCH BAND DATA HERE sjghdf
        const api2Url = `https://metal-api.dev/bands/${bandId}`;
        const response2 = await fetch(api2Url);

        // Check if the response is ok (status code 200-299)
        if (!response2.ok) {
            throw new Error(`Error fetching band: ${response2.statusText}`);
        }

        const bandData = await response2.json();
        

                // Extract the extra info from bands
    
        /* bandData = getBandDetails(bandId); */
        const { name: band, country, genre, bandCover: bandCoverUrl, albums } = bandData;
        console.log("ALBUM OBj");
        console.log(albums);
        // Check for the albumId in the band object to find the link for the album.
        const album = albums.find(album => album.id === String(albumId));
        linkURL = album ? album.link : null; // Return the link or null if not found
        

        // Return the extracted fields
        return {
            name,
            releaseDate,
            coverUrl,
            type,
            band,
            genre,
            linkURL

        };
    } catch (error) {
        console.error('Failed to fetch album details:', error);
        return null; // or handle the error as needed
    }
}



// Find Link from FIX THIS to map


module.exports = getAlbumDetails;