import dbConnect from './db.js';
import { User } from './models.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyber_key_12345';

// Helper to authenticate request
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  await dbConnect();

  const userToken = authenticate(req);
  if (!userToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { method } = req;

  if (method === 'GET') {
    try {
      const user = await User.findById(userToken.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      return res.status(200).json({ 
        success: true, 
        data: {
          level: user.level,
          exp: user.exp,
          health: user.health,
          coins: user.coins,
          augmentations: user.augmentations,
          hasCompletedProtocol: user.hasCompletedProtocol,
          meltdownTask: user.meltdownTask,
          nextAudit: user.nextAudit,
          habits: user.habits,
          dailies: user.dailies,
          todos: user.todos,
          history: user.history,
          lastResetDate: user.lastResetDate,
          localRewards: user.localRewards
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  if (method === 'POST') {
    try {
      const stateUpdate = req.body;
      
      // Update the user document directly with the provided state
      // (This is a simplified overwrite for a personal profile)
      const user = await User.findByIdAndUpdate(userToken.id, { $set: stateUpdate }, { new: true });
      
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      return res.status(200).json({ success: true, message: 'Sync complete' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
