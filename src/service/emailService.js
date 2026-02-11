const nodemailer = require('nodemailer');

const googleEmail = (process.env.GOOGLE_EMAIL || '').trim();
// Gmail app passwords are often displayed with spaces; normalize them.
const googleAppPassword = (process.env.GOOGLE_APP_PASSWORD || '').replace(/\s+/g, '');

const isEmailConfigured = Boolean(googleEmail && googleAppPassword);

const emailClient = isEmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: googleEmail,
        pass: googleAppPassword
      }
    })
  : null;

if (emailClient) {
  emailClient.verify((error) => {
    if (error) {
      console.error('Email service configuration error:', error.message);
    } else {
      console.log('Email service is ready to send emails');
    }
  });
} else {
  console.warn(
    'Email service is disabled (missing GOOGLE_EMAIL/GOOGLE_APP_PASSWORD). Password reset / user invite emails will not send.'
  );
}

const emailService = {
  isEnabled: isEmailConfigured,
  send: async (to, subject, body) => {
    try {
      if (!emailClient) {
        return {
          sent: false,
          reason:
            'Email service is disabled (missing GOOGLE_EMAIL/GOOGLE_APP_PASSWORD)'
        };
      }

      const emailOptions = {
        from: googleEmail,
        to,
        subject,
        text: body
      };

      await emailClient.sendMail(emailOptions);
      console.log(` Email sent successfully to ${to}`);
      return { sent: true };
    } catch (error) {
      console.error(' Failed to send email:', error.message);
      return { sent: false, reason: error.message };
    }
  }
};

module.exports = emailService;
