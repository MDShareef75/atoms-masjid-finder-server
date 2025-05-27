const express = require('express');
const cors = require('cors');
const axios = require('axios');
const config = require('./config');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Atom\'s Masjid Finder API is running');
});

// Proxy endpoint for nearby mosques
app.get('/api/mosques/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // Increased default radius to 10km
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide lat and lng.' 
      });
    }
    
    // Make multiple searches with different parameters to find more mosques
    const urls = [
      // Search 1: Standard mosque search
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=mosque&key=${config.googleMapsApiKey}`,
      
      // Search 2: Keyword search for different terms
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=masjid,mosque,islamic,muslim,prayer&key=${config.googleMapsApiKey}`,
      
      // Search 3: Using text search which might find places not categorized as mosques
      `https://maps.googleapis.com/maps/api/place/textsearch/json?location=${lat},${lng}&radius=${radius}&query=mosque+masjid+islamic+center&key=${config.googleMapsApiKey}`
    ];
    
    // Run all requests in parallel
    const responses = await Promise.all(urls.map(url => axios.get(url)));
    
    // Combine results and remove duplicates
    const allPlaces = [];
    const placeIds = new Set();
    
    responses.forEach(response => {
      if (response.data.status === 'OK' && response.data.results) {
        response.data.results.forEach(place => {
          if (!placeIds.has(place.place_id)) {
            placeIds.add(place.place_id);
            allPlaces.push(place);
          }
        });
      }
    });
    
    res.json({
      status: 'OK',
      results: allPlaces
    });
  } catch (error) {
    console.error('Error fetching nearby mosques:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nearby mosques',
      details: error.message 
    });
  }
});

// Proxy endpoint for text search of mosques
app.get('/api/mosques/search', async (req, res) => {
  try {
    const { lat, lng, query = 'mosque', radius = 10000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide lat and lng.' 
      });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?location=${lat},${lng}&radius=${radius}&query=${query}&key=${config.googleMapsApiKey}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching for mosques:', error);
    res.status(500).json({ 
      error: 'Failed to search for mosques',
      details: error.message 
    });
  }
});

// Proxy endpoint for mosque details
app.get('/api/mosques/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({ 
        error: 'Missing required parameter. Please provide a place ID.' 
      });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${config.googleMapsApiKey}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching mosque details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mosque details',
      details: error.message 
    });
  }
});

// Proxy endpoint for place photos
app.get('/api/mosques/photo/:photoReference', async (req, res) => {
  try {
    const { photoReference } = req.params;
    const { maxwidth = 400 } = req.query;
    
    if (!photoReference) {
      return res.status(400).json({ 
        error: 'Missing required parameter. Please provide a photo reference.' 
      });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${config.googleMapsApiKey}`;
    
    // Proxy the image directly
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    
    // Set the content type
    res.set('Content-Type', response.headers['content-type']);
    
    // Pipe the image data to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching mosque photo:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mosque photo',
      details: error.message 
    });
  }
});

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
}); 