# Agentic AI Development Skill

> A structured, opinionated methodology for AI-assisted software development that emphasizes planning, quality, and maintainability.

## Philosophy

This skill guides AI agents to operate as highly effective development partners through:

1. **Pre-planning and Constraint** — Extensive planning before coding prevents reward hacking and suboptimal solutions
2. **Documentation as Code** — Plans and context are first-class citizens, committed alongside code
3. **Fail Hard Policy** — All operations must throw exceptions on failure; no silent failures
4. **Human-in-the-Loop** — Developer oversight with AI handling implementation grunt work

---

## Execution Order

For any significant task, follow this sequence:

```
1. ANALYZE  → Repository structure and requirements
2. PLAN     → Create detailed plan in .cursor-plans/
3. IMPLEMENT → Follow plan with TDD methodology
4. DOCUMENT → Update .ai-context/ with decisions and rationale
```

**⚠️ CRITICAL: Do NOT begin implementation until the plan is complete and documented.**

---

## Phase 1: Repository Analysis

Before writing any code, thoroughly analyze:

- [ ] Repository architecture and established patterns
- [ ] Existing dependencies and package versions
- [ ] Testing framework and current test coverage
- [ ] Coding standards and conventions in use
- [ ] Integration points and potential conflicts
- [ ] CI/CD configuration and requirements

### Analysis Output

Create mental model of:
- How this codebase "thinks"
- Where new code should live
- What patterns to follow
- What to avoid based on existing decisions

---

## Phase 2: Implementation Planning

Create a detailed markdown plan in `.cursor-plans/` directory.

### Plan File Naming
```
.cursor-plans/
├── YYYY-MM-DD-feature-name.md
├── YYYY-MM-DD-bugfix-description.md
└── YYYY-MM-DD-refactor-scope.md
```

### Required Plan Sections

```markdown
# [Feature/Task Name]

## Overview
Brief description of what this plan accomplishes.

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Analysis Results
Summary of repository analysis relevant to this task.

## Implementation Strategy

### Approach
[Surgical approach with economy of motion]

### Dependency Strategy
- Existing packages to leverage: [list]
- New packages needed: [list with versions]
- Packages to avoid: [list with reasons]

### Files to Modify
1. `path/to/file.ts` — [what changes and why]
2. `path/to/other.ts` — [what changes and why]

### Files to Create
1. `path/to/new-file.ts` — [purpose]

### Step-by-Step Implementation
1. [ ] Step 1 with clear acceptance criteria
2. [ ] Step 2 with clear acceptance criteria

## Standards Validation

### Programming Principles Checklist
- [ ] SOLID principles applied
- [ ] Separation of concerns maintained
- [ ] DRY — no unnecessary repetition
- [ ] KISS — no unnecessary complexity
- [ ] YAGNI — no speculative features
- [ ] Composition over inheritance where appropriate
- [ ] Principle of least surprise honored

### Fail Hard Policy Compliance
- [ ] All operations throw on failure
- [ ] No silent error suppression
- [ ] No fallback values masking failures
- [ ] Tests fail when they should fail

### Testing Strategy
- [ ] Unit tests for new functionality
- [ ] Integration tests where needed
- [ ] Edge cases covered
- [ ] Error paths tested

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to handle] |
```

---

## Phase 3: Implementation

### Testing Methodology

Follow TDD red-green-refactor cycle:

1. **RED** — Write failing tests first
2. **GREEN** — Write minimal code to pass
3. **REFACTOR** — Clean up while keeping tests green

### Code Standards

Apply these principles to ALL code:

#### SOLID Principles
- **S**ingle Responsibility — One reason to change per class/module
- **O**pen/Closed — Open for extension, closed for modification
- **L**iskov Substitution — Subtypes must be substitutable
- **I**nterface Segregation — Many specific interfaces over one general
- **D**ependency Inversion — Depend on abstractions, not concretions

#### File Organization
- **One concern per file** — Clear, single responsibility
- **Logical grouping** — Related functionality in appropriate directories
- **No monolithic files** — Break large files into focused modules
- **Clear naming** — File names indicate purpose and contents
- **Clean imports** — Proper dependency management between modules
- **Interface boundaries** — Clear contracts between modules

#### Quality Targets
- Performance and scalability considered
- Security best practices followed
- Code maintainability prioritized
- Code readability optimized

### Task Tracking

Use TODO comments for in-progress work:
```typescript
// TODO: [Description of remaining work]
// FIXME: [Description of known issue to address]
```

Check off plan steps as completed.

---

## Phase 4: Documentation

After implementation, update `.ai-context/` directory:

### Documentation Structure
```
.ai-context/
├── ARCHITECTURE.md          # High-level system design
├── CONVENTIONS.md           # Coding standards and patterns
├── DECISIONS.md             # Architectural decision records
├── [FEATURE]-implementation.md  # Feature-specific details
└── TROUBLESHOOTING.md       # Known issues and solutions
```

### Required Documentation Content

For each significant implementation:

1. **What was built** — Clear description of the solution
2. **Why it was built this way** — Rationale for decisions
3. **How it integrates** — Connection points with existing code
4. **How to extend** — Guidance for future developers/AI agents
5. **Known limitations** — Honest assessment of constraints

