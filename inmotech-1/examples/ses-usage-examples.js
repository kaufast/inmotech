/**
 * SES Usage Examples
 * Real Estate Crowdfunding Platform
 * 
 * This file demonstrates how to use the SES client helper module
 * for various email scenarios in the InmoTech platform.
 */

import {
  sendPlainEmail,
  sendDynamicEmail,
  sendTemplateEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendKYCApprovalEmail,
  sendInvestmentConfirmationEmail,
  createWelcomeEmailTemplate,
  createPasswordResetTemplate
} from '../src/lib/sesClient.js';

// Example 1: Send a plain HTML email
async function examplePlainEmail() {
  console.log('\n🔹 Example 1: Plain Email');
  
  const htmlContent = `
    <h2>¡Nuevo proyecto disponible!</h2>
    <p>Hola inversor,</p>
    <p>Tenemos un nuevo proyecto inmobiliario disponible en Madrid con una rentabilidad esperada del 12%.</p>
    <a href="https://inmotech.com/proyecto/madrid-centro">Ver Proyecto</a>
  `;
  
  const result = await sendPlainEmail(
    'investor@example.com',
    '🏠 Nuevo proyecto disponible - Madrid Centro',
    htmlContent
  );
  
  console.log('Result:', result);
}

// Example 2: Send dynamic email with variables
async function exampleDynamicEmail() {
  console.log('\n🔹 Example 2: Dynamic Email');
  
  const template = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>¡Hola {{firstName}}!</h2>
      <p>Tu inversión de <strong>€{{amount}}</strong> en el proyecto <strong>{{projectName}}</strong> ha sido procesada.</p>
      
      <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Detalles de la inversión:</h3>
        <ul>
          <li><strong>Proyecto:</strong> {{projectName}}</li>
          <li><strong>Cantidad:</strong> €{{amount}}</li>
          <li><strong>Rentabilidad esperada:</strong> {{expectedROI}}%</li>
          <li><strong>Duración:</strong> {{duration}} meses</li>
        </ul>
      </div>
      
      <p>Puedes seguir el progreso de tu inversión en tu dashboard:</p>
      <a href="{{dashboardLink}}" style="background: #ED4F01; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Ver Dashboard
      </a>
    </div>
  `;
  
  const variables = {
    firstName: 'María',
    projectName: 'Residencial Barcelona Norte',
    amount: '2,500',
    expectedROI: '10.5',
    duration: '18',
    dashboardLink: 'https://inmotech.com/dashboard'
  };
  
  const result = await sendDynamicEmail(
    'maria@example.com',
    '✅ Inversión confirmada en {{projectName}}',
    template,
    variables
  );
  
  console.log('Result:', result);
}

// Example 3: Send SES template email
async function exampleTemplateEmail() {
  console.log('\n🔹 Example 3: SES Template Email');
  
  // This assumes you have created a template named 'investment-update' in AWS SES
  const templateData = {
    firstName: 'Carlos',
    projectName: 'Valencia Coastal Resort',
    updateType: 'Milestone Completed',
    progressPercentage: '75',
    nextMilestone: 'Construction Completion',
    expectedDate: 'March 2024',
    dashboardUrl: 'https://inmotech.com/dashboard/project/valencia-coastal'
  };
  
  const result = await sendTemplateEmail(
    'carlos@example.com',
    'investment-update',
    templateData
  );
  
  console.log('Result:', result);
}

// Example 4: Send welcome email
async function exampleWelcomeEmail() {
  console.log('\n🔹 Example 4: Welcome Email');
  
  const result = await sendWelcomeEmail(
    'newuser@example.com',
    'Ana',
    'https://inmotech.com/verify-email?token=abc123'
  );
  
  console.log('Result:', result);
}

// Example 5: Send password reset email
async function examplePasswordResetEmail() {
  console.log('\n🔹 Example 5: Password Reset Email');
  
  const result = await sendPasswordResetEmail(
    'user@example.com',
    'Roberto',
    'https://inmotech.com/reset-password?token=xyz789'
  );
  
  console.log('Result:', result);
}

// Example 6: Send KYC approval email (requires SES template)
async function exampleKYCApprovalEmail() {
  console.log('\n🔹 Example 6: KYC Approval Email');
  
  const templateData = {
    firstName: 'Laura',
    approvalDate: '2024-01-15',
    investmentLimit: '50,000',
    nextSteps: [
      'Explorar proyectos disponibles',
      'Configurar métodos de pago',
      'Realizar primera inversión'
    ],
    dashboardUrl: 'https://inmotech.com/dashboard',
    supportEmail: 'soporte@inmotech.com'
  };
  
  const result = await sendKYCApprovalEmail(
    'laura@example.com',
    templateData
  );
  
  console.log('Result:', result);
}

// Example 7: Send investment confirmation
async function exampleInvestmentConfirmation() {
  console.log('\n🔹 Example 7: Investment Confirmation');
  
  const result = await sendInvestmentConfirmationEmail(
    'investor@example.com',
    'David',
    'Madrid Luxury Apartments',
    5000
  );
  
  console.log('Result:', result);
}

// Example 8: Bulk email sending with error handling
async function exampleBulkEmails() {
  console.log('\n🔹 Example 8: Bulk Email Sending');
  
  const investors = [
    { email: 'investor1@example.com', firstName: 'Pedro' },
    { email: 'investor2@example.com', firstName: 'Carmen' },
    { email: 'investor3@example.com', firstName: 'José' }
  ];
  
  const template = `
    <h2>🏗️ Actualización del Proyecto</h2>
    <p>Hola {{firstName}},</p>
    <p>Te informamos que el proyecto "Residencial Madrid Norte" ha alcanzado el 80% de finalización.</p>
    <p>Los primeros pagos de rentabilidad comenzarán el próximo mes.</p>
  `;
  
  console.log('Sending bulk emails...');
  
  for (const investor of investors) {
    try {
      const result = await sendDynamicEmail(
        investor.email,
        'Actualización del Proyecto - Residencial Madrid Norte',
        template,
        { firstName: investor.firstName }
      );
      
      console.log(`✅ Email sent to ${investor.email}:`, result.success);
      
      // Add delay to respect SES rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${investor.email}:`, error);
    }
  }
}

// Run examples function
async function runExamples() {
  console.log('🚀 InmoTech SES Client Examples');
  console.log('=====================================');
  
  try {
    await examplePlainEmail();
    await exampleDynamicEmail();
    await exampleTemplateEmail();
    await exampleWelcomeEmail();
    await examplePasswordResetEmail();
    await exampleKYCApprovalEmail();
    await exampleInvestmentConfirmation();
    await exampleBulkEmails();
    
    console.log('\n✅ All examples completed!');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

export {
  examplePlainEmail,
  exampleDynamicEmail,
  exampleTemplateEmail,
  exampleWelcomeEmail,
  examplePasswordResetEmail,
  exampleKYCApprovalEmail,
  exampleInvestmentConfirmation,
  exampleBulkEmails
};