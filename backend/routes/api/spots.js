const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const validator = require("validator");

const { Spot } = require("../../db/models");

const router = express.Router();

router.get("/", async (req, res) => {
  const allSpots = await Spot.findAll();
//   console.log(allSpots);
if(allSpots.length){
    res.status(200).json(allSpots);
}else{
    res.status(200).json({message: 'There are currently no spots available. Feel free to list yours!'})
}
});

module.exports = router;
