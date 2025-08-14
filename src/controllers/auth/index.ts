import { Request, Response } from "express";
import token from "./createToken";
import User from "../../models/users";
import { ResponseHandler } from "../../../utils/responseHandler";

import bcrypt from "bcrypt";
import config from "../../config";
import jwt from "jsonwebtoken";
import Tenant from "../../models/tenant";

const checkPassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log(req.body);

  try {
    if (!req.body) {
      ResponseHandler.error(res, "Invalid request", 422);
      return;
    }

    const { email, password } = req.body;
    const errors = [];
    if (!email) errors.push("Email");
    if (!password) errors.push("Password");

    if (errors.length) {
      ResponseHandler.error(res, "Validation error", 422, errors);
      return;
    }

    const user = await Tenant.scope("withPassword").findOne({
      where: { email },
    });
    if (!user) {
      ResponseHandler.error(res, "Invalid email or password", 422);
      return;
    }
    if (!(await checkPassword(password, user.password))) {
      ResponseHandler.error(res, "Invalid email or password", 422);
      return;
    }

    const userToken = await token(user);
    const userData = user.get();

    const imageUrl = userData.image
      ? `${req.protocol}://${req.get(
          "host"
        )}/images/users/${userData.image.replace(/\\/g, "/")}`
      : `${req.protocol}://${req.get("host")}/assets/images/logo.jpeg`;
    const response = {
      ...userData,
      //   name: userData.name,
      //   email: userData.email,
      //   role: null,
      //   phone: userData.phone,
      token: userToken,
      image: imageUrl,
    };
    ResponseHandler.success(res, response, "Login successful");
  } catch (err) {
    if (err instanceof Error) {
      ResponseHandler.error(res, err.message ?? "Invalid request", 500);
    } else {
      ResponseHandler.error(res, "Invalid request", 500);
    }
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Check for the Authorization header
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    ResponseHandler.error(res, "Missing Authorization header", 422);
    return;
  }

  // Expecting header in the format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    ResponseHandler.error(res, "Invalid Authorization header format", 422);
    return;
  }
  const token = parts[1];
  try {
    const decodedToken = jwt.verify(token, config.SECRET_KEY!) as {
      sub: string;
    };
    const userId = decodedToken.sub;
    const user = await Tenant.findByPk(userId, {
      attributes: ["id", "name", "email", "phone", "role", "image"],
    });
    if (!user) {
      ResponseHandler.error(res, "User not found", 422);
      return;
    }
    const userData = user.get();

    const imageUrl = userData.image
      ? `${req.protocol}://${req.get(
          "host"
        )}/images/users/${userData.image.replace(/\\/g, "/")}`
      : `${req.protocol}://${req.get("host")}/assets/images/logo.jpeg`;
    const response = {
      name: userData.name,
      email: userData.email,
      role: null,
      phone: userData.phone,

      image: imageUrl,
    };

    ResponseHandler.success(res, response);
  } catch (err: any) {
    ResponseHandler.error(res, err.message || "Unauthorized access", 401);
  }
};
