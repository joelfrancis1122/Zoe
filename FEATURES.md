# Zoë OS — Full Feature Inventory

## 📋 Current System Features

### 🎮 Core Gamification System
| Feature | Description | Status |
|---------|-------------|--------|
| **EXP & Leveling** | Earn EXP from tasks, level up with a scaling difficulty curve. | Active |
| **Health System** | Take damage from missed dailies or audits. Death halves coins and resets level. | Active |
| **Coin Economy** | Earn credits from completing tasks to spend in the Shop or Black Market. | Active |
| **Habits / Dailies / To-Dos** | 3-column task management with drag & drop mechanics. | Active |
| **Corrupted Tasks (Bosses)** | 10% chance to spawn timed boss tasks worth 3x EXP. | Active |
| **Habit Cooldowns** | 2-hour cooldown between repeatable habit completions. | Active |
| **Daily Reset** | Dailies automatically reset to unchecked at midnight. | Active |
| **Difficulty Tiers** | Trivial, Easy, Medium, Hard with scaling rewards and color-coding. | Active |

### 🛒 Economy & Progression
| Feature | Description | Status |
|---------|-------------|--------|
| **Global Reward Shop** | Admin-managed global shop items stored in MongoDB. | Active |
| **Black Market** | Gamble 200 credits for massive EXP, severe damage, or a dud. | Active |
| **Cybernetic Augmentations** | Skill Tree: Upgrade Financial, Titanium Plating, or Neural Overclocking using Augment Points earned from leveling up. | Active |
| **Purchase History** | Track all acquired shop items in the Profile view. | Active |

### 🏛️ Social & Admin
| Feature | Description | Status |
|---------|-------------|--------|
| **Global Leaderboard** | Real-time ranking of top 50 users globally, sorted by Level and EXP. | Active |
| **Admin Panel** | Dedicated operator dashboard to deploy global rewards and view user stats. | Active |
| **Global Audit** | Admins can toggle system-wide audits that deal damage to all operators. | Active |

### 🔐 Architecture & Cloud
| Feature | Description | Status |
|---------|-------------|--------|
| **JWT Authentication** | Secure Login/Registration with bcrypt password hashing. | Active |
| **Cloud Sync Engine** | Redux state automatically debounces and syncs to MongoDB in the background. | Active |
| **Local Persistence** | `redux-persist` saves state to `localStorage` for offline fallback. | Active |

### 🎨 UI/UX & Immersion
| Feature | Description | Status |
|---------|-------------|--------|
| **3D Spline Robot** | Interactive 3D robotic assistant in the background. | Active |
| **System Meltdown** | Hardcore Pomodoro mode that instantly deals damage if you switch tabs. | Active |
| **Performance Analytics** | Visual charts plotting Weekly, Monthly, and Yearly EXP gains. | Active |
| **Onboarding Protocol** | Cinematic 3-step terminal boot sequence for new user registration. | Active |
| **Synthesized Audio** | Web Audio API sound effects for clicks, level-ups, damage, and purchases. | Active |
| **Player HUD** | Top-bar dashboard showing Level ring, EXP bar, Health bar, and Coins. | Active |
| **Personal Records** | Track longest streak, highest EXP yield, and most productive days. | Active |

---

## 🚀 Proposed New Features (Roadmap)

1. **Toast Notification System**
   - *Concept:* Global, cyberpunk-styled toast notifications in the corner of the screen for level-ups, purchases, damage taken, and sync errors (replacing silent console logs).

2. **Daily Login Rewards**
   - *Concept:* Consecutive login streaks grant bonus EXP/coins (e.g., Day 1: 10 coins, Day 7: 100 coins + 1 Augment Point).

3. **Streak Freeze (Shop Consumable)**
   - *Concept:* A purchasable item that protects your daily task streak from resetting for 1 day if you miss logging in.

4. **Inventory System (The Vault)**
   - *Concept:* View purchased rewards not just as text, but as interactive, collectible cards with 3D tilt effects in your profile.

5. **User Profile Avatars**
   - *Concept:* Allow operators to select from a set of cybernetic avatars that display next to their name on the Global Leaderboard.

6. **System Theme Toggle (Day/Night)**
   - *Concept:* The system already has a beautiful dark mode; add an equally premium "Light/Day" mode toggle.

7. **Data Export**
   - *Concept:* Let users download their entire task history and stats as a JSON/CSV file for personal tracking outside the app.

8. **Admin Operations**
   - *Concept:* Add the ability for administrators to directly delete or ban rogue operators from the database via the Admin Panel.

9. **Cybernetic Companions (Drones)**
   - *Concept:* Unlock a pet drone that sits on the UI. Feeding it coins grants temporary EXP multipliers or buffs.

10. **Global Boss Raids**
    - *Concept:* A server-wide "Corrupted Task" event. All players contribute by completing their own dailies. If the boss is defeated before the timer runs out, everyone gets rare loot.

11. **Achievements & Titles**
    - *Concept:* Earning specific milestones (e.g. "100 Tasks Completed", "Survived 5 Audits") unlocks Titles that display next to your username on the leaderboard.

12. **Dark Web Marketplace**
    - *Concept:* A secondary shop that only opens on weekends. Items are heavily discounted but have a 25% chance of triggering an immediate system audit.

13. **Skill Tree: Active Overrides**
    - *Concept:* Expand the skill tree with Active Abilities. E.g., "Time Warp" (instantly completes a task on cooldown) or "EMP" (cancels an incoming audit).

14. **Bounty Board**
    - *Concept:* Weekly, randomized high-difficulty quests (e.g., "Complete 5 hard tasks before noon for 3 days") for massive payouts.

15. **Focus Mode: Deep Dive**
    - *Concept:* Spotify / Lofi Girl API integration during "Meltdown Mode" to provide cyberpunk ambience directly within the UI timer.

16. **Faction Wars**
    - *Concept:* Players choose a faction (e.g. Netrunners, Chrome Legion). Faction vs Faction weekly leaderboard wars for exclusive rewards.

17. **Data Heists (Mini-games)**
    - *Concept:* Spend coins to enter a simple terminal hacking mini-game to steal EXP or rare shop items.
