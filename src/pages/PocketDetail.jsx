import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Copy, Wallet, Share2, MessageCircle, X, Phone, AlertTriangle, Clock } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import ProgressBar from "@/components/blocks/ProgressBar";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import MemberRow from "@/components/pockets/MemberRow";
import ContributionRow from "@/components/pockets/ContributionRow";
import PocketChat from "@/components/pockets/PocketChat";
import PayoutSchedule from "@/components/pockets/PayoutSchedule"; // NEW 1
import { Button } from "@/components/ui/button";
import { formatRand, isoDate, shortDate } from "@/lib/format";
import { trustScore } from "@/components/blocks/TrustBadge";
import { cadenceLabel } from "@/lib/transactionOptions";
import useFinanceData from "@/lib/useFinanceData";
import { requestPush, notify } from "@/lib/usePush"; // NEW 2
import { downloadReceipt } from "@/lib/receipt"; // NEW 3

const LABEL = "Stokvel";
const SUPPORT_NUMBER = "0800 123 4567";
const SUPPORT_EMAIL = "help@mystokvel.co.za";

export default function PocketDetail() {
  const { pocketId } = useParams();
  const wantsChat = new URLSearchParams(window.location.search).get("chat") === "1";
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pocket, setPocket] = useState(null);
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(wantsChat);
  const [isChatFull, setIsChatFull] = useState(false);

  const { goals, reload } = useFinanceData();
  const [directGoals, setDirectGoals] = useState([]);

  useEffect(()=>{ requestPush(); }, []); // NEW - ask for push permission once

  useEffect(()=>{
    async function getWallet(){
      try{
        const res = await api.entities.SavingsGoal.filter({ user_email: user?.email });
        setDirectGoals(res.items || res || []);
      }catch{}
    }
    if(user?.email) getWallet();
  }, [user, goals]);

  const allGoals = directGoals.length > 0 ? directGoals : goals;
  const totalWallet = allGoals.reduce((s,g) => s + Number(g.saved_amount||0), 0);
  
  const reloadAll = async () => {
    try{ await reload(); }catch{}
    try{
      const res = await api.entities.SavingsGoal.filter({ user_email: user?.email });
      setDirectGoals(res.items || res || []);
    }catch{}
  };

  const load = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      const [pocketRecord, memberList, contributionList] = await Promise.all([
        api.entities.Pocket.get(pocketId),
        api.entities.PocketMember.filter({ pocket_id: pocketId }),
        api.entities.Contribution.filter({ pocket_id: pocketId }, { sort: "-contribution_date", limit: 60 }),
      ]);
      setPocket(pocketRecord);
      setMembers(memberList || []);
      setContributions(contributionList?.items || contributionList || []);
    } finally {
      setLoading(false);
    }
  }, [pocketId]);

  useEffect(() => { load(); }, [load]);

  // NEW - push if late
  useEffect(()=>{
    if(members.length && pocket && user){
      const mine = members.find(m=>m.user_email===user?.email);
      if(mine?.next_due_at && new Date(mine.next_due_at) < new Date()){
        notify(`Late payment: ${pocket.name}`, `You are late! Pay now to avoid ${pocket.late_fee_amount} fee`);
      }
    }
  }, [members, pocket, user]);

  if (loading) return <LoadingBlock label={`Opening the ${LABEL.toLowerCase()}`} />;
  if (!pocket) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink/60">That {LABEL.toLowerCase()} could not be found.</p>
        <Link to="/pockets" className="text-sm font-semibold text-protea">Back to {LABEL.toLowerCase()}s</Link>
      </div>
    );
  }

  const total = contributions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const mine = members.find((member) => member.user_email === user?.email);
  const myContributions = contributions.filter((row) => row.user_email === user?.email);
  const myTotal = myContributions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const averageTrust = members.length ? Math.round(members.reduce((sum, member) => sum + trustScore(member), 0) / members.length) : 100;

  const contributionAmount = Number(pocket.contribution_amount || pocket.weekly_amount || 150);
  const joiningFee = Number(pocket.joining_fee || 50);
  const lateFeeAmount = Number(pocket.late_fee_amount || 20);
  const lateFeeType = pocket.late_fee_type || "R";
  const lateFeeDisplay = lateFeeType === "%" ? `${lateFeeAmount}%` : formatRand(lateFeeAmount);

  const handleJoinWithFee = async () => {
    if (totalWallet < joiningFee) {
      alert("You need " + formatRand(joiningFee) + " joining fee. You have " + formatRand(totalWallet));
      return;
    }
    setIsProcessing(true);
    try {
      let remaining = joiningFee;
      for (const goal of allGoals) {
        if(remaining<=0) break;
        const have = Number(goal.saved_amount||0);
        if(have<=0) continue;
        const take = Math.min(have, remaining);
        await api.entities.SavingsGoal.update(goal.id, { saved_amount: have - take });
        remaining -= take;
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
      await api.entities.Contribution.create({
        pocket_id: pocket.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        amount: joiningFee,
        contribution_date: isoDate(),
        type: "join_fee",
        is_late: false,
      });
      await reloadAll(); await load();
      notify("Joined!", `${formatRand(joiningFee)} paid from wallet.`);
    } catch(e){ alert(e.message); } finally { setIsProcessing(false); }
  };

  const handleDepositFromWallet = async () => {
    const now = new Date();
    const nextDue = mine?.next_due_at ? new Date(mine.next_due_at) : now;
    const isLate = mine && nextDue < now;
    let lateFee = 0;
    if (isLate) {
      lateFee = lateFeeType === "%" ? contributionAmount * (lateFeeAmount/100) : lateFeeAmount;
    }
    const totalToPay = contributionAmount + lateFee;
    if (totalWallet < totalToPay) {
      alert("Late! Need " + formatRand(totalToPay) + " incl fee. Have " + formatRand(totalWallet));
      return;
    }
    setIsProcessing(true);
    try {
      let remaining = totalToPay;
      for (const goal of allGoals) {
        if(remaining<=0) break;
        const have = Number(goal.saved_amount||0);
        if(have<=0) continue;
        const take = Math.min(have, remaining);
        await api.entities.SavingsGoal.update(goal.id, { saved_amount: have - take });
        remaining -= take;
      }
      await api.entities.Contribution.create({
        pocket_id: pocket.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        amount: contributionAmount,
        contribution_date: isoDate(),
        type: "contribution",
        is_late: isLate,
      });
      if (lateFee > 0) {
        await api.entities.Contribution.create({
          pocket_id: pocket.id,
          user_email: user.email,
          user_name: user.full_name || "You",
          amount: lateFee,
          contribution_date: isoDate(),
          type: "late_fee",
          is_late: true,
        });
      }
      if (mine) {
        await api.entities.PocketMember.update(mine.id, {
          on_time_payments: isLate ? mine.on_time_payments : (mine.on_time_payments||0)+1,
          missed_payments: isLate ? (mine.missed_payments||0)+1 : mine.missed_payments,
          next_due_at: new Date(now.getTime()+7*24*3600*1000).toISOString(),
        });
      }
      await reloadAll(); await load();
      notify("Deposited!", `${formatRand(contributionAmount)} deposited!`);
    } catch(e){ alert("Error: " + e.message); } finally { setIsProcessing(false); }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pocket.join_code || "");
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch { setCopied(false); }
  };

  return (
    <div className="space-y-4 pb-20">
      <Link to="/pockets" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/50">
        <ArrowLeft className="h-3.5 w-3.5" /> All {LABEL.toLowerCase()}s
      </Link>

      <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-2.5 flex items-center justify-between">
        <div className="flex gap-2 items-center"><Phone className="w-3.5 h-3.5"/><div><p className="text-[10px] font-bold uppercase tracking-widest">Support & Complaints</p><p className="text-[11px]">{SUPPORT_NUMBER} • {SUPPORT_EMAIL}</p></div></div>
        <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g,'')}`} className="text-[10px] bg-black text-white px-3 py-1.5 rounded-full">Call</a>
      </div>

      <section className="rounded-[28px] border border-line/70 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-canvas text-2xl">{pocket.emoji || "🤝"}</span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-ink">{pocket.name}</h1>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink/55">{pocket.purpose}</p>
            <div className="mt-2 flex gap-2 text-[10px]">
              <span className="px-2 py-1 bg-gray-100 rounded-full flex items-center gap-1"><Wallet className="w-3 h-3"/> Join {formatRand(joiningFee)}</span>
              <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Late {lateFeeDisplay}</span>
              <span className="px-2 py-1 bg-gray-100 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> {formatRand(contributionAmount)}/week</span>
            </div>
          </div>
        </div>
        <p className="tnum mt-5 font-display text-[32px] font-bold leading-none tracking-tight text-ink">{formatRand(total)}</p>
        <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-ink/40">Group balance (from wallet deposits)</p>
        <div className="mt-4">
          <ProgressBar value={total} target={pocket.target_amount} />
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink/50">
            <span className="tnum">Target {formatRand(pocket.target_amount)}</span>
            <span className="tnum">You put in {formatRand(myTotal)} of {formatRand(contributionAmount)} weekly</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
          <div className="rounded-2xl bg-canvas px-2 py-2.5"><p className="tnum font-display text-[15px] font-semibold text-ink">{members.length}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink/40">Members</p></div>
          <div className="rounded-2xl bg-canvas px-2 py-2.5"><p className="tnum font-display text-[15px] font-semibold text-protea">{averageTrust}%</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink/40">Trust</p></div>
          <div className="rounded-2xl bg-canvas px-2 py-2.5"><p className="font-display text-[13px] font-semibold text-ink">{cadenceLabel(pocket.cadence)}</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink/40">Rhythm</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3">
          <div><p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Invite code</p><p className="font-display text-[15px] font-bold tracking-[0.2em] text-ink">{pocket.join_code}</p></div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={copyCode}>{copied ? <Share2 className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</Button>
        </div>
        {pocket.payout_date && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink/50"><CalendarClock className="h-3.5 w-3.5" /> Payout around {shortDate(pocket.payout_date)}</p>}
      </section>

      {!mine ? (
        <Button className="w-full h-12 rounded-2xl" onClick={handleJoinWithFee} disabled={isProcessing}>
          {isProcessing ? "Processing..." : `Join - Pay ${formatRand(joiningFee)} from wallet (Wallet: ${formatRand(totalWallet)})`}
        </Button>
      ) : (
        <Button className="w-full h-12 rounded-2xl" onClick={handleDepositFromWallet} disabled={isProcessing}>
          <Wallet className="mr-2 h-4 w-4" /> {isProcessing ? "Processing..." : `Deposit ${formatRand(contributionAmount)} from wallet (Wallet: ${formatRand(totalWallet)})`}
        </Button>
      )}
           

      {/* ADD THIS BUTTON FOR TESTING PUSH */}
      <Button variant="outline" size="sm" className="rounded-full w-full mt-2" onClick={async () => {
        const ok = await requestPush();
        if(ok) notify("Test OK", "Push notifications are working!");
        else alert("Please Allow notifications in your browser settings");
      }}>
        🔔 Enable / Test Notifications
      </Button>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowChatDrawer(true)}>
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Group Discussion
        </Button>
      </div>

      <Panel title="Who is in" caption="On-time vs late. Late fees go to group pot.">
        <div className="divide-y divide-line/60">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} contributed={contributions.filter((row) => row.user_email === member.user_email).reduce((sum, row) => sum + Number(row.amount || 0), 0)} />
          ))}
        </div>
      </Panel>

      <Panel title="Group contributions" caption="Auto-recorded from wallet deposits. Click PDF for receipt.">
        <div className="divide-y divide-line/60">
          {contributions.slice(0, 30).map((contribution) => (
            <div key={contribution.id} className="flex justify-between items-center">
              <div className="flex-1">
                <ContributionRow contribution={contribution} isMine={contribution.user_email === user?.email} />
              </div>
              <button onClick={()=>downloadReceipt(contribution, pocket)} className="text-[10px] font-bold underline px-2">PDF</button>
            </div>
          ))}
        </div>
      </Panel>

      {/* NEW PANEL - Payout Schedule */}
      <Panel title="Payout Schedule" caption="Who gets paid when - monthly rotation">
        <PayoutSchedule members={members} pocket={pocket} contributions={contributions} />
      </Panel>

      {showChatDrawer && (
        <div className={`fixed bg-white border-l shadow-2xl z-50 flex flex-col transition-all duration-300 ${isChatFull ? "inset-0" : "top-0 right-0 w-[380px] max-w-[85vw] h-full"}`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-sm">Group Discussion - {pocket.name}</h3>
            <div className="flex gap-2 items-center">
              <button onClick={() => setIsChatFull(!isChatFull)} className="text-[11px] underline font-medium">{isChatFull ? "Shrink to side" : "Open full"}</button>
              <button onClick={() => setShowChatDrawer(false)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><X className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <PocketChat pocket={pocket} user={user} />
          </div>
          <div className="p-3 border-t bg-amber-50 text-[10px] flex gap-2 items-center"><Phone className="w-3 h-3"/> Need help? {SUPPORT_NUMBER}</div>
        </div>
      )}
    </div>
  );
}