import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  level: 1,
  exp: 0,
  maxExp: 100,
  health: 50,
  maxHealth: 50,
  coins: 0,
  purchases: [],
  hasCompletedProtocol: false,
  protocolFocus: null,
  augmentPoints: 0,
  augmentations: {},
  meltdownTask: null,
  nextAudit: null,
  unlockedTitles: ['Operator'],
  activeTitle: 'Operator',
  
  doubleXpEnabled: false,
  
  // Auth
  token: null,
  username: null,
  role: 'user'
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setDoubleXp: (state, action) => {
      state.doubleXpEnabled = action.payload;
    },
    gainExp: (state, action) => {
      let { amount } = action.payload;
      
      // Global Admin Event: Double XP
      if (state.doubleXpEnabled) {
        amount *= 2;
      }
      
      state.exp += amount;

      // Handle Level Up
      while (state.exp >= state.maxExp) {
        state.exp -= state.maxExp;
        state.level += 1;
        state.maxExp = Math.floor(state.level * 100 * 1.2); // Scaling difficulty
        
        // Full heal on level up
        state.health = state.maxHealth;

        // Grant 1 Augment Point per level up (BUG-5 fix)
        state.augmentPoints += 1;
      }
    },
    heal: (state, action) => {
      const { amount } = action.payload;
      state.health = Math.min(state.maxHealth, state.health + amount);
    },
    validateStats: (state) => {
      if (state.health > state.maxHealth) {
        state.health = state.maxHealth;
      }
    },
    takeDamage: (state, action) => {
      const { amount } = action.payload;
      
      // Calculate damage reduction from Titanium Plating (10% per level, max 90%)
      const titaniumLevel = state.augmentations?.titanium || 0;
      const reductionMultiplier = Math.max(0.1, 1 - (titaniumLevel * 0.10));
      const finalDamage = Math.ceil(amount * reductionMultiplier);

      state.health = Math.max(0, state.health - finalDamage);
      
      // Death penalty
      if (state.health === 0) {
        state.level = Math.max(1, state.level - 1);
        state.exp = 0;
        state.maxExp = Math.floor(state.level * 100 * 1.2);
        state.health = state.maxHealth;
        state.coins = Math.floor(state.coins / 2); // Lose half coins on death
      }
    },
    earnCoins: (state, action) => {
      state.coins += action.payload.amount;
    },
    spendCoins: (state, action) => {
      const { amount, item } = action.payload;
      if (state.coins >= amount) {
        state.coins -= amount;
        if (item) {
          if (!state.purchases) state.purchases = [];
          state.purchases.push({
            ...item,
            purchasedAt: new Date().toISOString()
          });
        }
      }
    },
    completeProtocol: (state, action) => {
      state.hasCompletedProtocol = true;
      state.protocolFocus = action.payload.focus;
    },
    upgradeAugmentation: (state, action) => {
      const { type } = action.payload; // 'financial', 'titanium', 'neural'
      if (state.augmentPoints > 0) {
        state.augmentPoints -= 1;
        state.augmentations[type] += 1;
      }
    },
    startMeltdown: (state, action) => {
      state.meltdownTask = action.payload;
    },
    endMeltdown: (state) => {
      state.meltdownTask = null;
    },
    unlockTitle: (state, action) => {
      if (!state.unlockedTitles) state.unlockedTitles = ['Operator'];
      if (!state.unlockedTitles.includes(action.payload)) {
        state.unlockedTitles.push(action.payload);
      }
    },
    setActiveTitle: (state, action) => {
      if (state.unlockedTitles?.includes(action.payload)) {
        state.activeTitle = action.payload;
      }
    },
    runAudit: (state) => {
      // System audit deals damage. Titanium plating reduces it.
      const damage = 25;
      const titaniumLevel = state.augmentations?.titanium || 0;
      const reductionMultiplier = Math.max(0.1, 1 - (titaniumLevel * 0.10));
      const finalDamage = Math.ceil(damage * reductionMultiplier);

      state.health = Math.max(0, state.health - finalDamage);

      // Death penalty check (BUG-4 fix)
      if (state.health === 0) {
        state.level = Math.max(1, state.level - 1);
        state.exp = 0;
        state.maxExp = Math.floor(state.level * 100 * 1.2);
        state.health = state.maxHealth;
        state.coins = Math.floor(state.coins / 2);
      }

      state.nextAudit = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    },
    grantAugmentPoints: (state, action) => {
      state.augmentPoints += action.payload;
    },
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.role = action.payload.role;
      // BUG-2 fix: use ?? to preserve zero values
      state.level = action.payload.level ?? state.level;
      state.exp = action.payload.exp ?? state.exp;
      state.health = Math.min(action.payload.health ?? state.health, state.maxHealth);
      state.coins = action.payload.coins ?? state.coins;
      if (action.payload.augmentations) {
        state.augmentations = action.payload.augmentations;
      }
      if (action.payload.hasCompletedProtocol !== undefined) {
        state.hasCompletedProtocol = action.payload.hasCompletedProtocol;
      }
      if (action.payload.unlockedTitles) state.unlockedTitles = action.payload.unlockedTitles;
      if (action.payload.activeTitle) state.activeTitle = action.payload.activeTitle;
      if (action.payload.purchases) state.purchases = action.payload.purchases;
      if (action.payload.hasCompletedProtocol !== undefined) state.hasCompletedProtocol = action.payload.hasCompletedProtocol;
    },
    logout: () => {
      // BUG-12 fix: full state reset on logout to prevent data leaking between accounts
      return { ...initialState };
    },
    syncUserState: (state, action) => {
      const data = action.payload;
      // BUG-1 fix: use ?? to preserve zero values (0 coins, 0 exp, 0 health)
      state.level = data.level ?? state.level;
      state.exp = data.exp ?? state.exp;
      state.health = Math.min(data.health ?? state.health, state.maxHealth);
      state.coins = data.coins ?? state.coins;
      if (data.augmentations) state.augmentations = data.augmentations;
      if (data.hasCompletedProtocol !== undefined) state.hasCompletedProtocol = data.hasCompletedProtocol;
      if (data.meltdownTask !== undefined) state.meltdownTask = data.meltdownTask;
      if (data.nextAudit !== undefined) state.nextAudit = data.nextAudit;
      if (data.unlockedTitles) state.unlockedTitles = data.unlockedTitles;
      if (data.activeTitle) state.activeTitle = data.activeTitle;
      if (data.purchases) state.purchases = data.purchases;
    }
  },
});

export const { 
  gainExp, heal, validateStats, takeDamage, earnCoins, spendCoins, completeProtocol, 
  upgradeAugmentation, startMeltdown, endMeltdown, runAudit, 
  setAuth, logout, syncUserState, unlockTitle, setActiveTitle, grantAugmentPoints, setDoubleXp
} = userSlice.actions;
export default userSlice.reducer;
