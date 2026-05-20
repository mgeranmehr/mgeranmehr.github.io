from __future__ import annotations

import html
import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "swmmx_dev"
OUT = ROOT / "swmmx"
ASSETS = OUT / "assets"

GITHUB = "https://github.com/mgeranmehr/swmmx_dev"
PYPI = "https://pypi.org/project/swmmx/"
ISSUES = f"{GITHUB}/issues"
MAIN_SITE = "https://mgeranmehr.github.io/"


NAV = [
    ("Home", "index.html"),
    ("Installation", "installation.html"),
    ("Quick Start", "quickstart.html"),
    ("Creating Models", "creating-models.html"),
    ("Time Helpers", "time-helpers.html"),
    ("Getting Parameters", "getting-parameters.html"),
    ("Setting Parameters", "setting-parameters.html"),
    ("Counting Objects", "counting.html"),
    ("Add & Remove", "add-remove.html"),
    ("Running Simulations", "running-simulations.html"),
    ("Plotting", "plotting.html"),
    ("Importing Data", "importing-data.html"),
    ("Exporting Data", "exporting-data.html"),
    ("Validation", "validation.html"),
    ("API Catalog", "api-catalog.html"),
    ("Examples Gallery", "examples.html"),
    ("Comparison", "comparison.html"),
    ("FAQ", "faq.html"),
    ("Disclaimer", "disclaimer.html"),
    ("Changelog", "changelog.html"),
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


README = read(SOURCE / "README.md")


def code(text: str, lang: str = "python") -> str:
    return f'<pre><button class="copy" type="button">Copy</button><code class="language-{lang}">{html.escape(text.strip())}</code></pre>'


def link(label: str, href: str) -> str:
    return f'<a href="{href}">{html.escape(label)}</a>'


def note(kind: str, body: str, title: str | None = None) -> str:
    title_html = f"<strong>{html.escape(title)}</strong>" if title else ""
    return f'<aside class="callout {kind}">{title_html}<p>{body}</p></aside>'


def extract_public_catalog() -> list[tuple[str, list[str]]]:
    match = re.search(
        r"## Public parameter catalog\s+(.*?)(?:\n## Validation|\Z)",
        README,
        flags=re.S,
    )
    if not match:
        return []
    rows: list[tuple[str, list[str]]] = []
    for line in match.group(1).splitlines():
        m = re.match(r"- \*\*`([^`]+)`\*\*: (.+)", line.strip())
        if not m:
            continue
        cat = m.group(1)
        params = re.findall(r"`([^`]+)`", m.group(2))
        rows.append((cat, params))
    return rows


CATALOG = extract_public_catalog()


def catalog_cards() -> str:
    cards = []
    for cat, params in CATALOG:
        sample = ", ".join(f"<code>{html.escape(p)}</code>" for p in params[:12])
        more = f" <span class='muted'>+{len(params) - 12} more</span>" if len(params) > 12 else ""
        cards.append(
            f"<article class='api-card'><h3><code>{html.escape(cat)}</code></h3>"
            f"<p>{sample}{more}</p></article>"
        )
    return "<div class='api-grid'>" + "\n".join(cards) + "</div>"


def catalog_table() -> str:
    body = []
    for cat, params in CATALOG:
        body.append(
            "<tr>"
            f"<td><code>{html.escape(cat)}</code></td>"
            f"<td>{', '.join(f'<code>{html.escape(p)}</code>' for p in params)}</td>"
            "</tr>"
        )
    return "<table><thead><tr><th>Category</th><th>Subcategories / parameters</th></tr></thead><tbody>" + "".join(body) + "</tbody></table>"


def example_links() -> str:
    examples = [
        ("Open, validate, and run", "01_open_validate_run.py", "Open an INP file, validate it, run the engine, and inspect the log."),
        ("Modify conduit diameters and compare", "02_modify_conduit_diameters_compare.py", "Clone and edit conduit geometry for scenario comparison."),
        ("Step-by-step runs", "03_step_by_step_runs_dynamic_control.py", "Use the step iterator to monitor simulation progress."),
        ("Layout plots", "04_plot_layout_examples.py", "Render network maps with static and data-driven styles."),
        ("Time-series plots", "05_plot_timeseries_examples.py", "Plot node, link, and system result variables."),
        ("Profile plots", "06_plot_profile_examples.py", "Draw longitudinal paths with optional HGL overlays."),
        ("GIS/CSV/Excel export", "07_export_examples.py", "Export model and result tables to external formats."),
        ("Time and count helpers", "08_time_and_count_functions.py", "Use pre-run and post-run time vectors plus object counts."),
        ("Get/set patterns", "09_get_set_examples.py", "Inspect and edit parameters through the dotted API."),
        ("Build model from scratch", "10_create_model_from_scratch_add_remove.py", "Create nodes, links, rainfall data, and subcatchments."),
    ]
    notebooks = [
        ("All get functions", "11_all_get_functions.ipynb"),
        ("All set functions", "12_all_set_functions.ipynb"),
        ("All add functions", "13_all_add_functions.ipynb"),
        ("All remove functions", "14_all_remove_functions.ipynb"),
        ("All plot functions", "15_all_plot_functions.ipynb"),
        ("All import/export functions", "16_all_import_export_functions.ipynb"),
    ]
    cards = []
    for title, file_name, desc in examples:
        href = f"{GITHUB}/blob/main/examples/{file_name}"
        cards.append(f"<article class='card'><h3>{title}</h3><p>{desc}</p><a href='{href}'>View {file_name}</a></article>")
    for title, file_name in notebooks:
        href = f"{GITHUB}/blob/main/examples/{file_name}"
        cards.append(f"<article class='card'><h3>{title}</h3><p>Reference notebook generated from the package API surface.</p><a href='{href}'>Open notebook</a></article>")
    return "<div class='card-grid'>" + "\n".join(cards) + "</div>"


PAGES: dict[str, str] = {}

PAGES["index.html"] = f"""
<section class="hero">
  <div>
    <img class="logo" src="assets/swmmx_logo.png" alt="swmmx logo">
    <p class="eyebrow">swmmx Documentation</p>
    <h1>A Python Toolkit for Building, Editing, Running, Importing, Visualizing, and Exporting EPA SWMM Models</h1>
    <p class="lead">swmmx provides one discoverable Python interface for the full EPA SWMM model lifecycle: open or create models, inspect and edit parameters, add and remove objects, run simulations, plot results, validate inputs, and exchange data with CSV, GIS, and Excel workflows.</p>
    <div class="actions">
      <a class="button primary" href="installation.html">Get started</a>
      <a class="button" href="{GITHUB}">GitHub</a>
      <a class="button" href="{PYPI}">PyPI</a>
      <a class="button" href="examples.html">Examples</a>
    </div>
  </div>
</section>
{note("warning", "swmmx is under active testing and development. Use the latest release, validate simulation results, and report bugs through GitHub Issues.", "Development notice")}
<section>
  <h2>Main Features</h2>
  <div class="feature-grid">
    <div>Open existing SWMM models</div><div>Create new SI or US models</div><div>Get and set model parameters</div><div>Count model objects</div>
    <div>Add and remove elements</div><div>Import CSV and GIS data</div><div>Export CSV, GIS, and Excel files</div><div>Run SWMM simulations</div>
    <div>Step through simulations with <code>m.runs()</code></div><div>Plot layout maps</div><div>Plot result time series</div><div>Plot longitudinal profiles</div>
    <div>Validate models</div><div>Preserve INP comments and unknown sections where possible</div><div>Use bundled Windows/Linux engines</div><div>Provide custom engine paths</div>
  </div>
</section>
<section>
  <h2>Quick Example</h2>
  {code("""
from swmmx import swmm

m = swmm("examples/example.inp")
m.plot_layout()
print(m.time.count())
lengths = m.get.conduit.length()
m.set.conduit.roughness(0.013)
m.run()
print(m.log())
m.plot_timeseries.link.flow()
""")}
</section>
<section>
  <h2>Public API at a Glance</h2>
  {catalog_cards()}
</section>
"""

PAGES["installation.html"] = f"""
<h1>Installation</h1>
<p>Install <code>swmmx</code> from PyPI, then install the scientific packages used by the workflows you plan to run. The package intentionally keeps third-party scientific dependencies lightweight so it does not unexpectedly reshape an existing engineering Python environment.</p>
{code("python -m pip install swmmx", "bash")}
<h2>Runtime Scientific Dependencies</h2>
{code("python -m pip install numpy pandas matplotlib networkx", "bash")}
<h2>Optional GIS Dependencies</h2>
<p>GIS import and export lazily require GeoPandas and Shapely.</p>
{code("python -m pip install geopandas shapely", "bash")}
<h2>Optional Excel Dependency</h2>
{code("python -m pip install openpyxl", "bash")}
<h2>Native SWMM Engines</h2>
<table><thead><tr><th>Platform</th><th>Engine behavior</th></tr></thead><tbody>
<tr><td>Windows 64-bit</td><td>Bundled <code>swmm5.dll</code>.</td></tr>
<tr><td>Linux 64-bit</td><td>Bundled <code>libswmm5.so</code>.</td></tr>
<tr><td>macOS</td><td>Provide a custom engine path until a bundled macOS build is available.</td></tr>
</tbody></table>
{code("""
from swmmx import swmm

m = swmm("model.inp", custom_dll_path="/path/to/swmm5")
m.run()
""")}
<h2>Troubleshooting</h2>
<table><thead><tr><th>Symptom</th><th>Likely fix</th></tr></thead><tbody>
<tr><td>Missing NumPy, pandas, matplotlib, or NetworkX</td><td>Install the runtime dependencies above in the active environment.</td></tr>
<tr><td>SWMM engine not found</td><td>Use a supported bundled platform or pass <code>custom_dll_path</code>.</td></tr>
<tr><td>GIS import/export dependency error</td><td>Install <code>geopandas</code> and <code>shapely</code>.</td></tr>
<tr><td>Excel export dependency error</td><td>Install <code>openpyxl</code>.</td></tr>
<tr><td>Plot window does not appear</td><td>Check the matplotlib backend, or call plotting functions with <code>show=False</code> and <code>save_path=...</code>.</td></tr>
</tbody></table>
"""

PAGES["quickstart.html"] = """
<h1>Quick Start</h1>
<p>This workflow opens an existing model, validates it, plots the layout, runs SWMM, plots link flow, and saves a modified model.</p>
""" + code("""
from swmmx import swmm

m = swmm("examples/example.inp")
m.validate()
m.plot_layout()
m.run()
m.plot_timeseries.link.flow()
m.save("modified_model.inp")
""") + """
<h2>Line by Line</h2>
<table><thead><tr><th>Line</th><th>Purpose</th></tr></thead><tbody>
<tr><td><code>swmm("examples/example.inp")</code></td><td>Parse an existing EPA SWMM input file into a model object.</td></tr>
<tr><td><code>m.validate()</code></td><td>Check common structural and reference issues before relying on results.</td></tr>
<tr><td><code>m.plot_layout()</code></td><td>Draw mapped nodes, links, subcatchments, rain gages, and related geometry.</td></tr>
<tr><td><code>m.run()</code></td><td>Run the native SWMM engine and load output metadata.</td></tr>
<tr><td><code>m.plot_timeseries.link.flow()</code></td><td>Plot simulated link flow. Result variables require a completed run.</td></tr>
<tr><td><code>m.save(...)</code></td><td>Write the current in-memory model back to an INP file.</td></tr>
</tbody></table>
"""

PAGES["creating-models.html"] = """
<h1>Creating Models</h1>
<p>The constructor opens an existing model or creates a new SI/US model. Do not combine <code>path</code> with <code>new</code> or <code>flow_unit</code>, because existing INP files already define their own unit settings.</p>
""" + code("""
from swmmx import swmm

m = swmm("examples/example.inp")         # open an existing model
m = swmm()                               # new SI model, LPS by default
m = swmm(new="SI", flow_unit="CMS")      # new SI model
m = swmm(new="US", flow_unit="GPM")      # new US model
m = swmm("model.inp", custom_dll_path="C:/engines/swmm5.dll")
""") + """
<h2>Arguments</h2>
<table><thead><tr><th>Argument</th><th>Description</th></tr></thead><tbody>
<tr><td><code>path</code></td><td>Optional path to an existing <code>.inp</code> file.</td></tr>
<tr><td><code>new</code></td><td><code>"SI"</code> or <code>"US"</code> for an empty model. If omitted with no path, SI is used.</td></tr>
<tr><td><code>flow_unit</code></td><td>For new models only. SI accepts <code>LPS</code>, <code>CMS</code>, <code>MLD</code>; US accepts <code>CFS</code>, <code>GPM</code>, <code>MGD</code>.</td></tr>
<tr><td><code>custom_dll_path</code></td><td>Optional native SWMM engine library path used when running simulations.</td></tr>
</tbody></table>
"""

PAGES["time-helpers.html"] = """
<h1>Time Helpers</h1>
<p>Time helpers separate expected reporting times from actual output periods. Pre-run helpers come from model options; run-time helpers require a completed <code>m.run()</code> or <code>m.runs()</code>.</p>
<table><thead><tr><th>Function</th><th>Use</th></tr></thead><tbody>
<tr><td><code>m.time.vector()</code></td><td>Expected report timestamps as a pandas DataFrame/index before a run.</td></tr>
<tr><td><code>m.time.count()</code></td><td>Expected pre-run report-period count.</td></tr>
<tr><td><code>m.time.vector_run()</code></td><td>Actual timestamps inferred from the completed <code>.out</code> file.</td></tr>
<tr><td><code>m.time.count_run()</code></td><td>Actual post-run period count.</td></tr>
</tbody></table>
""" + code("""
frame = m.time.vector()
expected_steps = m.time.count()

m.run()
actual_frame = m.time.vector_run()
actual_steps = m.time.count_run()
""")

PAGES["getting-parameters.html"] = """
<h1>Getting Parameters</h1>
<p>Getter paths follow <code>m.get.&lt;main_category&gt;.&lt;sub_category&gt;()</code>. They cover input fields, attached records, derived values, and result variables. Result variables require a successful run and become stale after model edits.</p>
""" + code("""
lengths = m.get.conduit.length()
length = m.get.conduit.length("P001")
flow = m.get.link.flow(ids=["P001", "P005"], format="df")
node_ids = m.get.node.id()
""") + """
<h2>Behavior</h2>
<table><thead><tr><th>Topic</th><th>Details</th></tr></thead><tbody>
<tr><td>Default output</td><td>Supported getters return NumPy-style arrays for multi-object values where appropriate.</td></tr>
<tr><td><code>format="df"</code></td><td>Return pandas DataFrame/Series output for tabular workflows.</td></tr>
<tr><td>Explicit ID missing</td><td>Raises <code>UnknownIDError</code>.</td></tr>
<tr><td>Empty object collection</td><td>All-object getters return an empty result instead of failing.</td></tr>
<tr><td>Derived fields</td><td>Read from model geometry/options and calculated by swmmx.</td></tr>
<tr><td>Result fields</td><td>Require a completed run and valid non-stale results.</td></tr>
</tbody></table>
<h2>Available Categories</h2>
""" + catalog_cards()

PAGES["setting-parameters.html"] = """
<h1>Setting Parameters</h1>
<p>Setter paths follow <code>m.set.&lt;main_category&gt;.&lt;sub_category&gt;(value, ids=None)</code>. They edit writable model inputs in memory and mark results stale when a model already has output loaded.</p>
""" + code("""
m.set.conduit.roughness(0.013)
m.set.conduit.roughness([0.013, 0.014], ids=["P001", "P005"])
m.set.node.tag("inspection-needed", ids=["J1", "J2"])
""") + """
<h2>Behavior</h2>
<table><thead><tr><th>Input</th><th>Behavior</th></tr></thead><tbody>
<tr><td>Scalar</td><td>Broadcast across selected IDs.</td></tr>
<tr><td>List/array</td><td>Length must match selected objects.</td></tr>
<tr><td>pandas Series/DataFrame</td><td>Accepted for supported structured fields such as point or sequence data.</td></tr>
<tr><td>Read-only field</td><td>Derived and result variables raise <code>ReadOnlyParameterError</code>.</td></tr>
<tr><td>Invalid reference</td><td>Reference setters validate target IDs where the schema defines a relationship.</td></tr>
</tbody></table>
""" + note("info", "After changing model inputs, re-run the model before reading result variables or result-driven plots.", "Stale results")

PAGES["counting.html"] = """
<h1>Counting Objects</h1>
<p>Count helpers report the current in-memory model, including unsaved add/remove edits. They do not accept <code>ids</code> or <code>format</code> arguments.</p>
""" + code("""
m.count.conduit()
m.count.node()
m.count.subcatchment()

total = m.count.model()
by_type = m.count.model_dict()
summary = m.count.model_df()
""") + """
<p><code>m.count.model()</code> totals detailed element types without double-counting composite rollups such as <code>node</code> and <code>link</code>.</p>
"""

PAGES["add-remove.html"] = """
<h1>Adding and Removing Elements</h1>
<p>Add and remove paths follow <code>m.add.&lt;category&gt;.&lt;element_type&gt;()</code> and <code>m.remove.&lt;category&gt;.&lt;element_type&gt;()</code>. The API validates IDs, required fields, numeric values, enum-like inputs, and references before editing the INP document.</p>
""" + code("""
from swmmx import swmm

m = swmm(new="SI")

m.add.node.junction("J1", x=0.0, y=0.0, invert_elevation=10, max_depth=3)
m.add.node.outfall("OUT1", x=100.0, y=0.0, invert_elevation=9, type="FREE")

m.add.link.conduit(
    "C1",
    from_node="J1",
    to_node="OUT1",
    length=100,
    roughness=0.013,
    shape="CIRCULAR",
    diameter=1.0,
)

m.add.time.time_series("Rain1", data=[("2026-01-01 00:00", 0.0), ("2026-01-01 00:05", 5.0)])
m.add.hydrology.rain_gage("RG1", format="INTENSITY", interval="00:05", source_type="TIMESERIES", time_series="Rain1")
m.add.hydrology.subcatchment("S1", rain_gage="RG1", outlet="J1", x=0.0, y=0.0, area=1.0)

m.save("new_model.inp")
m.remove.link.conduit("C1")
""") + """
<h2>Rules</h2>
<table><thead><tr><th>Topic</th><th>Behavior</th></tr></thead><tbody>
<tr><td>References</td><td>Referenced nodes, curves, time series, and related objects must exist before use.</td></tr>
<tr><td>Coordinates</td><td>Nodes require explicit <code>x</code>/<code>y</code>; subcatchments require centroid coordinates; rain gages can default to mapped extents.</td></tr>
<tr><td>Removal checks</td><td>Dependencies block deletion by default.</td></tr>
<tr><td><code>force=True</code></td><td>Performs only conservative implemented cascades, such as dependent conduit removal for some node deletions.</td></tr>
<tr><td>State flags</td><td>Add/remove sets <code>m.modified</code>; if results exist, <code>m.results_stale</code> becomes true.</td></tr>
</tbody></table>
""" + code("""
m.add_element("node", "junction", "J2", x=200.0, y=0.0, invert_elevation=11, max_depth=2)
m.remove_element("node", "junction", "J2")
""")

PAGES["running-simulations.html"] = """
<h1>Running Simulations</h1>
<p>Use <code>m.run()</code> for a normal complete simulation and <code>m.runs()</code> when you want a Python iterator over the native SWMM step loop.</p>
""" + code("""
m.run()
print(m.log())

for step in m.runs():
    print(step.index, step.time, step.elapsed_days)

print(m.time.count_run())
""") + """
<h2>When to Use <code>m.runs()</code></h2>
<p>Use stepped runs for progress reporting, monitoring, teaching workflows, and future dynamic control patterns. Current step fields include <code>step.index</code>, <code>step.time</code>, and <code>step.elapsed_days</code>.</p>
""" + note("info", "Editing the model after a run invalidates old result accessors. Re-run before reading result variables.", "Result lifecycle")

PAGES["plotting.html"] = """
<h1>Plotting</h1>
<p>swmmx uses matplotlib for layout maps, result time series, and longitudinal profiles. Plot functions return <code>(fig, ax)</code>, support <code>show=False</code>, and support saving through <code>save_path</code> / <code>save_format</code> where implemented.</p>
<h2>Layout Plotting</h2>
""" + code("""
m.plot_layout()
m.plot_layout(title="Drainage Network", legend=True, grid=True, axis=True)

m.plot_layout(
    links={
        "color": {
            "by": "parameter",
            "category": "conduit",
            "variable": "roughness",
            "mode": "continuous",
            "cmap": "viridis",
        }
    }
)

m.plot_layout(
    annotation={
        "nodes": "id",
        "conduits": {"template": "{id}\\nD={diameter:.2f} m", "rotation": "link", "bbox": True},
    }
)
""") + """
<p>Layer dictionaries support nodes, links, subcatchments, connectors, rain gages, LID usages, and labels. Styles may be static or data-driven by model parameters, result variables, or user-provided ID/value mappings. Data-driven styling supports continuous and discrete color maps, node size, and link width.</p>
<h2>Time-Series Plotting</h2>
""" + code("""
m.plot_timeseries.link.flow(["C1", "C2"])
m.plot_timeseries.node.depth("J1", title="Node depth")
m.plot_timeseries.link.flow("C1", time_format="clock")
m.plot_timeseries.system.runoff(time_format="elapsed")
""") + """
<p>Result time series require a completed run. The time axis supports <code>datetime</code>, <code>clock</code>, and <code>elapsed</code> formats.</p>
<h2>Profile Plotting</h2>
""" + code("""
m.plot_profile.nodes("J1", "OUT1", show_hgl=True, aggregation="max")
m.plot_profile.links(["C1", "C2", "C3"])
m.plot_profile.longest(show_hgl=True, aggregation="max")
""") + """
<p>Profiles can plot node-to-node paths, explicit ordered link walks, or the longest directed conduit path. HGL/water overlays require results. Unknown IDs raise <code>UnknownIDError</code>; disconnected paths raise <code>NoPathError</code>.</p>
"""

PAGES["importing-data.html"] = """
<h1>Importing Data</h1>
<p>Python reserves the word <code>import</code>, so swmmx exposes imports as <code>m.import_csv</code> and <code>m.import_gis</code>.</p>
""" + code("""
m.import_csv.node.junction("junctions.csv")
m.import_csv.node.outfall("outfalls.csv")
m.import_csv.link.conduit("conduits.csv")
m.import_csv.hydrology.subcatchment("subcatchments.csv")

m.import_gis.node.junction("junctions.shp")
m.import_gis.link.conduit("pipes.geojson")
m.import_gis.hydrology.subcatchment("subcatchments.gpkg", layer="subcatchments")
""") + """
<h2>Field Mapping</h2>
""" + code("""
result = m.import_csv.link.conduit(
    "pipes.csv",
    field_map={
        "id": "PipeID",
        "from_node": "FromNode",
        "to_node": "ToNode",
        "length": "Length",
        "roughness": "ManningN",
        "diameter": "Diameter",
    },
)

print(result.summary())
print(result.to_frame())
""") + """
<h2>Options</h2>
<table><thead><tr><th>Option</th><th>Meaning</th></tr></thead><tbody>
<tr><td><code>mode="add" | "update" | "upsert"</code></td><td>Choose whether rows add new objects, update existing objects, or do both.</td></tr>
<tr><td><code>dry_run=True</code></td><td>Validate rows without modifying the model.</td></tr>
<tr><td><code>on_missing_required</code></td><td><code>"error"</code> or <code>"skip"</code>.</td></tr>
<tr><td><code>on_unknown_fields</code></td><td><code>"ignore"</code>, <code>"warn"</code>, or <code>"error"</code>.</td></tr>
<tr><td><code>on_error</code></td><td><code>"raise"</code>, <code>"skip"</code>, or <code>"collect"</code>.</td></tr>
</tbody></table>
<p>Group-level shortcuts dispatch nodes and links by a <code>type</code> column: <code>m.import_csv.node("nodes.csv", default_type="junction")</code> and <code>m.import_csv.link("links.csv", default_type="conduit")</code>.</p>
""" + note("info", "CSV files created by m.export.csv() are designed to import back cleanly. Exact SWMM input columns take priority over result or derived columns with similar names.", "Round trip")

PAGES["exporting-data.html"] = """
<h1>Exporting Data</h1>
<p>Exports write model tables and, when available, selected result snapshots to GIS, CSV, or Excel formats.</p>
""" + code("""
m.export.gis()

m.export.gis(
    path="exports/gis",
    elements=["nodes", "links", "subcatchments"],
)

m.export.csv(
    path="exports/csv",
    elements="all",
    time_step=-1,
)

m.export.excel(
    path="exports",
    file_name="model_export.xlsx",
)
""") + """
<h2>Common Options</h2>
<table><thead><tr><th>Option</th><th>Description</th></tr></thead><tbody>
<tr><td><code>path</code></td><td>Output folder. If omitted, exports go beside the model file or into the current working directory.</td></tr>
<tr><td><code>elements</code></td><td>Named tables, groups such as hydrology/quality, or <code>"all"</code>.</td></tr>
<tr><td><code>file_name</code></td><td>Workbook name or prefix for multi-file exports.</td></tr>
<tr><td><code>time_step</code></td><td>Attach result values for a selected output period, commonly <code>-1</code> for the last step.</td></tr>
<tr><td><code>strict_results</code></td><td>Treat missing results as an error instead of exporting parameter-only tables.</td></tr>
<tr><td><code>overwrite</code></td><td>Replace existing outputs when supported.</td></tr>
</tbody></table>
<p>Coordinate fields are included where geometry is available: point objects use <code>[x, y]</code>, links use the full coordinate chain, and subcatchments use polygon coordinates when available. Point tables also include plain <code>x</code> and <code>y</code> fields.</p>
"""

PAGES["validation.html"] = """
<h1>Validation</h1>
<p>Validation catches common structural problems before running models or using results for engineering decisions.</p>
""" + code("""
validation = m.validate()
print(validation.ok)
print(validation.to_frame())
""") + """
<p>The current validator checks duplicate IDs, missing required options, invalid unit values, missing nodes/links, conduit endpoints, and several cross-section/reference errors. Treat validation as a practical QA aid, not as a substitute for engineering review.</p>
"""

PAGES["api-catalog.html"] = """
<h1>Public API Catalog</h1>
<p>The public dotted API is organized into categories and subcategories. The table below is generated from the package README catalog in the local <code>swmmx_dev</code> checkout used to build this site.</p>
""" + catalog_table()

PAGES["examples.html"] = """
<h1>Examples Gallery</h1>
<p>The repository includes simple teaching scripts, fuller standard examples, and generated API notebooks. Run scripts from the repository root so they can find <code>examples/example.inp</code>.</p>
""" + code("""
python examples/01_open_validate_run.py
python examples/standard/01_open_validate_run.py
jupyter notebook examples/11_all_get_functions.ipynb
""", "bash") + example_links()

PAGES["comparison.html"] = f"""
<h1>Comparison with Common EPA SWMM Python Packages</h1>
<p>These packages overlap but have different centers of gravity. swmmx aims to be an end-to-end toolkit around one high-level model object.</p>
<table><thead><tr><th>Package</th><th>Main strength</th><th>Best fit</th></tr></thead><tbody>
<tr><td>{link("swmmx", GITHUB)}</td><td>Unified model lifecycle: build, edit, run, import, export, plot, validate.</td><td>Engineers and researchers who want one readable Python workflow.</td></tr>
<tr><td>{link("PySWMM", "https://github.com/pyswmm/pyswmm")}</td><td>Runtime SWMM control and simulation intervention.</td><td>Dynamic control, monitoring, and simulation-loop workflows.</td></tr>
<tr><td>{link("swmm_api", "https://github.com/MarkusPic/swmm_api")}</td><td>SWMM input, report, and output automation.</td><td>Advanced file/result automation and mature SWMM data handling.</td></tr>
<tr><td>{link("swmmio", "https://github.com/pyswmm/swmmio")}</td><td>pandas/GeoPandas model and result workflows.</td><td>DataFrame-first analysis and GIS-oriented processing.</td></tr>
<tr><td>{link("swmm-toolkit", "https://github.com/pyswmm/swmm-python/tree/master/swmm-toolkit")}</td><td>Lower-level solver/output bindings.</td><td>Developers who need direct SWMM engine/output access.</td></tr>
</tbody></table>
"""

PAGES["faq.html"] = """
<h1>FAQ</h1>
<details open><summary>What is EPA SWMM?</summary><p>EPA SWMM is the Storm Water Management Model used to simulate hydrology, hydraulics, water quality, and drainage network behavior.</p></details>
<details><summary>Is swmmx a replacement for SWMM?</summary><p>No. swmmx is a Python toolkit around EPA SWMM models and engines.</p></details>
<details><summary>Does swmmx include the SWMM engine?</summary><p>It bundles Windows 64-bit and Linux 64-bit native engines and supports custom engine paths.</p></details>
<details><summary>Why does macOS require a custom engine path?</summary><p>The package currently reserves the macOS path but requires users to provide an engine until a bundled build is available.</p></details>
<details><summary>Why are GIS dependencies optional?</summary><p>GeoPandas and Shapely are substantial dependencies. swmmx loads them only when GIS import/export is used.</p></details>
<details><summary>Why use m.import_csv instead of m.import?</summary><p><code>import</code> is a Python keyword, so it cannot be used as an attribute-style API name.</p></details>
<details><summary>Can I create a model from scratch?</summary><p>Yes. Use <code>swmm(new="SI")</code> or <code>swmm(new="US")</code>, then add objects with <code>m.add.*</code>.</p></details>
<details><summary>Can I edit an existing .inp file without losing comments?</summary><p>swmmx preserves comments, unknown sections, and section order where possible.</p></details>
<details><summary>Can I run simulations step by step?</summary><p>Yes. Use <code>m.runs()</code> to iterate over simulation steps.</p></details>
<details><summary>Can I use results in plots?</summary><p>Yes, after <code>m.run()</code> or a completed <code>m.runs()</code>. Result-driven plots require non-stale results.</p></details>
<details><summary>Can I import GIS data?</summary><p>Yes, with optional <code>geopandas</code> and <code>shapely</code> installed.</p></details>
<details><summary>Can exported CSV files be imported again?</summary><p>Yes. Exported CSV tables are designed to round-trip where supported.</p></details>
<details><summary>Is swmmx suitable for engineering design?</summary><p>It can support engineering workflows, but domain knowledge, validation, and independent checks are required.</p></details>
<details><summary>What does beta/development notice mean?</summary><p>The project is actively tested and maintained, but bugs may remain. Use current releases and verify critical outputs.</p></details>
"""

PAGES["disclaimer.html"] = f"""
<h1>Disclaimer and Engineering Use</h1>
{note("warning", "swmmx is a programmatic wrapper and toolkit for EPA SWMM. Effective use requires hydrologic and hydraulic knowledge, SWMM input conventions, and understanding of the EPA SWMM engine.", "Domain knowledge required")}
<p>Simulation results should always be validated before use. Professional engineering judgment is required to interpret, verify, and apply outputs generated by this package for design, planning, operations, or regulatory decisions.</p>
<p>The project is actively maintained, but it may contain bugs, errors, unresolved issues, incomplete outputs, or runtime edge cases. Critical calculations should be verified independently. Report reproducible bugs through {link("GitHub Issues", ISSUES)}.</p>
"""

PAGES["changelog.html"] = f"""
<h1>Changelog and Release Notes</h1>
<p>This documentation was generated from the local swmmx source identified as version <code>0.0.38</code> in <code>pyproject.toml</code>. A dedicated changelog file was not present in the inspected repository.</p>
<p>Use the package index and repository history for release details:</p>
<ul>
  <li>{link("PyPI release page", PYPI)}</li>
  <li>{link("GitHub repository", GITHUB)}</li>
  <li>{link("GitHub Issues", ISSUES)}</li>
</ul>
"""


def page(title: str, active: str, body: str) -> str:
    nav = "\n".join(
        f'<a class="{"active" if href == active else ""}" href="{href}">{label}</a>'
        for label, href in NAV
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)} | swmmx Documentation</title>
  <meta name="description" content="Professional documentation for the swmmx Python package.">
  <link rel="stylesheet" href="assets/docs.css">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="topbar">
    <a class="brand" href="index.html"><img src="assets/swmmx_logo.png" alt=""> <span>swmmx Documentation</span></a>
    <button class="menu-toggle" type="button" aria-label="Open navigation">Menu</button>
    <nav class="toplinks">
      <a href="{MAIN_SITE}">Main site</a>
      <a href="{GITHUB}">GitHub</a>
      <a href="{PYPI}">PyPI</a>
    </nav>
  </header>
  <div class="shell">
    <aside class="sidebar">
      <label class="search-label" for="search">Search docs</label>
      <input id="search" class="search" type="search" placeholder="Search pages and headings">
      <div id="search-results" class="search-results"></div>
      <nav>{nav}</nav>
    </aside>
    <main id="content" class="content">{body}</main>
  </div>
  <footer class="footer">
    <span>swmmx Documentation</span>
    <span><a href="{MAIN_SITE}">Main personal website</a></span>
    <span><a href="{GITHUB}">GitHub</a></span>
    <span><a href="{ISSUES}">Issues</a></span>
  </footer>
  <script src="assets/docs.js"></script>
