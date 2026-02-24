export const SKILL_META: Record<
  string,
  {
    name: string;
    icon: "Globe" | "FileText" | "GitBranch";
    color: "blue" | "amber" | "emerald";
    description: string;
  }
> = {
  web_fetch: {
    name: "Web Fetch",
    icon: "Globe",
    color: "blue",
    description: "Fetches content from URLs",
  },
  scrape_devpost: {
    name: "Devpost Scraper",
    icon: "Globe",
    color: "blue",
    description: "Scrapes hackathon project galleries",
  },
  extract_document: {
    name: "Document Reader",
    icon: "FileText",
    color: "amber",
    description: "Extracts text from PDFs",
  },
  create_diagram: {
    name: "Diagram Generator",
    icon: "GitBranch",
    color: "emerald",
    description: "Creates technical diagrams",
  },
  edit_file: {
    name: "File Editor",
    icon: "FileText",
    color: "amber",
    description: "Edits project files",
  },
  use_skill: {
    name: "Skill Loader",
    icon: "FileText",
    color: "amber",
    description: "Loads project skill methodology",
  },
};
