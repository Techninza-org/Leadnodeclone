import argon2 from 'argon2';
import prisma from '../config/database';
import JWT from 'jsonwebtoken';
import axios from 'axios';

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


export const sendOTP = async (typee: any, phone: string, complaintno: any) => {
    const url = "http://uphartransn.upharmedia.com/submitsms.jsp?";
    const user = "SHRIOM"; // Your authentication key.
    const key = "ed75972690XX"; // Your authentication key.
    const senderid = "HEROGY"; // Sender ID, should be 6 characters long.
    const tempid = "1207161752231722138";
    const entityid = "1201160300409903508";
    const accusage = "1"; // Define route
    const unicode = "1";
    if (typee === 1) { // complaint opening
        const text1 = `प्रिय ग्राहक, आपका COMPLAINT NO- ${complaintno} है, और जानने के लिए bismithblac.com/complaints/${complaintno} ,Visit-SHRI OM SAI हीरो, MO- 7574826963`;
        const mobile = phone; // Multiple mobiles numbers separated by comma.

        const data = new URLSearchParams({
            user: user,
            key: key,
            mobile: mobile,
            message: text1,
            senderid: senderid,
            unicode: unicode,
            tempid: tempid,
            entityid: entityid,
            accusage: accusage
        });

        const response = (await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })).data
    }
}


export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    const user = await prisma.member.findFirst({
        where: {
            phone,
        },
    });
    if (!user) {
        return false;
    }
    const validOtp = user.otp;
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
    const token = JWT.sign(data, process.env.JWT_SECRET!, { algorithm: "HS384", expiresIn: '7d' });
    return token;
}