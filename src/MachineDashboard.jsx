import React, { useState, useEffect, useRef } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowUpRight, ArrowDownRight,
  BarChart2, CheckCircle2, ChevronRight, Clock, Cog, Cpu,
  Gauge, Package, RefreshCw, TrendingUp, Wrench, Zap, Target,
  Thermometer, Timer
} from "lucide-react";

const MACHINES = {
  "CNC Milling": {
    id: "CNC-01", type: "CNC Milling", subtitle: "5-Axis Vertical Milling Center",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=90",
    accent: "#3b82f6", accentLight: "#eff6ff",
    icon: Cog, status: "Running", statusTone: "green",
    currentJob: "Gear Housing Batch G-204", operator: "A. Mehta",
    totalOrders: 142, completedOrders: 118, pendingOrders: 24,
    productionProgress: 83, expectedCompletion: "16:45 today", completionPct: 78,
    machineUtilization: 84, utilizationHistory: [72,78,81,76,84,87,83,84],
    temperature: 68, rpm: 4200, vibration: "Normal", toolWear: 34,
    oeeScore: 87.4, downtime: "1.2 h", throughput: "38 pcs/hr", rejectRate: "1.4%",
    alerts: [],
    recentJobs: [{name:"Bracket Plate B-910",time:"09:12"},{name:"Gear Blank GL-44",time:"08:47"},{name:"Housing Cover HC-77",time:"08:21"}],
  },
  "CNC Turning": {
    id: "CNC-02", type: "CNC Turning", subtitle: "CNC Lathe — Turning & Threading",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=1400&q=90",
    accent: "#8b5cf6", accentLight: "#f5f3ff",
    icon: RefreshCw, status: "Running", statusTone: "green",
    currentJob: "Drive Shaft DS-308", operator: "R. Sharma",
    totalOrders: 97, completedOrders: 71, pendingOrders: 26,
    productionProgress: 72, expectedCompletion: "17:15 today", completionPct: 62,
    machineUtilization: 72, utilizationHistory: [65,70,68,74,71,72,69,72],
    temperature: 74, rpm: 3600, vibration: "Normal", toolWear: 51,
    oeeScore: 79.2, downtime: "2.8 h", throughput: "24 pcs/hr", rejectRate: "2.1%",
    alerts: [{msg:"Tool wear at 51% — plan replacement soon",tone:"amber"}],
    recentJobs: [{name:"Drive Shaft DS-305",time:"10:03"},{name:"Spindle Shaft SP-12",time:"09:31"},{name:"Axle Rod AR-08",time:"08:59"}],
  },
  "Drilling": {
    id: "DRILL-03", type: "Drilling", subtitle: "Radial Arm Drill Press",
    image: "https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=1400&q=90",
    accent: "#10b981", accentLight: "#ecfdf5",
    icon: Target, status: "Running", statusTone: "green",
    currentJob: "Bracket Batch BB-112", operator: "S. Patel",
    totalOrders: 224, completedOrders: 189, pendingOrders: 35,
    productionProgress: 66, expectedCompletion: "15:30 today", completionPct: 84,
    machineUtilization: 66, utilizationHistory: [58,63,60,66,68,66,65,66],
    temperature: 58, rpm: 1800, vibration: "Low", toolWear: 22,
    oeeScore: 82.6, downtime: "0.9 h", throughput: "62 pcs/hr", rejectRate: "0.8%",
    alerts: [],
    recentJobs: [{name:"Mounting Plate MP-44",time:"10:18"},{name:"Bracket BK-108",time:"09:52"},{name:"Flange FL-33",time:"09:27"}],
  },
  "Grinding": {
    id: "GRIND-04", type: "Grinding", subtitle: "Surface Grinder — Gear Finishing",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1400&q=90",
    accent: "#f59e0b", accentLight: "#fffbeb",
    icon: Zap, status: "Idle Soon", statusTone: "amber",
    currentJob: "Gear Finishing GF-055", operator: "P. Nair",
    totalOrders: 88, completedOrders: 55, pendingOrders: 33,
    productionProgress: 41, expectedCompletion: "18:00 today", completionPct: 52,
    machineUtilization: 41, utilizationHistory: [38,44,39,41,45,40,42,41],
    temperature: 82, rpm: 2400, vibration: "Moderate", toolWear: 67,
    oeeScore: 64.8, downtime: "4.1 h", throughput: "14 pcs/hr", rejectRate: "3.7%",
    alerts: [{msg:"High temperature — check coolant",tone:"red"},{msg:"Tool wear 67% — schedule replacement",tone:"amber"}],
    recentJobs: [{name:"Gear Surface GS-51",time:"09:45"},{name:"Pinion Finish PF-09",time:"08:58"},{name:"Bevel Gear BG-22",time:"08:14"}],
  },
};

