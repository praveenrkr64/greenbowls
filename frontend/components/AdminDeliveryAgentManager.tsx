"use client";

import { useEffect, useState } from "react";
import {
  createDeliveryAgent,
  deactivateDeliveryAgent,
  DeliveryAgentAdminPayload,
  getAdminDeliveryAgents,
  updateDeliveryAgent,
} from "@/lib/api";
import { DeliveryAgentAdmin } from "@/lib/types";

interface AgentForm {
  name: string;
  phone: string;
  secretKey: string;
  active: boolean;
}

const BLANK_FORM: AgentForm = { name: "", phone: "", secretKey: "", active: true };

// A short random key the admin can hand the agent, e.g. over WhatsApp - editable
// afterwards if they'd rather set something memorable.
function generateSecretKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I - easy to misread
  let key = "";
  for (let i = 0; i < 6; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

export default function AdminDeliveryAgentManager() {
  const [agents, setAgents] = useState<DeliveryAgentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<AgentForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await getAdminDeliveryAgents();
      setAgents(data);
      setError(null);
    } catch {
      setError("Couldn't load delivery agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ ...BLANK_FORM, secretKey: generateSecretKey() });
    setFormError(null);
    setEditingId("new");
  }

  function openEdit(agent: DeliveryAgentAdmin) {
    setForm({ name: agent.name, phone: agent.phone, secretKey: agent.secretKey || "", active: agent.active });
    setFormError(null);
    setEditingId(agent.id);
  }

  function closeForm() {
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }
    if (form.secretKey.trim().length < 4) {
      setFormError("Secret key must be at least 4 characters.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: DeliveryAgentAdminPayload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      secretKey: form.secretKey.trim(),
      active: form.active,
    };
    try {
      if (editingId === "new") {
        await createDeliveryAgent(payload);
      } else if (editingId !== null) {
        await updateDeliveryAgent(editingId, payload);
      }
      closeForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Couldn't save this delivery agent.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(agent: DeliveryAgentAdmin) {
    if (!confirm(`Remove "${agent.name}" from the delivery roster?`)) return;
    try {
      await deactivateDeliveryAgent(agent.id);
      await load();
    } catch {
      alert("Couldn't update this delivery agent.");
    }
  }

  async function handleReactivate(agent: DeliveryAgentAdmin) {
    try {
      await updateDeliveryAgent(agent.id, {
        name: agent.name,
        phone: agent.phone,
        secretKey: agent.secretKey || generateSecretKey(),
        active: true,
      });
      await load();
    } catch {
      alert("Couldn't restore this delivery agent.");
    }
  }

  const isFormOpen = editingId !== null;

  return (
    <div className="px-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-ink-soft">{agents.length} delivery agents</span>
        <button
          onClick={openCreate}
          className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised"
        >
          + Add agent
        </button>
      </div>

      <p className="text-xs text-ink-soft mb-4">
        Agents don&apos;t log in - they look up their assigned, undelivered orders at <code>/agent</code> using their phone number and secret key.
      </p>

      {error && <p className="text-sm text-clay mb-3">{error}</p>}
      {loading && <p className="text-sm text-ink-soft">Loading delivery agents...</p>}

      {isFormOpen && (
        <div className="bg-paper-raised border border-line rounded-2xl p-5 mb-4 space-y-3">
          <p className="font-display text-lg font-semibold text-ink">
            {editingId === "new" ? "New delivery agent" : "Edit delivery agent"}
          </p>

          <label className="text-xs text-ink-soft block">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="text-xs text-ink-soft block">
            Phone number (10 digits - this is how they'll look up their orders)
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="e.g. 9876543210"
              inputMode="tel"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="text-xs text-ink-soft block">
            Secret key (they'll enter this along with their phone number - share it with them directly)
            <div className="mt-1 flex items-center gap-2">
              <input
                value={form.secretKey}
                onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                placeholder="e.g. 7K9QXF"
                className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, secretKey: generateSecretKey() })}
                className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-leaf-pale"
              >
                Generate
              </button>
            </div>
          </label>

          <label className="text-xs text-ink-soft flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Available for assignment
          </label>

          {formError && <p className="text-sm text-clay">{formError}</p>}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-ink text-paper-raised disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={closeForm} className="rounded-full px-4 py-1.5 text-xs font-semibold border border-line text-ink-soft">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-paper-raised border border-line rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">
                {agent.name}{" "}
                {!agent.active && (
                  <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold text-ink-soft align-middle">
                    Unavailable
                  </span>
                )}
              </p>
              <p className="text-sm text-ink-soft">{agent.phone}</p>
              <p className="text-xs text-ink-soft font-mono mt-0.5">
                Key: {agent.secretKey || <span className="text-clay">not set</span>}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openEdit(agent)}
                className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-ink-soft"
              >
                Edit
              </button>
              {agent.active ? (
                <button
                  onClick={() => handleDeactivate(agent)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-clay"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(agent)}
                  className="rounded-full px-3 py-1 text-xs font-semibold border border-line text-sprout-dark"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && agents.length === 0 && (
          <p className="text-sm text-ink-soft text-center py-10">No delivery agents yet.</p>
        )}
      </div>
    </div>
  );
}
