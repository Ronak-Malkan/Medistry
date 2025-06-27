"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicineRepository = void 0;
const data_source_1 = require("../data-source");
const Medicine_1 = require("../entities/Medicine");
exports.medicineRepository = data_source_1.AppDataSource.getRepository(Medicine_1.Medicine);
