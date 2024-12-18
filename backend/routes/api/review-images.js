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


















module.exports = router;