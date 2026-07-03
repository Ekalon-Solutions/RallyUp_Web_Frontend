# Report Page Pattern

Every report page must follow this data-access pattern to avoid `data.map is not a function` and ensure pagination/summary cards render correctly.

## How the Response Is Nested

The backend returns a `StandardReportResponse` body:

```json
{
  "success": true,
  "meta":    { "reportId": "...", "generatedAt": "...", "pagination": {...} },
  "summary": { "totalActions": 42, ... },
  "data":    [ { "id": "...", ... }, ... ]
}
```

The API client wraps this inside `ApiResponse`:

```
res = {
  success: true,                    // ApiResponse wrapper
  data: {                           // StandardReportResponse (the full body above)
    success: true,
    meta:    { pagination: {...} },
    summary: { totalActions: 42 },
    data:    [ { id: "...", ... } ] // ← the actual rows array
  }
}
```

## Correct Accessors

| What you need           | Access              | Wrong (don't do this) |
|-------------------------|---------------------|-----------------------|
| Rows array              | `res.data.data`     | `res.data`            |
| Pagination metadata     | `res.data.meta?.pagination` | `res.meta?.pagination` |
| Summary KPI values      | `res.data.summary`  | `res.summary`         |

## Template Snippet

```typescript
import { ReportApiResponse } from "@/components/reports/types"

// In the page component:
const res = await apiClient.getSomeReport(queryParams)
if (res.success && res.data) {
  setData(res.data.data)                             // rows → ReportTable
  if (res.data.meta?.pagination) {
    setPagination(res.data.meta.pagination)           // pagination controls
  }
  if (res.data.summary) {
    setSummaryData({
      metricA: Number(res.data.summary.metricA) || 0,
      metricB: Number(res.data.summary.metricB) || 0,
    })
  }
}
```

## Mandatory Rule: Always Extract `res.data.data`

**The single rule that prevents `data.map is not a function`:**

Every report page's `fetchReport` function MUST use exactly this pattern when extracting the response:

```typescript
setData(res.data.data)        // ← the rows array, NOT res.data
res.data.meta?.pagination     // ← NOT res.meta
res.data.summary              // ← NOT res.summary
```

**Never write any of these on a report page:**

```typescript
setData(res.data)             // WRONG — passes the full envelope object { meta, summary, data }
setData(res)                  // WRONG — passes the ApiResponse wrapper
setData(response)             // WRONG — passes the raw HTTP response
setData(ReportApiResponse)    // WRONG — passes the type itself, not a value
```

The `data` state variable holds the value passed to `<ReportTable data={data}>`. If it is anything other than a plain array, `ReportTable` will throw `data.map is not a function`.

**Copy-paste guard:** When creating a new report page, the very first thing to verify in the `fetchReport` callback is that `setData(...)` receives `res.data.data`. All three bugs so far (Member Directory, Admin Audit Log, Total Order Summary) were caused by `setData(res.data)`.

## Why This Exists

The backend sends a flat `{ success, meta, summary, data }` JSON body. The API client's generic `this.request<T>()` places the entire parsed response body into `ApiResponse.data`. This creates one level of nesting: `res.data` is the **full report envelope**, and `res.data.data` is the **rows array**.

Every report page must navigate this nesting. The `ReportApiResponse<TRow>` type in `@/components/reports/types` mirrors the backend's `StandardReportResponse` and makes this safe under TypeScript.

## Key Imports

```typescript
import type { ReportApiResponse, ReportPaginationMeta } from "@/components/reports/types"
```
