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
function migrateRatings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting rating migration...');
            // Get database version info
            const [versionInfo] = yield db_1.default.query('SELECT VERSION() as version');
            console.log('Database version:', versionInfo[0].version);
            // 1. First, check if there are any constraints on the table
            try {
                // MySQL approach - drop check constraint
                yield db_1.default.query(`
        ALTER TABLE movie_ratings 
        MODIFY COLUMN rating DECIMAL(5,2) NOT NULL
      `);
                console.log('Removed rating column constraints');
            }
            catch (error) {
                console.log('Trying an alternative approach...');
            }
            // 2. Convert ratings one by one
            console.log('Converting existing ratings to 0-100 scale...');
            const [oldRatings] = yield db_1.default.query('SELECT * FROM movie_ratings');
            console.log(`Found ${oldRatings.length} ratings to migrate`);
            // First create a temporary column to store the new values
            try {
                yield db_1.default.query('ALTER TABLE movie_ratings ADD COLUMN new_rating INT DEFAULT 0');
                // Update temporary column with converted values
                for (const rating of oldRatings) {
                    const oldValue = rating.rating;
                    // Convert from decimal 0-5 to integer 0-100
                    const newValue = Math.round(oldValue * 20);
                    yield db_1.default.query(`UPDATE movie_ratings SET new_rating = ? WHERE id = ?`, [newValue, rating.id]);
                }
                // Drop the old column and rename the new one
                yield db_1.default.query('ALTER TABLE movie_ratings DROP COLUMN rating');
                yield db_1.default.query('ALTER TABLE movie_ratings CHANGE COLUMN new_rating rating INT NOT NULL DEFAULT 0');
                yield db_1.default.query('ALTER TABLE movie_ratings ADD CONSTRAINT rating_check CHECK (rating >= 0 AND rating <= 100)');
                console.log('Successfully migrated to new rating column with 0-100 scale');
            }
            catch (error) {
                console.error('Error during column migration:', error);
                throw error;
            }
            console.log('Migration completed successfully!');
        }
        catch (error) {
            console.error('Migration failed:', error);
        }
        finally {
            // Close the connection pool
            process.exit(0);
        }
    });
}
// Run the migration
migrateRatings();
