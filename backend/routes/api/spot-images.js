// routes/spot-images.js

const express = require('express');
const { SpotImage, Spot, Review, User, ReviewImage } = require('../db/models');
const { requireAuth } = require('../utils/auth');
const router = express.Router();

// DELETE /api/spot-images/:imageId
router.delete('/:imageId', requireAuth, async (req, res, next) => {
  const { imageId } = req.params;
  const userId = req.user.id; // Assuming user is attached to the request after authentication

  try {
    // Step 1: Find the SpotImage by ID
    const spotImage = await SpotImage.findByPk(imageId);

    // Step 2: If the SpotImage doesn't exist, return 404
    if (!spotImage) {
      const error = new Error('Spot Image couldn\'t be found');
      error.status = 404;
      return next(error); // Pass the error to the global error handler
    }

    // Step 3: Find the associated Spot
    const spot = await Spot.findByPk(spotImage.spotId);

    // Step 4: If the Spot doesn't exist or the user is not the owner, return 403
    if (!spot || spot.userId !== userId) {
      const error = new Error('You do not have permission to delete this image');
      error.status = 403;
      return next(error); // Forbidden
    }

    // Step 5: Delete the SpotImage
    await spotImage.destroy();

    // Step 6: Return a success response
    return res.status(200).json({
      message: 'Successfully deleted',
    });

  } catch (error) {
    next(error); // Handle any unexpected errors
  }
});

module.exports = router;
