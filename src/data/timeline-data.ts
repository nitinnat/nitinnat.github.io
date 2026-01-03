import type { TimelineEntry } from "@/components/timeline/timeline-types";

export const professionalTimeline: TimelineEntry[] = [
  {
    id: "o9-senior-genai",
    title: "Senior Software Engineer, GenAI",
    company: "o9 Solutions",
    dateRange: "April 2025 - Present",
    description: "Building production agentic workflows that combine tool use, retrieval-augmented generation, and persistent memory.",
    expandedContent: "Work involves designing multi-agent orchestration patterns, implementing context management strategies for long-running conversations, building evaluation frameworks for non-deterministic systems, and designing document ingestion pipelines for RAG. Focus on API design and making LLM applications debuggable, robust and observable in production environments.",
    image: {
      src: "/assets/genai_workflow.png",
      alt: "GenAI Agentic Workflow",
      caption: "Illustrative diagram only; does not reflect actual implementation."
    },
    skills: ["python", "fastapi", "langchain", "rag-systems", "llms-transformers"],
    type: "work"
  },
  {
    id: "o9-sde2-ml",
    title: "Software Engineer II, Machine Learning",
    company: "o9 Solutions",
    dateRange: "April 2022 - April 2025",
    description: "Built AutoML pipelines for time series forecasting at retail scale. Designed distributed training infrastructure on Kubernetes, processing historical sales data for 10,000+ store locations using PySpark and TensorFlow.",
    expandedContent: "Implemented hyperparameter optimization strategies, model selection frameworks, and automated retraining pipelines. Later transitioned to LLM-based conversational systems, building prompt engineering frameworks and retrieval pipelines before the tooling ecosystem matured.",
    image: {
      src: "/assets/automl_forecasting.png",
      alt: "AutoML Time Series Forecasting",
      caption: "Illustrative diagram only; does not reflect actual implementation."
    },
    link: {
      href: "https://o9solutions.com/case-studies/coffee-corporation/",
      label: "Read case study"
    },
    skills: ["python", "tensorflow", "pyspark", "kubernetes", "docker", "time-series-forecasting"],
    type: "work"
  },
  {
    id: "o9-sde-ml",
    title: "Software Engineer, Machine Learning",
    company: "o9 Solutions",
    dateRange: "August 2019 - April 2022",
    description: "Built infrastructure for ML platform reliability and scalability. Designed REST APIs for model serving, implemented horizontal scaling strategies, and built monitoring systems for production ML pipelines.",
    expandedContent: "Integrated JupyterHub with custom authentication plugins and resource management for data science workflows. Established CI/CD patterns for ML deployments, bridging the gap between research notebooks and production services.",
    skills: ["python", "fastapi", "kubernetes", "docker", "postgresql"],
    type: "work"
  },
  {
    id: "ub-gra",
    title: "Graduate Research Assistant",
    company: "University at Buffalo",
    dateRange: "September 2018 - May 2019",
    description: "Collaborated with Adobe Research on cursor detection and tracking in screen recording videos. Built an unsupervised approach combining adaptive template discovery, multi-scale matching, and optimal path algorithms.",
    expandedContent: "The method outperformed supervised baselines like Faster-RCNN and online trackers (TLD, CSRT, MIL) without requiring labeled training data. Interesting problem: cursor appearance varies wildly across systems, making supervised learning brittle.",
    image: {
      src: "/assets/cursor_tracking.png",
      alt: "Cursor Tracking System"
    },
    skills: ["python", "computer-vision", "tensorflow"],
    type: "research"
  },
  {
    id: "ub-sra",
    title: "Student Research Assistant",
    company: "University at Buffalo",
    dateRange: "September 2017 - November 2018",
    description: "Worked with Prof. Haimonti Dutta on federated learning before it was called that. Built GADGET, a gossip-based distributed SVM solver that trains models across nodes without centralizing data.",
    expandedContent: "Each node only shares gradient information with neighbors, converging to the global solution through iterative communication. Also worked on NLP problems: named entity recognition and detecting inter-group prejudice patterns in social media text.",
    image: {
      src: "/assets/federated_learning.png",
      alt: "Federated Learning System"
    },
    skills: ["python", "scikit-learn", "federated-learning", "nlp"],
    type: "research"
  },
  {
    id: "clarifai-intern",
    title: "Applied Machine Learning Intern",
    company: "Clarifai",
    dateRange: "May 2018 - August 2018",
    description: "Built hybrid object tracking systems that combine detection and tracking to reduce drift in long videos. Analyzed temporal noise characteristics of industrial depth cameras to improve computer vision pipelines.",
    expandedContent: "Extended internal visualization tools for video annotation and model debugging. Short internship, but got hands-on with production CV systems at a company doing visual recognition at scale.",
    image: {
      src: "/assets/clarifai_tracking.png",
      alt: "Object Tracking System"
    },
    skills: ["python", "pytorch", "computer-vision"],
    type: "work"
  },
  {
    id: "fidelity-sde",
    title: "Software Engineer",
    company: "Fidelity Investments",
    dateRange: "June 2015 - June 2017",
    description: "Built QBot, an enterprise chatbot before transformer models existed. Used ontology-based intent matching, word2vec embeddings, and rule-based dialogue management.",
    expandedContent: "Also developed sentiment analysis systems using topic modeling (LDA) and text classification, hitting 93%+ cross-validation accuracy on internal support tickets. Deployed everything in Docker containers. This was pre-BERT, pre-GPT. Started as an analytics trainee managing metrics for distributed teams of 120+ people. Wrote complex SQL queries pulling data from multiple sources, built Tableau dashboards for KPI tracking and operational metrics.",
    image: {
      src: "/assets/fidelity_chatbot.png",
      alt: "Chatbot System"
    },
    skills: ["python", "nlp", "docker", "sql", "scikit-learn"],
    type: "work"
  },
  {
    id: "iisc-intern",
    title: "Summer Research Intern (Computer Vision)",
    company: "Indian Institute of Science",
    dateRange: "May 2014 - July 2014",
    description: "Undergraduate research on feature extraction for optical character recognition with Dr. Rathna G.N. Compared PCA, Local Binary Patterns, and other classical computer vision techniques.",
    expandedContent: "Built a MATLAB GUI to demonstrate real-time OCR. Early exposure to computer vision and pattern recognition, before my formal training in CS.",
    skills: ["computer-vision"],
    type: "research"
  }
];

export const educationTimeline: TimelineEntry[] = [
  {
    id: "ub-ms",
    title: "Master of Science in Computer Science",
    company: "University at Buffalo",
    dateRange: "2017 - 2019",
    description: "Specialized in computer vision and distributed machine learning.",
    backgroundImage: "/assets/photos/buffalo_tagline.jpg",
    type: "education"
  },
  {
    id: "nitk-btech",
    title: "Bachelor of Technology in Electrical and Electronics Engineering",
    company: "National Institute of Technology Karnataka",
    dateRange: "2011 - 2015",
    description: "Undergraduate degree with early exposure to signal processing and embedded systems.",
    backgroundImage: "/assets/photos/nitk_tagline.webp",
    type: "education"
  }
];
