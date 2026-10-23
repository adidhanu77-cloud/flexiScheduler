import React, { useState, useEffect } from "react";
import MachineDashboard from "./MachineDashboard";
import DisruptionModal from "./DisruptionModals";
import TwilioModal from "./TwilioModal";
import LiveMonitoringWidget from "./LiveMonitoringWidget";
import ReportAnalysisAiSection from "./ReportAnalysisAiSection";
import LoginPage from "./LoginPage";
import { sendTwilioNotification, getTwilioLogs } from "./TwilioService";
import { supabase, isSupabaseConfigured, updateMachineInDb } from "./supabaseClient";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Boxes, Check,
  ChevronDown, CircleHelp, Clock3, Cog, Factory, Gauge, Menu, PackageCheck,
  Play, Pause, RefreshCw, Settings2, ShieldAlert, Truck, Wrench, X, Zap,
  FastForward, HeartPulse, Sparkles, AlertTriangle, CheckCircle2, RotateCcw, Timer,
  Flame, Bot, Smartphone, MessageSquare, Send, LogOut, User
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

const baselineSchedule = [
  { machine: "CNC-01", tasks: [{ left: 1, width: 23, label: "Gear blank", tone: "blue" }, { left: 26, width: 19, label: "Shaft", tone: "coral" }, { left: 47, width: 28, label: "Bracket", tone: "green" }] },
  { machine: "CNC-02", tasks: [{ left: 8, width: 30, label: "Shaft turning", tone: "purple" }, { left: 41, width: 22, label: "Gear teeth", tone: "amber" }, { left: 66, width: 26, label: "Inspection", tone: "cyan" }] },
  { machine: "DRILL-03", tasks: [{ left: 1, width: 23, label: "Bolt holes", tone: "coral" }, { left: 26, width: 27, label: "Mounting plate (Done early)", tone: "green", isQuotaDone: true }] },
  { machine: "GRIND-04", tasks: [{ left: 1, width: 24, label: "Surface grind", tone: "amber" }, { left: 28, width: 26, label: "Gear finish", tone: "blue" }, { left: 58, width: 29, label: "QC check", tone: "cyan" }] },
  { machine: "FINISH-05", tasks: [{ left: 2, width: 23, label: "Deburr", tone: "green" }, { left: 29, width: 27, label: "Polish", tone: "cyan" }, { left: 60, width: 30, label: "Pack batch", tone: "coral" }] },
];

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("flexi_auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [mobileNav, setMobileNav] = useState(false);
  const [machineHealthOpen, setMachineHealthOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [healthDropdown, setHealthDropdown] = useState(false);

  // Sync with Supabase Auth in case of OAuth redirect
  useEffect(() => {
    if (isSupabaseConfigured && supabase?.auth?.onAuthStateChange) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const fullUser = {
            id: session.user.id,
            name: userMeta.full_name || userMeta.name || session.user.email?.split("@")[0] || "Google User",
            email: session.user.email,
            provider: "Google OAuth",
            role: "Plant Systems Engineer",
            avatar: userMeta.avatar_url || userMeta.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
          };
          setCurrentUser(fullUser);
          try {
            localStorage.setItem("flexi_auth_user", JSON.stringify(fullUser));
          } catch (e) {}
        }
      });
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("flexi_auth_user", JSON.stringify(user));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("flexi_auth_user");
      if (isSupabaseConfigured && supabase?.auth?.signOut) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Live schedule simulation state
  const [simRunning, setSimRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [simProgress, setSimProgress] = useState(44); // 0 to 100% of Shift A (08:00 - 16:00)
  const [healingState, setHealingState] = useState("idle"); // "idle" | "healing" | "healed"

  // Demonstration breakdown switches (both Manual and Automatic)
  const [autoBreakdown, setAutoBreakdown] = useState(false);
  const [breakdownTriggerType, setBreakdownTriggerType] = useState("manual"); // "manual" | "automatic"

  const openMachine = (machineName) => {
    setSelectedMachine(machineName);
    setMachineHealthOpen(true);
    setMobileNav(false);
    setHealthDropdown(false);
  };
  const [dashboardTab, setDashboardTab] = useState("alerts");
  const [breakdown, setBreakdown] = useState(false);
  const [rush, setRush] = useState(false);
  const [materialDelay, setMaterialDelay] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [notice, setNotice] = useState("Select a scenario to test how the virtual factory responds. This prototype uses simulated data.");
  const [modal, setModal] = useState(false);
  const [activeDisruptionModal, setActiveDisruptionModal] = useState(null); // "rush" | "breakdown" | "material" | null
  const [toast, setToast] = useState("");
  const [twilioModalOpen, setTwilioModalOpen] = useState(false);
  const [twilioLogsCount, setTwilioLogsCount] = useState(() => getTwilioLogs().length);
  const [alertDispatching, setAlertDispatching] = useState(false);

  const dispatchBreakdownAlert = async (sourceType = "manual") => {
    setAlertDispatching(true);
    notify("📱 Dispatching Breakdown Trigger Notification (WhatsApp & SMS)...");
    const res = await sendTwilioNotification({
      title: sourceType === "automatic"
        ? "Automatic Sensor Breakdown Alert"
        : "Manual Breakdown Alert Dispatched",
      message: "Critical Spindle Motor Jammed on CNC-02 at 12:10 PM. Needy tasks flagged. Digital Twin recommends reassignment to completed machine DRILL-03.",
      triggerType: sourceType,
      machineId: "CNC-02",
      fault: "Spindle Jam (Overheat 114°C)"
    });
    setAlertDispatching(false);
    setTwilioLogsCount(getTwilioLogs().length);
    addEvent(
      `Breakdown Notification (${sourceType.toUpperCase()}): CNC-02`,
      "Real-time incident report sent via WhatsApp and SMS.",
      Smartphone,
      "red"
    );
    notify("✅ BREAKDOWN TRIGGER NOTIFICATION: WhatsApp & SMS sent successfully!");
    return res;
  };

  // Live simulation ticker + Automatic mid-shift breakdown sensor trigger
  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + (0.09 * simSpeed);
        // Automatic breakdown triggers at 52% (12:10 PM) if auto-breakdown switch is ON
        if (autoBreakdown && !breakdown && prev < 52 && next >= 52) {
          setBreakdown(true);
          setBreakdownTriggerType("automatic");
          setHealingState("idle");
          addEvent(
            "⚡ Automatic Sensor Breakdown: CNC-02",
            "Automatic sensor trip at 12:10 PM: Spindle motor overheat on CNC-02. Digital Twin identified DRILL-03 (finished early at 11:45 AM) to absorb needy work.",
            AlertTriangle,
            "red"
          );
          notify("⚡ AUTOMATIC BREAKDOWN DETECTED: CNC-02 spindle seized at 12:10 PM! Ready to reassign to completed machine DRILL-03.");
          dispatchBreakdownAlert("automatic");
        }
        if (next >= 100) return 0;
        return parseFloat(next.toFixed(2));
      });
    }, 250);
    return () => clearInterval(interval);
  }, [simRunning, simSpeed, autoBreakdown, breakdown]);

  const addEvent = (title, desc, icon, tone = "orange") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setEvents(prev => [{ title, desc, icon, tone, time }, ...prev].slice(0, 5));
  };
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  // Manual Breakdown Switch for presentation demonstration
  const toggleManualBreakdown = () => {
    if (!breakdown) {
      setBreakdown(true);
      setBreakdownTriggerType("manual");
      setHealingState("idle");
      updateMachineInDb("CNC-02", { status: "breakdown", health: 18, reassigned_to: null }).catch(e => console.warn(e));
      addEvent(
        "Manual Breakdown Switch Flipped",
        "Admin triggered manual breakdown on CNC-02. Needy tasks flagged for reassignment to completed machine DRILL-03.",
        Flame,
        "red"
      );
      notify("🚨 MANUAL BREAKDOWN SWITCH: CNC-02 failed! Needy tasks ready for reassignment to completed machine DRILL-03.");
    } else {
      restoreCNC02();
    }
  };

  // Rehealing & AI Auto-reallocation handler: Reassigns needy work to completed machine (DRILL-03)
  const triggerReheal = () => {
    setHealingState("healing");
    updateMachineInDb("CNC-02", { status: "healing", reassigned_to: "DRILL-03" }).catch(e => console.warn(e));
    notify("🤖 Digital Twin AI: DRILL-03 has completed 100% of morning operations! Reassigning CNC-02 needy workload to DRILL-03...");
    window.setTimeout(() => {
      setHealingState("healed");
      updateMachineInDb("CNC-02", { status: "healed", health: 88, reassigned_to: "DRILL-03" }).catch(e => console.warn(e));
      addEvent(
        "Workload Reassigned to DRILL-03",
        "Needy tasks from broken CNC-02 successfully absorbed by completed machine DRILL-03 (Radial Drill Center). Zero schedule delay!",
        Sparkles,
        "green"
      );
      notify("✨ WORKLOAD REASSIGNED: Completed machine DRILL-03 has taken over CNC-02's jobs! Factory operating at 100%.");
    }, 1500);
  };

  const restoreCNC02 = () => {
    setBreakdown(false);
    setHealingState("idle");
    updateMachineInDb("CNC-02", { status: "running", health: 91, reassigned_to: null }).catch(e => console.warn(e));
    addEvent("CNC-02 Restored", "Maintenance completed; machine returned to standard operational schedule.", Check, "green");
    notify("CNC-02 fully repaired and restored to baseline.");
  };

  const simulate = (type) => {
    if (type === "breakdown") {
      toggleManualBreakdown();
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
    setBreakdown(false);
    setHealingState("idle");
    setRush(false);
    setMaterialDelay(false);
    setSimProgress(44);
    setSimRunning(true);
    setSimSpeed(1);
    setAutoBreakdown(false);
    setNotice("Select a scenario to test how the virtual factory responds. This prototype uses simulated data.");
    addEvent("Simulation reset", "Factory demo restored to baseline state.", RefreshCw, "blue");
    notify("Factory simulation reset to initial shift state.");
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNav(false);
  };

  // Format the simulated clock time (08:00 - 16:00 Shift A)
  const formatSimClock = (progress) => {
    const totalMin = 8 * 60 + (progress / 100) * 480;
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    const s = Math.floor(((totalMin % 1) * 60));
    const ampm = h >= 12 ? "PM" : "AM";
    const dispH = h % 12 === 0 ? 12 : h % 12;
    return `${dispH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")} ${ampm}`;
  };

  // Dynamic Live Time Estimation of Completion (ETC) for each machine
  const getMachineETC = (machineId, progress, isDown, healState) => {
    const currentDayMin = 8 * 60 + (progress / 100) * 480;
    const targets = {
      "CNC-01": 16 * 60 + 45, // 16:45
      "CNC-02": 17 * 60 + 15, // 17:15
      "DRILL-03": 12 * 60 + 15, // 12:15 (Completed early at 53%!)
      "GRIND-04": 18 * 60,      // 18:00
    };

    let targetMin = targets[machineId] || 16 * 60;
    let note = "On track";
    let isPaused = false;
    let isAssisting = false;
    let isHealing = false;
    let isCompletedEarly = false;

    if (machineId === "CNC-02") {
      if (isDown && healState === "idle") {
        return {
          targetTime: "Delayed",
          remainingStr: "PAUSED (+2.5h delay)",
          percent: Math.min(100, Math.round((progress / 100) * 65)),
          isPaused: true,
          note: "🚨 Spindle Seized · Needy Machine"
        };
      }
      if (isDown && healState === "healing") {
        return {
          targetTime: "Rerouting...",
          remainingStr: "Reassigning to DRILL-03...",
          percent: 65,
          isHealing: true,
          note: "Reallocating to completed machine"
        };
      }
      if (isDown && healState === "healed") {
        return {
          targetTime: "16:15",
          remainingStr: "00h 14m 30s (Diagnostic)",
          percent: 94,
          isHealing: true,
          note: "Workload transferred to DRILL-03"
        };
      }
    }

    if (machineId === "DRILL-03") {
      if (isDown && healState === "healed") {
        targetMin = 16 * 60 + 30; // Absorbed extra workload
        isAssisting = true;
        note = "⚡ Absorbed CNC-02 Needy Work (+2.2h)";
      } else if (progress >= 53) {
        isCompletedEarly = true;
        return {
          targetTime: "12:15",
          remainingStr: "00h 00m (Done)",
          percent: 100,
          isCompletedEarly: true,
          note: "✅ Shift Work 100% Completed"
        };
      }
    }

    const remMin = Math.max(0, targetMin - currentDayMin);
    const remH = Math.floor(remMin / 60);
    const remM = Math.floor(remMin % 60);
    const remS = Math.floor((remMin % 1) * 60);

    const targetH = Math.floor(targetMin / 60);
    const targetM = Math.floor(targetMin % 60);
    const targetStr = `${targetH.toString().padStart(2, "0")}:${targetM.toString().padStart(2, "0")}`;

    const totalJobSpan = targetMin - (8 * 60);
    const elapsedJob = Math.max(0, currentDayMin - (8 * 60));
    const pct = Math.min(100, Math.round((elapsedJob / totalJobSpan) * 100));

    return {
      targetTime: targetStr,
      remainingStr: `${remH}h ${remM.toString().padStart(2, "0")}m ${remS.toString().padStart(2, "0")}s`,
      percent: pct,
      isPaused,
      isAssisting,
      isCompletedEarly,
      note
    };
  };

  // Generate dynamic schedule rows (adjusts when rehealed/reallocated to completed machine)
  const scheduleRows = baselineSchedule.map(row => {
    if (row.machine === "DRILL-03") {
      if (breakdown && healingState === "healed") {
        return {
          ...row,
          tasks: [
            { left: 1, width: 23, label: "Bolt holes", tone: "coral" },
            { left: 26, width: 27, label: "Mounting plate (Finished 100%)", tone: "green", isQuotaDone: true },
            { left: 56, width: 38, label: "⚡ Reassigned: CNC-02 Shaft Turning & Teeth", tone: "purple", isRerouted: true }
          ]
        };
      }
    }
    if (row.machine === "CNC-02") {
      if (breakdown && healingState === "idle") {
        return {
          ...row,
          tasks: [
            { left: 8, width: 30, label: "Shaft turning", tone: "purple" },
            { left: 41, width: 14, label: "🚨 SPINDLE JAM", tone: "red", isFailed: true },
            { left: 56, width: 36, label: "Needy Work Stalled", tone: "purple", isTransferred: true }
          ]
        };
      }
      if (breakdown && healingState === "healed") {
        return {
          ...row,
          tasks: [
            { left: 8, width: 30, label: "Shaft turning", tone: "purple" },
            { left: 41, width: 33, label: "Transferred → DRILL-03 (Completed Machine)", tone: "purple", isTransferred: true },
            { left: 75, width: 23, label: "🔧 Auto-Healing Diagnostic", tone: "amber", isHealing: true }
          ]
        };
      }
    }
    return row;
  });

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

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
          <button className="nav-link nav-link-ai" onClick={() => scrollTo("analytics")}>
            📊 Report &amp; AI Prediction
          </button>
          {currentUser && (
            <button className="nav-link nav-link-logout-mobile" onClick={handleLogout}>
              <LogOut size={12} /> Log Out ({currentUser.name})
            </button>
          )}
        </nav>
        <div className="nav-actions">
          {currentUser && (
            <div className="nav-user-badge">
              <img
                src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80"}
                alt={currentUser.name}
                className="nav-user-avatar"
              />
              <div className="nav-user-info">
                <span className="nav-user-name">{currentUser.name}</span>
                <span className="nav-user-role">{currentUser.role || "Operator"}</span>
              </div>
              <button
                className="nav-logout-btn"
                onClick={handleLogout}
                title="Log out and return to Login Screen"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          )}
          <button
            className="nav-link-twilio"
            onClick={() => setTwilioModalOpen(true)}
            title="Open Breakdown Trigger Notification (WhatsApp & SMS)"
          >
            <MessageSquare size={13} />
            <span>Breakdown Trigger Notification</span>
            {twilioLogsCount > 0 && <span className="twilio-alert-badge">{twilioLogsCount}</span>}
          </button>
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
            <div>
              <div className="eyebrow"><span /> PLAN · TRACK · ADAPT</div>
              <h2>Production control center</h2>
              <p>Machine assignments, job timelines, and current factory state.</p>
            </div>
            <div className="control-header-actions">
              <div className="sim-live-badge"><span className={`live-pulse-dot ${simRunning ? "active" : ""}`} /> {simRunning ? "LIVE SCHEDULE RUNNING" : "SIMULATION PAUSED"}</div>
              <button className="button button-outline reset-button" onClick={reset}><RefreshCw size={15} /> Reset simulation</button>
            </div>
          </div>

          <div className="main-grid">
            <div className="panel schedule-panel">
              {/* Admin Live Simulation Controls Bar with Manual & Automatic Breakdown Demonstration Switches */}
              <div className="admin-sim-toolbar">
                <div className="ast-left">
                  <button
                    className={`sim-play-btn ${simRunning ? "running" : "paused"}`}
                    onClick={() => setSimRunning(!simRunning)}
                    title={simRunning ? "Pause schedule execution" : "Run live schedule"}
                  >
                    {simRunning ? <Pause size={13} /> : <Play size={13} />}
                    <span>{simRunning ? "Pause" : "Run"}</span>
                  </button>

                  <div className="sim-speed-selector">
                    <span className="speed-lbl">Speed:</span>
                    {[1, 2, 5].map(s => (
                      <button
                        key={s}
                        className={`speed-pill ${simSpeed === s ? "active" : ""}`}
                        onClick={() => setSimSpeed(s)}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Demonstration Switches: Manual Breakdown Switch & Automatic Breakdown Toggle */}
                  <div className="demo-switch-group">
                    <button
                      className={`demo-switch-btn manual-btn ${breakdown ? "active-hazard" : ""}`}
                      onClick={toggleManualBreakdown}
                      title="Flip manual breakdown switch on CNC-02 for live demonstration"
                    >
                      <Flame size={12} className={breakdown ? "flame-active" : ""} />
                      <span>{breakdown ? "🚨 Manual Breakdown: ON" : "⚡ Manual Breakdown Switch"}</span>
                    </button>

                    <button
                      className={`demo-switch-btn auto-btn ${autoBreakdown ? "active-auto" : ""}`}
                      onClick={() => {
                        const next = !autoBreakdown;
                        setAutoBreakdown(next);
                        notify(next ? "🤖 Auto-Breakdown ENABLED: Will trigger automatically at 52% (12:10 PM) mid-shift!" : "Auto-Breakdown disabled.");
                      }}
                      title="Toggle automatic mid-shift breakdown sensor trigger at 52% / 12:10 PM"
                    >
                      <Bot size={12} />
                      <span>Auto-Breakdown: {autoBreakdown ? "ON (@ 52%)" : "OFF"}</span>
                    </button>

                    {breakdown && (
                      <button
                        className="manual-alert-dispatch-btn"
                        onClick={() => dispatchBreakdownAlert("manual")}
                        title="Click to broadcast real-time breakdown alert via Twilio WhatsApp & SMS"
                      >
                        <Bell size={12} />
                        <span>{alertDispatching ? "Alerting..." : "🚨 Send Alert (WhatsApp & SMS)"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="ast-right">
                  <div className="sim-digital-clock">
                    <Clock3 size={13} className="clock-icon" />
                    <span className="clock-time">{formatSimClock(simProgress)}</span>
                    <span className="clock-shift">Shift A · {Math.round(simProgress)}% Done</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Alert & Self-Healing Bar */}
              {breakdown && healingState === "idle" && (
                <div className="schedule-healing-alert red">
                  <div className="sha-info">
                    <AlertTriangle size={18} className="alert-icon" />
                    <div>
                      <strong>
                        {breakdownTriggerType === "automatic"
                          ? "⚡ AUTOMATIC SENSOR DETECTED: CNC-02 Spindle Motor Jammed at 12:10 PM!"
                          : "🚨 MANUAL BREAKDOWN SWITCH TRIGGERED: CNC-02 Simulated Failure Active!"}
                      </strong>
                      <p>
                        Needy operations stalled. Completed machine <strong>DRILL-03</strong> finished its shift work early (100% done at 11:45 AM) with open capacity!
                      </p>
                    </div>
                  </div>
                  <div className="sha-actions-group" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      className="banner-alert-dispatch-btn"
                      onClick={() => dispatchBreakdownAlert("manual")}
                      title="Dispatch real-time Twilio WhatsApp & SMS alert to maintenance team"
                    >
                      <Send size={13} /> {alertDispatching ? "Sending..." : "🚨 Send Twilio Alert (WhatsApp & SMS)"}
                    </button>
                    <button className="reheal-btn pulse-glow" onClick={triggerReheal}>
                      <Sparkles size={14} /> Reassign Needy Work to Completed Machine (DRILL-03)
                    </button>
                  </div>
                </div>
              )}

              {breakdown && healingState === "healing" && (
                <div className="schedule-healing-alert blue">
                  <div className="sha-info">
                    <RotateCcw size={18} className="spin-icon" />
                    <div>
                      <strong>Digital Twin AI: Reassigning Work to Completed Machine...</strong>
                      <p>Target Machine: DRILL-03 (Tasks 100% Completed) → Absorbing CNC-02 Shaft Turning &amp; Gear Teeth...</p>
                    </div>
                  </div>
                  <span className="healing-badge">Rerouting Workload...</span>
                </div>
              )}

              {breakdown && healingState === "healed" && (
                <div className="schedule-healing-alert green">
                  <div className="sha-info">
                    <CheckCircle2 size={18} className="check-icon" />
                    <div>
                      <strong>Reallocation Complete: Completed Machine DRILL-03 has absorbed CNC-02's jobs!</strong>
                      <p>DRILL-03 completed its quota early and absorbed the needy workload. Zero shift downtime. CNC-02 undergoing diagnostic calibration.</p>
                    </div>
                  </div>
                  <button className="restore-btn" onClick={restoreCNC02}>
                    <Check size={13} /> Restore Standard Lines
                  </button>
                </div>
              )}

              <div className="panel-heading schedule-subheading">
                <div><h3>Machine schedule</h3><p>Production timeline with live execution playhead</p></div>
                <div className="legend">
                  <span><i className="dot blue" /> Gear assembly</span>
                  <span><i className="dot coral" /> Shaft machining</span>
                  <span><i className="dot green" /> Bracket finishing</span>
                  <span><i className="dot amber" /> Inspection</span>
                  {healingState === "healed" && <span><i className="dot purple" /> ⚡ Reassigned to Completed Machine</span>}
                </div>
              </div>

              <div className="gantt-scroll">
                <div className="gantt live-gantt">
                  {/* Vertical Live Laser Playhead Scanner */}
                  <div
                    className="live-playhead"
                    style={{ left: `calc(67px + (100% - 72px) * ${simProgress / 100})` }}
                  >
                    <div className="playhead-tag">
                      <span className="playhead-dot" />
                      <span>{formatSimClock(simProgress)}</span>
                    </div>
                    <div className="playhead-line" />
                  </div>

                  {/* Auto-Breakdown trigger marker line if enabled */}
                  {autoBreakdown && (
                    <div
                      className="auto-fault-marker"
                      style={{ left: `calc(67px + (100% - 72px) * 0.52)` }}
                      title="Automatic Breakdown Trigger Point (52% / 12:10 PM)"
                    >
                      <span className="fault-marker-tag">⚡ Auto-Breakdown (12:10)</span>
                    </div>
                  )}

                  <div className="time-axis">
                    <span>Machine</span>
                    {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"].map(t => (
                      <span key={t} onClick={() => {
                        const parts = t.split(":");
                        const hour = parseInt(parts[0], 10);
                        const pct = ((hour - 8) / 8) * 100;
                        setSimProgress(pct);
                      }} title={`Jump to ${t}`}>
                        {t}
                      </span>
                    ))}
                  </div>

                  {scheduleRows.map((row, idx) => {
                    const isBrokenRow = breakdown && row.machine === "CNC-02" && healingState === "idle";
                    const isHealingRow = breakdown && row.machine === "CNC-02" && healingState === "healed";
                    const isAssistingRow = breakdown && row.machine === "DRILL-03" && healingState === "healed";
                    const isCompletedEarlyRow = row.machine === "DRILL-03" && simProgress >= 53 && !isAssistingRow;

                    return (
                      <div
                        className={`machine-row ${isBrokenRow ? "machine-broken-hazard" : ""} ${isAssistingRow ? "machine-assisting-row" : ""} ${isCompletedEarlyRow ? "machine-completed-row" : ""}`}
                        key={row.machine}
                      >
                        <div className="machine-label">
                          {row.machine}
                          <small>
                            {isAssistingRow
                              ? "⚡ Absorbing Work"
                              : isHealingRow
                              ? "Calibrating"
                              : isCompletedEarlyRow
                              ? "✅ Work Done Early"
                              : idx === 0
                              ? "Milling"
                              : idx === 1
                              ? "Turning"
                              : idx === 2
                              ? "Drilling"
                              : idx === 3
                              ? "Grinding"
                              : "Finishing"}
                          </small>
                        </div>
                        <div className="timeline-track">
                          {row.tasks.map((task, i) => {
                            const isRunning = simProgress >= task.left && simProgress <= (task.left + task.width);
                            const isDone = simProgress > (task.left + task.width);
                            const taskPct = isRunning ? Math.round(((simProgress - task.left) / task.width) * 100) : isDone ? 100 : 0;

                            return (
                              <div
                                key={i}
                                className={`task task-${task.tone} ${isRunning ? "task-active-running" : ""} ${isDone ? "task-completed" : ""} ${task.isRerouted ? "task-rerouted" : ""} ${task.isTransferred ? "task-transferred" : ""} ${task.isFailed ? "task-failed-hazard" : ""}`}
                                style={{ left: `${task.left}%`, width: `${task.width}%` }}
                                title={`${task.label} · ${task.isFailed ? "FAILED (Spindle Jam)" : isDone ? "Completed" : isRunning ? `Running (${taskPct}%)` : "Queued"}`}
                              >
                                {isDone && <span className="task-done-badge">✓</span>}
                                {isRunning && <span className="task-live-pulse" />}
                                <span className="task-text">{task.label}</span>
                                {isRunning && <span className="task-pct-tag">{taskPct}%</span>}
                              </div>
                            );
                          })}
                          {isBrokenRow && (
                            <div className="broken-label-hazard">
                              <span className="hazard-stripes" />
                              <strong>🚨 LIVE BREAKDOWN · NEEDY MACHINE (PAUSED)</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="progress-meta">
                <span>Shift progress (Shift A)</span>
                <strong>{Math.round(simProgress)}% complete · {formatSimClock(simProgress)}</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${Math.round(simProgress)}%` }} />
              </div>

              {(rush || materialDelay || breakdown) && (
                <div className="schedule-alert">
                  <ShieldAlert size={16} />
                  <span>
                    <strong>Schedule update:</strong>{" "}
                    {breakdown && healingState === "idle"
                      ? "CNC-02 broken down; click 'Reassign Needy Work' to transfer jobs to completed machine DRILL-03."
                      : breakdown && healingState === "healed"
                      ? "Completed machine DRILL-03 has absorbed CNC-02's shaft operations. Zero factory delay."
                      : rush
                      ? "Urgent order added to the production queue."
                      : "Material-dependent shaft operations are on hold."}
                  </span>
                </div>
              )}
            </div>

            <div className="panel machine-panel" id="machines">
              <div className="panel-heading">
                <div>
                  <h3>Machine health</h3>
                  <p>Virtual machine status &amp; live time estimation</p>
                </div>
                <span className="online-count"><i /> {breakdown && healingState === "idle" ? "7" : "8"} of 9 online</span>
              </div>

              <div className="machine-list">
                {machines.map((m) => {
                  const down = breakdown && m.id === "CNC-02";
                  const idle = m.tone === "amber" && !down;
                  const isAssisting = breakdown && m.id === "DRILL-03" && healingState === "healed";
                  const isHealing = breakdown && m.id === "CNC-02" && healingState === "healed";
                  const isCompletedEarly = m.id === "DRILL-03" && simProgress >= 53 && !isAssisting;

                  const etc = getMachineETC(m.id, simProgress, breakdown, healingState);

                  return (
                    <div
                      className={`machine-card clickable-machine-card ${down && healingState === "idle" ? "broken-card-hazard" : ""} ${isAssisting ? "assisting-card-glow" : ""} ${isCompletedEarly ? "completed-card-highlight" : ""}`}
                      key={m.id}
                      onClick={() => {
                        setSelectedMachine(m.name);
                        setMachineHealthOpen(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedMachine(m.name);
                          setMachineHealthOpen(true);
                        }
                      }}
                      title={`Click to open ${m.name} PowerBI Dashboard`}
                    >
                      <div className="machine-card-top-bar">
                        <img src={`https://images.unsplash.com/${m.image}?auto=format&fit=crop&w=140&q=75`} alt={m.name} />
                        <div className="machine-copy">
                          <div className="machine-card-title-row">
                            <strong>{m.name} <small>{m.id}</small></strong>
                            <span className="machine-view-tag">Dashboard →</span>
                          </div>
                          <p>
                            {down && healingState === "idle"
                              ? "🚨 Critical failure: Spindle Motor Overheated (Needy Machine)"
                              : isHealing
                              ? "🔧 Calibrating diagnostics · Work transferred to DRILL-03"
                              : isAssisting
                              ? "⚡ Absorbed CNC-02 needy workload (Finished shift early)"
                              : isCompletedEarly
                              ? "✅ 100% of shift work completed early · Free capacity"
                              : m.detail}
                          </p>
                        </div>
                        <span
                          className={`status-pill ${
                            down && healingState === "idle"
                              ? "down"
                              : isHealing
                              ? "healing-pill"
                              : isAssisting
                              ? "assisting-pill"
                              : isCompletedEarly
                              ? "completed-pill"
                              : idle
                              ? "idle"
                              : "running"
                          }`}
                        >
                          {down && healingState === "idle"
                            ? "Breakdown"
                            : isHealing
                            ? "Auto-Healing"
                            : isAssisting
                            ? "Assisting"
                            : isCompletedEarly
                            ? "Completed"
                            : m.status}
                        </span>
                      </div>

                      {/* Live Dynamic Time Estimation of Completion (ETC) */}
                      <div className="machine-live-etc-box">
                        <div className="etc-data-row">
                          <span className="etc-chip-label">
                            <Timer size={10} className="etc-icon" />
                            {etc.isPaused ? "ETA Status" : "Est. Completion"}
                          </span>
                          <strong className={`etc-countdown ${etc.isPaused ? "paused-red" : isAssisting ? "assisting-purple" : isCompletedEarly ? "completed-green" : ""}`}>
                            {etc.remainingStr}
                          </strong>
                        </div>
                        <div className="etc-track">
                          <div
                            className={`etc-fill ${etc.isPaused ? "paused" : isAssisting ? "assisting" : isHealing ? "healing" : isCompletedEarly ? "completed" : ""}`}
                            style={{ width: `${etc.percent}%` }}
                          />
                        </div>
                        <div className="etc-meta-row">
                          <span>Target: {etc.targetTime}</span>
                          <span className="etc-note">{etc.note}</span>
                        </div>
                      </div>

                      {/* Interactive Rehealing / Restore Buttons */}
                      {down && healingState === "idle" && (
                        <div className="card-broken-action" onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            className="card-alert-dispatch-btn"
                            onClick={() => dispatchBreakdownAlert("manual")}
                            title="Broadcast live Breakdown Trigger Notification via WhatsApp & SMS"
                          >
                            <Send size={11} /> Breakdown Trigger Notification
                          </button>
                          <button className="card-reheal-btn pulse-glow" onClick={triggerReheal}>
                            <Sparkles size={12} /> Reassign to Completed Machine (DRILL-03)
                          </button>
                        </div>
                      )}

                      {isHealing && (
                        <div className="card-broken-action" onClick={(e) => e.stopPropagation()}>
                          <button className="card-restore-btn" onClick={restoreCNC02}>
                            <Check size={12} /> Restore Original Configuration
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="sync-note">
                <Zap size={16} />
                <span>
                  <strong>Digital Twin Self-Healing Engine</strong><br />
                  Workload automatically shifts to backup machines during equipment failure to keep schedules on target.
                </span>
              </div>
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
              <div className="panel-heading"><div><h3>Simulate a disruption</h3><p>Interactive backend control studios</p></div><span className="test-badge">BACKEND STUDIOS</span></div>
              <div className="disruption-actions">
                <button
                  className={`disruption-button ${breakdown ? "selected red-select" : ""}`}
                  onClick={() => setActiveDisruptionModal("breakdown")}
                  title="Open Machine Breakdown & Telemetry Backend"
                >
                  <span className="disruption-emoji">⚠️</span>
                  <strong>{breakdown ? "CNC-02 Breakdown Active" : "Machine breakdown"}</strong>
                  <small>{breakdown ? "Configure / Self-Heal →" : "Telemetry Backend →"}</small>
                </button>
                <button
                  className={`disruption-button ${rush ? "selected orange-select" : ""}`}
                  onClick={() => setActiveDisruptionModal("rush")}
                  title="Open New Order Workflow (Pipeline Structure + FIFO Algorithm)"
                >
                  <span className="disruption-emoji">🚘</span>
                  <strong>{rush ? "Rush Order Active (FIFO)" : "Add rush order"}</strong>
                  <small>New Order Pipeline (FIFO) →</small>
                </button>
                <button
                  className={`disruption-button ${materialDelay ? "selected amber-select" : ""}`}
                  onClick={() => setActiveDisruptionModal("material")}
                  title="Open Material Delay & Inventory Buffer Backend"
                >
                  <span className="disruption-emoji">📦</span>
                  <strong>{materialDelay ? "Material Delay Active" : "Material delay"}</strong>
                  <small>{materialDelay ? "Resolve Delivery →" : "Supply Chain Backend →"}</small>
                </button>
              </div>
              <div className="simulation-note"><span className="note-icon"><CircleHelp size={16} /></span><p>{notice}</p></div>
              <button className="button button-dark full-button" onClick={() => { setModal(true); }}>How the Digital Twin works <ArrowRight size={15} /></button>
            </div>
          </div>
        </section>

        <ReportAnalysisAiSection onRehealWorkload={triggerReheal} />
      </main>

      {machineHealthOpen && (
        <div className="mhd-overlay">
          <button className="mhd-overlay-close" onClick={() => { setMachineHealthOpen(false); setSelectedMachine(null); }} aria-label="Close Machine Health dashboard">✕ Close</button>
          <MachineDashboard initialMachine={selectedMachine} />
        </div>
      )}

      {activeDisruptionModal && (
        <DisruptionModal
          activeModal={activeDisruptionModal}
          onClose={() => setActiveDisruptionModal(null)}
          breakdown={breakdown}
          healingState={healingState}
          triggerManualBreakdown={toggleManualBreakdown}
          triggerReheal={triggerReheal}
          restoreCNC02={restoreCNC02}
          rush={rush}
          setRush={setRush}
          materialDelay={materialDelay}
          setMaterialDelay={setMaterialDelay}
          addEvent={addEvent}
          notify={notify}
          setNotice={setNotice}
          onDispatchTwilioAlert={dispatchBreakdownAlert}
        />
      )}

      <TwilioModal
        isOpen={twilioModalOpen}
        onClose={() => setTwilioModalOpen(false)}
        onAlertDispatched={() => setTwilioLogsCount(getTwilioLogs().length)}
      />
      <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark"><Factory size={16} /></span><span>flexi<span className="brand-accent">Scheduler</span></span></a><span>Digital Twin for Automobile Parts Manufacturing</span><span className="footer-tag"><span /> Simulation prototype · 2026</span></footer>

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><div className="modal">
        <button className="modal-close" aria-label="Close modal" onClick={() => setModal(false)}><X size={18} /></button>
        <div className="modal-symbol"><Factory size={24} /></div><div className="eyebrow"><span /> DIGITAL TWIN WORKFLOW</div><h2>From factory data to better decisions.</h2>
        <p>flexiScheduler represents an automobile parts factory in software. It tracks virtual machine states and job progress, simulates production events, and demonstrates how a scheduling algorithm could reorganize work after a disruption.</p>
        <div className="workflow-list"><div><span>01</span><strong>Factory data</strong><small>Machines, jobs, processing times</small></div><ArrowRight /><div><span>02</span><strong>Simulate</strong><small>Track jobs and machine states</small></div><ArrowRight /><div><span>03</span><strong>Reschedule</strong><small>Evaluate an updated plan</small></div></div>
        <div className="modal-disclaimer">This frontend is a prototype. The current interactions use sample data and do not yet run a real optimization algorithm or connect to factory sensors.</div>
        <button className="button button-dark full-button" onClick={() => { setModal(false); scrollTo("events"); }}>Try a disruption <ArrowRight size={15} /></button>
      </div></div>}
      <LiveMonitoringWidget />
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function Kpi({ icon, label, value, suffix, trend, warning }) {
  return <article className="kpi-card"><div className="kpi-top"><span>{label}</span><span className="kpi-icon">{icon}</span></div><div className="kpi-value">{value}{suffix && <small>{suffix}</small>}</div><div className={`kpi-trend ${warning ? "warning" : ""}`}>{warning ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{trend}</div></article>;
}

export default App;