import React, { useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Boxes, Check,
  ChevronDown, CircleHelp, Clock3, Cog, Factory, Gauge, Menu, PackageCheck,
  Play, RefreshCw, Settings2, ShieldAlert, Truck, Wrench, X, Zap
} from "lucide-react";

const initialEvents = [
  { icon: Check, title: "Batch G-204 completed", desc: "Gear housing batch passed quality inspection.", time: "09:42", tone: "green" },
  { icon: RefreshCw, title: "Schedule optimized", desc: "3 operations moved to reduce queue time by 18 minutes.", time: "09:18", tone: "orange" },
  { icon: Boxes, title: "Material stock received", desc: "Steel bar inventory updated for shaft production.", time: "08:56", tone: "blue" },
];

const machines = [
  { id: "CNC-01", name: "CNC Milling", detail: "Gear housing · 84% load", image: "photo-1581092160607-ee22621dd758", status: "Running", tone: "green" },
  { id: "CNC-02", name: "CNC Turning", detail: "Drive shaft · 72% load", image: "photo-1581092334651-ddf26d9a09d0", status: "Running", tone: "green" },
  { id: "DRILL-03", name: "Drilling", detail: "Bracket batch · 66% load", image: "photo-1565043666747-69f6646db940", status: "Running", tone: "green" },
  { id: "GRIND-04", name: "Grinding", detail: "Gear finishing · 41% load", image: "photo-1581092921461-eab62e97a780", status: "Idle soon", tone: "amber" },
];

const inventoryItems = [
  { name: "Steel bar", sku: "MAT-1042", category: "Raw material", quantity: 128, unit: "pcs", minimum: 60 },
  { name: "Aluminum billet", sku: "MAT-2081", category: "Raw material", quantity: 42, unit: "pcs", minimum: 50 },
  { name: "Gear blanks", sku: "WIP-3015", category: "Work in progress", quantity: 86, unit: "pcs", minimum: 40 },
  { name: "Bearing set", sku: "CMP-1028", category: "Components", quantity: 214, unit: "sets", minimum: 80 },
];

const scheduleRows = [
  { machine: "CNC-01", tasks: [{ left: 1, width: 23, label: "Gear blank", tone: "blue" }, { left: 26, width: 19, label: "Shaft", tone: "coral" }, { left: 47, width: 28, label: "Bracket", tone: "green" }] },
  { machine: "CNC-02", tasks: [{ left: 8, width: 30, label: "Shaft turning", tone: "purple" }, { left: 41, width: 22, label: "Gear teeth", tone: "amber" }, { left: 66, width: 26, label: "Inspection", tone: "cyan" }] },
  { machine: "DRILL-03", tasks: [{ left: 1, width: 23, label: "Bolt holes", tone: "coral" }, { left: 26, width: 30, label: "Mounting plate", tone: "green" }, { left: 60, width: 25, label: "Final drill", tone: "purple" }] },
  { machine: "GRIND-04", tasks: [{ left: 1, width: 24, label: "Surface grind", tone: "amber" }, { left: 28, width: 26, label: "Gear finish", tone: "blue" }, { left: 58, width: 29, label: "QC check", tone: "cyan" }] },
  { machine: "FINISH-05", tasks: [{ left: 2, width: 23, label: "Deburr", tone: "green" }, { left: 29, width: 27, label: "Polish", tone: "cyan" }, { left: 60, width: 30, label: "Pack batch", tone: "coral" }] },
];

