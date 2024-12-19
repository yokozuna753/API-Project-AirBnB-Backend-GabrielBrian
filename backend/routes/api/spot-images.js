const express = require('express');
const { SpotImage, Spot } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware for imageId (ensure it is a valid number)
const validateImageId = [
  check('imageId')
    .isInt({ min: 1 })
    .withMessage('imageId must be a positive integer')
    .notEmpty()
    .withMessage('imageId is required'),
];

// DELETE /api/spot-images/:imageId
router.delete('/:imageId', requireAuth, async (req, res, next) => {
  const { imageId } = req.params; // Get the imageId from the request params
  const userId = req.user.id; // Get the authenticated user's ID from req.user

  try {
    // Step 1: Check if SpotImage exists
    const spotImage = await SpotImage.findByPk(imageId);

    // If the SpotImage doesn't exist, return a 404 error
    if (!spotImage) {
      const error = new Error('Spot Image couldn\'t be found');
      error.status = 404;
      return next(error); // Pass the error to the global error handler
    }

    // Step 2: Find the associated Spot for the SpotImage
    const spot = await Spot.findByPk(spotImage.spotId);

    // If the Spot doesn't exist, return a 404 error
    if (!spot) {
      const error = new Error('Spot associated with this image doesn\'t exist');
      error.status = 404;
      return next(error); // Pass the error to the global error handler
    }

    // Step 3: Check if the authenticated user is the owner of the Spot
    if (spot.userId !== userId) {
      const error = new Error('You do not have permission to delete this image');
      error.status = 403; // Forbidden
      return next(error); // Immediately stop execution and pass the error
    }

    // Step 4: Delete the SpotImage (only if all checks pass)
    await spotImage.destroy();

    // Step 5: Return success response
    return res.status(200).json({
      message: 'Successfully deleted',
    });
  } catch (error) {
    // Catch any unexpected errors and forward to the global error handler
    return next(error); // Ensure errors are caught and passed to the handler
  }
});

module.exports = router;
