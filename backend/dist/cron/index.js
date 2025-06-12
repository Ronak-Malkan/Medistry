"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCronJobs = registerCronJobs;
//import cron from 'node-cron';
const logger_1 = require("../utils/logger");
function registerCronJobs() {
    // TODO: schedule expiry cleanup, low-stock, etc.
    logger_1.logger.info('Cron jobs registration stub');
}
