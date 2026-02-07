---
title: "AI-Assisted Coding: My Systematic Workflow with GitHub Copilot"
date: 2026-02-06
description: "A practical guide to using GitHub Copilot systematically with custom instructions, specialized agents, and persistent memory. Here's what actually works."
tags: [ai, productivity, github-copilot, vscode, workflow]
categories: [ai-tools, engineering]
draft: false
---

## The Problem

For the first year using GitHub Copilot, every session started the same way. I'd explain my coding standards, the AI would follow them for a bit, then five minutes later suggest the exact opposite. By the time I hit token limits, it had forgotten everything. Each session felt like onboarding a new developer who couldn't retain information.

The breakthrough came when I stopped expecting the AI to read my mind and started treating it like an actual team member: give it written onboarding docs, assign it specialized roles, and maintain continuity across sessions.

This is what I do now.

## My Three-Layer Setup

I use three components that work together:

1. **Instructions file** - Persistent context across all sessions
2. **Custom agents** - Specialized roles for different tasks
3. **Implementation logs** - Continuity for multi-day work

![Three-tier architecture showing copilot-instructions.md at foundation, specialized agents in middle, and reusable prompts at top](/assets/copilot_architecture.png)

## Layer 1: The Instructions File

I create `.github/copilot-instructions.md` in every project. GitHub Copilot loads this automatically in every chat session.

Here's what I put in it:

**Project context** (2-3 sentences explaining what this repo does)

**Tech stack** (explicit versions to prevent outdated suggestions):
```markdown
## Tech Stack
- Python 3.11+, FastAPI
- PostgreSQL 16, Redis 7
- Kubernetes 1.28+
- pytest for testing
```

**Code standards** (be directive, not suggestive):
```markdown
## Code Standards
- Use type hints for all function signatures
- Google-style docstrings for public functions only
- No docstrings for simple getters/setters
- 100-character line limit
- Specific exception types, never bare except
```

**Domain patterns** (the stuff you usually explain in code review):
```markdown
## Best Practices
- FastAPI: Use dependency injection for database sessions
- Never commit secrets or API keys
- Always validate external inputs
- Use environment variables for configuration
```

The key: **be opinionated**. Write "Use type hints" not "Prefer type hints." The AI needs directives.

I update this file when:
- Code reviewers repeatedly flag the same issue
- I discover a new pattern I want to enforce
- I adopt new technology

## Layer 2: Specialized Agents

Different tasks need different expertise. I create custom agents in `.github/copilot/agents/` for specific roles. Here are the four I use most:

### @task-planner (plans before implementing)

For complex features, I start with planning:

```markdown
# Task Planner Agent

You create detailed implementation plans for development tasks.

Planning process:
1. Understand requirements and constraints
2. Analyze affected components and dependencies
3. Design technical approach and architecture
4. Break down into step-by-step tasks
5. Identify risks and edge cases
```

Usage:
```
@task-planner Implement rate limiting for our API. Requirements:
100 requests/minute per API key, return 429 when exceeded.
```

It generates a structured plan with technical approach, implementation steps, testing strategy, and risks.

### @code-reviewer (reviews before commits)

```markdown
# Code Reviewer Agent

You review code for security, performance, and quality issues.

Focus areas:
- Security vulnerabilities (hardcoded secrets, SQL injection)
- Performance problems (N+1 queries, inefficient algorithms)
- Code quality (readability, maintainability)
- Missing error handling or edge cases

Categorize feedback: CRITICAL, IMPORTANT, MINOR
```

Before committing:
```
@code-reviewer Review this implementation for security issues,
performance problems, and code quality.
```

### @pr-reviewer (creates pull request descriptions)

```markdown
# PR Reviewer Agent

You create concise, professional PR descriptions.

Format:
- Title under 70 characters
- Brief paragraph explaining the change
- Bullet points of key changes
- No AI attribution or emojis
- Focus on what changed and why
```

After committing:
```
@pr-reviewer Create a PR description for the rate limiting
implementation based on the git diff.
```

### @gemini-image-generator (designs technical diagrams)

