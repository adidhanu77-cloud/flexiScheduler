import React, { useState, useEffect } from "react";
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, ArrowDownRight,
  Boxes, Check, CheckCircle2, ChevronRight, Clock, Clock3, Cog, Cpu,
  Factory, FastForward, Flame, Gauge, Layers, PackageCheck, Play, Pause,
  RefreshCw, RotateCcw, ShieldAlert, Sparkles, Timer, Truck, Wrench, X,
  Zap, Target, Plus, CheckCheck, ListOrdered, ArrowLeftRight, HelpCircle,
  AlertCircle, FileText, Send, ChevronDown
} from "lucide-react";
import { insertOrderToDb } from "./supabaseClient";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DISRUPTION BACKEND SUITE:
 * 1. Rush Order Workflow (Pipeline Structure + FIFO Algorithm for Orders)
 * 2. Machine Breakdown Backend & Diagnostic Telemetry
 * 3. Material Delay & Inventory Buffer Backend
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Initial FIFO queue orders representing active work in the pipeline
const INITIAL_FIFO_ORDERS = [
  {
    id: "ORD-840",
    customer: "Tesla Powertrain",
    part: "Cast Gear Housing G-204",
    qty: 120,
    arrivalTime: "07:45 AM",
    dueTime: "14:30 PM",
    stage: 4, // 0: Ingestion, 1: FIFO Staging, 2: CNC Machining, 3: Drilling, 4: Grinding, 5: CMM Inspection, 6: Dispatched
    status: "Grinding & Deburr",
    priority: "Normal",
    type: "standard",
    color: "#3b82f6"
  },
  {
    id: "ORD-841",
    customer: "Bosch Mobility",
    part: "Transmission Mounting Bracket",
    qty: 85,
    arrivalTime: "08:10 AM",
    dueTime: "15:15 PM",
    stage: 3,
    status: "Precision Drilling",
    priority: "Normal",
    type: "standard",
    color: "#10b981"
  },
  {
    id: "ORD-842",
    customer: "Dana Drivetrain",
    part: "Spline Drive Shaft 45C",
    qty: 60,
    arrivalTime: "08:35 AM",
    dueTime: "16:00 PM",
    stage: 2,
    status: "CNC Turning & Teeth",
    priority: "Normal",
    type: "standard",
    color: "#8b5cf6"
  },
  {
    id: "ORD-843",
    customer: "Tata Motors Engine Div",
    part: "Camshaft Flange Pin Batch",
    qty: 150,
    arrivalTime: "09:05 AM",
    dueTime: "17:30 PM",
    stage: 1,
    status: "FIFO Staging Buffer",
    priority: "Normal",
    type: "standard",
    color: "#06b6d4"
  }
];

const PIPELINE_STAGES = [
  { id: 0, name: "Intake & Spec", station: "ERP / CAD Validation", icon: FileText, color: "#64748b" },
  { id: 1, name: "FIFO Queue", station: "Buffer Staging Zone", icon: ListOrdered, color: "#f59e0b" },
  { id: 2, name: "CNC Machining", station: "Station 1: Milling / Lathe", icon: Cog, color: "#8b5cf6" },
  { id: 3, name: "Drilling & Tap", station: "Station 2: Radial Drill", icon: Target, color: "#10b981" },
  { id: 4, name: "Surface Grinding", station: "Station 3: Surface Grinder", icon: Zap, color: "#f97316" },
  { id: 5, name: "CMM Inspection", station: "Station 4: Quality Check", icon: CheckCircle2, color: "#3b82f6" },
  { id: 6, name: "Schedule Dispatch", station: "Factory Floor Execution", icon: Truck, color: "#22c55e" }
];

