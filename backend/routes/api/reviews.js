const express = require("express");
const bcrypt = require("bcryptjs");

const {
  Spot,
  Review,
  SpotImage,
  User,
  ReviewImage,
} = require("../../db/models");
const { check, validationResult, param } = require("express-validator");
const { validator } = require("validator");
const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { handleValidationErrors } = require("../../utils/validation");

const { where } = require("sequelize");

const router = express.Router();

// * 1. GET  /api/reviews/current - Get all Reviews of the Current User
router.get("/current", requireAuth, async (req, res) => {
  const { id } = req.user;

  const reviews = await Review.findAll({
    attributes: [
      "id",
      "userId",
      "spotId",
      "review",
      "stars",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: User,
        as: "User",
        attributes: [["id", "id"], ["firstName", "firstName"], "lastName"],
      },
      {
        model: Spot,
        as: "Spot",
        attributes: {
          exclude: ["description", "createdAt", "updatedAt"],
        },
        include: [
          {
            model: SpotImage,
            as: "SpotImages",
            attributes: [["url", "previewImage"]], // Renaming the field to 'previewImage'
          },
        ],
      },
    ],
    where: { id },
  });

  let reviewImages = await ReviewImage.findAll({
    where: { id },
    attributes: ["id", "url"],
  });

  let formattedReviews = reviews.map((review) => {
    const reviewObj = review.toJSON(); // Convert to plain object

    // If there are SpotImages, we want to pull the first one and assign its url as previewImage
    if (
      reviewObj.Spot &&
      reviewObj.Spot.SpotImages &&
      reviewObj.Spot.SpotImages.length > 0
    ) {
      reviewObj.Spot.previewImage = reviewObj.Spot.SpotImages[0].previewImage;
      // Remove the SpotImages array after extracting the previewImage
      delete reviewObj.Spot.SpotImages;

      reviewImages = reviewImages[0].dataValues;
      console.log("THESE ARE THE IMAGES =>>>!!!!!!!!!!", reviewImages);
      reviewObj.ReviewImages = reviewImages;
    }

    return reviewObj;
  });

  res.status(200).json({ Reviews: formattedReviews });
});

// * 2. POST /api/reviews/:reviewId/images - Add an Image to a Review based on the Review's id
router.post(
  "/:reviewId/images",
  [
    param("reviewId")
      .isInt({ min: 1 })
      .withMessage("Review Id must be an integer"),
  ],

  requireAuth,
  async (req, res) => {
    try {
      let { reviewId } = req.params; // extract the id of the review from the req params

      const errors = validationResult(req); // Collect any validation errors
      if (!errors.isEmpty()) {
        //  If errors exist, return a 400 Bad Request with the error details
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      // ----------------- FIND THE REVIEW

      reviewId = Number(reviewId);

      let { url: link } = req.body;

      let foundReview = await Review.findAll({
        where: {
          id: reviewId,
        },
      });

      if (!foundReview) {
        return res
          .status(404)
          .json({ message: "Couldn't find a Review with the specified id" });
        throw new Error("Couldn't find a Review with the specified id");
      }

      foundReview = foundReview[0].dataValues;

      if (foundReview.userId !== req.user.id) {
        res.status(403);
        throw new Error("Forbidden");
      }
      // ! -----------------------

      const allReviewImages = await ReviewImage.findAll({
        where: {
          reviewId,
        },
      });

      if (allReviewImages.length >= 10) {
        res.status(403);
        throw new Error(
          "Maximum number of images for this resource was reached"
        );
      }

      let newImage = await ReviewImage.create({
        reviewId,
        url: link,
      });

      newImage = newImage.dataValues;

      console.log(newImage);

      const { id, url } = newImage;

      res.status(201).json({
        id,
        url,
      });
    } catch (err) {
      res.send({ message: err.message });
    }
  }
);

module.exports = router;
