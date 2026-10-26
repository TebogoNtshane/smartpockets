import { useEffect, useRef, useState } from "react"
import { X, Sparkles } from "lucide-react"
import { askInvestorAI } from "@/api/client"

const LANGS = [
  { id: "en", l: "EN" }, { id: "zu", l: "ZU" }, { id: "xh", l: "XH" },
  { id: "af", l: "AF" }, { id: "nso", l: "SEP" }, { id: "st", l: "ST" },
  { id: "tn", l: "TN" }, { id: "ts", l: "TS" }, { id: "ve", l: "VE" },
  { id: "ss", l: "SS" }, { id: "nr", l: "ND" },
]

export default function AIInvestorChat({ result }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [lang, setLang] = useState("en")
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Thobela! Sawubona! Dumela! Avuxeni! I'm your AI Investor - I speak all 11 languages. Ask me ANYTHING: what is fsp, tfsa, credit, loans, ETFs, love, jokes. Sharp?" }
  ])
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, open])

  const send = async (text = input) => {
    if (!text.trim() || loading) return
    const userText = text.trim()
    setMessages(m => [...m, { role: "user", text: userText }])
    setInput("")
    setLoading(true)
    try {
      const answer = await askInvestorAI(
        userText,
        messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
        lang,
        result
      )
      setMessages(m => [...m, { role: "assistant", text: answer }])
    } catch (e) {
      console.log("FULL ERROR:", e)
      setMessages(m => [...m, { role: "assistant", text: `REAL ERROR: ${e.message}. Open F12 Console for full log.` }])
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-6 right-4 z-[70] flex items-center gap-2.5 rounded-full bg-black px-5 py-3.5 text-white shadow-xl">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4FF57] text-black"><Sparkles className="h-4 w-4" /></span>
        <span className="text-[13px] font-semibold">AI Investor • 11 Langs</span>
      </button>

      {open && (
        <div className="fixed bottom-[84px] right-4 left-4 md:left-auto md:w-[400px] z-[70] flex h-[560px] flex-col rounded-[28px] border bg-white shadow-2xl overflow-hidden">
          <div className="bg-black px-4 py-3">
            <div className="flex justify-between items-center">
              <p className="text-[13px] font-bold text-white">AI Investor - Answers Everything</p>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 p-1.5 text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1">
              {LANGS.map(x=>(
                <button key={x.id} onClick={()=>setLang(x.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-black ${lang===x.id?"bg-white text-black":"bg-white/20 text-white/70"}`}>{x.l}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#F6F3EE] p-4 space-y-3">
            {messages.map((m,i)=>(
              <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[84%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[13px] ${m.role==="user"?"bg-black text-white":"bg-white border text-black"}`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="text-[11px] animate-pulse">Thinking...</div>}
            <div ref={bottomRef}/>
          </div>
          <div className="flex gap-2 border-t bg-white p-3">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything: fsp, tfsa, joke in Sepedi..." className="flex-1 rounded-full bg-[#F6F3EE] px-4 py-2.5 text-[13px] outline-none" />
            <button onClick={()=>send()} className="h-10 w-10 rounded-full bg-black text-white">↑</button>
          </div>
        </div>
      )}
    </>
  )
}