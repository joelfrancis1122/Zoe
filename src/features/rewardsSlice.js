import { createSlice } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  items: [
    { id: '1', title: 'Watch a Movie', cost: 499, icon: 'film' },
    { id: '2', title: 'Play a Video Game (1hr)', cost: 399, icon: 'gamepad' },
    { id: '3', title: 'Spline: Upgrade Armor to Lvl 2', cost: 500, icon: 'shield' },
  ],
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    addReward: (state, action) => {
      const { title, cost } = action.payload;
      state.items.push({
        id: uuidv4(),
        title,
        cost: parseInt(cost) || 10,
        icon: 'star',
      });
    },
    removeReward: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    syncRewardsState: (state, action) => {
      const data = action.payload;
      if (data.items) state.items = data.items;
    }
  },
});

export const { addReward, removeReward, syncRewardsState } = rewardsSlice.actions;
export default rewardsSlice.reducer;
