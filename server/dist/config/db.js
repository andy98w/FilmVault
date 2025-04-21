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
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
// OCI Configuration from environment variables
const ociConfig = {
    user: process.env.OCI_USER_OCID || '',
    fingerprint: process.env.OCI_FINGERPRINT || '',
    tenancy: process.env.OCI_TENANCY_OCID || '',
    region: process.env.OCI_REGION || 'ca-toronto-1',
    key_file: process.env.OCI_KEY_FILE || '',
};
// Log database configuration
console.log('OCI Database Configuration:');
console.log(`  Region: ${ociConfig.region}`);
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  User: ${process.env.DB_USER}`);
console.log(`  Database: ${process.env.DB_NAME}`);
// Create database connection pool
let pool;
try {
    // Read OCI private key if exists
    const privateKey = fs_1.default.existsSync(ociConfig.key_file)
        ? fs_1.default.readFileSync(ociConfig.key_file, 'utf8')
        : undefined;
    if (!privateKey) {
        console.warn(`OCI private key not found at ${ociConfig.key_file}`);
    }
    // Create connection pool
    const dbHost = process.env.DB_HOST || process.env.DB_NLB_IP || 'localhost';
    console.log(`Using database host: ${dbHost}`);
    pool = promise_1.default.createPool({
        host: dbHost,
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
            // Allow self-signed certificates from OCI MySQL
            rejectUnauthorized: false
        }
    });
    // Test the connection
    const testConnection = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const connection = yield pool.getConnection();
            console.log('Database connection successful!');
            // Try to get database info
            try {
                const [rows] = yield connection.query('SHOW TABLES');
                console.log('Tables in database:');
                console.table(rows);
            }
            catch (queryErr) {
                console.warn('Connected but could not query database:', queryErr);
            }
            connection.release();
            return true;
        }
        catch (error) {
            console.error('Error connecting to database:', error);
            console.log('Check db-connection-checklist.md for troubleshooting steps');
            throw error; // Re-throw error to fail app startup if DB connection fails
        }
    });
    // Execute the test immediately
    testConnection();
}
catch (error) {
    console.error('Error creating database pool:', error);
    throw error; // Re-throw error to fail app startup if DB connection fails
}
exports.default = pool;
