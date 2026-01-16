# Implementation Planning

> Comprehensive guide to creating effective implementation plans that guide AI agents toward high-quality solutions.

---

## Why Plan First?

Without a plan, AI agents tend to:
- Start coding immediately, missing context
- Make assumptions that conflict with existing patterns
- Implement solutions that don't integrate well
- Skip important considerations (testing, error handling)
- "Reward hack" by taking shortcuts to appear done

With a plan, AI agents:
- Understand the full scope before coding
- Respect existing architecture and patterns
- Consider edge cases and error handling upfront
- Commit to testing strategy before implementation
- Have clear success criteria to work toward

---

## Directory Structure

```
.cursor-plans/
├── 2025-01-15-user-authentication.md      # Feature plan
├── 2025-01-16-fix-login-race-condition.md # Bug fix plan
├── 2025-01-17-refactor-api-layer.md       # Refactor plan
└── archive/                                # Completed plans
    └── 2025-01-10-initial-setup.md
```

### Naming Convention

```
YYYY-MM-DD-brief-description.md
```

- Date prefix enables chronological sorting
- Brief description (3-5 words) identifies the work
- Use lowercase with hyphens

---

## Plan Template

```markdown
# [Feature/Task Name]

**Date:** YYYY-MM-DD
**Status:** Draft | In Review | Approved | In Progress | Completed
**Author:** [Human or AI]

## Overview

[2-3 sentence summary of what this plan accomplishes]

## Background

[Context needed to understand why this work is being done]

### Related Work
- Link to related .cursor-plans/ if any
- Link to relevant .ai-context/ documentation
- External references if needed

## Requirements

### Functional Requirements
- [ ] FR1: [Specific, testable requirement]
- [ ] FR2: [Specific, testable requirement]

### Non-Functional Requirements
- [ ] NFR1: Performance/security/accessibility requirement
- [ ] NFR2: Performance/security/accessibility requirement

### Out of Scope
- [What this plan explicitly does NOT cover]

## Analysis

### Repository Analysis
- **Architecture pattern:** [e.g., MVC, Clean Architecture, etc.]
- **Relevant existing code:** [List files/modules that will be affected]
- **Established conventions:** [Patterns to follow]
- **Testing setup:** [Test framework, coverage requirements]

### Integration Points
- [System A] — [How this work integrates]
- [System B] — [How this work integrates]

### Potential Conflicts
- [Describe any potential conflicts with existing code]

## Implementation Strategy

### Approach
[High-level description of the surgical approach]

### Dependency Analysis

#### Existing Dependencies to Leverage
| Package | Version | Purpose |
|---------|---------|---------|
| [pkg1] | x.y.z | [Why we're using it] |

#### New Dependencies Required
| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| [pkg1] | x.y.z | [Purpose] | [Why this package] |

#### Dependencies to Avoid
| Package | Reason |
|---------|--------|
| [pkg1] | [Why not to use] |

### Files to Modify

| File | Changes | Reason |
|------|---------|--------|
| `src/path/file.ts` | [Brief description] | [Why] |

### Files to Create

| File | Purpose |
|------|---------|
| `src/path/new-file.ts` | [What it does] |
| `src/path/new-file.test.ts` | [Tests for new-file] |

### Files to Delete
| File | Reason |
|------|--------|
| `src/path/old-file.ts` | [Why removing] |

## Step-by-Step Implementation

### Phase 1: [Phase Name]

#### Step 1.1: [Step Description]
- [ ] Action item 1
- [ ] Action item 2
- **Acceptance Criteria:** [How we know this step is done]
- **Tests to Write:** [List test cases]

#### Step 1.2: [Step Description]
- [ ] Action item 1
- **Acceptance Criteria:** [How we know this step is done]
- **Tests to Write:** [List test cases]

### Phase 2: [Phase Name]
...

## Standards Validation

### Fail Hard Policy Compliance

#### Error Handling Approach
[Describe how errors will be handled in this implementation]

#### Verification Checklist
- [ ] All new functions throw on failure (no silent returns)
- [ ] No try/catch blocks that suppress errors
- [ ] No fallback values masking genuine failures
- [ ] Error messages include meaningful context
- [ ] Tests verify error conditions throw appropriately

### Programming Principles

#### SOLID Compliance
- [ ] **S**ingle Responsibility: Each new file has one clear purpose
- [ ] **O**pen/Closed: Existing code extended, not modified where possible
- [ ] **L**iskov Substitution: Any new inheritance is properly substitutable
- [ ] **I**nterface Segregation: Interfaces are specific, not bloated
- [ ] **D**ependency Inversion: High-level modules depend on abstractions

#### Other Principles
- [ ] **DRY:** No unnecessary duplication introduced
- [ ] **KISS:** Solution is as simple as possible
- [ ] **YAGNI:** No speculative features included
- [ ] **Composition over Inheritance:** Favored where appropriate
- [ ] **Principle of Least Surprise:** Code behaves as expected

### File Organization
- [ ] Each file has single, clear responsibility
- [ ] Related functionality properly grouped
- [ ] No monolithic files (max ~200-300 lines)
- [ ] Clear, descriptive file names
- [ ] Clean import/export structure
- [ ] Clear interface boundaries between modules

### Testing Strategy

#### Test Types Required
- [ ] Unit tests for individual functions/classes
- [ ] Integration tests for module interactions
- [ ] E2E tests if user-facing changes

#### Coverage Requirements
- [ ] New code has > 80% coverage
- [ ] All error paths are tested
- [ ] Edge cases identified and tested

#### Test Cases Planned
| Test | Type | Description |
|------|------|-------------|
| [test name] | Unit | [What it verifies] |
| [test name] | Integration | [What it verifies] |

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [How to handle] |

## Success Criteria

- [ ] All requirements from this plan are implemented
- [ ] All planned tests pass
- [ ] No regressions in existing tests
- [ ] Code review completed
- [ ] Documentation updated in .ai-context/
- [ ] CI/CD passes

## Open Questions

- [ ] [Question that needs human input]
- [ ] [Decision that affects implementation]

## Notes

[Any additional notes, considerations, or context]

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| YYYY-MM-DD | [Author] | Initial draft |
```

