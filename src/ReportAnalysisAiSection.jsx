import React, { useState } from "react";
import {
  TrendingUp, Cpu, Flame, Activity, Zap, AlertTriangle,
  CheckCircle2, Clock, Calendar, BarChart3, ShieldCheck,
  RefreshCw, ArrowUpRight, ArrowDownRight, Layers, Gauge,
  Download, Sparkles, SlidersHorizontal, ChevronRight, Info
} from "lucide-react";

// 30-Day Historical Data per machine
const machineHistoryData = {
  "all": {
    name: "All Factory Lines",
    uptime: "93.4%",
    totalHours: "3,241 hrs",
    avgUtilization: "82.6%",
    totalKwh: "14,820 kWh",
    avgCostPerHour: "$4.12",
    partsProduced: "24,210",
    qualityYield: "98.9%",
    co2Footprint: "5.8 tonnes",
    powerTrend: "+2.1% vs prev 30d",
  },
  "CNC-01": {
    name: "CNC Milling (CNC-01)",
    role: "Gear housing & heavy engine casing",
    uptime: "95.1%",
    totalHours: "684 hrs",
    avgUtilization: "87.4%",
    totalKwh: "3,420 kWh",
    powerFactor: "0.94",
    avgHeat: "58.2°C",
    vibrationRms: "1.8 mm/s",
    partsProduced: "4,820",
    qualityYield: "99.2%",
    riskLevel: "Low",
    riskScore: 12,
    failurePrediction: "Healthy · No maintenance required for ~18 days",
  },
  "CNC-02": {
    name: "CNC Turning (CNC-02)",
    role: "Drive shaft & axle turning line",
    uptime: "85.0%",
    totalHours: "612 hrs",
    avgUtilization: "76.5%",
    totalKwh: "4,110 kWh",
    powerFactor: "0.88",
    avgHeat: "78.4°C", // High heat!
    vibrationRms: "5.4 mm/s", // High vibration!
    partsProduced: "3,940",
    qualityYield: "97.4%",
    riskLevel: "Critical",
    riskScore: 78,
    failurePrediction: "⚠️ Impending Spindle Seizure in ~4.5 operating hours if thermal load continues",
  },
  "DRILL-03": {
    name: "Drilling Center (DRILL-03)",
    role: "Precision mounting plate & bolt tapping",
    uptime: "97.9%",
    totalHours: "705 hrs",
    avgUtilization: "92.1%",
    totalKwh: "2,240 kWh",
    powerFactor: "0.96",
    avgHeat: "52.6°C",
    vibrationRms: "1.2 mm/s",
    partsProduced: "6,100",
    qualityYield: "99.8%",
    riskLevel: "Optimal",
    riskScore: 8,
    failurePrediction: "Optimal condition · High spare capacity available for backup workload",
  },
  "GRIND-04": {
    name: "Grinding Station (GRIND-04)",
    role: "Gear tooth surface finish & mirror polish",
    uptime: "91.2%",
    totalHours: "580 hrs",
    avgUtilization: "71.8%",
    totalKwh: "2,890 kWh",
    powerFactor: "0.92",
    avgHeat: "64.8°C",
    vibrationRms: "2.9 mm/s",
    partsProduced: "3,450",
    qualityYield: "98.9%",
    riskLevel: "Moderate",
    riskScore: 24,
    failurePrediction: "Moderate wear on diamond dressing head · Recalibrate within 48h",
  },
  "FINISH-05": {
    name: "Finishing & Deburring (FINISH-05)",
    role: "Edge deburr, ultrasonic wash & QC pack",
    uptime: "96.4%",
    totalHours: "660 hrs",
    avgUtilization: "84.3%",
    totalKwh: "2,160 kWh",
    powerFactor: "0.95",
    avgHeat: "46.1°C",
    vibrationRms: "0.9 mm/s",
    partsProduced: "5,900",
    qualityYield: "99.5%",
    riskLevel: "Low",
    riskScore: 10,
    failurePrediction: "Optimal condition · Minimal wear pattern detected",
  }
};

