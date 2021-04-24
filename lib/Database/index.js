const config = require("../../config.json");

// https://devhints.io/knex

let Database = {};

Database = require('knex')({
    client: 'mysql',
    connection: config.database
});

module.exports = Database;