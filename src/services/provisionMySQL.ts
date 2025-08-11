// src/services/provisionMySQL.ts
import { Sequelize } from "sequelize";
import { dbNameFromTenantKey } from "../../utils/tenantNameUtils";
import { myAdmin } from "../../utils/database";

function generateStrongPassword(len = 24) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%^&*()-_=+";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** لأن أسماء الـ identifiers لا تُمرّر كـ bind params بأمان، نعمل sanitize مسبقًا */
function assertSafeIdentifier(id: string, kind: "db" | "user" = "db") {
  const ok = /^[a-z0-9_]{1,64}$/.test(id);
  if (!ok) throw new Error(`Invalid ${kind} identifier: ${id}`);
}

function userFromDb(dbName: string) {
  // حد أسماء مستخدمي MySQL عادةً 32–128 حسب الإصدار—نخليه آمنًا
  const u = `u_${dbName}`.slice(0, 32);
  return u;
}

export type ProvisionResult = {
  dbName: string;
  dbUser: string;
  dbPass: string;
  tenantDbUrl: string;
};

/**
 * ينشئ قاعدة بيانات و user خاص للتينانت ويشغّل migrations
 */
export async function provisionMyTenant(params: {
  tenantKey: string;
  dbName?: string;
  host?: string; // أين سيُسمح للـ user بالاتصال (يفضّل 127.0.0.1)
  port?: number; // منفذ MySQL
}): Promise<ProvisionResult> {
  const host = params.host ?? process.env.DB_HOST ?? "127.0.0.1";
  const port = Number(params.port ?? process.env.DB_PORT ?? 3306);

  const dbName = params.dbName ?? dbNameFromTenantKey(params.tenantKey);
  assertSafeIdentifier(dbName, "db");

  const dbUser = userFromDb(dbName);
  assertSafeIdentifier(dbUser, "user");

  const dbPass = generateStrongPassword();

  // 1) إنشاء القاعدة (idempotent)
  await myAdmin.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );

  // 2) إنشاء المستخدم ومنحه الصلاحيات (مقيّد على host المحدد)
  await myAdmin.query(
    `CREATE USER IF NOT EXISTS '${dbUser}'@'${host}' IDENTIFIED BY '${dbPass}';`
  );
  await myAdmin.query(
    `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'${host}';`
  );
  await myAdmin.query(`FLUSH PRIVILEGES;`);

  const tenantDbUrl = `mysql://${encodeURIComponent(
    dbUser
  )}:${encodeURIComponent(dbPass)}@${host}:${port}/${dbName}`;

  // 3) تشغيل المهاجرات/البذور داخل قاعدة التينانت
  const tenantSequelize = new Sequelize(tenantDbUrl, {
    dialect: "mysql",
    logging: false,
  });
  try {
    await runMigrationsMySQL(tenantSequelize);
  } finally {
    await tenantSequelize.close();
  }

  return { dbName, dbUser, dbPass, tenantDbUrl };
}

/**
 * مهاجرات مبدئية—بدّلها لاحقًا بـ Umzug أو أداة migrations المفضلة لديك
 */
export async function runMigrationsMySQL(db: Sequelize) {
  // جدول لتتبع المهاجرات (بسيط)
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(191) NOT NULL,
      run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // جدول users كمثال (بدّله بجداول نظامك)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(191) UNIQUE NOT NULL,
      name  VARCHAR(191),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // مثال seed
  await db.query(
    `INSERT IGNORE INTO users (email, name) VALUES ('owner@example.com', 'Owner');`
  );
}

/** (اختياري) حذف تينانت: إسقاط القاعدة والمستخدم */
export async function dropMyTenant(params: {
  tenantDbName: string;
  host?: string;
}) {
  const host = params.host ?? process.env.DB_HOST ?? "127.0.0.1";
  const dbName = params.tenantDbName;
  assertSafeIdentifier(dbName, "db");
  const dbUser = userFromDb(dbName);

  await myAdmin.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
  await myAdmin.query(`DROP USER IF EXISTS '${dbUser}'@'${host}';`);
  await myAdmin.query(`FLUSH PRIVILEGES;`);
}
