import { prisma } from '@repo/database';
import { NotificationType } from '@repo/database';

export class NotificationService {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    return prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  }

  async list(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return {
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async deleteOld(userId: string, olderThanDays = 30) {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    return prisma.notification.deleteMany({
      where: { userId, createdAt: { lt: cutoff }, isRead: true },
    });
  }
}

export const notificationService = new NotificationService();
