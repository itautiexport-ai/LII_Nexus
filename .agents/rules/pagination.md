# Workspace Rule: Universal Table Pagination & Sizing

This rule defines the standard for table pagination and page-size filtering across the LII Performance Nexus frontend application. It ensures that large data sets are split into manageable pages to optimize performance and usability.

## Guideline

Any listing table (e.g. users, employees, checklists, CRM leads, or FMS instances) must support:
1. **Page-Size Sizing Dropdown**: A filter control allowing selection of page limits (e.g., 10, 20, 50, or 100 entries per page).
2. **Page Numbers Navigation**: Controls at the bottom (Previous, Next, and numeric buttons) to navigate pages.
3. **Range Indicator**: Text showing the visible range (e.g., `Showing 1 to 50 of 120 entries`).

## Implementation Pattern

### 1. Global DOM-Based Auto-Pagination
The application uses a global MutationObserver-based table enhancer located in [`tableEnhancer.ts`](file:///c:/Users/shriv/Downloads/LII_Nexus/apps/frontend/src/shared/utils/tableEnhancer.ts). 
* Any HTML `<table>` rendered in the DOM will **automatically** receive pagination, page sizing select inputs, search query filters, and pagination navigation controls.
* To exclude a specific table from this behavior, set the `data-no-enhance="true"` attribute on the table.

### 2. Header Checkbox Sync Pattern
When bulk selections are allowed via a header checkbox in a paginated list:
* Selecting the header checkbox must **only** toggle selection for the visible rows on the current page (not rows hidden on other pages).
* The header checkbox state (checked/unchecked) should reflect the selection status of the visible page rows only.
