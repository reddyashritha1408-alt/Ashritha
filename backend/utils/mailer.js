import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

let transporter;

// Create email log directory
const emailLogDir = path.join(process.cwd(), 'email-logs');
if (!fs.existsSync(emailLogDir)) {
  fs.mkdirSync(emailLogDir, { recursive: true });
}

const initializeTransporter = async () => {
  if (transporter) return transporter;

  // Check if real SMTP details are provided in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('Initializing SMTP mail transporter...');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback: Try to create a test account on Ethereal Mail
  try {
    console.log('Generating Ethereal Mail test credentials...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Ethereal Mail initialized: user = ${testAccount.user}`);
    return transporter;
  } catch (error) {
    console.warn('Could not initialize Ethereal Mail. Falling back to local logging.', error.message);
    // Return null, mail sender will handle logging to console and files
    return null;
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const currentTransporter = await initializeTransporter();
  const from = process.env.SMTP_FROM || '"Pizza Delivery App" <noreply@pizzadelivery.com>';

  // Save copy to local file logs
  const logFileName = `email-${Date.now()}-${to.replace(/[@.]/g, '_')}.html`;
  const logFilePath = path.join(emailLogDir, logFileName);
  const logContent = `
Subject: ${subject}
To: ${to}
Date: ${new Date().toISOString()}
----------------------------------------
${html || text}
`;
  fs.writeFileSync(logFilePath, logContent);

  console.log('\n========================================================================');
  console.log(`📧 EMAIL SENT TO: ${to}`);
  console.log(`📌 SUBJECT: ${subject}`);
  console.log(`📂 LOCAL COPY SAVED AT: file://${logFilePath}`);
  console.log('========================================================================\n');

  if (currentTransporter) {
    try {
      const info = await currentTransporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      // If using Ethereal, print the link to view the sent email!
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log('\n========================================================================');
        console.log(`🔗 VIEW TEST EMAIL ONLINE: ${testUrl}`);
        console.log('========================================================================\n');
      }
      return info;
    } catch (error) {
      console.error('Error sending email via transporter:', error);
    }
  } else {
    console.log('Mail transporter not available. Saved mail locally to file.');
  }
};

export const sendVerificationEmail = async (email, name, token, origin = 'http://localhost:5173') => {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  const subject = 'Verify Your Pizza App Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #f59e0b; text-align: center;">Welcome to Pizza Delivery!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering. Please click the button below to verify your email address and active your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Verify Email</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This verification link will expire in 24 hours.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888; text-align: center;">Pizza Delivery Inc.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text: `Verify email link: ${verifyUrl}` });
};

export const sendResetPasswordEmail = async (email, name, token, origin = 'http://localhost:5173') => {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const subject = 'Reset Your Pizza App Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset for your Pizza Delivery account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px;">Reset Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This password reset link will expire in 1 hour.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888; text-align: center;">Pizza Delivery Inc.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, html, text: `Reset password link: ${resetUrl}` });
};

export const sendStockAlertEmail = async (adminEmail, ingredientName, currentStock, threshold) => {
  const subject = `⚠️ URGENT: Stock Alert - Low Inventory for ${ingredientName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 2px solid #ef4444; border-radius: 10px;">
      <h2 style="color: #ef4444; text-align: center; margin-top: 0;">⚠️ Low Stock Alert</h2>
      <p>Hello Admin,</p>
      <p>This is an automated notification from your Pizza Inventory System.</p>
      <div style="background-color: #fef2f2; padding: 15px; border-left: 5px solid #ef4444; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #991b1b;">
          Item: <span style="color: #000;">${ingredientName}</span>
        </p>
        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #991b1b;">
          Current Stock: <span style="color: #ef4444;">${currentStock}</span> (Threshold: ${threshold})
        </p>
      </div>
      <p>Please log in to the Admin Dashboard to update the stock levels immediately to prevent delivery disruptions.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888; text-align: center;">Pizza Delivery System Manager</p>
    </div>
  `;
  await sendEmail({ to: adminEmail, subject, html, text: `Stock Alert: ${ingredientName} is at ${currentStock} (below threshold of ${threshold}).` });
};
