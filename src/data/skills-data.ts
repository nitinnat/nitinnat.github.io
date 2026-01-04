export interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5 scale
  category: "frontend" | "backend" | "ml" | "tools" | "domain";
}

// Generated from content/skills.md - do not edit directly
export const skillsData: Skill[] = [
  { id: "python", name: "Python", proficiency: 5, category: "backend" },
  { id: "sql", name: "SQL", proficiency: 4, category: "backend" },
  { id: "c-", name: "C#", proficiency: 2, category: "backend" },
  { id: "java", name: "Java", proficiency: 2, category: "backend" },
  { id: "llms-genai-systems", name: "LLMs & GenAI Systems", proficiency: 5, category: "ml" },
  { id: "machine-learning", name: "Machine Learning", proficiency: 4, category: "ml" },
  { id: "langchain-langgraph", name: "Langchain / Langgraph", proficiency: 4, category: "ml" },
  { id: "rag-and-vector-databases", name: "RAG and Vector Databases", proficiency: 4, category: "ml" },
  { id: "time-series-forecasting", name: "Time Series Forecasting", proficiency: 4, category: "ml" },
  { id: "tensorflow-pytorch", name: "TensorFlow / PyTorch", proficiency: 2, category: "ml" },
  { id: "computer-vision", name: "Computer Vision", proficiency: 4, category: "ml" },
  { id: "nlp", name: "NLP", proficiency: 4, category: "ml" },
  { id: "pyspark", name: "PySpark", proficiency: 2, category: "tools" },
  { id: "git", name: "Git", proficiency: 4, category: "tools" },
  { id: "docker", name: "Docker", proficiency: 4, category: "tools" },
  { id: "postgresql", name: "PostgreSQL", proficiency: 4, category: "tools" },
  { id: "mongodb", name: "MongoDB", proficiency: 4, category: "tools" },
  { id: "redis", name: "Redis", proficiency: 4, category: "tools" },
  { id: "kubernetes-argocd", name: "Kubernetes / ArgoCD", proficiency: 3, category: "tools" },
  { id: "hadoop", name: "Hadoop", proficiency: 2, category: "tools" },
  { id: "databricks", name: "Databricks", proficiency: 3, category: "tools" },
  { id: "splunk", name: "Splunk", proficiency: 3, category: "tools" },
  { id: "jupyter-jupyterhub", name: "Jupyter / JupyterHub", proficiency: 4, category: "tools" },
  { id: "jenkins", name: "Jenkins", proficiency: 3, category: "tools" },
  { id: "airflow", name: "Airflow", proficiency: 3, category: "tools" },
  { id: "linux", name: "Linux", proficiency: 4, category: "tools" },
  { id: "tableau", name: "Tableau", proficiency: 2, category: "tools" },
  { id: "typescript", name: "TypeScript", proficiency: 2, category: "frontend" },
  { id: "html", name: "HTML", proficiency: 2, category: "frontend" },
  { id: "css", name: "CSS", proficiency: 2, category: "frontend" },
];

export const skillCategories = {
  frontend: "Frontend",
  backend: "Backend",
  ml: "ML & GenAI",
  tools: "Tools & Infra",
  domain: "Domain Knowledge",
};
