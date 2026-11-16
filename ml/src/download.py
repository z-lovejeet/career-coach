"""Download the O*NET 31.0 database files used by CareerCompass.

Usage:  python ml/src/download.py
Files land in data/raw/ (git-ignored). Already-downloaded files are skipped.
Source: O*NET Resource Center (onetcenter.org), O*NET 31.0 Database, CC BY 4.0.
"""
from pathlib import Path
from urllib.request import urlretrieve

ONET_VERSION = "31_0"
BASE = f"https://www.onetcenter.org/dl_files/database/db_{ONET_VERSION}_csv"
FILES = [
    "occupation_data",       # titles + descriptions
    "essential_skills",      # foundational skills (importance / level)
    "transferable_skills",   # cross-functional skills (importance / level)
    "knowledge",             # knowledge areas (importance / level)
    "career_interest_types", # RIASEC interest profile
    "job_zones",             # preparation level 1-5
    "education",             # required education level distribution
    "software_skills",       # technology / tools used (hot technologies)
    "related_occupations",   # career graph
    "task_statements",       # what the job involves
    "job_titles",            # alternate titles for career search
]

RAW = Path(__file__).resolve().parents[2] / "data" / "raw"


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        target = RAW / f"{name}.csv"
        if target.exists() and target.stat().st_size > 0:
            print(f"ok   {name}.csv (cached)")
            continue
        print(f"get  {name}.csv")
        urlretrieve(f"{BASE}/{name}.csv", target)
    print(f"Done → {RAW}")


if __name__ == "__main__":
    main()
