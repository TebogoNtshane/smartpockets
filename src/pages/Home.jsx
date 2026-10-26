import { useEffect, useState } from "react";
import { api } from "@/api/client";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import Panel from "@/components/blocks/Panel";
import ProgressBar from "@/components/blocks/ProgressBar";
import BalanceHero from "@/components/home/BalanceHero";
import CashflowBanner from "@/components/home/CashflowBanner";
import RecentTransactions from "@/components/home/RecentTransactions";
import useFinanceData from "@/lib/useFinanceData";
import { formatRand } from "@/lib/format";
import { Plus, X, Wallet, ArrowDown, ArrowUp, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { loading, user, profile, goals, transactions, reload } = useFinanceData();
  const [forecast, setForecast] = useState(null);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: "" });
  const [allocations, setAllocations] = useState({}); // {goalId: percent}

  useEffect(() => {
    if (!profile) return;
    let active = true;
    api.functions.invoke("cashflowForecast", {}).then((res) => {
      if (active) setForecast(res?.data?.forecast || null);
    }).catch(() => {});
    return () => { active = false; };
  }, [profile]);

  // Load allocation rules from goals
  useEffect(() => {
    if (!goals.length) return;
    const map = {};
    goals.forEach(g => {
      map[g.id] = Number(g.allocation_percentage ?? (100 / goals.length));
    });
    setAllocations(map);
  }, [goals]);

  if (loading) return <LoadingBlock />;
  const goalsTotal = goals.reduce((sum, g) => sum + Number(g.saved_amount || 0), 0);

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || goals.length === 0) return;
    setIsProcessing(true);
    try {
      const totalAlloc = Object.values(allocations).reduce((a,b) => a + Number(b||0), 0) || 100;
      for (const goal of goals) {
        const pct = Number(allocations[goal.id] || 0);
        const share = (pct / totalAlloc) * val;
        await api.entities.SavingsGoal.update(goal.id, {
          saved_amount: Number(goal.saved_amount || 0) + share,
        });
      }
      setShowDeposit(false); setAmount(""); await reload();
    } catch (e) { alert(e.message); } finally { setIsProcessing(false); }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || val > goalsTotal) { alert(`You have ${formatRand(goalsTotal)}`); return; }
    setIsProcessing(true);
    try {
      for (const goal of goals) {
        const share = Number(goal.saved_amount || 0) / goalsTotal;
        await api.entities.SavingsGoal.update(goal.id, {
          saved_amount: Math.max(0, Number(goal.saved_amount || 0) - val * share),
        });
      }
      setShowWithdraw(false); setAmount(""); await reload();
    } catch (e) { alert(e.message); } finally { setIsProcessing(false); }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) return;
    setIsProcessing(true);
    try {
      await api.entities.SavingsGoal.create({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        saved_amount: 0,
        colour: "emerald",
        priority: goals.length + 1,
        allocation_percentage: 0, // user will set in rules
        created_by_id: user.id,
      });
      setShowAddGoal(false); setNewGoal({ name: "", target_amount: "" }); await reload();
    } catch (e) { alert(e.message); } finally { setIsProcessing(false); }
  };

  const saveRules = async () => {
    setIsProcessing(true);
    try {
      for (const goal of goals) {
        await api.entities.SavingsGoal.update(goal.id, {
          allocation_percentage: Number(allocations[goal.id] || 0),
        });
      }
      setShowRules(false); await reload();
    } catch (e) { alert(e.message); } finally { setIsProcessing(false); }
  };

  const totalPct = Object.values(allocations).reduce((a,b) => a + Number(b||0), 0);

  return (
    <div className="space-y-4 pb-10">
      <BalanceHero name={user?.full_name} profile={profile} goalsTotal={goalsTotal} pocketTotal={0} />

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => { setAmount(""); setShowDeposit(true); }} className="h-[52px] rounded-[16px] bg-black text-white text-[14px] font-semibold flex items-center justify-center gap-2">
          <ArrowDown className="w-4 h-4" /> Deposit
        </button>
        <button onClick={() => { setAmount(""); setShowWithdraw(true); }} className="h-[52px] rounded-[16px] bg-white border border-black/10 text-black text-[14px] font-semibold flex items-center justify-center gap-2">
          <ArrowUp className="w-4 h-4" /> Withdraw
        </button>
      </div>

      <CashflowBanner forecast={forecast} />

      <Panel 
        title="Goal buckets" 
        caption={`Every deposit split by your rules • Total ${totalPct.toFixed(0)}%`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowRules(true)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Sliders className="w-4 h-4" /></button>
            <button onClick={() => setShowAddGoal(true)} className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
        }
      >
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="font-medium text-ink flex items-center gap-2">{goal.name} <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full">{Math.round(allocations[goal.id] || 0)}%</span></span>
                <span className="tnum text-ink/55">{formatRand(goal.saved_amount)} / {formatRand(goal.target_amount)}</span>
              </div>
              <ProgressBar className="mt-1.5" value={goal.saved_amount} target={goal.target_amount} tone={goal.colour} />
            </div>
          ))}
          {!goals.length && <p className="text-[12px] text-ink/50">No buckets yet.</p>}
        </div>
      </Panel>

      <Panel title="Recent spending"><RecentTransactions transactions={transactions} /></Panel>

      {showDeposit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold flex gap-2"><Wallet className="w-5 h-5"/>Deposit • Split by rules</h2><button onClick={() => setShowDeposit(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button></div>
            <p className="text-xs mb-2 text-ink/60">{goals.map(g => `${g.name} ${Math.round(allocations[g.id]||0)}%`).join(" • ")}</p>
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">R</span><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-8 h-14 text-xl font-bold rounded-xl" autoFocus /></div>
            <Button onClick={handleDeposit} disabled={isProcessing} className="w-full h-12 rounded-full bg-black mt-4">{isProcessing ? "..." : `Deposit R${amount||0}`}</Button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold">Withdraw from Wallet</h2><button onClick={() => setShowWithdraw(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button></div>
            <p className="text-xs mb-2">Available {formatRand(goalsTotal)}</p>
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">R</span><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-8 h-14 text-xl font-bold rounded-xl" autoFocus /></div>
            <Button onClick={handleWithdraw} disabled={isProcessing} variant="outline" className="w-full h-12 rounded-full border-black mt-4">{isProcessing ? "..." : `Withdraw R${amount||0}`}</Button>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold flex gap-2"><Sliders className="w-5 h-5"/> Edit split rules</h2><button onClick={() => setShowRules(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button></div>
            <p className="text-xs text-ink/60 mb-3">Set % for each bucket. Must total 100%. Example: Rent 50%, Taxi 30%, Savings 20%</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {goals.map(g => (
                <div key={g.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium w-1/2 truncate">{g.name}</span>
                  <div className="flex items-center gap-2 w-1/2">
                    <Input type="number" value={allocations[g.id]||0} onChange={e => setAllocations({...allocations, [g.id]: e.target.value})} className="h-10" />
                    <span className="text-sm">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={`text-sm mt-3 font-bold ${totalPct === 100 ? "text-green-600" : "text-red-500"}`}>Total: {totalPct}% {totalPct !== 100 && "(must be 100%)"}</div>
            <Button onClick={saveRules} disabled={isProcessing || totalPct !== 100} className="w-full h-12 rounded-full bg-black mt-4">Save rules</Button>
          </div>
        </div>
      )}

      {showAddGoal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold">New tailored bucket</h2><button onClick={() => setShowAddGoal(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button></div>
            <Input placeholder="e.g. Taxi, Rent" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="h-12 rounded-xl mb-3" />
            <div className="relative mb-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">R</span><Input type="number" placeholder="Target" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="pl-8 h-12 rounded-xl" /></div>
            <Button onClick={handleAddGoal} disabled={isProcessing} className="w-full h-12 rounded-full bg-black">{isProcessing ? "..." : "Create bucket"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}