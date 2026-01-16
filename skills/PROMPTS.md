# Prompt Templates

> Ready-to-use prompts for common development scenarios. Copy, customize, and use.

---

## Repository Initialization Prompt

Use when creating a new project from scratch.

```markdown
# REPOSITORY INITIALIZATION

Create a new [TYPE] project with the following specifications:

## Project Details
- Name: [PROJECT_NAME]
- Description: [BRIEF_DESCRIPTION]
- Repository: [GITHUB_ORG]/[REPO_NAME]

## Technical Stack
- Language: [LANGUAGE]
- Framework: [FRAMEWORK]
- Build Tool: [BUILD_TOOL]
- Testing: [TEST_FRAMEWORK]

## Requirements
- [ ] Initialize git repository
- [ ] Set up [PACKAGE_MANAGER] with appropriate config
- [ ] Configure [TEST_FRAMEWORK] with example tests
- [ ] Set up linting ([LINTER]) and formatting ([FORMATTER])
- [ ] Create pre-commit hooks for lint/format/test
- [ ] Configure GitHub CI to run tests and linting
- [ ] Create comprehensive README.md
- [ ] Initialize .cursor-plans/ directory
- [ ] Initialize .ai-context/ directory with ARCHITECTURE.md

## Standards
- Modern [LANGUAGE] best practices
- Structured, maintainable codebase
- CI must report green before completion
- Follow fail-hard policy for all error handling

## Additional Context
[ANY_SPECIAL_REQUIREMENTS]

Create a plan first, then we'll review together before proceeding.
```

### Example: TypeScript React App

```markdown
# REPOSITORY INITIALIZATION

Create a new web application project with the following specifications:

## Project Details
- Name: task-tracker
- Description: A minimalist task tracking application
- Repository: myorg/task-tracker

## Technical Stack
- Language: TypeScript (strict mode)
- Framework: React 18 with Vite
- Build Tool: Vite
- Testing: Vitest + React Testing Library

## Requirements
- [ ] Initialize git repository
- [ ] Set up pnpm with appropriate config
- [ ] Configure Vitest with example tests
- [ ] Set up ESLint (flat config) and Prettier
- [ ] Create pre-commit hooks with Husky + lint-staged
- [ ] Configure GitHub Actions for CI
- [ ] Create comprehensive README.md
- [ ] Initialize .cursor-plans/ directory
- [ ] Initialize .ai-context/ directory with ARCHITECTURE.md

## Standards
- Modern TypeScript best practices
- Functional React components with hooks
- CI must report green before completion
- Follow fail-hard policy for all error handling

Create a plan first, then we'll review together before proceeding.
```

---

## Feature Development Prompt

Use for implementing new features in an existing project.

