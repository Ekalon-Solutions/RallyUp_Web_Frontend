# Reports Module - Quick Reference

**Last Updated**: 2026-07-03  
**Status**: Phase 1 Complete ✅

---

## Quick Links

### Documentation
- **Implementation Pattern**: `docs/REPORTING_IMPLEMENTATION_PATTERN_v1.2.md`
- **Backend Summary**: `RallyUp_Backend/docs/reports/BATCH_6_7_IMPLEMENTATION_SUMMARY.md`
- **Frontend Summary**: `RallyUp_Web_Frontend/docs/reports/FRONTEND_IMPLEMENTATION_SUMMARY.md`
- **Navigation Summary**: `RallyUp_Web_Frontend/docs/reports/REPORTS_HUB_NAVIGATION_COMPLETE.md`
- **Phase 1 Complete**: `docs/REPORTING_PHASE_1_COMPLETE.md`

### Key Files
- **Reports Hub**: `RallyUp_Web_Frontend/app/dashboard/reports/page.tsx`
- **Navigation**: `RallyUp_Web_Frontend/components/dashboard-layout.tsx`
- **API Client**: `RallyUp_Web_Frontend/lib/api.ts`
- **Backend Routes**: `RallyUp_Backend/src/routes/reportRoutes.ts`

---

## Access Reports

### For Users
1. Login to dashboard
2. Click "Reports" in sidebar
3. Search or browse by category
4. Click report card to open report

### Direct URLs
- **Reports Hub**: `/dashboard/reports`
- **Example Report**: `/dashboard/reports/member-directory`

---

## Report Categories

1. **Revenue** (9 reports) - Orders, sales, refunds, inventory
2. **Membership** (5 reports) - Growth, renewals, directory
3. **Events** (1 report) - Attendance tracking
4. **Governance** (4 reports) - Audit logs, permissions
5. **Logistics** (1 report) - Shipments and delivery
6. **Billing** (2 reports) - Subscriptions and WhatsApp
7. **Platform** (3 reports) - Reward points, RTO, analytics

---

## Access Control

### By Role
- **Member**: ❌ No access to reports
- **Admin**: ✅ Access to reports (based on feature gates)
- **Super Admin**: ✅ Access to all reports including Super Admin Audit Log
- **System Owner**: ✅ Access to all reports (no feature gate restrictions)

### By Feature Gate
- **`reporting` feature**: Required for most reports
- **`merchandise` feature**: Required for merchandise and logistics reports

---

## New Reports (Phase 1)

1. **Reward Points Granted** - `/dashboard/reports/reward-points-granted`
   - Member-wise loyalty points breakdown
   - Attendance bonuses, manual adjustments
   
2. **Reward Points Redemption** - `/dashboard/reports/reward-points-redemption`
   - Redemption history with discount amounts
   - Status changes and balance impact
   
3. **RTO (Return to Origin)** - `/dashboard/reports/rto`
   - Failed delivery tracking
   - Courier performance and RTO charges
   
4. **Super Admin Audit Log** - `/dashboard/reports/super-admin-audit-log`
   - Cross-tenant audit trail
   - System owner actions (super admin only)

---

## Common Tasks

### Adding a New Report

1. **Backend**:
   - Add service method to appropriate `*Service.ts`
   - Add controller method to `*Controller.ts`
   - Add route to `reportRoutes.ts`
   - Follow REPORTING_IMPLEMENTATION_PATTERN_v1.2

2. **Frontend**:
   - Create page: `app/dashboard/reports/[report-name]/page.tsx`
   - Add API client methods: `lib/api.ts`
   - Add to Reports Hub: `app/dashboard/reports/page.tsx`
   - Use shared components: ReportShell, ReportTable, etc.

3. **Test**:
   - Verify RBAC enforcement
   - Test feature gate validation
   - Test export functionality
   - Verify navigation

### Troubleshooting

**Report not showing in hub?**
- Check role requirements in `ALL_REPORTS` array
- Verify feature gate configuration
- Check `accessibleReports` filtering logic

**Export not working?**
- Verify API client method exists
- Check backend route is registered
- Verify `downloadReport` helper is used

**Navigation not highlighting?**
- Check route path matches exactly
- Verify `pathname` comparison logic

---

## Shared Components

All reports use these shared components from `@/components/reports`:

