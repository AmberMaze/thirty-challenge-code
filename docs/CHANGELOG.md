# Thirty Challenge - Project Changelog

> **Standardized changelog for tracking all project changes, edits, and updates**
>
> **Note for Copilot/AI Agents**: All project changes should be documented here with timestamps using the format below. Update both `docs/DocsGuide.md` and `docs/TODOs.md` when making changes.

## 📋 How to Use This Changelog

- **All changes** to the project should be logged here with a timestamp

- **Use consistent formatting** with the sections below

- **Reference related files** that were modified

- **Include rationale** for significant changes

- **AI Agents** should automatically add entries when making edits

---

## [Latest] - 2025-08-21

### ✨ Added - User Flow State Diagrams

- **NEW**: Comprehensive user flow state diagrams generation system
- **Files Created**:
  - `.github/workflows/generate-flow.yml` - CI workflow for automatic diagram generation
  - `scripts/generate-user-flows.mjs` - JavaScript script to generate Draw.io state diagrams
  - `docs/flows/` directory with 6 state diagrams (frontend + backend for each user role)
  - `docs/flows/README.md` - Documentation for flow diagrams
- **Package.json**: Added `flow:generate` script for manual generation
- **Purpose**: Replace single mermaid flow with comprehensive state diagrams showing:
  - Controller flow (frontend + backend)
  - Host flow (frontend + backend)
  - Player flow (frontend + backend)
- **Format**: Draw.io XML format for easy editing and visualization
- **Automation**: GitHub Actions workflow generates diagrams on code changes

## 📅 2025 Changelog

### August 21, 2025 - Documentation Consolidation & MCP Setup

- Consolidated minimal documentation files into `DEVELOPER_GUIDE.md`, `REFERENCE.md`, and enhanced `SETUP.md`

- Merged content from: DocsGuide.md, Guide.md, reactconfig.md, VSCode.md, CHROME_SETUP.md, DAILY_CO_INTEGRATION.md, QUIZ_STRUCTURE.md, Theme.md, ThemeConfigurator.md, and Environment-variables-Netlify.md

- Removed redundant documentation files after successful consolidation

- Updated documentation structure to follow optimal best practices

- Added GitHub Copilot Web MCP server configuration with `copilot-web-mcp.json`

- Enhanced `copilot-setup-steps.yml` workflow with Python, uv, pipx, and Playwright dependencies for MCP servers

- Created comprehensive `GITHUB_COPILOT_MCP_SETUP.md` guide for setting up MCP servers in GitHub Copilot Web

- Updated copilot instructions with MCP server integration details

### Consolidated from FIXES_SUMMARY.md

### Consolidated from IMPROVEMENTS_SUMMARY.md

### Consolidated from VIDEO_CLEANUP_SUMMARY.md

### Consolidated from REFACTORING_SUMMARY.md
