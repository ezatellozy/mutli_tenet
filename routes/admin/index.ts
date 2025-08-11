

import express, { Router, Request, Response } from 'express'
import { createBlog, updateBlog, deleteBlog, getAllBlogs, getBlogById, deleteSectionBlog } from "../../src/controllers/admin/blogs/blogs"
import {
  createFeature, updateFeature,
  deleteFeature, getFeaturesIndex, getFeatureById
} from "../../src/controllers/features"
import { createHomeAbout, deleteHomeAbout, getHomeAbout } from "../../src/controllers/admin/pages/home_about"
import { createHomeIntro, getHomeIntro } from "../../src/controllers/admin/pages/home_intro"
import { createService, updateService, deleteService, getServiceById, getIndex, getAllServices } from "../../src/controllers/admin/services/services"

import { validateRequest } from '../../src/middleware/validateRequest';
import { createHomeServiceSchema, updateHomeServiceSchema } from '../../src/schemas/homeService.schema';
import { createHomeService, updateHomeService, deleteHomeService, getHomeServiceById, getHomeServicesIndex } from "../../src/controllers/admin/services/home_services"

import { createSettings, settingIndex } from "../../src/controllers/admin/settings"
import { contactsIndex } from '../../src/controllers/admin/contacts'
import { newsIndex } from '../../src/controllers/admin/news_letters'
import { createSection, getSectionIndex, deleteSection, updateSection, deleteSectionFeature } from "../../src/controllers/admin/service_sections/sections"
import { createAbout, deleteAbout, getAboutId, getAboutIndex, updateAbout } from '../../src/controllers/admin/about'
import { createProject, updateCreateProject } from '../../src/controllers/admin/projects/main_data'
import { getIndexProjects, getProject } from '../../src/controllers/admin/projects'
import { createProjectMainFeature, deleteMainFeature, deleteProjectImage } from '../../src/controllers/admin/projects/main_features'
import { createProjectFeature } from '../../src/controllers/admin/projects/project_features'






const router: Router = express.Router();







// Pages intro
router.post("/home_intro", createHomeIntro)
router.get("/home_intro", getHomeIntro)



// Pages home
router.get("/home_about", getHomeAbout)
router.post("/home_about", createHomeAbout)
router.delete("/pages", deleteHomeAbout)

// About

router.get("/about", getAboutIndex);
router.post("/about", createAbout)
router.put("/about/:id", updateAbout);
router.delete("/about/:id", deleteAbout)
router.get("/about/:id", getAboutId)


// Blogs 

router.get("/blogs", getAllBlogs);
router.post("/blogs", createBlog)
router.put("/blogs/:id", updateBlog);

router.delete("/blogs/:id", deleteBlog)

router.get("/blogs/:id", getBlogById)

router.delete("/blog-section/:id", deleteSectionBlog)

// Home Services 


router.get("/home_services/:id?", (req: Request, res: Response): void => {

  if (req.params.id) {
    getHomeServiceById(req, res)


  } else {
    getHomeServicesIndex(req, res)

  }
});
router.post("/home_services", createHomeService);
router.put("/home_services/:id", updateHomeService);
router.delete("/home_services/:id", deleteHomeService)

// Services 
router.get("/services/:id?", (req: Request, res: Response): void => {


  if (req.params.id) {
    getServiceById(req, res)
    return

  } else {
    getIndex(req, res)
    return
  }
});
router.post("/services", createService);
router.get("/all-services", getAllServices);
router.put("/services/:id", updateService);
router.delete("/services/:id", (req: Request, res: Response) => deleteService(req, res))
router.post("/services/:id/section", createSection);
router.put("/services/:id/section/:section", updateSection);
router.get("/services/:id/section", getSectionIndex);
router.delete("/services/:id/section/:section", deleteSection);
router.delete("/section-features/:id", deleteSectionFeature);

// features 
router.get("/features/:id?", (req: Request, res: Response): void => {
  if (req.params.id) getFeatureById(req, res)
  else getFeaturesIndex(req, res)
});
router.post("/features", createFeature);
router.put("/features/:id", updateFeature);
router.delete("/features/:id", deleteFeature)

//  Settings 

router.post('/settings', createSettings)
router.get('/settings', settingIndex)
router.get('/contacts', contactsIndex)
router.get('/news-letter', newsIndex)

// Projects

router.get("/projects", getIndexProjects)
router.get("/projects/:id", getProject)
router.post("/projects/main_data", createProject)
router.put("/projects/main_data/:id", updateCreateProject)
router.post("/projects/:id/main_features", createProjectMainFeature)
router.delete("/projects/main_features/:id", deleteMainFeature);
router.post("/projects/:id/project_features", createProjectFeature)
router.delete("/projects/delete_image/:id", deleteProjectImage)
// router.delete("/projects/:id", deleteProject)






export default router;