```markdown
# FEATURE: [FEATURE_NAME]

## Description
[DETAILED_DESCRIPTION_OF_FEATURE]

## User Stories
- As a [USER_TYPE], I want [CAPABILITY] so that [BENEFIT]
- As a [USER_TYPE], I want [CAPABILITY] so that [BENEFIT]

## Acceptance Criteria
- [ ] [CRITERION_1]
- [ ] [CRITERION_2]
- [ ] [CRITERION_3]

## Technical Constraints
- [ANY_TECHNICAL_REQUIREMENTS]
- [PERFORMANCE_REQUIREMENTS]
- [INTEGRATION_REQUIREMENTS]

## EXECUTION ORDER
1. **ANALYZE** the repository and requirements
2. **CREATE** the implementation plan (.cursor-plans directory)
3. **BEGIN** implementation following the plan
4. **DOCUMENT** final implementation (.ai-context directory)

## PHASE 1: REPOSITORY ANALYSIS
Thoroughly analyze the repository structure, existing codebase, and requirements. Consider:
- Repository architecture and patterns
- Existing dependencies and packages
- Current testing framework and setup
- Coding standards and best practices in use
- Integration points and potential conflicts

## PHASE 2: IMPLEMENTATION PLANNING
Create a detailed markdown plan in the `.cursor-plans` directory that includes:

### Plan Requirements:
- **Surgical approach**: Economy of motion, minimal effort, no unnecessary complexity
- **Dependency strategy**: Use existing packages where possible, or latest versions of widely-adopted packages
- **Step-by-step breakdown**: Detailed implementation steps validated against repo structure
- **Context documentation**: Include analysis results, examples, and rationale for decisions

### Implementation Standards (validate in plan):
- **FAIL HARD REQUIREMENT**: All solutions must fail hard with exceptions on failure
- **No reward hacking**: Implement genuine solutions, not unsustainable workarounds
- **Testing coverage**: Full validation using the repository's testing framework
- **Programming principles** (must be validated in plan):
  - SOLID principles
  - Separation of concerns
  - DRY principle
  - KISS principle
  - YAGNI principle
  - Composition over inheritance
  - Principle of least surprise
- **File organization and modularity** (must be explicitly planned):
  - Separate files for separate concerns
  - Logical file structure
  - Avoid monolithic files
  - Clear naming conventions
  - Proper imports/exports
  - Interface boundaries
- **Optimization targets**:
  - Performance and scalability
  - Security best practices
  - Code maintainability
  - Code readability
- **Package management**:
  - Research latest versions before adding dependencies
  - Add packages to appropriate project files

## ⚠️ CRITICAL: FAIL HARD POLICY
**This is non-negotiable and must be explicitly addressed in your plan:**

### REQUIRED BEHAVIOR:
- **Throw exceptions** when operations fail - do NOT catch and log
- **Let errors propagate** - do NOT add fallback mechanisms for genuine failures
- **Preserve failing tests** - do NOT mark tests as "pass" when they should fail
- **Keep difficult tests** - do NOT delete or skip tests because they're "irritating"

### UNACCEPTABLE BEHAVIORS:
❌ `try/catch` blocks that suppress errors with just logging
❌ Fallback values when operations should fail
❌ Changing test assertions to make them pass when the underlying issue isn't fixed
❌ Removing or commenting out tests that expose real problems
❌ Adding `|| true` or similar hacks to make failing conditions pass
❌ Replacing specific error conditions with generic "success" responses

### ACCEPTABLE ERROR HANDLING:
✅ Throwing meaningful exceptions with context
✅ Re-throwing caught exceptions after cleanup
✅ Validating inputs and throwing on invalid data
✅ Failing fast when preconditions aren't met

## PHASE 3: IMPLEMENTATION APPROACH
- **Task tracking**: Use todo management to track and check off completed tasks
- **Testing methodology**: Follow TDD red-green-refactor cycle
- **Test execution**: Run tests manually as per repository documentation
- **Code standards**: Adhere to repository's coding standards for contribution-ready code

## PHASE 4: FINAL DOCUMENTATION
Create comprehensive documentation in the `.ai-context` directory covering:
- Implementation details and architectural decisions
- How the solution addresses each requirement
- Context for future developers and AI agents
- Integration points and maintenance considerations

## CRITICAL:
- Do NOT begin implementation until the plan is complete and documented
- Ensure the plan addresses every requirement listed above
- Validate each implementation step against the repository structure
```

---

## Bug Fix Prompt

Use for fixing bugs with proper analysis and testing.

```markdown
# BUG FIX: [BUG_TITLE]

## Bug Description
[CLEAR_DESCRIPTION_OF_THE_BUG]

## Reproduction Steps
1. [STEP_1]
2. [STEP_2]
3. [STEP_3]

## Expected Behavior
[WHAT_SHOULD_HAPPEN]

## Actual Behavior
[WHAT_ACTUALLY_HAPPENS]

## Error Messages/Logs
```
[PASTE_RELEVANT_ERROR_OUTPUT]
```

## Environment
- [RELEVANT_ENV_INFO]

## EXECUTION ORDER
1. **REPRODUCE** — Verify the bug exists and understand its scope
2. **ANALYZE** — Identify root cause, not just symptoms
3. **PLAN** — Document fix approach in .cursor-plans/
4. **TEST FIRST** — Write failing test that exposes the bug
5. **FIX** — Implement minimal fix that passes the test
6. **VERIFY** — Ensure no regressions introduced

## Requirements
- [ ] Bug must be reproduced before fixing
- [ ] Failing test must be written BEFORE the fix
- [ ] Root cause must be identified (not just symptoms)
- [ ] Fix must be minimal and focused
- [ ] All existing tests must still pass
- [ ] No silent error suppression in the fix

## ⚠️ FAIL HARD REMINDER
The fix must NOT:
- Suppress the error with try/catch that just logs
- Return fallback values that mask the failure
- Remove or modify tests to make them pass
- Add workarounds that don't address root cause
```

---

## Refactoring Prompt

Use for refactoring code while maintaining functionality.

