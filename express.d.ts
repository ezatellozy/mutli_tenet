// express.d.ts
import type { JwtPayload } from "jsonwebtoken";
import type { Sequelize } from "sequelize";
// import type { TenantModels } from "./src/tenants/models/types"; // عدل المسار حسب مشروعك

declare global {
  namespace Express {
    interface Request {
      auth?: {
        payload: JwtPayload;
        token: string;
      };
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    db?: Sequelize;
    models?: any; //TenantModels
    tenant?: {
      id: number;
      tenant_key: string;
      db_url: string;
      email: string | null;
      isActive: boolean;
    };
    user?: { email: string; tenantId: number; role?: string; uid?: number };
  }
}
