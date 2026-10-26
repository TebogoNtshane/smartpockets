import useFinanceData from "@/lib/useFinanceData";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import MonthInReview from "@/components/savings/MonthInReview";
import RoundupsPanel from "@/components/savings/RoundupsPanel";
import MilestoneAllocation from "@/components/savings/MilestoneAllocation";
import LowFrictionDeposits from "@/components/savings/LowFrictionDeposits";

export default function Savings() {
  const { loading, user, profile, goals, transactions, reload } = useFinanceData();

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Smart savings</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
          Three ways to grow money automatically — roundups, splits and small weekly deposits. Your feed is loaded
          with sample transactions so you can see it work.
        </p>
      </header>

      <MonthInReview user={user} signal={profile} />
      <RoundupsPanel profile={profile} goals={goals} transactions={transactions} reload={reload} />
      <MilestoneAllocation profile={profile} goals={goals} reload={reload} />
      <LowFrictionDeposits profile={profile} goals={goals} reload={reload} />
    </div>
  );
}