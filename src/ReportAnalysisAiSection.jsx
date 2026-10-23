import React, { useState, useMemo } from "react";
import {
  TrendingUp, Cpu, Flame, Activity, Zap, AlertTriangle,
  CheckCircle2, Clock, Calendar, BarChart3, ShieldCheck,
  RefreshCw, ArrowUpRight, ArrowDownRight, Layers, Gauge,
  Download, Sparkles, SlidersHorizontal, ChevronRight, Info
} from "lucide-react";

// Base machine profiles
const MACHINES_CONFIG = [
  {
    id: "CNC-01",
    name: "CNC Milling",
    role: "Gear housing & heavy engine casing",
    baseLoad: 87.4,
    baseKwhPerDay: 114,
    baseHeat: 58.2,
    baseVibration: 1.8,
    basePartsPerDay: 160,
    powerFactor: "0.94",
    qualityYield: "99.2%",
    riskLevel: "Low",
    riskScore: 12,
    failurePrediction: "Healthy · Routine belt check in ~18 days",
  },
  {
    id: "CNC-02",
    name: "CNC Turning",
    role: "Drive shaft & axle turning line",
    baseLoad: 76.5,
    baseKwhPerDay: 137,
    baseHeat: 78.4,
    baseVibration: 5.4,
    basePartsPerDay: 131,
    powerFactor: "0.88",
    qualityYield: "97.4%",
    riskLevel: "Critical",
    riskScore: 78,
    failurePrediction: "⚠️ Impending Spindle Seizure in ~4.5 operating hours if thermal load continues",
  },
  {
    id: "DRILL-03",
    name: "Drilling Center",
    role: "Precision mounting plate & bolt tapping",
    baseLoad: 92.1,
    baseKwhPerDay: 75,
    baseHeat: 52.6,
    baseVibration: 1.2,
    basePartsPerDay: 203,
    powerFactor: "0.96",
    qualityYield: "99.8%",
    riskLevel: "Optimal",
    riskScore: 8,
    failurePrediction: "Optimal condition · High spare capacity available for backup workload",
  },
  {
    id: "GRIND-04",
    name: "Grinding Station",
    role: "Gear tooth surface finish & mirror polish",
    baseLoad: 71.8,
    baseKwhPerDay: 96,
    baseHeat: 64.8,
    baseVibration: 2.9,
    basePartsPerDay: 115,
    powerFactor: "0.92",
    qualityYield: "98.9%",
    riskLevel: "Moderate",
    riskScore: 24,
    failurePrediction: "Moderate wear on diamond dressing head · Recalibrate within 48h",
  },
  {
    id: "FINISH-05",
    name: "Finishing & Deburring",
    role: "Edge deburr, ultrasonic wash & QC pack",
    baseLoad: 84.3,
    baseKwhPerDay: 72,
    baseHeat: 46.1,
    baseVibration: 0.9,
    basePartsPerDay: 196,
    powerFactor: "0.95",
    qualityYield: "99.5%",
    riskLevel: "Low",
    riskScore: 10,
    failurePrediction: "Optimal condition · Minimal wear pattern detected",
  }
];

