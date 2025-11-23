import { FinancialMetricsService } from '@/infra/metrics/financial-metrics.service';

describe('FinancialMetricsService - more coverage', () => {
  it('recordTransaction should catch and log errors from prom-client', () => {
    const svc = new FinancialMetricsService();
    const incSpy = jest
      .spyOn((svc as any).financialTransactionsTotal, 'inc')
      .mockImplementation(() => {
        throw new Error('fail');
      });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    svc.recordTransaction('t', 's');

    expect(incSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