---

## Example: Authentication Feature Plan

```markdown
# User Authentication with OAuth 2.0

**Date:** 2025-01-15
**Status:** Approved
**Author:** AI (with human review)

## Overview

Implement OAuth 2.0 authentication flow allowing users to sign in with Google 
and GitHub. This establishes the foundation for user identity throughout the 
application.

## Background

The application currently has no authentication. Users need to sign in to 
access personalized features (saved preferences, history, etc.).

### Related Work
- `.ai-context/ARCHITECTURE.md` — Overall system design
- No prior authentication work

## Requirements

### Functional Requirements
- [ ] FR1: Users can sign in with Google OAuth
- [ ] FR2: Users can sign in with GitHub OAuth
- [ ] FR3: Users can sign out
- [ ] FR4: Authentication state persists across page reloads
- [ ] FR5: Protected routes redirect to login when unauthenticated

### Non-Functional Requirements
- [ ] NFR1: OAuth flow completes in < 3 seconds
- [ ] NFR2: Tokens stored securely (httpOnly cookies)
- [ ] NFR3: PKCE flow used for additional security

### Out of Scope
- Email/password authentication (future work)
- Multi-factor authentication (future work)
- Account linking between providers (future work)

## Analysis

### Repository Analysis
- **Architecture pattern:** Feature-based modules in `/src/features/`
- **Relevant existing code:** 
  - `/src/lib/api.ts` — API client (will add auth headers)
  - `/src/components/Layout.tsx` — Needs auth state
- **Established conventions:** 
  - Custom hooks in `/src/hooks/`
  - Shared types in `/src/types/`
- **Testing setup:** Vitest + React Testing Library

### Integration Points
- API client — Must include auth headers
- Router — Must check auth for protected routes
- UI components — Must show auth state

### Potential Conflicts
- None identified

## Implementation Strategy

### Approach
Use established patterns with secure defaults. Leverage existing OAuth 
libraries rather than implementing from scratch. Keep auth state in React 
context with server-side validation.

### Dependency Analysis

#### Existing Dependencies to Leverage
| Package | Version | Purpose |
|---------|---------|---------|
| react-router-dom | 6.x | Route protection |

#### New Dependencies Required
| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| @auth/core | 0.x | OAuth implementation | Well-maintained, secure defaults |

#### Dependencies to Avoid
| Package | Reason |
|---------|--------|
| passport | Overcomplicated for our needs |

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/auth/AuthProvider.tsx` | React context for auth state |
| `src/features/auth/useAuth.ts` | Hook to access auth context |
| `src/features/auth/oauth.ts` | OAuth flow implementation |
| `src/features/auth/types.ts` | Auth-related types |
| `src/features/auth/index.ts` | Public exports |
| `src/features/auth/__tests__/` | Test directory |

### Files to Modify

| File | Changes | Reason |
|------|---------|--------|
| `src/App.tsx` | Wrap with AuthProvider | Enable auth context |
| `src/lib/api.ts` | Add auth header injection | Authenticated API calls |
| `src/router.tsx` | Add protected route wrapper | Route protection |

## Step-by-Step Implementation

