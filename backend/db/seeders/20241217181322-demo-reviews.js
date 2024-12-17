// ! THIS FILE IS DONE

'use strict';

const { Review} = require('../models');


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 1,
        review: 'wonderful property',
        stars: 5,
      },
      {
        spotId: 2,
        userId: 2,
        review: 'amazing ',
        stars: 3,
      },
      {
        spotId: 3,
        userId: 3,
        review: 'incredible property!!!!',
        stars: 4,
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Review';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