// Generate deterministic, realistic 30-day historical data per machine
const generateHistoricalDataset = () => {
  const dataset = {};

  MACHINES_CONFIG.forEach(m => {
    dataset[m.id] = [];
    for (let day = 1; day <= 30; day++) {
      // Small seasonal/shift variance
      const variance = Math.sin(day * 0.7) * 4.5 + Math.cos(day * 1.3) * 2.5;
      const load = Math.min(98, Math.max(68, Math.round((m.baseLoad + variance) * 10) / 10));
      const kwh = Math.round(m.baseKwhPerDay * (load / m.baseLoad));
      const parts = Math.round(m.basePartsPerDay * (load / m.baseLoad));
      
      // For CNC-02, progressive thermal increase in the last 12 days
      let heat = m.baseHeat + (Math.sin(day * 0.5) * 2.2);
      if (m.id === "CNC-02") {
        if (day >= 18) {
          heat += (day - 18) * 1.1; // spikes from 65°C up to 78.4°C
        }
      }
      heat = Math.round(heat * 10) / 10;

      const runtimeHrs = Math.round((21.5 * (load / 100) + 1.2) * 10) / 10;

      dataset[m.id].push({
        day,
        date: `Day ${day}`,
        load,
        kwh,
        heat,
        parts,
        runtimeHrs
      });
    }
  });

  // Calculate factory aggregate 'all'
  dataset["all"] = [];
  for (let day = 1; day <= 30; day++) {
    let totalKwh = 0;
    let totalParts = 0;
    let totalRuntime = 0;
    let totalLoad = 0;
    let maxHeat = 0;

    MACHINES_CONFIG.forEach(m => {
      const entry = dataset[m.id][day - 1];
      totalKwh += entry.kwh;
      totalParts += entry.parts;
      totalRuntime += entry.runtimeHrs;
      totalLoad += entry.load;
      if (entry.heat > maxHeat) maxHeat = entry.heat;
    });

    dataset["all"].push({
      day,
      date: `Day ${day}`,
      load: Math.round((totalLoad / MACHINES_CONFIG.length) * 10) / 10,
      kwh: totalKwh,
      heat: maxHeat,
      parts: totalParts,
      runtimeHrs: Math.round(totalRuntime * 10) / 10
    });
  }

  return dataset;
};

const fullHistoricalData = generateHistoricalDataset();

