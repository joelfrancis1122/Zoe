import dbConnect from './db.js';
import { SystemSettings } from './models.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyber_key_12345';

function authenticateAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      let settings = await SystemSettings.findOne({});
      if (!settings) {
        settings = await SystemSettings.create({ auditEnabled: true });
      }
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (req.method === 'POST') {
    const adminToken = authenticateAdmin(req);
    if (!adminToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin Access Required.' });
    }

    try {
      let settings = await SystemSettings.findOne({});
      if (!settings) {
        settings = new SystemSettings({});
      }
      
      if (req.body.auditEnabled !== undefined) {
        // If we are turning it ON, reset the anchor timer so it starts a fresh 60-min countdown
        if (req.body.auditEnabled === true && settings.auditEnabled === false) {
          settings.auditStartTime = Date.now();
        }
        settings.auditEnabled = req.body.auditEnabled;
      }
      
      await settings.save();
      
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
