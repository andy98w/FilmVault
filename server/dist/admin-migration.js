"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = __importStar(require("mysql2/promise"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
};
// Function to check if a column exists
function columnExists(connection, table, column) {
    return __awaiter(this, void 0, void 0, function* () {
        const [columns] = yield connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
        return columns.length > 0;
    });
}
// Function to add a column if it doesn't exist
function addColumnIfNotExists(connection, table, column, definition) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield columnExists(connection, table, column))) {
            console.log(`Adding ${column} column to ${table} table...`);
            yield connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            console.log(`${column} column added successfully.`);
            return true;
        }
        else {
            console.log(`The ${column} column already exists in ${table} table.`);
            return false;
        }
    });
}
// Function to add created_at and updated_at columns
function addTimestampColumns(connection, table) {
    return __awaiter(this, void 0, void 0, function* () {
        let modified = false;
        // Add created_at column if it doesn't exist
        if (yield addColumnIfNotExists(connection, table, 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')) {
            modified = true;
        }
        // Add updated_at column if it doesn't exist
        if (yield addColumnIfNotExists(connection, table, 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')) {
            modified = true;
        }
        return modified;
    });
}
// Make the first user an admin
function makeFirstUserAdmin(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if there are any users
        const [users] = yield connection.query('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            const firstUserId = users[0].id;
            console.log(`Making user with ID ${firstUserId} an admin...`);
            yield connection.query('UPDATE users SET is_admin = 1 WHERE id = ?', [firstUserId]);
            console.log(`User ${firstUserId} is now an admin.`);
            return true;
        }
        else {
            console.log('No users found. No admin has been set.');
            return false;
        }
    });
}
// Main migration function
function runMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting admin migration...');
        console.log('Database configuration:');
        console.log(`Host: ${dbConfig.host}`);
        console.log(`User: ${dbConfig.user}`);
        console.log(`Database: ${dbConfig.database}`);
        let connection;
        try {
            // Connect to the database
            console.log('Connecting to database...');
            connection = yield mysql.createConnection(dbConfig);
            console.log('Database connection established.');
            // Add is_admin column to users table
            yield addColumnIfNotExists(connection, 'users', 'is_admin', 'BOOLEAN DEFAULT 0');
            // Add timestamp columns to users table
            yield addTimestampColumns(connection, 'users');
            // Make the first user an admin
            yield makeFirstUserAdmin(connection);
            console.log('Migration completed successfully.');
        }
        catch (error) {
            console.error('Migration failed:', (error === null || error === void 0 ? void 0 : error.message) || error);
            process.exit(1);
        }
        finally {
            if (connection) {
                yield connection.end();
                console.log('Database connection closed.');
            }
        }
    });
}
// Run the migration
runMigration()
    .then(() => {
    console.log('Admin migration script finished.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Fatal error during migration:', (error === null || error === void 0 ? void 0 : error.message) || error);
    process.exit(1);
});
