import { useCallback, useEffect, useState, useMemo } from "react";
import { api } from "@/api/client";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import LessonCard from "@/components/learn/LessonCard";
import ProgressBar from "@/components/blocks/ProgressBar";
import { isoDate } from "@/lib/format";
import { Search, Flame, Trophy, BookOpen, Wallet, CreditCard, PiggyBank, TrendingUp, Users, Banknote } from "lucide-react";

const CATEGORY_LABELS = {
  budgeting: { label: "Budgeting", icon: Wallet, color: "bg-[#D4FF57]" },
  debt: { label: "Debt", icon: Banknote, color: "bg-[#FF6B6B]" },
  saving: { label: "Saving", icon: PiggyBank, color: "bg-[#4ECDC4]" },
  investing: { label: "Investing", icon: TrendingUp, color: "bg-black text-white" },
  stokvels: { label: "Stokvels", icon: Users, color: "bg-[#FFE66D]" },
  credit: { label: "Credit score", icon: CreditCard, color: "bg-[#A8E6CF]" },
  loans: { label: "Loans", icon: Banknote, color: "bg-[#FF8E53]" },
};

export default function Learn() {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [read, setRead] = useState([]);
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const me = await api.auth.me();
      const [lessonPage, progress] = await Promise.all([
        api.entities.Lesson.filter({}, { sort: "order", limit: 40 }),
        api.entities.LessonProgress.filter({ created_by_id: me.id }),
      ]);
      setLessons(lessonPage?.items || []);
      setRead(progress || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isRead = (lessonId) => read.some((row) => row.lesson_id === lessonId);

  const toggleRead = async (lesson, shouldBeRead) => {
    const existing = read.find((row) => row.lesson_id === lesson.id);
    if (shouldBeRead && !existing) {
      await api.entities.LessonProgress.create({ lesson_id: lesson.id, lesson_title: lesson.title, completed_date: isoDate() });
    }
    if (!shouldBeRead && existing) {
      await api.entities.LessonProgress.delete(existing.id);
    }
    await load();
  };

  const filtered = useMemo(() => {
    let list = category === "all" ? lessons : lessons.filter(l => l.category === category);
    if (query) list = list.filter(l => l.title.toLowerCase().includes(query.toLowerCase()) || l.summary.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [lessons, category, query]);

  if (loading) return <LoadingBlock label="Loading your money school" rows={3} />;

  const readCount = lessons.filter((lesson) => isRead(lesson.id)).length;
  const pct = lessons.length ? Math.round((readCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-5 pb-20">
      {/* HERO */}
      <header className="rounded-[32px] bg-black px-6 py-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">Money school<br/>made for Mzansi 🇿🇦</h1>
            <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-white/60">No jargon. No judgement. Lessons from Shoprite to stokvels, in 5 min. Thobela, Sawubona!</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4FF57] text-black"><BookOpen className="h-5 w-5" /></div>
        </div>
        
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2.5"><div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Flame className="h-3 w-3" /> Streak</div><p className="mt-1 text-[16px] font-bold">{readCount} days</p></div>
          <div className="rounded-2xl bg-white/10 px-3 py-2.5"><div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Trophy className="h-3 w-3" /> XP</div><p className="mt-1 text-[16px] font-bold">{readCount * 10}</p></div>
          <div className="rounded-2xl bg-[#D4FF57] px-3 py-2.5 text-black"><div className="text-[10px] uppercase opacity-60">Progress</div><p className="mt-1 text-[16px] font-bold">{pct}%</p></div>
        </div>

        <div className="mt-4"><ProgressBar className="!bg-white/20" value={readCount} target={lessons.length || 1} /></div>
      </header>

      {/* SEARCH + FILTERS */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search: FSP, TFSA, stokvel, credit..." className="w-full rounded-full border border-line/70 bg-white py-3 pl-11 pr-4 text-[13px] outline-none placeholder:text-ink/30 focus:border-black" />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <button onClick={() => setCategory("all")} className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-bold transition ${category==="all" ? "border-black bg-black text-white" : "border-line bg-white text-ink/60"}`}>Everything • {lessons.length}</button>
          {Object.entries(CATEGORY_LABELS).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} onClick={() => setCategory(key)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition ${category===key ? "border-black bg-black text-white" : "border-line bg-white text-ink/60"}`}>
                <Icon className="h-3.5 w-3.5" /> {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* LESSONS */}
      <div className="space-y-3">
        {filtered.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            expanded={openId === lesson.id}
            read={isRead(lesson.id)}
            onToggle={() => setOpenId(openId === lesson.id ? null : lesson.id)}
            onMarkRead={toggleRead}
          />
        ))}
        {!filtered.length && <div className="rounded-[24px] border border-dashed border-line bg-white px-6 py-10 text-center"><p className="text-[13px] font-semibold text-ink">No lessons here yet</p><p className="mt-1 text-[12px] text-ink/50">Try another category or search FSP, TFSA, stokvel</p></div>}
      </div>
    </div>
  );
}