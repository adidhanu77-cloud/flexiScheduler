import React, { useState, useRef, useEffect } from "react";
import {
  Camera, Video, VideoOff, X, Maximize2, Minimize2,
  Scan, Radio, Shield, RefreshCw, AlertCircle, AlertTriangle, Eye, Disc,
  Upload, Image as ImageIcon, Film, Calendar, Settings, Bell, Check,
  Play, Pause, ArrowRight, Activity, Clock, Zap, Cpu, CheckCircle2,
  ChevronRight, Volume2, VolumeX, ShieldAlert, FileText, CornerDownRight
} from "lucide-react";

// Default realistic industrial manufacturing floor imagery
const FLOOR_PRESETS = {
  floor1: {
    id: "floor1",
    name: "Floor 1 • LIVE",
    camTag: "CAM-02 | Welding Bay",
    fps: 30,
    resolution: "1080p",
    activeStatus: "85% Running",
    recLabel: "CAM-02 WELDING BAY",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
    machines: [
      {
        id: "M1",
        name: "M1 - Welding",
        load: 85,
        status: "RUNNING",
        tone: "green",
        coords: "[X:312 Y:188 W:220 H:140]",
        pos: { top: "45%", left: "24%", width: "17%", height: "24%" },
        temp: "68°C",
        vibration: "0.22 mm/s",
        power: "42.5 kW",
        currentJob: "Job #W-804 (Chassis Frame)"
      },
      {
        id: "M2",
        name: "M2 - Painting",
        load: 78,
        status: "RUNNING",
        tone: "green",
        coords: "[X:312 Y:188 W:220 H:140]",
        pos: { top: "25%", left: "43%", width: "14%", height: "18%" },
        temp: "54°C",
        vibration: "0.15 mm/s",
        power: "28.0 kW",
        currentJob: "Job #P-412 (Primer Coat)"
      },
      {
        id: "M3",
        name: "M3 - Assembly",
        load: 40,
        status: "IDLE",
        tone: "amber",
        coords: "[X:312 Y:188 W:220 H:140]",
        pos: { top: "24%", left: "62%", width: "14%", height: "18%" },
        temp: "37°C",
        vibration: "0.04 mm/s",
        power: "11.2 kW",
        currentJob: "Awaiting Next Sub-Assembly"
      },
      {
        id: "M4",
        name: "M4 - Engine Line",
        load: 0,
        status: "BREAKDOWN",
        tone: "red",
        coords: "[X:312 Y:188 W:220 H:140]",
        pos: { top: "49%", left: "64%", width: "17%", height: "20%" },
        temp: "92°C (OVERHEAT)",
        vibration: "1.92 mm/s (CRITICAL)",
        power: "0.0 kW",
        currentJob: "CRITICAL: Conveyor Jam #E-404"
      },
      {
        id: "M5",
        name: "M5 - Quality Check",
        load: 90,
        status: "RUNNING",
        tone: "green",
        coords: "[X:312 Y:188 W:220 H:140]",
        pos: { top: "67%", left: "61%", width: "16%", height: "18%" },
        temp: "41°C",
        vibration: "0.11 mm/s",
        power: "18.4 kW",
        currentJob: "Laser Inspection & QA"
      }
    ]
  },
  floor2: {
    id: "floor2",
    name: "Floor 2",
    camTag: "CAM-01 | Painting Bay",
    fps: 30,
    resolution: "1080p",
    activeStatus: "78% Running",
    recLabel: "CAM-01 PAINTING BAY",
    image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=300&q=80",
    machines: [
      {
        id: "M1",
        name: "P1 - Surface Prep",
        load: 82,
        status: "RUNNING",
        tone: "green",
        coords: "[X:180 Y:210 W:210 H:135]",
        pos: { top: "40%", left: "20%", width: "18%", height: "24%" },
        temp: "45°C",
        vibration: "0.19 mm/s",
        power: "31.0 kW",
        currentJob: "Primer Degreasing #P-101"
      },
      {
        id: "M2",
        name: "P2 - Electrostatic Spray",
        load: 78,
        status: "RUNNING",
        tone: "green",
        coords: "[X:380 Y:190 W:200 H:140]",
        pos: { top: "30%", left: "45%", width: "16%", height: "20%" },
        temp: "52°C",
        vibration: "0.14 mm/s",
        power: "35.2 kW",
        currentJob: "Automotive Basecoat"
      },
      {
        id: "M3",
        name: "P3 - Curing Oven",
        load: 74,
        status: "RUNNING",
        tone: "green",
        coords: "[X:590 Y:230 W:210 H:150]",
        pos: { top: "45%", left: "66%", width: "18%", height: "22%" },
        temp: "140°C",
        vibration: "0.08 mm/s",
        power: "68.0 kW",
        currentJob: "Baking Cycle 4"
      }
    ]
  },
  floor3: {
    id: "floor3",
    name: "Floor 3",
    camTag: "CAM-03 | QC Station",
    fps: 30,
    resolution: "1080p",
    activeStatus: "90% Running",
    recLabel: "CAM-03 QC INSPECTION BAY",
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=80",
    thumbnail: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&q=80",
    machines: [
      {
        id: "M1",
        name: "QC-01 - 3D Optical Scanner",
        load: 92,
        status: "RUNNING",
        tone: "green",
        coords: "[X:210 Y:195 W:205 H:140]",
        pos: { top: "35%", left: "22%", width: "18%", height: "24%" },
        temp: "32°C",
        vibration: "0.03 mm/s",
        power: "14.5 kW",
        currentJob: "Coordinate Measuring Test"
      },
      {
        id: "M2",
        name: "QC-02 - Ultrasonic Flaw Detector",
        load: 88,
        status: "RUNNING",
        tone: "green",
        coords: "[X:460 Y:240 W:220 H:145]",
        pos: { top: "42%", left: "50%", width: "17%", height: "22%" },
        temp: "35°C",
        vibration: "0.02 mm/s",
        power: "12.0 kW",
        currentJob: "Weld Seam Integrity Pass"
      }
    ]
  }
};

