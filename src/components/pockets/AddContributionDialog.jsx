import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isoDate, formatRand } from "@/lib/format";
import useFinanceData from "@/lib/useFinanceData";

export default function AddContributionDialog({ open, onOpenChange, pocket, membership, onSaved }) {
  const [amount, setAmount] = useState(String(pocket?.contribution_amount || ""));
  const [date, setDate] = useState(isoDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { goals, reload } = useFinanceData();
  const totalWallet = goals.reduce((s,g)=> s + Number(g.saved_amount||0), 0);

  // Check if late
  const isLateByDueDate = () => {
    if (!membership?.next_due_at) return false;
    return new Date() > new Date(membership.next_due_at);
  };
  const late = isLateByDueDate();
  const baseAmount = Number(amount || pocket?.contribution_amount || 0);
  const lateFee = late ? (pocket.late_fee_type === "%" ? baseAmount * Number(pocket.late_fee_amount||0)/100 : Number(pocket.late_fee_amount||0)) : 0;
  const totalToPay = baseAmount + lateFee;

  useEffect(()=>{ if(open) setAmount(String(pocket?.contribution_amount || "")); }, [open, pocket]);

  const save = async () => {
    setBusy(true); setError("");
    try {
      if (totalWallet < totalToPay) {
        setError(`Not enough in wallet. Need ${formatRand(totalToPay)} (incl ${formatRand(lateFee)} late fee). You have ${formatRand(totalWallet)}`);
        return;
      }
      // Deduct from wallet (SavingsGoal = wallet)
      for (const goal of goals) {
        const share = totalWallet>0 ? Number(goal.saved_amount||0)/totalWallet : 0;
        await api.entities.SavingsGoal.update(goal.id, { saved_amount: Math.max(0, Number(goal.saved_amount||0) - totalToPay * share) });
      }
      // Contribution
      await api.entities.Contribution.create({
        pocket_id: pocket.id,
        user_email: membership.user_email,
        user_name: membership.user_name || "You",
        amount: baseAmount,
        contribution_date: date,
        status: late ? "late" : "on_time",
        type: "contribution",
        is_late: late,
      });
      // Late fee as separate record if any
      if (late && lateFee > 0) {
        await api.entities.Contribution.create({
          pocket_id: pocket.id,
          user_email: membership.user_email,
          user_name: membership.user_name || "You",
          amount: lateFee,
          contribution_date: date,
          status: "late",
          type: "late_fee",
          is_late: true,
        });
      }
      // Update membership counters and next due
      const nextDue = new Date(Date.now() + 7*24*3600*1000).toISOString();
      if (pocket.cadence === "monthly") nextDue = new Date(new Date().setMonth(new Date().getMonth()+1)).toISOString();
      if (pocket.cadence === "weekly") nextDue = new Date(Date.now()+7*24*3600*1000).toISOString();
      
      await api.entities.PocketMember.update(membership.id, {
        on_time_payments: Number(membership.on_time_payments || 0) + (late ? 0 : 1),
        missed_payments: Number(membership.missed_payments || 0) + (late ? 1 : 0),
        next_due_at: nextDue,
      });

      await reload();
      onOpenChange(false);
      await onSaved();
    } catch(e){ setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px]">
        <DialogHeader><DialogTitle>Deposit to stokvel</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-canvas p-3 rounded-xl text-[11px]">
            <p>Wallet balance: <span className="font-bold">{formatRand(totalWallet)}</span></p>
            <p>Group contribution: {formatRand(baseAmount)}</p>
            {late && <p className="text-red-600 font-bold">Late! Group late fee: {pocket.late_fee_type==="%" ? `${pocket.late_fee_amount}% = ${formatRand(lateFee)}` : formatRand(lateFee)}</p>}
            {late && <p className="font-bold">Total deducted from wallet: {formatRand(totalToPay)}</p>}
            <p className="text-[10px] text-ink/50 mt-1">Help: 082 123 4567</p>
          </div>

          <div className="space-y-1.5"><Label>Amount (R)</Label><Input type="number" inputMode="decimal" value={amount} onChange={(e)=>setAmount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} /></div>

          {error && <p className="text-[12px] font-medium text-red-600 bg-red-50 p-2 rounded-xl">{error}</p>}

          <Button className="w-full rounded-2xl h-11" onClick={save} disabled={busy || !Number(amount)}>{busy ? "Depositing…" : late ? `Deposit ${formatRand(totalToPay)} (incl late fee)` : `Deposit ${formatRand(totalToPay)} from wallet`}</Button>
          <p className="text-[10px] text-center text-ink/40">Money moves from your personal wallet (SavingsGoal) → group balance</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}