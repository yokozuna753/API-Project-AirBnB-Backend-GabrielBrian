


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