export default function LiveMonitoringWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // default to expanded 16:9 view matching the image
  const [activeFloorId, setActiveFloorId] = useState("floor1");
  const [activeSourceType, setActiveSourceType] = useState("preset"); // "preset" | "webcam" | "upload_photo" | "upload_video"
  
  // Custom uploaded media state
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedMediaType, setUploadedMediaType] = useState(null); // "image" | "video"
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(100);

  // Webcam stream state
  const [streamActive, setStreamActive] = useState(false);
  const [camError, setCamError] = useState(null);
  const [loadingWebcam, setLoadingWebcam] = useState(false);

  // HUD & Telemetry
  const [hudScan, setHudScan] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fps, setFps] = useState(30);
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // Alerts & Rescheduling
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDone, setRescheduleDone] = useState(false);

  // Machine state list for the active view
  const [currentMachines, setCurrentMachines] = useState(FLOOR_PRESETS.floor1.machines);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const uploadedVideoRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Real-time clock for CCTV timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry FPS jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(29 + Math.random() * 3));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Update current machines when floor changes
  useEffect(() => {
    if (activeSourceType === "preset" && FLOOR_PRESETS[activeFloorId]) {
      setCurrentMachines(FLOOR_PRESETS[activeFloorId].machines);
    }
  }, [activeFloorId, activeSourceType]);

  // Start webcam
  const startCamera = async () => {
    setLoadingWebcam(true);
    setCamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("WebRTC / Camera API is not supported in this browser environment.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStreamActive(true);
      setActiveSourceType("webcam");
      triggerAiMediaScan("Laptop Integrated Webcam (HD 720p)");
    } catch (err) {
      console.warn("Camera access error:", err);
      let msg = "Could not access laptop camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera permissions in your browser address bar.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No webcam device found on this laptop/computer.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Webcam is already in use by another application.";
      } else {
        msg = err.message || msg;
      }
      setCamError(msg);
      setStreamActive(false);
    } finally {
      setLoadingWebcam(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.error("Error stopping track", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Trigger simulated AI Computer Vision analysis on uploaded media or video
  const triggerAiMediaScan = (mediaTitle) => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    
    const t1 = setTimeout(() => setAnalysisProgress(48), 350);
    const t2 = setTimeout(() => setAnalysisProgress(82), 700);
    const t3 = setTimeout(() => {
      setAnalysisProgress(100);
      setIsAnalyzing(false);
      // Generate dynamic detected machine boxes for uploaded media
      setCurrentMachines([
        {
          id: "M1",
          name: "M1 - Welding Unit",
          load: 85,
          status: "RUNNING",
          tone: "green",
          coords: "[X:312 Y:188 W:220 H:140]",
          pos: { top: "45%", left: "24%", width: "17%", height: "24%" },
          temp: "68°C",
          vibration: "0.22 mm/s",
          power: "42.5 kW",
          currentJob: "Frame Welding Active"
        },
        {
          id: "M2",
          name: "M2 - Paint Robot",
          load: 78,
          status: "RUNNING",
          tone: "green",
          coords: "[X:312 Y:188 W:220 H:140]",
          pos: { top: "25%", left: "43%", width: "14%", height: "18%" },
          temp: "54°C",
          vibration: "0.15 mm/s",
          power: "28.0 kW",
          currentJob: "Automated Spray Coating"
        },
        {
          id: "M3",
          name: "M3 - Assembly Line",
          load: 40,
          status: "IDLE",
          tone: "amber",
          coords: "[X:312 Y:188 W:220 H:140]",
          pos: { top: "24%", left: "62%", width: "14%", height: "18%" },
          temp: "37°C",
          vibration: "0.04 mm/s",
          power: "11.2 kW",
          currentJob: "Standby for Next Batch"
        },
        {
          id: "M4",
          name: "M4 - Engine Line",
          load: 0,
          status: "BREAKDOWN",
          tone: "red",
          coords: "[X:312 Y:188 W:220 H:140]",
          pos: { top: "49%", left: "64%", width: "17%", height: "20%" },
          temp: "92°C (OVERHEAT)",
          vibration: "1.92 mm/s (CRITICAL)",
          power: "0.0 kW",
          currentJob: "Conveyor Stoppage #E-404"
        },
        {
          id: "M5",
          name: "M5 - Quality Station",
          load: 90,
          status: "RUNNING",
          tone: "green",
          coords: "[X:312 Y:188 W:220 H:140]",
          pos: { top: "67%", left: "61%", width: "16%", height: "18%" },
          temp: "41°C",
          vibration: "0.11 mm/s",
          power: "18.4 kW",
          currentJob: "Laser Geometry Inspection"
        }
      ]);
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    const url = URL.createObjectURL(file);
    setUploadedMediaUrl(url);
    setUploadedFileName(file.name);
    setUploadedMediaType("image");
    setActiveSourceType("upload_photo");
    triggerAiMediaScan(file.name);
  };

  // Handle Video File Upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();
    const url = URL.createObjectURL(file);
    setUploadedMediaUrl(url);
    setUploadedFileName(file.name);
    setUploadedMediaType("video");
    setActiveSourceType("upload_video");
    triggerAiMediaScan(file.name);
  };

  // Switch to Preset Floor
  const handleSelectFloor = (floorId) => {
    stopCamera();
    setActiveFloorId(floorId);
    setActiveSourceType("preset");
    if (FLOOR_PRESETS[floorId]) {
      setCurrentMachines(FLOOR_PRESETS[floorId].machines);
    }
  };

  // Open modal
  const handleOpen = () => {
    setIsOpen(true);
    // Default open on Floor 1
    setActiveSourceType("preset");
    setActiveFloorId("floor1");
    setCurrentMachines(FLOOR_PRESETS.floor1.machines);
  };

  // Close modal
  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setSelectedMachineId(null);
  };

  // Acknowledge Alert action
  const handleAcknowledgeAlert = () => {
    setAlertAcknowledged(true);
  };

  // Run Rescheduling action
  const handleRunRescheduling = () => {
    setIsRescheduling(true);
    setTimeout(() => {
      setIsRescheduling(false);
      setRescheduleDone(true);
      // Reroute jobs from M4 (Engine Line) to M1 and M3
      setCurrentMachines((prev) =>
        prev.map((m) => {
          if (m.id === "M4") {
            return {
              ...m,
              status: "REROUTED / STANDBY",
              tone: "amber",
              load: 0,
              currentJob: "Rerouted to Line M1 & M3 (Maintenance Dispatched)"
            };
          }
          if (m.id === "M1") {
            return {
              ...m,
              load: 96,
              currentJob: "Job #W-804 + Rerouted Engine Brackets"
            };
          }
          if (m.id === "M3") {
            return {
              ...m,
              status: "RUNNING",
              tone: "green",
              load: 76,
              currentJob: "Processing Rerouted Engine Assembly Line"
            };
          }
          return m;
        })
      );
    }, 1400);
  };

  // Get active feed info string
  const getActiveFeedMeta = () => {
    if (activeSourceType === "webcam") {
      return {
        tag: "CAM-WEBCAM | Integrated Laptop Camera",
        recLabel: "LIVE LAPTOP CAM FEED",
        fps: fps,
        resolution: "720p HD"
      };
    }
    if (activeSourceType === "upload_photo") {
      return {
        tag: `CAM-FILE | Photo: ${uploadedFileName || "Uploaded Shopfloor Frame"}`,
        recLabel: `OPTICAL SCAN: ${uploadedFileName ? uploadedFileName.substring(0, 18) : "FRAME-01"}`,
        fps: 0,
        resolution: "HI-RES IMAGE"
      };
    }
    if (activeSourceType === "upload_video") {
      return {
        tag: `CAM-VIDEO | File: ${uploadedFileName || "Shopfloor Video Feed"}`,
        recLabel: `PLAYBACK: ${uploadedFileName ? uploadedFileName.substring(0, 18) : "VIDEO-01"}`,
        fps: 30,
        resolution: "1080p MP4"
      };
    }
    const current = FLOOR_PRESETS[activeFloorId] || FLOOR_PRESETS.floor1;
    return {
      tag: current.camTag,
      recLabel: current.recLabel,
      fps: fps,
      resolution: current.resolution
    };
  };

  const feedMeta = getActiveFeedMeta();
  const selectedMachine = currentMachines.find((m) => m.id === selectedMachineId);

  return (
    <>
      {/* Hidden file inputs for photo and video upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotoUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={handleVideoUpload}
      />

      {/* Floating Circular Live Monitoring Launcher Widget (Bottom Right) */}
      {!isOpen && (
        <div className="live-cam-launcher-wrap">
          <button
            className="live-cam-launcher-btn"
            onClick={handleOpen}
            title="Open TwinForge CCTV Live Monitoring"
            aria-label="Open TwinForge CCTV Live Monitoring"
          >
            <div className="live-cam-pulse-ring" />
            <div className="live-cam-pulse-ring ring-delay" />
            <div className="live-cam-icon-box">
              <Camera size={24} className="cam-main-icon" />
              <span className="live-rec-dot-pill" />
            </div>
          </button>
        </div>
      )}

      {/* CCTV Live Monitoring Modal / Console */}
      {isOpen && (
        <div className={`twinforge-cctv-modal ${isExpanded ? "expanded" : "docked"}`}>
          {/* TOP INDUSTRIAL HEADER BAR */}
          <header className="tf-cctv-header">
            {/* Brand Logo & Subtitle */}
            <div className="tf-cctv-brand">
              <div className="tf-brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f59e0b" />
                </svg>
              </div>
              <div className="tf-brand-text">
                <div className="tf-brand-title">TwinForge</div>
                <div className="tf-brand-subtitle">Smart Manufacturing | CCTV LIVE MONITORING</div>
              </div>
            </div>

            {/* Live Indicator & Datetime & Cam Info */}
            <div className="tf-cctv-header-meta">
              <div className="tf-live-badge">
                <span className="tf-live-pulse-dot" />
                <span>LIVE</span>
              </div>
              <span className="tf-header-divider">|</span>
              <div className="tf-header-datetime">
                {currentTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                {currentTime.toLocaleTimeString("en-US", { hour12: true })}
              </div>
              <div className="tf-header-camtag">
                {feedMeta.tag} | FPS {feedMeta.fps} | {feedMeta.resolution}
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="tf-cctv-header-actions">
              {/* Upload Photo Button */}
              <button
                className="tf-hdr-btn"
                onClick={() => photoInputRef.current?.click()}
                title="Upload Photo for Real-Time Machine Detection"
              >
                <ImageIcon size={15} />
                <span className="tf-btn-label">Photo</span>
              </button>

              {/* Upload Video Button */}
              <button
                className="tf-hdr-btn"
                onClick={() => videoInputRef.current?.click()}
                title="Upload Video for Real-Time Machine Tracking"
              >
                <Film size={15} />
                <span className="tf-btn-label">Video</span>
              </button>

              {/* Laptop Camera Button */}
              <button
                className={`tf-hdr-btn ${activeSourceType === "webcam" ? "active" : ""}`}
                onClick={activeSourceType === "webcam" ? stopCamera : startCamera}
                title="Toggle Laptop Webcam Feed"
              >
                <Camera size={15} />
                <span className="tf-btn-label">Webcam</span>
              </button>

              {/* Toggle HUD Crosshair Scanlines */}
              <button
                className={`tf-hdr-btn-icon ${hudScan ? "active" : ""}`}
                onClick={() => setHudScan(!hudScan)}
                title={hudScan ? "Hide AI Detection Reticles" : "Show AI Detection Reticles"}
              >
                <Scan size={16} />
              </button>

              {/* Dock / Expand Toggle */}
              <button
                className="tf-hdr-btn-icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Dock to compact window" : "Expand to widescreen console"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* User Avatar Circle */}
              <div className="tf-user-avatar" title="Plant Supervisor (Active)">
                K
              </div>

              {/* Close Button */}
              <button
                className="tf-hdr-btn-icon tf-close"
                onClick={handleClose}
                title="Close CCTV Monitoring Console"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* MAIN 3-COLUMN WORKSPACE */}
          <div className="tf-cctv-body">
            {/* 1. LEFT COLUMN: CAMERA LIST & SYSTEM METRICS */}
            <aside className="tf-cctv-sidebar-left">
              <div className="tf-sidebar-heading">CAMERA LIST</div>

              <div className="tf-cam-list">
                {/* Floor 1 (Live Active) */}
                <div
                  className={`tf-cam-card ${activeFloorId === "floor1" && activeSourceType === "preset" ? "active" : ""}`}
                  onClick={() => handleSelectFloor("floor1")}
                >
                  <div className="tf-cam-card-top">
                    <span className="tf-cam-name">Floor 1 • LIVE</span>
                    {activeFloorId === "floor1" && activeSourceType === "preset" && (
                      <span className="tf-cam-active-tag">Active</span>
                    )}
                  </div>
                </div>

                {/* Floor 2 */}
                <div
                  className={`tf-cam-card thumb ${activeFloorId === "floor2" && activeSourceType === "preset" ? "active" : ""}`}
                  onClick={() => handleSelectFloor("floor2")}
                >
                  <div className="tf-cam-name">Floor 2</div>
                  <div className="tf-cam-thumb-wrap">
                    <img src={FLOOR_PRESETS.floor2.thumbnail} alt="Floor 2 Cam" />
                  </div>
                  <div className="tf-cam-subtext">CAM-01 | Painting Bay</div>
                  <div className="tf-cam-load-text">78% Running</div>
                </div>

                {/* Floor 3 */}
                <div
                  className={`tf-cam-card thumb ${activeFloorId === "floor3" && activeSourceType === "preset" ? "active" : ""}`}
                  onClick={() => handleSelectFloor("floor3")}
                >
                  <div className="tf-cam-name">Floor 3</div>
                  <div className="tf-cam-thumb-wrap">
                    <img src={FLOOR_PRESETS.floor3.thumbnail} alt="Floor 3 Cam" />
                  </div>
                  <div className="tf-cam-subtext">CAM-03 | QC Station</div>
                  <div className="tf-cam-load-text">90% Running</div>
                </div>

                {/* Custom Uploaded Media card if active */}
                {(activeSourceType === "upload_photo" || activeSourceType === "upload_video") && (
                  <div className="tf-cam-card active custom-media-card">
                    <div className="tf-cam-card-top">
                      <span className="tf-cam-name">
                        {activeSourceType === "upload_photo" ? "📸 Uploaded Photo" : "🎬 Uploaded Video"}
                      </span>
                      <span className="tf-cam-active-tag">AI Track</span>
                    </div>
                    <div className="tf-cam-subtext">{uploadedFileName || "Custom Shopfloor Media"}</div>
                    <div className="tf-cam-load-text green">Telemetry Synced</div>
                  </div>
                )}

                {/* Webcam card if active */}
                {activeSourceType === "webcam" && (
                  <div className="tf-cam-card active custom-media-card">
                    <div className="tf-cam-card-top">
                      <span className="tf-cam-name">💻 Integrated Webcam</span>
                      <span className="tf-cam-active-tag">WebRTC</span>
                    </div>
                    <div className="tf-cam-subtext">Live Optical Stream</div>
                    <div className="tf-cam-load-text green">AI Vision Active</div>
                  </div>
                )}
              </div>

              {/* SYSTEM DIAGNOSTICS */}
              <div className="tf-system-panel">
                <div className="tf-sidebar-heading">SYSTEM</div>
                <div className="tf-sys-metric-row">
                  <span className="tf-sys-label">Recording</span>
                  <span className="tf-sys-val font-mono">24/7</span>
                </div>

                <div className="tf-sys-metric-block">
                  <div className="tf-sys-metric-row">
                    <span className="tf-sys-label">Storage</span>
                    <span className="tf-sys-val font-mono">2.4TB / 4TB</span>
                  </div>
                  <div className="tf-sys-prog-bar">
                    <div className="tf-sys-prog-fill" style={{ width: "60%" }} />
                  </div>
                </div>

                <div className="tf-sys-metric-row">
                  <span className="tf-sys-label">Network</span>
                  <span className="tf-sys-val green font-mono">
                    <span className="tf-ping-dot" /> 120ms • Stable
                  </span>
                </div>
              </div>
            </aside>

            {/* 2. CENTER COLUMN: MAIN VIEWPORT & EVENT TIMELINE */}
            <main className="tf-cctv-main-stream">
              {/* CCTV Video / Visual Viewport */}
              <div className="tf-viewport-wrapper">
                {/* 1. If Webcam Active */}
                {activeSourceType === "webcam" && (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`tf-stream-media ${streamActive ? "active" : "hidden"}`}
                  />
                )}

                {/* 2. If Uploaded Video Active */}
                {activeSourceType === "upload_video" && uploadedMediaUrl && (
                  <video
                    ref={uploadedVideoRef}
                    src={uploadedMediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="tf-stream-media"
                  />
                )}

                {/* 3. If Uploaded Photo Active */}
                {activeSourceType === "upload_photo" && uploadedMediaUrl && (
                  <img
                    src={uploadedMediaUrl}
                    alt="Uploaded Shopfloor Detection Frame"
                    className="tf-stream-media"
                  />
                )}

                {/* 4. If Floor Preset Active */}
                {activeSourceType === "preset" && (
                  <img
                    src={FLOOR_PRESETS[activeFloorId]?.image || FLOOR_PRESETS.floor1.image}
                    alt="Factory Live Feed"
                    className="tf-stream-media"
                  />
                )}

                {/* Webcam Loading State */}
                {loadingWebcam && (
                  <div className="tf-viewport-placeholder">
                    <RefreshCw size={36} className="cctv-spin" />
                    <h4>Connecting to Laptop Camera Hardware...</h4>
                    <p>Requesting secure WebRTC video stream</p>
                  </div>
                )}

                {/* Webcam Error State */}
                {!loadingWebcam && camError && activeSourceType === "webcam" && (
                  <div className="tf-viewport-placeholder error">
                    <AlertCircle size={36} className="cctv-err-icon" />
                    <h4>Camera Access Required</h4>
                    <p>{camError}</p>
                    <button className="cctv-retry-btn" onClick={startCamera}>
                      <RefreshCw size={14} /> Retry Hardware Connect
                    </button>
                  </div>
                )}

                {/* AI Neural Scanning Progress Overlay (Triggered upon photo/video upload) */}
                {isAnalyzing && (
                  <div className="tf-ai-analyzing-banner">
                    <div className="tf-analyzing-content">
                      <RefreshCw size={18} className="cctv-spin" />
                      <span>
                        AI NEURAL SCANNING: Analyzing machinery, conveyor status & thermal loads...
                      </span>
                      <strong>{analysisProgress}%</strong>
                    </div>
                    <div className="tf-analyzing-bar">
                      <div className="tf-analyzing-fill" style={{ width: `${analysisProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* COMPUTER VISION HUD & BOUNDING BOXES OVERLAY */}
                <div className="tf-hud-canvas">
                  {/* Top-Left CCTV Rec Pill & Location */}
                  <div className="tf-hud-rec-tag">
                    <span className="tf-rec-red-circle" />
                    <strong className="tf-rec-text">REC</strong>
                    <div className="tf-hud-rec-location">{feedMeta.recLabel}</div>
                  </div>

                  {/* Crosshairs Reticle spanning central axis */}
                  {hudScan && (
                    <div className="tf-hud-crosshairs">
                      <div className="tf-crosshair-h" />
                      <div className="tf-crosshair-v" />
                    </div>
                  )}

                  {/* Laser Sweeper Animation */}
                  {hudScan && <div className="tf-hud-laser-sweeper" />}

                  {/* REAL-TIME MACHINE BOUNDING BOXES (Rendered exactly like reference screenshot) */}
                  {hudScan &&
                    currentMachines.map((machine) => {
                      const isSelected = selectedMachineId === machine.id;
                      const isBreakdown = machine.status === "BREAKDOWN";

                      return (
                        <div
                          key={machine.id}
                          className={`tf-machine-bbox ${machine.tone} ${isSelected ? "selected" : ""} ${
                            isBreakdown ? "breakdown-pulse" : ""
                          }`}
                          style={{
                            top: machine.pos.top,
                            left: machine.pos.left,
                            width: machine.pos.width,
                            height: machine.pos.height
                          }}
                          onClick={() =>
                            setSelectedMachineId(isSelected ? null : machine.id)
                          }
                          title={`Click to view telemetry for ${machine.name}`}
                        >
                          {/* Top Tag Header */}
                          <div className={`tf-bbox-tag ${machine.tone}`}>
                            {isBreakdown && <AlertTriangle size={12} className="tf-tag-alert-ico" />}
                            <span className="tf-tag-name">{machine.name}</span>
                            <span className="tf-tag-div">|</span>
                            <span className="tf-tag-load">{machine.load}%</span>
                            <span className="tf-tag-div">|</span>
                            <span className="tf-tag-status">{machine.status}</span>
                          </div>

                          {/* Coordinates Subtitle */}
                          <div className="tf-bbox-coords">{machine.coords}</div>

                          {/* Corner Brackets */}
                          <span className="tf-bbox-corner tl" />
                          <span className="tf-bbox-corner tr" />
                          <span className="tf-bbox-corner bl" />
                          <span className="tf-bbox-corner br" />

                          {/* Expanded Telemetry Popup on Click */}
                          {isSelected && (
                            <div className="tf-bbox-telemetry-card">
                              <div className="tf-telemetry-hdr">
                                <strong>{machine.name}</strong>
                                <span className={`tf-telemetry-badge ${machine.tone}`}>
                                  {machine.status}
                                </span>
                              </div>
                              <div className="tf-telemetry-rows">
                                <div>
                                  <span>Efficiency Load:</span>
                                  <strong>{machine.load}%</strong>
                                </div>
                                <div>
                                  <span>Temperature:</span>
                                  <strong className={machine.temp.includes("OVERHEAT") ? "red" : ""}>
                                    {machine.temp}
                                  </strong>
                                </div>
                                <div>
                                  <span>Vibration:</span>
                                  <strong className={machine.vibration.includes("CRITICAL") ? "red" : ""}>
                                    {machine.vibration}
                                  </strong>
                                </div>
                                <div>
                                  <span>Power Draw:</span>
                                  <strong>{machine.power}</strong>
                                </div>
                                <div className="tf-telemetry-job">
                                  <span>Active Order:</span>
                                  <em>{machine.currentJob}</em>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Bottom Telemetry Overlay Bar Inside Viewport */}
                  <div className="tf-hud-bottom-bar">
                    <div className="tf-hud-stream-specs">
                      FPS: {feedMeta.fps} | {feedMeta.resolution} | H.264 | Signal: 98%
                    </div>
                    <div className="tf-hud-timestamp font-mono">
                      {currentTime.toISOString().split("T")[0]}{" "}
                      {currentTime.toLocaleTimeString("en-GB", { hour12: false })}
                    </div>
                  </div>
                </div>
              </div>

              {/* EVENT TIMELINE BAR (Directly beneath the video feed) */}
              <div className="tf-event-timeline-container">
                <div className="tf-timeline-title">EVENT TIMELINE • TODAY 08:00 — 12:00</div>

                <div className="tf-timeline-track-wrap">
                  {/* Timeline bar with active time span */}
                  <div className="tf-timeline-bar">
                    <div className="tf-timeline-elapsed" style={{ width: "60%" }} />

                    {/* Marker: Material Delay (08:40) */}
                    <div className="tf-timeline-marker green" style={{ left: "18%" }}>
                      <span className="tf-marker-dot green" />
                      <span className="tf-marker-label">Material Delay</span>
                    </div>

                    {/* Marker: Order #A-1023 (09:15) */}
                    <div className="tf-timeline-marker orange" style={{ left: "34%" }}>
                      <span className="tf-marker-dot orange" />
                      <span className="tf-marker-label">Order #A-1023</span>
                    </div>

                    {/* Marker: Breakdown (10:24) */}
                    <div className="tf-timeline-marker red" style={{ left: "60%" }}>
                      <span className="tf-marker-dot red pulsing" />
                      <span className="tf-marker-label red">
                        {rescheduleDone ? "RESCHEDULED — M4" : "BREAKDOWN — M4 Engine Line"}
                      </span>
                    </div>

                    {/* Vertical "NOW" Pin Indicator */}
                    <div className="tf-timeline-now-pin" style={{ left: "60%" }}>
                      <div className="tf-now-line" />
                      <span className="tf-now-tag">NOW</span>
                    </div>
                  </div>

                  {/* Horizontal Time Axis Ticks */}
                  <div className="tf-timeline-axis">
                    <span>8:00</span>
                    <span>9:00</span>
                    <span>10:00</span>
                    <span className="now-tick">10:24 NOW</span>
                    <span>11:00</span>
                    <span>12:00</span>
                  </div>
                </div>
              </div>
            </main>

            {/* 3. RIGHT COLUMN: MACHINE STATUS, ALERTS & QUICK ACTIONS */}
            <aside className="tf-cctv-sidebar-right">
              {/* MACHINE STATUS SECTION */}
              <div className="tf-machine-status-section">
                <div className="tf-section-header">
                  <Bell size={13} className="tf-sec-icon" />
                  <span>MACHINE STATUS</span>
                </div>

                <div className="tf-machine-status-list">
                  {currentMachines.map((m) => {
                    const isSelected = selectedMachineId === m.id;
                    const isBreakdown = m.status === "BREAKDOWN";

                    return (
                      <div
                        key={m.id}
                        className={`tf-machine-row ${m.tone} ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedMachineId(isSelected ? null : m.id)}
                      >
                        <div className="tf-machine-row-left">
                          {isBreakdown ? (
                            <AlertTriangle size={13} className="tf-status-alert-icon" />
                          ) : (
                            <span className={`tf-status-dot ${m.tone}`} />
                          )}
                          <span className="tf-m-name">{m.name}</span>
                        </div>
                        <div className="tf-machine-row-right">
                          <span className="tf-m-load">{m.load}%</span>
                          <span className={`tf-m-state ${m.tone}`}>{m.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ALERTS & NOTIFICATIONS SECTION */}
              <div className="tf-alerts-section">
                <div className="tf-section-header">
                  <Bell size={13} className="tf-sec-icon" />
                  <span>ALERTS & NOTIFICATIONS</span>
                </div>

                <div className="tf-alerts-list">
                  {/* Alert 1: M4 Engine Line Breakdown */}
                  <div className={`tf-alert-card red ${alertAcknowledged ? "acknowledged" : ""}`}>
                    <div className="tf-alert-top">
                      <AlertTriangle size={15} className="tf-alert-card-icon red" />
                      <div className="tf-alert-title">
                        10:24 — M4 Engine Line
                      </div>
                    </div>
                    <div className="tf-alert-desc">
                      {rescheduleDone
                        ? "Rescheduled: Load rerouted to M1 & M3. Maintenance in progress."
                        : alertAcknowledged
                        ? "Acknowledged: Rescheduling in progress..."
                        : "Rescheduling in progress..."}
                    </div>
                  </div>

                  {/* Alert 2: Rush Order */}
                  <div className="tf-alert-card amber">
                    <div className="tf-alert-top">
                      <Zap size={14} className="tf-alert-card-icon amber" />
                      <div className="tf-alert-title">
                        09:15 — New Rush Order Received
                      </div>
                    </div>
                    <div className="tf-alert-desc">
                      Order #A-1023 (Priority High)
                    </div>
                  </div>

                  {/* Alert 3: Material Delay */}
                  <div className="tf-alert-card blue">
                    <div className="tf-alert-top">
                      <Clock size={14} className="tf-alert-card-icon blue" />
                      <div className="tf-alert-title">
                        08:40 — Material Delay
                      </div>
                    </div>
                    <div className="tf-alert-desc">
                      Paint material delayed by 2 hrs
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS SECTION */}
              <div className="tf-quick-actions-section">
                <div className="tf-section-header">QUICK ACTIONS</div>

                <div className="tf-action-buttons">
                  {/* Acknowledge Alert Button */}
                  <button
                    className={`tf-action-btn ack ${alertAcknowledged ? "done" : ""}`}
                    onClick={handleAcknowledgeAlert}
                  >
                    {alertAcknowledged ? (
                      <>
                        <Check size={14} /> ALERT ACKNOWLEDGED
                      </>
                    ) : (
                      "ACKNOWLEDGE ALERT"
                    )}
                  </button>

                  {/* Run Rescheduling Button */}
                  <button
                    className={`tf-action-btn reschedule ${rescheduleDone ? "completed" : ""}`}
                    onClick={handleRunRescheduling}
                    disabled={isRescheduling}
                  >
                    {isRescheduling ? (
                      <>
                        <RefreshCw size={14} className="cctv-spin" /> RESCHEDULING...
                      </>
                    ) : rescheduleDone ? (
                      <>
                        <CheckCircle2 size={14} /> RESCHEDULED & BALANCED
                      </>
                    ) : (
                      "RUN RESCHEDULING"
                    )}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
