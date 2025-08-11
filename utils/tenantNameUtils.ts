// src/utils/tenantNameUtils.ts

// أسماء محجوزة ما ينفعش تتاخد كـ subdomain/tenantKey
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "admin",
  "mail",
  "smtp",
  "imap",
  "pop",
  "support",
  "help",
  "docs",
  "static",
  "cdn",
  "assets",
  "root",
  "sys",
  "db",
  "mysql",
  "postgres",
  "test",
]);

// 1) slug بسيط من اسم الشركة لاستخدامه كبذرة (للواجهات/عناوين)
export function slugifyCompanyName(name: string): string {
  return (
    (name || "")
      .toLowerCase()
      .normalize("NFKD") // إزالة لهجات/ديacritics قدر الإمكان
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-") // غير ASCII → شرطات
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "company"
  );
}

// 2) tenantKey آمن للاستخدام كمُعرّف داخلي/اسم قاعدة (حروف، أرقام، _)
export function safeTenantKey(input: string): string {
  const s = (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_") // كل غير المسموح → _
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return s || "t";
}

// 3) اسم قاعدة MySQL من tenantKey (حد أقصى 64 حرف)
export function dbNameFromTenantKey(key: string): string {
  const base = `t_${safeTenantKey(key)}`;
  // حد MySQL لاسم القاعدة 64 char
  return base.slice(0, 64);
}

// 4) تحقق صحة subdomain (RFC-ish): حروف/أرقام وسط شرطات، يبدأ/ينتهي بحرف/رقم
export function isValidSubdomainLabel(label: string): boolean {
  if (!label) return false;
  if (label.length < 3 || label.length > 30) return false;
  if (RESERVED_SUBDOMAINS.has(label)) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(label);
}

// 5) توليد subdomain مُدار عندك من tenantKey (yourdomain.com برا المنظومة هنا)
export function managedSubdomainFromKey(tenantKey: string): string {
  // نستبدل _ بـ - للعرض في URL
  const label = tenantKey.replace(/_/g, "-");
  return label;
}

// 6) اسم فريد بإضافة -1, -2, ... (عامّة؛ مفيدة للtenantKey أو subdomain)
export async function makeUnique(
  base: string,
  existsFn: (candidate: string) => Promise<boolean>,
  options?: { maxTries?: number; separator?: string; maxLen?: number }
): Promise<string> {
  const sep = options?.separator ?? "-";
  const maxTries = options?.maxTries ?? 200;
  const maxLen = options?.maxLen ?? 30;

  let candidate = base.slice(0, maxLen);
  if (!(await existsFn(candidate))) return candidate;

  for (let i = 1; i <= maxTries; i++) {
    const suffix = `${sep}${i}`;
    const prefix = base.slice(0, Math.max(1, maxLen - suffix.length));
    const next = `${prefix}${suffix}`;
    if (!(await existsFn(next))) return next;
  }
  throw new Error("Unable to generate a unique name");
}

// 7) باكدچ جاهزة لتوليد tenantKey/subdomain/dbName من مدخلات التسجيل
export async function generateTenantIdentifiers(options: {
  companyName?: string;
  preferredSubdomain?: string;
  checkTenantKeyExists: (k: string) => Promise<boolean>;
  checkSubdomainExists: (label: string) => Promise<boolean>; // label فقط (بدون الدومين)
}) {
  const {
    companyName,
    preferredSubdomain,
    checkTenantKeyExists,
    checkSubdomainExists,
  } = options;

  // اختَر بذرة الاسم
  const seed =
    preferredSubdomain?.toLowerCase() || slugifyCompanyName(companyName || "");

  // تحضير tenantKey آمن
  let tenantKey = safeTenantKey(seed);
  if (await checkTenantKeyExists(tenantKey)) {
    tenantKey = await makeUnique(tenantKey, checkTenantKeyExists, {
      maxLen: 30,
    });
  }

  // subdomain label للعرض (استبدال _ بـ -) + تحقق RFC-ish + reserved
  let subLabel = managedSubdomainFromKey(tenantKey);
  if (
    !isValidSubdomainLabel(subLabel) ||
    (await checkSubdomainExists(subLabel))
  ) {
    // جرّب slug من اسم الشركة لو preferred مش صالح
    subLabel = slugifyCompanyName(companyName || tenantKey).replace(/_/g, "-");
    if (!isValidSubdomainLabel(subLabel)) subLabel = "app";
    if (await checkSubdomainExists(subLabel)) {
      subLabel = await makeUnique(subLabel, checkSubdomainExists, {
        maxLen: 30,
      });
    }
  }

  // اسم قاعدة البيانات
  const dbName = dbNameFromTenantKey(tenantKey);

  return { tenantKey, subdomainLabel: subLabel, dbName };
}
