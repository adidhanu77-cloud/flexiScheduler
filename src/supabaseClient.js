/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SUPABASE CLIENT & BACKEND INTEGRATION
 * Connects flexiScheduler frontend to Supabase PostgreSQL & Realtime
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://atcyesfxwortpmigehwd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;

/**
 * Fetch all machines from Supabase
 */
export async function fetchMachinesFromDb() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("machines").select("*");
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase fetchMachines warning:", err.message);
    return null;
  }
}

/**
 * Update machine health / status in Supabase
 */
export async function updateMachineInDb(machineId, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("machines")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", machineId)
      .select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase updateMachine warning:", err.message);
    return null;
  }
}

/**
 * Fetch all orders from Supabase (Pipeline & FIFO)
 */
export async function fetchOrdersFromDb() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase fetchOrders warning:", err.message);
    return null;
  }
}

/**
 * Insert a new order (e.g. from Disruption Studio FIFO / Rush Order)
 */
export async function insertOrderToDb(order) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          order_number: order.id || order.order_number,
          customer: order.customer,
          part: order.part,
          quantity: order.quantity || 100,
          priority: order.priority || "Standard",
          status: order.status || "Queued",
          workflow_stage: order.workflow_stage || "Intake & Verification",
          lead_time_hours: order.lead_time_hours || 4
        }
      ])
      .select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase insertOrder warning:", err.message);
    return null;
  }
}

/**
 * Log a breakdown alert to Supabase
 */
export async function logBreakdownAlertToDb(alert) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("breakdown_alerts")
      .insert([
        {
          title: alert.title || "Breakdown Trigger Alert",
          trigger_type: alert.triggerType || "manual",
          machine_id: alert.machineId || null,
          fault: alert.fault || null,
          message: alert.message,
          recipient: alert.recipient || "+918210868501",
          channels: alert.channels || ["whatsapp", "sms"],
          results: alert.results || []
        }
      ])
      .select();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Supabase logBreakdownAlert warning:", err.message);
    return null;
  }
}

/**
 * Subscribe to realtime changes on a table
 */
export function subscribeToRealtimeTable(tableName, onInsertOrUpdate) {
  if (!supabase) return null;
  return supabase
    .channel(`public:${tableName}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableName },
      (payload) => {
        if (onInsertOrUpdate) onInsertOrUpdate(payload);
      }
    )
    .subscribe();
}