### Phase 1: Auth Foundation

#### Step 1.1: Create Auth Types
- [ ] Define User type
- [ ] Define AuthState type
- [ ] Define OAuth provider configs
- **Acceptance Criteria:** Types compile without errors
- **Tests to Write:** N/A (type-only)

#### Step 1.2: Create Auth Context
- [ ] Implement AuthProvider component
- [ ] Implement useAuth hook
- [ ] Handle loading/error states
- **Acceptance Criteria:** Context provides auth state to children
- **Tests to Write:**
  - AuthProvider renders children
  - useAuth throws outside provider
  - Auth state updates propagate

### Phase 2: OAuth Implementation

#### Step 2.1: Implement OAuth Flow
- [ ] Configure Google OAuth
- [ ] Configure GitHub OAuth
- [ ] Implement PKCE challenge generation
- [ ] Implement token exchange
- **Acceptance Criteria:** Can complete OAuth flow with test credentials
- **Tests to Write:**
  - PKCE challenge is cryptographically random
  - Token exchange handles errors
  - Invalid state parameter throws

#### Step 2.2: Integrate with API Client
- [ ] Add auth header interceptor
- [ ] Handle 401 responses (redirect to login)
- [ ] Handle token refresh
- **Acceptance Criteria:** Authenticated requests include valid token
- **Tests to Write:**
  - Auth header included when logged in
  - 401 triggers redirect
  - Token refresh updates stored token

### Phase 3: Route Protection

#### Step 3.1: Protected Route Wrapper
- [ ] Create ProtectedRoute component
- [ ] Redirect to login when unauthenticated
- [ ] Preserve intended destination
- **Acceptance Criteria:** Unauthenticated users cannot access protected routes
- **Tests to Write:**
  - Authenticated user can access protected route
  - Unauthenticated user redirected to login
  - Redirect preserves original URL

## Standards Validation

### Fail Hard Policy Compliance

#### Error Handling Approach
- OAuth errors throw `AuthError` with provider and error code
- Token errors throw `TokenError` with context
- API auth errors propagate (401 handling is redirect, not suppression)

#### Verification Checklist
- [x] All new functions throw on failure
- [x] No try/catch blocks that suppress errors
- [x] No fallback values masking failures
- [x] Error messages include meaningful context
- [x] Tests verify error conditions throw

### Programming Principles

#### SOLID Compliance
- [x] S: Each file has one responsibility (context, hooks, oauth, types)
- [x] O: API client extended via interceptor pattern
- [x] L: N/A (no inheritance)
- [x] I: Auth hook provides minimal interface
- [x] D: Components depend on useAuth abstraction

### Testing Strategy

#### Test Types Required
- [x] Unit tests for OAuth utilities
- [x] Integration tests for AuthProvider
- [x] E2E test for full OAuth flow (manual initially)

#### Coverage Requirements
- [x] New code has > 80% coverage
- [x] All error paths are tested
- [x] Edge cases identified

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OAuth provider changes | Low | High | Pin library versions, monitor changelogs |
| Token storage security | Med | High | Use httpOnly cookies, not localStorage |
| Rate limiting by providers | Low | Med | Implement exponential backoff |

## Success Criteria

- [ ] Users can sign in with Google
- [ ] Users can sign in with GitHub
- [ ] Users can sign out
- [ ] Auth state persists across reloads
- [ ] Protected routes work correctly
- [ ] All tests pass
- [ ] CI passes

## Open Questions

- [x] Should we support "Remember me"? → No, always persistent
- [x] Session duration? → 7 days, refresh on activity

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-01-15 | AI | Initial draft |
| 2025-01-15 | Human | Approved with minor edits |
```

---

## Plan Review Checklist

Before approving a plan for implementation:

### Completeness
- [ ] All requirements are addressed
- [ ] Files to modify/create are identified
- [ ] Dependencies are researched and justified
- [ ] Testing strategy is defined

### Fail Hard Compliance
- [ ] Error handling approach is explicit
- [ ] No suppression patterns planned
- [ ] Error tests are included

### Quality
- [ ] SOLID principles validated
- [ ] File organization follows conventions
- [ ] Integration points identified
- [ ] Risks considered

### Clarity
- [ ] Steps are detailed enough to follow
- [ ] Acceptance criteria are testable
- [ ] Open questions are flagged

---

## Archiving Plans

When a plan is complete:

1. Update status to "Completed"
2. Add completion date to changelog
3. Move to `.cursor-plans/archive/`
4. Update `.ai-context/` with relevant decisions/documentation

```bash
# After completion
mv .cursor-plans/2025-01-15-user-authentication.md .cursor-plans/archive/
```