// 30-Day Daily Power Utilization Data Points (for realistic bar/spark representation)
const thirtyDayTimeline = [
  { day: 1, utilization: 84, kwh: 480, heat: 58 },
  { day: 2, utilization: 86, kwh: 495, heat: 59 },
  { day: 3, utilization: 82, kwh: 470, heat: 57 },
  { day: 4, utilization: 88, kwh: 510, heat: 61 },
  { day: 5, utilization: 91, kwh: 530, heat: 64 },
  { day: 6, utilization: 79, kwh: 450, heat: 56 },
  { day: 7, utilization: 75, kwh: 420, heat: 54 },
  { day: 8, utilization: 85, kwh: 490, heat: 60 },
  { day: 9, utilization: 87, kwh: 505, heat: 62 },
  { day: 10, utilization: 89, kwh: 518, heat: 63 },
  { day: 11, utilization: 92, kwh: 540, heat: 65 },
  { day: 12, utilization: 90, kwh: 525, heat: 64 },
  { day: 13, utilization: 81, kwh: 465, heat: 58 },
  { day: 14, utilization: 76, kwh: 430, heat: 55 },
  { day: 15, utilization: 88, kwh: 505, heat: 61 },
  { day: 16, utilization: 89, kwh: 515, heat: 62 },
  { day: 17, utilization: 93, kwh: 550, heat: 68 }, // Thermal spike
  { day: 18, utilization: 94, kwh: 562, heat: 71 }, // Thermal spike
  { day: 19, utilization: 88, kwh: 510, heat: 67 },
  { day: 20, utilization: 85, kwh: 492, heat: 63 },
  { day: 21, utilization: 78, kwh: 440, heat: 56 },
  { day: 22, utilization: 87, kwh: 502, heat: 62 },
  { day: 23, utilization: 89, kwh: 520, heat: 64 },
  { day: 24, utilization: 91, kwh: 535, heat: 69 },
  { day: 25, utilization: 95, kwh: 575, heat: 74 }, // Severe heat on CNC-02
  { day: 26, utilization: 92, kwh: 548, heat: 73 },
  { day: 27, utilization: 86, kwh: 498, heat: 65 },
  { day: 28, utilization: 79, kwh: 450, heat: 58 },
  { day: 29, utilization: 90, kwh: 528, heat: 76 },
  { day: 30, utilization: 88, kwh: 512, heat: 78.4 }, // Today: High heat alert!
];

