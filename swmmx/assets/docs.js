const pages = [
  {title: "Home", href: "index.html"},
  {title: "Installation", href: "installation.html"},
  {title: "Quick Start", href: "quickstart.html"},
  {title: "Creating Models", href: "creating-models.html"},
  {title: "Time Helpers", href: "time-helpers.html"},
  {title: "Getting Parameters", href: "getting-parameters.html"},
  {title: "Get: Patterns", href: "get-patterns.html"},
  {title: "Get: Options", href: "get-options.html"},
  {title: "Get: Hydrology", href: "get-hydrology.html"},
  {title: "Get: Nodes", href: "get-nodes.html"},
  {title: "Get: Links", href: "get-links.html"},
  {title: "Get: Hydraulic & Quality", href: "get-hydraulic-quality.html"},
  {title: "Get: Time & Results", href: "get-time-results.html"},
  {title: "Setting Parameters", href: "setting-parameters.html"},
  {title: "Set: Patterns", href: "set-patterns.html"},
  {title: "Set: Options", href: "set-options.html"},
  {title: "Set: Hydrology", href: "set-hydrology.html"},
  {title: "Set: Nodes", href: "set-nodes.html"},
  {title: "Set: Links", href: "set-links.html"},
  {title: "Set: Hydraulic & Quality", href: "set-hydraulic-quality.html"},
  {title: "Set: Time & Map", href: "set-time-map.html"},
  {title: "Counting Objects", href: "counting.html"},
  {title: "Add & Remove", href: "add-remove.html"},
  {title: "Add Reference", href: "add-reference.html"},
  {title: "Remove Reference", href: "remove-reference.html"},
  {title: "Running Simulations", href: "running-simulations.html"},
  {title: "Plotting", href: "plotting.html"},
  {title: "Plot: Layout", href: "plot-layout.html"},
  {title: "Plot: Time Series", href: "plot-timeseries.html"},
  {title: "Plot: Profiles", href: "plot-profiles.html"},
  {title: "Plot: Errors", href: "plot-errors.html"},
  {title: "Importing Data", href: "importing-data.html"},
  {title: "Exporting Data", href: "exporting-data.html"},
  {title: "Validation", href: "validation.html"},
  {title: "API Catalog", href: "api-catalog.html"},
  {title: "Examples Gallery", href: "examples.html"},
  {title: "Comparison", href: "comparison.html"},
  {title: "FAQ", href: "faq.html"},
  {title: "Disclaimer", href: "disclaimer.html"},
  {title: "Changelog", href: "changelog.html"}
];
document.querySelectorAll(".copy").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = button.parentElement.querySelector("code").innerText;
    await navigator.clipboard.writeText(code);
    const old = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => button.textContent = old, 1200);
  });
});
const menu = document.querySelector(".menu-toggle");
if (menu) {
  menu.addEventListener("click", () => document.body.classList.toggle("nav-open"));
}
const search = document.querySelector("#search");
const results = document.querySelector("#search-results");
if (search && results) {
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    results.innerHTML = "";
    if (!q) return;
    pages
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 8)
      .forEach((p) => {
        const a = document.createElement("a");
        a.href = p.href;
        a.textContent = p.title;
        results.appendChild(a);
      });
  });
}
