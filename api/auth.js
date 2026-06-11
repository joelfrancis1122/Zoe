import dbConnect from './db.js';
import { User } from './models.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cyber_key_12345';

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { action, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    if (action === 'register') {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        username,
        password: hashedPassword,
        role: 'user'
      });

      const token = jwt.sign({ id: newUser._id, role: newUser.role, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          level: newUser.level,
          exp: newUser.exp,
          health: newUser.health,
          coins: newUser.coins,
          augmentations: newUser.augmentations,
          hasCompletedProtocol: newUser.hasCompletedProtocol
        }
      });
    }

    if (action === 'login') {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          level: user.level,
          exp: user.exp,
          health: user.health,
          coins: user.coins,
          augmentations: user.augmentations,
          hasCompletedProtocol: user.hasCompletedProtocol
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