export default function DisruptionModal({
  activeModal, // "rush" | "breakdown" | "material" | null
  onClose,
  breakdown,
  healingState,
  triggerManualBreakdown,
  triggerReheal,
  restoreCNC02,
  rush,
  setRush,
  materialDelay,
  setMaterialDelay,
  addEvent,
  notify,
  setNotice,
  onDispatchTwilioAlert
}) {
  if (!activeModal) return null;

  return (
    <div className="disruption-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`disruption-modal-window ${activeModal === "rush" ? "rush-workflow-window" : ""}`}>
        <button className="dm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {activeModal === "rush" && (
          <RushOrderWorkflowBackend
            rush={rush}
            setRush={setRush}
            addEvent={addEvent}
            notify={notify}
            setNotice={setNotice}
            onClose={onClose}
          />
        )}

        {activeModal === "breakdown" && (
          <MachineBreakdownBackend
            breakdown={breakdown}
            healingState={healingState}
            triggerManualBreakdown={triggerManualBreakdown}
            triggerReheal={triggerReheal}
            restoreCNC02={restoreCNC02}
            notify={notify}
            onClose={onClose}
            onDispatchTwilioAlert={onDispatchTwilioAlert}
          />
        )}

        {activeModal === "material" && (
          <MaterialDelayBackend
            materialDelay={materialDelay}
            setMaterialDelay={setMaterialDelay}
            addEvent={addEvent}
            notify={notify}
            setNotice={setNotice}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 1. RUSH ORDER WORKFLOW BACKEND (Pipeline Structure + FIFO Algorithm for Orders)
 * ══════════════════════════════════════════════════════════════════════════════
 */
function RushOrderWorkflowBackend({ rush, setRush, addEvent, notify, setNotice, onClose }) {
  const [orders, setOrders] = useState(INITIAL_FIFO_ORDERS);
  const [autoPipeline, setAutoPipeline] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline"); // "pipeline" | "queue" | "algorithm"

  // New Order Form state
  const [newOrderId, setNewOrderId] = useState("R-901");
  const [newCustomer, setNewCustomer] = useState("Stellantis Transmission");
  const [newPartName, setNewPartName] = useState("Urgent Helical Gear Batch");
  const [newQty, setNewQty] = useState(120);
  const [newPriority, setNewPriority] = useState("rush"); // "rush" | "standard"
  const [orderAddedBanner, setOrderAddedBanner] = useState(false);

  // Sync initial R-901 state if rush is already active in parent
  useEffect(() => {
    if (rush) {
      const exists = orders.some(o => o.id === "R-901");
      if (!exists) {
        const rushOrder = {
          id: "R-901",
          customer: "Stellantis Transmission",
          part: "Urgent Helical Gear Batch",
          qty: 120,
          arrivalTime: "09:20 AM",
          dueTime: "13:30 PM",
          stage: 2, // Active in primary machining pipeline
          status: "CNC Milling (Priority FIFO)",
          priority: "Rush SLA (Immediate)",
          type: "rush",
          color: "#f59e0b"
        };
        setOrders(prev => [rushOrder, ...prev]);
      }
    }
  }, [rush]);

  // Auto-advance pipeline flow simulation
  useEffect(() => {
    let interval;
    if (autoPipeline) {
      interval = setInterval(() => {
        advancePipeline();
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [autoPipeline, orders]);

  // FIFO Advancement: Orders move along the pipeline stages strictly in First-In, First-Out sequence
  const advancePipeline = () => {
    setOrders(prev => {
      return prev.map(order => {
        if (order.stage < 6) {
          const nextStage = order.stage + 1;
          const stageObj = PIPELINE_STAGES[nextStage];
          return {
            ...order,
            stage: nextStage,
            status: stageObj.station
          };
        }
        return order;
      });
    });
    notify("Pipeline advanced: Orders moved along manufacturing stations according to FIFO rule.");
  };

  // Step an individual order forward in the pipeline
  const advanceSingleOrder = (id) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id && o.stage < 6) {
        const nextStage = o.stage + 1;
        return {
          ...o,
          stage: nextStage,
          status: PIPELINE_STAGES[nextStage].station
        };
      }
      return o;
    }));
  };

  // Submit New Order into FIFO Pipeline
  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrderId.trim() || !newPartName.trim()) return;

    const isRush = newPriority === "rush";
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newOrderObj = {
      id: newOrderId.toUpperCase(),
      customer: newCustomer || "Industrial Client",
      part: newPartName,
      qty: parseInt(newQty, 10) || 50,
      arrivalTime: `${timeStr} (Now)`,
      dueTime: isRush ? "13:45 PM (Rush SLA)" : "17:30 PM (Standard)",
      stage: isRush ? 2 : 1, // Rush enters stage 2 directly; standard queues in stage 1 FIFO buffer
      status: isRush ? "Station 1: CNC Machining (Expedited)" : "FIFO Staging Buffer",
      priority: isRush ? "Rush SLA (Immediate)" : "Standard",
      type: isRush ? "rush" : "standard",
      color: isRush ? "#f59e0b" : "#3b82f6"
    };

    if (isRush) {
      // In FIFO with Rush Queue: Rush order occupies priority head slot
      setOrders(prev => [newOrderObj, ...prev.filter(o => o.id !== newOrderId)]);
      setRush(true);
      setNotice(`Rush order ${newOrderId} ingested into FIFO pipeline: prioritized in CNC queue with +1.5h makespan adjustment.`);
      addEvent(`Rush order ${newOrderId} ingested`, `${newPartName} (${newQty} pcs) queued via expedited FIFO pipeline.`, Truck, "orange");
      notify(`⚡ RUSH ORDER INGESTED: ${newOrderId} dispatched to Station 1 via Priority FIFO.`);
    } else {
      // Standard FIFO: Appended to the tail of the arrival queue
      setOrders(prev => [...prev, newOrderObj]);
      notify(`✅ ORDER QUEUED (FIFO): ${newOrderId} entered Stage 1 FIFO Buffer.`);
    }
    insertOrderToDb(newOrderObj).catch(err => console.warn("Supabase order sync:", err));

    setOrderAddedBanner(true);
    setTimeout(() => setOrderAddedBanner(false), 3000);

    // Prepare next sequential ID
    const num = parseInt(newOrderId.replace(/\D/g, "") || "900", 10) + 1;
    setNewOrderId(`R-${num}`);
  };

  // Dispatch to Factory Schedule (Sync with main app Gantt)
  const dispatchToGantt = () => {
    setRush(true);
    setNotice("Rush order R-901 added: the scheduler prioritizes the urgent gear batch while preserving machine and operation constraints.");
    addEvent("Rush order R-901 active", "Urgent gear batch added to the production queue via FIFO pipeline.", Truck, "orange");
    notify("🚀 SCHEDULE INJECTED: Rush order R-901 synced with active factory Gantt timeline.");
    onClose();
  };

  const clearRushOrder = () => {
    setRush(false);
    setOrders(prev => prev.filter(o => o.type !== "rush"));
    setNotice("Rush order R-901 cleared. The demo has returned to the original order mix.");
    addEvent("Rush order cleared", "Production queue returned to baseline FIFO schedule.", RefreshCw, "blue");
    notify("Rush order cleared from factory schedule.");
  };

  return (
    <div className="rush-workflow-container">
      {/* Workflow Modal Header */}
      <div className="rwb-header">
        <div className="rwb-header-left">
          <div className="rwb-badge">
            <span className="live-pulse-dot active" />
            <span>ORDER DISPATCH BACKEND · PIPELINE + FIFO ENGINE</span>
          </div>
          <h2>New Order Workflow &amp; FIFO Pipeline Architecture</h2>
          <p>
            Orders follow a multi-stage manufacturing pipeline governed by <strong>First-In, First-Out (FIFO)</strong> queue dispatching, with priority preemption for verified rush orders.
          </p>
        </div>

        <div className="rwb-header-actions">
          {rush ? (
            <button className="rwb-btn danger-btn" onClick={clearRushOrder}>
              <X size={14} /> Clear Rush Order from Schedule
            </button>
          ) : (
            <button className="rwb-btn glow-btn" onClick={dispatchToGantt}>
              <Zap size={14} /> Inject Rush Order to Gantt Schedule
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rwb-tabs">
        <button className={`rwb-tab ${activeTab === "pipeline" ? "active" : ""}`} onClick={() => setActiveTab("pipeline")}>
          <Layers size={14} /> Manufacturing Pipeline Visualizer ({orders.length} Orders)
        </button>
        <button className={`rwb-tab ${activeTab === "queue" ? "active" : ""}`} onClick={() => setActiveTab("queue")}>
          <ListOrdered size={14} /> FIFO Order Queue &amp; Intake Form
        </button>
        <button className={`rwb-tab ${activeTab === "algorithm" ? "active" : ""}`} onClick={() => setActiveTab("algorithm")}>
          <Cpu size={14} /> FIFO Mathematical Model &amp; SLA Rules
        </button>
      </div>

      {orderAddedBanner && (
        <div className="order-added-toast">
          <CheckCircle2 size={16} /> Order successfully ingested into FIFO pipeline queue!
        </div>
      )}

      {/* TAB 1: PIPELINE STRUCTURE */}
      {activeTab === "pipeline" && (
        <div className="rwb-pipeline-view">
          {/* Visual 7-Stage Pipeline Strip */}
          <div className="pipeline-strip-card">
            <div className="psc-top">
              <div>
                <h4>Multi-Station Manufacturing Pipeline</h4>
                <p>Real-time tracking of parts moving through physical work centers under FIFO orchestration.</p>
              </div>
              <div className="psc-controls">
                <button
                  className={`pipeline-sim-btn ${autoPipeline ? "active" : ""}`}
                  onClick={() => setAutoPipeline(!autoPipeline)}
                >
                  {autoPipeline ? <Pause size={13} /> : <Play size={13} />}
                  <span>{autoPipeline ? "Pause Flow" : "Simulate Flow"}</span>
                </button>
                <button className="pipeline-step-btn" onClick={advancePipeline}>
                  <FastForward size={13} /> Step Pipeline (FIFO)
                </button>
              </div>
            </div>

            <div className="pipeline-stations-grid">
              {PIPELINE_STAGES.map((stg, i) => {
                const Icon = stg.icon;
                const ordersInStation = orders.filter(o => o.stage === stg.id);

                return (
                  <div key={stg.id} className="pipeline-station-node">
                    <div className="psn-header" style={{ borderTopColor: stg.color }}>
                      <span className="psn-step">0{i + 1}</span>
                      <Icon size={16} style={{ color: stg.color }} />
                      <div className="psn-titles">
                        <strong>{stg.name}</strong>
                        <small>{stg.station}</small>
                      </div>
                    </div>

                    <div className="psn-tray">
                      <div className="psn-count">{ordersInStation.length} Active</div>
                      {ordersInStation.map(ord => (
                        <div
                          key={ord.id}
                          className={`psn-order-chip ${ord.type === "rush" ? "rush-chip" : ""}`}
                          onClick={() => advanceSingleOrder(ord.id)}
                          title={`Click to advance ${ord.id} to next station`}
                        >
                          <div className="poc-top">
                            <span className="poc-id">{ord.id}</span>
                            {ord.type === "rush" && <span className="poc-rush-badge">RUSH</span>}
                          </div>
                          <div className="poc-part">{ord.part}</div>
                          <div className="poc-meta">
                            <span>{ord.qty} pcs</span>
                            <span className="poc-advance">Next →</span>
                          </div>
                        </div>
                      ))}

                      {ordersInStation.length === 0 && (
                        <div className="psn-empty">Station Idle</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Intake + Queue Summary Row */}
          <div className="pipeline-dual-row">
            {/* Pipeline Order Matrix */}
            <div className="pipeline-orders-matrix">
              <div className="pom-header">
                <h4>Orders Currently Traversing Pipeline</h4>
                <span className="pom-fifo-badge">FIFO Scheduling Active</span>
              </div>
              <div className="pom-table-wrap">
                <table className="pom-table">
                  <thead>
                    <tr>
                      <th>FIFO #</th>
                      <th>Order ID</th>
                      <th>Customer &amp; Part</th>
                      <th>Qty</th>
                      <th>Arrival Time</th>
                      <th>Current Pipeline Station</th>
                      <th>Priority</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord, idx) => (
                      <tr key={ord.id} className={ord.type === "rush" ? "rush-row-highlight" : ""}>
                        <td>
                          <span className={`fifo-rank-pill ${ord.type === "rush" ? "rush-rank" : ""}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <strong>{ord.id}</strong>
                          {ord.type === "rush" && <span className="rush-tag-inline">PRIORITY</span>}
                        </td>
                        <td>
                          <div className="pom-cust">{ord.customer}</div>
                          <div className="pom-part">{ord.part}</div>
                        </td>
                        <td>{ord.qty} pcs</td>
                        <td><small>{ord.arrivalTime}</small></td>
                        <td>
                          <div className="pom-station-col">
                            <span className="pom-station-name">{ord.status}</span>
                            <div className="pom-mini-track">
                              <span style={{ width: `${Math.round((ord.stage / 6) * 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`priority-tag ${ord.type === "rush" ? "rush" : "standard"}`}>
                            {ord.priority}
                          </span>
                        </td>
                        <td>
                          {ord.stage < 6 ? (
                            <button
                              className="pom-step-btn"
                              onClick={() => advanceSingleOrder(ord.id)}
                              title="Advance to next station in pipeline"
                            >
                              Advance →
                            </button>
                          ) : (
                            <span className="pom-done-tag"><Check size={11} /> Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Ingest Order Mini Form */}
            <div className="quick-ingest-card">
              <div className="qic-header">
                <Plus size={16} />
                <h4>Ingest New Order to Pipeline</h4>
              </div>
              <p className="qic-desc">Add a new standard or rush order. Orders queue up in FIFO arrival order.</p>

              <form onSubmit={handleCreateOrder} className="qic-form">
                <div className="qic-field">
                  <label>Order ID</label>
                  <input
                    type="text"
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    required
                  />
                </div>

                <div className="qic-field">
                  <label>Part / Component Name</label>
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="e.g. Helical Pinion Gear Batch"
                    required
                  />
                </div>

                <div className="qic-row">
                  <div className="qic-field">
                    <label>Batch Qty</label>
                    <input
                      type="number"
                      value={newQty}
                      min={10}
                      max={1000}
                      onChange={(e) => setNewQty(e.target.value)}
                    />
                  </div>
                  <div className="qic-field">
                    <label>Workflow Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="rush">⚡ Rush Order (Expedited FIFO)</option>
                      <option value="standard">Standard Order (Normal FIFO)</option>
                    </select>
                  </div>
                </div>

                <div className="qic-field">
                  <label>Client / Customer</label>
                  <input
                    type="text"
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="e.g. Bosch Powertrain"
                  />
                </div>

                <button type="submit" className="qic-submit-btn">
                  <Send size={13} /> Ingest Order into Pipeline
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIFO QUEUE & INTAKE */}
      {activeTab === "queue" && (
        <div className="rwb-queue-view">
          <div className="fifo-stats-bar">
            <div className="fsb-metric">
              <span>FIFO Scheduling Discipline</span>
              <strong>First-In, First-Out (100% Strict)</strong>
            </div>
            <div className="fsb-metric">
              <span>Average Queue Wait Time</span>
              <strong>14.2 minutes</strong>
            </div>
            <div className="fsb-metric">
              <span>Pipeline Station Utilization</span>
              <strong>89.4% (Bottleneck: Milling)</strong>
            </div>
            <div className="fsb-metric">
              <span>Starvation Risk</span>
              <strong style={{ color: "#10b981" }}>0% (FIFO Guaranteed)</strong>
            </div>
          </div>

          <div className="fifo-queue-list-card">
            <h4>Live FIFO Buffer Queue (Station 1 Pre-Machining)</h4>
            <p>
              In the First-In, First-Out rule, jobs are dispatched strictly according to arrival timestamp $T_{arr}$. When a Rush Order is approved, it preempts to the front of the FIFO execution pool without disrupting downstream work constraints.
            </p>

            <div className="queue-cards-wrap">
              {orders.map((ord, idx) => (
                <div key={ord.id} className={`queue-card ${ord.type === "rush" ? "rush-queue-glow" : ""}`}>
                  <div className="qc-rank">#{idx + 1}</div>
                  <div className="qc-info">
                    <div className="qc-title-row">
                      <strong>{ord.id}</strong>
                      <span className="qc-part">{ord.part}</span>
                      {ord.type === "rush" && <span className="qc-rush-pill">RUSH PREEMPTION</span>}
                    </div>
                    <div className="qc-meta-row">
                      <span>Customer: <strong>{ord.customer}</strong></span>
                      <span>Qty: <strong>{ord.qty} units</strong></span>
                      <span>Arrival: <strong>{ord.arrivalTime}</strong></span>
                      <span>Due: <strong>{ord.dueTime}</strong></span>
                      <span>Station: <strong>{ord.status}</strong></span>
                    </div>
                  </div>
                  <div className="qc-actions">
                    <button className="qc-step-btn" onClick={() => advanceSingleOrder(ord.id)}>
                      Advance Step →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIFO ALGORITHM DETAILS */}
      {activeTab === "algorithm" && (
        <div className="rwb-algo-view">
          <div className="algo-explanation-card">
            <div className="aec-header">
              <Cpu size={20} className="algo-icon" />
              <div>
                <h4>FIFO (First-In, First-Out) Scheduling Mathematical Model</h4>
                <p>Industrial Job Shop Pipeline Dispatching Algorithm</p>
              </div>
            </div>

            <div className="algo-grid">
              <div className="algo-box">
                <h5>1. Mathematical Formulation</h5>
                <p>
                  Let orders be indexed $O_1, O_2, \dots, O_n$ with arrival times $T_{arr}(O_1) \le T_{arr}(O_2) \le \dots \le T_{arr}(O_n)$.
                  The dispatch schedule satisfies:
                </p>
                <code>Start\_Time(O_i) &lt; Start\_Time(O_{'{i+1}'}) \quad \forall i</code>
                <p>This guarantees zero job starvation and deterministic queue latency.</p>
              </div>

              <div className="algo-box">
                <h5>2. Rush Order Pipeline Preemption</h5>
                <p>
                  When an urgent rush order $R_{rush}$ arrives:
                </p>
                <ul>
                  <li>It enters the expedited FIFO channel.</li>
                  <li>In-progress operations on machines are allowed to reach safe checkpoint cutoffs.</li>
                  <li>The rush order is assigned to the next available cycle without terminating existing clamped workpieces.</li>
                  <li>Downstream makespan is dynamically recalculated (+1.5h shift impact).</li>
                </ul>
              </div>

              <div className="algo-box">
                <h5>3. Multi-Station Pipeline Flow</h5>
                <p>
                  Work traverses 5 distinct manufacturing cells in pipeline sequence:
                </p>
                <code>[Intake] → [FIFO Buffer] → [CNC Milling/Turning] → [Drilling/Tapping] → [Grinding] → [CMM Inspection] → [Dispatch]</code>
              </div>

              <div className="algo-box">
                <h5>4. Real-Time Factory Digital Twin Integration</h5>
                <p>
                  Clicking <strong>"Inject Rush Order to Gantt Schedule"</strong> transmits the FIFO-prioritized batch directly into flexiScheduler's active timeline, updates the makespan to 20.1h, and logs the disruption event.
                </p>
              </div>
            </div>

            <div className="algo-footer-actions">
              <button className="rwb-btn glow-btn" onClick={dispatchToGantt}>
                <Zap size={14} /> Inject Rush Order to Gantt Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 2. MACHINE BREAKDOWN BACKEND (Telemetry, Diagnostic & Self-Healing Router)
 * ══════════════════════════════════════════════════════════════════════════════
 */
function MachineBreakdownBackend({
  breakdown,
  healingState,
  triggerManualBreakdown,
  triggerReheal,
  restoreCNC02,
  notify,
  onClose,
  onDispatchTwilioAlert
}) {
  const [selectedMachineId, setSelectedMachineId] = useState("CNC-02");
  const [faultCode, setFaultCode] = useState("ERR_SPINDLE_OVERTEMP_04");
  const [severity, setSeverity] = useState("Critical");

  const FAULT_OPTIONS = [
    { code: "ERR_SPINDLE_OVERTEMP_04", label: "Spindle Motor Thermal Runaway (114°C)", sev: "Critical" },
    { code: "ERR_SERVO_Z_AXIS_JAM", label: "Z-Axis Ball Screw Seizure &amp; Chuck Jam", sev: "Critical" },
    { code: "ERR_HYDRAULIC_PRESS_LOW", label: "Coolant &amp; Lubrication Line Pressure Loss", sev: "Moderate" },
    { code: "ERR_TOOL_CHUCK_ENCODER", label: "Automatic Tool Changer Sensor Dropout", sev: "Moderate" }
  ];

  return (
    <div className="mbb-container">
      <div className="mbb-header">
        <div className="mbb-badge">
          <span className={`live-pulse-dot ${breakdown ? "red" : "active"}`} />
          <span>EQUIPMENT FAULT &amp; TELEMETRY BACKEND</span>
        </div>
        <h2>Machine Breakdown &amp; Autonomous Rehealing Controller</h2>
        <p>
          Simulate equipment failures, monitor real-time sensor diagnostics, and trigger autonomous workload transfers to completed machines.
        </p>
      </div>

      <div className="mbb-grid">
        {/* Left: Configuration & Trigger */}
        <div className="mbb-card">
          <h4>Target Machine &amp; Fault Parameters</h4>

          <div className="mbb-field">
            <label>Select Target Machine</label>
            <div className="machine-select-pills">
              {["CNC-01", "CNC-02", "DRILL-03", "GRIND-04"].map(id => (
                <button
                  key={id}
                  className={`msp-btn ${selectedMachineId === id ? "active" : ""}`}
                  onClick={() => setSelectedMachineId(id)}
                >
                  <strong>{id}</strong>
                  <small>{id === "CNC-02" ? "Turning (Primary)" : id === "DRILL-03" ? "Drill (Backup)" : "Operational"}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="mbb-field">
            <label>Diagnostic Fault Code</label>
            <select
              value={faultCode}
              onChange={(e) => {
                setFaultCode(e.target.value);
                const opt = FAULT_OPTIONS.find(f => f.code === e.target.value);
                if (opt) setSeverity(opt.sev);
              }}
            >
              {FAULT_OPTIONS.map(f => (
                <option key={f.code} value={f.code}>{f.code} · {f.label}</option>
              ))}
            </select>
          </div>

          <div className="mbb-field">
            <label>Fault Severity: <strong>{severity}</strong></label>
            <div className="mbb-severity-indicator">
              <span className={`sev-tag ${severity === "Critical" ? "crit" : "mod"}`}>{severity}</span>
              <small>Immediate line stoppage required; dependent shafts hold buffer.</small>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="mbb-actions-stack">
            {!breakdown ? (
              <button
                className="mbb-trigger-btn red-btn"
                onClick={() => {
                  triggerManualBreakdown();
                  notify(`🚨 BREAKDOWN TRIGGERED: ${selectedMachineId} flagged with ${faultCode}.`);
                }}
              >
                <Flame size={15} /> Trigger Simulated Breakdown on {selectedMachineId}
              </button>
            ) : (
              <div className="mbb-active-breakdown-box">
                <div className="mbb-hazard-banner">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>{selectedMachineId} is currently BROKEN DOWN</strong>
                    <p>Needy tasks paused. Operations require rerouting.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="mbb-reheal-btn"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)" }}
                  onClick={() => onDispatchTwilioAlert && onDispatchTwilioAlert("manual")}
                >
                  <Send size={15} /> 🚨 Dispatch Breakdown Trigger Notification (WhatsApp & SMS)
                </button>

                {healingState === "idle" && (
                  <button className="mbb-reheal-btn pulse-glow" onClick={triggerReheal}>
                    <Sparkles size={15} /> Reassign Needy Work to Completed Machine (DRILL-03)
                  </button>
                )}

                {healingState === "healed" && (
                  <div className="mbb-healed-tag">
                    <CheckCircle2 size={16} /> Workload successfully transferred to DRILL-03!
                  </div>
                )}

                <button className="mbb-restore-btn" onClick={restoreCNC02}>
                  <Check size={14} /> Clear Breakdown &amp; Restore Standard Operations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Telemetry & Autonomous Routing Engine */}
        <div className="mbb-card telemetry-card">
          <h4>Live Telemetry &amp; Autonomous Rerouting Target</h4>

          <div className="telemetry-readouts">
            <div className="tr-chip">
              <span className="tr-lbl">Spindle Temp</span>
              <strong style={{ color: breakdown ? "#ef4444" : "#10b981" }}>
                {breakdown ? "114.8 °C (Overheat)" : "68.2 °C (Normal)"}
              </strong>
            </div>
            <div className="tr-chip">
              <span className="tr-lbl">Vibration</span>
              <strong style={{ color: breakdown ? "#ef4444" : "#10b981" }}>
                {breakdown ? "8.6 mm/s (Severe)" : "1.2 mm/s (Safe)"}
              </strong>
            </div>
            <div className="tr-chip">
              <span className="tr-lbl">Spindle RPM</span>
              <strong style={{ color: breakdown ? "#ef4444" : "#3b82f6" }}>
                {breakdown ? "0 RPM (Jammed)" : "3,600 RPM"}
              </strong>
            </div>
            <div className="tr-chip">
              <span className="tr-lbl">Hydraulic PSI</span>
              <strong style={{ color: breakdown ? "#f59e0b" : "#10b981" }}>
                {breakdown ? "14.2 PSI (Low)" : "42.5 PSI"}
              </strong>
            </div>
          </div>

          <div className="reroute-recommendation-box">
            <div className="rrb-header">
              <Zap size={16} style={{ color: "#8b5cf6" }} />
              <strong>Autonomous Rerouting Recommendation</strong>
            </div>
            <p>
              Digital Twin scans active machine completion states across Shift A.
            </p>
            <div className="rrb-match">
              <div className="rrb-match-icon"><CheckCircle2 size={16} color="#10b981" /></div>
              <div>
                <strong>Completed Machine Detected: DRILL-03</strong>
                <p>100% of morning quota finished early (11:45 AM). Zero conflict with remaining drilling orders. Available capacity: +3.2 hours.</p>
              </div>
            </div>
          </div>

          <div className="mbb-status-footer">
            <span>Machine Health Status:</span>
            <strong style={{ color: breakdown ? "#ef4444" : "#10b981" }}>
              {breakdown ? "CRITICAL HAZARD · LINE PAUSED" : "ALL SYSTEMS GREEN"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 3. MATERIAL DELAY BACKEND (Supply Chain, SKU Catalog & Buffer Stock)
 * ══════════════════════════════════════════════════════════════════════════════
 */
function MaterialDelayBackend({
  materialDelay,
  setMaterialDelay,
  addEvent,
  notify,
  setNotice,
  onClose
}) {
  const [selectedSku, setSelectedSku] = useState("MAT-1042");
  const [delayDuration, setDelayDuration] = useState(90);
  const [supplier, setSupplier] = useState("Apex Metals Consortium");

  const SKUS = [
    { sku: "MAT-1042", name: "Alloy Steel Bar 45C (Shafts)", stock: 128, min: 60, status: "Depleting" },
    { sku: "MAT-2081", name: "Aluminum 6061 Billet (Brackets)", stock: 42, min: 50, status: "Low Stock" },
    { sku: "WIP-3015", name: "Annealed Gear Blanks", stock: 86, min: 40, status: "Buffer Adequate" },
    { sku: "CMP-1028", name: "Precision Bearing Sets", stock: 214, min: 80, status: "Healthy" }
  ];

  const handleApplyDelay = () => {
    const next = !materialDelay;
    setMaterialDelay(next);

    if (next) {
      setNotice(`Material delay active: ${selectedSku} shipment from ${supplier} delayed by ${delayDuration}m. Dependent operations paused.`);
      addEvent(`Material delay: ${selectedSku}`, `Steel shipment delayed by ${delayDuration}m; dependent shaft jobs on hold.`, Boxes, "amber");
      notify(`📦 MATERIAL DISRUPTION: ${selectedSku} delayed by ${delayDuration}m.`);
    } else {
      setNotice("Steel bar stock received. Material constraints cleared and dependent operations can resume.");
      addEvent("Steel bar stock received", "Shipment arrived; dependent shaft jobs released.", Boxes, "green");
      notify("✅ Material received: Dependent operations resumed.");
    }
    onClose();
  };

  return (
    <div className="mdb-container">
      <div className="mdb-header">
        <div className="mdb-badge">
          <span className={`live-pulse-dot ${materialDelay ? "amber" : "active"}`} />
          <span>SUPPLY CHAIN &amp; WIP LOGISTICS BACKEND</span>
        </div>
        <h2>Material Supply Delay &amp; Inventory Buffer Studio</h2>
        <p>
          Simulate supplier shipment delays, compute safety buffer exhaustion times, and hold dependent machine operations.
        </p>
      </div>

      <div className="mdb-grid">
        {/* Left: Material Selection */}
        <div className="mdb-card">
          <h4>Material SKU &amp; Supplier Parameters</h4>

          <div className="mdb-field">
            <label>Select Affected Material SKU</label>
            <div className="sku-options-list">
              {SKUS.map(item => (
                <div
                  key={item.sku}
                  className={`sku-item-card ${selectedSku === item.sku ? "active" : ""}`}
                  onClick={() => setSelectedSku(item.sku)}
                >
                  <div className="sic-left">
                    <strong>{item.name}</strong>
                    <small>{item.sku}</small>
                  </div>
                  <div className="sic-right">
                    <span>{item.stock} pcs</span>
                    <small>{item.status}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mdb-field">
            <label>Supplier / Carrier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          <div className="mdb-field">
            <label>Estimated Transit Delay</label>
            <div className="delay-pills">
              {[30, 60, 90, 180].map(mins => (
                <button
                  key={mins}
                  className={`delay-pill ${delayDuration === mins ? "active" : ""}`}
                  onClick={() => setDelayDuration(mins)}
                >
                  {mins} mins
                </button>
              ))}
            </div>
          </div>

          <button
            className={`mdb-apply-btn ${materialDelay ? "clear-btn" : "amber-btn"}`}
            onClick={handleApplyDelay}
          >
            {materialDelay ? <Check size={14} /> : <Boxes size={14} />}
            <span>{materialDelay ? "Receive Material & Clear Delay" : `Simulate ${delayDuration}m Material Delay`}</span>
          </button>
        </div>

        {/* Right: Impact Analysis */}
        <div className="mdb-card impact-card">
          <h4>Supply Buffer &amp; Production Line Impact</h4>

          <div className="buffer-depletion-box">
            <div className="bdb-top">
              <span>Safety Stock Buffer Depletion</span>
              <strong style={{ color: materialDelay ? "#f59e0b" : "#10b981" }}>
                {materialDelay ? "Depletes in 45 mins" : "Adequate Buffer (2.4 Shifts)"}
              </strong>
            </div>
            <div className="bdb-bar">
              <span style={{ width: materialDelay ? "28%" : "82%", background: materialDelay ? "#f59e0b" : "#10b981" }} />
            </div>
          </div>

          <div className="affected-ops-card">
            <h5>Impacted Workstations:</h5>
            <div className="aoc-item held">
              <span className="aoc-dot red" />
              <div>
                <strong>CNC-02 (Turning) · Drive Shaft Operations</strong>
                <p>HELD: Requires MAT-1042 cold-rolled steel bar stock.</p>
              </div>
            </div>
            <div className="aoc-item running">
              <span className="aoc-dot green" />
              <div>
                <strong>CNC-01 (Milling) · Gear Blank Machining</strong>
                <p>RUNNING: Independent raw material supply (Aluminum/Cast Iron).</p>
              </div>
            </div>
            <div className="aoc-item running">
              <span className="aoc-dot green" />
              <div>
                <strong>DRILL-03 &amp; GRIND-04 · Finishing &amp; QC</strong>
                <p>RUNNING: Secondary operations continuing on existing buffers.</p>
              </div>
            </div>
          </div>

          <div className="mdb-footer-note">
            <HelpCircle size={14} />
            <span>The scheduler will maintain other feasible operations while queuing dependent shaft batches.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
