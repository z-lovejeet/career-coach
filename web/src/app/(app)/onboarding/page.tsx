"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Code2,
  FileText,
  FolderOpen,
  Lightbulb,
  Link2,
  Loader2,
  Target,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import useSWR, { useSWRConfig } from "swr";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  jsonRequest,
  optionalRequest,
  request,
} from "@/components/workspace/api";
import {
  ErrorNotice,
  IconTile,
  Panel,
  PanelHeading,
  PercentBar,
  safeHttpUrl,
  Tag,
  WorkspaceHeading,
  WorkspaceSkeleton,
} from "@/components/workspace/ui";
import type { OnboardingFormData, Profile } from "@/types";

import StepBasicInfo from "./steps/StepBasicInfo";
import StepResume from "./steps/StepResume";
import StepSkills from "./steps/StepSkills";
import StepProjects from "./steps/StepProjects";
import StepGoals from "./steps/StepGoals";
import StepLinks from "./steps/StepLinks";

const linkFields = ["github_url", "linkedin_url", "portfolio_url"] as const;

const steps = [
  {
    label: "About you",
    description: "Your background and experience",
    hint: "Your name is all you need to get started. Add education and experience to help set the right level for your practice.",
    icon: User,
  },
  {
    label: "Resume",
    description: "Bring your experience with you",
    hint: "A PDF can save you some typing. Review the suggested details and decide what to add to your profile draft.",
    icon: FileText,
  },
  {
    label: "Skills",
    description: "What you know and want to build",
    hint: "Rate your confidence honestly. A skill you are still learning is a useful starting point for focused practice.",
    icon: Code2,
  },
  {
    label: "Projects",
    description: "Evidence of what you can do",
    hint: "Describe the problem you solved, the part you built, and one decision you made. Coursework and personal projects both count.",
    icon: FolderOpen,
  },
  {
    label: "Career goals",
    description: "The direction you want to take",
    hint: "Choose the roles that interest you today. You can change your goals as you discover what you enjoy.",
    icon: Target,
  },
  {
    label: "Links and review",
    description: "A final look before you save",
    hint: "Check the details that matter most. You can return to any section before saving and update your profile later.",
    icon: Link2,
  },
];

function fieldsFromProfile(profile: Profile | null): OnboardingFormData {
  return {
    full_name: profile?.full_name ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    education_level: profile?.education_level ?? "",
    field_of_study: profile?.field_of_study ?? "",
    experience_level: profile?.experience_level ?? "fresher",
    skills: profile?.skills ?? [],
    skill_ratings: profile?.skill_ratings ?? {},
    projects: profile?.projects ?? [],
    goals: profile?.goals ?? [],
    preferred_role: profile?.preferred_role ?? "",
    preferred_locations: profile?.preferred_locations ?? [],
    github_url: profile?.github_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    resume_file: null,
  };
}

export default function OnboardingPage() {
  const {
    data: profile,
    isLoading,
    error,
    mutate,
  } = useSWR("/api/profile", optionalRequest<Profile>, {
    revalidateOnFocus: false,
  });

  if (isLoading) return <WorkspaceSkeleton />;
  if (profile === undefined)
    return (
      <div className="workspace-page">
        <ErrorNotice error={error} retry={() => void mutate()} />
      </div>
    );

  return <ProfileWizard key={profile?.id || "new"} profile={profile} />;
}

