import argon2 from 'argon2';
import prisma from '../config/database';
import JWT from 'jsonwebtoken';


export const getUserByIdEmailPhone = async ({ id, email, phone }: { id?: string, email?: string, phone?: string }) => {
    return await prisma.member.findFirst({
        where: {
            OR: [
                { id },
                { email },
                { phone },
            ],
        },
    });
}

export const getUserByRoleId = async (roleId: string) => {
    return await prisma.member.findMany({
        where: { roleId },
    });
}

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    // Example implementation (replace with your actual OTP verification logic)
    const validOtp = '123456'; // This should be dynamically generated and stored
    return otp === validOtp;
};

export const generateHash = async (password: string): Promise<string> => {
    return await argon2.hash(password, {
        hashLength: 20,
        memoryCost: 2 ** 18,
        timeCost: 4,
        parallelism: 1,
        raw: false,
        secret: Buffer.from(process.env.PASSWORD_SECRET!),
        type: argon2.argon2id,
    });
}

export const verifyHash = async (hash: string, password: string): Promise<boolean> => {
    return await argon2.verify(hash, password, {
        secret: Buffer.from(process.env.PASSWORD_SECRET!),
    });
}

export const generateToken = async (data: any) => {
    // JWT token generation logic
    const token = JWT.sign(data, process.env.JWT_SECRET!, { algorithm: "HS384", expiresIn: '1d' });
    return token;
}