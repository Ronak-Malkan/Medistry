"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAlertCronJobs = startAlertCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const alertService_1 = require("../services/alertService");
const logger_1 = require("../utils/logger");
/**
 * Schedule both alert jobs to run daily at 00:00 (server time).
 */
function startAlertCronJobs() {
    // At midnight every day
    node_cron_1.default.schedule('0 0 * * *', async () => {
        logger_1.logger.info('Running daily expiry removal job');
        await (0, alertService_1.removeExpiredMedicines)();
        logger_1.logger.info('Running daily low-stock alert job');
        await (0, alertService_1.checkLowStockThreshold)();
    });
}
