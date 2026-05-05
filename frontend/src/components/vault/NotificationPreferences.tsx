"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Plus,
  Trash2,
  Bell,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useEnhancedToast } from "@/hooks/useEnhancedToast";

interface NotificationPreference {
  id: string;
  channel: "email" | "sms";
  address: string;
  recipient_type: "owner" | "heir";
  is_verified: boolean;
  heir_wallet_address?: string | null;
}

interface NotificationPreferencesProps {
  vaultAddress: string;
  vaultId?: string;
}

export default function NotificationPreferences({
  vaultAddress,
}: NotificationPreferencesProps) {
  const { success, error: showError } = useEnhancedToast();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChannel, setNewChannel] = useState<"email" | "sms">("email");
  const [newAddress, setNewAddress] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [vaultAddress]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/notifications/preferences/${vaultAddress}`
      );
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.data || []);
      }
    } catch (err) {
      console.error("[Notifications] Error loading preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) {
      showError("Please enter an email or phone number");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vault_address: vaultAddress,
          channel: newChannel,
          address: newAddress.trim(),
          recipient_type: "owner",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add notification");
      }

      success("Notification preference added!");
      setNewAddress("");
      setShowAddForm(false);
      await loadPreferences();
    } catch (err: any) {
      showError(err.message || "Error adding notification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this notification preference?")) return;

    try {
      const res = await fetch(`/api/v1/notifications/preferences/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      success("Notification preference removed");
      await loadPreferences();
    } catch (err: any) {
      showError(err.message || "Error removing notification");
    }
  };

  const handleTest = async (pref: NotificationPreference) => {
    setTestingId(pref.id);
    try {
      const res = await fetch("/api/v1/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vault_address: vaultAddress,
          channel: pref.channel,
          address: pref.address,
          template: "heartbeat_received",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to send test");
      }

      success("Test notification sent!", `Check your ${pref.channel}`);
    } catch (err: any) {
      showError(err.message || "Error sending test notification");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              Notifications
            </h3>
            <p className="text-xs text-text-tertiary">
              Alert settings for this vault
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-12 bg-bg-elevated rounded-lg animate-pulse" />
          <div className="h-12 bg-bg-elevated rounded-lg animate-pulse" />
        </div>
      ) : preferences.length === 0 && !showAddForm ? (
        <div className="text-center py-6">
          <Bell className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-1">
            No notifications configured
          </p>
          <p className="text-xs text-text-tertiary">
            Add email or SMS alerts to stay informed about your vault
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {preferences.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-border-subtle"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                  {pref.channel === "email" ? (
                    <Mail className="w-3.5 h-3.5 text-accent-primary" />
                  ) : (
                    <Phone className="w-3.5 h-3.5 text-accent-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {pref.address}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="default" className="text-[10px]">
                      {pref.channel === "email" ? "Email" : "SMS"}
                    </Badge>
                    {pref.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleTest(pref)}
                  disabled={testingId === pref.id}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
                  title="Send test notification"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(pref.id)}
                  className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="mt-4 p-4 rounded-xl bg-bg-elevated border border-border-subtle space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setNewChannel("email")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                newChannel === "email"
                  ? "bg-accent-primary text-black"
                  : "bg-bg-base text-text-secondary border border-border-subtle hover:border-border-focus"
              }`}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1" />
              Email
            </button>
            <button
              onClick={() => setNewChannel("sms")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                newChannel === "sms"
                  ? "bg-accent-primary text-black"
                  : "bg-bg-base text-text-secondary border border-border-subtle hover:border-border-focus"
              }`}
            >
              <Phone className="w-3.5 h-3.5 inline mr-1" />
              SMS
            </button>
          </div>

          <Input
            type={newChannel === "email" ? "email" : "tel"}
            placeholder={
              newChannel === "email"
                ? "your@email.com"
                : "+1 234 567 890"
            }
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            icon={
              newChannel === "email" ? (
                <Mail className="w-4 h-4" />
              ) : (
                <Phone className="w-4 h-4" />
              )
            }
          />

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowAddForm(false);
                setNewAddress("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAdd}
              isLoading={saving}
              disabled={!newAddress.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
