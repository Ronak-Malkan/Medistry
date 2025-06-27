import { app } from './app';
import { startAlertCronJobs } from './cron/alertCron';
import { AppDataSource } from './data-source';
import 'dotenv/config';

async function startServer() {
  try {
    console.log(process.env.DATABASE_URL);
    await AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Data Source has been initialized.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error during Data Source initialization:', err);
    process.exit(1);
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
  // Kick off scheduled alert jobs
  startAlertCronJobs();
}

// Only start the DB and server if this file is run directly
if (require.main === module) {
  startServer();
}
