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
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../config/db"));
const admin_1 = require("../middleware/admin");
const router = express_1.default.Router();
/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/users', admin_1.authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Admin fetching all users...');
        const [rows] = yield db_1.default.query('SELECT id, Usernames, Emails, ProfilePic, email_verified_at, is_admin, created_at FROM users ORDER BY id DESC');
        console.log(`Found ${rows.length} users`);
        res.json(rows);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user (admin only)
 * @access  Admin
 */
router.delete('/users/:id', admin_1.authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // First check if the user exists
        const [users] = yield db_1.default.query('SELECT id, Usernames, Emails FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Don't allow admins to delete other admins for safety
        const [adminCheck] = yield db_1.default.query('SELECT is_admin FROM users WHERE id = ?', [id]);
        if ((_a = adminCheck[0]) === null || _a === void 0 ? void 0 : _a.is_admin) {
            return res.status(403).json({
                message: 'Cannot delete admin users through the API for security reasons'
            });
        }
        // Begin transaction to delete all user data
        const connection = yield db_1.default.getConnection();
        try {
            yield connection.beginTransaction();
            console.log(`Deleting ratings for user ${id}...`);
            yield connection.query('DELETE FROM movie_ratings WHERE user_id = ?', [id]);
            console.log(`Deleting movies for user ${id}...`);
            yield connection.query('DELETE FROM user_movies WHERE user_id = ?', [id]);
            console.log(`Deleting user ${id}...`);
            yield connection.query('DELETE FROM users WHERE id = ?', [id]);
            yield connection.commit();
            console.log(`User ${id} (${user.Usernames}) successfully deleted`);
            res.json({
                message: `User ${user.Usernames} (ID: ${id}) has been deleted successfully`,
                deletedUser: {
                    id: user.id,
                    username: user.Usernames,
                    email: user.Emails
                }
            });
        }
        catch (txError) {
            yield connection.rollback();
            console.error('Transaction error:', txError);
            throw txError;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
/**
 * @route   POST /api/admin/users/:id/make-admin
 * @desc    Make a user an admin (admin only)
 * @access  Admin
 */
router.post('/users/:id/make-admin', admin_1.authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if the user exists
        const [users] = yield db_1.default.query('SELECT id, Usernames FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Update user to admin status
        yield db_1.default.query('UPDATE users SET is_admin = 1 WHERE id = ?', [id]);
        console.log(`User ${id} (${user.Usernames}) promoted to admin`);
        res.json({
            message: `User ${user.Usernames} (ID: ${id}) has been promoted to admin`,
            user: {
                id: user.id,
                username: user.Usernames,
                isAdmin: true
            }
        });
    }
    catch (error) {
        console.error('Error making user admin:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
/**
 * @route   POST /api/admin/users/:id/remove-admin
 * @desc    Remove admin status from a user (admin only)
 * @access  Admin
 */
router.post('/users/:id/remove-admin', admin_1.authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // Don't allow removal of admin status from the current user
        if (id === ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id.toString())) {
            return res.status(403).json({
                message: 'You cannot remove your own admin privileges'
            });
        }
        // Check if the user exists
        const [users] = yield db_1.default.query('SELECT id, Usernames FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = users[0];
        // Update user to remove admin status
        yield db_1.default.query('UPDATE users SET is_admin = 0 WHERE id = ?', [id]);
        console.log(`Admin privileges removed from user ${id} (${user.Usernames})`);
        res.json({
            message: `Admin privileges removed from user ${user.Usernames} (ID: ${id})`,
            user: {
                id: user.id,
                username: user.Usernames,
                isAdmin: false
            }
        });
    }
    catch (error) {
        console.error('Error removing admin status:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
exports.default = router;
