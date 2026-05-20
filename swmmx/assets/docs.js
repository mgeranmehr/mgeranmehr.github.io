const pages = [
  {title: "Home", href: "index.html"},
  {title: "Installation", href: "installation.html"},
  {title: "Quick Start", href: "quickstart.html"},
  {title: "Creating Models", href: "creating-models.html"},
  {title: "Time Helpers", href: "time-helpers.html"},
  {title: "Getting Parameters", href: "getting-parameters.html"},
  {title: "Setting Parameters", href: "setting-parameters.html"},
  {title: "Counting Objects", href: "counting.html"},
  {title: "Add & Remove", href: "add-remove.html"},
  {title: "Running Simulations", href: "running-simulations.html"},
  {title: "Plotting", href: "plotting.html"},
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
