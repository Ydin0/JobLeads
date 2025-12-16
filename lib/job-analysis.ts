// Job analysis utilities for categorization and tech stack extraction

export type JobDepartment =
  | "engineering"
  | "sales"
  | "marketing"
  | "hr"
  | "finance"
  | "operations"
  | "design"
  | "product"
  | "customer_success"
  | "legal"
  | "other";

// Keywords for department categorization (lowercase)
const departmentKeywords: Record<JobDepartment, string[]> = {
  engineering: [
    "engineer", "developer", "programmer", "software", "backend", "frontend",
    "full stack", "fullstack", "devops", "sre", "infrastructure", "platform",
    "data engineer", "machine learning", "ml engineer", "ai engineer",
    "security engineer", "qa engineer", "test engineer", "mobile developer",
    "ios developer", "android developer", "web developer", "cloud engineer",
    "solutions architect", "technical lead", "tech lead", "cto", "vp engineering"
  ],
  sales: [
    "sales", "account executive", "ae ", "sdr", "bdr", "business development",
    "account manager", "sales manager", "sales director", "vp sales",
    "chief revenue", "cro", "sales representative", "inside sales",
    "outside sales", "enterprise sales", "regional sales"
  ],
  marketing: [
    "marketing", "growth", "content", "seo", "sem", "ppc", "brand",
    "communications", "pr ", "public relations", "social media",
    "demand generation", "product marketing", "digital marketing",
    "marketing manager", "cmo", "vp marketing", "head of marketing"
  ],
  hr: [
    "human resources", "hr ", "recruiter", "recruiting", "talent acquisition",
    "people operations", "people ops", "hrbp", "hr business partner",
    "compensation", "benefits", "payroll", "employee experience",
    "chief people", "vp people", "head of people", "hr manager"
  ],
  finance: [
    "finance", "accounting", "accountant", "controller", "cfo",
    "financial analyst", "fp&a", "treasury", "tax ", "audit",
    "bookkeeper", "accounts payable", "accounts receivable",
    "vp finance", "head of finance", "finance manager"
  ],
  operations: [
    "operations", "ops ", "supply chain", "logistics", "procurement",
    "warehouse", "inventory", "coo", "vp operations", "operations manager",
    "business operations", "strategy & operations", "chief operating"
  ],
  design: [
    "designer", "design", "ux ", "ui ", "user experience", "user interface",
    "graphic design", "visual design", "product designer", "brand designer",
    "creative director", "art director", "head of design", "vp design"
  ],
  product: [
    "product manager", "product owner", "product lead", "head of product",
    "vp product", "chief product", "cpo", "product director",
    "technical product manager", "senior product manager"
  ],
  customer_success: [
    "customer success", "customer support", "support engineer",
    "customer experience", "cx ", "client success", "account management",
    "implementation", "onboarding specialist", "support manager",
    "head of support", "vp customer success"
  ],
  legal: [
    "legal", "lawyer", "attorney", "counsel", "compliance",
    "general counsel", "paralegal", "contracts", "legal ops",
    "chief legal", "vp legal", "head of legal"
  ],
  other: []
};

// Common tech stack keywords to extract from job descriptions
const techKeywords = [
  // Languages
  "javascript", "typescript", "python", "java", "go", "golang", "rust", "ruby",
  "php", "c++", "c#", "swift", "kotlin", "scala", "r ", "sql", "graphql",

  // Frontend
  "react", "vue", "angular", "next.js", "nextjs", "nuxt", "svelte", "tailwind",
  "css", "sass", "webpack", "vite", "html5",

  // Backend
  "node.js", "nodejs", "express", "fastapi", "django", "flask", "rails",
  "spring", "laravel", ".net", "asp.net",

  // Databases
  "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
  "dynamodb", "cassandra", "sqlite", "oracle", "sql server",

  // Cloud & Infrastructure
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ansible", "jenkins", "github actions", "gitlab ci",
  "circleci", "vercel", "netlify", "heroku", "cloudflare",

  // Data & ML
  "spark", "hadoop", "kafka", "airflow", "snowflake", "databricks",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "tableau", "looker", "power bi", "dbt",

  // Tools & Platforms
  "git", "jira", "confluence", "slack", "notion", "figma", "sketch",
  "salesforce", "hubspot", "zendesk", "intercom", "segment", "amplitude",
  "mixpanel", "datadog", "splunk", "new relic", "sentry",

  // Mobile
  "react native", "flutter", "ios", "android", "xcode", "android studio"
];

/**
 * Categorize a job into a department based on its title
 */
export function categorizeJob(title: string): JobDepartment {
  const lowerTitle = title.toLowerCase();

  // Check each department's keywords
  for (const [dept, keywords] of Object.entries(departmentKeywords)) {
    if (dept === "other") continue;

    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return dept as JobDepartment;
      }
    }
  }

  return "other";
}

/**
 * Extract tech stack mentions from a job description
 */
export function extractTechStack(description: string | null | undefined): string[] {
  if (!description) return [];

  const lowerDesc = description.toLowerCase();
  const foundTech: Set<string> = new Set();

  for (const tech of techKeywords) {
    // Use word boundary-like matching for short keywords
    if (tech.length <= 3) {
      // For very short keywords, require word boundaries
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(description)) {
        foundTech.add(tech.toUpperCase());
      }
    } else {
      if (lowerDesc.includes(tech)) {
        // Normalize the tech name for display
        foundTech.add(normalizeTechName(tech));
      }
    }
  }

  return Array.from(foundTech).slice(0, 20); // Limit to top 20
}

/**
 * Normalize tech name for consistent display
 */
function normalizeTechName(tech: string): string {
  const normalizations: Record<string, string> = {
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "python": "Python",
    "java": "Java",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "c++": "C++",
    "c#": "C#",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "react": "React",
    "vue": "Vue.js",
    "angular": "Angular",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "graphql": "GraphQL",
    "tailwind": "Tailwind CSS",
    "figma": "Figma",
    "salesforce": "Salesforce",
    "hubspot": "HubSpot",
  };

  return normalizations[tech] || tech.charAt(0).toUpperCase() + tech.slice(1);
}

/**
 * Get department display name
 */
export function getDepartmentLabel(department: JobDepartment): string {
  const labels: Record<JobDepartment, string> = {
    engineering: "Engineering",
    sales: "Sales",
    marketing: "Marketing",
    hr: "HR & People",
    finance: "Finance",
    operations: "Operations",
    design: "Design",
    product: "Product",
    customer_success: "Customer Success",
    legal: "Legal",
    other: "Other",
  };
  return labels[department];
}

/**
 * Get department color for UI
 */
export function getDepartmentColor(department: JobDepartment): string {
  const colors: Record<JobDepartment, string> = {
    engineering: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    sales: "bg-green-500/10 text-green-400 ring-green-500/20",
    marketing: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    hr: "bg-pink-500/10 text-pink-400 ring-pink-500/20",
    finance: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
    operations: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    design: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
    product: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20",
    customer_success: "bg-teal-500/10 text-teal-400 ring-teal-500/20",
    legal: "bg-slate-500/10 text-slate-400 ring-slate-500/20",
    other: "bg-gray-500/10 text-gray-400 ring-gray-500/20",
  };
  return colors[department];
}
