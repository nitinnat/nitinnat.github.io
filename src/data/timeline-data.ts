import type { TimelineEntry } from "@/components/timeline/timeline-types";

export const professionalTimeline: TimelineEntry[] = [
  {
    id: "senior-software-engineer-genai",
    title: "Senior Software Engineer, GenAI",
    company: "o9 Solutions",
    dateRange: "April 2025 - Present",
    description: "Building production-grade GenAI systems with agentic workflows, retrieval-augmented generation, and long-running conversation support.",
    expandedContent: "My work centers on the engineering layer required to ship LLM applications reliably: tool-using agent patterns, RAG ingestion and retrieval pipelines, context + memory management for long conversations, evaluation approaches for non-deterministic behavior, and observability/debuggability in production.",
    image: {
      src: "/assets/genai_workflow.png",
      alt: "GenAI Agentic Workflow",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "fastapi", "llms", "rag-systems", "agentic-ai"],
    type: "work"
  },
  {
    id: "software-engineer-ii-machine-learning",
    title: "Software Engineer II, Machine Learning",
    company: "o9 Solutions",
    dateRange: "April 2022 - April 2025",
    description: "Built large-scale AutoML pipelines for time series forecasting using Python, PySpark, TensorFlow, and Kubernetes.",
    expandedContent: "Focused on developing end-to-end forecasting pipelines and automation that improved accuracy and efficiency, spanning data processing, training workflows, and operationalization. Over time, I also worked on early LLM/conversational workflow efforts as the ecosystem matured.",
    image: {
      src: "/assets/automl_forecasting.png",
      alt: "AutoML Time Series Forecasting",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "tensorflow", "pyspark", "kubernetes", "time-series-forecasting"],
    type: "work"
  },
  {
    id: "software-engineer-machine-learning",
    title: "Software Engineer, Machine Learning",
    company: "o9 Solutions",
    dateRange: "August 2019 - April 2022",
    description: "Worked on scalability, optimization, and monitoring for a large retail forecasting system deployed across 10,000 stores.",
    expandedContent: "Built and maintained big-data/ML platform pieces in a production environment: PySpark + Hadoop workflows, operational monitoring, and tooling that improved reliability and developer experience. Also developed REST APIs and CI/CD pipelines to support horizontal scaling of Hadoop cluster nodes, and integrated/customized JupyterHub (including plugins and Git integration) to improve the data science workflow.",
    skills: ["python", "pyspark", "hadoop", "databricks", "splunk", "jupyterhub", "cicd"],
    type: "work"
  },
  {
    id: "graduate-research-assistant",
    title: "Graduate Research Assistant",
    company: "University at Buffalo",
    dateRange: "September 2018 - May 2019",
    description: "Cursor detection and tracking in Adobe Photoshop screen-recording videos (with Adobe Research).",
    expandedContent: "Implemented a fully unsupervised approach combining adaptive cursor discovery, multi-scale template matching, and optimal path search to recover a high-scoring cursor trajectory across a video—robust to tiny object size, fast motion, and appearance changes. Evaluated against online trackers and Faster R-CNN-based detection methods.",
    image: {
      src: "/assets/cursor_tracking.png",
      alt: "Cursor Tracking System",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "computer-vision", "opencv", "tensorflow"],
    type: "research"
  },
  {
    id: "student-research-assistant",
    title: "Student Research Assistant",
    company: "University at Buffalo",
    dateRange: "September 2017 - November 2018",
    description: "Research with Prof. Haimonti Dutta across distributed machine learning and NLP.",
    expandedContent: "Worked on GADGET, a gossip-based distributed solver for linear SVMs; ran experiments, improved an existing codebase, and supported literature review. Also worked on NLP tasks including NER on tweets and detecting inter-group prejudice in social media text.",
    image: {
      src: "/assets/federated_learning.png",
      alt: "Distributed Learning",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "java", "distributed-systems", "nlp"],
    type: "research"
  },
  {
    id: "applied-machine-learning-intern",
    title: "Applied Machine Learning Intern",
    company: "Clarifai",
    dateRange: "May 2018 - August 2018",
    description: "Built hybrid tracking approaches and analyzed depth sensor noise characteristics.",
    expandedContent: "Developed a single-object tracking approach that periodically interleaved detection to reduce tracker drift; characterized temporal noise distributions for industrial depth sensors; and extended internal visualization tooling for video/image workflows.",
    image: {
      src: "/assets/clarifai_tracking.png",
      alt: "Object Tracking System",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "computer-vision"],
    type: "work"
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    company: "Fidelity Investments",
    dateRange: "August 2016 - June 2017",
    description: "Built an enterprise customer-service chatbot and NLP analytics tools in the pre-LLM era.",
    expandedContent: "Led development of a chatbot using ontology + NLP + ML for intent understanding and response retrieval. Built REST APIs for query expansion and ranking using semantic embeddings (GloVe/Word2Vec), synonym augmentation, NER, and query ranking; containerized components with Docker. Also developed a sentiment/skill-mining tool using techniques like TF-IDF, topic modeling, clustering, and standard classifiers.",
    image: {
      src: "/assets/fidelity_chatbot.png",
      alt: "Enterprise Chatbot",
      caption: "Illustrative diagram only; does not reflect actual implementation.",
    },
    skills: ["python", "nlp", "docker", "java", "sql"],
    type: "work"
  },
  {
    id: "executive-graduate-trainee",
    title: "Executive Graduate Trainee",
    company: "Fidelity Investments",
    dateRange: "June 2015 - July 2016",
    description: "Analytics, KPI reporting, and Tableau-based dashboards for distributed teams.",
    expandedContent: "Managed reporting and analytics for a cross-geo team, consolidated KPIs across multiple datasets/schemas, built interactive Tableau dashboards, partnered with leadership on KPI definitions, and handled Tableau access administration.",
    skills: ["sql", "tableau", "analytics"],
    type: "work"
  }
];

export const educationTimeline: TimelineEntry[] = [
  {
    id: "summer-research-intern-computer-vision",
    title: "Summer Research Intern (Computer Vision)",
    company: "Indian Institute of Science",
    dateRange: "May 2014 - July 2014",
    description: "Classical CV feature extraction + supervised learning for offline OCR (Dr. Rathna G. N.).",
    expandedContent: "Compared feature extraction methods (e.g., PCA, LBP) and supervised learning approaches (e.g., k-NN, one-vs-all SVM), and built MATLAB tooling (including a GUI) to support experiments and visualization.",
    skills: ["computer-vision", "matlab"],
    type: "research"
  },
  {
    id: "master-of-science-ms-computer-science",
    title: "Master of Science (MS), Computer Science",
    company: "University at Buffalo",
    dateRange: "2017 - 2019",
    description: "Focused on computer vision, distributed machine learning, and NLP through research and coursework.",
    backgroundImage: "/assets/photos/buffalo_tagline.jpg",
    type: "education"
  },
  {
    id: "bachelor-of-technology-b-tech-electrical-and-electronics-engineering",
    title: "Bachelor of Technology (B.Tech.), Electrical and Electronics Engineering",
    company: "National Institute of Technology Karnataka",
    dateRange: "2011 - 2015",
    description: "Undergraduate training with foundations in math, signals, and systems.",
    backgroundImage: "/assets/photos/nitk_tagline.webp",
    type: "education"
  }
];
