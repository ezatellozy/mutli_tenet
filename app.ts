import express, { Application, Router } from "express";
import webRoutes from "./routes/web/index";
import adminRoutes from "./routes/admin/index";
import generalRoutes from "./routes/general";
import AdminAuthRoutes from "./routes/auth/admin";
import tenentRoutes from "./routes/tenent";
import { authenticateToken } from "./src/middleware/jwtMiddleware";
import helmet from "helmet";
import compression from "compression";
import multer from "multer";

import sequelize from "./utils/database";

import applyAssociations from "./src/models/associations";
import path from "path";
import cors from "cors";
// import multer from "multer"

// import { auth } from 'express-openid-connect'
// import config from "./src/config/index"

import dotenv from "dotenv";
import { errorHandler } from "./src/middleware/errorHandler";
dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    // credentials: true,
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Self domain
        connectSrc: ["'self'", "https://backend.najidalqimam.sa"],
        imgSrc: ["'self'", "https://backend.najidalqimam.sa"],
        mediaSrc: ["'self'", "https://backend.najidalqimam.sa"],
        scriptSrc: ["'self'"], // Self scripts only
        objectSrc: ["'none'"], // No plugins or Flash
        upgradeInsecureRequests: [], // Force HTTP to HTTPS
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin images/media if needed
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);
const PORT: number = 3001;

// const authConfig = {
//   authRequired: false,
//   auth0Logout: true,
//   secret: config.SECRET_KEY,
//   baseURL: 'http://localhost:3001',
//   clientID: 'ZkmZ70f9L8q1gp4C1sbeuR48PabOaYPo',
//   issuerBaseURL: 'https://dev-u21x8evx4504vo32.us.auth0.com'
// };

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static("public/storage/images"));
app.use("/files", express.static("public/storage/files"));

// app.use(express.urlencoded({ extended: true }));

const apiRouter: Router = express.Router();

apiRouter.use("/web", webRoutes);
apiRouter.use("/admin/auth", multer().any(), AdminAuthRoutes);
apiRouter.use("/tenent", multer().any(), tenentRoutes);

apiRouter.use("/admin", multer().none(), authenticateToken, adminRoutes);
apiRouter.use("/general", generalRoutes);

app.use("/api", apiRouter);

app.use(errorHandler);
// applyAssociations();

sequelize
  .sync({
    force: true, // Set true to drop table and create new one each time.
    // logging: false, // Set to true to log all SQL queries.
  })
  .then((res) => {
    app.listen({
      port: PORT,
      host: "0.0.0.0",
      env: process.env.NODE_ENV || "development",
    });
  })
  .catch((err) => console.log(err));
