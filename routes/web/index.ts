import express, { Router } from "express";
import { homeRequest } from "../../src/controllers/web/home";
import { getAllServices, getServiceBySlug } from "../../src/controllers/web/services";
import { settingIndex } from "../../src/controllers/web/settings";

import { aboutRequest } from "../../src/controllers/web/about";
import { createContact, createNews } from "../../src/controllers/web/contacts";
import { getAllBlogs, getBlogBySlug, getBlogsRelatedToCategory, getFirstBlogs } from "../../src/controllers/web/blogs";
import { getAllProjects, getProjectBySlug } from "../../src/controllers/web/projects";






const router: Router = express.Router();

router.get("/home", homeRequest);
router.get("/blogs", getAllBlogs);
router.get("/blogs_top", getFirstBlogs);
router.get("/blogs/:slug", getBlogBySlug);
router.get("/related-blog/:id", getBlogsRelatedToCategory);
router.get("/about", aboutRequest);
router.get('/settings', settingIndex)
router.post('/contacts', createContact)
router.post('/news-letter', createNews)
router.get('/services/:slug', getServiceBySlug)

router.get('/all-services', getAllServices)
// router.get('/all-services', getAllServices)

router.get("/projects", getAllProjects);
router.get("/projects/:slug", getProjectBySlug);


// router.get("/blogs/:id?", async (req: Request, res: Response) => {
//   const id = req.params.id
//   if (id) {
//     getBlogById(req, res)
//   } else {
//     getAllBlogs(req, res)
//   }
// });


export default router
