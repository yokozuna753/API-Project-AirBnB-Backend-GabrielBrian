const express = require("express");
const { requireAuth } = require("../../utils/auth");
const {
  Spot,
  Review,
  SpotImage,
  User,
  ReviewImage,
} = require("../../db/models");
const { check, validationResult, query } = require("express-validator");
const { validator } = require("validator");
const { Op, where } = require("sequelize");

const router = express.Router();




router.delete("/api/review-images/:imageId", requireAuth, async (req, res) => {
  const { imageId } = req.params;

  try {
    // Step 1: Fetch the ReviewImage and validate it exists
    const reviewImage = await ReviewImage.findByPk(imageId, {
      attributes: ["id", "reviewId"],
    });

    if (!reviewImage) {
      return res.status(404).json({ message: "Review Image couldn't be found" });
    }

    // Step 2: Validate ownership of the review
    const review = await Review.findOne({
      where: { id: reviewImage.reviewId, userId: req.user.id },
      attributes: ["id", "userId"],
    });

    if (!review) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Step 3: Delete the ReviewImage
    await reviewImage.destroy();

    // Step 4: Return success response
    return res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    console.error("Error deleting review image:", error);

    // Return a proper error response for debugging
    return res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;





