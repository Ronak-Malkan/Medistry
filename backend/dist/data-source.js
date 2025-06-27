"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Account_1 = require("./entities/Account");
const User_1 = require("./entities/User");
const Medicine_1 = require("./entities/Medicine");
const Content_1 = require("./entities/Content");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [Account_1.Account, User_1.User, Medicine_1.Medicine, Content_1.Content],
    migrations: [],
    subscribers: [],
});
