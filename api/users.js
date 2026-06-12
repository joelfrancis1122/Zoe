import dbConnect from './db.js';
import { User, SystemSettings } from './models.js';
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
  } catch {
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
      const users = await User.find({})
        .select('username role level exp health coins lastResetDate createdAt')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (req.method === 'PUT') {
    const { id, updates, inc } = req.body;
    try {
      const updateObj = {};
      if (updates) updateObj.$set = updates;
      if (inc) updateObj.$inc = inc;
      
      const user = await User.findByIdAndUpdate(id, updateObj, { new: true });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      // Trigger targeted real-time sync
      let settings = await SystemSettings.findOne({});
      if (settings) {
        settings.lastEvent = {
          type: 'gift',
          targetUsername: user.username,
          message: 'Admin transferred resources to your account.',
          timestamp: Date.now()
        };
        await settings.save();
      }

      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    try {
      if (id === adminToken.id) {
        return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
      }
      await User.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'User Terminated' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (req.method === 'POST') {
    const { action, idempotencyKey } = req.body;
    try {
      let settings = await SystemSettings.findOne({});
      if (!settings) settings = new SystemSettings({});

      if (action === 'airdrop') {
        if (idempotencyKey && settings.lastEvent && settings.lastEvent.idempotencyKey === idempotencyKey) {
          return res.status(200).json({ success: true, message: 'Airdrop Already Deployed (Idempotent)' });
        }
        await User.updateMany({}, { $inc: { coins: 1000, exp: 500 } });
        settings.lastEvent = { type: 'airdrop', message: 'Global Airdrop Deployed! +1000C +500XP', timestamp: Date.now(), idempotencyKey };
        await settings.save();
        return res.status(200).json({ success: true, message: 'Airdrop Deployed' });
      }
      
      if (action === 'heal') {
        if (idempotencyKey && settings.lastEvent && settings.lastEvent.idempotencyKey === idempotencyKey) {
          return res.status(200).json({ success: true, message: 'Mass Heal Already Deployed (Idempotent)' });
        }
        await User.updateMany({}, { $set: { health: 1000 } }); 
        settings.lastEvent = { type: 'heal', message: 'Mass Healing Activated! HP fully restored.', timestamp: Date.now(), idempotencyKey };
        await settings.save();
        return res.status(200).json({ success: true, message: 'Mass Healing Deployed' });
      }

      return res.status(400).json({ success: false, message: 'Unknown action' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