```markdown
# Gemini Image Generator Agent

You create detailed prompts for generating technical diagrams
and architecture visualizations.

When designing diagrams:
- Choose format: flowchart, architecture diagram, comparison chart
- Specify layout, labels, arrows, and data flow
- Use clean backgrounds (white/light for technical content)
- Include text labels and clear visual hierarchy
- Prioritize informational clarity over aesthetics
```

For blog posts or documentation:
```
@gemini-image-generator Design a prompt for an architecture diagram
showing the three-layer memory system: instructions file, agents,
and implementation logs.
```

I also create quick prompts in `.github/copilot/prompts/`:
- `/security-review` - Check for hardcoded secrets, SQL injection
- `/optimize-queries` - Identify database performance issues
- `/add-tests` - Generate test cases for selected code

## My Workflow

Here's what a typical feature implementation looks like:

![Complete AI-assisted coding workflow showing circular process from planning through PR creation](/assets/ai_coding_workflow.png)

**1. Plan** (for complex features)
```
@task-planner Implement rate limiting using Redis...
```
Review the plan, answer clarification questions.

**2. Implement**
```
@python-coder Implement the rate limiter according to the plan...
```
Review the generated code carefully.

**3. Test**
Select the code, run:
```
/generate-unit-tests
```
Review tests, add domain-specific cases.

**4. Review**
```
@code-reviewer Review this implementation...
```
Then:
```
/security-review
```
Address critical issues before committing.

**5. Document and PR**
```
@readme-generator Update README with rate limiting documentation...
```
```
@pr-description-generator Create PR description...
```

## Layer 3: Implementation Logs

For multi-day projects, I maintain `IMPLEMENTATION_LOG.md`:

```markdown
# Implementation Log: Rate Limiting Feature

## 2026-02-01: Planning
**Objective**: Redis-backed rate limiting

**Approach**: Sliding window algorithm, middleware pattern

**Key Decisions**:
- Fail open if Redis is down (don't block all traffic)
- Separate Redis instance from session cache

## 2026-02-02: Implementation
**Completed**: RateLimiter class, FastAPI middleware

**Files**: `src/middleware/rate_limiter.py:15-78`

**Issues Fixed**: Race condition in concurrent requests

## Next Steps
- Create monitoring dashboard
```

![Implementation log workflow showing phases from planning through next steps](/assets/implementation_log_workflow.png)

When I hit token limits, I start a fresh session:
```
Read IMPLEMENTATION_LOG.md and continue. Create the monitoring dashboard.
```

The AI has full context without needing conversation history.

## Security Practices

I always:

1. **Run `/security-review`** before committing code touching external inputs
2. **Never trust AI-generated code blindly** - review for hardcoded secrets, SQL injection, missing validation
3. **Sanitize prompts** - replace real API keys with placeholders
4. **Explicitly forbid** logging sensitive data in the instructions file

## What Actually Works

**Works:**
- Explicit instructions ("Use type hints" vs "prefer type hints")
- Specialized agents for different roles
- Implementation logs for continuity
- Starting fresh when context degrades

**Doesn't work:**
- Vague requests ("make this better")
- Blind acceptance of generated code
- Pushing past 100+ turns without starting fresh
- Treating AI as infallible

## Getting Started

Here's what I recommend:

1. **Create `.github/copilot-instructions.md`** with project overview, tech stack, and code standards
2. **Create 2-3 agents** you'll use most (I started with @python-coder and @python-tester)
3. **Try a small task** - implement one simple function
4. **Update instructions** based on what you learn
5. **Iterate** - this is a system that improves with use

## Key Takeaway

AI coding assistants work best with systematic structure. Give them persistent context (instructions file), specialized roles (agents), and continuity (implementation logs). Don't expect them to read your mind—treat them like new team members who need explicit onboarding.

The result isn't less work, it's different work. Less typing, more reviewing. Less syntax debugging, more architectural thinking. It's a productivity multiplier, not a replacement for expertise.

---

## Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Custom Instructions Guide](https://github.blog/ai-and-ml/github-copilot/5-tips-for-writing-better-custom-instructions-for-copilot/)
- [Awesome Copilot](https://github.com/github/awesome-copilot) - Community examples
