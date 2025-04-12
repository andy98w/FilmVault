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
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function addColumnIfNotExists(connection, tableName, columnName, definition) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if column exists
            const [columns] = yield connection.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`);
            if (columns.length === 0) {
                // Column doesn't exist, add it
                console.log(`Adding ${columnName} column...`);
                yield connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
                return true;
            }
            else {
                console.log(`Column ${columnName} already exists, skipping...`);
                return false;
            }
        }
        catch (error) {
            console.error(`Error handling column ${columnName}:`, error);
            return false;
        }
    });
}
function runMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = null;
        try {
            console.log('Connecting to database...');
            connection = yield promise_1.default.createConnection({
                host: process.env.DB_HOST || '40.233.72.63',
                user: process.env.DB_USER || 'admin',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'myfavmovies'
            });
            yield addColumnIfNotExists(connection, 'users', 'verification_token', 'VARCHAR(255) NULL');
            yield addColumnIfNotExists(connection, 'users', 'reset_token', 'VARCHAR(255) NULL');
            yield addColumnIfNotExists(connection, 'users', 'Biography', 'TEXT NULL');
            yield addColumnIfNotExists(connection, 'users', 'FacebookLink', 'VARCHAR(255) NULL');
            yield addColumnIfNotExists(connection, 'users', 'InstagramLink', 'VARCHAR(255) NULL');
            yield addColumnIfNotExists(connection, 'users', 'YoutubeLink', 'VARCHAR(255) NULL');
            yield addColumnIfNotExists(connection, 'users', 'GithubLink', 'VARCHAR(255) NULL');
            console.log('Checking columns...');
            const [rows] = yield connection.query('SHOW COLUMNS FROM users');
            console.log('Users table columns:');
            console.table(rows);
            console.log('✅ Migration completed successfully!');
            yield connection.end();
        }
        catch (error) {
            console.error('Error during migration:', error);
            if (connection) {
                yield connection.end();
            }
        }
    });
}
runMigration();
