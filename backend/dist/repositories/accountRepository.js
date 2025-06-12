"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountRepository = void 0;
const Account_1 = require("../entities/Account");
const data_source_1 = require("../data-source");
exports.accountRepository = data_source_1.AppDataSource.getRepository(Account_1.Account);
