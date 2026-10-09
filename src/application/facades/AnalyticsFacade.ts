import type { IAnalyticsService, DashboardKPIs } from '../../domain/interfaces';

export class AnalyticsFacade {
  constructor(private readonly analyticsService: IAnalyticsService) {}

  async getDashboardMetrics(startDate: Date, endDate: Date): Promise<DashboardKPIs> {
    if (startDate > endDate) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha final');
    }
    return await this.analyticsService.getKPIsByDateRange(startDate, endDate);
  }
}
