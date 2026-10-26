import { formatRand, shortDate } from "@/lib/format";
export default function PayoutSchedule({ members, pocket, contributions }){
  const total = contributions.reduce((s,r)=>s+Number(r.amount||0),0);
  const payout = members.length ? total / members.length : 0;
  const start = pocket.payout_date ? new Date(pocket.payout_date) : new Date();
  const sorted = [...members].sort((a,b)=> new Date(a.joined_date||0) - new Date(b.joined_date||0));
  return (
    <div className="space-y-2">
      {sorted.map((m,i)=>{
        const d = new Date(start); d.setDate(d.getDate() + i*30);
        return (
          <div key={m.id} className="flex justify-between p-3 bg-gray-50 rounded-xl text-[12px] border">
            <div><p className="font-bold">{i+1}. {m.user_name}</p><p className="text-[10px] text-gray-500">{shortDate(m.joined_date)}</p></div>
            <div className="text-right"><p className="font-bold">{formatRand(payout)}</p><p className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full mt-1 inline-block">{shortDate(d.toISOString())}</p></div>
          </div>
        )
      })}
    </div>
  )
}