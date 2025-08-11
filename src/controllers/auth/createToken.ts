import jwt from "jsonwebtoken";
import config from "../../config/index";
import Tenant from "../../models/tenant";

const token = (user: Tenant) =>
  jwt.sign(
    {
      tid: user.id,
      tkey: user.tenant_key,
      sub: user.email,
    },
    config.SECRET_KEY!,
    { expiresIn: "1h", issuer: "test-app" }
  );

export default token;
