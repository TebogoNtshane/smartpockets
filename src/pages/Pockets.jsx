import { useCallback, useEffect, useState } from "react";
import { Plus, Users, Phone } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import EmptyState from "@/components/blocks/EmptyState";
import PocketCard from "@/components/pockets/PocketCard";
import CreatePocketDialog from "@/components/pockets/CreatePocketDialog";
import JoinPocketDialog from "@/components/pockets/JoinPocketDialog";
import { Button } from "@/components/ui/button";
import useFinanceData from "@/lib/useFinanceData";
import { formatRand } from "@/lib/format";

// DISPLAY ONLY - code stays as Pocket
const LABEL = "Stokvel";
const LABELS = "Stokvels";
const SUPPORT_NUMBER = "0800 123 4567";
const SUPPORT_EMAIL = "help@mystokvel.co.za";

export default function Pockets() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pockets, setPockets] = useState([]);
  const [stats, setStats] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const { goals } = useFinanceData();
  const totalWallet = goals.reduce((s,g) => s + Number(g.saved_amount||0), 0);

  const load = useCallback(async () => {
    try {
      const me = await api.auth.me();
      setUser(me);
      const memberships = await api.entities.PocketMember.filter({ user_email: me.email });
      const ids = memberships.map((row) => row.pocket_id).filter(Boolean);
      if (!ids.length) {
        setPockets([]);
        setStats({});
        return;
      }

      const [pocketPage, totals, memberCounts, myTotals, messageCounts] = await Promise.all([
        api.entities.Pocket.filter({ id: { $in: ids } }, { sort: "-created_date", limit: 30 }),
        api.entities.Contribution.aggregate({ query: {}, groupBy: "pocket_id", sum: ["amount"] }),
        api.entities.PocketMember.aggregate({ query: {}, groupBy: "pocket_id" }),
        api.entities.Contribution.aggregate({ query: { user_email: me.email }, groupBy: "pocket_id", sum: ["amount"] }),
        api.entities.PocketMessage.aggregate({ query: {}, groupBy: "pocket_id" }),
      ]);

      const map = {};
      ids.forEach((id) => {
        map[id] = { total: 0, members: 0, mine: 0, messages: 0 };
      });
      (totals?.rows || []).forEach((row) => {
        if (map[row.pocket_id]) map[row.pocket_id].total = Number(row.sum_amount || 0);
      });
      (memberCounts?.rows || []).forEach((row) => {
        if (map[row.pocket_id]) map[row.pocket_id].members = Number(row.count || 0);
      });
      (myTotals?.rows || []).forEach((row) => {
        if (map[row.pocket_id]) map[row.pocket_id].mine = Number(row.sum_amount || 0);
      });
      (messageCounts?.rows || []).forEach((row) => {
        if (map[row.pocket_id]) map[row.pocket_id].messages = Number(row.count || 0);
      });

      setPockets(pocketPage?.items || []);
      setStats(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingBlock label={`Counting the group ${LABEL.toLowerCase()} pot`} />;

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Community {LABELS.toLowerCase()}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
          Digital {LABELS.toLowerCase()} with the people you trust. Everyone sees the pot, the contributions and who pays on time.
        </p>
      </header>

      {/* 5. Complaint / Help Number */}
      <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-3 flex items-center justify-between">
        <div className="flex gap-2.5 items-center">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-white" /></div>
          <div>
            <p className="text-[11px] font-bold tracking-wide">{LABELS} Support & Complaints</p>
            <p className="text-[12px] font-medium">{SUPPORT_NUMBER} • {SUPPORT_EMAIL}</p>
            <p className="text-[10px] text-ink/50">Wallet: {formatRand(totalWallet)}</p>
          </div>
        </div>
        <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g,'')}`} className="text-[11px] bg-black text-white px-3.5 py-2 rounded-full font-medium">Call</a>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Button onClick={() => setCreateOpen(true)} className="h-11 rounded-2xl">
          <Plus className="mr-1.5 h-4 w-4" /> Start a {LABEL.toLowerCase()}
        </Button>
        <Button variant="outline" onClick={() => setJoinOpen(true)} className="h-11 rounded-2xl">
          <Users className="mr-1.5 h-4 w-4" /> Join with a code
        </Button>
      </div>

      {pockets.length ? (
        <Panel title={`Your ${LABELS.toLowerCase()}`} caption="Total balance, members and how far the group is from its target. Fees set by group.">
          <div className="space-y-3">
            {pockets.map((pocket) => (
              <PocketCard
                key={pocket.id}
                pocket={pocket}
                total={stats[pocket.id]?.total || 0}
                memberCount={stats[pocket.id]?.members || 0}
                myShare={stats[pocket.id]?.mine || 0}
                messageCount={stats[pocket.id]?.messages || 0}
                displayLabel={LABEL}
              />
            ))}
          </div>
        </Panel>
      ) : (
        <EmptyState
          title={`No ${LABELS.toLowerCase()} yet`}
          body={`Start one for the family, or join an existing ${LABEL.toLowerCase()} with the code the organiser shares with you. Joining fee will be taken from your wallet.`}
          action={
            <Button variant="outline" className="rounded-full" onClick={() => setJoinOpen(true)}>
              Join with a code
            </Button>
          }
        />
      )}

      {/* Dialogs now include fee logic - see files below */}
      <CreatePocketDialog open={createOpen} onOpenChange={setCreateOpen} user={user} onCreated={load} displayLabel={LABEL} />
      <JoinPocketDialog open={joinOpen} onOpenChange={setJoinOpen} user={user} onJoined={load} goals={goals} totalWallet={totalWallet} displayLabel={LABEL} />
    </div>
  );
}