function App() {
  const [mobileNav, setMobileNav] = useState(false);
  const [dashboardTab, setDashboardTab] = useState("alerts");
  const [breakdown, setBreakdown] = useState(false);
  const [rush, setRush] = useState(false);
  const [materialDelay, setMaterialDelay] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [notice, setNotice] = useState("Select a scenario to test how the virtual factory responds. This prototype uses simulated data.");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");

  const addEvent = (title, desc, icon, tone = "orange") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setEvents(prev => [{ title, desc, icon, tone, time }, ...prev].slice(0, 5));
  };
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };
  const simulate = (type) => {
    if (type === "breakdown") {
      const next = !breakdown;
      setBreakdown(next);
      setNotice(next
        ? "Recovery plan active: CNC-02 is unavailable. Affected shaft operations are flagged for reassignment. Estimated makespan: 20.1 h."
        : "CNC-02 restored. The schedule has returned to the default demo state.");
      addEvent(next ? "CNC-02 breakdown detected" : "CNC-02 restored", next ? "Affected shaft operations flagged for reassignment." : "Machine status returned to operational.", next ? ShieldAlert : Check, next ? "red" : "green");
      notify(next ? "Breakdown simulated. Factory entered recovery mode." : "Machine restored in the demo.");
    }
    if (type === "rush") {
      const next = !rush;
      setRush(next);
      setNotice(next
        ? "Rush order R-901 added: the scheduler prioritizes the urgent gear batch while preserving machine and operation constraints."
        : "Rush order R-901 cleared. The demo has returned to the original order mix.");
      addEvent(next ? "Rush order R-901 received" : "Rush order R-901 cleared", next ? "Urgent gear batch added to the production queue." : "Production queue returned to baseline.", Truck, "orange");
      notify(next ? "Rush order simulated. Priority queue updated." : "Rush order removed.");
    }
    if (type === "material") {
      const next = !materialDelay;
      setMaterialDelay(next);
      setNotice(next
        ? "Material delay: steel bar delivery is delayed by 90 minutes. Dependent shaft jobs are held while other feasible work continues."
        : "Steel bar stock received. Material constraints cleared and dependent operations can resume.");
      addEvent(next ? "Steel bar delivery delayed" : "Steel bar stock received", next ? "Shaft jobs paused; other feasible work continues." : "Material constraint cleared; shaft jobs released.", Boxes, next ? "amber" : "green");
      notify(next ? "Material delay simulated. Dependent jobs flagged." : "Material availability restored.");
    }
  };
  const reset = () => {
    setBreakdown(false); setRush(false); setMaterialDelay(false);
    setNotice("Select a scenario to test how the virtual factory responds. This prototype uses simulated data.");
    addEvent("Simulation reset", "Factory demo restored to baseline state.", RefreshCw, "blue");
    notify("Factory simulation reset.");
  };
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  };

  return (
    <div className="app-shell">
      <div className="topline" />
      <header className="navbar">
        <a className="brand" href="#top" onClick={e => { e.preventDefault(); scrollTo("top"); }}>
          <span className="brand-mark"><Factory size={19} /></span><span>flexi<span className="brand-accent">Scheduler</span></span>
        </a>
        <nav className={mobileNav ? "nav-links open" : "nav-links"}>
          <button className="nav-link" onClick={() => scrollTo("overview")}>Overview</button>
          <button className="nav-link" onClick={() => scrollTo("schedule")}>Production Schedule</button>
          <button className="nav-link" onClick={() => scrollTo("machines")}>Machines</button>
          <button className="nav-link" onClick={() => { setDashboardTab("alerts"); scrollTo("dashboard"); }}>Alerts</button>
          <button className="nav-link" onClick={() => { setDashboardTab("inventory"); scrollTo("dashboard"); }}>Inventory</button>
          <button className="nav-link" onClick={() => scrollTo("events")}>Disruptions</button>
        </nav>
        <div className="nav-actions">
          <button className="button button-outline nav-desktop" onClick={() => scrollTo("schedule")}>View Schedule</button>
          <button className="button button-dark nav-desktop" onClick={() => { scrollTo("events"); notify("Demo mode is active — factory data is simulated."); }}>Live Demo <ArrowUpRight size={15} /></button>
          <button className="icon-button menu-button" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X /> : <Menu />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="eyebrow"><span /> SMART MANUFACTURING · INDUSTRY 4.0</div>
            <h1>Build smarter.<br /><em>Make better.</em><br />Move faster.</h1>
            <p>Meet your virtual factory. Monitor automobile parts production, respond to disruptions, and optimize every machine with one intelligent digital twin.</p>
            <div className="hero-actions">
              <button className="button button-yellow" onClick={() => scrollTo("schedule")}>Explore Factory <ArrowRight size={16} /></button>
              <button className="play-button" onClick={() => setModal(true)}><span><Play size={13} fill="currentColor" /></span> How it works</button>
            </div>
            <div className="hero-trust"><div className="avatar-stack"><span>AM</span><span>QA</span><span>OP</span></div><span><strong>Smarter production decisions</strong><br />powered by a virtual factory model</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-blob" />
            <img className="hero-image" src="https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=1200&q=85" alt="Automotive manufacturing floor" />
            <div className="floating-card status-card">
              <div className="small-label"><span className={`live-dot ${breakdown ? "red" : ""}`} /> FACTORY STATUS</div>
              <div className="float-value">{breakdown ? "Recovery mode" : "Operational"}</div>
              <div className="spark-bars">{[10, 17, 13, 24, 18, 28, 21].map((h, i) => <i key={i} style={{ height: h }} />)}</div>
            </div>
            <div className="floating-card output-card">
              <div className="small-label">TODAY'S PRODUCTION</div>
              <div className="float-value">1,248 <span>parts</span></div>
              <div className="tiny-green"><ArrowUpRight size={13} /> 8.4% vs. yesterday</div>
            </div>
            <div className="hero-caption"><span><Activity size={14} /></span> Digital Twin · Production view</div>
          </div>
        </section>

        <section className="section overview-section" id="metrics">
          <div className="section-heading">
            <div><div className="eyebrow"><span /> FACTORY AT A GLANCE</div><h2>Production overview</h2><p>Live-style metrics from your simulated automobile parts factory.</p></div>
            <button className="text-button" onClick={() => scrollTo("schedule")}>See production plan <ArrowRight size={15} /></button>
          </div>
          <div className="kpi-grid">
            <Kpi icon={<Gauge />} label="Production efficiency" value={breakdown ? "84.7%" : "92.4%"} trend={breakdown ? "↓ 7.7% during recovery" : "↑ 4.8% this shift"} warning={breakdown} />
            <Kpi icon={<Cog />} label="Machines running" value={breakdown ? "7" : "8"} suffix="/ 9" trend={breakdown ? "1 machine needs attention" : "All critical lines active"} warning={breakdown} />
            <Kpi icon={<Clock3 />} label="On-time orders" value={rush ? "93.8%" : "96.2%"} trend={rush ? "Urgent order added" : "↑ 2.1% this shift"} warning={rush} />
            <Kpi icon={<Activity />} label="Schedule makespan" value={breakdown ? "20.1h" : "18.6h"} trend={breakdown ? "Recovery plan active" : "↓ 1.4h vs. baseline"} warning={breakdown} />
          </div>
        </section>

        <section className="section dashboard-section" id="dashboard">
          <div className="section-heading">
            <div><div className="eyebrow"><span /> FACTORY OPERATIONS</div><h2>Alerts &amp; inventory</h2><p>Keep track of operational issues and the materials needed to keep production moving.</p></div>
            <div className="dashboard-tabs" role="group" aria-label="Choose factory dashboard">
              <button className={`dashboard-tab ${dashboardTab === "alerts" ? "active" : ""}`} aria-pressed={dashboardTab === "alerts"} onClick={() => setDashboardTab("alerts")}><Bell size={15} /> Alerts <span>{Number(breakdown) + Number(materialDelay) + Number(rush)}</span></button>
              <button className={`dashboard-tab ${dashboardTab === "inventory" ? "active" : ""}`} aria-pressed={dashboardTab === "inventory"} onClick={() => setDashboardTab("inventory")}><Boxes size={15} /> Inventory</button>
            </div>
          </div>
          {dashboardTab === "alerts" ? (
            <div className="panel dashboard-panel">
              <div className="dashboard-summary">
                <div><span className="summary-icon alert-summary"><ShieldAlert size={17} /></span><span><strong>{Number(breakdown) + Number(materialDelay) + Number(rush)}</strong><small>Active alerts</small></span></div>
                <p>Alerts update automatically when you simulate a factory disruption.</p>
              </div>
              <div className="dashboard-list">
                {breakdown && <div className="dashboard-row"><span className="event-icon red"><ShieldAlert size={16} /></span><div><strong>Machine breakdown · CNC-02</strong><p>Drive shaft operations need reassignment to restore the production schedule.</p></div><span className="severity high">High</span></div>}
                {materialDelay && <div className="dashboard-row"><span className="event-icon amber"><Boxes size={16} /></span><div><strong>Material delivery delayed</strong><p>Steel bar delivery is delayed by 90 minutes; dependent shaft jobs are on hold.</p></div><span className="severity medium">Medium</span></div>}
                {rush && <div className="dashboard-row"><span className="event-icon orange"><Truck size={16} /></span><div><strong>Rush order · R-901</strong><p>An urgent gear batch was added and prioritized in the production queue.</p></div><span className="severity info">Info</span></div>}
                {!breakdown && !materialDelay && !rush && <div className="dashboard-empty"><span className="event-icon green"><Check size={16} /></span><div><strong>All clear</strong><p>No active disruptions. Factory operations are running normally.</p></div></div>}
              </div>
              <button className="button button-outline dashboard-action" onClick={() => scrollTo("events")}>Open disruption controls <ArrowRight size={15} /></button>
            </div>
          ) : (
            <div className="panel dashboard-panel">
              <div className="dashboard-summary">
                <div><span className="summary-icon inventory-summary"><PackageCheck size={17} /></span><span><strong>{inventoryItems.length}</strong><small>Tracked materials</small></span></div>
                <p>Sample stock levels for common materials and production components.</p>
              </div>
              <div className="inventory-table-wrap">
                <table className="inventory-table">
                  <thead><tr><th>Item</th><th>Category</th><th>Available</th><th>Stock status</th></tr></thead>
                  <tbody>{inventoryItems.map(item => {
                    const low = item.quantity < item.minimum;
                    return <tr key={item.sku}><td><strong>{item.name}</strong><small>{item.sku}</small></td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td><span className={`stock-status ${low ? "low" : "good"}`}><i />{low ? "Restock soon" : "In stock"}</span></td></tr>;
                  })}</tbody>
                </table>
              </div>
              <p className="inventory-note">Inventory quantities are illustrative demo data and are not connected to a live stock system.</p>
            </div>
          )}
        </section>

        <section className="section control-section" id="schedule">
          <div className="section-heading">
            <div><div className="eyebrow"><span /> PLAN · TRACK · ADAPT</div><h2>Production control center</h2><p>Machine assignments, job timelines, and current factory state.</p></div>
            <button className="button button-outline reset-button" onClick={reset}><RefreshCw size={15} /> Reset simulation</button>
          </div>
          <div className="main-grid">
            <div className="panel schedule-panel">
              <div className="panel-heading"><div><h3>Machine schedule</h3><p>Production timeline by machine</p></div><span className="shift-badge">SHIFT A · 08:00–16:00</span></div>
              <div className="legend"><span><i className="dot blue" /> Gear assembly</span><span><i className="dot coral" /> Shaft machining</span><span><i className="dot green" /> Bracket finishing</span><span><i className="dot amber" /> Inspection</span></div>
              <div className="gantt-scroll"><div className="gantt">
                <div className="time-axis"><span>Machine</span>{["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"].map(t => <span key={t}>{t}</span>)}</div>
                {scheduleRows.map((row, idx) => <div className={`machine-row ${breakdown && row.machine === "CNC-02" ? "machine-broken" : ""}`} key={row.machine}>
                  <div className="machine-label">{row.machine}<small>{idx === 0 ? "Milling" : idx === 1 ? "Turning" : idx === 2 ? "Drilling" : idx === 3 ? "Grinding" : "Finishing"}</small></div>
                  <div className="timeline-track">{row.tasks.map((task, i) => <div key={i} className={`task task-${task.tone}`} style={{ left: `${task.left}%`, width: `${task.width}%` }}>{task.label}</div>)}{breakdown && row.machine === "CNC-02" && <div className="broken-label">BREAKDOWN</div>}</div>
                </div>)}
              </div></div>
              <div className="progress-meta"><span>Shift completion</span><strong>{breakdown ? "62%" : rush ? "74%" : "78%"}</strong></div>
              <div className="progress-track"><span style={{ width: breakdown ? "62%" : rush ? "74%" : "78%" }} /></div>
              {(rush || materialDelay || breakdown) && <div className="schedule-alert"><ShieldAlert size={16} /><span><strong>Schedule update:</strong> {breakdown ? "CNC-02 unavailable; affected operations need reassignment." : rush ? "Urgent order added to the production queue." : "Material-dependent shaft operations are on hold."}</span></div>}
            </div>

            <div className="panel machine-panel" id="machines">
              <div className="panel-heading"><div><h3>Machine health</h3><p>Virtual machine status</p></div><span className="online-count"><i /> {breakdown ? "7" : "8"} of 9 online</span></div>
              <div className="machine-list">
                {machines.map((m, i) => {
                  const down = breakdown && m.id === "CNC-02";
                  const idle = m.tone === "amber" && !down;
                  return <div className="machine-card" key={m.id}>
                    <img src={`https://images.unsplash.com/${m.image}?auto=format&fit=crop&w=140&q=75`} alt={m.name} />
                    <div className="machine-copy"><strong>{m.name} <small>{m.id}</small></strong><p>{down ? "Maintenance required · rerouting jobs" : m.detail}</p></div>
                    <span className={`status-pill ${down ? "down" : idle ? "idle" : "running"}`}>{down ? "Breakdown" : m.status}</span>
                  </div>;
                })}
              </div>
              <div className="sync-note"><Zap size={16} /><span><strong>Digital Twin sync</strong><br />Virtual machine states update as you simulate an event. This demo uses illustrative data, not live sensors.</span></div>
            </div>
          </div>

          <div className="lower-grid" id="events">
            <div className="panel events-panel">
              <div className="panel-heading"><div><h3>Recent factory events</h3><p>Activity log from the virtual factory</p></div><span className="event-count">{events.length} shown</span></div>
              <div className="event-list">{events.map((event, i) => {
                const Icon = event.icon || RefreshCw;
                return <div className="event-item" key={`${event.title}-${event.time}-${i}`}><span className={`event-icon ${event.tone}`}><Icon size={16} /></span><div className="event-copy"><strong>{event.title}</strong><p>{event.desc}</p></div><time>{event.time}</time></div>;
              })}</div>
            </div>
            <div className="panel disruption-panel">
              <div className="panel-heading"><div><h3>Simulate a disruption</h3><p>Test how the Digital Twin responds</p></div><span className="test-badge">TEST MODE</span></div>
              <div className="disruption-actions">
                <button className={`disruption-button ${breakdown ? "selected red-select" : ""}`} onClick={() => simulate("breakdown")}><span className="disruption-emoji">⚠️</span><strong>{breakdown ? "Restore CNC-02" : "Machine breakdown"}</strong><small>{breakdown ? "Clear event" : "Equipment failure"}</small></button>
                <button className={`disruption-button ${rush ? "selected orange-select" : ""}`} onClick={() => simulate("rush")}><span className="disruption-emoji">🚘</span><strong>{rush ? "Remove rush order" : "Add rush order"}</strong><small>{rush ? "Clear event" : "Urgent customer job"}</small></button>
                <button className={`disruption-button ${materialDelay ? "selected amber-select" : ""}`} onClick={() => simulate("material")}><span className="disruption-emoji">📦</span><strong>{materialDelay ? "Receive material" : "Material delay"}</strong><small>{materialDelay ? "Clear event" : "Supply disruption"}</small></button>
              </div>
              <div className="simulation-note"><span className="note-icon"><CircleHelp size={16} /></span><p>{notice}</p></div>
              <button className="button button-dark full-button" onClick={() => { setModal(true); }}>How the Digital Twin works <ArrowRight size={15} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Factory size={16} /></span><span>flexi<span className="brand-accent">Scheduler</span></span></a><span>Digital Twin for Automobile Parts Manufacturing</span><span className="footer-tag"><span /> Simulation prototype · 2026</span></footer>

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><div className="modal">
        <button className="modal-close" aria-label="Close modal" onClick={() => setModal(false)}><X size={18} /></button>
        <div className="modal-symbol"><Factory size={24} /></div><div className="eyebrow"><span /> DIGITAL TWIN WORKFLOW</div><h2>From factory data to better decisions.</h2>
        <p>flexiScheduler represents an automobile parts factory in software. It tracks virtual machine states and job progress, simulates production events, and demonstrates how a scheduling algorithm could reorganize work after a disruption.</p>
        <div className="workflow-list"><div><span>01</span><strong>Factory data</strong><small>Machines, jobs, processing times</small></div><ArrowRight /><div><span>02</span><strong>Simulate</strong><small>Track jobs and machine states</small></div><ArrowRight /><div><span>03</span><strong>Reschedule</strong><small>Evaluate an updated plan</small></div></div>
        <div className="modal-disclaimer">This frontend is a prototype. The current interactions use sample data and do not yet run a real optimization algorithm or connect to factory sensors.</div>
        <button className="button button-dark full-button" onClick={() => { setModal(false); scrollTo("events"); }}>Try a disruption <ArrowRight size={15} /></button>
      </div></div>}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function Kpi({ icon, label, value, suffix, trend, warning }) {
  return <article className="kpi-card"><div className="kpi-top"><span>{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value}{suffix && <small>{suffix}</small>}</div><div className={`kpi-trend ${warning ? "warning" : ""}`}>{warning ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{trend}</div></article>;
}

export default App;