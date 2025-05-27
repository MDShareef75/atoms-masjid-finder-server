# Atom's Masjid Finder Server

A Node.js proxy server for the Atom's Masjid Finder mobile application. This server proxies requests to the Google Places API to avoid CORS issues and protect the API key.

## Features

- Proxy endpoint for nearby mosques search
- Proxy endpoint for mosque details
- Proxy endpoint for mosque photos
- CORS support for browser clients

## Setup

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the server

## API Endpoints

- `GET /` - Health check endpoint
- `GET /api/mosques/nearby` - Find nearby mosques
- `GET /api/mosques/:placeId` - Get details for a specific mosque
- `GET /api/mosques/photo/:photoReference` - Get a mosque photo

## Environment Variables

- `PORT` - Port to run the server on (default: 3000) 