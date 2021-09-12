const axios = require('axios')

const formatErrorMessage = (errorMessage) => `Google Places API Error: ${errorMessage || ''}`
const FIVE_KM = 5000

const fetchNearbyRestuarants = async (latitude, longitude, searchRadius) => {
  if (!latitude || !longitude) return []

  try {
    const { data } = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: searchRadius || FIVE_KM,
          key: process.env.GOOGLE_PLACE_API_KEY,
          type: 'meal_takeaway',
        },
      }
    )

    switch (data.status) {
      case 'OK':
      case 'ZERO_RESULTS':
        return data.results
      case 'INVALID_REQUEST':
        throw new Error(formatErrorMessage('Invalid Request.'))
      case 'OVER_QUERY_LIMIT':
        throw new Error(formatErrorMessage('API Query limit reached.'))
      case 'REQUEST_DENIED':
        throw new Error(formatErrorMessage('Request denied.'))
      case 'UNKNOWN_ERROR':
        throw new Error(formatErrorMessage('Unknown error with request.'))
    }

    return []
  } catch (err) {
    throw new Error(formatErrorMessage(`Request failed. ${err.message}`))
  }
}

module.exports.fetchNearbyRestuarants = fetchNearbyRestuarants