const KEYS = Object.keys(MACHINES);

function RadialGauge({ value, color, size = 108 }) {
  const r = (size - 18) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const filled = (value / 100) * arc;
  const offset = -(circ * 0.125);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8ecf2" strokeWidth={10}
        strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(135 ${size/2} ${size/2})`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${filled} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(135 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x={size/2} y={size/2+6} textAnchor="middle" fill="#17244d" fontSize="16" fontWeight="800">{value}%</text>
    </svg>
  );
}

function SparkBars({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="mhd-spark">
      {data.map((v, i) => (
        <span key={i} style={{ height: `${(v/max)*100}%`, background: i === data.length-1 ? color : `${color}55`, transition: `height 0.4s ease ${i*40}ms` }} />
      ))}
    </div>
  );
}

function ProgressBar({ value, color, height = 8 }) {
  return (
    <div className="mhd-progress-track" style={{ height }}>
      <div className="mhd-progress-fill" style={{ width: `${value}%`, background: color, transition: "width 0.7s ease" }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="mhd-stat-card">
      <div className="mhd-stat-icon" style={{ background: `${color}18`, color }}><Icon size={17} /></div>
      <div className="mhd-stat-body">
        <span className="mhd-stat-label">{label}</span>
        <strong className="mhd-stat-value">{value}</strong>
        {sub && <span className="mhd-stat-sub">{sub}</span>}
      </div>
      {trend !== undefined && (
        <div className={`mhd-stat-trend ${trend >= 0 ? "up" : "down"}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}

