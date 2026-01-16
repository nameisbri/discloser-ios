# Context Management

> Effective context is the difference between an AI that generates generic code and one that produces code that fits your project perfectly.

---

## Why Context Matters

Large language models are trained on vast amounts of code but know nothing about *your* project until you tell them. Without proper context, AI will:

- Use patterns that conflict with your architecture
- Choose dependencies you've intentionally avoided
- Miss integration points with existing code
- Ignore established conventions
- Solve problems you've already solved

With proper context, AI will:

- Follow your established patterns
- Leverage your existing utilities
- Integrate smoothly with your architecture
- Respect your conventions
- Build on prior decisions

---

## Context Sources

### 1. Project Documentation (`.ai-context/`)

This is your project's knowledge base for both humans and AI agents.

```
.ai-context/
├── ARCHITECTURE.md      # System design and patterns
├── CONVENTIONS.md       # Coding standards
├── DECISIONS.md         # Architectural Decision Records
├── SETUP.md             # Development environment
├── TROUBLESHOOTING.md   # Known issues and solutions
└── features/
    ├── auth.md          # Auth implementation details
    └── api.md           # API layer documentation
```

#### ARCHITECTURE.md Template

```markdown
# Architecture Overview

## System Design

[High-level description and diagram if helpful]

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | React | 18.x | With TypeScript |
| State | Zustand | 4.x | Minimal global state |
| API | REST | - | Via fetch wrapper |
| Backend | Node.js | 20.x | Express |
| Database | PostgreSQL | 15.x | Via Prisma |

## Directory Structure

```
src/
├── components/     # Shared UI components
├── features/       # Feature modules (self-contained)
├── hooks/          # Shared custom hooks
├── lib/            # Utilities and clients
├── types/          # Shared type definitions
└── pages/          # Route components
```

## Key Patterns

### [Pattern Name]
[Description and example]

### [Pattern Name]
[Description and example]

## Integration Points

[How major systems connect]

## Deployment

[How the system is deployed]
```

#### CONVENTIONS.md Template

```markdown
# Coding Conventions

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `types.ts` within feature directories

## Code Style

### Imports Order
1. External packages
2. Internal absolute imports
3. Relative imports

### Component Structure
```tsx
// 1. Types/interfaces
interface Props { ... }

// 2. Component
export function Component({ prop1, prop2 }: Props) {
  // 3. Hooks (in consistent order)
  const [state, setState] = useState();
  const query = useQuery();
  
  // 4. Derived values
  const computed = useMemo(() => ..., []);
  
  // 5. Callbacks
  const handleClick = useCallback(() => ..., []);
  
  // 6. Effects
  useEffect(() => ..., []);
  
  // 7. Render
  return <div>...</div>;
}
```

## Error Handling

[Project-specific error handling patterns]

## Testing

[Testing conventions and requirements]
```

#### DECISIONS.md Template (ADR Format)

```markdown
# Architectural Decision Records

## ADR-001: Use Feature-Based Directory Structure

**Date:** 2025-01-01
**Status:** Accepted

### Context
Need to organize code in a way that scales with team and features.

### Decision
Use feature-based directory structure where each feature is self-contained.

### Consequences
- **Positive:** Features are isolated and easy to navigate
- **Positive:** Easy to delete or refactor entire features
- **Negative:** Some duplication of patterns across features

---

## ADR-002: Zustand for State Management

**Date:** 2025-01-02
**Status:** Accepted

### Context
Need lightweight state management without Redux complexity.

### Decision
Use Zustand for global state, React state for local.

### Consequences
- **Positive:** Minimal boilerplate
- **Positive:** TypeScript-first
- **Negative:** Less ecosystem tooling than Redux

---

[Continue with more decisions...]
```

### 2. Implementation Plans (`.cursor-plans/`)

Plans provide context for ongoing and past work.

```
.cursor-plans/
├── 2025-01-15-current-feature.md    # Active work
├── archive/
│   ├── 2025-01-10-setup.md          # Reference for decisions
│   └── 2025-01-12-auth.md           # Reference for patterns
```

