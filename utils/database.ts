import { Sequelize } from 'sequelize';
import dotenv from "dotenv";
dotenv.config();


const HOST = process.env.DB_HOST
const DB_DATABASE = process.env.DB_DATABASE!
const DB_USERNAME = process.env.DB_USERNAME!
const DB_PASSWORD = process.env.DB_PASSWORD ?? ''
const DB_PORT: number = +process.env.DB_PORT! || 3306




const sequelize = new Sequelize(DB_DATABASE, DB_USERNAME, DB_PASSWORD, {
    port: DB_PORT,

    host: HOST,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        ssl: false
    },
    pool: {
        max: 10,    // Maximum connections
        min: 2,     // Minimum connections
        acquire: 30000,  // Timeout before failing
        idle: 10000  // Close idle connections after 10s
    }
});

export default sequelize;