export default function ReportAnalysisAiSection({ onRehealWorkload }) {
  const [activeTab, setActiveTab] = useState("report"); // 'report' | 'ai'
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [timeRange, setTimeRange] = useState("30d"); // '30d' | '14d' | '7d'
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleteNotice, setScanCompleteNotice] = useState(null);

  const currentData = machineHistoryData[selectedMachine] || machineHistoryData["all"];

  const filteredDays = timeRange === "7d"
    ? thirtyDayTimeline.slice(23)
    : timeRange === "14d"
    ? thirtyDayTimeline.slice(16)
    : thirtyDayTimeline;

  // Simulate real-time AI Prediction scan
  const handleRunAiDiagnostic = () => {
    setIsScanning(true);
    setScanCompleteNotice(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleteNotice({
        time: new Date().toLocaleTimeString(),
        confidence: "96.4%",
        result: "Neural Inference completed across 48,200 time-series sensor points. CNC-02 Spindle Motor confirmed at 78% breakdown probability due to thermal gradient (+16.4°C over nominal baseline)."
      });
    }, 1800);
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
            Past 30 days operational power utilization reports combined with LSTM AI predictive breakdown telemetry.
          </p>
        </div>

        {/* Tab Switcher: Report vs AI Prediction */}
        <div className="analytics-tabs-group">
          <button
            className={`analytics-tab-btn ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            <BarChart3 size={15} /> 30-Day Power &amp; Utilization Report
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
          <span className="toolbar-label">Machine Scope:</span>
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
          {["7d", "14d", "30d"].map(t => (
            <button
              key={t}
              className={`time-chip ${timeRange === t ? "active" : ""}`}
              onClick={() => setTimeRange(t)}
            >
              Last {t.replace("d", " Days")}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          TAB 1: 30-DAY REPORT ANALYSIS & POWER UTILIZATION
      ──────────────────────────────────────────────────────── */}
      {activeTab === "report" && (
        <div className="analytics-content-panel">
          {/* Top 4 KPI Cards for the selected machine / all */}
          <div className="analytics-kpi-grid">
            <div className="an-card">
              <div className="an-card-top">
                <span>Operational Uptime ({timeRange.replace("d", " Days")})</span>
                <span className="an-icon green"><Activity size={16} /></span>
              </div>
              <div className="an-value">{currentData.uptime}</div>
              <div className="an-meta green">
                <ArrowUpRight size={13} /> {currentData.totalHours} active execution
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Power Utilization</span>
                <span className="an-icon amber"><Zap size={16} /></span>
              </div>
              <div className="an-value">{currentData.avgUtilization}</div>
              <div className="an-meta amber">
                {currentData.totalKwh} total electrical consumption
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Parts Output</span>
                <span className="an-icon blue"><Layers size={16} /></span>
              </div>
              <div className="an-value">{currentData.partsProduced} <small>parts</small></div>
              <div className="an-meta green">
                <ShieldCheck size={13} /> {currentData.qualityYield} Quality pass rate
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-top">
                <span>Efficiency &amp; Footprint</span>
                <span className="an-icon purple"><Gauge size={16} /></span>
              </div>
              <div className="an-value">
                {selectedMachine === "all" ? "94.2%" : currentData.powerFactor ? `PF ${currentData.powerFactor}` : "0.94 PF"}
              </div>
              <div className="an-meta">
                {selectedMachine === "all" ? "Optimal energy grade A+" : `Avg heat: ${currentData.avgHeat}`}
              </div>
            </div>
          </div>

          {/* Interactive Daily Power Draw & Utilization Chart */}
          <div className="panel chart-panel">
            <div className="chart-header">
              <div>
                <h3>Daily Power Consumption &amp; Capacity Utilization ({timeRange.replace("d", " Days")})</h3>
                <p>Telemetry recorded from digital power transducers and variable frequency drives (VFD).</p>
              </div>
              <div className="chart-legend">
                <span><i className="c-dot green" /> Nominal (&lt; 85%)</span>
                <span><i className="c-dot amber" /> Peak Load (85-92%)</span>
                <span><i className="c-dot red" /> High Strain (&gt; 92%)</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="bar-chart-container">
              {filteredDays.map((d) => {
                const isHigh = d.utilization >= 92;
                const isPeak = d.utilization >= 85 && d.utilization < 92;
                const barColor = isHigh ? "var(--red)" : isPeak ? "var(--amber)" : "var(--green)";

                return (
                  <div key={d.day} className="chart-bar-col" title={`Day ${d.day}: ${d.utilization}% load, ${d.kwh} kWh, Heat: ${d.heat}°C`}>
                    <div className="chart-tooltip">
                      <strong>Day {d.day}</strong>
                      <span>Load: {d.utilization}%</span>
                      <span>{d.kwh} kWh</span>
                      <span>Heat: {d.heat}°C</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${d.utilization}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="bar-day-lbl">D{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine-by-Machine 30-Day Comparison Matrix Table */}
          <div className="panel matrix-panel">
            <div className="panel-heading">
              <div>
                <h3>30-Day Machine Workload &amp; Power Summary Matrix</h3>
                <p>Audited performance metrics for automobile parts production lines.</p>
              </div>
              <span className="test-badge">MONTHLY AUDIT</span>
            </div>

            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Primary Function</th>
                    <th>30d Runtime</th>
                    <th>Avg Load</th>
                    <th>Total kWh</th>
                    <th>Avg Temp</th>
                    <th>Quality Yield</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {["CNC-01", "CNC-02", "DRILL-03", "GRIND-04", "FINISH-05"].map((id) => {
                    const m = machineHistoryData[id];
                    const isHazard = id === "CNC-02";
                    return (
                      <tr key={id} className={isHazard ? "row-hazard" : ""}>
                        <td>
                          <strong>{id}</strong>
                          <small>{m.name.split(" ")[0]}</small>
                        </td>
                        <td>{m.role}</td>
                        <td><strong>{m.totalHours}</strong></td>
                        <td>
                          <div className="inline-progress">
                            <span>{m.avgUtilization}</span>
                            <div className="mini-prog-track">
                              <div
                                className="mini-prog-fill"
                                style={{
                                  width: m.avgUtilization,
                                  backgroundColor: isHazard ? "#ef4444" : "#22c55e"
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td><strong>{m.totalKwh}</strong></td>
                        <td>
                          <span className={`temp-badge ${isHazard ? "hot" : "cool"}`}>
                            <Flame size={11} /> {m.avgHeat}
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
                Continuous multi-variate telemetry analysis correlating past 30 days of power draw variance,
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
