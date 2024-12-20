const express = require('express');
const { SpotImage, Spot } = require('../../db/models');
const router = express.Router();

// Authentication middleware
const requireAuth = function (req, res, next) {
  // console.log("::::::::::::: Authentication middleware hit");
  if (!req.user) {
    // console.log("::::::::::::: No user authenticated");
    return res.status(401).json({ message: 'Authentication required' });
  }
  // console.log("::::::::::::: User authenticated, proceeding...");
  return next(); // Proceed if authenticated
};

// DELETE /api/spot-images/:imageId
router.delete('/:imageId', requireAuth, async (req, res) => {
  const { imageId } = req.params; // Get the imageId from the request params
  const userId = req.user.id; // Get the authenticated user's ID from req.user

  try {
    // console.log("::::::::::::: Route hit");
    // console.log("::::::::::::: Authenticated User ID:", userId);
    // console.log("::::::::::::: Deleting Image ID:", imageId);

    // Step 1: Check if SpotImage exists
    const spotImage = await SpotImage.findByPk(imageId);
    if (!spotImage) {
      // console.log('::::::::::::: 404 spotImage NOT FOUND');
      return res.status(404).json({
        message: "Spot Image couldn't be found",
      });
    }

    // console.log('::::::::::::: spotImage found:', spotImage);

    // Step 2: Find the associated Spot for the SpotImage
    const spot = await Spot.findByPk(spotImage.spotId);
    if (!spot) {
      // console.log('::::::::::::: 404 spot NOT FOUND');
      return res.status(404).json({
        message: "Spot associated with this image doesn't exist",
      });
    }

    // console.log('::::::::::::: spot found:', spot);

    // Step 3: Ensure ownership comparison is correct
    // Explicitly convert both to numbers if needed
    const spotOwnerId = Number(spot.ownerId); // Ensure it's a number
    const authenticatedUserId = Number(userId); // Ensure it's a number

    // console.log('::::::::::::: Comparing spotOwnerId:', spotOwnerId, 'with authenticatedUserId:', authenticatedUserId);

    // Step 4: Check if the authenticated user is the owner of the Spot
    if (spotOwnerId !== authenticatedUserId) {
      // console.log('::::::::::::: 403 Forbidden, User is NOT the owner of this Spot');
      return res.status(403).json({
        message: 'You do not have permission to delete this image',
      });
    }

    // console.log('::::::::::::: User is the owner, proceeding with deletion');

    // Step 5: Delete the SpotImage
    await spotImage.destroy();

    // console.log('::::::::::::: 200 OK, Image Deleted Successfully');
    // Step 6: Return success response after deletion
    return res.status(200).json({
      message: 'Successfully deleted',
    });

  } catch (error) {
    // Catch any unexpected errors and send a generic 500 error response
    console.error("Error in deleting spot image:", error);
    return res.status(500).json({
      message: 'Internal Server Error',
      errors: error.message || error,
    });
  }
});


module.exports = router;
