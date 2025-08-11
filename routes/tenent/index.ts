import express, { Router, Request, Response } from "express";
import {
  createTenant,
  getAllTenants,
} from "../../src/controllers/tenent/create_tenent";
import { createTenentServiceSchema } from "../../src/schemas/tenentService.schema";
import { validateRequest } from "../../src/middleware/validateRequest";

const router: Router = express.Router();

router.post(
  "/create",
  validateRequest(createTenentServiceSchema),
  createTenant
);
router.get("/", getAllTenants);

export default router;
