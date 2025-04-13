"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
const runMigration = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Starting LinkedIn link migration...');
        // Add LinkedInLink column to users table
        const addLinkedInLinkQuery = 'ALTER TABLE users ADD COLUMN LinkedInLink VARCHAR(255) DEFAULT NULL';
        console.log('Executing query:', addLinkedInLinkQuery);
        yield db_1.default.query(addLinkedInLinkQuery);
        console.log('Migration complete!');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
});
runMigration();
