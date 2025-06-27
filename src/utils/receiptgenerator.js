import puppeteer from "puppeteer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Resend } from "resend";
import { formatToDDMMYYYY } from "./DateConverter.js";
import s3Client from "./s3Client.js";
import fs from 'fs';
import path from 'path';

const resend = new Resend("re_ccuAZtfq_qWsMFDrWjLSwX1vt6qm5GFCp");

/**
 * Generates booking confirmation PDF and sends email with download link
 * @param {Object} bookingData - Booking information
 * @param {Object} templateData - HTML template and styling
 * @returns {Object} - Contains PDF URL and email status
 */
export const generateInvoice = async (bookingData, templateData) => {
  // Validate required fields
  if (!bookingData?.customerEmail || !bookingData?.bookingId) {
    throw new Error("Missing required booking information");
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    const mergedData = { ...bookingData, ...templateData };

    console.log(mergedData);
    

    // Load and encode logo
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (logoError) {
      console.warn('Logo not found, continuing without logo:', logoError.message);
    }

    // Generate HTML content with professional invoice design
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.4; 
            color: #333; 
            background: #f5f5f5;
          }
          
          .invoice-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          .header { 
            background-color: ${mergedData.headerColor || '#4a7043'}; 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }
          
          .header .tagline {
            font-size: 14px;
            font-weight: normal;
            opacity: 0.9;
            margin-bottom: 15px;
          }
          
          .header .contact-info {
            font-size: 12px;
            line-height: 1.6;
            opacity: 0.9;
          }
          
          .invoice-details {
            display: flex;
            justify-content: space-between;
            padding: 30px;
            border-bottom: 2px solid #e9ecef;
          }
          
          .bill-to, .invoice-info {
            flex: 1;
          }
          
          .bill-to h3, .invoice-info h3 {
            color: #4a7043;
            font-size: 16px;
            margin-bottom: 15px;
            border-bottom: 2px solid #4a7043;
            padding-bottom: 5px;
          }
          
          .bill-to p, .invoice-info p {
            margin-bottom: 5px;
            font-size: 14px;
          }
          
          .invoice-info {
            text-align: right;
            margin-left: 40px;
          }
          
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
          }
          
          .services-table thead {
            background-color: #4a7043;
            color: white;
          }
          
          .services-table th {
            padding: 15px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
          }
          
          .services-table th:last-child,
          .services-table td:last-child {
            text-align: right;
          }
          
          .services-table tbody tr {
            border-bottom: 1px solid #e9ecef;
          }
          
          .services-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .services-table td {
            padding: 15px;
            font-size: 14px;
          }
          
          .total-section {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: right;
          }
          
          .total-balance {
            font-size: 18px;
            font-weight: bold;
            color: #4a7043;
          }
          
          .terms-section {
            padding: 30px;
            border-top: 2px solid #e9ecef;
          }
          
          .terms-section h3 {
            color: #4a7043;
            margin-bottom: 20px;
            font-size: 16px;
            border-bottom: 2px solid #4a7043;
            padding-bottom: 5px;
          }
          
          .terms-list {
            list-style: none;
            counter-reset: term-counter;
          }
          
          .terms-list li {
            counter-increment: term-counter;
            margin-bottom: 10px;
            font-size: 13px;
            line-height: 1.6;
            padding-left: 25px;
            position: relative;
          }
          
          .terms-list li::before {
            content: counter(term-counter) ".";
            position: absolute;
            left: 0;
            font-weight: bold;
            color: #4a7043;
          }
          
          .signature-section {
            padding: 30px;
            text-align: right;
            border-top: 1px solid #e9ecef;
          }
          
          .signature-section h4 {
            color: #4a7043;
            margin-bottom: 40px;
            font-size: 14px;
          }
          
          .signature-line {
            border-bottom: 2px solid #333;
            width: 200px;
            margin-left: auto;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>YADUNANDANA ADVENTURES</h1>
            <div class="tagline">Adventure • Explore • Experience</div>
            <div class="contact-info">
              Street Number 622, Action Area IIB, Newtown, Kolkata, West Bengal 700161<br>
              Phone: 9330542026, 8777208318 | Email: info@yadunandanaadventures.com<br>
              Website: www.yadunandanaadventures.com | GSTIN: GSAAFHFU47401422
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="bill-to">
              <h3>Bill To</h3>
              <p><strong>${mergedData.customerName}</strong></p>
              <p>Email: ${mergedData.customerEmail}</p>
              <p>Booking Date: ${formatToDDMMYYYY(new Date())}</p>
            </div>
            
            <div class="invoice-info">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Date:</strong> ${formatToDDMMYYYY(new Date())}</p>
              <p><strong>Trekking Date:</strong> ${formatToDDMMYYYY(mergedData.tripDate)}</p>
              <p><strong>Invoice No.:</strong> ${mergedData.bookingId}</p>
            </div>
          </div>
          
          <table class="services-table">
            <thead>
              <tr>
                <th>S. No</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <strong>${mergedData.tripName}</strong><br>
                  <small>${mergedData.remark}</small>
                </td>
                <td>${mergedData.noOfTravelers}</td>
                <td>₹${(mergedData.totalAmount / mergedData.noOfTravelers).toLocaleString('en-IN')}</td>
                <td>₹${mergedData.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-balance">
              Total Balance: ₹${mergedData?.balance?.toLocaleString('en-IN')}
            </div>
          </div>
          
          <div class="terms-section">
            <h3>Terms & Conditions</h3>
            <ol class="terms-list">
              <li>Full amount will be refunded if cancellation made 30days before the trek start date.</li>
              <li>80 % amount will be refunded if cancellation made after 30th day and before on 20th day from the trek start date.</li>
              <li>50% amount will be refunded if cancellation made after 20th day and before on 15th day from the trek start date.</li>
              <li>If proof of payment is not available to show us, then no refund will be executed.</li>
            </ol>
          </div>
          
         
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' }
    });

    // Upload to S3
    const s3Key = `bookings/${mergedData.bookingId}/confirmation.pdf`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf"
    }));

    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Send email with PDF download link (no attachment)
    const emailData = {
      from: "Yadunandana <no-reply@t-rexinfotech.in>",
      to: mergedData.customerEmail,
      subject: `Your ${mergedData.tripName} Booking Confirmation - Invoice #${mergedData.bookingId}`,
      html: generateEmailContent(mergedData, pdfUrl)
    };

    const emailResponse = await resend.emails.send(emailData);
    console.log('Email sent:', emailResponse);

    return {
      success: true,
      pdfUrl,
      emailId: emailResponse.id,
      bookingId: mergedData.bookingId
    };

  } catch (error) {
    console.error('Error in booking confirmation:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

// Helper function to generate email HTML with PDF download link
function generateEmailContent(data, pdfUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #4a7043; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">YADUNANDANA ADVENTURES</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Your Adventure Booking is Confirmed!</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.customerName},</p>
          
          <p style="margin-bottom: 20px;">Thank you for choosing <strong>Yadunandana Adventures</strong> for your upcoming adventure. Your booking for <strong>${data.tripName}</strong> has been confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4a7043;">
            <h3 style="color: #4a7043; margin: 0 0 15px; font-size: 18px;">Booking Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">Invoice No:</td>
                <td style="padding: 8px 0;">${data.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Adventure:</td>
                <td style="padding: 8px 0;">${data.tripName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0;">${formatToDDMMYYYY(data.tripDate)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Participants:</td>
                <td style="padding: 8px 0;">${data.noOfTravelers} Person(s)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #4a7043;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #4a7043; font-size: 18px;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" 
               style="background: linear-gradient(135deg, #4a7043, #5a8053); 
                      color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 25px; 
                      font-weight: bold; display: inline-block; 
                      box-shadow: 0 4px 15px rgba(74, 112, 67, 0.3);
                      transition: all 0.3s ease;">
              📄 Download Your Invoice PDF
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong> Please download and save your invoice PDF for your records. You'll need it for the trek.</p>
          </div>
          
          <p style="margin: 20px 0;">We're excited to have you join us for this incredible adventure! Please review all the details in your invoice and don't hesitate to contact us if you have any questions.</p>
          
          <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 5px 0;"><strong>Contact Information:</strong></p>
            <p style="margin: 5px 0;">📞 Phone: ${data.contact}</p>
            <p style="margin: 5px 0;">✉️ Email: ${data.email}</p>
            <p style="margin: 5px 0;">📍 Address: ${data.address}</p>
          </div>
          
          <p style="margin: 25px 0 10px; font-weight: bold; color: #4a7043;">Get ready for an unforgettable adventure!</p>
          
          <p style="margin: 15px 0 0;">Best regards,<br>
          <strong>The Yadunandana Adventures Team</strong></p>
        </div>
      </div>
    </div>
  `;
}