const fs = require("fs");
const path = require("path");

const aboutMdxPath = path.join(__dirname, "../content/pages/about.mdx");
const timelineDataPath = path.join(__dirname, "../src/data/timeline-data.ts");

function parseTimelineMarkdown(markdown) {
  const entries = [];
  const lines = markdown.split("\n");
  let currentEntry = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track current section (Professional or Education)
    if (trimmed === "# Professional Timeline") {
      currentSection = "professional";
      continue;
    } else if (trimmed === "# Education Timeline") {
      currentSection = "education";
      continue;
    }

    // Start new entry
    if (trimmed.startsWith("## ")) {
      // Save previous entry
      if (currentEntry) {
        entries.push({ ...currentEntry, section: currentSection });
      }

      currentEntry = {
        id: generateId(trimmed.replace("## ", "")),
        title: trimmed.replace("## ", ""),
        company: "",
        dateRange: "",
        description: "",
        expandedContent: null,
        image: null,
        link: null,
        skills: [],
        backgroundImage: null,
        type: "",
      };
    } else if (currentEntry && trimmed.startsWith("Company:")) {
      currentEntry.company = trimmed.replace("Company:", "").trim();
    } else if (currentEntry && trimmed.startsWith("DateRange:")) {
      currentEntry.dateRange = trimmed.replace("DateRange:", "").trim();
    } else if (currentEntry && trimmed.startsWith("Description:")) {
      currentEntry.description = trimmed.replace("Description:", "").trim();
    } else if (currentEntry && trimmed.startsWith("ExpandedContent:")) {
      currentEntry.expandedContent = trimmed.replace("ExpandedContent:", "").trim();
    } else if (currentEntry && trimmed.startsWith("Image:")) {
      const imageStr = trimmed.replace("Image:", "").trim();
      const parts = imageStr.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        currentEntry.image = {
          src: parts[0],
          alt: parts[1],
          caption: parts[2] || undefined,
        };
      }
    } else if (currentEntry && trimmed.startsWith("Link:")) {
      const linkStr = trimmed.replace("Link:", "").trim();
      const parts = linkStr.split("|").map((p) => p.trim());
      if (parts.length === 2) {
        currentEntry.link = {
          href: parts[0],
          label: parts[1],
        };
      }
    } else if (currentEntry && trimmed.startsWith("Skills:")) {
      const skillsStr = trimmed.replace("Skills:", "").trim();
      currentEntry.skills = skillsStr.split(",").map((s) => s.trim());
    } else if (currentEntry && trimmed.startsWith("BackgroundImage:")) {
      currentEntry.backgroundImage = trimmed.replace("BackgroundImage:", "").trim();
    } else if (currentEntry && trimmed.startsWith("Type:")) {
      currentEntry.type = trimmed.replace("Type:", "").trim();
    }
  }

  // Save last entry
  if (currentEntry) {
    entries.push({ ...currentEntry, section: currentSection });
  }

  return entries;
}

function generateId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateTypeScriptFile(entries) {
  const professional = entries.filter((e) => e.section === "professional");
  const education = entries.filter((e) => e.section === "education");

  const formatEntry = (entry) => {
    let result = `  {\n`;
    result += `    id: "${entry.id}",\n`;
    result += `    title: "${escapeString(entry.title)}",\n`;
    result += `    company: "${escapeString(entry.company)}",\n`;
    result += `    dateRange: "${escapeString(entry.dateRange)}",\n`;
    result += `    description: "${escapeString(entry.description)}",\n`;

    if (entry.expandedContent) {
      result += `    expandedContent: "${escapeString(entry.expandedContent)}",\n`;
    }

    if (entry.image) {
      result += `    image: {\n`;
      result += `      src: "${entry.image.src}",\n`;
      result += `      alt: "${escapeString(entry.image.alt)}",\n`;
      if (entry.image.caption) {
        result += `      caption: "${escapeString(entry.image.caption)}",\n`;
      }
      result += `    },\n`;
    }

    if (entry.link) {
      result += `    link: {\n`;
      result += `      href: "${entry.link.href}",\n`;
      result += `      label: "${escapeString(entry.link.label)}",\n`;
      result += `    },\n`;
    }

    if (entry.skills.length > 0) {
      result += `    skills: [${entry.skills.map((s) => `"${s}"`).join(", ")}],\n`;
    }

    if (entry.backgroundImage) {
      result += `    backgroundImage: "${entry.backgroundImage}",\n`;
    }

    result += `    type: "${entry.type}"\n`;
    result += `  }`;

    return result;
  };

  const professionalLines = professional.map(formatEntry).join(",\n");
  const educationLines = education.map(formatEntry).join(",\n");

  return `import type { TimelineEntry } from "@/components/timeline/timeline-types";

export const professionalTimeline: TimelineEntry[] = [
${professionalLines}
];

export const educationTimeline: TimelineEntry[] = [
${educationLines}
];
`;
}

function escapeString(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
}

function extractTimelineFromComment(mdxContent) {
  // Extract timeline data from MDX comment
  // Format: {/* Timeline data ... */}
  const commentStart = mdxContent.indexOf("{/* Timeline data");

  if (commentStart === -1) {
    return "";
  }

  // Find the end of the comment
  const commentEnd = mdxContent.indexOf("*/}", commentStart);
  if (commentEnd === -1) {
    return "";
  }

  // Extract content between {/* and */}
  const start = commentStart + "{/*".length;
  const end = commentEnd;

  return mdxContent.substring(start, end).trim();
}

function main() {
  try {
    const mdxContent = fs.readFileSync(aboutMdxPath, "utf8");
    const timelineMarkdown = extractTimelineFromComment(mdxContent);

    if (!timelineMarkdown) {
      console.error("Error: Could not find timeline data in about.mdx HTML comment");
      process.exit(1);
    }

    const entries = parseTimelineMarkdown(timelineMarkdown);
    const typeScriptContent = generateTypeScriptFile(entries);

    fs.writeFileSync(timelineDataPath, typeScriptContent);

    const professional = entries.filter((e) => e.section === "professional").length;
    const education = entries.filter((e) => e.section === "education").length;

    console.log(
      `✓ Generated ${professional} professional + ${education} education timeline entries from about.mdx`
    );
  } catch (error) {
    console.error("Error generating timeline data:", error.message);
    process.exit(1);
  }
}

main();
