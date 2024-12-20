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
const { setTokenCookie } = require("../../utils/auth");
const { handleValidationErrors } = require("../../utils/validation");

const requireAuth = function (req, res, next) {
  // console.log("::::::::::::: Authentication middleware hit");
  if (!req.user) {
    // console.log("::::::::::::: No user authenticated");
    return res.status(401).json({ message: 'Authentication required' });
  }
  // console.log("::::::::::::: User authenticated, proceeding...");
  return next(); // Proceed if authenticated
};

const { where } = require("sequelize");


const validateReviews = [
  check("review").notEmpty().withMessage("Review text is required"),
  check("stars")
    .notEmpty()
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
];

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

      if (!foundReview.length) {
        console.log("hello");
        return res.status(404).json({ message: "Review couldn't be found" });
      }

      foundReview = foundReview[0].dataValues;

      if (foundReview.userId !== req.user.id) {
        res.status(403).json({ message: "Forbidden" });
      }
      // ! -----------------------

      const allReviewImages = await ReviewImage.findAll({
        where: {
          reviewId,
        },
      });

      if (allReviewImages.length >= 10) {
        res.status(403).json({
          message: "Maximum number of images for this resource was reached",
        });
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

// * 3. PUT  /api/reviews/:reviewId - Update and return an existing review.
router.put("/:reviewId", validateReviews, requireAuth, async (req, res) => {
  // -------------- VERIFY the reviewId as an integer

  let { reviewId } = req.params; // extract the id of the review from the req params

  // ! ---------------- VALIDATE req.body
  const errors = validationResult(req); // Collect any validation errors
  if (!errors.isEmpty()) {
    const error = {};

    const errArr = errors.array();

    for (let err of errArr) {
      const { msg, path } = err;
      error[path] = msg;
    }
    //  If errors exist, return a 400 Bad Request with the error details
    await res.status(400).json({ message: "Bad Request", errors: error });
  }

  //! ---------------  find the review & VERIFY that the user is authorized

  let foundReview = await Review.findAll({
    where: {
      id: reviewId,
    },
  });

  if (!foundReview.length) {
    await res.status(404).json({ message: "Review couldn't be found" });
  }

  foundReview = foundReview[0].dataValues;

  if (foundReview.userId !== req.user.id) {
    res.status(403).json({ message: "Forbidden" });
  }

  const { review, stars } = req.body;
  console.log(foundReview);

  const [updatedRows] = await Review.update(
    { review, stars },
    { where: { id: reviewId } }
  );

  let updated = await Review.findOne({
    where: {
      id: reviewId,
    },
    attributes: [
      "id",
      "userId",
      "spotId",
      "review",
      "stars",
      "createdAt",
      "updatedAt",
    ],
    // raw: true
  });

  return res.status(200).json(updated);
});

// * 4. DELETE  /api/reviews/:reviewId - Delete a Review Image
router.delete("/:reviewId", requireAuth, async (req, res) => {
  try {
    let id = req.params.reviewId;

    id = Number(id);

    // Find the review by ID
    let foundReview = await Review.findOne({
      where: {
        id
      }
    });

    // If the review doesn't exist, return 404
    if (!foundReview) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    
    // Check if the current user is the owner of the review
    if (foundReview.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    await foundReview.destroy();

     res.status(200).json({
      message: "Successfully deleted",
    });
   

    // If everything checks out, delete the review
    
    
    
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      errors: error.message || error,
    });
  }
});

module.exports = router;
