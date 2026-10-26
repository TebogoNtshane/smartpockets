import { useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cadenceOptions, POCKET_EMOJIS } from "@/lib/transactionOptions";
import { isoDate } from "@/lib/format";
import { makeJoinCode } from "@/lib/starterData";

// DISPLAY as Stokvel, CODE stays Pocket
const LABEL = "Stokvel";

const BLANK = {
  name: "",
  purpose: "",
  emoji: "🤝",
  cadence: "monthly",
  contribution_amount: "",
  target_amount: "",
  payout_date: "",
  joining_fee: "50",
  late_fee_amount: "20",
  late_fee_type: "R",
};

export default function CreatePocketDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const create = async () => {
    setSaving(true);
    try {
      const pocket = await api.entities.Pocket.create({
        name: form.name.trim(),
        purpose: form.purpose.trim(),
        emoji: form.emoji,
        cadence: form.cadence,
        contribution_amount: Number(form.contribution_amount || 0),
        target_amount: Number(form.target_amount || 0),
        payout_date: form.payout_date || undefined,
        joining_fee: Number(form.joining_fee || 50),
        late_fee_amount: Number(form.late_fee_amount || 20),
        late_fee_type: form.late_fee_type || "R",
        join_code: makeJoinCode(form.name),
        status: "active",
      });
      await api.entities.PocketMember.create({
        pocket_id: pocket.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        role: "admin",
        is_sample: false,
        on_time_payments: 0,
        missed_payments: 0,
        joined_date: isoDate(),
        next_due_at: new Date(Date.now()+7*24*3600*1000).toISOString(),
      });
      setForm(BLANK);
      onOpenChange(false);
      await onCreated(pocket);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[20px]">
        <DialogHeader>
          <DialogTitle>Start a {LABEL.toLowerCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pocket-name">What is it for?</Label>
            <Input id="pocket-name" value={form.name} onChange={(event) => set({ name: event.target.value })} placeholder="e.g. Ubuntu Grocery Club" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pocket-purpose">A short note for members</Label>
            <Input id="pocket-purpose" value={form.purpose} onChange={(event) => set({ purpose: event.target.value })} placeholder="December groceries and school shoes" />
          </div>

          <div className="space-y-1.5">
            <Label>Pick an icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {POCKET_EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => set({ emoji })} className={`grid h-9 w-9 place-items-center rounded-2xl border text-base transition ${form.emoji === emoji ? "border-ink bg-ink/5" : "border-line bg-white"}`}>{emoji}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>How often do members pay in?</Label>
            <Select value={form.cadence} onValueChange={(value) => set({ cadence: value })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{cadenceOptions().map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Each contribution (R)</Label><Input type="number" inputMode="decimal" value={form.contribution_amount} onChange={(event) => set({ contribution_amount: event.target.value })} placeholder="150" /></div>
            <div className="space-y-1.5"><Label>Group target (R)</Label><Input type="number" inputMode="decimal" value={form.target_amount} onChange={(event) => set({ target_amount: event.target.value })} placeholder="12000" /></div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="joining-fee">Joining fee (R) - taken from wallet</Label>
              <Input id="joining-fee" type="number" value={form.joining_fee} onChange={(event) => set({ joining_fee: event.target.value })} placeholder="50" />
              <p className="text-[10px] text-ink/50">New members pay this from their wallet to join</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="late-fee">Late fee - group decides</Label>
              <div className="flex gap-1.5">
                <Input id="late-fee" type="number" className="flex-1" value={form.late_fee_amount} onChange={(event) => set({ late_fee_amount: event.target.value })} placeholder="20" />
                <Select value={form.late_fee_type} onValueChange={(v)=>set({late_fee_type:v})}>
                  <SelectTrigger className="w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="R">R</SelectItem><SelectItem value="%">%</SelectItem></SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-ink/50">Charged if contribution is late</p>
            </div>
          </div>

          <div className="space-y-1.5"><Label htmlFor="pocket-date">Payout date</Label><Input id="pocket-date" type="date" value={form.payout_date} onChange={(event) => set({ payout_date: event.target.value })} /></div>

          <Button className="w-full rounded-2xl h-11" onClick={create} disabled={saving || !form.name.trim()}>{saving ? "Creating…" : `Create ${LABEL.toLowerCase()}`}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}