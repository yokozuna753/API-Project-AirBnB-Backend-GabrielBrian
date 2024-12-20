"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init(
    {
      spotId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      startDate: {
        type: DataTypes.DATE,
        validate: {
          notInThePast(value) {
            let today = new Date();
            today.setHours(0, 0, 0, 0); // Set time to 00:00:00 to ignore the time part
            today = today.toISOString().split('T')[0];

            // Compare startDate with today's date
            if (new Date(value).toISOString().split('T')[0] < today) {
              throw new Error("Start date must not be in the past");
            }
          },
        }
      },
      endDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Booking",
    }
  );
  return Booking;
};