function DashboardView({ machine, onBack }) {
  const m = MACHINES[machine];
  const [liveUtil, setLiveUtil] = useState(m.machineUtilization);
  const [history, setHistory] = useState(m.utilizationHistory);
  const timer = useRef(null);

  useEffect(() => {
    setLiveUtil(m.machineUtilization);
    setHistory(m.utilizationHistory);
    timer.current = setInterval(() => {
      setLiveUtil(prev => {
        const next = Math.max(20, Math.min(99, prev + Math.round((Math.random()-0.5)*5)));
        setHistory(h => [...h.slice(1), next]);
        return next;
      });
    }, 2800);
    return () => clearInterval(timer.current);
  }, [machine]);

  const Icon = m.icon;
  const orderPct = Math.round((m.completedOrders / m.totalOrders) * 100);
  const avgUtil = Math.round(history.reduce((a,b)=>a+b,0)/history.length);

  return (
    <div className="mhd-view">
      <div className="mhd-header">
        <button className="mhd-back-btn" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div className="mhd-header-center">
          <div className="mhd-header-icon" style={{ background: m.accentLight, color: m.accent }}><Icon size={18} /></div>
          <div>
            <h2 className="mhd-title">{m.type} <span className="mhd-id-badge" style={{ background: m.accentLight, color: m.accent }}>{m.id}</span></h2>
            <p className="mhd-subtitle">{m.subtitle}</p>
          </div>
        </div>
        <div className="mhd-header-right">
          <span className={`mhd-status-pill ${m.statusTone}`}><i />{m.status}</span>
          <span className="mhd-operator">👷 {m.operator}</span>
        </div>
      </div>

      {m.alerts.length > 0 && (
        <div className="mhd-alerts-bar">
          {m.alerts.map((a,i) => <div key={i} className={`mhd-alert-chip ${a.tone}`}><AlertTriangle size={12} /> {a.msg}</div>)}
        </div>
      )}

      <div className="mhd-hero-row">
        <div className="mhd-hero-img-wrap">
          <img src={m.image} alt={m.type} className="mhd-hero-img" />
          <div className="mhd-hero-overlay" />
          <div className="mhd-hero-badges">
            <div className="mhd-live-badge">
              <span className="mhd-live-dot" style={{ background: m.statusTone==="green" ? "#22c55e" : "#f59e0b" }} />
              {m.statusTone==="green" ? "LIVE · RUNNING" : "LIVE · IDLE SOON"}
            </div>
            <div className="mhd-hero-job-badge">
              <span>CURRENT JOB</span>
              <strong>{m.currentJob}</strong>
            </div>
          </div>
        </div>
        <div className="mhd-quick-stats">
          <StatCard icon={Package}      label="Total Orders"   value={m.totalOrders}     sub={`${m.completedOrders} completed`} color={m.accent}  trend={3} />
          <StatCard icon={CheckCircle2} label="Completed"      value={m.completedOrders}  sub={`${orderPct}% of total`}         color="#22c55e"   trend={5} />
          <StatCard icon={Clock}        label="Pending Orders" value={m.pendingOrders}    sub="in queue"                        color="#f59e0b"   trend={-2} />
          <StatCard icon={TrendingUp}   label="Throughput"     value={m.throughput}       sub="current rate"                    color={m.accent} />
          <StatCard icon={Activity}     label="OEE Score"      value={`${m.oeeScore}%`}   sub="Overall Efficiency"              color="#8b5cf6"  trend={2} />
          <StatCard icon={BarChart2}    label="Reject Rate"    value={m.rejectRate}       sub="this shift"                      color="#ef4444" />
        </div>
      </div>

      <div className="mhd-kpi-row">
        <div className="mhd-kpi-card" style={{ borderTopColor: m.accent }}>
          <div className="mhd-kpi-head"><span className="mhd-kpi-label">Production Progress</span><Gauge size={15} style={{ color: m.accent }} /></div>
          <div className="mhd-kpi-big">{m.productionProgress}<small>%</small></div>
          <ProgressBar value={m.productionProgress} color={m.accent} height={9} />
          <div className="mhd-kpi-foot"><span>{m.completedOrders}/{m.totalOrders} orders</span><span style={{ color: m.accent }}>{m.productionProgress}% done</span></div>
        </div>

        <div className="mhd-kpi-card" style={{ borderTopColor: m.accent }}>
          <div className="mhd-kpi-head"><span className="mhd-kpi-label">Machine Utilization</span><Cpu size={15} style={{ color: m.accent }} /></div>
          <div className="mhd-gauge-row">
            <RadialGauge value={liveUtil} color={m.accent} size={108} />
            <div className="mhd-gauge-meta">
              <div className="mhd-gauge-item"><span>Uptime</span><strong style={{ color: m.accent }}>{liveUtil}%</strong></div>
              <div className="mhd-gauge-item"><span>Downtime</span><strong>{m.downtime}</strong></div>
              <div className="mhd-gauge-item"><span>RPM</span><strong>{m.rpm.toLocaleString()}</strong></div>
            </div>
          </div>
          <SparkBars data={history} color={m.accent} />
        </div>

        <div className="mhd-kpi-card" style={{ borderTopColor: "#22c55e" }}>
          <div className="mhd-kpi-head"><span className="mhd-kpi-label">Expected Completion</span><Timer size={15} style={{ color: "#22c55e" }} /></div>
          <div className="mhd-kpi-big" style={{ color: "#16a34a", fontSize: 21 }}>{m.expectedCompletion}</div>
          <ProgressBar value={m.completionPct} color="#22c55e" height={9} />
          <div className="mhd-kpi-foot"><span>Shift progress</span><span style={{ color: "#22c55e" }}>{m.completionPct}% done</span></div>
          <div className="mhd-eta-row">
            <span><Clock size={11} /> Shift ends: 16:00</span>
            <span style={{ color: "#22c55e" }}><CheckCircle2 size={11} /> On track</span>
          </div>
        </div>

        <div className="mhd-kpi-card" style={{ borderTopColor: "#ef4444" }}>
          <div className="mhd-kpi-head"><span className="mhd-kpi-label">Machine Health</span><Thermometer size={15} style={{ color: "#ef4444" }} /></div>
          <div className="mhd-health-list">
            <div className="mhd-health-row"><span>Temperature</span><strong style={{ color: m.temperature>80?"#ef4444":"#22c55e" }}>{m.temperature}°C</strong><ProgressBar value={m.temperature} color={m.temperature>80?"#ef4444":"#22c55e"} height={5} /></div>
            <div className="mhd-health-row"><span>Tool Wear</span><strong style={{ color: m.toolWear>60?"#f59e0b":"#22c55e" }}>{m.toolWear}%</strong><ProgressBar value={m.toolWear} color={m.toolWear>60?"#f59e0b":"#22c55e"} height={5} /></div>
            <div className="mhd-health-row-inline"><span>Vibration</span><strong style={{ color: m.vibration==="Moderate"?"#f59e0b":"#22c55e" }}>{m.vibration}</strong></div>
            <div className="mhd-health-row-inline"><span>RPM</span><strong>{m.rpm.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      <div className="mhd-bottom-row">
        <div className="mhd-panel">
          <div className="mhd-panel-head"><h4>Order Breakdown</h4><Package size={15} style={{ color: m.accent }} /></div>
          <div className="mhd-donut-row">
            <svg width="96" height="96" viewBox="0 0 100 100">
              {(() => {
                const circ = 2*Math.PI*35;
                const filled = (m.completedOrders/m.totalOrders)*circ;
                return (<>
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#f0f2f7" strokeWidth="14" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke={m.accent} strokeWidth="14"
                    strokeDasharray={`${filled} ${circ}`} strokeDashoffset={circ*0.25}
                    strokeLinecap="round" style={{ transition:"stroke-dasharray 0.7s ease" }} />
                  <text x="50" y="55" textAnchor="middle" fill="#17244d" fontSize="14" fontWeight="800">{orderPct}%</text>
                </>);
              })()}
            </svg>
            <div className="mhd-donut-legend">
              <div><span style={{ background: m.accent }} /><strong>{m.completedOrders}</strong><small>Completed</small></div>
              <div><span style={{ background: "#f59e0b" }} /><strong>{m.pendingOrders}</strong><small>Pending</small></div>
            </div>
          </div>
          <div className="mhd-order-bars">
            <div className="mhd-order-bar-row"><span>Completed</span><ProgressBar value={orderPct} color={m.accent} height={7} /><strong>{orderPct}%</strong></div>
            <div className="mhd-order-bar-row"><span>Pending</span><ProgressBar value={100-orderPct} color="#f59e0b" height={7} /><strong>{100-orderPct}%</strong></div>
          </div>
        </div>

        <div className="mhd-panel">
          <div className="mhd-panel-head"><h4>Utilization Trend (8h)</h4><BarChart2 size={15} style={{ color: m.accent }} /></div>
          <div className="mhd-trend-chart">
            {history.map((v,i) => (
              <div key={i} className="mhd-trend-col">
                <span className="mhd-trend-val">{v}%</span>
                <div className="mhd-trend-bar" style={{ height:`${v}%`, background: i===history.length-1 ? m.accent : `${m.accent}55`, transition:`height 0.4s ease ${i*30}ms` }} />
                <span className="mhd-trend-lbl">{8+i}h</span>
              </div>
            ))}
          </div>
          <div className="mhd-trend-foot">
            <span style={{ color: m.accent, fontWeight: 800 }}>Avg: {avgUtil}%</span>
            <span style={{ color: "#9ba3b2" }}>Last 8 hours</span>
          </div>
        </div>

        <div className="mhd-panel">
          <div className="mhd-panel-head"><h4>Recent Completed Jobs</h4><CheckCircle2 size={15} style={{ color: "#22c55e" }} /></div>
          <div className="mhd-job-list">
            {m.recentJobs.map((j,i) => (
              <div key={i} className="mhd-job-row">
                <span className="mhd-job-dot" style={{ background: m.accent }} />
                <div className="mhd-job-info"><strong>{j.name}</strong><span>{j.time}</span></div>
                <span className="mhd-job-done" style={{ color: "#22c55e" }}><CheckCircle2 size={13} /> Done</span>
              </div>
            ))}
          </div>
          <div className="mhd-panel-foot"><Wrench size={12} style={{ color: m.accent }} /><span>Machine: <strong>{m.id}</strong></span></div>
        </div>

        <div className="mhd-panel mhd-perf-panel" style={{ borderTopColor: m.accent }}>
          <div className="mhd-panel-head"><h4>Performance Summary</h4><TrendingUp size={15} style={{ color: m.accent }} /></div>
          <div className="mhd-perf-grid">
            <div className="mhd-perf-item" style={{ background: m.accentLight }}><span>OEE Score</span><strong style={{ color: m.accent }}>{m.oeeScore}%</strong></div>
            <div className="mhd-perf-item" style={{ background: "#ecfdf5" }}><span>Throughput</span><strong style={{ color: "#22c55e" }}>{m.throughput}</strong></div>
            <div className="mhd-perf-item" style={{ background: "#fef3c7" }}><span>Downtime</span><strong style={{ color: "#d97706" }}>{m.downtime}</strong></div>
            <div className="mhd-perf-item" style={{ background: "#fef2f2" }}><span>Reject Rate</span><strong style={{ color: "#ef4444" }}>{m.rejectRate}</strong></div>
          </div>
          <div className="mhd-oee-section">
            <div className="mhd-kpi-foot" style={{ marginBottom:6 }}><span>Overall Equipment Effectiveness</span><strong style={{ color: m.accent }}>{m.oeeScore}%</strong></div>
            <ProgressBar value={m.oeeScore} color={m.accent} height={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MachineHealthLanding({ onSelect }) {
  return (
    <div className="mhd-landing">
      <div className="mhd-landing-head">
        <div className="mhd-landing-eyebrow"><span />MACHINE HEALTH MONITOR</div>
        <h2>Select a Machine</h2>
        <p>Choose a machine to open its full PowerBI-style dashboard with live metrics, utilization tracking, and order analytics.</p>
      </div>
      <div className="mhd-machine-grid">
        {KEYS.map(key => {
          const m = MACHINES[key];
          const Icon = m.icon;
          const pct = Math.round((m.completedOrders/m.totalOrders)*100);
          return (
            <button key={key} className="mhd-machine-tile" onClick={() => onSelect(key)}>
              <div className="mhd-tile-img-wrap">
                <img src={m.image} alt={m.type} className="mhd-tile-img" />
                <div className="mhd-tile-img-overlay" style={{ background:`linear-gradient(to top, ${m.accent}cc 0%, transparent 55%)` }} />
                <span className={`mhd-tile-pill ${m.statusTone}`}><i />{m.status}</span>
              </div>
              <div className="mhd-tile-body">
                <div className="mhd-tile-top">
                  <div className="mhd-tile-icon" style={{ background: m.accentLight, color: m.accent }}><Icon size={17} /></div>
                  <div><strong className="mhd-tile-name">{m.type}</strong><span className="mhd-tile-id">{m.id} · {m.subtitle}</span></div>
                </div>
                <div className="mhd-tile-stats">
                  <div className="mhd-tile-stat"><span>Orders</span><strong style={{ color: m.accent }}>{m.totalOrders}</strong></div>
                  <div className="mhd-tile-stat"><span>Done</span><strong style={{ color: "#22c55e" }}>{m.completedOrders}</strong></div>
                  <div className="mhd-tile-stat"><span>Util.</span><strong style={{ color: m.accent }}>{m.machineUtilization}%</strong></div>
                  <div className="mhd-tile-stat"><span>OEE</span><strong>{m.oeeScore}%</strong></div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:9, color:"#7b8498" }}>Production Progress</span>
                    <span style={{ fontSize:9, fontWeight:800, color: m.accent }}>{m.productionProgress}%</span>
                  </div>
                  <ProgressBar value={m.productionProgress} color={m.accent} height={6} />
                </div>
                {m.alerts.length>0 && (
                  <div className="mhd-tile-alert"><AlertTriangle size={11} style={{ color:"#f59e0b" }} /><span>{m.alerts.length} alert{m.alerts.length>1?"s":""}</span></div>
                )}
                <div className="mhd-tile-footer">
                  <span style={{ color:"#7b8498", fontSize:9 }}><Clock size={11} /> {m.expectedCompletion}</span>
                  <span className="mhd-tile-cta" style={{ color: m.accent }}>View Dashboard <ChevronRight size={12} /></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MachineDashboard({ initialMachine = null }) {
  const [selected, setSelected] = useState(initialMachine);
  // Sync if parent changes the initialMachine (e.g. user picks a different machine)
  React.useEffect(() => { setSelected(initialMachine); }, [initialMachine]);
  if (selected) return <DashboardView machine={selected} onBack={() => setSelected(null)} />;
  return <MachineHealthLanding onSelect={setSelected} />;
}