/**
 * Amazon SES Client Helper Module
 * Real Estate Crowdfunding Investment Platform
 * 
 * Features:
 * - Plain email sending
 * - Dynamic template email sending  
 * - SES template email sending
 * - Proper error handling and logging
 */

import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES Client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Default sender email
const DEFAULT_SENDER = process.env.SES_SENDER_EMAIL || 'noreply@inmotech.com';

/**
 * Send a plain text or HTML email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (HTML or plain text)
 * @param {string} senderEmail - Optional sender email (defaults to SES_SENDER_EMAIL)
 * @returns {Promise<Object>} SES response or error
 */
export async function sendPlainEmail(to, subject, body, senderEmail = DEFAULT_SENDER) {
  try {
    console.log(`📧 Sending plain email to: ${to}, Subject: ${subject}`);
    
    const command = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: body,
            Charset: 'UTF-8',
          },
          Text: {
            Data: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`✅ Email sent successfully. MessageId: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
    
  } catch (error) {
    console.error('❌ Failed to send plain email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.name 
    };
  }
}

/**
 * Send an email using dynamic template variables
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject (can contain variables)
 * @param {string} templateString - HTML template with {{variable}} placeholders
 * @param {Object} variables - Object with variable replacements
 * @param {string} senderEmail - Optional sender email
 * @returns {Promise<Object>} SES response or error
 */
export async function sendDynamicEmail(to, subject, templateString, variables, senderEmail = DEFAULT_SENDER) {
  try {
    console.log(`📧 Sending dynamic email to: ${to}, Variables:`, Object.keys(variables));
    
    // Replace variables in subject
    let processedSubject = subject;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(regex, variables[key]);
    });
    
    // Replace variables in template
    let processedTemplate = templateString;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, variables[key]);
    });

    const command = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: processedSubject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: processedTemplate,
            Charset: 'UTF-8',
          },
          Text: {
            Data: processedTemplate.replace(/<[^>]*>/g, ''),
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`✅ Dynamic email sent successfully. MessageId: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
    
  } catch (error) {
    console.error('❌ Failed to send dynamic email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.name 
    };
  }
}

/**
 * Send an email using a pre-created SES template
 * @param {string} to - Recipient email address
 * @param {string} templateName - Name of the SES template
 * @param {Object} templateData - Data to populate template variables
 * @param {string} senderEmail - Optional sender email
 * @returns {Promise<Object>} SES response or error
 */
