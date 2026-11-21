/** A page-sticky visual header, synchronized with the table's horizontal scroller.
 * The real header stays in place for React, accessibility and existing handlers.
 */
export function pinTableHeader(table: HTMLTableElement, scroller: HTMLElement): () => void {
  const head = table.tHead;
  if (!head) return () => {};
  const host = document.createElement("div");
  host.className = "table-sticky-header";
  host.setAttribute("aria-hidden", "true");
  const viewport = document.createElement("div");
  viewport.className = "table-sticky-header-viewport";
  host.appendChild(viewport);
  scroller.before(host);
  let frame = 0;
  let disposed = false;
  const requestFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0);
  const cancelFrame = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : window.clearTimeout;

  const syncScroll = () => {
    viewport.scrollLeft = scroller.scrollLeft;
    host.style.visibility = table.getBoundingClientRect().bottom <= host.getBoundingClientRect().top ? "hidden" : "visible";
  };
  const refresh = () => {
    frame = 0;
    if (disposed || !table.isConnected) return;
    const height = head.getBoundingClientRect().height;
    host.style.height = `${height}px`;
    host.style.marginBottom = `${-height}px`;
    host.style.display = height > 0 ? "block" : "none";
    const copy = table.cloneNode(false) as HTMLTableElement;
    copy.removeAttribute("id");
    copy.dataset.noEnhance = "true";
    copy.style.width = copy.style.minWidth = `${table.getBoundingClientRect().width}px`;
    copy.style.tableLayout = "fixed";
    const columns: number[] = [];
    const occupied: boolean[][] = [];
    Array.from(head.rows).forEach((row, r) => {
      occupied[r] ??= [];
      let c = 0;
      for (const cell of Array.from(row.cells)) {
        while (occupied[r][c]) c++;
        for (let offset = 0; offset < cell.colSpan; offset++) {
          if (cell.colSpan === 1 || columns[c + offset] === undefined) columns[c + offset] = cell.getBoundingClientRect().width / cell.colSpan;
          for (let rr = r; rr < r + cell.rowSpan; rr++) {
            occupied[rr] ??= [];
            occupied[rr][c + offset] = true;
          }
        }
        c += cell.colSpan;
      }
    });
    const colgroup = document.createElement("colgroup");
    columns.forEach(width => {
      const col = document.createElement("col");
      col.style.width = `${width}px`;
      colgroup.appendChild(col);
    });
    const clonedHead = head.cloneNode(true) as HTMLTableSectionElement;
    const originals = Array.from(head.querySelectorAll("th, td"));
    clonedHead.querySelectorAll<HTMLElement>("th, td").forEach((cell, i) => {
      const original = originals[i] as HTMLElement;
      const style = getComputedStyle(original);
      const rowBackground = getComputedStyle(original.parentElement!).backgroundColor;
      cell.style.height = `${original.getBoundingClientRect().height}px`;
      cell.style.backgroundColor = style.backgroundColor !== "rgba(0, 0, 0, 0)" ? style.backgroundColor : rowBackground !== "rgba(0, 0, 0, 0)" ? rowBackground : "#e2e8f0";
    });
    const originalInputs = head.querySelectorAll("input");
    clonedHead.querySelectorAll("input").forEach((input, i) => {
      input.checked = originalInputs[i].checked;
      input.indeterminate = originalInputs[i].indeterminate;
    });
    clonedHead.querySelectorAll<HTMLElement>("[id]").forEach(element => element.removeAttribute("id"));
    clonedHead.querySelectorAll<HTMLElement>("input, button, select, a, [tabindex]").forEach(element => { element.tabIndex = -1; });
    copy.append(colgroup, clonedHead);
    viewport.replaceChildren(copy);
    syncScroll();
  };
  const schedule = () => { if (!frame && !disposed) frame = requestFrame(refresh); };
  // Forward select-all/sort clicks to the real header, preserving existing handlers.
  const forwardClick = (event: MouseEvent) => {
    event.preventDefault();
    const clone = viewport.querySelector("thead");
    let target = event.target as HTMLElement | null;
    const path: number[] = [];
    while (target && target !== clone) {
      const parent: HTMLElement | null = target.parentElement;
      if (!parent) return;
      path.unshift(Array.from(parent.children).indexOf(target));
      target = parent;
    }
    if (target !== clone) return;
    let original: Element = head;
    for (const index of path) original = original.children[index];
    if (original instanceof HTMLElement) original.click();
    schedule();
  };
  host.addEventListener("click", forwardClick);
  const mutation = new MutationObserver(schedule);
  mutation.observe(head, { childList: true, subtree: true, attributes: true, characterData: true });
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  resize?.observe(table);
  resize?.observe(head);
  resize?.observe(scroller);
  scroller.addEventListener("scroll", syncScroll, { passive: true });
  window.addEventListener("scroll", syncScroll, true);
  window.addEventListener("resize", schedule);
  table.addEventListener("change", schedule);
  schedule();
  return () => {
    disposed = true;
    cancelFrame(frame);
    mutation.disconnect();
    resize?.disconnect();
    scroller.removeEventListener("scroll", syncScroll);
    window.removeEventListener("scroll", syncScroll, true);
    window.removeEventListener("resize", schedule);
    table.removeEventListener("change", schedule);
    host.remove();
  };
}
