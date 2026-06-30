import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
  try {
    let transporter;
    
    // If user provided SMTP credentials in environment, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Otherwise, use a fake Ethereal account for development
      console.log('No SMTP config found. Generating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '"TaskXpert Support" <support@taskxpert.com>',
      to,
      subject,
      html,
    });

    console.log("Email sent: %s", info.messageId);
    
    // Ethereal URL where you can view the email online in development
    if (!process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