When starting new work, reference relevant archived plans:

```markdown
## Related Work
- See `.cursor-plans/archive/2025-01-12-auth.md` for auth patterns
```

### 3. Cursor Rules (`.cursor/rules/`)

Cursor-specific configuration that applies automatically based on file patterns.

```
.cursor/
└── rules/
    ├── general.mdc       # Applies to all files
    ├── typescript.mdc    # Applies to *.ts, *.tsx
    ├── testing.mdc       # Applies to *.test.ts
    └── api.mdc           # Applies to src/api/**
```

#### Rule File Format

```markdown
---
description: Brief description of what this rule covers
globs: ["src/**/*.ts", "src/**/*.tsx"]
---

# Rule Title

## Overview
[What this rule is about]

## Standards
[Specific standards to follow]

## Examples

### Good
```typescript
// Example of correct pattern
```

### Bad
```typescript
// Example of incorrect pattern
```

## Related
- Link to .ai-context/ docs
- Link to external docs
```

#### Example: TypeScript Rule

```markdown
---
description: TypeScript coding standards
globs: ["**/*.ts", "**/*.tsx"]
---

# TypeScript Standards

## Overview
All TypeScript code follows strict typing with no `any` types except where explicitly justified.

## Type Safety
- Enable `strict: true` in tsconfig
- No `any` types without `// @ts-expect-error: [reason]`
- Prefer `unknown` over `any` for truly unknown types
- Use type guards for runtime type checking

## Error Handling
Follow fail-hard policy:
- Throw typed errors, don't return null/undefined
- All errors extend base `AppError` class
- Include error context in error objects

## Examples

### Good
```typescript
function getUser(id: string): Promise<User> {
  // Throws if not found, never returns null
}
```

### Bad
```typescript
function getUser(id: string): Promise<User | null> {
  // Caller doesn't know if null means "not found" or "error"
}
```
```

### 4. External Documentation

For technologies used in the project, reference official docs:

#### In Cursor
Add documentation URLs in Cursor's Docs feature:
- React: https://react.dev/reference
- TypeScript: https://www.typescriptlang.org/docs/
- [Your libraries]

#### In Claude CLI
Reference docs explicitly in prompts:
```
Refer to the React documentation at https://react.dev/reference for 
current best practices on [topic].
```

### 5. Notepads (Cursor-specific)

For code snippets, examples, or references that don't fit elsewhere:

```
Notepad: API Response Patterns

// Standard success response
{
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}

// Standard error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

---

## Context Loading Strategy

### When Starting a New Session

