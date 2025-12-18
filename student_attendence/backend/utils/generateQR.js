import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateSessionQR = async (sessionData) => {
  try {
    // Generate unique QR code string
    const qrCodeString = uuidv4();
    
    // Create QR code data
    const qrData = {
      qrCodeString: qrCodeString,
      teacherId: sessionData.teacherId,
      subject: sessionData.subject,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      timestamp: new Date().toISOString()
    };

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400
    });

    return {
      qrCode: qrCodeString,
      qrData: JSON.stringify(qrData),
      qrImage: qrCodeDataUrl
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

export const verifyQRCode = (qrData) => {
  try {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    
    // Extract qrCodeString
    const qrCodeString = data.qrCodeString;
    
    if (!qrCodeString) {
      return { valid: false, reason: 'QR code string not found' };
    }

    // Check if session is still valid (endTime)
    if (data.endTime && new Date(data.endTime) < new Date()) {
      return { valid: false, reason: 'Session expired' };
    }

    return {
      valid: true,
      data: {
        qrCodeString: qrCodeString,
        subject: data.subject,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime
      }
    };
  } catch (error) {
    return {
      valid: false,
      reason: `QR code verification failed: ${error.message}`
    };
  }
};

