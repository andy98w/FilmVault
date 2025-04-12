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
function testDbConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Attempting to connect to database via Network Load Balancer...");
            console.log(`Host: ${process.env.DB_HOST || '40.233.72.63'}`);
            console.log(`Database: ${process.env.DB_NAME || 'myfavmovies'}`);
            console.log("Port: 3306");
            const connection = yield db_1.default.getConnection();
            console.log('✅ Database connection successful!');
            // Try to execute a simple query
            const [rows] = yield connection.query('SHOW TABLES');
            console.log('Tables in database:');
            console.table(rows);
            // Test a simple query
            try {
                const [versionResult] = yield connection.query('SELECT VERSION() as version');
                console.log('MySQL Version:', versionResult[0].version);
            }
            catch (queryError) {
                console.warn('Could not get MySQL version:', queryError);
            }
            connection.release();
            console.log("Connection released successfully.");
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            console.log("Make sure:");
            console.log("1. The database password is correct");
            console.log("2. The database 'myfavmovies' exists");
            console.log("3. The user 'admin' has permissions to connect from '%'");
            console.log("4. The NLB is properly routing traffic to port 3306");
        }
        finally {
            process.exit();
        }
    });
}
testDbConnection();
