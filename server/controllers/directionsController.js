const getWalkingDirections = async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=place_id:${origin}` +
      `&destination=place_id:${destination}` +
      `&mode=walking` +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Maps API Error:', data);
      return res.status(400).json({
        error: 'Could not find directions',
        details: data.status
      });
    }

    if (!data.routes || !data.routes[0]) {
      return res.status(400).json({
        error: 'No route found'
      });
    }

    const route = data.routes[0].legs[0];
    
    const responseData = {
      distance: route.distance.text,
      duration: route.duration.text,
      steps: route.steps.map(step => ({
        instruction: step.html_instructions,
        distance: step.distance.text,
        duration: step.duration.text
      })),
      startLocation: {
        lat: route.start_location.lat,
        lng: route.start_location.lng
      },
      endLocation: {
        lat: route.end_location.lat,
        lng: route.end_location.lng
      },
      bounds: {
        north: data.routes[0].bounds.northeast.lat,
        south: data.routes[0].bounds.southwest.lat,
        east: data.routes[0].bounds.northeast.lng,
        west: data.routes[0].bounds.southwest.lng
      },
      path: data.routes[0].overview_polyline.points
    };

    console.log('Sending directions response:', {
      ...responseData,
      pathLength: responseData.path.length,
      startLocation: responseData.startLocation,
      endLocation: responseData.endLocation
    });
    
    res.json(responseData);

  } catch (error) {
    console.error('Error fetching directions:', error);
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
};

module.exports = { getWalkingDirections };
