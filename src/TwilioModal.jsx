import React, { useState, useEffect } from "react";
import {
  Bell, Check, CheckCircle2, MessageSquare, Send, Smartphone, X, RefreshCw
} from "lucide-react";
import {
  getTwilioSettings,
  getTwilioLogs,
  sendTwilioNotification
} from "./TwilioService";

export default function TwilioModal({ isOpen, onClose, onAlertDispatched }) {
  const [settings, setSettings] = useState(getTwilioSettings());
  const [logs, setLogs] = useState(getTwilioLogs());
  const [isSending, setIsSending] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSettings(getTwilioSettings());
      setLogs(getTwilioLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setIsSending(true);
    const res = await sendTwilioNotification({
      title: "Breakdown Trigger Test Alert",
      message: "Test verification ping from flexiScheduler factory digital twin. Real-time channels operational.",
      triggerType: "test",
      machineId: "SYSTEM-TEST",
      fault: "Ping Verification"
    });
    setIsSending(false);
    setLogs(getTwilioLogs());
    setSuccessBanner(`Breakdown notification dispatched via WhatsApp (${settings.fromWhatsApp}) & SMS!`);
    setTimeout(() => setSuccessBanner(""), 4000);
    if (onAlertDispatched) onAlertDispatched(res);
  };

  return (
    <div className="disruption-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="disruption-modal-window twilio-modal-window">
        <button className="dm-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="twilio-modal-container">
          {/* Header */}
          <div className="tmb-header">
            <div className="tmb-badge">
              <span className="live-pulse-dot active" />
              <span>BREAKDOWN TRIGGER NOTIFICATION · REAL-TIME WHATSAPP &amp; SMS DISPATCH</span>
            </div>
            <div className="tmb-title-row">
              <h2>Breakdown Trigger Notification</h2>
              <div className="tmb-status-chips">
                <span className="channel-chip wa">
                  <MessageSquare size={13} /> WhatsApp: <strong>{settings.fromWhatsApp}</strong>
                </span>
                <span className="channel-chip sms">
                  <Smartphone size={13} /> Recipient: <strong>+91 8210868501</strong>
                </span>
                <span className="channel-chip code" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                  Code: <strong>shirt-dug</strong>
                </span>
              </div>
            </div>
            <p>
              Automated sensor trips and manual alert button clicks dispatch real-time incident notifications directly to maintenance teams via <strong>WhatsApp Sandbox</strong> and <strong>SMS</strong>.
            </p>
          </div>

          {successBanner && (
            <div className="order-added-toast">
              <CheckCircle2 size={16} /> {successBanner}
            </div>
          )}

          {/* LIVE DISPATCH LOGS VIEW */}
          <div className="tmb-logs-view">
            <div className="tmb-actions-bar">
              <div>
                <h4>Real-Time Notification Feed ({logs.length} Logged)</h4>
                <p>Chronological record of SMS and WhatsApp messages transmitted upon breakdown triggers.</p>
              </div>
              <button
                className="test-twilio-btn"
                onClick={handleSendTest}
                disabled={isSending}
              >
                {isSending ? <RefreshCw size={13} className="spin-icon" /> : <Send size={13} />}
                <span>{isSending ? "Dispatching..." : "Send Test Alert (WhatsApp & SMS)"}</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="tmb-empty-logs">
                <Smartphone size={32} className="empty-icon" />
                <h5>No Breakdown Notifications Dispatched Yet</h5>
                <p>Trip an automatic breakdown or click the Manual Breakdown Alert Button to dispatch live alerts.</p>
                <button className="button button-dark" onClick={handleSendTest}>
                  Send First Test Alert
                </button>
              </div>
            ) : (
              <div className="tmb-log-cards">
                {logs.map((log) => (
                  <div key={log.id} className="tmb-log-card">
                    <div className="tlc-header">
                      <div className="tlc-title-group">
                        <span className={`trigger-tag ${log.triggerType === "automatic" ? "auto" : log.triggerType === "manual" ? "manual" : "test"}`}>
                          {log.triggerType === "automatic" ? "⚡ AUTOMATIC BREAKDOWN" : log.triggerType === "manual" ? "🚨 MANUAL ALERT BUTTON" : "🔧 TEST PING"}
                        </span>
                        <strong>{log.title}</strong>
                      </div>
                      <time className="tlc-time">{log.time}</time>
                    </div>

                    <div className="tlc-channels">
                      <span className="tlc-dest">To: <strong>{log.recipient}</strong></span>
                      <div className="tlc-badges">
                        {log.channels.includes("whatsapp") && (
                          <span className="ch-pill wa">
                            <MessageSquare size={11} /> WhatsApp: Delivered
                          </span>
                        )}
                        {log.channels.includes("sms") && (
                          <span className="ch-pill sms">
                            <Smartphone size={11} /> SMS: Sent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="tlc-body-box">
                      <pre>{log.message}</pre>
                    </div>

                    {log.results && log.results.length > 0 && (
                      <div className="tlc-results-row">
                        {log.results.map((r, i) => (
                          <div key={i} className="tlc-sid-chip">
                            <span>{r.channel.toUpperCase()}:</span>
                            <code>{r.sid}</code>
                            <small>({r.status})</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
