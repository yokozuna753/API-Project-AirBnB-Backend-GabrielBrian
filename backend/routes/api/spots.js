const express = require("express");
const { requireAuth } = require("../../utils/auth");
const { Spot, Review, SpotImage, User } = require("../../db/models");
const { check, validationResult } = require("express-validator");
const {validator} = require('validator');

const router = express.Router();

// --------------------
// Validation Middleware
// --------------------

// Validation rules exactly as per the docs
const validateSpotFields = [
  check("address")
    .notEmpty().withMessage("Street address is required"),
  check("city")
    .notEmpty().withMessage("City is required"),
  check("state")
    .notEmpty().withMessage("State is required"),
  check("country")
    .notEmpty().withMessage("Country is required"),
  check("lat")
    .notEmpty().withMessage("Latitude must be within -90 and 90")
    // .bail()
    .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be within -90 and 90"),
  check("lng")
    .notEmpty().withMessage("Longitude must be within -180 and 180")
    // .bail()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be within -180 and 180"),
  check("name")
    .notEmpty().withMessage("Name is required")
    // .bail()
    .isLength({ max: 50 }).withMessage("Name must be less than 50 characters"),
  check("description")
    .notEmpty().withMessage("Description is required"),
  check("price")
    .notEmpty().withMessage("Price per day must be a positive number")
    // .bail()
    .isFloat({ min: 0 }).withMessage("Price per day must be a positive number"),
];

// Middleware to handle validation errors
function handleValidationErrors(req, res, next) {
  const validationErrors = validationResult(req);
  // console.log(validationErrors);
  if (!validationErrors.isEmpty()) {
    const errors = {};
    validationErrors.array().forEach((error) => {

      if (!errors[error.path]) {
        errors[error.path] = error.msg;
      }
    });
    console.log("Validation errors:", {
      message: "Bad Request",
      errors,
    }); // Logging the error response
    return res.status(400).json({
      message: "Bad Request",
      errors,
    });
  }
  next();
}

// --------------------
// Helper Functions
// --------------------

// Function to add avgRating and previewImage to a spot object
async function addExtraSpotInfo(spot) {
  const spotData = spot.toJSON();

  // Calculate avgRating based on reviews
  const reviews = await Review.findAll({
    where: { spotId: spot.id },
    attributes: ["stars"],
  });

  let avgRating = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.stars, 0);
    avgRating = sum / reviews.length;
    avgRating = parseFloat(avgRating.toFixed(1)); // Round to one decimal place
  }
  spotData.avgRating = avgRating > 0 ? avgRating : 0;

  // Get previewImage
  const previewImage = await SpotImage.findOne({
    where: {
      spotId: spot.id,
      preview: true,
    },
    attributes: ["url"],
  });
  spotData.previewImage = previewImage ? previewImage.url : null;

  return spotData;
}

// --------------------
// Routes
// --------------------

