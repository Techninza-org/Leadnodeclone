export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    // Example implementation (replace with your actual OTP verification logic)
    const validOtp = '123456'; // This should be dynamically generated and stored
    return otp === validOtp;
};