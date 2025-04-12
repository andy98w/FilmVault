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
const sgMail = __importStar(require("@sendgrid/mail"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// Check if email configuration exists
if (!process.env.SENDGRID_API_KEY) {
    console.error('SendGrid API key is missing. Please add SENDGRID_API_KEY to your .env file.');
    process.exit(1);
}
// Set the SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// Create a test function to send an email
function testEmail() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Email settings:');
        console.log(`- SENDGRID_API_KEY: ${process.env.SENDGRID_API_KEY ? '[Set but not displayed]' : '[Not set]'}`);
        console.log(`- FROM_EMAIL: ${process.env.FROM_EMAIL || 'Not set, using default'}`);
        try {
            const from = process.env.FROM_EMAIL || 'filmvault.noreply@gmail.com';
            const to = from; // Sending to the same address for testing
            console.log(`Sending test email from ${from} to ${to}...`);
            const msg = {
                to,
                from,
                subject: 'FilmVault Email Test',
                text: 'This is a test email to verify that the SendGrid email functionality is working correctly.',
                html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #89C9B8;">FilmVault Email Test</h1>
          </div>
          <p>This is a test email to verify that the SendGrid email functionality is working correctly.</p>
          <p>Configuration:</p>
          <ul>
            <li>From email: ${from}</li>
            <li>Server time: ${new Date().toISOString()}</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #888888; text-align: center;">This is an automated test email from FilmVault.</p>
        </div>
      `,
            };
            const response = yield sgMail.send(msg);
            console.log('Test email sent successfully!');
            console.log('Response status:', response[0].statusCode);
            return true;
        }
        catch (error) {
            console.error('Error sending test email:');
            if (error === null || error === void 0 ? void 0 : error.response) {
                console.error('Status code:', error.response.statusCode);
                console.error('Body:', error.response.body);
            }
            else {
                console.error((error === null || error === void 0 ? void 0 : error.message) || error);
            }
            return false;
        }
    });
}
// Run test
testEmail()
    .then((success) => {
    console.log('\nEmail test:', success ? 'PASSED' : 'FAILED');
    process.exit(success ? 0 : 1);
})
    .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
