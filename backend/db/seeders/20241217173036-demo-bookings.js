
// ! THIS FILE IS DONE

'use strict';

const { Booking } = require('../models');


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        startDate: '2024-12-30',
        endDate: '2025-12-31',
      },
      {
        spotId: 2,
        userId: 1,
        startDate: '2024-12-30',
        endDate: '2025-12-31',
      },
      {
        spotId: 3,
        userId: 1,
        startDate: '2024-12-30',
        endDate: '2025-12-31',
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      userId: { [Op.in]: [1] }
    }, {});
  }
};
