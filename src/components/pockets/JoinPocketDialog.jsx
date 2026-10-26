import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isoDate, formatRand } from "@/lib/format";
import useFinanceData from "@/lib/useFinanceData";

const LABEL = "Stokvel";

export default function JoinPocketDialog({ open, onOpenChange, user, onJoined }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { goals, reload } = useFinanceData();
  const totalWallet = goals.reduce((s,g)=> s + Number(g.saved_amount||0), 0);

  const lookup = async () => {
    setError(""); setPreview(null);
    const found = await api.entities.Pocket.filter({ join_code: code.trim().toUpperCase() });
    const list = found?.items || found;
    if (!list?.length) {
      setError("No stokvel matches that code. Check with the person who invited you.");
      return;
    }
    setPreview(list[0]);
  };

  const join = async () => {
    if (!preview) { await lookup(); return; }
    setBusy(true);
    setError("");
    try {
      const pocket = preview;
      const existing = await api.entities.PocketMember.filter({ pocket_id: pocket.id, user_email: user.email });
      if (existing.length) {
        setError("You are already in this stokvel.");
        return;
      }
      const joiningFee = Number(pocket.joining_fee || 50);
      if (totalWallet < joiningFee) {
        setError(`You need ${formatRand(joiningFee)} joining fee in wallet. You have ${formatRand(totalWallet)}. Add to wallet first.`);
        return;
      }
      // Deduct from wallet
      for (const goal of goals) {
        const share = totalWallet > 0 ? Number(goal.saved_amount||0)/totalWallet : 0;
        await api.entities.SavingsGoal.update(goal.id, {
          saved_amount: Math.max(0, Number(goal.saved_amount||0) - joiningFee * share)
        });
      }
      await api.entities.PocketMember.create({
        pocket_id: pocket.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        role: "member",
        is_sample: false,
        on_time_payments: 0,
        missed_payments: 0,
        joined_date: isoDate(),
        next_due_at: new Date(Date.now()+7*24*3600*1000).toISOString(),
      });
      // Record fee
      await api.entities.Contribution.create({
        pocket_id: pocket.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        amount: joiningFee,
        contribution_date: isoDate(),
        type: "join_fee",
        is_late: false,
      });
      setCode(""); setPreview(null);
      onOpenChange(false);
      await reload();
      await onJoined(pocket);
      navigate(`/pockets/${pocket.id}`);
    } catch(e){ setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px]">
        <DialogHeader><DialogTitle>Join a {LABEL.toLowerCase()}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-[12px] leading-relaxed text-ink/55">Ask the organiser for the code — it looks like UBNT. Joining fee will be taken from your wallet.</p>
          <div className="space-y-1.5">
            <Label htmlFor="join-code">Code</Label>
            <div className="flex gap-2">
              <Input id="join-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="FAM500" className="uppercase tracking-[0.2em] flex-1" />
              <Button variant="outline" onClick={lookup} className="rounded-full">Check</Button>
            </div>
          </div>

          {preview && (
            <div className="bg-canvas p-3 rounded-2xl text-[12px] space-y-1">
              <p className="font-bold text-sm">{preview.emoji} {preview.name}</p>
              <p>Joining fee: <span className="font-bold">{formatRand(preview.joining_fee||50)}</span> (from wallet)</p>
              <p>Weekly: {formatRand(preview.contribution_amount||150)} • Late fee: {preview.late_fee_type==="%" ? `${preview.late_fee_amount}%` : formatRand(preview.late_fee_amount||20)}</p>
              <p className="text-[10px] text-ink/50">Your wallet: {formatRand(totalWallet)}</p>
            </div>
          )}

          {error && <p className="text-[12px] font-medium text-red-600 bg-red-50 p-2 rounded-xl">{error}</p>}
          <Button className="w-full rounded-2xl h-11" onClick={join} disabled={busy || !code.trim()}>{busy ? "Joining…" : preview ? `Pay ${formatRand(preview.joining_fee||50)} & Join` : "Join"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}