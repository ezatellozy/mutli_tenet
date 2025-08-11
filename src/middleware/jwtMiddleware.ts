import jwt from "jsonwebtoken"

import { Request, Response, NextFunction } from "express"

import config from "../config/index"

export interface UserToRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: UserToRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"]
    if (authHeader) {
        const token = authHeader.split(" ")[1]
        jwt.verify(token, config.SECRET_KEY!, (err, user) => {
            if (err) {
                res.status(401).json({ message: "Unauthorized access" })
                return
            }
            req.user = user
            next()
        })
    } else {
        res.status(401).json({ message: "No token provided" })
    }
}