import jwt from "jsonwebtoken";
import config from "../../config/index"




const token = (id: number) => jwt.sign({
    sub: id,

}, config.SECRET_KEY!, { expiresIn: "1h", issuer: 'test-app' });



export default token


