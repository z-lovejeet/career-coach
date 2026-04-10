import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { callGemini } from './src/lib/agents/gemini';

async function run() {
  const SYSTEM = `Career roadmap architect for Indian tech placements. Return ONLY valid JSON.`;
  const userPrompt = `3-month roadmap for Google Software Engineer.
Student: fresher, Skills: JavaScript, Python, Score: 40/100, Weak: N/A, Missing: Next.js
Focus: dsa, web_dev, 4h/day

3 phases. Per phase: 3-4 resources (1 must be youtube_playlist with real playlist URL), 2 weeks, 2-3 tasks/week.
Use real URLs from: youtube.com/playlist, leetcode.com, geeksforgeeks.org, react.dev, developer.mozilla.org, neetcode.io

JSON: {"overview":{"feasibility":"realistic|ambitious|unrealistic","feasibilityNote":"str","alternativeCompanies":[],"currentReadiness":0,"targetReadiness":0,"estimatedFinalReadiness":0},"phases":[{"phaseNumber":1,"title":"str","startWeek":1,"endWeek":4,"objective":"str","milestone":"str","resources":[{"title":"str","url":"str","type":"youtube_playlist|youtube|documentation|course|practice","description":"str"}],"weeks":[{"weekNumber":1,"focus":"str","dailyHoursBreakdown":{"theory":1,"practice":2,"projects":0},"tasks":[{"title":"str","type":"dsa|web_dev|system_design|project|soft_skills","description":"str","resources":["str"],"deliverable":"str"}],"weeklyGoal":"str"}]}],"keySkillsToAcquire":[{"skill":"str","currentLevel":"none|beginner|intermediate","targetLevel":"intermediate|advanced","estimatedWeeks":4,"priority":"critical|high|medium"}],"interviewPrep":{"dsaProblemsTarget":150,"systemDesignTopics":["str"],"mockInterviewsTarget":10,"companySpecificTips":["str"]},"warnings":["str"]}`;

  try {
     console.log("Calling gemini...");
     const roadmap = await callGemini({
        systemPrompt: SYSTEM,
        userPrompt,
        jsonMode: true,
        temperature: 0.5,
        maxTokens: 8192,
     });
     console.log("SUCCESS:", roadmap.overview.feasibility);
  } catch(e) {
     console.error("ERROR:");
     console.error(e.message);
  }
}
run();
