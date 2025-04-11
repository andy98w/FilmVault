"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const movies_1 = __importDefault(require("./routes/movies"));
const users_1 = __importDefault(require("./routes/users"));
require("./config/db"); // Initialize database connection
const oci_1 = require("./config/oci"); // Import OCI configuration
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Check OCI configuration
if (oci_1.ociConfig.isConfigValid()) {
    console.log('OCI configuration loaded successfully');
}
else {
    console.warn('OCI configuration is not valid or missing. Using fallback configuration.');
}
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/movies', movies_1.default);
app.use('/api/users', users_1.default);
// Default route
app.get('/', (req, res) => {
    res.send('MyFavMovies API is running');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
