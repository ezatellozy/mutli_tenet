import express, { Router } from "express"
import { login, getProfile } from "../../src/controllers/auth/index"

const router: Router = express.Router();


router.post('/login', login)
router.get('/profile', getProfile)



export default router