1. **ReportShell** - Layout wrapper with header, filters, summary
2. **ReportTable** - Data table with sorting, pagination
3. **ReportSummaryCards** - KPI cards at top of report
4. **ReportFilters** - Date range, status, search filters
5. **ExportButton** - CSV/XLSX export dropdown

**Import**:
```typescript
import {
  ReportShell,
  ReportTable,
  ReportSummaryCards,
  ReportFilters,
  ExportButton,
  type ReportColumn,
  type SummaryCard,
  type ReportFiltersState,
} from "@/components/reports"
```

---

## API Client Methods

### Pattern
```typescript
// Fetch report data
export async function get[ReportName]Report(params: Record<string, any>) {
  return apiRequest<ReportDataResponse>('/api/reports/[endpoint]', 'GET', undefined, params)
}

// Download report
export async function download[ReportName]Report(params: Record<string, any>) {
  return downloadReport('/api/reports/[endpoint]/download', params)
}
```

### Example
```typescript
// Fetch
const res = await apiClient.getMemberDirectoryReport({ clubId, page: 1, limit: 20 })

// Download
await apiClient.downloadMemberDirectoryReport({ clubId, format: 'csv' })
```

---

## Data Extraction Pattern

**MANDATORY**: Always extract data from `res.data.data`

```typescript
const res = await apiClient.getReport(params)
if (res.success && res.data) {
  setData(res.data.data)  // ← Must use res.data.data
  setPagination(res.data.meta?.pagination)
  setSummary(res.data.summary)
}
```

**Why?** Backend returns:
```json
{
  "success": true,
  "data": {
    "data": [...],      // ← Actual rows
    "meta": {...},
    "summary": {...}
  }
}
```

---

## Feature Flags

### Check if feature is enabled
```typescript
import { isFeatureEnabled } from "@/lib/clubFeatures"
import { useClubFeatures } from "@/hooks/useClubFeatures"

const { config: clubFeatureConfig } = useClubFeatures(clubId ?? null)

if (!isFeatureEnabled(clubFeatureConfig, "reporting")) {
  return <LockedFeaturePage />
}
```

### Available features
- `reporting` - General reporting module
- `merchandise` - Merchandise and inventory reports
- (more features defined in `@/lib/clubFeatures`)

---

## Status Badges

**Pattern**:
```typescript
function renderStatusBadge(status: string) {
  const s = (status || "").toLowerCase()
  switch (s) {
    case "active":
      return <Badge className="bg-emerald-100 text-emerald-800 ...">Active</Badge>
    case "expired":
      return <Badge className="bg-amber-100 text-amber-800 ...">Expired</Badge>
    case "cancelled":
      return <Badge className="bg-rose-100 text-rose-800 ...">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
```

---

## Known Issues

### Ad Platform Reports (2 reports)
- **Status**: Placeholder implementations
- **Routes exist**: `/dashboard/reports/ads-generated`, `/dashboard/reports/ad-performance`
- **Issue**: No backend models (AdCampaign, AdImpression)
- **Workaround**: None - requires Ad Platform implementation
- **Documentation**: `RallyUp_Backend/docs/reports/AD_PLATFORM_REQUIREMENTS.md`

### Financial Admin Flag
- **Status**: Metadata defined, not enforced
- **Issue**: All admin users can see financial reports
- **Workaround**: None - requires role/permission enhancement
- **Future**: Add financial admin role or permission check

---

## Testing Checklist

Before deploying a new report:

- [ ] Backend route registered in `reportRoutes.ts`
- [ ] API client methods added to `lib/api.ts`
- [ ] Report page created in correct directory
- [ ] Report added to hub (`ALL_REPORTS` array)
- [ ] RBAC enforcement tested (member, admin, super_admin)
- [ ] Feature gate validation tested
- [ ] CSV export working
- [ ] XLSX export working
- [ ] Pagination working
- [ ] Sorting working
- [ ] Filtering working
- [ ] Empty state handled
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Mobile responsive
- [ ] Navigation highlighting correct
- [ ] TypeScript compilation clean

---

## Support

**Questions about**:
- Implementation patterns → See `REPORTING_IMPLEMENTATION_PATTERN_v1.2.md`
- Backend implementation → See `RallyUp_Backend/docs/reports/`
- Frontend implementation → See `RallyUp_Web_Frontend/docs/reports/`
- Navigation integration → See `REPORTS_HUB_NAVIGATION_COMPLETE.md`

**Need help?**
- Review existing reports for reference patterns
- Check shared components documentation
- Verify RBAC and feature gate logic
- Test with different roles and feature configurations
