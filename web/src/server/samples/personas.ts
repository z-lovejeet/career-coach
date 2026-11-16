import "server-only";
import { scoreRiasec } from "@/lib/riasec";
import type { Profile } from "@/lib/types";

/**
 * Input personas for the three public sample roadmaps (teacher deliverable).
 * These are only the *inputs* (a student's background and interests). The roadmaps
 * themselves are produced by the live agent pipeline and saved with their traces.
 */
export interface Persona {
  name: string;
  background: string;
  targetQuery?: string;
  hoursPerWeek: number;
  timelineMonths: number;
  profile: Partial<Profile>;
}

const answers = (r: number, i: number, a: number, s: number, e: number, c: number) => ({ r1: r, r2: r, i1: i, i2: i, a1: a, a2: a, s1: s, s2: s, e1: e, e2: e, c1: c, c2: c });

export const PERSONAS: Persona[] = [
  {
    name: "Ananya · B.Tech CSE, 3rd year",
    background: "Enjoys statistics and ML coursework, has built two Python ML projects, wants a data role at a product company.",
    targetQuery: "Data Scientist",
    hoursPerWeek: 12,
    timelineMonths: 6,
    profile: {
      full_name: "Ananya (sample)",
      education: { degree: "B.Tech", branch: "Computer Science and Engineering", currentYear: "3rd year", cgpa: "8.6" },
      academics: { coursework: ["Data Structures & Algorithms", "DBMS", "Probability & Statistics", "Machine Learning", "Linear Algebra"], strongSubjects: ["Probability & Statistics", "Machine Learning"], weakSubjects: ["Computer Networks"] },
      skills: [
        { name: "Python", level: 4, category: "technical" }, { name: "Pandas", level: 3, category: "tool" }, { name: "SQL", level: 3, category: "technical" },
        { name: "scikit-learn", level: 3, category: "tool" }, { name: "Statistics", level: 3, category: "technical" }, { name: "Communication", level: 3, category: "soft" },
      ],
      projects: [
        { title: "Student dropout predictor", description: "Logistic regression and random forest on university records; explained features with SHAP.", tech: ["Python", "scikit-learn"], link: "" },
        { title: "IPL score analysis", description: "Exploratory analysis and visual dashboard of ten IPL seasons.", tech: ["Pandas", "Matplotlib"], link: "" },
      ],
      interests: { answers: answers(2, 5, 2, 3, 2, 4), areas: ["Data & analytics", "Artificial intelligence"] },
      goals: { targetRoles: ["Data Scientist"], path: "job", hoursPerWeek: 12, timelineMonths: 6, locations: ["Bengaluru"], dreamCompanies: ["Flipkart"] },
    },
  },
  {
    name: "Rohit · B.Tech ECE, 2nd year",
    background: "Loves circuits and microcontrollers, built an Arduino weather station, unsure between core electronics and embedded software.",
    hoursPerWeek: 10,
    timelineMonths: 9,
    profile: {
      full_name: "Rohit (sample)",
      education: { degree: "B.Tech", branch: "Electronics and Communication Engineering", currentYear: "2nd year", cgpa: "7.9" },
      academics: { coursework: ["Analog Electronics", "Digital Electronics", "Signals & Systems", "Network Theory", "C Programming"], strongSubjects: ["Digital Electronics"], weakSubjects: ["Signals & Systems"] },
      skills: [
        { name: "C", level: 3, category: "technical" }, { name: "Arduino", level: 3, category: "tool" }, { name: "Circuit design", level: 2, category: "technical" },
        { name: "MATLAB", level: 2, category: "tool" }, { name: "Soldering & prototyping", level: 3, category: "technical" }, { name: "Teamwork", level: 4, category: "soft" },
      ],
      projects: [{ title: "Arduino weather station", description: "Temperature, humidity and pressure sensors logged to an SD card with an LCD display.", tech: ["Arduino", "C"], link: "" }],
      interests: { answers: answers(5, 4, 2, 2, 2, 3), areas: ["Hardware & IoT"] },
      goals: { targetRoles: [], path: "unsure", hoursPerWeek: 10, timelineMonths: 9, locations: ["Hyderabad", "Bengaluru"] },
    },
  },
  {
    name: "Meera · BBA, final year",
    background: "Business student who enjoys design and talking to users; self-taught Figma and wants to move into product and UX.",
    targetQuery: "User Experience Designer",
    hoursPerWeek: 15,
    timelineMonths: 6,
    profile: {
      full_name: "Meera (sample)",
      education: { degree: "BBA", branch: "Marketing", currentYear: "3rd year", cgpa: "8.1" },
      academics: { coursework: ["Marketing Management", "Consumer Behaviour", "Business Statistics", "Organisational Behaviour"], strongSubjects: ["Consumer Behaviour"], weakSubjects: ["Business Statistics"] },
      skills: [
        { name: "Figma", level: 3, category: "tool" }, { name: "User interviews", level: 2, category: "technical" }, { name: "Presentation", level: 4, category: "soft" },
        { name: "Canva", level: 4, category: "tool" }, { name: "Excel", level: 3, category: "tool" }, { name: "Writing", level: 4, category: "soft" },
      ],
      projects: [{ title: "Campus canteen app redesign", description: "Interviewed 15 students, mapped pain points and prototyped a faster ordering flow in Figma.", tech: ["Figma"], link: "" }],
      interests: { answers: answers(1, 3, 5, 4, 4, 2), areas: ["Design", "Building products"] },
      goals: { targetRoles: ["UX Designer", "Product Manager"], path: "job", hoursPerWeek: 15, timelineMonths: 6, locations: ["Remote", "Pune"] },
    },
  },
].map((p) => ({ ...p, profile: { ...p.profile, interests: { ...p.profile.interests, riasec: scoreRiasec(p.profile.interests!.answers!) } } })) as Persona[];
