import { enhanceSelect } from "./selectEnhancer";

interface EnhancedHTMLTableElement extends HTMLTableElement {
  __enhancer?: TableFilterEnhancer;
}

const TABLE_STYLE_ID = "global-table-enhancer-styles";

function injectStyles() {
  if (document.getElementById(TABLE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = TABLE_STYLE_ID;
  style.textContent = `
    .table-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .table-search-container {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 240px;
      flex-grow: 1;
      max-width: 360px;
      box-sizing: border-box;
    }

    .table-search-input {
      width: 100%;
      padding: 8px 12px 8px 36px;
      font-size: 13.5px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background-color: #ffffff;
      transition: all 0.15s ease;
      box-sizing: border-box;
      min-height: 38px;
      color: #334155;
    }

    .table-search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .table-search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .table-filter-select-wrapper {
      min-width: 160px;
      max-width: 220px;
      flex-grow: 1;
      box-sizing: border-box;
    }

    .table-column-filter {
      width: 100%;
      box-sizing: border-box;
    }

    .table-filter-reset-btn {
      padding: 8px 16px;
      font-size: 13.5px;
      font-weight: 500;
      color: #4b5563;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      box-sizing: border-box;
    }

    .table-filter-reset-btn:hover {
      background-color: #f1f5f9;
      color: #1e293b;
      border-color: #94a3b8;
    }

    .table-filter-reset-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: #f8fafc;
      border-color: #e2e8f0;
      color: #94a3b8;
    }

    .table-page-size-container {
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
    }

    .table-page-size-select {
      padding: 6px 12px;
      font-size: 13.5px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background-color: #ffffff;
      color: #334155;
      cursor: pointer;
    }

    .table-pagination-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      margin-top: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      box-sizing: border-box;
      width: 100%;
    }

    @media print {
      .table-filter-bar,
      .table-pagination-controls {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

class TableFilterEnhancer {
  table: EnhancedHTMLTableElement;
  tbody: HTMLTableSectionElement | null = null;
  headers: HTMLTableCellElement[] = [];
  filterBar: HTMLDivElement | null = null;
  searchInput: HTMLInputElement | null = null;
  resetBtn: HTMLButtonElement | null = null;
  selectWrappers: Map<number, HTMLDivElement> = new Map();
  selectElements: Map<number, HTMLSelectElement> = new Map();
  activeFilters: Map<number, string> = new Map();
  globalSearchQuery = "";
  observer: MutationObserver | null = null;
  currentPage = 1;
  pageSize = 50;
  paginationControls: HTMLDivElement | null = null;
  pageSizeSelector: HTMLSelectElement | null = null;
  infoLabel: HTMLDivElement | null = null;

  constructor(table: HTMLTableElement) {
    this.table = table as EnhancedHTMLTableElement;
    this.table.__enhancer = this;
    this.table.dataset.tableEnhanced = "true";

    this.initStructure();

    if (this.headers.length === 0 || !this.tbody) return;

    this.createFilterBar();

    this.observer = new MutationObserver(() => {
      this.observer?.disconnect();
      this.updateFilterBarOptions();
      this.applyAllFilters();
      this.observer?.observe(this.tbody!, { childList: true });
    });

    this.observer.observe(this.tbody, {
      childList: true
    });
  }

  initStructure() {
    this.tbody = this.table.querySelector("tbody");
    
    let thList = Array.from(this.table.querySelectorAll("thead tr:first-child th")) as HTMLTableCellElement[];
    if (thList.length === 0) {
      thList = Array.from(this.table.querySelectorAll("thead th")) as HTMLTableCellElement[];
    }
    if (thList.length === 0) {
      thList = Array.from(this.table.querySelectorAll("tr:first-child th")) as HTMLTableCellElement[];
    }
    if (thList.length === 0) {
      thList = Array.from(this.table.querySelectorAll("tr:first-child td")) as HTMLTableCellElement[];
    }
    
    this.headers = thList;
  }

  createFilterBar() {
    if (this.table.previousElementSibling?.classList.contains("table-filter-bar")) {
      return;
    }

    this.filterBar = document.createElement("div");
    this.filterBar.className = "table-filter-bar";

    const searchContainer = document.createElement("div");
    searchContainer.className = "table-search-container";

    const searchIcon = document.createElement("span");
    searchIcon.className = "table-search-icon";
    searchIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.className = "table-search-input";
    this.searchInput.placeholder = "Search in table...";
    
    this.searchInput.addEventListener("input", () => {
      this.globalSearchQuery = this.searchInput!.value.toLowerCase().trim();
      this.applyAllFilters();
      this.updateResetButtonState();
    });

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(this.searchInput);
    this.filterBar.appendChild(searchContainer);

    const selectsContainer = document.createElement("div");
    selectsContainer.className = "table-selects-container";
    selectsContainer.style.display = "flex";
    selectsContainer.style.flexWrap = "wrap";
    selectsContainer.style.gap = "8px";
    selectsContainer.style.alignItems = "center";
    this.filterBar.appendChild(selectsContainer);

    this.headers.forEach((th, index) => {
      const colName = th.textContent?.trim() || "";
      if (
        !colName || 
        colName.toLowerCase() === "actions" || 
        colName.toLowerCase() === "select" ||
        th.dataset.noFilter === "true" ||
        th.getAttribute("data-no-filter") === "true"
      ) {
        return;
      }

      const uniqueValues = this.getUniqueColumnValues(index);
      if (uniqueValues.length < 2) return;

      const wrapper = document.createElement("div");
      wrapper.className = "table-filter-select-wrapper";

      const select = document.createElement("select");
      select.className = "table-column-filter";
      select.dataset.columnIndex = index.toString();

      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = `All ${colName}`;
      select.appendChild(defaultOpt);

      uniqueValues.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });

      select.addEventListener("change", () => {
        const selectedVal = select.value;
        if (selectedVal === "") {
          this.activeFilters.delete(index);
        } else {
          this.activeFilters.set(index, selectedVal);
        }
        this.applyAllFilters();
        this.updateResetButtonState();
      });

      wrapper.appendChild(select);
      selectsContainer.appendChild(wrapper);
      
      this.selectWrappers.set(index, wrapper);
      this.selectElements.set(index, select);
      
      try {
        enhanceSelect(select);
      } catch (err) {
        console.error("Failed to enhance filter select:", err);
      }
    });

    // Page Size Selector
    const pageSizeContainer = document.createElement("div");
    pageSizeContainer.className = "table-page-size-container";

    const sizeLabel = document.createElement("label");
    sizeLabel.style.fontSize = "13px";
    sizeLabel.style.fontWeight = "600";
    sizeLabel.style.color = "#475569";
    sizeLabel.textContent = "Show:";

    this.pageSizeSelector = document.createElement("select");
    this.pageSizeSelector.className = "table-page-size-select";

    [10, 20, 50, 100].forEach((size) => {
      const opt = document.createElement("option");
      opt.value = size.toString();
      opt.textContent = `${size} entries`;
      if (size === this.pageSize) opt.selected = true;
      this.pageSizeSelector!.appendChild(opt);
    });

    this.pageSizeSelector.addEventListener("change", () => {
      this.pageSize = Number(this.pageSizeSelector!.value);
      this.currentPage = 1;
      this.applyAllFilters();
    });

    pageSizeContainer.appendChild(sizeLabel);
    pageSizeContainer.appendChild(this.pageSizeSelector);
    this.filterBar.appendChild(pageSizeContainer);

    this.resetBtn = document.createElement("button");
    this.resetBtn.type = "button";
    this.resetBtn.className = "table-filter-reset-btn";
    this.resetBtn.textContent = "Clear Filters";
    this.resetBtn.disabled = true;

    this.resetBtn.addEventListener("click", () => {
      this.clearAllFilters();
    });

    this.filterBar.appendChild(this.resetBtn);

    this.table.parentNode?.insertBefore(this.filterBar, this.table);
  }

  updateFilterBarOptions() {
    if (!this.tbody || !this.filterBar) return;
    const selectsContainer = this.filterBar.querySelector(".table-selects-container") as HTMLDivElement;
    if (!selectsContainer) return;

    this.headers.forEach((th, index) => {
      const colName = th.textContent?.trim() || "";
      if (
        !colName || 
        colName.toLowerCase() === "actions" || 
        colName.toLowerCase() === "select" ||
        th.dataset.noFilter === "true" ||
        th.getAttribute("data-no-filter") === "true"
      ) {
        return;
      }

      const uniqueValues = this.getUniqueColumnValues(index);
      let select = this.selectElements.get(index);
      let wrapper = this.selectWrappers.get(index);

      if (uniqueValues.length >= 2) {
        if (!select || !wrapper) {
          wrapper = document.createElement("div");
          wrapper.className = "table-filter-select-wrapper";

          select = document.createElement("select");
          select.className = "table-column-filter";
          select.dataset.columnIndex = index.toString();

          const defaultOpt = document.createElement("option");
          defaultOpt.value = "";
          defaultOpt.textContent = `All ${colName}`;
          select.appendChild(defaultOpt);

          wrapper.appendChild(select);
          selectsContainer.appendChild(wrapper);

          select.addEventListener("change", () => {
            const selectedVal = select!.value;
            if (selectedVal === "") {
              this.activeFilters.delete(index);
            } else {
              this.activeFilters.set(index, selectedVal);
            }
            this.applyAllFilters();
            this.updateResetButtonState();
          });

          this.selectWrappers.set(index, wrapper);
          this.selectElements.set(index, select);
          
          try {
            enhanceSelect(select);
          } catch (err) {
            console.error("Failed to enhance filter select:", err);
          }
        }

        const activeVal = this.activeFilters.get(index) || "";
        
        while (select.options.length > 1) {
          select.remove(1);
        }

        let activeValStillExists = false;
        uniqueValues.forEach((val) => {
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          if (val === activeVal) {
            opt.selected = true;
            activeValStillExists = true;
          }
          select!.appendChild(opt);
        });

        if (!activeValStillExists && activeVal !== "") {
          this.activeFilters.delete(index);
          select.value = "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        wrapper.style.display = "";
      } else {
        if (wrapper) {
          wrapper.style.display = "none";
        }
        if (this.activeFilters.has(index)) {
          this.activeFilters.delete(index);
          if (select) {
            select.value = "";
            select.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    });
  }

  getUniqueColumnValues(colIndex: number): string[] {
    if (!this.tbody) return [];
    const values = new Set<string>();
    
    const rows = Array.from(this.tbody.querySelectorAll("tr"));
    rows.forEach((row) => {
      if (row.classList.contains("table-filter-no-results-row")) return;
      if (row.querySelector("th")) return;

      const cell = row.cells[colIndex];
      if (cell) {
        const text = cell.textContent?.trim() || "(Blank)";
        values.add(text);
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  applyAllFilters() {
    if (!this.tbody) return;
    
    this.observer?.disconnect();

    const rows = Array.from(this.tbody.querySelectorAll("tr"));
    const visibleMatches: HTMLTableRowElement[] = [];
    
    rows.forEach((row) => {
      if (row.classList.contains("table-filter-no-results-row")) return;
      if (row.querySelector("th")) return;

      let matchesFilters = true;

      for (const [colIndex, filterVal] of this.activeFilters.entries()) {
        const cell = row.cells[colIndex];
        if (cell) {
          const val = cell.textContent?.trim() || "(Blank)";
          if (val !== filterVal) {
            matchesFilters = false;
            break;
          }
        }
      }

      if (matchesFilters && this.globalSearchQuery) {
        let matchesSearch = false;
        for (let i = 0; i < row.cells.length; i++) {
          const cellText = row.cells[i].textContent?.toLowerCase() || "";
          if (cellText.includes(this.globalSearchQuery)) {
            matchesSearch = true;
            break;
          }
        }
        if (!matchesSearch) {
          matchesFilters = false;
        }
      }

      if (matchesFilters) {
        visibleMatches.push(row);
      } else {
        row.style.display = "none";
      }
    });

    const totalMatching = visibleMatches.length;
    const totalPages = Math.ceil(totalMatching / this.pageSize);

    if (this.currentPage > totalPages && totalPages > 0) {
      this.currentPage = totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = startIdx + this.pageSize;

    visibleMatches.forEach((row, index) => {
      if (index >= startIdx && index < endIdx) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });

    this.updatePaginationUI(totalMatching, totalPages, startIdx, endIdx);

    const noResultsRow = this.tbody.querySelector(".table-filter-no-results-row");

    if (totalMatching === 0 && rows.length > 0) {
      if (!noResultsRow) {
        const tr = document.createElement("tr");
        tr.className = "table-filter-no-results-row";
        const td = document.createElement("td");
        td.colSpan = Math.max(1, this.headers.length);
        td.style.textAlign = "center";
        td.style.padding = "24px";
        td.style.color = "#94a3b8";
        td.style.backgroundColor = "#f8fafc";
        td.style.fontSize = "13.5px";
        td.textContent = "No matching records found";
        tr.appendChild(td);
        this.tbody.appendChild(tr);
      }
    } else {
      if (noResultsRow) {
        noResultsRow.remove();
      }
    }

    this.observer?.observe(this.tbody, { childList: true });
  }

  updateResetButtonState() {
    if (!this.resetBtn) return;
    const hasActiveFilters = this.activeFilters.size > 0 || this.globalSearchQuery !== "";
    this.resetBtn.disabled = !hasActiveFilters;
  }

  clearAllFilters() {
    this.activeFilters.clear();
    this.globalSearchQuery = "";
    
    if (this.searchInput) {
      this.searchInput.value = "";
    }

    this.selectElements.forEach((select) => {
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    this.applyAllFilters();
    this.updateResetButtonState();
  }

  createPaginationControls() {
    if (this.paginationControls) {
      this.paginationControls.remove();
    }

    this.paginationControls = document.createElement("div");
    this.paginationControls.className = "table-pagination-controls";

    this.infoLabel = document.createElement("div");
    this.infoLabel.style.fontSize = "13px";
    this.infoLabel.style.color = "#64748b";
    this.infoLabel.style.fontWeight = "500";

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.alignItems = "center";
    buttonsContainer.style.gap = "8px";

    this.paginationControls.appendChild(this.infoLabel);
    this.paginationControls.appendChild(buttonsContainer);

    this.table.parentNode?.insertBefore(this.paginationControls, this.table.nextSibling);
  }

  updatePaginationUI(totalMatching: number, totalPages: number, startIdx: number, endIdx: number) {
    if (!this.paginationControls) {
      this.createPaginationControls();
    }

    if (!this.paginationControls || !this.infoLabel) return;

    if (totalMatching === 0) {
      this.paginationControls.style.display = "none";
      return;
    }

    this.paginationControls.style.display = "flex";

    const actualStart = startIdx + 1;
    const actualEnd = Math.min(endIdx, totalMatching);
    this.infoLabel.textContent = `Showing ${actualStart} to ${actualEnd} of ${totalMatching} entries`;

    const buttonsContainer = this.paginationControls.querySelector("div") as HTMLDivElement;
    if (!buttonsContainer) return;

    buttonsContainer.innerHTML = "";

    if (totalPages <= 1) {
      return;
    }

    // Prev Button
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.style.padding = "6px 12px";
    prevBtn.style.borderRadius = "6px";
    prevBtn.style.border = "1px solid #cbd5e1";
    prevBtn.style.background = this.currentPage === 1 ? "#f1f5f9" : "#fff";
    prevBtn.style.color = this.currentPage === 1 ? "#94a3b8" : "#334155";
    prevBtn.style.fontSize = "13px";
    prevBtn.style.fontWeight = "600";
    prevBtn.style.cursor = this.currentPage === 1 ? "not-allowed" : "pointer";
    prevBtn.textContent = "Previous";
    if (this.currentPage > 1) {
      prevBtn.addEventListener("click", () => {
        this.currentPage--;
        this.applyAllFilters();
      });
    }
    buttonsContainer.appendChild(prevBtn);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      const pageBtn = document.createElement("button");
      pageBtn.type = "button";
      pageBtn.style.width = "32px";
      pageBtn.style.height = "32px";
      pageBtn.style.borderRadius = "50%";
      pageBtn.style.border = "none";
      pageBtn.style.background = this.currentPage === p ? "#2563eb" : "transparent";
      pageBtn.style.color = this.currentPage === p ? "#fff" : "#475569";
      pageBtn.style.fontSize = "13px";
      pageBtn.style.fontWeight = "600";
      pageBtn.style.cursor = "pointer";
      pageBtn.textContent = p.toString();
      pageBtn.addEventListener("click", () => {
        this.currentPage = p;
        this.applyAllFilters();
      });
      buttonsContainer.appendChild(pageBtn);
    }

    // Next Button
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.style.padding = "6px 12px";
    nextBtn.style.borderRadius = "6px";
    nextBtn.style.border = "1px solid #cbd5e1";
    nextBtn.style.background = this.currentPage === totalPages ? "#f1f5f9" : "#fff";
    nextBtn.style.color = this.currentPage === totalPages ? "#94a3b8" : "#334155";
    nextBtn.style.fontSize = "13px";
    nextBtn.style.fontWeight = "600";
    nextBtn.style.cursor = this.currentPage === totalPages ? "not-allowed" : "pointer";
    nextBtn.textContent = "Next";
    if (this.currentPage < totalPages) {
      nextBtn.addEventListener("click", () => {
        this.currentPage++;
        this.applyAllFilters();
      });
    }
    buttonsContainer.appendChild(nextBtn);
  }

  destroy() {
    this.observer?.disconnect();
    
    if (this.filterBar && this.filterBar.parentNode) {
      this.filterBar.parentNode.removeChild(this.filterBar);
    }

    if (this.paginationControls && this.paginationControls.parentNode) {
      this.paginationControls.parentNode.removeChild(this.paginationControls);
    }

    if (this.tbody) {
      const noResultsRow = this.tbody.querySelector(".table-filter-no-results-row");
      if (noResultsRow) {
        noResultsRow.remove();
      }

      const rows = Array.from(this.tbody.querySelectorAll("tr"));
      rows.forEach((row) => {
        row.style.display = "";
      });
    }

    delete this.table.__enhancer;
  }
}

let tableObserver: MutationObserver | null = null;

function scanAndEnhanceTables() {
  const tables = document.querySelectorAll("table");
  tables.forEach((table) => {
    enhanceTable(table);
  });
}

function enhanceTable(table: HTMLTableElement) {
  if (
    table.dataset.noEnhance === "true" ||
    table.dataset.tableEnhanced === "true" ||
    (table as EnhancedHTMLTableElement).__enhancer
  ) {
    return;
  }

  const rows = table.querySelectorAll("tr");
  const ths = table.querySelectorAll("th");
  if (rows.length < 2 || ths.length < 1) return;

  try {
    new TableFilterEnhancer(table);
  } catch (err) {
    console.error("Error enhancing table filters:", err);
  }
}

export function initTableEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  injectStyles();
  scanAndEnhanceTables();

  tableObserver = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scanAndEnhanceTables();
    }
  });

  tableObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}
