import dotenv from "dotenv";
dotenv.config();

const config = {

    SECRET_KEY: process.env.JWT_SECRET,


}

export default config;