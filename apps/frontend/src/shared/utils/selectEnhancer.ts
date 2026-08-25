interface EnhancedHTMLSelectElement extends HTMLSelectElement {
  __enhancer?: SelectEnhancer;
}

const STYLE_ID = "global-select-enhancer-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .custom-select-container {
      position: relative;
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .custom-select-trigger {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      min-height: 38px;
      font-size: 14px;
      color: #374151;
      box-sizing: border-box;
    }

    .custom-select-trigger:hover {
      border-color: #9ca3af;
      background-color: #f9fafb;
    }

    .custom-select-trigger:focus, .custom-select-trigger.focused {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .custom-select-trigger.disabled {
      background-color: #f3f4f6;
      border-color: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      pointer-events: none;
    }

    .custom-select-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-grow: 1;
      text-align: left;
    }

    .custom-select-arrow {
      margin-left: 8px;
      font-size: 10px;
      color: #6b7280;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .custom-select-container.open .custom-select-arrow {
      transform: rotate(180deg);
    }

    .custom-select-dropdown {
      position: fixed;
      z-index: 999999;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      opacity: 0;
      transform: translateY(-8px);
      pointer-events: none;
      transition: opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1), transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .custom-select-dropdown.open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .custom-select-search-container {
      padding: 8px;
      border-bottom: 1px solid #f3f4f6;
      flex-shrink: 0;
    }

    .custom-select-search-input {
      width: 100%;
      padding: 8px 10px;
      font-size: 13px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      outline: none;
      background-color: #f9fafb;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }

    .custom-select-search-input:focus {
      border-color: #3b82f6;
      background-color: #ffffff;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .custom-select-options-list {
      max-height: 220px;
      overflow-y: auto;
      padding: 4px 0;
      scrollbar-width: thin;
      flex-grow: 1;
    }

    .custom-select-option {
      padding: 8px 12px;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease;
      color: #374151;
      font-size: 13.5px;
      text-align: left;
    }

    .custom-select-option:hover {
      background-color: #f3f4f6;
      color: #111827;
    }

    .custom-select-option.selected {
      background-color: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
    }

    .custom-select-option.highlighted {
      background-color: #f3f4f6;
    }

    .custom-select-no-results {
      padding: 12px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }
    
    .enhanced-select-hidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0,0,0,0) !important;
      border: 0 !important;
      pointer-events: none !important;
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

class SelectEnhancer {
  select: EnhancedHTMLSelectElement;
  container: HTMLDivElement;
  trigger: HTMLDivElement;
  triggerText: HTMLSpanElement;
  dropdown: HTMLDivElement;
  searchInput: HTMLInputElement;
  optionsList: HTMLDivElement;
  observer: MutationObserver | null = null;
  isOpen = false;
  highlightedIndex = -1;
  filteredOptions: Array<{ element: HTMLDivElement; value: string; text: string }> = [];