</body>
</html>
"""


CSS = """
:root {
  --bg: #ffffff;
  --surface: #f8fafc;
  --surface-2: #eef6ff;
  --text: #172033;
  --muted: #64748b;
  --border: #d9e2ec;
  --accent: #1565c0;
  --accent-2: #0f766e;
  --warning: #b45309;
  --code-bg: #0f172a;
  --code-text: #e5edf7;
  --shadow: 0 18px 50px rgba(15, 23, 42, .08);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--text);
  background: var(--bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  line-height: 1.65;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.skip { position: absolute; left: -999px; top: 0; background: #fff; padding: .7rem; z-index: 10; }
.skip:focus { left: .5rem; }
.topbar {
  position: sticky; top: 0; z-index: 20;
  min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .75rem 1.25rem; background: rgba(255,255,255,.95); border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
}
.brand { display: inline-flex; align-items: center; gap: .7rem; color: var(--text); font-weight: 800; }
.brand img { width: 36px; height: 36px; object-fit: contain; }
.toplinks { display: flex; gap: 1rem; font-weight: 600; }
.menu-toggle { display: none; border: 1px solid var(--border); background: white; color: var(--text); border-radius: 6px; padding: .45rem .7rem; }
.shell { display: grid; grid-template-columns: 292px minmax(0, 1fr); align-items: start; }
.sidebar {
  position: sticky; top: 64px; height: calc(100vh - 64px); overflow: auto;
  padding: 1rem; border-right: 1px solid var(--border); background: var(--surface);
}
.sidebar nav { display: grid; gap: .15rem; margin-top: 1rem; }
.sidebar nav a { color: #334155; padding: .52rem .7rem; border-radius: 6px; font-weight: 600; }
.sidebar nav a.active, .sidebar nav a:hover { background: #e7f0fb; color: var(--accent); text-decoration: none; }
.search-label { display: block; color: var(--muted); font-size: .85rem; font-weight: 700; margin-bottom: .35rem; }
.search { width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: .65rem .75rem; font: inherit; background: #fff; }
.search-results { margin-top: .5rem; display: grid; gap: .25rem; }
.search-results a { display: block; background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: .45rem .55rem; color: var(--text); font-size: .9rem; }
.content { max-width: 1120px; width: 100%; padding: 2rem clamp(1.1rem, 4vw, 4rem) 4rem; }
h1, h2, h3 { line-height: 1.2; letter-spacing: 0; }
h1 { font-size: clamp(2rem, 4vw, 3.45rem); margin: .2rem 0 1rem; color: #0f172a; }
h2 { font-size: 1.65rem; margin-top: 2.4rem; padding-top: .3rem; }
h3 { font-size: 1.08rem; margin-top: 1.4rem; }
.lead { font-size: 1.2rem; color: #3b4758; max-width: 920px; }
.eyebrow { color: var(--accent-2); text-transform: uppercase; letter-spacing: .08em; font-weight: 800; margin: 0 0 .6rem; }
.hero { padding: 1rem 0 1.5rem; }
.logo { max-width: 300px; width: min(70vw, 300px); height: auto; display: block; margin-bottom: 1rem; }
.actions { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.25rem; }
.button { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 6px; min-height: 42px; padding: .55rem .9rem; color: var(--text); font-weight: 800; background: #fff; }
.button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.feature-grid, .card-grid, .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: .8rem; margin: 1rem 0; }
.feature-grid div, .card, .api-card { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 1rem; box-shadow: 0 8px 24px rgba(15, 23, 42, .04); }
.feature-grid div { font-weight: 700; }
.card h3, .api-card h3 { margin-top: 0; }
.muted { color: var(--muted); }
.callout { border-left: 4px solid var(--accent); background: var(--surface-2); padding: .9rem 1rem; border-radius: 6px; margin: 1.25rem 0; }
.callout.warning { border-left-color: var(--warning); background: #fff7ed; }
.callout p { margin: .3rem 0 0; }
pre { position: relative; overflow: auto; background: var(--code-bg); color: var(--code-text); border-radius: 8px; padding: 1rem; box-shadow: var(--shadow); }
code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .92em; }
:not(pre) > code { background: #edf2f7; color: #0f172a; padding: .1rem .3rem; border-radius: 4px; }
pre code { display: block; white-space: pre; }
.copy { position: absolute; right: .55rem; top: .55rem; border: 1px solid rgba(255,255,255,.25); background: rgba(255,255,255,.08); color: #fff; border-radius: 5px; padding: .25rem .5rem; cursor: pointer; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0 1.5rem; font-size: .95rem; }
th, td { border: 1px solid var(--border); padding: .65rem .75rem; vertical-align: top; }
th { background: var(--surface); text-align: left; color: #0f172a; }
details { border: 1px solid var(--border); border-radius: 8px; padding: .8rem 1rem; margin: .7rem 0; background: #fff; }
summary { cursor: pointer; font-weight: 800; color: #0f172a; }
.footer { border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; padding: 1.5rem; color: var(--muted); background: var(--surface); }
@media (max-width: 860px) {
  .toplinks { display: none; }
  .menu-toggle { display: inline-flex; }
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; position: fixed; top: 64px; left: 0; right: 0; height: calc(100vh - 64px); z-index: 30; border-right: 0; border-bottom: 1px solid var(--border); }
  body.nav-open .sidebar { display: block; }
  .content { padding-top: 1.25rem; }
  table { display: block; overflow-x: auto; }
}
"""


JS = """
const pages = [
""" + ",\n".join(f'  {{title: "{label}", href: "{href}"}}' for label, href in NAV) + """
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
"""


def main() -> None:
    OUT.mkdir(exist_ok=True)
    ASSETS.mkdir(exist_ok=True)
    for child in OUT.iterdir():
        if child.is_file() and child.suffix in {".html", ".txt"}:
            child.unlink()
    for href, body in PAGES.items():
        label = next(label for label, path in NAV if path == href)
        (OUT / href).write_text(page(label, href, body), encoding="utf-8")
    (ASSETS / "docs.css").write_text(CSS.strip() + "\n", encoding="utf-8")
    (ASSETS / "docs.js").write_text(JS.strip() + "\n", encoding="utf-8")
    logo_source = SOURCE / "swmmx_logo.png"
    if not logo_source.exists():
        logo_source = ROOT / "swmmx_logo.png"
    shutil.copyfile(logo_source, ASSETS / "swmmx_logo.png")
    (ROOT / "swmmx-docs" / "README.md").write_text(
        "# swmmx documentation source\n\n"
        "Run this generator from the GitHub Pages repository root:\n\n"
        "```bash\npython swmmx-docs/generate_site.py\n```\n\n"
        "It reads the sibling `swmmx_dev` checkout and writes the static GitHub Pages site to `swmmx/`.\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