export async function sendTemplateEmail(to, templateName, templateData, senderEmail = DEFAULT_SENDER) {
  try {
    console.log(`📧 Sending template email to: ${to}, Template: ${templateName}`);
    
    const command = new SendTemplatedEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [to],
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
    });

    const response = await sesClient.send(command);
    console.log(`✅ Template email sent successfully. MessageId: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
    
  } catch (error) {
    console.error('❌ Failed to send template email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.name 
    };
  }
}

/**
 * Create a welcome email template with InmoTech branding
 * @param {string} firstName - User's first name
 * @param {string} verificationLink - Email verification link
 * @returns {string} HTML template
 */
export function createWelcomeEmailTemplate(firstName, verificationLink) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a InmoTech!</title>
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          margin-top: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #ED4F01 0%, #FF6B35 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 700; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
        .content { 
          padding: 40px 30px; 
          line-height: 1.6; 
          color: #333; 
        }
        .welcome-message {
          font-size: 18px;
          margin-bottom: 25px;
          color: #2d3748;
        }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #ED4F01 0%, #FF6B35 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s ease;
        }
        .cta-button:hover { 
          transform: translateY(-2px); 
        }
        .stats-container {
          background: #f8fafc;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
          text-align: center;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 15px;
        }
        .stat-item {
          padding: 15px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #ED4F01;
          display: block;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .benefits {
          background: #f0f9ff;
          border-left: 4px solid #3B82F6;
          padding: 20px;
          margin: 25px 0;
        }
        .benefits h3 {
          margin-top: 0;
          color: #1e40af;
        }
        .benefits ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        .benefits li {
          margin: 8px 0;
          color: #374151;
        }
        .footer { 
          background: #1a202c; 
          color: white; 
          padding: 30px; 
          text-align: center; 
          font-size: 14px; 
        }
        .footer a { 
          color: #FF6B35; 
          text-decoration: none; 
        }
        .security-note {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
        @media (max-width: 600px) {
          .container { margin: 20px; }
          .header, .content { padding: 25px 20px; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 ¡Bienvenido a InmoTech!</h1>
          <p>Tu plataforma de inversión inmobiliaria de confianza</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <strong>¡Hola ${firstName}!</strong><br>
            Nos alegra tenerte en nuestra comunidad de inversores inteligentes. 
            Estás a punto de descubrir una nueva forma de invertir en bienes raíces.
          </div>

          <div class="stats-container">
            <h3 style="margin-top: 0; color: #1a202c;">Únete a miles de inversores exitosos</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number">€47M</span>
                <span class="stat-label">Invertidos</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">2,847</span>
                <span class="stat-label">Inversores</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">127</span>
                <span class="stat-label">Proyectos</span>
              </div>
            </div>
          </div>

          <div class="benefits">
            <h3>🚀 Próximos pasos para empezar:</h3>
            <ul>
              <li><strong>Verifica tu email</strong> - Confirma tu cuenta para acceder a todos los proyectos</li>
              <li><strong>Completa tu perfil</strong> - Añade tu información para personalizar tu experiencia</li>
              <li><strong>Explora proyectos</strong> - Descubre oportunidades de inversión desde €100</li>
              <li><strong>Realiza tu primera inversión</strong> - Comienza a construir tu portafolio</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${verificationLink}" class="cta-button">
              ✅ Verificar Email y Comenzar
            </a>
          </div>

          <div class="security-note">
            <strong>🔒 Nota de seguridad:</strong> Este enlace expira en 24 horas. 
            Si no solicitaste esta cuenta, puedes ignorar este email de forma segura.
          </div>

          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            ¿Tienes preguntas? Responde a este email o visita nuestro 
            <a href="https://inmotech.com/ayuda" style="color: #ED4F01;">centro de ayuda</a>.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>InmoTech</strong> - Inversión inmobiliaria inteligente</p>
          <p>Regulado por la CNMV | Cuentas segregadas | Seguros hasta €100,000</p>
          <p>
            <a href="https://inmotech.com/privacidad">Política de Privacidad</a> | 
            <a href="https://inmotech.com/terminos">Términos de Uso</a> | 
            <a href="https://inmotech.com/contacto">Contacto</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create a password reset email template
 * @param {string} firstName - User's first name
 * @param {string} resetLink - Password reset link
 * @returns {string} HTML template
 */
export function createPasswordResetTemplate(firstName, resetLink) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer Contraseña - InmoTech</title>
      <style>
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .content { 
          padding: 40px 30px; 
          line-height: 1.6; 
          color: #333; 
        }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
        }
        .warning-box {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .footer { 
          background: #1a202c; 
          color: white; 
          padding: 30px; 
          text-align: center; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Restablecer Contraseña</h1>
          <p>Solicitud de cambio de contraseña</p>
        </div>
        
        <div class="content">
          <p><strong>Hola ${firstName},</strong></p>
          
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en InmoTech.</p>
          
          <p>Si fuiste tú quien solicitó este cambio, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="cta-button">
              🔑 Restablecer Contraseña
            </a>
          </div>
          
          <div class="warning-box">
            <h3 style="margin-top: 0; color: #92400e;">⚠️ Información importante:</h3>
            <ul style="color: #92400e;">
              <li>Este enlace expira en <strong>30 minutos</strong> por seguridad</li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Tu cuenta permanece segura hasta que uses este enlace</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <span style="word-break: break-all; color: #ED4F01;">${resetLink}</span>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>InmoTech</strong> - Tu seguridad es nuestra prioridad</p>
          <p>Si necesitas ayuda, contacta con nosotros: soporte@inmotech.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Example usage functions
export async function sendWelcomeEmail(email, firstName, verificationLink) {
  const subject = `¡Bienvenido a InmoTech, ${firstName}! Verifica tu cuenta`;
  const template = createWelcomeEmailTemplate(firstName, verificationLink);
  
  return await sendPlainEmail(email, subject, template);
}

export async function sendPasswordResetEmail(email, firstName, resetLink) {
  const subject = `🔒 Restablecer contraseña - InmoTech`;
  const template = createPasswordResetTemplate(firstName, resetLink);
  
  return await sendPlainEmail(email, subject, template);
}

export async function sendKYCApprovalEmail(email, templateData) {
  return await sendTemplateEmail(email, 'kyc-approval-template', templateData);
}

export async function sendInvestmentConfirmationEmail(email, firstName, projectName, amount) {
  const subject = `✅ Inversión confirmada en ${projectName}`;
  const template = `
    <h2>¡Inversión realizada con éxito!</h2>
    <p>Hola {{firstName}},</p>
    <p>Tu inversión de <strong>€{{amount}}</strong> en el proyecto <strong>{{projectName}}</strong> ha sido confirmada.</p>
    <p>Recibirás actualizaciones periódicas sobre el progreso del proyecto.</p>
  `;
  
  return await sendDynamicEmail(email, subject, template, {
    firstName,
    projectName,
    amount: amount.toLocaleString('es-ES')
  });
}

export async function sendKYCRejectionEmail(email, firstName, reason) {
  const subject = `❌ KYC Verification - Documentos rechazados`;
  const template = `
    <h2>Verificación KYC</h2>
    <p>Hola {{firstName}},</p>
    <p>Lamentamos informarte que tu verificación KYC ha sido rechazada.</p>
    <p><strong>Motivo:</strong> {{reason}}</p>
    <p>Por favor, revisa los documentos y vuelve a enviarlos desde tu panel de control.</p>
  `;
  
  return await sendDynamicEmail(email, subject, template, {
    firstName,
    reason
  });
}

export async function sendPaymentFailedEmail(email, firstName, projectName, amount) {
  const subject = `❌ Error en el pago - ${projectName}`;
  const template = `
    <h2>Error en el procesamiento del pago</h2>
    <p>Hola {{firstName}},</p>
    <p>No hemos podido procesar tu pago de <strong>€{{amount}}</strong> para el proyecto <strong>{{projectName}}</strong>.</p>
    <p>Por favor, verifica tus datos de pago e inténtalo nuevamente.</p>
    <p>Si el problema persiste, contacta con nuestro equipo de soporte.</p>
  `;
  
  return await sendDynamicEmail(email, subject, template, {
    firstName,
    projectName,
    amount: amount.toLocaleString('es-ES')
  });
}

export async function sendProjectFundedEmail(email, firstName, projectName, totalAmount) {
  const subject = `🎉 Proyecto completamente financiado - ${projectName}`;
  const template = `
    <h2>¡Proyecto completamente financiado!</h2>
    <p>Hola {{firstName}},</p>
    <p>Nos complace informarte que el proyecto <strong>{{projectName}}</strong> ha alcanzado su objetivo de financiación.</p>
    <p><strong>Total recaudado:</strong> €{{totalAmount}}</p>
    <p>Recibirás actualizaciones sobre el progreso del desarrollo del proyecto.</p>
  `;
  
  return await sendDynamicEmail(email, subject, template, {
    firstName,
    projectName,
    totalAmount: totalAmount.toLocaleString('es-ES')
  });
}

export async function sendRefundNotificationEmail(email, firstName, projectName, amount, reason) {
  const subject = `💰 Reembolso procesado - ${projectName}`;
  const template = `
    <h2>Reembolso procesado</h2>
    <p>Hola {{firstName}},</p>
    <p>Tu reembolso de <strong>€{{amount}}</strong> del proyecto <strong>{{projectName}}</strong> ha sido procesado.</p>
    <p><strong>Motivo:</strong> {{reason}}</p>
    <p>El importe será devuelto a tu método de pago original en los próximos 5-7 días laborales.</p>
  `;
  
  return await sendDynamicEmail(email, subject, template, {
    firstName,
    projectName,
    amount: amount.toLocaleString('es-ES'),
    reason
  });
}

// Export SES client for advanced usage
export { sesClient };