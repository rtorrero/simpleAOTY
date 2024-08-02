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
        console.log(bandData);

                // Extract the extra info from bands
    
        /* bandData = getBandDetails(bandId); */
        const { name: band, country, genre, bandCoverUrl } = bandData;
        console.log('band & genre' , band, genre)        


        // Return the extracted fields
        return {
            name,
            releaseDate,
            coverUrl,
            type,
            band,
            genre

        };
    } catch (error) {
        console.error('Failed to fetch album details:', error);
        return null; // or handle the error as needed
    }
}



// Find Link from FIX THIS to map

/* function getAlbumLink(album) {
    const album = albums.find(album => album.id === album);
    return album ? album.link : null;
}  */


module.exports = getAlbumDetails;