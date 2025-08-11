// src/middlewares/authTenant.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Tenant from "../models/tenant";
import Domain from "../models/domain";
import { getTenantSequelize } from "../../utils/tenantDb";

export async function authTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // هات التينانت من الـ Registry
    const tenant = await Tenant.findByPk(payload.tid);
    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ error: "Tenant not found or inactive" });
    }

    // (اختياري قوي) تأكيد الـ Host الحالي مسجل ضمن domains للتينانت ده
    const host = (req.headers.host || "").split(":")[0].toLowerCase();
    const domain = await Domain.findOne({
      where: { tenant_id: tenant.id, host },
    });
    if (!domain) {
      // ممكن تخليها تحذير أو سياسة صارمة حسب احتياجك
      // return res.status(403).json({ error: "Domain not mapped to tenant" });
    }

    // ابن اتصال لقاعدة التينانت
    req.tenant = {
      id: tenant.id,
      key: tenant.tenant_key,
      email: tenant.email,
      db_url: tenant.db_url, // مخزّنة عندك بعد الـ provision
    };

    req.db = getTenantSequelize(tenant.db_url); // Sequelize instance للتينانت

    // (اختياري) مرّر بيانات المستخدم من الـ token
    req.user = { email: payload.sub, tenantId: tenant.id };

    return next();
  } catch (e: any) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}
