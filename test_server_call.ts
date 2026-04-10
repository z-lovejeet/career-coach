import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Set env BEFORE importing route
import { POST } from './src/app/api/roadmap/route';

async function run() {
  const req = {
    json: async () => ({
      dreamCompany: "Google",
      targetRole: "Software Engineer",
      timelinMonths: 3,
      hoursPerDay: 4,
      focusAreas: ["dsa", "web_dev"]
    })
  };
  
  // Need to mock auth! 
}
