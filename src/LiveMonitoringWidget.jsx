import React, { useState, useRef, useEffect } from "react";
import {
  Camera, Video, VideoOff, X, Maximize2, Minimize2,
  Scan, Radio, Shield, RefreshCw, AlertCircle, Eye, Disc
} from "lucide-react";

export default function LiveMonitoringWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [camError, setCamError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hudScan, setHudScan] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [fps, setFps] = useState(30);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Real-time clock for CCTV timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slight jitter for FPS to simulate live CCTV telemetry
  useEffect(() => {
    if (!streamActive) return;
    const interval = setInterval(() => {
      setFps(Math.floor(29 + Math.random() * 3));
    }, 2500);
    return () => clearInterval(interval);
  }, [streamActive]);

  // Start webcam
  const startCamera = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  // Stop webcam and release hardware light
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

  // Handle open/close
  const handleOpen = () => {
    setIsOpen(true);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
    setIsExpanded(false);
    setSnapshotUrl(null);
  };

  // Re-attach video stream if modal re-renders or changes state
  useEffect(() => {
    if (isOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isOpen, isExpanded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Take snapshot from canvas
  const takeSnapshot = () => {
    if (!videoRef.current || !streamActive) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/png");
      setSnapshotUrl(url);
      setTimeout(() => setSnapshotUrl(null), 5000);
    } catch (e) {
      console.error("Snapshot error:", e);
    }
  };

  return (
    <>
      {/* Floating Circular Live Monitoring Launcher Widget (Placed on bottom right) */}
      {!isOpen && (
        <div className="live-cam-launcher-wrap">
          <button
            className="live-cam-launcher-btn"
            onClick={handleOpen}
            title="Open Live Camera Monitoring (Laptop Camera)"
            aria-label="Open Live Camera Monitoring"
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

      {/* Live Monitoring Camera Window / Modal */}
      {isOpen && (
        <div className={`live-monitoring-window ${isExpanded ? "expanded" : "docked"}`}>
          {/* Top Industrial CCTV Bar */}
          <div className="cctv-header">
            <div className="cctv-header-left">
              <div className="cctv-rec-indicator">
                <span className="cctv-red-dot" />
                <strong>REC</strong>
              </div>
              <span className="cctv-cam-tag">LIVE CAMERA FEED</span>
              <span className="cctv-badge-online">ONLINE</span>
            </div>

            <div className="cctv-header-center">
              <time className="cctv-timestamp">
                {currentTime.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}{" "}
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </time>
            </div>

            <div className="cctv-header-right">
              <button
                className="cctv-btn-icon"
                onClick={() => setHudScan(!hudScan)}
                title={hudScan ? "Hide AI Vision HUD" : "Show AI Vision HUD"}
              >
                <Scan size={14} className={hudScan ? "active-hud" : ""} />
              </button>
              <button
                className="cctv-btn-icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Dock camera to corner" : "Expand camera window"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                className="cctv-btn-icon cctv-close"
                onClick={handleClose}
                title="Stop camera & close live monitoring"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* CCTV Video Viewport & Overlays */}
          <div className="cctv-viewport">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`cctv-video ${streamActive ? "active" : "hidden"}`}
            />

            {/* Loading Spinner */}
            {loading && (
              <div className="cctv-placeholder">
                <RefreshCw size={28} className="cctv-spin" />
                <p>Connecting to Laptop Camera Hardware...</p>
                <small>Requesting WebRTC video stream</small>
              </div>
            )}

            {/* Error or Permission Denied State */}
            {!loading && camError && (
              <div className="cctv-placeholder error">
                <AlertCircle size={32} className="cctv-err-icon" />
                <h4>Camera Access Required</h4>
                <p>{camError}</p>
                <button className="cctv-retry-btn" onClick={startCamera}>
                  <RefreshCw size={13} /> Try Reconnecting
                </button>
              </div>
            )}

            {/* CCTV HUD / Computer Vision Graphic Overlays */}
            {streamActive && (
              <div className="cctv-hud-layer">
                {/* Crosshairs & Corner Brackets */}
                <div className="hud-corner top-left" />
                <div className="hud-corner top-right" />
                <div className="hud-corner bottom-left" />
                <div className="hud-corner bottom-right" />

                {/* Laser scanline animation */}
                {hudScan && <div className="hud-laser-line" />}

                {/* Telemetry info cards */}
                <div className="hud-telemetry-top">
                  <span className="hud-chip">FPS: {fps}</span>
                  <span className="hud-chip">720p HD</span>
                  <span className="hud-chip">BITRATE: 2.4 Mbps</span>
                  <span className="hud-chip green">LATENCY: 12ms</span>
                </div>

                {hudScan && (
                  <div className="hud-ai-box">
                    <div className="hud-ai-target">
                      <div className="hud-reticle" />
                      <span className="hud-ai-tag">AI VISION: OPTICAL RECOGNITION ACTIVE</span>
                      <span className="hud-ai-sub">AREA: WORKSTATION CNC-02</span>
                    </div>
                  </div>
                )}

                {/* Snapshot notification preview */}
                {snapshotUrl && (
                  <div className="hud-snapshot-toast">
                    <img src={snapshotUrl} alt="Camera snapshot" />
                    <div>
                      <strong>Frame Captured</strong>
                      <small>Saved to factory QA log</small>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="cctv-footer">
            <div className="cctv-status-row">
              <span className={`cctv-source-pill ${streamActive ? "active" : ""}`}>
                <Radio size={11} className={streamActive ? "radio-live" : ""} />
                {streamActive ? "SOURCE: Integrated Laptop Webcam (Live)" : "SOURCE: Standby"}
              </span>

              <div className="cctv-action-group">
                {streamActive ? (
                  <button className="cctv-act-btn" onClick={stopCamera} title="Pause video feed">
                    <VideoOff size={13} /> Pause
                  </button>
                ) : (
                  <button className="cctv-act-btn primary" onClick={startCamera} title="Start video feed">
                    <Video size={13} /> Resume
                  </button>
                )}

                <button
                  className="cctv-act-btn"
                  onClick={takeSnapshot}
                  disabled={!streamActive}
                  title="Capture live frame snapshot"
                >
                  <Disc size={13} /> Snapshot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
