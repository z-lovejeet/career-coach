"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Loader2,
  MapPin,
  Briefcase,
  ExternalLink,
  Clock,
  Users,
  Globe,
  DollarSign,
  Search,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { CompanyRecommendation, CompanyMatch } from "@/types";

interface LinkedInJob {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  companyUrl: string | null;
  companyWebsite: string | null;
  companyDescription: string | null;
  companyEmployeesCount: number | null;
  location: string;
  salaryInfo: string[];
  postedAt: string;
  benefits: string[];
  applyUrl: string;
  link: string;
  description: string;
  seniorityLevel: string | null;
  employmentType: string | null;
  jobFunction: string | null;
  industries: string | null;
  applicantsCount: string | null;
  recruiter: {
    name: string;
    title: string;
    photo: string | null;
    profileUrl: string | null;
  } | null;
}

interface JobsData {
  jobs: LinkedInJob[];
  searchUrl: string;
  total: number;
  scrapedAt: string;
}

type TabType = "ai" | "live";

export default function CompaniesPage() {
  const [tab, setTab] = useState<TabType>("ai");
  const [recommendations, setRecommendations] = useState<CompanyRecommendation | null>(null);
  const [jobsData, setJobsData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.success) setRecommendations(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Step 1: Run profile analysis
      toast.info("🧠 Step 1/2: Analyzing your profile...");
      const analysisRes = await fetch("/api/analyze", { method: "POST" });
      const analysisData = await analysisRes.json();
      if (!analysisData.success) throw new Error(analysisData.error?.message);

      // Step 2: Generate company recommendations
      toast.info("🏢 Step 2/2: Matching companies...");
      const recsRes = await fetch("/api/companies", { method: "POST" });
      const recsData = await recsRes.json();
      if (!recsData.success) throw new Error(recsData.error?.message);

      setRecommendations(recsData.data);
      toast.success("✅ Analysis complete! Company matches ready.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate recommendations. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchLinkedInJobs = async () => {
    setFetchingJobs(true);
    try {
      toast.info("🔍 Searching LinkedIn for real jobs matching your skills...");
      const res = await fetch("/api/jobs", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setJobsData(data.data);
      toast.success(`✅ Found ${data.data.total} live job listings!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch LinkedIn jobs. Please try again.");
    } finally {
      setFetchingJobs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state — no recommendations yet
  if (!recommendations) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Companies & Jobs</h1>
          <p className="text-muted-foreground">
            AI-powered company matching + real LinkedIn job listings
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 animate-float">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Company Recommendations Yet</h2>
          <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
            Let our AI analyze your profile and match you with real
            companies. This takes about 15-30 seconds.
          </p>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            size="lg"
            className="gradient-primary text-white border-0 gap-2 hover:opacity-90 glow"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze & Match Companies
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const currentFit = (recommendations.current_fit_companies || []) as CompanyMatch[];
  const targets = (recommendations.target_companies || []) as CompanyMatch[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">Companies & Jobs</h1>
          <p className="text-muted-foreground">
            AI recommendations + real LinkedIn job listings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={runAnalysis}
          disabled={analyzing}
          className="gap-2"
          size="sm"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Re-analyze
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 rounded-xl glass-strong w-fit">
        <button
          onClick={() => setTab("ai")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "ai"
              ? "gradient-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI Matches
        </button>
        <button
          onClick={() => {
            setTab("live");
            if (!jobsData && !fetchingJobs) fetchLinkedInJobs();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "live"
              ? "gradient-primary text-white shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-4 h-4" />
          Live Jobs
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "ai" ? (
          <motion.div
            key="ai"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Current Fit */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Current Fit ({currentFit.length})
                <span className="text-xs text-muted-foreground font-normal">Companies you can target now</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {currentFit.map((company, i) => (
                  <CompanyCard key={i} company={company} type="fit" index={i} />
                ))}
              </div>
            </div>

            {/* Target Companies */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Target Companies ({targets.length})
                <span className="text-xs text-muted-foreground font-normal">With more preparation</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {targets.map((company, i) => (
                  <CompanyCard key={i} company={company} type="target" index={i} />
                ))}
              </div>
            </div>

            {/* Roadmap */}
            {recommendations.roadmap_to_target && (recommendations.roadmap_to_target as Array<{month: number; focus: string; tasks: string[]}>).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Roadmap to Target Companies
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(recommendations.roadmap_to_target as Array<{month: number; focus: string; tasks: string[]}>).map((step, i) => (
                    <motion.div
                      key={i}
                      className="p-4 rounded-xl glass"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          M{step.month}
                        </div>
                        <span className="font-medium text-sm">{step.focus}</span>
                      </div>
                      <ul className="space-y-1">
                        {step.tasks.map((task, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="live"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Live Jobs Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {jobsData
                  ? `${jobsData.total} jobs found • scraped ${new Date(jobsData.scrapedAt).toLocaleTimeString()}`
                  : "Real-time LinkedIn job listings matched to your profile"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLinkedInJobs}
                disabled={fetchingJobs}
                className="gap-2"
              >
                {fetchingJobs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Refresh
              </Button>
            </div>

            {/* Loading state */}
            {fetchingJobs && !jobsData && (
              <div className="flex flex-col items-center py-16">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 animate-pulse">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-1">Searching LinkedIn...</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Scraping real job listings based on your skills. This takes 30-60 seconds.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Powered by Apify LinkedIn Scraper
                </div>
              </div>
            )}

            {/* Jobs Grid */}
            {jobsData && jobsData.jobs.length > 0 && (
              <div className="grid gap-4">
                {jobsData.jobs.map((job, i) => (
                  <JobCard key={job.id || i} job={job} index={i} />
                ))}
              </div>
            )}

            {/* No jobs */}
            {jobsData && jobsData.jobs.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No jobs found. Try adjusting your profile skills.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Company Card (AI Matches) ─── */
function CompanyCard({
  company,
  type,
  index,
}: {
  company: CompanyMatch;
  type: "fit" | "target";
  index: number;
}) {
  const scoreColor =
    company.match_score >= 70
      ? "text-emerald-400"
      : company.match_score >= 40
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <motion.div
      className="p-5 rounded-xl glass hover:glass-strong transition-all group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {company.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{company.name}</h3>
            <p className="text-xs text-muted-foreground">{company.role}</p>
          </div>
        </div>
        <div className={`text-lg font-bold ${scoreColor}`}>
          {company.match_score}%
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{company.reason}</p>

      <div className="flex flex-wrap gap-1.5">
        {(company.matching_skills || company.required_skills || []).slice(0, 4).map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className={`text-[10px] ${
              type === "fit"
                ? "text-emerald-400 border-emerald-500/20"
                : "text-amber-400 border-amber-500/20"
            }`}
          >
            {skill}
          </Badge>
        ))}
      </div>

      {type === "target" && company.estimated_timeline && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {company.estimated_timeline}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Job Card (Live LinkedIn Jobs) ─── */
function JobCard({ job, index }: { job: LinkedInJob; index: number }) {
  const postedDate = job.postedAt
    ? new Date(job.postedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      className="p-5 rounded-xl glass hover:glass-strong transition-all group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-accent flex items-center justify-center flex-shrink-0">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-xs text-muted-foreground">{job.companyName}</p>
            </div>
            <a
              href={job.applyUrl || job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                className="gradient-primary text-white border-0 gap-1.5 text-xs hover:opacity-90"
              >
                Apply
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {job.employmentType}
              </span>
            )}
            {job.seniorityLevel && (
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {job.seniorityLevel}
              </span>
            )}
            {postedDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {postedDate}
              </span>
            )}
          </div>

          {/* Salary */}
          {job.salaryInfo && job.salaryInfo.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                {job.salaryInfo.join(" — ")}
              </span>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Benefits + Applicants */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {job.benefits?.map((benefit, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] text-emerald-400 border-emerald-500/20"
              >
                {benefit}
              </Badge>
            ))}
            {job.applicantsCount && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {job.applicantsCount} applicants
              </span>
            )}
            {job.companyEmployeesCount && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {job.companyEmployeesCount.toLocaleString()} employees
              </span>
            )}
          </div>

          {/* Recruiter */}
          {job.recruiter && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
              {job.recruiter.photo && (
                <img
                  src={job.recruiter.photo}
                  alt={job.recruiter.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="text-[11px]">
                <span className="text-muted-foreground">Posted by </span>
                {job.recruiter.profileUrl ? (
                  <a
                    href={job.recruiter.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {job.recruiter.name}
                  </a>
                ) : (
                  <span className="font-medium">{job.recruiter.name}</span>
                )}
                {job.recruiter.title && (
                  <span className="text-muted-foreground"> · {job.recruiter.title}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
