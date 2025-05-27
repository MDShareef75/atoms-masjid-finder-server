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
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide lat and lng.' 
      });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=mosque&keyword=masjid,mosque,islamic&key=${config.googleMapsApiKey}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching nearby mosques:', error);
    res.status(500).json({ 
      error: 'Failed to fetch nearby mosques',
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