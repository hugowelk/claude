# CLAUDE.md

This file provides guidance for AI assistants (and developers) working with the `hugowelk/claude` repository.

## Project Status

This repository is in its **initial state** — no source code or configuration has been added yet. This document establishes conventions to follow as the project develops.

## Repository Overview

- **Repository**: `hugowelk/claude`
- **Branch strategy**: Feature branches prefixed with `claude/`

## Development Conventions

### Git Workflow

- Create feature branches from `main` (or the default branch once established)
- Branch naming: `claude/<descriptive-name>` or as assigned
- Write clear, concise commit messages that explain *why*, not just *what*
- Push with `git push -u origin <branch-name>`

### Code Style

- Follow the language-specific conventions established by the project's linter/formatter config once added
- Prefer readability and simplicity over cleverness
- Keep functions small and focused on a single responsibility

### Testing

- Tests should be added alongside new functionality
- Run the full test suite before pushing (command TBD once test framework is chosen)

### Dependencies

- Pin dependency versions for reproducibility
- Document why non-obvious dependencies are needed

## Project Structure

*To be updated as the codebase evolves.* Recommended layout:

```
/
├── CLAUDE.md          # This file — AI assistant guidance
├── README.md          # Project overview and setup instructions
├── src/               # Source code
├── tests/             # Test files
└── docs/              # Additional documentation
```

## Commands Reference

*To be populated once the build system is configured.* Expected entries:

| Task | Command |
|------|---------|
| Install dependencies | TBD |
| Run tests | TBD |
| Lint / format | TBD |
| Build | TBD |

## Guidelines for AI Assistants

1. **Read before writing** — always read existing files before proposing changes.
2. **Minimal changes** — only modify what is necessary to accomplish the task. Avoid unrelated refactors.
3. **No secrets** — never commit `.env` files, credentials, or API keys.
4. **Verify work** — run tests and linters when available before considering a task complete.
5. **Update this file** — when adding new tools, scripts, or conventions, update CLAUDE.md to reflect the current state of the project.
