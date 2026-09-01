require("dotenv").config();

const Sequelize = require("sequelize");

// Stop early with a clear message if the example password was never changed
if (process.env.DB_PASSWORD === "ChangeMe!") {
  console.error("Please update the .env file with your database password.");
  process.exit(1);
}

// A hosted database normally demands an encrypted connection. The certificate
// that proves the identity of the database server is read from an environment
// variable, so no certificate file has to be committed to Git.
const useSsl = process.env.DB_SSL === "true";

const dialectOptions = useSsl
  ? {
      ssl: {
        rejectUnauthorized: true,
        ca: process.env.DB_CA_CERT,
      },
    }
  : {};

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    dialectOptions,
    logging: false,
  }
);

module.exports = sequelize;
