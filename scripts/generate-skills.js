const fs = require("fs");
const path = require("path");

const skillsMarkdownPath = path.join(__dirname, "../content/skills.md");
const skillsDataPath = path.join(__dirname, "../src/data/skills-data.ts");

const categoryMap = {
  frontend: "frontend",
  backend: "backend",
  "ml & genai": "ml",
  "tools & infra": "tools",
  "domain knowledge": "domain",
};

function parseSkillsMarkdown(markdown) {
  const skills = [];
  let currentCategory = null;

  const lines = markdown.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      const categoryName = trimmed.replace("## ", "").toLowerCase();
      currentCategory = categoryMap[categoryName] || null;
    } else if (trimmed.startsWith("- ") && currentCategory) {
      const match = trimmed.match(/^- (.+?)\s*\|\s*(\d)$/);
      if (match) {
        const [, name, proficiencyStr] = match;
        const proficiency = parseInt(proficiencyStr, 10);

        if (proficiency >= 1 && proficiency <= 5) {
          const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          skills.push({
            id,
            name,
            proficiency,
            category: currentCategory,
          });
        }
      }
    }
  }

  return skills;
}

function generateTypeScriptFile(skills) {
  const skillLines = skills
    .map(
      (skill) =>
        `  { id: "${skill.id}", name: "${skill.name}", proficiency: ${skill.proficiency}, category: "${skill.category}" },`
    )
    .join("\n");

  return `export interface Skill {
  id: string;
  name: string;
  proficiency: number; // 1-5 scale
  category: "frontend" | "backend" | "ml" | "tools" | "domain";
}

// Generated from content/skills.md - do not edit directly
export const skillsData: Skill[] = [
${skillLines}
];

export const skillCategories = {
  frontend: "Frontend",
  backend: "Backend",
  ml: "ML & GenAI",
  tools: "Tools & Infra",
  domain: "Domain Knowledge",
};
`;
}

function main() {
  try {
    const markdown = fs.readFileSync(skillsMarkdownPath, "utf8");
    const skills = parseSkillsMarkdown(markdown);
    const typeScriptContent = generateTypeScriptFile(skills);

    fs.writeFileSync(skillsDataPath, typeScriptContent);
    console.log(`✓ Generated ${skills.length} skills from content/skills.md`);
  } catch (error) {
    console.error("Error generating skills data:", error.message);
    process.exit(1);
  }
}

main();