  constructor(select: HTMLSelectElement) {
    this.select = select as EnhancedHTMLSelectElement;
    this.select.__enhancer = this;
    
    this.container = document.createElement("div");
    this.container.className = "custom-select-container";
    
    this.copyStyles();
    
    this.trigger = document.createElement("div");
    this.trigger.className = "custom-select-trigger";
    this.trigger.tabIndex = this.select.disabled ? -1 : 0;
    if (this.select.disabled) this.trigger.classList.add("disabled");
    
    this.triggerText = document.createElement("span");
    this.triggerText.className = "custom-select-text";
    
    const arrow = document.createElement("span");
    arrow.className = "custom-select-arrow";
    arrow.textContent = "▼";
    
    this.trigger.appendChild(this.triggerText);
    this.trigger.appendChild(arrow);
    this.container.appendChild(this.trigger);
    
    this.dropdown = document.createElement("div");
    this.dropdown.className = "custom-select-dropdown";
    
    const searchContainer = document.createElement("div");
    searchContainer.className = "custom-select-search-container";
    
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.className = "custom-select-search-input";
    this.searchInput.placeholder = "Search...";
    
    searchContainer.appendChild(this.searchInput);
    this.dropdown.appendChild(searchContainer);
    
    this.optionsList = document.createElement("div");
    this.optionsList.className = "custom-select-options-list";
    this.dropdown.appendChild(this.optionsList);
    
    this.select.parentNode?.insertBefore(this.container, this.select);
    this.select.classList.add("enhanced-select-hidden");
    
    this.buildOptions();
    this.updateSelectedText();
    
    this.initEvents();
    
    this.observer = new MutationObserver((mutations) => {
      let optionsChanged = false;
      let stateChanged = false;
      
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          optionsChanged = true;
        } else if (mutation.type === "attributes") {
          if (mutation.attributeName === "disabled") {
            stateChanged = true;
          } else if (mutation.attributeName === "class" && !this.select.classList.contains("enhanced-select-hidden")) {
            this.select.classList.add("enhanced-select-hidden");
          }
        }
      }
      
      if (optionsChanged) {
        this.buildOptions();
        this.updateSelectedText();
      }
      if (stateChanged) {
        this.updateState();
      }
    });
    
    this.observer.observe(this.select, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "class"]
    });
  }

  copyStyles() {
    this.select.classList.forEach((cls) => {
      if (cls !== "enhanced-select-hidden") {
        this.container.classList.add(cls);
      }
    });

    const originalStyle = this.select.getAttribute("style");
    if (originalStyle) {
      this.container.setAttribute("style", originalStyle);
    }
    
    const computedStyle = window.getComputedStyle(this.select);
    if (computedStyle.display === "block") {
      this.container.style.display = "block";
    } else {
      this.container.style.display = "inline-block";
    }
    
    if (computedStyle.width && computedStyle.width !== "auto") {
      this.container.style.width = computedStyle.width;
    } else if (this.select.style.width) {
      this.container.style.width = this.select.style.width;
    } else {
      this.container.style.width = "100%";
    }
  }

  updateState() {
    const disabled = this.select.disabled;
    this.trigger.tabIndex = disabled ? -1 : 0;
    if (disabled) {
      this.trigger.classList.add("disabled");
      this.close();
    } else {
      this.trigger.classList.remove("disabled");
    }
  }

  buildOptions() {
    this.optionsList.innerHTML = "";
    this.filteredOptions = [];
    
    const options = Array.from(this.select.options);
    if (options.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "custom-select-no-results";
      noResults.textContent = "No options available";
      this.optionsList.appendChild(noResults);
      return;
    }
    
    options.forEach((opt, index) => {
      const optDiv = document.createElement("div");
      optDiv.className = "custom-select-option";
      optDiv.textContent = opt.text;
      optDiv.dataset.value = opt.value;
      optDiv.dataset.index = index.toString();
      
      if (opt.selected) {
        optDiv.classList.add("selected");
      }
      
      optDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectOption(opt.value);
      });
      
      this.optionsList.appendChild(optDiv);
      this.filteredOptions.push({
        element: optDiv,
        value: opt.value,
        text: opt.text.toLowerCase()
      });
    });
  }

  updateSelectedText() {
    const selectedOption = this.select.options[this.select.selectedIndex];
    if (selectedOption) {
      this.triggerText.textContent = selectedOption.text;
    } else {
      this.triggerText.textContent = "";
    }
    
    const options = this.optionsList.querySelectorAll(".custom-select-option");
    options.forEach((opt) => {
      const div = opt as HTMLDivElement;
      if (div.dataset.value === this.select.value) {
        div.classList.add("selected");
      } else {
        div.classList.remove("selected");
      }
    });
  }

  initEvents() {
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.select.disabled) return;
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });

    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.container.contains(e.target as Node) && !this.dropdown.contains(e.target as Node)) {
        this.close();
      }
    });

    window.addEventListener("scroll", () => {
      if (this.isOpen) this.reposition();
    }, { passive: true });
    
    window.addEventListener("resize", () => {
      if (this.isOpen) this.reposition();
    }, { passive: true });

    this.searchInput.addEventListener("input", () => {
      this.filterOptions();
    });

    this.searchInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    this.trigger.addEventListener("keydown", (e) => {
      if (this.select.disabled) return;
      
      switch (e.key) {
        case "Enter":
        case "Space":
        case " ":
        case "ArrowDown":
          e.preventDefault();
          this.open();
          break;
      }
    });

    this.dropdown.addEventListener("keydown", (e) => {
      const visibleOpts = this.getVisibleOptions();
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.highlightedIndex = (this.highlightedIndex + 1) % visibleOpts.length;
          this.highlightOption(visibleOpts);
          break;
          
        case "ArrowUp":
          e.preventDefault();
          this.highlightedIndex = (this.highlightedIndex - 1 + visibleOpts.length) % visibleOpts.length;
          this.highlightOption(visibleOpts);
          break;
          
        case "Enter":
          e.preventDefault();
          if (this.highlightedIndex >= 0 && this.highlightedIndex < visibleOpts.length) {
            const optVal = visibleOpts[this.highlightedIndex].value;
            this.selectOption(optVal);
          }
          break;
          
        case "Escape":
          e.preventDefault();
          this.close();
          this.trigger.focus();
          break;
          
        case "Tab":
          this.close();
          break;
      }
    });
  }

  getVisibleOptions() {
    return this.filteredOptions.filter(opt => opt.element.style.display !== "none");
  }

  highlightOption(visibleOpts: Array<{ element: HTMLDivElement }>) {
    this.optionsList.querySelectorAll(".custom-select-option").forEach((opt) => {
      opt.classList.remove("highlighted");
    });
    
    const highlighted = visibleOpts[this.highlightedIndex];
    if (highlighted) {
      highlighted.element.classList.add("highlighted");
      highlighted.element.scrollIntoView({ block: "nearest" });
    }
  }

  filterOptions() {
    const query = this.searchInput.value.toLowerCase().trim();
    let hasMatch = false;
    
    this.filteredOptions.forEach((opt) => {
      if (opt.text.includes(query)) {
        opt.element.style.display = "";
        hasMatch = true;
      } else {
        opt.element.style.display = "none";
      }
    });
    
    const existingNoRes = this.optionsList.querySelector(".custom-select-no-results");
    if (existingNoRes) existingNoRes.remove();
    
    if (!hasMatch) {
      const noResults = document.createElement("div");
      noResults.className = "custom-select-no-results";
      noResults.textContent = "No matches found";
      this.optionsList.appendChild(noResults);
    }
    
    this.highlightedIndex = 0;
    this.highlightOption(this.getVisibleOptions());
  }

  open() {
    document.querySelectorAll(".custom-select-container.open").forEach((el) => {
      const containerDiv = el as HTMLDivElement;
      const nativeSelect = containerDiv.nextElementSibling as EnhancedHTMLSelectElement;
      if (nativeSelect?.__enhancer) {
        nativeSelect.__enhancer.close();
      }
    });

    if (this.isOpen) return;
    this.isOpen = true;
    this.container.classList.add("open");
    
    document.body.appendChild(this.dropdown);
    this.dropdown.classList.add("open");
    
    this.reposition();
    
    this.searchInput.value = "";
    this.filterOptions();
    
    setTimeout(() => {
      this.searchInput.focus();
    }, 50);
  }

  reposition() {
    if (!this.isOpen) return;
    
    const rect = this.trigger.getBoundingClientRect();
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.width = `${rect.width}px`;
    
    const dropdownHeight = this.dropdown.offsetHeight || 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      this.dropdown.style.top = `${rect.top - dropdownHeight - 4}px`;
    } else {
      this.dropdown.style.top = `${rect.bottom + 4}px`;
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.classList.remove("open");
    this.dropdown.classList.remove("open");
    
    setTimeout(() => {
      if (!this.isOpen && this.dropdown.parentNode) {
        this.dropdown.parentNode.removeChild(this.dropdown);
      }
    }, 180);
    
    this.trigger.classList.remove("focused");
  }

  selectOption(value: string) {
    if (this.select.value !== value) {
      this.select.value = value;
      
      const changeEvent = new Event("change", { bubbles: true });
      this.select.dispatchEvent(changeEvent);
      
      const inputEvent = new Event("input", { bubbles: true });
      this.select.dispatchEvent(inputEvent);
    }
    
    this.updateSelectedText();
    this.close();
    this.trigger.focus();
  }

  destroy() {
    this.observer?.disconnect();
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
    this.select.classList.remove("enhanced-select-hidden");
    delete this.select.__enhancer;
  }
}