function ProfileWizard({ profile }: { profile: Profile | null }) {
  const editing = !!profile?.onboarding_complete;
  const [original] = useState(() => fieldsFromProfile(profile));
  const [formData, setFormData] = useState(original);
  const [attached, setAttached] = useState(!!profile?.resume_url);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const updateFormData = (updates: Partial<OnboardingFormData>) =>
    setFormData((current) => ({ ...current, ...updates }));
  const locked = saving || resumeBusy;
  const last = step === steps.length - 1;

  function goTo(index: number) {
    if (locked) return;
    if (index > 0 && !formData.full_name.trim() && !editing) {
      setError("Enter your name before continuing.");
      return;
    }
    setError(null);
    setStep(index);
    setFurthest((current) => Math.max(index, current));
    panelRef.current?.focus();
  }

  async function save() {
    setError(null);
    if (
      !formData.full_name.trim() &&
      (!editing || formData.full_name !== original.full_name)
    ) {
      setStep(0);
      setError("Enter your name before saving.");
      return;
    }
    if (
      linkFields.some(
        (field) =>
          formData[field].trim() &&
          (!editing || formData[field] !== original[field]) &&
          !safeHttpUrl(formData[field]),
      )
    ) {
      setStep(steps.length - 1);
      setError("Profile links must start with https:// or http://.");
      return;
    }

    setSaving(true);
    try {
      // Resume and auth email have independent workflows. Only write changed profile fields on edits.
      const editableFields: Partial<OnboardingFormData> = { ...formData };
      delete editableFields.email;
      delete editableFields.resume_file;
      const changes: Record<string, unknown> = Object.fromEntries(
        Object.entries(editableFields).filter(
          ([field, value]) =>
            !editing ||
            JSON.stringify(value) !==
              JSON.stringify(original[field as keyof typeof original]),
        ),
      );
      if (Object.hasOwn(changes, "full_name"))
        changes.full_name = formData.full_name.trim();
      if (!editing) changes.onboarding_complete = true;
      if (Object.keys(changes).length) {
        const saved = await request<Profile>(
          "/api/profile",
          jsonRequest("PUT", changes),
        );
        await mutate("/api/profile", saved, { revalidate: false });
      }
      void mutate("/api/dashboard");
      router.push(editing ? "/profile" : "/dashboard");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your changes could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const props = { formData, updateFormData };
  const content = [
    <StepBasicInfo key="identity" {...props} />,
    <StepResume
      key="resume"
      {...props}
      attached={attached}
      setAttached={(value) => {
        setAttached(value);
        void mutate("/api/profile");
      }}
      setBusy={setResumeBusy}
    />,
    <StepSkills key="skills" {...props} />,
    <StepProjects key="projects" {...props} />,
    <StepGoals key="goals" {...props} />,
    <StepLinks key="links" {...props} attached={attached} onEdit={goTo} />,
  ];

  return (
    <div className="workspace-page mx-auto max-w-6xl space-y-7">
      <WorkspaceHeading
        label={editing ? "Your profile, refined" : "Make yourself at home"}
        title={
          editing ? "Keep your story current." : "Build a workspace around you."
        }
        description={
          editing
            ? "Your experience keeps growing. Update your profile so your next steps reflect where you are now."
            : "A few thoughtful details help turn a general preparation plan into a direction that feels like yours."
        }
        actions={
          <Link
            href={editing ? "/profile" : "/dashboard"}
            aria-disabled={locked}
            onClick={(event) => {
              if (locked) event.preventDefault();
            }}
            className={buttonVariants({ variant: "outline" })}
          >
            {editing ? "Back to profile" : "Finish later"}
          </Link>
        }
      />
      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24">
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Your profile setup</p>
              <Tag tone="accent">
                {step + 1} / {steps.length}
              </Tag>
            </div>
            <PercentBar
              label="Profile setup step"
              value={(100 * (step + 1)) / steps.length}
            />
            <nav aria-label="Profile setup steps" className="mt-5">
              <ol className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                {steps.map(({ label, description, icon: Icon }, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      disabled={locked || (!editing && index > furthest)}
                      aria-current={step === index ? "step" : undefined}
                      className={`flex min-h-16 w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center text-xs transition-colors lg:flex-row lg:items-start lg:px-3 lg:text-left ${step === index ? "border-primary/25 bg-primary/8 text-foreground" : "border-transparent text-muted-foreground hover:bg-primary/4 disabled:opacity-45"}`}
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full ${step === index ? "bg-primary text-primary-foreground" : "bg-background/40"}`}
                      >
                        {index < step ? (
                          <Check className="size-4" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </span>
                      <span className="lg:pt-0.5">
                        <span className="block font-semibold lg:text-sm">
                          {label}
                        </span>
                        <span className="mt-1 hidden text-xs leading-relaxed text-muted-foreground lg:block">
                          {description}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </Panel>
          <div className="hidden gap-3 px-3 lg:flex">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">A helpful starting point</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {steps[step].hint}
              </p>
            </div>
          </div>
        </aside>
        <div className="space-y-5">
          <Panel>
            <div className="mb-7 flex items-center justify-between gap-3 border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <IconTile icon={steps[step].icon} />
                <p className="text-sm font-medium text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </p>
              </div>
              <Tag>
                {step === 0
                  ? "Start here"
                  : last
                    ? "Ready to review"
                    : "Make it yours"}
              </Tag>
            </div>
            <div tabIndex={-1} ref={panelRef} className="outline-none">
              <motion.div
                key={step}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {content[step]}
              </motion.div>
            </div>
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-destructive/15 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || locked}
                onClick={() => goTo(step - 1)}
              >
                <ArrowLeft />
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                {(last || editing) && (
                  <Button
                    type="button"
                    disabled={locked}
                    onClick={() => void save()}
                  >
                    {saving ? (
                      <Loader2 className="motion-safe:animate-spin" />
                    ) : (
                      <ClipboardList />
                    )}
                    {saving
                      ? "Saving your profile…"
                      : editing
                        ? "Save changes"
                        : "Create my workspace"}
                  </Button>
                )}
                {!last && (
                  <Button
                    type="button"
                    variant={editing ? "outline" : "default"}
                    disabled={locked}
                    onClick={() => goTo(step + 1)}
                  >
                    Continue
                    <ArrowRight />
                  </Button>
                )}
              </div>
            </div>
          </Panel>
          <Panel className="!py-5">
            <PanelHeading title="What comes next" />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <IconTile icon={Target} className="size-9" />
                <div>
                  <h3 className="text-sm font-semibold">Find your focus</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Run a profile assessment to identify strengths and useful
                    areas to practice.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <IconTile icon={Code2} className="size-9" />
                <div>
                  <h3 className="text-sm font-semibold">Build your practice</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Use your goals to shape study plans, interview rounds, and
                    mentor conversations.
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
