import express, { Router } from "express";

import { settingIndex } from "../../src/controllers/web/settings";

import {
  getAllBlogs,
  getBlogBySlug,
  getBlogsRelatedToCategory,
  getFirstBlogs,
} from "../../src/controllers/web/blogs";

const router: Router = express.Router();

router.get("/blogs", getAllBlogs);
router.get("/blogs_top", getFirstBlogs);
router.get("/blogs/:slug", getBlogBySlug);
router.get("/related-blog/:id", getBlogsRelatedToCategory);

router.get("/settings", settingIndex);

// router.get("/blogs/:id?", async (req: Request, res: Response) => {
//   const id = req.params.id
//   if (id) {
//     getBlogById(req, res)
//   } else {
//     getAllBlogs(req, res)
//   }
// });

export default router;
