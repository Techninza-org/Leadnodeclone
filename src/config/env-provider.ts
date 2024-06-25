import dotenv from 'dotenv';

dotenv.config();

export const envProvider = {
    PORT: process.env.PORT || 8080,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET
};