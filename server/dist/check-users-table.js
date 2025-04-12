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
function checkUsersTable() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Checking users table structure...');
            const connection = yield db_1.default.getConnection();
            try {
                // Get table structure
                const [columns] = yield connection.query('SHOW COLUMNS FROM users');
                console.log('Users table columns:');
                console.table(columns);
                // Check for test users
                const [users] = yield connection.query('SELECT id, Usernames, Emails, email_verified_at FROM users LIMIT 5');
                console.log('Sample users (limiting sensitive data):');
                console.table(users);
                connection.release();
                console.log('Connection released successfully');
            }
            catch (error) {
                console.error('Error querying users table:', error);
                connection.release();
            }
        }
        catch (error) {
            console.error('Error connecting to database:', error);
        }
    });
}
checkUsersTable();
