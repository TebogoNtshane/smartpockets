import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { ensureStarterData } from "@/lib/starterData";

export default function useFinanceData() {
  const [state, setState] = useState({
    loading: true,
    user: null,
    profile: null,
    goals: [],
    transactions: [],
  });

  const load = useCallback(async () => {
    try {
      const user = await api.auth.me();
      const profile = await ensureStarterData(user);
      const [goalsPage, transactionsPage] = await Promise.all([
        api.entities.SavingsGoal.filter({ created_by_id: user.id }, { sort: "priority", limit: 20 }),
        api.entities.Transaction.filter({ created_by_id: user.id }, { sort: "-transaction_date", limit: 40 }),
      ]);
      setState({
        loading: false,
        user,
        profile,
        goals: goalsPage?.items || [],
        transactions: transactionsPage?.items || [],
      });
    } catch (error) {
      if (error?.status === 401) {
        api.auth.redirectToLogin(window.location.href);
        return;
      }
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}