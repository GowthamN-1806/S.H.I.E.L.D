const extractGeolocation = (req, res, next) => {
    const geoHeader = req.headers['x-geo-location'];
    if (geoHeader) {
        try {
            const [lat, lng] = geoHeader.split(',').map(Number);
            req.geolocation = { lat, lng, city: req.headers['x-geo-city'] || '', country: req.headers['x-geo-country'] || '' };
        } catch (e) {
            req.geolocation = { lat: 0, lng: 0, city: '', country: '' };
        }
    } else {
        req.geolocation = {
            lat: 19.076,
            lng: 72.8777,
            city: 'Mumbai',
            country: 'India',
        };
    }
    next();
};

module.exports = { extractGeolocation };