let globalObserver: MutationObserver | null = null;

function scanAndEnhance() {
  const selects = document.querySelectorAll("select");
  selects.forEach((select) => {
    enhanceSelect(select);
  });
}

export function enhanceSelect(select: HTMLSelectElement) {
  if (
    select.dataset.noEnhance === "true" ||
    select.classList.contains("enhanced-select-hidden") ||
    (select as EnhancedHTMLSelectElement).__enhancer
  ) {
    return;
  }

  if (!select.parentNode) return;

  try {
    new SelectEnhancer(select);
  } catch (err) {
    console.error("Error enhancing select:", err);
  }
}

export function initSelectEnhancer() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  injectStyles();

  try {
    const proto = HTMLSelectElement.prototype;
    const originalValueDescriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (originalValueDescriptor && originalValueDescriptor.set) {
      Object.defineProperty(proto, "value", {
        get() {
          return originalValueDescriptor.get?.call(this);
        },
        set(val) {
          originalValueDescriptor.set?.call(this, val);
          const enhancer = (this as EnhancedHTMLSelectElement).__enhancer;
          if (enhancer) {
            enhancer.updateSelectedText();
          }
        },
        configurable: true,
        enumerable: true
      });
    }

    const originalSelectedIndexDescriptor = Object.getOwnPropertyDescriptor(proto, "selectedIndex");
    if (originalSelectedIndexDescriptor && originalSelectedIndexDescriptor.set) {
      Object.defineProperty(proto, "selectedIndex", {
        get() {
          return originalSelectedIndexDescriptor.get?.call(this);
        },
        set(val) {
          originalSelectedIndexDescriptor.set?.call(this, val);
          const enhancer = (this as EnhancedHTMLSelectElement).__enhancer;
          if (enhancer) {
            enhancer.updateSelectedText();
          }
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch (err) {
    console.error("Failed to patch HTMLSelectElement descriptors:", err);
  }

  scanAndEnhance();

  globalObserver = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      scanAndEnhance();
    }
  });

  globalObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}
