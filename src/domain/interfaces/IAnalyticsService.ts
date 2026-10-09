export interface DashboardKPIs {
  totalSales: number;
  averageTicket: number;
  totalOrders: number;
  topSellingProducts: Array<{ productId: string; name: string; quantity: number }>;
}

export interface IAnalyticsService {
  getKPIsByDateRange(startDate: Date, endDate: Date): Promise<DashboardKPIs>;
}
