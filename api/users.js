import dbConnect from './db.js';
import { User } from './models.js';
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

  const adminToken = authenticateAdmin(req);
  if (!adminToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin Access Required.' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch all users, but exclude sensitive arrays to save bandwidth
      const users = await User.find({})
        .select('username role level exp health coins lastResetDate createdAt')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
