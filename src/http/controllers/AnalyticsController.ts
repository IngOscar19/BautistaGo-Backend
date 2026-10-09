import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../infrastructure/db/prisma.client';

const querySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const AnalyticsController = {
  async getMetrics(req: Request, res: Response) {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);

    const [salesAgg, totalOrders, topItems] = await prisma.$transaction([
      prisma.order.aggregate({
        _sum: { total: true },
        _avg: { total: true },
        where: {
          status: 'DELIVERED',
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.order.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      totalSales: Number(salesAgg._sum.total ?? 0),
      averageTicket: Number(Number(salesAgg._avg.total ?? 0).toFixed(2)),
      totalOrders,
      topItems,
    });
  },
};
