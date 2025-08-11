import express, { Router } from 'express';
import { Attachments, dynamicUploadMiddleware } from '../src/controllers/attachments';
const router: Router = express.Router();




router.post('/attachments', dynamicUploadMiddleware, Attachments)

export default router;