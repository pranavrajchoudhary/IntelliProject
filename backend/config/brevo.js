const axios = require('axios');

const brevoAPI = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'accept': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
    'content-type': 'application/json'
  }
});

const testBrevoConnection = async () => {
  try {
    const response = await brevoAPI.get('/account');
    console.log('BREVO Connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('BREVO Connection failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

const sendOTPEmail = async (email, otp, userName) => {
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Present (length: ' + process.env.BREVO_API_KEY.length + ')' : 'Missing');
  console.log('BREVO_FROM_EMAIL:', process.env.BREVO_FROM_EMAIL);
  
  let apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is not set');
  }
  
  const brevoRequest = axios.create({
    baseURL: 'https://api.brevo.com/v3',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    timeout: 10000
  });
  
  const emailData = {
    sender: {
      name: "IntelliProject",
      email: process.env.BREVO_FROM_EMAIL || "noreply@intelliproject.com"
    },
    to: [{ email, name: userName }],
    subject: "Password Reset OTP - IntelliProject",
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000; margin-bottom: 10px; font-size: 28px;">IntelliProject</h1>
              <h2 style="color: #333; font-weight: normal; font-size: 20px;">Password Reset Request</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">Hello ${userName},</p>
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">You have requested to reset your password. Please use the following OTP to verify your identity:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <span style="background-color: #000; color: white; padding: 15px 25px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block; font-family: 'Courier New', monospace;">${otp}</span>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
                This OTP will expire in <strong>10 minutes</strong>. If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              <p>This is an automated message from IntelliProject. Please do not reply to this email.</p>
              <p>For support, please contact our team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    console.log('Sending email request to BREVO...');
    console.log('Email data:', JSON.stringify(emailData, null, 2));
    
    const response = await brevoRequest.post('/smtp/email', emailData);
    console.log('OTP email sent successfully:', response.data);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid BREVO API key. Please check your API key configuration.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid email configuration. Please verify sender email in BREVO dashboard.');
    } else {
      throw new Error(`Failed to send OTP email: ${error.response?.data?.message || error.message}`);
    }
  }
};

module.exports = {
  sendOTPEmail,
  testBrevoConnection
};
