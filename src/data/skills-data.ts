export interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5 scale
  category: "frontend" | "backend" | "ml" | "tools" | "domain";
}

// Generated from content/skills.md - do not edit directly
export const skillsData: Skill[] = [
  { id: "react", name: "React", proficiency: 4, category: "frontend" },
  { id: "typescript", name: "TypeScript", proficiency: 4, category: "frontend" },
  { id: "tailwindcss", name: "TailwindCSS", proficiency: 4, category: "frontend" },
  { id: "next-js", name: "Next.js", proficiency: 4, category: "frontend" },
  { id: "framer-motion", name: "Framer Motion", proficiency: 3, category: "frontend" },
  { id: "python", name: "Python", proficiency: 5, category: "backend" },
  { id: "fastapi", name: "FastAPI", proficiency: 4, category: "backend" },
  { id: "sql", name: "SQL", proficiency: 4, category: "backend" },
  { id: "docker", name: "Docker", proficiency: 4, category: "backend" },
  { id: "kubernetes", name: "Kubernetes", proficiency: 3, category: "backend" },
  { id: "llms-transformers", name: "LLMs & Transformers", proficiency: 5, category: "ml" },
  { id: "tensorflow", name: "TensorFlow", proficiency: 4, category: "ml" },
  { id: "pytorch", name: "PyTorch", proficiency: 4, category: "ml" },
  { id: "scikit-learn", name: "scikit-learn", proficiency: 4, category: "ml" },
  { id: "pyspark", name: "PySpark", proficiency: 4, category: "ml" },
  { id: "langchain", name: "LangChain", proficiency: 4, category: "ml" },
  { id: "rag-systems", name: "RAG Systems", proficiency: 4, category: "ml" },
  { id: "git", name: "Git", proficiency: 4, category: "tools" },
  { id: "postgresql", name: "PostgreSQL", proficiency: 4, category: "tools" },
  { id: "aws", name: "AWS", proficiency: 3, category: "tools" },
  { id: "gcp", name: "GCP", proficiency: 3, category: "tools" },
  { id: "elasticsearch", name: "Elasticsearch", proficiency: 3, category: "tools" },
  { id: "redis", name: "Redis", proficiency: 3, category: "tools" },
  { id: "computer-vision", name: "Computer Vision", proficiency: 4, category: "domain" },
  { id: "nlp", name: "NLP", proficiency: 4, category: "domain" },
  { id: "time-series-forecasting", name: "Time Series Forecasting", proficiency: 4, category: "domain" },
  { id: "federated-learning", name: "Federated Learning", proficiency: 3, category: "domain" },
  { id: "automl", name: "AutoML", proficiency: 3, category: "domain" },
];

export const skillCategories = {
  frontend: "Frontend",
  backend: "Backend",
  ml: "ML & GenAI",
  tools: "Tools & Infra",
  domain: "Domain Knowledge",
};
