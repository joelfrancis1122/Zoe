import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Game Stats
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 },
  health: { type: Number, default: 100 },
  coins: { type: Number, default: 0 },
  
  // Augmentations
  augmentations: {
    financial: { type: Number, default: 0 },
    titanium: { type: Number, default: 0 },
    neural: { type: Number, default: 0 }
  },

  hasCompletedProtocol: { type: Boolean, default: false },

  // Game State
  meltdownTask: { type: mongoose.Schema.Types.Mixed, default: null },
  nextAudit: { type: String, default: null },
  unlockedTitles: { type: [String], default: ['Operator'] },
  activeTitle: { type: String, default: 'Operator' },

  // Tasks Data
  habits: { type: [mongoose.Schema.Types.Mixed], default: [] },
  dailies: { type: [mongoose.Schema.Types.Mixed], default: [] },
  todos: { type: [mongoose.Schema.Types.Mixed], default: [] },
  history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  lastResetDate: { type: String, default: null },

  // Local Rewards (Inventory)
  localRewards: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);

const ShopItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true, default: 'star' },
  cost: { type: Number, required: true }
}, { timestamps: true });

export const ShopItem = mongoose.models.ShopItem || mongoose.model('ShopItem', ShopItemSchema);

const SystemSettingsSchema = new mongoose.Schema({
  auditEnabled: { type: Boolean, default: true },
  auditStartTime: { type: Number, default: () => Date.now() }
}, { timestamps: true });

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
