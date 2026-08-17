import { prisma } from '@repo/database';

export class GamificationService {
  /**
   * Seed default challenges and badges if they do not exist
   */
  public static async seedGamificationConfig() {
    const defaultBadges = [
      { name: 'First Blood', description: 'Logged your first movie diary entry', icon: '🍿' },
      { name: 'Cinephile', description: 'Logged 5 movies in your diary', icon: '🎬' },
      { name: 'Sound Expert', description: 'Submitted a review rating sound quality', icon: '🔊' },
      { name: 'Party Animal', description: 'Hosted or participated in 2 Watch Parties', icon: '🎉' },
      { name: 'Level 5 Legend', description: 'Reached Level 5 on CineVerse', icon: '🏆' },
    ];

    const defaultChallenges = [
      { title: 'First Log', description: 'Log your first movie in your diary', xpReward: 50, targetCount: 1, type: 'WATCH_MOVIES' },
      { title: 'Movie Buff', description: 'Log 5 movies in your diary', xpReward: 200, targetCount: 5, type: 'WATCH_MOVIES' },
      { title: 'Critic', description: 'Write 3 reviews with detailed cinema ratings', xpReward: 150, targetCount: 3, type: 'WRITE_REVIEWS' },
      { title: 'Socializer', description: 'Host or join 2 Watch Parties', xpReward: 100, targetCount: 2, type: 'WATCH_PARTY' },
    ];

    // Seed Badges
    for (const b of defaultBadges) {
      await prisma.badge.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      });
    }

    // Seed Challenges
    for (const c of defaultChallenges) {
      const existing = await prisma.challenge.findFirst({
        where: { title: c.title, type: c.type },
      });
      if (!existing) {
        await prisma.challenge.create({
          data: c,
        });
      }
    }
  }

  /**
   * Add XP to a user, checking for level ups and level-based badge unlocks
   */
  public static async addXp(userId: string, xpAmount: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error('User not found');

    let currentXp = user.xp + xpAmount;
    let currentLevel = user.level;
    let levelUps = 0;

    // Level up calculation: XP needed for next level = level * 100
    while (currentXp >= currentLevel * 100) {
      currentXp -= currentLevel * 100;
      currentLevel += 1;
      levelUps += 1;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: currentXp,
        level: currentLevel,
      },
    });

    // Check for level-based badge rewards
    if (currentLevel >= 5) {
      await this.awardBadge(userId, 'Level 5 Legend');
    }

    return {
      user: updatedUser,
      leveledUp: levelUps > 0,
      xpGained: xpAmount,
      newLevel: currentLevel,
    };
  }

  /**
   * Award a badge to a user if they do not already have it
   */
  public static async awardBadge(userId: string, badgeName: string) {
    const badge = await prisma.badge.findUnique({
      where: { name: badgeName },
    });

    if (!badge) return null;

    const existingUserBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (existingUserBadge) return null; // already earned

    return await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
      include: {
        badge: true,
      },
    });
  }

  /**
   * Increment progress for active challenges of a specific type
   */
  public static async incrementProgress(userId: string, type: 'WATCH_MOVIES' | 'WRITE_REVIEWS' | 'WATCH_PARTY', amount = 1) {
    // Ensure gamification configs exist
    await this.seedGamificationConfig();

    const activeChallenges = await prisma.challenge.findMany({
      where: { type },
    });

    const results = [];

    for (const challenge of activeChallenges) {
      // Find or create progress record
      const progress = await prisma.userChallengeProgress.upsert({
        where: {
          userId_challengeId: {
            userId,
            challengeId: challenge.id,
          },
        },
        create: {
          userId,
          challengeId: challenge.id,
          currentCount: amount,
          completed: amount >= challenge.targetCount,
          completedAt: amount >= challenge.targetCount ? new Date() : null,
        },
        update: {},
      });

      // If already completed in db, skip
      if (progress.completed && progress.currentCount >= challenge.targetCount) {
        continue;
      }

      let newCount = progress.currentCount + amount;
      if (progress.currentCount === 0 && amount > 1) {
        // If we upserted and created with amount, do not double increment
        newCount = amount;
      }
      const isCompletedNow = newCount >= challenge.targetCount;

      const updatedProgress = await prisma.userChallengeProgress.update({
        where: { id: progress.id },
        data: {
          currentCount: Math.min(newCount, challenge.targetCount),
          completed: isCompletedNow,
          completedAt: isCompletedNow ? new Date() : null,
        },
      });

      if (isCompletedNow && !progress.completed) {
        // Award XP reward
        await this.addXp(userId, challenge.xpReward);

        // Award badge based on completed challenge type
        if (challenge.type === 'WATCH_MOVIES' && challenge.targetCount === 1) {
          await this.awardBadge(userId, 'First Blood');
        } else if (challenge.type === 'WATCH_MOVIES' && challenge.targetCount === 5) {
          await this.awardBadge(userId, 'Cinephile');
        } else if (challenge.type === 'WATCH_PARTY' && challenge.targetCount === 2) {
          await this.awardBadge(userId, 'Party Animal');
        }
      }

      results.push(updatedProgress);
    }

    return results;
  }

  /**
   * Get user level, XP, badge collection and challenge progress
   */
  public static async getUserStats(userId: string) {
    // Seed default configuration if empty
    await this.seedGamificationConfig();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        level: true,
        badges: {
          include: {
            badge: true,
          },
        },
        challengeProgress: {
          include: {
            challenge: true,
          },
        },
      },
    });

    if (!user) throw new Error('User not found');

    // Get all challenges to list incomplete ones as well
    const allChallenges = await prisma.challenge.findMany();
    const challengeStats = allChallenges.map((challenge) => {
      const userProgress = user.challengeProgress.find(
        (cp) => cp.challengeId === challenge.id
      );

      return {
        challengeId: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        xpReward: challenge.xpReward,
        targetCount: challenge.targetCount,
        currentCount: userProgress ? userProgress.currentCount : 0,
        completed: userProgress ? userProgress.completed : false,
        completedAt: userProgress ? userProgress.completedAt : null,
      };
    });

    return {
      id: user.id,
      name: user.name,
      xp: user.xp,
      level: user.level,
      xpNeeded: user.level * 100,
      badges: user.badges.map((ub) => ub.badge),
      challenges: challengeStats,
    };
  }

  /**
   * Get global or friend-filtered XP leaderboard
   */
  public static async getLeaderboard(userId: string, scope: 'global' | 'friends' = 'global') {
    if (scope === 'friends') {
      // Find following IDs
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      // Include the user themselves in friend leaderboard
      followingIds.push(userId);

      const users = await prisma.user.findMany({
        where: {
          id: { in: followingIds },
        },
        select: {
          id: true,
          name: true,
          level: true,
          xp: true,
        },
        orderBy: [
          { level: 'desc' },
          { xp: 'desc' },
        ],
      });

      return users;
    } else {
      // Global leaderboard
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          level: true,
          xp: true,
        },
        orderBy: [
          { level: 'desc' },
          { xp: 'desc' },
        ],
        take: 50,
      });
    }
  }
}
