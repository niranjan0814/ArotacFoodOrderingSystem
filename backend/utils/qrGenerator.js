import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export const generateQRCode = async (url, tableName) => {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

export const generateQRCodePDF = (qrCodeDataUrl, tableName) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm'
  });
  
  // Add QR code to PDF
  doc.addImage(qrCodeDataUrl, 'PNG', 50, 30, 100, 100);
  
  // Add table name below QR code
  doc.setFontSize(16);
  doc.text(`Table: ${tableName}`, 105, 140, { align: 'center' });
  
  return doc;
};