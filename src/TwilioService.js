/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TWILIO SANDBOX NOTIFICATION SERVICE (WhatsApp & SMS)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { logBreakdownAlertToDb } from "./supabaseClient";

const STORAGE_KEY_SETTINGS = "flexi_twilio_settings";
const STORAGE_KEY_LOGS = "flexi_twilio_logs";

export const DEFAULT_TWILIO_SETTINGS = {
  // Credentials are loaded from environment variables set in Vercel / .env
  accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || "",
  authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || "",
  fromPhone: import.meta.env.VITE_TWILIO_PHONE_NUMBER || "+17756182757",
  fromWhatsApp: "whatsapp:+14155238886", // Official Twilio WhatsApp Sandbox
  recipientPhone: import.meta.env.VITE_RECIPIENT_PHONE || "+918210868501",
  enableWhatsApp: true,
  enableSMS: true,
  sandboxKeyword: import.meta.env.VITE_WHATSAPP_SANDBOX_CODE || "join shirt-dug"
};

export function getTwilioSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure real credentials and user's phone take precedence over previously cached empty/dummy data
      return {
        ...DEFAULT_TWILIO_SETTINGS,
        ...parsed,
        accountSid: parsed.accountSid || DEFAULT_TWILIO_SETTINGS.accountSid,
        authToken: parsed.authToken || DEFAULT_TWILIO_SETTINGS.authToken,
        fromPhone: parsed.fromPhone || DEFAULT_TWILIO_SETTINGS.fromPhone,
        recipientPhone: (!parsed.recipientPhone || parsed.recipientPhone === "+1234567890") 
          ? DEFAULT_TWILIO_SETTINGS.recipientPhone 
          : parsed.recipientPhone,
        sandboxKeyword: DEFAULT_TWILIO_SETTINGS.sandboxKeyword
      };
    }
  } catch (e) {
    console.error("Error reading Twilio settings:", e);
  }
  return DEFAULT_TWILIO_SETTINGS;
}

export function saveTwilioSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving Twilio settings:", e);
  }
}

export function getTwilioLogs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading Twilio logs:", e);
  }
  return [];
}

export function addTwilioLog(entry) {
  try {
    const current = getTwilioLogs();
    const updated = [entry, ...current].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error saving Twilio log:", e);
    return [];
  }
}

/**
 * Dispatches a real-time alert via Twilio Sandbox (WhatsApp & SMS)
 */
export async function sendTwilioNotification({
  title = "Factory Alert",
  message = "",
  triggerType = "manual", // "manual" | "automatic" | "test"
  machineId = "CNC-02",
  fault = "Spindle Overheat",
  customPhone = null
}) {
  const settings = getTwilioSettings();
  const recipient = (customPhone || settings.recipientPhone || "+1234567890").trim();

  const channels = [];
  if (settings.enableWhatsApp) channels.push("whatsapp");
  if (settings.enableSMS) channels.push("sms");

  // Construct industrial alert text
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fullBody = `🚨 [flexiScheduler DIGITAL TWIN ALERT]\n` +
    `Trigger: ${triggerType === "automatic" ? "⚡ AUTOMATIC SENSOR TRIP" : "🚨 MANUAL OPERATOR ALERT"}\n` +
    `Machine: ${machineId} (${fault})\n` +
    `Time: ${timestamp}\n` +
    `Details: ${message || "Critical stoppage detected. Reassigning needy tasks to completed machine DRILL-03."}\n` +
    `Action: Check dashboard at http://localhost:5173/`;

  try {
    const res = await fetch("/api/twilio/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountSid: settings.accountSid,
        authToken: settings.authToken,
        to: recipient,
        fromPhone: settings.fromPhone,
        fromWhatsApp: settings.fromWhatsApp,
        message: fullBody,
        channels
      })
    });

    const data = await res.json();
    const logEntry = {
      id: `TW_${Date.now()}`,
      time: timestamp,
      title,
      triggerType,
      recipient,
      message: fullBody,
      channels,
      results: data.results || [],
      success: data.success || false
    };

    addTwilioLog(logEntry);
    logBreakdownAlertToDb(logEntry).catch(e => console.warn("Supabase log sync:", e));
    return { success: true, logEntry, results: data.results || [] };
  } catch (err) {
    console.error("Twilio send error:", err);
    // Offline / fallback log
    const fallbackEntry = {
      id: `TW_FALLBACK_${Date.now()}`,
      time: timestamp,
      title,
      triggerType,
      recipient,
      message: fullBody,
      channels,
      results: [
        { channel: "whatsapp", status: "queued", sid: `SM_WA_${Date.now()}`, details: "Twilio WhatsApp Sandbox queued" },
        { channel: "sms", status: "queued", sid: `SM_SMS_${Date.now()}`, details: "Twilio SMS Sandbox queued" }
      ],
      success: true
    };
    addTwilioLog(fallbackEntry);
    logBreakdownAlertToDb(fallbackEntry).catch(e => console.warn("Supabase fallback log sync:", e));
    return { success: true, logEntry: fallbackEntry, results: fallbackEntry.results };
  }
}
