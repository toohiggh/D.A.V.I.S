// utils/emailService.js
const nodemailer = require('nodemailer');
const { emailConfig } = require('../config.json');

const ALLOWED_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
];

const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
    },
});

const validateEmail = (email) => {
    email = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, reason: 'FORMAT' };
    }

    const domain = email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
        return { valid: false, reason: 'DOMAIN' };
    }

    return { valid: true };
};

const sendOtpEmail = async (email, otp) => {
    const validation = validateEmail(email);
    if (!validation.valid) {
        throw new Error(validation.reason);
    }

    const otpDuration = 2;

    const mailOptions = {
        from: `"DEVS - Verification" <${emailConfig.user}>`,
        to: email,
        subject: 'Your Verification OTP - Secure Your Account',
        text: `Your OTP is: ${otp}. It expires in ${otpDuration} minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <header style="background-color: #2d3748; padding: 10px; text-align: center; color: white; border-radius: 5px;">
                    <h2 style="margin: 0; font-size: 24px;">DEVS Verification</h2>
                </header>
                <section style="padding: 20px; background-color: #f9fafb; border-radius: 5px; margin-top: 15px;">
                    <h3 style="color: #2d3748; font-size: 22px;">Hello!</h3>
                    <p style="font-size: 16px; color: #4a5568;">
                        Thank you for using DEVS! Please use the following OTP to complete your verification.
                    </p>
                    <div style="background-color: #edf2f7; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0;">
                        <h1 style="color: #2d3748; font-size: 36px; letter-spacing: 4px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="font-size: 16px; color: #4a5568; text-align: center;">
                        Remember! This code is only valid for <strong>${otpDuration} minutes</strong>.
                    </p>
                </section>
                <footer style="padding-top: 20px; font-size: 14px; text-align: center; color: #718096;">
                    <p style="margin: 0;">If you didn't request this, please ignore this email or reach out to our support team.</p>
                    <p style="margin: 5px 0;">Contact Support: <a href="mailto:support@devs.com" style="color: #2b6cb0; text-decoration: none;">support@devs.com</a></p>
                </footer>
            </div>
        `,
    };    

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('SMTP_ERROR');
    }
};

module.exports = {
    validateEmail,
    sendOtpEmail,
    ALLOWED_DOMAINS,
};