1. **Always load SKILL.md first** — Core methodology
2. **Load relevant .ai-context/ docs** — Project-specific knowledge
3. **Check recent .cursor-plans/** — Current context
4. **Review related code files** — Existing patterns

### For Specific Tasks

| Task Type | Context to Load |
|-----------|-----------------|
| New feature | ARCHITECTURE.md, CONVENTIONS.md, related feature docs |
| Bug fix | Related feature docs, test files, error logs |
| Refactor | DECISIONS.md, affected module docs |
| Testing | CONVENTIONS.md (testing section), existing test patterns |

### Context Priority

When context conflicts, prioritize in this order:

1. **SKILL.md** — Core methodology (fail hard, planning, etc.)
2. **Current plan** — Specific to this task
3. **DECISIONS.md** — Established architectural decisions
4. **CONVENTIONS.md** — Project standards
5. **Existing code patterns** — Consistency with codebase

---

## Maintaining Context

### When to Update

Update `.ai-context/` when:
- Making architectural decisions
- Establishing new patterns
- Discovering important constraints
- Completing significant features
- Finding and fixing tricky bugs

### What to Document

**Do document:**
- Why decisions were made (not just what)
- Patterns to follow (with examples)
- Known limitations and workarounds
- Integration points and dependencies
- Common pitfalls and how to avoid them

**Don't document:**
- Obvious things (standard language features)
- Rapidly changing details (commit to code instead)
- Personal preferences without justification
- Speculative future plans

### Documentation Quality

Good documentation:
```markdown
## API Error Handling

All API errors are wrapped in `ApiError` class with:
- `code`: Machine-readable error code
- `message`: Human-readable description
- `details`: Additional context (optional)

This allows consistent error handling:
```typescript
try {
  await api.createUser(data);
} catch (error) {
  if (error instanceof ApiError && error.code === 'DUPLICATE_EMAIL') {
    showMessage('Email already registered');
    return;
  }
  throw error; // Unexpected errors propagate
}
```

**Why this pattern:** Distinguishes expected errors (duplicate email) 
from unexpected errors (network failure) without suppressing the latter.
```

Poor documentation:
```markdown
## API Error Handling
Use try/catch for API calls.
```

---

## Context for Claude CLI

When using Claude CLI (outside Cursor), provide context explicitly:

### Session Start Template

```markdown
# Project Context

I'm working on [PROJECT_NAME], a [brief description].

## Tech Stack
- [Technology 1]
- [Technology 2]

## Key Patterns
[Most important patterns for this session]

## Current Task
[What we're working on]

## Relevant Files
[List files that will be relevant]

## Standards
Following these key standards:
- Fail hard policy (throw exceptions, no silent failures)
- TDD with comprehensive tests
- [Other relevant standards]
```

### Referencing Documentation

```markdown
Please read the following context files before proceeding:

1. .ai-context/ARCHITECTURE.md — System overview
2. .ai-context/CONVENTIONS.md — Coding standards
3. .cursor-plans/2025-01-15-current-feature.md — Current plan

[Paste contents or reference if Claude has file access]
```

### Mid-Session Context Refresh

If Claude seems to be drifting from project patterns:

```markdown
Reminder: This project follows these specific patterns:
- [Pattern 1]
- [Pattern 2]

Please ensure your implementation aligns with these.
```

---

## Common Context Mistakes

### Mistake 1: No Context

```
❌ "Add user authentication"
```

AI will use generic patterns that may not fit your project.

```
✅ "Add user authentication. See .ai-context/ARCHITECTURE.md for our 
patterns. We use [framework] and store sessions in [storage]. Follow 
the pattern established in src/features/existing-feature/."
```

### Mistake 2: Overwhelming Context

```
❌ [Pastes entire codebase]
```

AI gets confused and may miss important details.

```
✅ [Pastes relevant architecture doc + specific files that will be affected]
```

### Mistake 3: Contradictory Context

```
❌ "Use Redux for state" (but existing code uses Zustand)
```

AI doesn't know which to follow.

```
✅ "We use Zustand for state management (see DECISIONS.md ADR-002). 
Add new state to the existing pattern in src/store/."
```

### Mistake 4: Outdated Context

```
❌ [References documentation from 6 months ago]
```

AI follows patterns that have been superseded.

```
✅ Keep .ai-context/ updated as the project evolves. Archive outdated 
plans to .cursor-plans/archive/.
```

---

## Quick Reference

### Essential Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `SKILL.md` | Core methodology | Every session |
| `.ai-context/ARCHITECTURE.md` | System design | New features |
| `.ai-context/CONVENTIONS.md` | Coding standards | All coding |
| `.ai-context/DECISIONS.md` | Why we do things | When questioning patterns |
| Current `.cursor-plans/*.md` | Active work | Continuing work |

### Context Checklist

Before coding:
- [ ] SKILL.md loaded
- [ ] Relevant .ai-context/ docs reviewed
- [ ] Current plan exists and is complete
- [ ] Related existing code reviewed
- [ ] External docs referenced if needed

During coding:
- [ ] Following established patterns
- [ ] Consistent with existing code
- [ ] Honoring architectural decisions

After coding:
- [ ] .ai-context/ updated if new patterns established
- [ ] Plan updated with completion status
- [ ] Documentation reflects implementation