```markdown
# REFACTOR: [REFACTOR_SCOPE]

## Motivation
[WHY_THIS_REFACTOR_IS_NEEDED]

## Scope
Files/modules affected:
- [FILE_1]
- [FILE_2]

## Goals
- [ ] [GOAL_1]
- [ ] [GOAL_2]

## Constraints
- [ ] No functional changes
- [ ] All existing tests must pass
- [ ] Performance must not degrade

## EXECUTION ORDER
1. **ANALYZE** — Understand current implementation thoroughly
2. **PLAN** — Document refactoring approach in .cursor-plans/
3. **VERIFY TESTS** — Ensure comprehensive test coverage exists
4. **REFACTOR** — Make changes incrementally
5. **VALIDATE** — Run tests after each significant change

## Principles to Apply
- [ ] Single Responsibility Principle
- [ ] Separation of Concerns
- [ ] DRY (Don't Repeat Yourself)
- [ ] KISS (Keep It Simple)
- [ ] Clear naming conventions
- [ ] Proper file organization

## Success Criteria
- All tests pass (no modifications to test assertions)
- Code is more readable/maintainable
- No new dependencies added unnecessarily
- Performance benchmarks maintained
```

---

## Code Review Prompt

Use for AI-assisted code review.

```markdown
# CODE REVIEW REQUEST

## Files to Review
- [FILE_1]
- [FILE_2]

## Focus Areas
- [ ] Correctness — Does it do what it's supposed to?
- [ ] Error handling — Does it fail hard appropriately?
- [ ] Testing — Is coverage adequate?
- [ ] Performance — Any obvious issues?
- [ ] Security — Any vulnerabilities?
- [ ] Maintainability — Will future developers understand this?

## Review Against Standards

### Fail Hard Policy Compliance
- Are there any try/catch blocks that suppress errors?
- Are there fallback values that mask failures?
- Do tests properly assert failure conditions?

### SOLID Principles
- Single Responsibility: Does each class/module have one reason to change?
- Open/Closed: Is the code open for extension, closed for modification?
- Liskov Substitution: Are subtypes properly substitutable?
- Interface Segregation: Are interfaces appropriately specific?
- Dependency Inversion: Do high-level modules depend on abstractions?

### Code Organization
- Are files focused on single concerns?
- Are naming conventions clear and consistent?
- Is the file structure logical?
- Are imports/exports well-organized?

## Output Format
Provide review as:
1. **Critical Issues** — Must be fixed
2. **Suggestions** — Should be considered
3. **Nitpicks** — Minor style/preference items
4. **Positive Notes** — What's done well
```

---

## Documentation Prompt

Use for generating or improving documentation.

```markdown
# DOCUMENTATION: [DOC_TYPE]

## Scope
[WHAT_NEEDS_TO_BE_DOCUMENTED]

## Target Audience
- [ ] Future developers
- [ ] AI agents working on this codebase
- [ ] End users
- [ ] API consumers

## Documentation Type
- [ ] Architecture overview (.ai-context/ARCHITECTURE.md)
- [ ] API documentation
- [ ] README updates
- [ ] Inline code comments
- [ ] Decision records (.ai-context/DECISIONS.md)

## Requirements
- [ ] Accurate reflection of current implementation
- [ ] Clear explanation of WHY, not just WHAT
- [ ] Examples where helpful
- [ ] Links to related documentation
- [ ] Maintenance considerations noted

## Structure for .ai-context/ Documents

```markdown
# [Topic Name]

## Overview
[Brief summary]

## Background
[Context and motivation]

## Implementation Details
[How it works]

## Design Decisions
[Why it was built this way]

## Integration Points
[How it connects to other parts]

## Future Considerations
[What might change, limitations]
```
```

---

## Quick Prompts

### Fix This Error
```
Error: [PASTE_ERROR]

Analyze this error following fail-hard principles:
1. What is the root cause?
2. What is the minimal fix?
3. Write a test that would have caught this
4. Implement the fix
```

### Explain This Code
```
Explain this code's purpose, patterns used, and any potential issues:
[PASTE_CODE]
Focus on: correctness, error handling, testability, maintainability
```

### Add Tests for This
```
Write comprehensive tests for:
[PASTE_CODE_OR_FILE_PATH]

Include:
- Happy path tests
- Edge cases
- Error conditions (that should throw)
- Integration tests if applicable

Tests must fail when the code is broken, not pass silently.
```

### Review My Plan
```
Review this implementation plan for completeness and issues:
[PASTE_PLAN_OR_PATH]

Check for:
- Fail hard policy compliance
- SOLID principles addressed
- Testing strategy adequate
- Risks identified
- Steps are detailed enough
```

---

## Anti-Patterns to Avoid in Prompts

❌ **Don't say:**
- "Make it work somehow"
- "Just fix the tests"
- "Suppress the errors for now"
- "We'll add tests later"

✅ **Do say:**
- "Find and fix the root cause"
- "Ensure tests fail when behavior is wrong"
- "Throw meaningful errors with context"
- "Write tests first, then implement"
