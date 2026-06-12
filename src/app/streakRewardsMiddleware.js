import { earnCoins, gainExp } from '../features/userSlice';

// Helper to calculate the current global task streak based on history
export const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;
  
  const activeDates = new Set(history.filter(h => h.tasksCompleted > 0).map(h => h.date));
  let streakCount = 0;
  
  const d = new Date();
  const todayStr = d.toISOString().split('T')[0];
  
  if (activeDates.has(todayStr)) {
    streakCount++;
  }
  
  d.setDate(d.getDate() - 1);
  let checkStr = d.toISOString().split('T')[0];
  
  while (activeDates.has(checkStr)) {
    streakCount++;
    d.setDate(d.getDate() - 1);
    checkStr = d.toISOString().split('T')[0];
  }
  
  return streakCount;
};

export const streakRewardsMiddleware = (store) => (next) => (action) => {
  const stateBefore = store.getState();
  const historyBefore = stateBefore.tasks.history || [];
  const streakBefore = calculateStreak(historyBefore);

  const result = next(action);

  const stateAfter = store.getState();
  const historyAfter = stateAfter.tasks.history || [];
  const streakAfter = calculateStreak(historyAfter);

  // If the streak just increased!
  if (streakAfter > streakBefore) {
    
    // Check for streak milestones to give bonus rewards
    if (streakAfter % 7 === 0) {
      // Weekly milestone
      store.dispatch(earnCoins({ amount: 100 }));
      store.dispatch(gainExp({ amount: 500 }));
      console.log(`🔥 Streak Milestone! 7-Day multiplier applied.`);
    } else if (streakAfter % 3 === 0) {
      // 3-Day milestone
      store.dispatch(earnCoins({ amount: 25 }));
      store.dispatch(gainExp({ amount: 100 }));
      console.log(`🔥 Streak Milestone! 3-Day multiplier applied.`);
    } else if (streakAfter > 1) {
      // Standard daily streak continuation bonus
      store.dispatch(earnCoins({ amount: 5 }));
      store.dispatch(gainExp({ amount: 20 }));
    }
  }

  return result;
};
