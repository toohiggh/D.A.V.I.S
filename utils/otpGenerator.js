const otpStore = new Map();

const generateOtp = (userId) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + (2 * 60 * 1000); // 2 minutes

    otpStore.set(userId, { otp, expiry });
    console.log(`Generated OTP for ${userId}: ${otp} (expires in 2 minutes)`); // Updated to reflect 2 minutes
    return otp;
};

const verifyOtp = (userId, enteredOtp) => {
    const record = otpStore.get(userId);
    if (!record) {
        console.log(`No OTP found for ${userId}`);
        return { valid: false, reason: 'NO_OTP' };
    }

    const { otp, expiry } = record;
    if (Date.now() > expiry) {
        console.log(`Expired OTP for ${userId}`);
        otpStore.delete(userId);
        return { valid: false, reason: 'EXPIRED' };
    }

    if (otp === enteredOtp) {
        console.log(`Successful OTP verification for ${userId}`);
        otpStore.delete(userId);
        return { valid: true };
    }

    console.log(`Invalid OTP entered for ${userId}`);
    return { valid: false, reason: 'INVALID' };
};

const clearOtp = (userId) => {
    otpStore.delete(userId);
    console.log(`Cleared OTP for ${userId}`);
};

module.exports = {
    generateOtp,
    verifyOtp,
    clearOtp,
};