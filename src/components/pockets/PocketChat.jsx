import { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PocketChat({ pocket, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      let res;
      if (api.entities.PocketMessage) {
        res = await api.entities.PocketMessage.filter({ pocket_id: pocket.id });
      } else if (api.entities.ChatMessage) {
        res = await api.entities.ChatMessage.filter({ pocket_id: pocket.id });
      } else {
        res = { items: [] };
      }
      const list = res?.items || res || [];
      setMessages(list.sort((a,b)=> new Date(a.created_at||a.created_date||0) - new Date(b.created_at||b.created_date||0)));
    } catch(e){}
  };

  useEffect(()=>{ load(); const i=setInterval(load, 4000); return ()=>clearInterval(i); }, [pocket.id]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const send = async () => {
    if(!text.trim()) return;
    const msg = text.trim();
    setText("");
    const payload = {
      pocket_id: pocket.id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      message: msg,
      text: msg,
      content: msg,
      created_at: new Date().toISOString(),
    };
    if (api.entities.PocketMessage) await api.entities.PocketMessage.create(payload);
    else if (api.entities.ChatMessage) await api.entities.ChatMessage.create(payload);
    await load();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length===0 && <p className="text-[11px] text-center text-ink/40 mt-20">No messages yet. Start! 👋</p>}
        {messages.map(m=>(
          <div key={m.id} className={`max-w-[80%] rounded-[18px] px-3 py-2 text-[13px] ${m.user_email===user.email ? "bg-black text-white ml-auto" : "bg-white shadow-sm"}`}>
            <p className="text-[10px] opacity-60">{m.user_name}</p>
            <p>{m.message || m.text || m.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t bg-white flex gap-2">
        <Input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter" && send()} placeholder="Type..." className="rounded-full flex-1" />
        <Button onClick={send} className="rounded-full px-5">Send</Button>
      </div>
    </div>
  );
}