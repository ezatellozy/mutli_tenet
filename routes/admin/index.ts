import express, { Router, Request, Response } from "express";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  deleteSectionBlog,
} from "../../src/controllers/admin/blogs/blogs";

import { validateRequest } from "../../src/middleware/validateRequest";
import {
  createHomeServiceSchema,
  updateHomeServiceSchema,
} from "../../src/schemas/homeService.schema";

import {
  createSettings,
  settingIndex,
} from "../../src/controllers/admin/settings";
import { authTenant } from "../../src/middleware/authTenant";

const router: Router = express.Router();

router.get("/blogs", authTenant, getAllBlogs);
router.post("/blogs", createBlog);
router.put("/blogs/:id", updateBlog);

router.delete("/blogs/:id", deleteBlog);

router.get("/blogs/:id", getBlogById);

router.delete("/blog-section/:id", deleteSectionBlog);

//  Settings

router.post("/settings", createSettings);
router.get("/settings", settingIndex);

export default router;