export default function ReportAnalysisAiSection({ onRehealWorkload }) {
  const [activeTab, setActiveTab] = useState("report"); // 'report' | 'ai'
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [timeRange, setTimeRange] = useState("30d"); // '7d' | '14d' | '30d'
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleteNotice, setScanCompleteNotice] = useState(null);

  // Determine slice count based on selected timeRange
  const dayCount = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;

  // Sliced timeline for the currently selected machine
  const activeMachineTimeline = useMemo(() => {
    const list = fullHistoricalData[selectedMachine] || fullHistoricalData["all"];
    return list.slice(30 - dayCount);
  }, [selectedMachine, dayCount]);

  // Aggregate KPIs for the selected timeframe and machine
  const computedKpis = useMemo(() => {
    let sumRuntime = 0;
    let sumKwh = 0;
    let sumParts = 0;
    let sumLoad = 0;
    let peakHeat = 0;

    activeMachineTimeline.forEach(d => {
      sumRuntime += d.runtimeHrs;
      sumKwh += d.kwh;
      sumParts += d.parts;
      sumLoad += d.load;
      if (d.heat > peakHeat) peakHeat = d.heat;
    });

    const avgLoad = Math.round((sumLoad / activeMachineTimeline.length) * 10) / 10;
    // Theoretical maximum running hours
    const maxTheoreticalHrs = selectedMachine === "all" ? dayCount * 24 * 5 : dayCount * 24;
    const uptimePct = Math.min(99.4, Math.round((sumRuntime / (maxTheoreticalHrs * 0.92)) * 1000) / 10);

    const mCfg = MACHINES_CONFIG.find(m => m.id === selectedMachine);

    return {
      totalHours: Math.round(sumRuntime).toLocaleString() + " hrs",
      uptime: uptimePct.toFixed(1) + "%",
      avgUtilization: avgLoad.toFixed(1) + "%",
      totalKwh: sumKwh.toLocaleString() + " kWh",
      partsProduced: sumParts.toLocaleString(),
      peakHeat: peakHeat.toFixed(1) + "°C",
      qualityYield: mCfg ? mCfg.qualityYield : "98.9%",
      powerFactor: mCfg ? mCfg.powerFactor : "0.94 PF"
    };
  }, [activeMachineTimeline, selectedMachine, dayCount]);

  // Matrix table per-machine summaries for the selected timeframe
  const tableRows = useMemo(() => {
    return MACHINES_CONFIG.map(m => {
      const slice = fullHistoricalData[m.id].slice(30 - dayCount);
      let runtime = 0;
      let kwh = 0;
      let loadSum = 0;
      let maxTemp = 0;

      slice.forEach(d => {
        runtime += d.runtimeHrs;
        kwh += d.kwh;
        loadSum += d.load;
        if (d.heat > maxTemp) maxTemp = d.heat;
      });

      return {
        ...m,
        runtimeStr: Math.round(runtime).toLocaleString() + " hrs",
        kwhStr: kwh.toLocaleString() + " kWh",
        avgLoadPct: (loadSum / slice.length).toFixed(1) + "%",
        avgTempStr: maxTemp.toFixed(1) + "°C"
      };
    });
  }, [dayCount]);

  // Simulate real-time AI Prediction scan
  const handleRunAiDiagnostic = () => {
    setIsScanning(true);
    setScanCompleteNotice(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleteNotice({
        time: new Date().toLocaleTimeString(),
        confidence: "96.4%",
        result: `Neural Inference re-calculated across past ${dayCount} days of sensor points. CNC-02 Spindle Motor confirmed at 78% breakdown probability due to continuous thermal rise (+16.4°C over nominal threshold).`
      });
    }, 1500);
  };

  return (
    <section className="section analytics-section" id="analytics">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span /> 30-DAY TELEMETRY &amp; NEURAL PREDICTION
          </div>
          <h2>Report Analysis &amp; AI Prediction</h2>
          <p>
            Past operational power utilization reports combined with LSTM AI predictive breakdown telemetry.
          </p>
        </div>

        {/* Tab Switcher: Report vs AI Prediction */}
        <div className="analytics-tabs-group">
          <button
            className={`analytics-tab-btn ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            <BarChart3 size={15} /> Power &amp; Utilization Report
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Cpu size={15} /> AI Breakdown Prediction &amp; Heat
            <span className="ai-pulse-badge">AI LIVE</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Machine selector & Timeframe */}
      <div className="analytics-toolbar">
        <div className="toolbar-machines">
          <span className="toolbar-label">Scope:</span>
          {[
            { id: "all", label: "All Lines" },
            { id: "CNC-01", label: "CNC-01 Milling" },
            { id: "CNC-02", label: "CNC-02 Turning" },
            { id: "DRILL-03", label: "DRILL-03 Drill" },
            { id: "GRIND-04", label: "GRIND-04 Grind" },
            { id: "FINISH-05", label: "FINISH-05 Finish" }
          ].map(m => (
            <button
              key={m.id}
              className={`machine-filter-chip ${selectedMachine === m.id ? "active" : ""}`}
              onClick={() => setSelectedMachine(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="toolbar-timeframe">
          <span className="toolbar-label">Timeframe:</span>
          {[
            { id: "7d", label: "Last 7 Days" },
            { id: "14d", label: "Last 14 Days" },
            { id: "30d", label: "Last 30 Days" }
          ].map(t => (
            <button
              key={t.id}
              className={`time-chip ${timeRange === t.id ? "active" : ""}`}
              onClick={() => setTimeRange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          TAB 1: DYNAMIC REPORT ANALYSIS & POWER UTILIZATION
      ──────────────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="analytics-content-panel">
          {/* Top 4 Dynamic KPI Cards */}
          <div className="analytics-kpi-grid">
            <div className="an-card">
              <div className="an-card-top">
                <span>Operational Uptime ({dayCount} Days)</span>
                <span className="an-icon green"><Activity size={16} /></span>
              </div>
              <div className="an-value">{computedKpis.uptime}</div>
              <div className="an-meta green">
                <ArrowUpRight size={13} /> {computedKpis.totalHours} active execution
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Power Utilization</span>
                <span className="an-icon amber"><Zap size={16} /></span>
              </div>
              <div className="an-value">{computedKpis.avgUtilization}</div>
              <div className="an-meta amber">
                {computedKpis.totalKwh} electricity consumed
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Parts Output</span>
                <span className="an-icon blue"><Layers size={16} /></span>
              </div>
              <div className="an-value">{computedKpis.partsProduced} <small>parts</small></div>
              <div className="an-meta green">
                <ShieldCheck size={13} /> {computedKpis.qualityYield} Quality pass rate
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Thermal &amp; Power Factor</span>
                <span className="an-icon purple"><Gauge size={16} /></span>
              </div>
              <div className="an-value">
                {selectedMachine === "all" ? "94.2% Eff" : computedKpis.powerFactor}
              </div>
              <div className="an-meta">
                {selectedMachine === "all" ? "Peak plant temp: " + computedKpis.peakHeat : `Peak Temp: ${computedKpis.peakHeat}`}
              </div>
            </div>
          </div>

          {/* Interactive Dynamic Daily Power Draw & Utilization Bar Chart */}
          <div className="panel chart-panel">
            <div className="chart-header">
              <div>
                <h3>
                  Daily Power Consumption &amp; Capacity Utilization (Last {dayCount} Days
                  {selectedMachine !== "all" ? ` · ${selectedMachine}` : " · All Lines"})
                </h3>
                <p>
                  Showing {dayCount} daily operational records. Hover over any bar to view exact daily kWh, load factor, and operating temperature.
                </p>
              </div>
              <div className="chart-legend">
                <span><i className="c-dot green" /> Nominal (&lt; 85%)</span>
                <span><i className="c-dot amber" /> Peak Load (85-92%)</span>
                <span><i className="c-dot red" /> High Strain (&gt; 92%)</span>
              </div>
            </div>

            {/* Visual Dynamic Bar Chart */}
            <div className="bar-chart-container">
              {activeMachineTimeline.map((d) => {
                const isHigh = d.load >= 92;
                const isPeak = d.load >= 85 && d.load < 92;
                const barColor = isHigh ? "var(--red)" : isPeak ? "var(--amber)" : "var(--green)";

                return (
                  <div
                    key={d.day}
                    className="chart-bar-col"
                    title={`Day ${d.day}: ${d.load}% load, ${d.kwh} kWh, Heat: ${d.heat}°C`}
                  >
                    <div className="chart-tooltip">
                      <strong>Day {d.day}</strong>
                      <span>Load: {d.load}%</span>
                      <span>Power: {d.kwh} kWh</span>
                      <span>Heat: {d.heat}°C</span>
                      <span>Parts: {d.parts} pcs</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${d.load}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="bar-day-lbl">D{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine-by-Machine Dynamic Comparison Matrix Table */}
          <div className="panel matrix-panel">
            <div className="panel-heading">
              <div>
                <h3>Machine Workload &amp; Power Summary Matrix ({dayCount}-Day Audit)</h3>
                <p>Audited performance metrics scaled dynamically to the selected {dayCount}-day window.</p>
              </div>
              <span className="test-badge">{dayCount}-DAY AUDIT</span>
            </div>

            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Primary Function</th>
                    <th>Runtime ({dayCount}d)</th>
                    <th>Avg Load</th>
                    <th>Total kWh ({dayCount}d)</th>
                    <th>Peak Temp</th>
                    <th>Quality Yield</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((m) => {
                    const isHazard = m.id === "CNC-02";
                    const isFocused = selectedMachine === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={`${isHazard ? "row-hazard" : ""} ${isFocused ? "row-selected-focus" : ""}`}
                        onClick={() => setSelectedMachine(m.id)}
                        style={{ cursor: "pointer" }}
                        title={`Click to filter dashboard to ${m.name}`}
                      >
                        <td>
                          <strong>{m.id}</strong>
                          <small>{m.name}</small>
                        </td>
                        <td>{m.role}</td>
                        <td><strong>{m.runtimeStr}</strong></td>
                        <td>
                          <div className="inline-progress">
                            <span>{m.avgLoadPct}</span>
                            <div className="mini-prog-track">
                              <div
                                className="mini-prog-fill"
                                style={{
                                  width: m.avgLoadPct,
                                  backgroundColor: isHazard ? "#ef4444" : "#22c55e"
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td><strong>{m.kwhStr}</strong></td>
                        <td>
                          <span className={`temp-badge ${isHazard ? "hot" : "cool"}`}>
                            <Flame size={11} /> {m.avgTempStr}
                          </span>
                        </td>
                        <td><span className="yield-tag">{m.qualityYield}</span></td>
                        <td>
                          <span className={`status-badge-matrix ${isHazard ? "hazard" : "healthy"}`}>
                            {isHazard ? "Spindle Strain" : "Nominal"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TAB 2: AI PREDICTION & BREAKDOWN FORECASTING
      ──────────────────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <div className="analytics-content-panel ai-panel-theme">
          {/* AI Banner with Live Neural Scanner Trigger */}
          <div className="ai-engine-banner">
            <div className="ai-banner-left">
              <div className="ai-badge-header">
                <Sparkles size={16} className="sparkle-anim" />
                <span>AUTOTWIN LSTM NEURAL PREDICTIVE ENGINE · V4.2</span>
              </div>
              <h3>AI Failure Forecaster &amp; Thermal Degradation Model</h3>
              <p>
                Continuous multi-variate telemetry analysis correlating past {dayCount} days of power draw variance,
                spindle harmonic jitter, and thermal gradients to forecast equipment failure before downtime occurs.
              </p>
            </div>

            <div className="ai-banner-actions">
              <button
                className={`ai-diagnostic-run-btn ${isScanning ? "scanning" : ""}`}
                onClick={handleRunAiDiagnostic}
                disabled={isScanning}
              >
                <RefreshCw size={15} className={isScanning ? "spin-icon" : ""} />
                <span>{isScanning ? "Scanning Sensor Telemetry..." : "Run AI Predictive Diagnostic"}</span>
              </button>
            </div>
          </div>

          {/* AI Diagnostic Results Notification if scanned */}
          {scanCompleteNotice && (
            <div className="ai-scan-result-card">
              <CheckCircle2 size={18} className="check-ai" />
              <div>
                <strong>Diagnostic Scan Completed at {scanCompleteNotice.time} (Confidence: {scanCompleteNotice.confidence})</strong>
                <p>{scanCompleteNotice.result}</p>
              </div>
            </div>
          )}

          {/* Predictive Machine Risk Grid */}
          <div className="ai-machine-risk-grid">
            {/* CNC-02: Critical Impending Failure */}
            <div className="ai-risk-card high-risk">
              <div className="arc-head">
                <div className="arc-title">
                  <span className="arc-dot red" />
                  <div>
                    <strong>CNC Turning (CNC-02)</strong>
                    <small>High Duty Axis · Drive Shaft Line</small>
                  </div>
                </div>
                <div className="arc-risk-pill red">
                  <span>RISK SCORE: 78%</span>
                </div>
              </div>

              <div className="arc-alert-banner">
                <AlertTriangle size={18} className="blink-alert" />
                <div>
                  <strong>PREDICTED FAILURE IN: ~4.5 OPERATING HOURS</strong>
                  <p>Spindle motor bearing thermal runaway detected under heavy cut torque.</p>
                </div>
              </div>

              {/* Sensor Telemetry Readings */}
              <div className="arc-telemetry-grid">
                <div className="arc-tele-box alert-box">
                  <span className="tele-lbl"><Flame size={12} /> Spindle Heat</span>
                  <strong className="tele-val text-red">78.4°C</strong>
                  <small>Threshold: 65°C (+20.6% OVER)</small>
                </div>

                <div className="arc-tele-box alert-box">
                  <span className="tele-lbl"><Activity size={12} /> Harmonic Jitter</span>
                  <strong className="tele-val text-red">5.4 mm/s</strong>
                  <small>ISO limit: 2.5 mm/s (Bearing race wear)</small>
                </div>

                <div className="arc-tele-box">
                  <span className="tele-lbl"><Zap size={12} /> Current Variance</span>
                  <strong className="tele-val text-amber">+18.4%</strong>
                  <small>Current surge during roughing</small>
                </div>

                <div className="arc-tele-box">
                  <span className="tele-lbl"><Clock size={12} /> Mean Time to Failure</span>
                  <strong className="tele-val text-red">4.5 hrs</strong>
                  <small>Calculated by LSTM regression</small>
                </div>
              </div>

              {/* AI Prescribed Mitigation Action */}
              <div className="arc-action-box">
                <div className="action-title">
                  <Cpu size={14} /> <strong>AI Prescribed Countermeasure:</strong>
                </div>
                <p>
                  Workload re-allocation recommended. Transfer pending CNC-02 shaft turning jobs to completed machine <strong>DRILL-03</strong> which has 0% load remaining.
                </p>
                {onRehealWorkload && (
                  <button className="arc-reheal-action-btn" onClick={onRehealWorkload}>
                    <Sparkles size={13} /> Execute Preemptive Workload Reassignment
                  </button>
                )}
              </div>
            </div>

            {/* CNC-01: Milling (Healthy) */}
            <div className="ai-risk-card healthy-risk">
              <div className="arc-head">
                <div className="arc-title">
                  <span className="arc-dot green" />
                  <div>
                    <strong>CNC Milling (CNC-01)</strong>
                    <small>Gear Housing Line</small>
                  </div>
                </div>
                <div className="arc-risk-pill green">
                  <span>RISK SCORE: 12%</span>
                </div>
              </div>

              <div className="arc-telemetry-grid">
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Flame size={12} /> Thermal Temp</span>
                  <strong className="tele-val">58.2°C</strong>
                  <small>Within safe margin (&lt; 65°C)</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Activity size={12} /> Vibration</span>
                  <strong className="tele-val">1.8 mm/s</strong>
                  <small>Smooth kinematic motion</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Zap size={12} /> Power Factor</span>
                  <strong className="tele-val">0.94 PF</strong>
                  <small>High electrical efficiency</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Clock size={12} /> Next Maintenance</span>
                  <strong className="tele-val">18 Days</strong>
                  <small>Routine belt inspection</small>
                </div>
              </div>

              <div className="arc-status-footer">
                <CheckCircle2 size={14} className="text-green" />
                <span>Optimal acoustic and thermal metrics. 0% breakdown probability today.</span>
              </div>
            </div>

            {/* DRILL-03: Drill (Healthy / Surplus capacity) */}
            <div className="ai-risk-card healthy-risk">
              <div className="arc-head">
                <div className="arc-title">
                  <span className="arc-dot green" />
                  <div>
                    <strong>Drilling Center (DRILL-03)</strong>
                    <small>Mounting Plate Line</small>
                  </div>
                </div>
                <div className="arc-risk-pill green">
                  <span>RISK SCORE: 8% (SURPLUS CAPACITY)</span>
                </div>
              </div>

              <div className="arc-telemetry-grid">
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Flame size={12} /> Thermal Temp</span>
                  <strong className="tele-val">52.6°C</strong>
                  <small>Cool running cycle</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Activity size={12} /> Vibration</span>
                  <strong className="tele-val">1.2 mm/s</strong>
                  <small>Precision balanced spindle</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Zap size={12} /> Efficiency</span>
                  <strong className="tele-val">96.8%</strong>
                  <small>Ultra-low thermal loss</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Layers size={12} /> Capacity Status</span>
                  <strong className="tele-val text-green">100% Ready</strong>
                  <small>Shift quota finished early</small>
                </div>
              </div>

              <div className="arc-status-footer">
                <CheckCircle2 size={14} className="text-green" />
                <span>Prime candidate for digital twin self-healing load absorption.</span>
              </div>
            </div>

            {/* GRIND-04: Grinding (Watchlist) */}
            <div className="ai-risk-card moderate-risk">
              <div className="arc-head">
                <div className="arc-title">
                  <span className="arc-dot amber" />
                  <div>
                    <strong>Grinding Station (GRIND-04)</strong>
                    <small>Finishing Line</small>
                  </div>
                </div>
                <div className="arc-risk-pill amber">
                  <span>RISK SCORE: 24%</span>
                </div>
              </div>

              <div className="arc-telemetry-grid">
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Flame size={12} /> Thermal Temp</span>
                  <strong className="tele-val">64.8°C</strong>
                  <small>Slight friction rise</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Activity size={12} /> Vibration</span>
                  <strong className="tele-val text-amber">2.9 mm/s</strong>
                  <small>Minor wheel unbalance</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Zap size={12} /> Power Factor</span>
                  <strong className="tele-val">0.92 PF</strong>
                  <small>Nominal VFD draw</small>
                </div>
                <div className="arc-tele-box">
                  <span className="tele-lbl"><Clock size={12} /> Calibrate In</span>
                  <strong className="tele-val">48 Hours</strong>
                  <small>Diamond wheel dresser</small>
                </div>
              </div>

              <div className="arc-status-footer">
                <Info size={14} className="text-amber" />
                <span>Watchlist: Schedule wheel dressing during the upcoming third shift break.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
