const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
const express = require('express')
const cors = require('cors')
const validator = require('express-validator')
const { fetchNearbyRestuarants } = require('./nearbySearch')

const invalidEnvironmentVarables = ['GOOGLE_PLACE_API_KEY', 'CLIENT_API_KEY']
  .map((environmentVariableName) => [environmentVariableName, process.env[environmentVariableName]])
  .filter(([_, environmentVariableValue]) => typeof environmentVariableValue === 'undefined')
  .map(([environmentVariableName]) => environmentVariableName)

if (invalidEnvironmentVarables.length) {
  throw new Error(`Missing environment variables: ${invalidEnvironmentVarables.join(', ')}`)
}

const app = express()
app.use(cors())

app.get('/', (req, res) =>
  res.json({
    endpoints: ['/restuarants', '/postman'],
  })
)

app.get('/postman', (req, res) =>
  res.json(require('../Nearby Restaurants API.postman_collection.json'))
)

app.get(
  '/restuarants',
  [
    validator
      .query('latitude')
      .notEmpty()
      .withMessage('Latitude required.')
      .bail()
      .toFloat()
      .isFloat()
      .withMessage('Latitude should be a double / float.'),
    validator
      .query('longitude')
      .notEmpty()
      .withMessage('Longitude required.')
      .bail()
      .toFloat()
      .isFloat()
      .withMessage('Longitude should be a double / float.'),
    validator
      .query('radiusInMeters')
      .optional()
      .toInt()
      .isInt()
      .withMessage('Radius should be a number in meters.'),
    validator
      .header('X-API-KEY')
      .notEmpty()
      .withMessage('X-API-KEY header required.')
      .bail()
      .trim()
      .equals(process.env.CLIENT_API_KEY)
      .withMessage('Invalid X-API-KEY.'),
  ],
  async (req, res) => {
    const validationResult = validator.validationResult(req)
    const errors = validationResult.array()

    if (errors.length) {
      return res.status(400).json(errors)
    }

    const { latitude, longitude, radiusInMeters } = req.query

    try {
      const nearbyPlaces = await fetchNearbyRestuarants(latitude, longitude, radiusInMeters)

      res.json({
        success: true,
        results: nearbyPlaces,
        meta: {
          latitude,
          longitude,
          radius: radiusInMeters,
          resultsLength: nearbyPlaces.length,
        },
      })
    } catch (err) {
      return res.json({
        success: false,
        message: err.message,
      })
    }
  }
)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Nearby Restuarants API listening at http://localhost:${port}`)
})
