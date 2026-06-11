import dbConnect from './db.js';
import { ShopItem, User } from './models.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyber_key_12345';

// Helper to verify admin token
async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') return true;
    
    // Fallback: check DB if role was updated
    const user = await User.findById(decoded.id);
    return user && user.role === 'admin';
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  if (method === 'GET') {
    try {
      const items = await ShopItem.find({}).sort({ cost: 1 });
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (method === 'POST') {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { title, cost, icon } = req.body;
    if (!title || !cost) {
      return res.status(400).json({ success: false, message: 'Title and cost required' });
    }

    try {
      const newItem = await ShopItem.create({ title, cost, icon: icon || 'star' });
      return res.status(201).json({ success: true, data: newItem });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (method === 'DELETE') {
    const isAdmin = await verifyAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }

    const { id } = req.body;
    try {
      await ShopItem.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
