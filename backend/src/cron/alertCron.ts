import cron from 'node-cron';
import {
  removeExpiredMedicines,
  checkLowStockThreshold,
} from '../services/alertService';
import { logger } from '../utils/logger';

/**
 * Schedule both alert jobs to run daily at 00:00 (server time).
 */
export function startAlertCronJobs() {
  // At midnight every day
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily expiry removal job');
    await removeExpiredMedicines();

    logger.info('Running daily low-stock alert job');
    await checkLowStockThreshold();
  });
}
