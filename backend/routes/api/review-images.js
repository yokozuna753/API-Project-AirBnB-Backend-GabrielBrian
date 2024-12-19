// const express = require("express");
// const { requireAuth } = require("../../utils/auth");
// const {
//   Spot,
//   Review,
//   SpotImage,
//   User,
//   ReviewImage,
// } = require("../../db/models");
// const { check, validationResult, query } = require("express-validator");
// const { validator } = require("validator");
// const { Op, where } = require("sequelize");

// const router = express.Router();








// module.exports = router;






//?------------3 specs -----------------------

// const express = require("express");
// const { requireAuth } = require("../../utils/auth");
// const { Review, ReviewImage } = require("../../db/models");
// const router = express.Router();

// // Delete a Review Image
// router.delete('/:imageId', requireAuth, async (req, res) => {
//     try {
//         const imageId = req.params.imageId;
        
//         // Find the review image
//         const reviewImage = await ReviewImage.findByPk(imageId, {
//             include: [{
//                 model: Review,
//                 attributes: ['userId']
//             }]
//         });

//         // Check if review image exists
//         if (!reviewImage) {
//             return res.status(404).json({
//                 message: "Review Image couldn't be found"
//             });
//         }

//         // Check if the review belongs to the current user
//         if (reviewImage.Review.userId !== req.user.id) {
//             return res.status(403).json({
//                 message: "Forbidden"
//             });
//         }

//         // Delete the review image
//         await reviewImage.destroy();

//         res.status(200).json({
//             message: "Successfully deleted"
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// });

// module.exports = router;




const express = require("express");
const { requireAuth } = require("../../utils/auth");
const { Review, ReviewImage } = require("../../db/models");
const router = express.Router();

router.delete("/:imageId", requireAuth, async (req, res) => {
    const reviewImage = await ReviewImage.findOne({
        where: {
            id: req.params.imageId
        }
    });

    if (!reviewImage) {
        res.status(404);
        return res.json({
            message: "Review Image couldn't be found"
        });
    }

    // Get the associated review to check ownership
    const review = await Review.findOne({
        where: {
            id: reviewImage.reviewId
        }
    });

    // Check if the current user owns the review
    if (review.userId !== req.user.id) {
        res.status(403);
        return res.json({
            message: "Forbidden"
        });
    }

    await reviewImage.destroy();

    return res.json({
        message: "Successfully deleted"
    });
});

module.exports = router;