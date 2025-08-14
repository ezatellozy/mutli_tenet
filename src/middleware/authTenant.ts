// src/middlewares/authTenant.ts
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as BaseJwtPayload } from "jsonwebtoken";

import "dotenv/config";
import Tenant from "../models/tenant";
import Domain from "../models/domain";
import { getTenantContext } from "../../utils/tenantDb";
import { Sequelize } from "sequelize";

interface JwtPayload extends BaseJwtPayload {
  tid: number; // tenant id
  sub: string; // user email (اختياري حسب إصدارك للتوكن)
}

export interface UserToRequest extends Request {
  db?: Sequelize;
  models?: any; //TenantModels
  tenant?: {
    id: number;
    tenant_key: string;
    db_url: string;
    email: string | null;
    isActive: boolean;
  };
  user?: {
    email: string;
    tenantId: number;
    role?: string;
    uid?: number;
  };
}

export async function authTenant(
  req: UserToRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
    if (!token) {
      res.status(401).json({ error: "Missing token" });
      return;
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (e: unknown) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // 1) احضر التينانت من الريجيستري
    const tenant = await Tenant.findByPk(payload.tid);
    if (!tenant || !tenant.isActive) {
      res.status(403).json({ error: "Tenant not found or inactive" });
      return;
    }
    if (!tenant.db_url) {
      res.status(503).json({ error: "Tenant not provisioned" });
      return;
    }

    // 2) (اختياري) تأكيد أن الـ Host الحالي مربوط بالتينانت
    const host = (req.headers.host || "").split(":")[0].toLowerCase();
    if (host) {
      const domain = await Domain.findOne({
        where: { tenant_id: tenant.id, host, verified: true },
      });
      if (!domain) {
        // لو عايز تشددها فعّل السطر التالي
        // return res.status(403).json({ error: "Domain not mapped to tenant" });
      }
    }

    // 3) جهّز اتصال وموديلات التينانت على نفس الـ instance
    const { sequelize, models } = getTenantContext(tenant.db_url);

    // 4) احقن الكونتكست في الطلب
    req.tenant = {
      id: tenant.id,
      tenant_key: tenant.tenant_key,
      db_url: tenant.db_url,
      email: tenant.email,
      isActive: tenant.isActive,
    };
    req.db = sequelize;
    req.models = models;
    req.user = { email: payload.sub, tenantId: tenant.id };

    return next();
  } catch (e: any) {
    if (e?.name === "TokenExpiredError") {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
}
