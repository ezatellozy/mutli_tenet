"use strict";

const bcrypt = require("bcrypt");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await bcrypt.hash("123456789", 10);
    await queryInterface.bulkInsert(
      "users",
      [
        {
          name: "Admin",
          email: "admin@info.com",
          password: password, // Store hashed password
          role: null,
          phone: "123456789",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", { email: "admin@info.com" });
  },
};
