import jwt, {SignOptions} from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface JwtPayload {
    userId: string;
    role: string;
}

export const generateToken = (payload: JwtPayload, expiresIn : `${number}${'s' | 'm' | 'h' | 'd' | 'y'}` = "7d"): string => {
    const secret = process.env.JWT_SECRET as string;

    if (!secret) {
        throw new Error("JWT Secret not defined");
    }

    const options : SignOptions = {expiresIn};

    return jwt.sign(payload, secret, options);
};
