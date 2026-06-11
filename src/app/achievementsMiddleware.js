import { unlockTitle } from '../features/userSlice';

// A lightweight middleware to track milestones and unlock titles
export const achievementsMiddleware = (store) => (next) => (action) => {
  const result = next(action); // let the action process first to get the updated state
  
  const state = store.getState();
  const user = state.user;
  const tasks = state.tasks;

  if (!user || !user.unlockedTitles) return result; // Safety check

  // Titles dictionary and their unlock conditions
  const achievements = [
    {
      title: 'Novice',
      condition: () => user.level >= 5
    },
    {
      title: 'Veteran',
      condition: () => user.level >= 20
    },
    {
      title: 'Executioner',
      condition: () => {
        if (!tasks || !tasks.history) return false;
        const totalTasks = tasks.history.reduce((sum, h) => sum + (h.tasksCompleted || 0), 0);
        return totalTasks >= 100;
      }
    },
    {
      title: 'High Roller',
      condition: () => {
        // High roller unlocked if they buy from Dark Web (which we dispatch with an item signature)
        return action.type === 'user/spendCoins' && action.payload?.item?.isDarkWeb;
      }
    }
  ];

  achievements.forEach(ach => {
    if (!user.unlockedTitles.includes(ach.title) && ach.condition()) {
      store.dispatch(unlockTitle(ach.title));
      // Dispatching inside middleware is safe here because it's a synchronous conditional 
      // check that will only trigger once per title.
    }
  });

  return result;
};
