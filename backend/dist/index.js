"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const data_source_1 = require("./data-source");
require("dotenv/config");
async function startServer() {
    try {
        console.log(process.env.DATABASE_URL);
        await data_source_1.AppDataSource.initialize();
        // eslint-disable-next-line no-console
        console.log('Data Source has been initialized.');
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error during Data Source initialization:', err);
        process.exit(1);
    }
    const port = process.env.PORT || 4000;
    app_1.app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on port ${port}`);
    });
}
// Only start the DB and server if this file is run directly
if (require.main === module) {
    startServer();
}
