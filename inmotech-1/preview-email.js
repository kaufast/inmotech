/**
 * Email Preview Generator
 * Creates local HTML files to preview emails without sending
 */

import { createWelcomeEmailTemplate, createPasswordResetTemplate } from './src/lib/sesClient.js';
import fs from 'fs';

function generateEmailPreviews() {
  console.log('🎨 Generating Email Previews for Kenneth...');
  
  // Generate welcome email preview
  const welcomeHtml = createWelcomeEmailTemplate(
    'Kenneth',
    'https://inmotech.com/verify-email?token=preview123&email=kennethmelchor@gmail.com'
  );
  
  // Generate password reset preview
  const resetHtml = createPasswordResetTemplate(
    'Kenneth',
    'https://inmotech.com/reset-password?token=preview456&email=kennethmelchor@gmail.com'
  );
  
  // Save preview files
  fs.writeFileSync('welcome-email-preview.html', welcomeHtml);
  fs.writeFileSync('password-reset-preview.html', resetHtml);
  
  console.log('✅ Email previews generated:');
  console.log('📄 welcome-email-preview.html');
  console.log('📄 password-reset-preview.html');
  console.log('');
  console.log('🌐 Open these files in your browser to see how the emails look!');
  console.log('');
  console.log('📧 Recipient: kennethmelchor@gmail.com');
  console.log('🎯 These show exactly what Kenneth would receive when you send real emails.');
}

generateEmailPreviews();