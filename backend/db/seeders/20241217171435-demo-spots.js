
// ! THIS FILE IS DONE

'use strict';

const { Spot } = require('../models');


let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: '123 main st',
        city: 'nashville',
        state: 'TN',
        country: 'USA',
        lat: 36.1627,
        lng: 86.7816,
        name: 'The Mansion',
        description: 'waterfront home, 4 car garage, poolhouse, pool',
        price: 5000000.00,
      },
      {
        ownerId: 2,
        address: '2343 E Raleigh Road',
        city: 'Tampa',
        state: 'FL',
        country: 'USA',
        lat: 78.0936,
        lng: 12.7316,
        name: 'The Beach',
        description: 'surf, volleyball, fun',
        price: 1000000.00,
      },
      {
        ownerId: 3,
        address: '456 Elmo Ln',
        city: 'New York City',
        state: 'NY',
        country: 'USA',
        lat: 59.4334,
        lng: 90.7342,
        name: 'The Town',
        description: '0 car garage, pool',
        price: 400000.00,
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      state: { [Op.in]: ['NY', 'FL', 'TN'] }
    }, {});
  }
};
