"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRepository = void 0;
const data_source_1 = require("../data-source");
const Content_1 = require("../entities/Content");
// Single source of truth for Content table operations
exports.contentRepository = data_source_1.AppDataSource.getRepository(Content_1.Content);
