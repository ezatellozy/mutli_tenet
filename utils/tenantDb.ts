import { Sequelize } from "sequelize";
import { initTenantModels } from "../src/models/initTenantModels";
// import { initTenantModels } from "../src/models/initsBlogsMoظdels";

// import { TenantModels } from "../tenants/models/types";

export interface TenantEntry {
  sequelize: Sequelize;
  models?: any; // يتحدد بعد أول تهيئة
  lastUsedAt: number;
}

const tenantPools = new Map<string, TenantEntry>();

/**
 * يرجّع (أو ينشئ) اتصال Sequelize لقاعدة التينانت المحددة بـ dbUrl.
 * لا يهيّئ الموديلات – فقط اتصال DB.
 */
export function getTenantSequelize(dbUrl: string): Sequelize {
  const existing = tenantPools.get(dbUrl);
  if (existing) {
    existing.lastUsedAt = Date.now();
    return existing.sequelize;
  }

  const sequelize = new Sequelize(dbUrl, {
    dialect: "mysql",
    logging: false,
    pool: { max: 5, min: 0, acquire: 30_000, idle: 10_000 },
  });

  tenantPools.set(dbUrl, { sequelize, lastUsedAt: Date.now() });
  return sequelize;
}

/**
 * يحصل لك على سياق التينانت كامل: اتصال + موديلات متهيّأة على نفس الـ instance.
 * يهيّئ الموديلات مرة واحدة فقط ثم يعيد استخدامها من الكاش.
 */
export function getTenantContext(dbUrl: string): {
  sequelize: Sequelize;
  models: any;
} {
  const now = new Date().toISOString();
  const shortUrl = dbUrl.replace(/(\/\/.*:)(.*)(@)/, "$1****$3"); // إخفاء الباسورد
  console.log(`[${now}] getTenantContext: start for ${shortUrl}`);

  const entry = tenantPools.get(dbUrl);

  if (entry) {
    console.log(`[${now}] getTenantContext: cache HIT`);
    entry.lastUsedAt = Date.now();

    if (entry.models) {
      console.log(`[${now}] getTenantContext: cache has models -> return`);
      return { sequelize: entry.sequelize, models: entry.models };
    }

    console.log(
      `[${now}] getTenantContext: cache has sequelize only -> init models...`
    );
    try {
      const models = initTenantModels(entry.sequelize);
      entry.models = models;
      console.log(
        `[${now}] getTenantContext: models initialized from cache -> return`
      );
      return { sequelize: entry.sequelize, models };
    } catch (e: any) {
      console.error(
        `[${now}] getTenantContext: initTenantModels(cache) failed:`,
        e?.message
      );
      throw e;
    }
  }

  console.log(`[${now}] getTenantContext: cache MISS -> creating sequelize...`);
  const sequelize = new Sequelize(dbUrl, {
    dialect: "mysql",
    logging: false,
    pool: { max: 5, min: 0, acquire: 10_000, idle: 10_000 },
    retry: { max: 0 },
    dialectOptions: { connectTimeout: 10_000 },
  });
  console.log(`[${now}] getTenantContext: sequelize created, init models...`);

  try {
    const models = initTenantModels(sequelize);
    tenantPools.set(dbUrl, { sequelize, models, lastUsedAt: Date.now() });
    console.log(
      `[${now}] getTenantContext: models initialized, cached -> return`
    );
    return { sequelize, models };
  } catch (e: any) {
    console.error(
      `[${now}] getTenantContext: initTenantModels(new) failed:`,
      e?.message
    );
    throw e;
  }
}

/** (اختياري) إغلاق اتصال تينانت معيّن */
export async function closeTenant(dbUrl: string): Promise<void> {
  const entry = tenantPools.get(dbUrl);
  if (!entry) return;
  await entry.sequelize.close();
  tenantPools.delete(dbUrl);
}

/** (اختياري) إغلاق كل الاتصالات (لـ shutdown) */
export async function closeAllTenants(): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const [, entry] of tenantPools) {
    tasks.push(entry.sequelize.close().then(() => undefined));
  }
  await Promise.allSettled(tasks);
  tenantPools.clear();
}

/** (اختياري) تنظيف الاتصالات الخاملة بعد مدة معينة */
export async function pruneIdleTenants(
  maxIdleMs = 15 * 60 * 1000
): Promise<number> {
  const now = Date.now();
  let closed = 0;
  for (const [key, entry] of tenantPools) {
    if (now - entry.lastUsedAt > maxIdleMs) {
      await entry.sequelize.close();
      tenantPools.delete(key);
      closed++;
    }
  }
  return closed;
}
