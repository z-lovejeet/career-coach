"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Sparkles,
  Target,
  CheckCircle2,
  Loader2,
  MapPin,
  Briefcase,
  ExternalLink,
  Clock,
  Users,
  DollarSign,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      toast.info("Step 1/2: Extracting profile metrics via Gemini 3.8...");
      const analysisRes = await fetch("/api/analyze", { method: "POST" });
      const analysisData = await analysisRes.json();
      if (!analysisData.success) throw new Error(analysisData.error?.message);

      toast.info("Step 2/2: Computing company match matrices via Groq 120B...");
      const recsRes = await fetch("/api/companies", { method: "POST" });
      const recsData = await recsRes.json();
      if (!recsData.success) throw new Error(recsData.error?.message);

      setRecommendations(recsData.data);
      toast.success("Analysis complete! Placement matches updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate recommendations. Please retry.");
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchLinkedInJobs = async () => {
    setFetchingJobs(true);
    try {
      toast.info("Searching live LinkedIn listings matching your profile skills...");
      const res = await fetch("/api/jobs", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setJobsData(data.data);
      toast.success(`Found ${data.data.total} verified live job openings!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch LinkedIn jobs");
    } finally {
      setFetchingJobs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentFit = (recommendations?.current_fit_companies || []) as CompanyMatch[];
  const targets = (recommendations?.target_companies || []) as CompanyMatch[];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ─── Header & Telemetry ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
              Placement Radar
            </span>
            <span className="text-[#64748B] text-xs">•</span>
            <span className="font-mono text-[11px] text-[#8A96AA]">Market Alignment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Company Matches & Live Roles
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Re-Run Match Radar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Segmented Tab Switcher ─── */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0E111A] border border-white/[0.08] w-fit">
        <button
          onClick={() => setTab("ai")}
          className={`px-3.5 py-1.5 rounded-md text-xs font-mono tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer ${
            tab === "ai"
              ? "bg-white/[0.08] text-white border border-white/[0.1] font-semibold shadow-sm"
              : "text-[#8A96AA] hover:text-white"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          AI Fit Radar ({currentFit.length + targets.length})
        </button>
        <button
          onClick={() => {
            setTab("live");
            if (!jobsData && !fetchingJobs) fetchLinkedInJobs();
          }}
          className={`px-3.5 py-1.5 rounded-md text-xs font-mono tracking-wide uppercase transition-all flex items-center gap-2 cursor-pointer ${
            tab === "live"
              ? "bg-white/[0.08] text-white border border-white/[0.1] font-semibold shadow-sm"
              : "text-[#8A96AA] hover:text-white"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Live LinkedIn Roles {jobsData ? `(${jobsData.total})` : ""}
        </button>
      </div>

      {/* ─── Content Area ─── */}
      <AnimatePresence mode="wait">
        {tab === "ai" ? (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-7"
          >
            {/* Current Fit Companies */}
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Immediate High-Fit Companies (70%+ Match)
                </h2>
              </div>

              {currentFit.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {currentFit.map((company, i) => (
                    <CompanyCard key={i} company={company} type="fit" index={i} />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#0E111A] border border-white/[0.08] text-center text-xs font-mono text-[#8A96AA]">
                  No immediate fit companies recorded. Run the analysis above to calculate matches.
                </div>
              )}
            </div>

            {/* Target Companies (Reach) */}
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <Target className="w-4 h-4 text-amber-300" />
                <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Target Product Companies (Requires Calibration)
                </h2>
              </div>

              {targets.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {targets.map((company, i) => (
                    <CompanyCard key={i} company={company} type="target" index={i} />
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#0E111A] border border-white/[0.08] text-center text-xs font-mono text-[#8A96AA]">
                  No target companies identified. Run analysis to surface stretch placement goals.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="live"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Live Search Action Bar */}
            <div className="p-4 rounded-xl bg-[#0E111A] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <span className="font-mono text-xs text-slate-300 font-semibold">
                  {jobsData
                    ? `${jobsData.total} verified postings • Scraped ${new Date(jobsData.scrapedAt).toLocaleTimeString()}`
                    : "Real-time LinkedIn pipeline matched to candidate profile"}
                </span>
                <p className="text-[11px] text-[#8A96AA] font-mono mt-0.5">
                  Synchronized with candidate skills and preferred engineering roles
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLinkedInJobs}
                disabled={fetchingJobs}
                className="h-8.5 px-3.5 border-white/[0.1] hover:border-white/[0.2] text-xs font-mono uppercase tracking-wider text-slate-300 cursor-pointer"
              >
                {fetchingJobs ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Querying...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    Refresh Feed
                  </>
                )}
              </Button>
            </div>

            {fetchingJobs && !jobsData && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin mb-3" />
                <h3 className="text-sm font-semibold text-white">Scraping LinkedIn Engineering Feeds...</h3>
                <p className="text-xs text-[#8A96AA] mt-1 max-w-sm">
                  Apify is matching real job openings with your skill dossier. This takes 15-30 seconds.
                </p>
              </div>
            )}

            {jobsData && jobsData.jobs.length > 0 && (
              <div className="grid gap-3.5">
                {jobsData.jobs.map((job, i) => (
                  <JobCard key={job.id || i} job={job} index={i} />
                ))}
              </div>
            )}

            {jobsData && jobsData.jobs.length === 0 && (
              <div className="p-10 text-center rounded-xl bg-[#0E111A] border border-white/[0.08] font-mono text-xs text-[#8A96AA]">
                No active postings found for your current search parameters.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompanyCard({
  company,
  type,
  index,
}: {
  company: CompanyMatch;
  type: "fit" | "target";
  index: number;
}) {
  const isHighFit = company.match_score >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 flex flex-col justify-between hover:border-white/[0.16] transition-all shadow-sm"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-mono font-bold text-sm flex-shrink-0">
              {company.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">{company.name}</h3>
              <p className="text-xs text-[#8A96AA]">{company.role}</p>
            </div>
          </div>

          <div className={`font-mono text-sm font-bold px-2 py-0.5 rounded-md border tabular-nums ${
            isHighFit
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
          }`}>
            {company.match_score}%
          </div>
        </div>

        <p className="text-xs text-[#D0D6E2] leading-relaxed mb-4">
          {company.reason}
        </p>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {(company.matching_skills || []).map((sk) => (
              <span
                key={sk}
                className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                ✓ {sk}
              </span>
            ))}
          </div>

          {company.gap_skills && company.gap_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {company.gap_skills.map((sk) => (
                <span
                  key={sk}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  Gap: {sk}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {type === "target" && company.estimated_timeline && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A96AA]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            Target Window: {company.estimated_timeline}
          </span>
          <span className="text-amber-300">Calibration Sprint</span>
        </div>
      )}
    </motion.div>
  );
}

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-white/[0.08] bg-[#0E111A] p-5 hover:border-white/[0.16] transition-all shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0A0C13] border border-white/[0.08] flex items-center justify-center flex-shrink-0 relative">
            {job.companyLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-5 h-5 text-slate-500" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm text-white hover:text-blue-400 transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-[#8A96AA]">{job.companyName}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-[#8A96AA]">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {job.location}
                </span>
              )}
              {job.employmentType && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {job.employmentType}
                </span>
              )}
              {postedDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {postedDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <a
          href={job.applyUrl || job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <Button
            size="sm"
            className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-blue-500 text-white font-mono text-xs tracking-wider uppercase shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Apply on LinkedIn <ExternalLink className="w-3 h-3" />
          </Button>
        </a>
      </div>

      {job.salaryInfo && job.salaryInfo.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span>{job.salaryInfo.join(" — ")}</span>
        </div>
      )}

      {job.description && (
        <p className="text-xs text-[#8A96AA] mt-3 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
        {job.benefits?.slice(0, 3).map((b, i) => (
          <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {b}
          </span>
        ))}
        {job.applicantsCount && (
          <span className="text-[10px] font-mono text-[#8A96AA] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {job.applicantsCount} applicants
          </span>
        )}
      </div>
    </motion.div>
  );
}
