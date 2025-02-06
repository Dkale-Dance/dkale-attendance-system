import { config } from "dotenv";
import path from "path";
import '@testing-library/jest-dom';

// Explicitly load .env.local from the frontend folder
config({ path: path.resolve(__dirname, "../.env.local") });


