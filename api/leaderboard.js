import dbConnect from './db.js';
import { User } from './models.js';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Get top 50 users sorted by Level (desc), then EXP (desc) as tiebreaker
    const users = await User.find({})
      .select('username level exp role')
      .sort({ level: -1, exp: -1 })
      .limit(50);

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
