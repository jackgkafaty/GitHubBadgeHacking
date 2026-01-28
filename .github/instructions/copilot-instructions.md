# GitHub Copilot Instructions

## Communication Style

- **No summaries**: Do not provide summaries of completed work unless explicitly requested. NEVER add long summaries at the end of responses
- **Todo list required**: Generate a todo list for every request and update it as work progresses using the `manage_todo_list` tool
- **Minimal confirmation**: Do not ask for confirmation on routine decisions—proceed with best practices
- **Action-oriented**: Focus on implementation, not explanation
- **Evidence-based**: Only recommend solutions backed by confirmed sources and documentation—not assumptions

## Workflow Process

1. **Analyze first**: Before working on any issue, identify all related files and potential conflicts
2. **Evaluate options**: Consider multiple approaches and implement the best solution that fully complies with the request
3. **Test before claiming success**: Never state something works without testing. Wait for user validation before proceeding
4. **Preserve existing design**: Never change UI element styles or designs unless specifically instructed to do so
5. **No automatic pushes**: Never push changes to GitHub unless explicitly requested. Each push requires explicit user approval—previous approval does not carry over to new changes

## Core Principles

- **Best practices first**: Always follow industry best practices and security standards
- **Latest technologies**: Fetch and use the latest stable versions of frameworks and libraries
- **Sustainable architecture**: Keep architecture clean, maintainable, and scalable
- **Security by default**: Implement security measures proactively (input validation, sanitization, auth, etc.)
- **Use all available tools**: Leverage all available tools and capabilities to complete tasks efficiently—don't limit yourself to a subset when more options exist

## Available Tools & When to Use Them

### Code & File Operations

- `read_file` - Read file contents before making edits
- `replace_string_in_file` - Edit existing files (include 3-5 lines of context)
- `multi_replace_string_in_file` - Batch multiple edits efficiently
- `create_file` - Create new files
- `file_search` - Find files by glob pattern (e.g., `**/*.ts`)
- `grep_search` - Fast text/regex search across workspace
- `semantic_search` - Natural language search for code or concepts
- `list_dir` - Explore directory structure

### Terminal & Execution

- `run_in_terminal` - Execute shell commands (install packages, run scripts, git operations)
- `get_terminal_output` - Check output of background processes
- `create_and_run_task` - Create VS Code tasks for builds/runs

### Code Intelligence

- `list_code_usages` - Find all references/usages of a symbol
- `get_errors` - Check for compile/lint errors after edits

### Research & Documentation

- `fetch_webpage` - Fetch content from URLs for up-to-date documentation
- `vscode-websearchforcopilot_webSearch` - Search the web for current information
- `github_repo` - Search GitHub repositories for code examples

### GitHub Integration

- `mcp_io_github_git_*` - GitHub operations (PRs, issues, branches, files)
- `activate_*` - Activate tool groups for GitHub management (PRs, issues, releases, etc.)

### Container Management

- `mcp_copilot_conta_*` - Docker container operations (inspect, logs, networks)
- `activate_container_*` - Activate container management tool groups

### Project Management

- `manage_todo_list` - Track task progress (REQUIRED for all multi-step work)
- `runSubagent` - Delegate complex research or multi-step tasks

## Frontend Development

### Tailwind CSS (Mandatory)

- **Always use Tailwind CSS** from the start for every project
- **Mobile-first approach**: Design for mobile screens first, then scale up
- Reference: https://tailwindcss.com/docs
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Ensure all apps resize correctly across all device sizes

### Responsive Design Requirements

```
- Default styles = mobile
- sm: (640px+) = small tablets
- md: (768px+) = tablets
- lg: (1024px+) = laptops
- xl: (1280px+) = desktops
- 2xl: (1536px+) = large screens
```

## UI Component Standards

**IMPORTANT**: Follow the guidelines in `ui-standards.instructions.md` for all UI work.

### Key Requirements

- **Select must match Input**: Select dropdowns must have identical styling to Input fields (px-4 py-3, rounded-xl, w-full)
- **Text overflow protection**: Always use `truncate` or `line-clamp-*` to prevent text overflow
- **Responsive grids**: Use `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` patterns for form layouts
- **Mobile-first**: All layouts must work on mobile before adding responsive enhancements
- **Container max-width**: Use `max-w-screen-2xl mx-auto` for page containers

### Component Usage

```tsx
// Always import from @/components/ui
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
```

## Security Best Practices

- Sanitize all user inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization
- Use HTTPS and secure headers
- Never expose sensitive data in client-side code
- Follow OWASP guidelines (see security-practices.instructions.md)

## Dependency Management

### CRITICAL: Package Version Requirements

- **NEVER use beta, alpha, RC, or pre-release packages** - Always use the latest stable GA (Generally Available) version
- **Always verify the LATEST version** - Before installing ANY package, check npm/npmjs.com for the current stable version
- **Check version on EVERY install** - Even for familiar packages, verify the latest GA version before installing
- **Remove version prefixes when checking** - "5.0.0-beta.30" is NOT stable; "4.24.13" IS stable
- **Verify release status** - Look for "Latest" tag on npm, not "Next" or "Beta"

### Package Health Requirements

- **No deprecated packages**: Never use deprecated or unmaintained packages. Always check for deprecation warnings
- **No vulnerabilities**: Before suggesting a package, verify it has no known security vulnerabilities
- **Validate before suggesting**: Check package health on npm before recommending (downloads, last publish date, issues)
- **Compatibility check**: Ensure new packages are compatible with existing dependencies to prevent breaking changes
- **Prefer actively maintained**: Choose packages with recent updates (within 6 months), active maintainers, and good community support

### Version Verification Process

1. Go to https://www.npmjs.com/package/<package-name>
2. Check the "Version" field in the sidebar - this is the latest stable version
3. Look for "Latest" tag, NOT "Next" or "Beta"
4. Verify the "Last publish" date is recent
5. ONLY THEN install the package with the exact stable version

## Code Quality

- Write clean, readable, self-documenting code
- Use TypeScript when possible for type safety
- Implement proper error handling
- Write tests for critical functionality
- Follow DRY (Don't Repeat Yourself) principles

## Problem Resolution

- **Monitor Problems tab**: Constantly check the VS Code Problems tab during development
- **Fix immediately**: Address all errors, warnings, and issues as soon as they appear
- **Validate after changes**: After every code change or build, check for new problems and resolve them before proceeding
- **No unresolved issues**: Never leave a task with unresolved problems in the codebase