---

## ⚠️ FAIL HARD POLICY

**This is non-negotiable and must be explicitly addressed in every plan.**

### Required Behavior

✅ **Throw exceptions** when operations fail — do NOT catch and log  
✅ **Let errors propagate** — do NOT add fallback mechanisms for genuine failures  
✅ **Preserve failing tests** — do NOT mark tests as "pass" when they should fail  
✅ **Keep difficult tests** — do NOT delete or skip tests because they're "irritating"  

### Unacceptable Behaviors

❌ `try/catch` blocks that suppress errors with just logging  
❌ Fallback values when operations should fail (empty arrays, null, defaults)  
❌ Changing test assertions to make them pass when underlying issue isn't fixed  
❌ Removing or commenting out tests that expose real problems  
❌ Adding `|| true` or similar hacks to make failing conditions pass  
❌ Replacing specific error conditions with generic "success" responses  

### Acceptable Error Handling

```typescript
// ✅ GOOD: Throw meaningful exceptions
function processData(data: unknown): Result {
  if (!isValidData(data)) {
    throw new ValidationError('Invalid data format', { received: data });
  }
  return transform(data);
}

// ✅ GOOD: Re-throw after cleanup
async function withResource(): Promise<void> {
  const resource = await acquire();
  try {
    await useResource(resource);
  } finally {
    await resource.release(); // Cleanup always runs
  }
  // Errors propagate naturally
}

// ✅ GOOD: Fail fast on preconditions
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}
```

```typescript
// ❌ BAD: Suppressing errors
function processData(data: unknown): Result {
  try {
    return transform(data);
  } catch (error) {
    console.error('Error processing data:', error);
    return []; // Silent failure with fallback
  }
}

// ❌ BAD: Masking failures
function getUser(id: string): User | null {
  try {
    return fetchUser(id);
  } catch {
    return null; // Caller can't distinguish "not found" from "error"
  }
}
```

---

## Context Management

### Directory Structure

Maintain these directories in every project:

```
project-root/
├── .cursor-plans/     # Implementation plans (committed)
├── .ai-context/       # Project documentation (committed)
├── .cursor/           # Cursor-specific config (may be gitignored)
│   └── rules/         # Cursor rules files
└── ...
```

### Cursor Rules

Create `.cursor/rules/*.mdc` files for project-specific guidance:

```markdown
---
description: Project coding standards
globs: ["src/**/*.ts", "src/**/*.tsx"]
---

# [Project Name] Standards

## Overview
[Brief project description]

## Patterns
[Established patterns to follow]

## Error Handling
[Project-specific error handling approach]

## Testing
[Testing conventions]
```

### Providing Context to AI

When starting work, ensure AI has access to:

1. **This SKILL.md** — Core methodology
2. **Relevant .ai-context/ docs** — Project-specific knowledge
3. **Related .cursor-plans/** — Previous decisions
4. **Official documentation** — For technologies in use
5. **Existing code examples** — Patterns to follow

---

## Model Recommendations

### For Complex Features (Large Context Needed)
- **Claude Opus 4** — Largest context window, best for full-app creation
- Use for: New features, major refactors, complex integrations

### For Regular Development
- **Claude Sonnet 4** — Excellent balance of speed and capability
- **Gemini 2.5 Pro** — Strong alternative
- Use for: Bug fixes, incremental features, code review

### Key Settings
- **Agent Mode**: ON (allows autonomous operation)
- **Web Search**: ON (for documentation lookup)
- **Command Allow List**: Configure for common operations

---

## Iterative Review Process

### Developer Responsibilities

1. **Review plans before implementation** — Ensure alignment with requirements
2. **Monitor AI progress** — Follow along and validate thinking
3. **Intervene when needed** — Correct suboptimal decisions promptly
4. **Verify documentation** — Ensure docs reflect actual implementation
5. **Final validation** — Confirm functionality before considering complete

### AI Responsibilities

1. **Create comprehensive plans** — No implementation without approved plan
2. **Follow established patterns** — Respect existing codebase conventions
3. **Run tests continuously** — Maintain green status
4. **Document decisions** — Explain rationale for all significant choices
5. **Report blockers** — Clearly communicate when human input needed

---

## Quick Reference

### Before Starting Any Task
```
□ Read this SKILL.md
□ Analyze repository structure
□ Check .ai-context/ for existing decisions
□ Review related .cursor-plans/
□ Create new plan before coding
```

### During Implementation
```
□ Follow TDD cycle
□ Check off plan steps
□ Run tests frequently
□ Fail hard on errors
□ Document as you go
```

### After Completion
```
□ All tests passing
□ Plan updated with completion status
□ .ai-context/ updated if needed
□ No suppressed errors
□ Code reviewed for standards compliance
```

---

## Additional Resources

See supplementary files in this skill directory:

- `PROMPTS.md` — Ready-to-use prompt templates
- `FAIL-HARD.md` — Detailed fail hard policy examples
- `PLANNING.md` — Plan template and examples
- `CONTEXT.md` — Context management deep dive