// 1. GET /api/spots - Get all Spots
router.get("/", async (req, res) => {
  try {
    const allSpots = await Spot.findAll();

    // Add avgRating and previewImage to each spot
    const spotsWithInfo = await Promise.all(allSpots.map(async (spot) => {
      return await addExtraSpotInfo(spot);
    }));

    return res.status(200).json({ Spots: spotsWithInfo });
  } catch (error) {
    console.error("Error in GET /api/spots:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 2. GET /api/spots/current - Get all Spots owned by Current User
router.get("/current", requireAuth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userSpots = await Spot.findAll({ where: { ownerId: currentUserId } });

    // Add avgRating and previewImage to each spot
    const spotsWithInfo = await Promise.all(userSpots.map(async (spot) => {
      return await addExtraSpotInfo(spot);
    }));

    return res.status(200).json({ Spots: spotsWithInfo });
  } catch (error) {
    console.error("Error in GET /api/spots/current:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 3. GET /api/spots/:spotId - Get details of a Spot by id
router.get("/:spotId", async (req, res) => {
  try {
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId, {
      include: [
        { model: SpotImage, as: "SpotImages", attributes: ["id", "url", "preview"] },
        { model: User, as: "Owner", attributes: ["id", "firstName", "lastName"] }
      ]
    });

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const spotData = spot.toJSON();

    // Calculate numReviews and avgStarRating
    const reviews = await Review.findAll({
      where: { spotId: spot.id },
      attributes: ["stars"]
    });

    const numReviews = reviews.length;
    let avgStarRating = 0;
    if (numReviews > 0) {
      const totalStars = reviews.reduce((sum, review) => sum + review.stars, 0);
      avgStarRating = totalStars / numReviews;
      avgStarRating = parseFloat(avgStarRating.toFixed(1)); // Round to one decimal place
    }

    // Construct the final spot object as per API Docs
    const finalSpot = {
      id: spotData.id,
      ownerId: spotData.ownerId,
      address: spotData.address,
      city: spotData.city,
      state: spotData.state,
      country: spotData.country,
      lat: parseFloat(spotData.lat),
      lng: parseFloat(spotData.lng),
      name: spotData.name,
      description: spotData.description,
      price: parseFloat(spotData.price),
      createdAt: spotData.createdAt,
      updatedAt: spotData.updatedAt,
      numReviews: numReviews,
      avgStarRating: numReviews > 0 ? avgStarRating : 0,
      SpotImages: spotData.SpotImages || [],
      Owner: spotData.Owner
    };

    return res.status(200).json(finalSpot);
  } catch (error) {
    console.error("Error in GET /api/spots/:spotId:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 4. POST /api/spots - Create a new Spot
router.post("/", requireAuth, validateSpotFields, handleValidationErrors, async (req, res) => {
  try {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const newSpot = await Spot.create({
      ownerId: req.user.id,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    return res.status(201).json({
      id: newSpot.id,
      ownerId: newSpot.ownerId,
      address: newSpot.address,
      city: newSpot.city,
      state: newSpot.state,
      country: newSpot.country,
      lat: parseFloat(newSpot.lat),
      lng: parseFloat(newSpot.lng),
      name: newSpot.name,
      description: newSpot.description,
      price: parseFloat(newSpot.price),
      createdAt: newSpot.createdAt,
      updatedAt: newSpot.updatedAt,
    });

    
  }  catch (error) {
    console.error("Error in POST /api/spots:", error);
    
    // If there's a Sequelize validation error, process it


    const errors = validationResult(req);
    console.log(errors);
    // if (error.name === 'SequelizeValidationError') {
    //   const errors = {};
    //   console.error(error, 'THIS IS THE ERROR WE GET');


    //   // Iterate through the Sequelize errors and extract the field and message
    //   error.errors.forEach((err) => {
    //     errors[err.path] = err.message;
    //     console.log(err);
        
    //   });

    //   // Return a structured error response with a 400 Bad Request
    //   return res.status(400).json({
    //     message: "Bad Request",  // You could also use "Validation Error" if you prefer
    //     errors,
    //   });
    // }

    // If it's an unexpected error, return a generic internal server error
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

// 5. POST /api/spots/:spotId/images - Add an Image to a Spot
router.post("/:spotId/images", requireAuth, async (req, res) => {
  try {
    const { spotId } = req.params;
    const { url, preview } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          url: "URL is required"
        }
      });
    }

    // Check if spot exists
    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check ownership
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Create SpotImage
    const newImage = await SpotImage.create({
      spotId: spot.id,
      url,
      preview: preview === true,
    });

    return res.status(201).json({
      id: newImage.id,
      url: newImage.url,
      preview: newImage.preview,
    });
  } catch (error) {
    console.error("Error in POST /api/spots/:spotId/images:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 6. PUT /api/spots/:spotId - Edit a Spot
router.put("/:spotId", requireAuth, validateSpotFields, handleValidationErrors, async (req, res) => {
  try {
    const { spotId } = req.params;
    const { address, city, state, country, lat, lng, name, description, price } = req.body;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check ownership
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update fields
    spot.address = address;
    spot.city = city;
    spot.state = state;
    spot.country = country;
    spot.lat = lat;
    spot.lng = lng;
    spot.name = name;
    spot.description = description;
    spot.price = price;

    await spot.save();

    return res.status(200).json({
      id: spot.id,
      ownerId: spot.ownerId,
      address: spot.address,
      city: spot.city,
      state: spot.state,
      country: spot.country,
      lat: parseFloat(spot.lat),
      lng: parseFloat(spot.lng),
      name: spot.name,
      description: spot.description,
      price: parseFloat(spot.price),
      createdAt: spot.createdAt,
      updatedAt: spot.updatedAt,
    });
  } catch (error) {
    console.error("Error in PUT /api/spots/:spotId:", error);
    // Handle Sequelize validation errors if any
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach((err) => {
        errors[err.path] = err.message;
      });
      return res.status(400).json({
        message: "Bad Request",
        errors,
      });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// 7. DELETE /api/spots/:spotId - Delete a Spot
router.delete("/:spotId", requireAuth, async (req, res) => {
  try {
    const { spotId } = req.params;
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check ownership
    if (spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await spot.destroy();
    return res.status(200).json({ message: "Successfully deleted" });
  } catch (error) {
    console.error("Error in DELETE /api/spots/:spotId:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
