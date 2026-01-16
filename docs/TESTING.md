# Testing Guide

Comprehensive test suite for the Discloser app. Run these tests before pushing to the App Store.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── lib/
│   ├── shareLinks.test.ts              # Share link expiry & view limits
│   ├── shareLinkValidation.test.ts     # Database RPC simulation
│   ├── riskAssessment.test.ts          # Risk level calculation
│   ├── hooks/
│   │   ├── stiStatus.test.ts           # STI status aggregation
│   │   └── testingRecommendations.test.ts  # Testing schedule
│   ├── parsing/
│   │   ├── testNormalizer.test.ts      # Test name normalization
│   │   ├── resultStandardizer.test.ts  # Result status standardization
│   │   └── documentParser.test.ts      # Document verification & parsing
│   └── utils/
│       ├── stiMatching.test.ts         # Known condition matching
│       └── dateUtils.test.ts           # Date formatting
```

## Test Coverage by Feature

### 1. Share Links (`shareLinks.test.ts`, `shareLinkValidation.test.ts`)

Tests the core privacy features for time-limited, view-limited sharing.

| Area | Tests |
|------|-------|
| URL Generation | Share URL construction for `/share/` and `/status/` |
| Expiry Validation | Past/future dates, boundary conditions |
| View Limits | Unlimited, at limit, over limit |
| Active Link Filtering | Combines expiry + view limit checks |
| Database RPC Simulation | `get_shared_result`, `get_shared_status`, `increment_share_view` |
| RLS Policy | Token matching, expiry enforcement |

### 2. Test Name Normalization (`testNormalizer.test.ts`)

Maps lab-specific test names to standardized names.

| Area | Tests |
|------|-------|
| HIV Tests | Combo screen, antibody, interpretation |
| Hepatitis Tests | Surface antigen, core antibody, A/B/C |
| Bacterial STIs | Syphilis, Gonorrhea, Chlamydia |
| Viral STIs | Herpes HSV-1/HSV-2 |
| Status STI Detection | Identifies chronic conditions |

### 3. Result Standardization (`resultStandardizer.test.ts`)

Converts lab result text to status values.

| Status | Patterns |
|--------|----------|
| `negative` | Negative, Non-Reactive, Not Detected, Absent, Immune |
| `positive` | Positive, Reactive, Detected, Antibodies Detected |
| `pending` | Pending, Referred to PHL, Numeric values |
| `inconclusive` | Borderline, Equivocal, Indeterminate |

### 4. STI Status Aggregation (`stiStatus.test.ts`)

Aggregates results across multiple tests.

| Area | Tests |
|------|-------|
| Basic Aggregation | Single result, multiple results |
| Most Recent | Keeps most recent per STI |
| Known Conditions | Marks and filters known conditions |
| Overall Status | Calculates combined status |
| New Positives | Detects unacknowledged chronic positives |

### 5. Testing Recommendations (`testingRecommendations.test.ts`)

Calculates testing schedules based on risk level.

| Risk Level | Interval |
|------------|----------|
| Low | 365 days (yearly) |
| Moderate | 180 days (6 months) |
| High | 90 days (3 months) |

| Area | Tests |
|------|-------|
| Routine Detection | Identifies routine vs non-routine tests |
| Due Date Calculation | Based on last test + interval |
| Overdue Detection | Days past due |
| Due Soon | Within 14 days |
| Message Formatting | User-friendly messages |

### 6. Document Parser (`documentParser.test.ts`)

Handles document verification and test type determination.

| Area | Tests |
|------|-------|
| Name Matching | Exact, reversed order, partial, case insensitive |
| Lab Recognition | All Canadian labs (LifeLabs, PHO, etc.) |
| Identifier Validation | Health card, accession number |
| Test Type Detection | Full panel, combined, single |

### 7. Known Condition Matching (`stiMatching.test.ts`)

Fuzzy matching for chronic conditions.

| Condition | Variations Matched |
|-----------|-------------------|
| HIV | HIV, HIV-1, HIV-2, HIV-1/2 |
| HSV-1 | HSV-1, HSV1, Herpes Simplex Virus 1 |
| HSV-2 | HSV-2, HSV2, Herpes Simplex Virus 2 |
| Hepatitis B | Hepatitis B, Hep B, HBV |
| Hepatitis C | Hepatitis C, Hep C, HCV |

### 8. Risk Assessment (`riskAssessment.test.ts`)

Calculates risk level from questionnaire answers.

| Points | Risk Level |
|--------|------------|
| 1-5 | Low |
| 6-7 | Moderate |
| 8+ | High |

### 9. Date Utilities (`dateUtils.test.ts`)

Date formatting and parsing.

| Function | Input | Output |
|----------|-------|--------|
| `formatDate` | YYYY-MM-DD | "Jan 15, 2024" |
| `formatISODate` | ISO string | "Jan 15, 2024" |
| `formatDocumentDate` | Various | YYYY-MM-DD |

## Pre-Release Checklist

Run before every App Store submission:

```bash
# 1. Run full test suite
npm test

# 2. Check coverage
npm run test:coverage

# 3. Verify all tests pass
echo $? # Should be 0
```

### Expected Results

- **All tests passing**: 200+ tests
- **No skipped tests**
- **Coverage targets**:
  - Statements: > 80%
  - Branches: > 75%
  - Functions: > 80%
  - Lines: > 80%

## Adding New Tests

### For New Business Logic

```typescript
// __tests__/lib/yourFeature.test.ts

describe('yourFunction', () => {
  test('handles normal case', () => {
    expect(yourFunction(input)).toBe(expected);
  });

  test('handles edge case', () => {
    expect(yourFunction(edgeInput)).toBe(edgeExpected);
  });
});
```

### For New Database Logic

When adding new Supabase RPC functions:

1. Add simulation tests in `shareLinkValidation.test.ts` or create new file
2. Mirror the SQL logic exactly
3. Test all validation branches

### For New Parsing Logic

1. Add to `testNormalizer.test.ts` for new test names
2. Add to `resultStandardizer.test.ts` for new result patterns
3. Add to `documentParser.test.ts` for new verification logic

## Troubleshooting

### Tests Timing Out

```javascript
// Increase timeout for slow tests
jest.setTimeout(10000);
```

### TypeScript Errors

Ensure `ts-jest` is configured:
```javascript
// jest.config.js
transform: {
  '^.+\\.tsx?$': ['ts-jest', { /* options */ }],
}
```

### Date-Related Flakiness

Use fixed dates or mock `Date.now()`:
```typescript
jest.useFakeTimers().setSystemTime(new Date('2024-01-15'));
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Related Files

| File | Description |
|------|-------------|
| `lib/hooks/*.ts` | React hooks with business logic |
| `lib/parsing/*.ts` | Document parsing utilities |
| `lib/utils/*.ts` | Utility functions |
| `components/RiskAssessment.tsx` | Risk calculation UI |
| `components/ShareModal.tsx` | Share link creation |
| `supabase/schema.sql` | Database schema & RPC functions |
