let syncTimeout = null;

export const syncMiddleware = store => next => action => {
  const result = next(action);

  // Filter actions to only sync on state changes, ignore UI/local only actions
  if (action.type.startsWith('user/') || action.type.startsWith('tasks/') || action.type.startsWith('rewards/')) {
    // Exclude sync, auth, persist, and logout to prevent infinite loops or stale overwrites
    if (
      action.type === 'user/setAuth' ||
      action.type === 'user/logout' ||
      action.type === 'user/syncUserState' ||
      action.type === 'tasks/syncTasksState' ||
      action.type === 'rewards/syncRewardsState' ||
      action.type.startsWith('persist/')
    ) {
      return result;
    }

    const state = store.getState();
    const token = state.user.token;

    if (token) {
      // Debounce the sync call by 2 seconds
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      
      syncTimeout = setTimeout(() => {
        // Collect state to sync
        const payload = {
          level: state.user.level,
          exp: state.user.exp,
          health: state.user.health,
          coins: state.user.coins,
          augmentations: state.user.augmentations,
          hasCompletedProtocol: state.user.hasCompletedProtocol,
          meltdownTask: state.user.meltdownTask,
          nextAudit: state.user.nextAudit,
          habits: state.tasks.habits,
          dailies: state.tasks.dailies,
          todos: state.tasks.todos,
          history: state.tasks.history,
          lastResetDate: state.tasks.lastResetDate,
          localRewards: state.rewards.items
        };

        fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Cloud sync failed', err));
      }, 2000);
    }
  }

  return result;
};
