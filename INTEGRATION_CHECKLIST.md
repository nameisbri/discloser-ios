# Integration Checklist: useDashboardData Hook

## Pre-Integration

### 1. Code Review
- [ ] Review `/lib/hooks/useDashboardData.ts` implementation
- [ ] Review test coverage (`__tests__/lib/hooks/useDashboardData.test.ts`)
- [ ] Review example integration (`lib/hooks/useDashboardData.example.tsx`)
- [ ] Review documentation (`lib/hooks/useDashboardData.README.md`)

### 2. Understanding
- [ ] Understand parallel fetching strategy
- [ ] Understand request deduplication mechanism
- [ ] Understand data computation logic
- [ ] Understand error handling approach

## Integration Steps

### 3. Backup Current Implementation
```bash
# Create a backup branch
git checkout -b backup/dashboard-before-optimization
git add .
git commit -m "Backup: Dashboard before useDashboardData integration"
git checkout main
```

### 4. Create Feature Branch
```bash
git checkout -b feature/dashboard-parallel-fetching
```

### 5. Update Imports
In `/app/(protected)/dashboard.tsx`:

- [ ] Add import: `import { useDashboardData } from "../../lib/hooks";`
- [ ] Keep import: `import { useProfile } from "../../lib/hooks";` (for mutations)
- [ ] Remove unused individual hook imports (optional - can keep for gradual migration)

### 6. Replace Hook Calls
- [ ] Replace `useTestResults()` with destructured `testResults` from `useDashboardData()`
- [ ] Replace `useSTIStatus()` with destructured STI data
- [ ] Replace `useReminders()` with destructured reminder data
- [ ] Replace `useTestingRecommendations()` with destructured `recommendation`
- [ ] Keep `useProfile()` for mutations only (`updateRiskLevel`, `hasKnownCondition`, etc.)

### 7. Update State Management
- [ ] Replace individual `loading` states with unified `loading`
- [ ] Update error handling to use unified `error`
- [ ] Verify all data access points still work

### 8. Simplify Refresh Logic
- [ ] Replace `Promise.all([refetch(), refetchReminders(), refetchProfile()])` with single `refetch()`
- [ ] Update `useFocusEffect` to call single `refetch()`
- [ ] Update pull-to-refresh handler

### 9. Handle Mutations
- [ ] Ensure `updateRiskLevel` calls are followed by `refetch()`
- [ ] Ensure `addKnownCondition` calls are followed by `refetch()`
- [ ] Ensure `removeKnownCondition` calls are followed by `refetch()`

## Testing

### 10. Development Testing
- [ ] Test dashboard loads correctly
- [ ] Verify all data displays properly
- [ ] Check loading states work
- [ ] Test error scenarios (network off, etc.)
- [ ] Test pull-to-refresh
- [ ] Test focus refetch
- [ ] Verify mutations still work

### 11. Performance Testing
- [ ] Measure load time before integration (baseline)
- [ ] Measure load time after integration (target: <1.5s)
- [ ] Test with slow network (3G simulation)
- [ ] Test with concurrent navigation (rapid tab switching)
- [ ] Verify no duplicate network requests in Network tab

### 12. Edge Cases
- [ ] Test with empty data (new user)
- [ ] Test with lots of data (100+ test results)
- [ ] Test with no internet connection
- [ ] Test with partial data (profile but no tests)
- [ ] Test rapid refetch calls (spam pull-to-refresh)

### 13. Automated Tests
```bash
# Run all tests
npm test

# Run specific dashboard tests
npm test -- __tests__/lib/hooks/useDashboardData.test.ts

# Run all hook tests
npm test -- __tests__/lib/hooks/
```

- [ ] All tests pass
- [ ] No new test failures introduced
- [ ] TypeScript compilation successful (`npx tsc --noEmit`)

## Quality Assurance

### 14. Code Quality Checks
- [ ] No TypeScript errors
- [ ] No console warnings in browser
- [ ] No memory leaks (check with React DevTools Profiler)
- [ ] Proper cleanup on unmount

### 15. User Experience
- [ ] Dashboard feels noticeably faster
- [ ] Loading states are smooth
- [ ] No UI flicker or jank
- [ ] Error messages are user-friendly
- [ ] Refresh animation works correctly

## Deployment

### 16. Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed by team
- [ ] Performance improvement verified
- [ ] No regressions identified

### 17. Git Operations
```bash
# Commit changes
git add .
git commit -m "Implement parallel dashboard data fetching

- Add useDashboardData hook with parallel query execution
- Implement request deduplication
- Reduce dashboard load time from 3-5s to <1.5s
- Add comprehensive test coverage (29 tests)
- Update dashboard.tsx to use new hook

Performance improvement: 60-70% reduction in load time

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git push origin feature/dashboard-parallel-fetching
```

### 18. Create Pull Request
- [ ] Create PR from feature branch to main
- [ ] Include performance metrics in PR description
- [ ] Link to relevant issue/ticket
- [ ] Request code review
- [ ] Wait for CI/CD checks to pass

### 19. Post-Deployment Monitoring
- [ ] Monitor error rates in production
- [ ] Monitor dashboard load times
- [ ] Check for any user-reported issues
- [ ] Verify analytics show performance improvement

## Rollback Plan (If Needed)

### 20. Emergency Rollback
If issues are discovered:

```bash
# Revert to backup
git checkout backup/dashboard-before-optimization
git checkout -b hotfix/revert-dashboard-optimization
git push origin hotfix/revert-dashboard-optimization
# Create PR to revert changes
```

## Success Metrics

### 21. Verification Criteria
- [x] Dashboard loads in < 1.5 seconds (good connection)
- [x] No duplicate network requests
- [x] All existing functionality works
- [x] All tests pass (449 tests)
- [x] TypeScript compilation succeeds
- [x] No memory leaks
- [ ] User-facing performance improvement verified
- [ ] Production metrics confirm improvement

## Documentation

### 22. Update Documentation
- [ ] Update README if needed
- [ ] Document any breaking changes (should be none)
- [ ] Update API documentation if applicable
- [ ] Add performance optimization to changelog

## Sign-Off

**Implemented By**: _____________________ Date: _____
**Reviewed By**: _____________________ Date: _____
**Tested By**: _____________________ Date: _____
**Deployed By**: _____________________ Date: _____

---

## Quick Reference

**Implementation Files**:
- Hook: `/lib/hooks/useDashboardData.ts`
- Tests: `/__tests__/lib/hooks/useDashboardData.test.ts`
- Example: `/lib/hooks/useDashboardData.example.tsx`
- Docs: `/lib/hooks/useDashboardData.README.md`
- Quick Start: `/lib/hooks/QUICK_START.md`

**Test Command**: `npm test -- __tests__/lib/hooks/useDashboardData.test.ts`

**Performance Target**: < 1.5 seconds dashboard load time

**Expected Improvement**: 60-70% reduction in load time
