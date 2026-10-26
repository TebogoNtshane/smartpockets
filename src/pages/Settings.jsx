import { useState } from "react";
import { api } from "@/api/client";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "zu", label: "isiZulu" },
  { code: "xh", label: "isiXhosa" },
  { code: "nso", label: "Sepedi" },
  { code: "st", label: "Sesotho" },
  { code: "tn", label: "Setswana" },
  { code: "ts", label: "Xitsonga" },
  { code: "ve", label: "Tshivenda" },
  { code: "ss", label: "siSwati" },
  { code: "nr", label: "isiNdebele" },
];

export default function Settings() {
  const [lang, setLang] = useState(() => localStorage.getItem("smartpockets:lang") || "en");

  const handleChange = async (code) => {
    setLang(code);
    localStorage.setItem("smartpockets:lang", code);
    // update user in local DB
    try {
      const me = await api.auth.me();
      const users = JSON.parse(localStorage.getItem("smartpockets:users") || "[]");
      const updated = users.map(u => u.id === me.id ? { ...u, preferred_language: code } : u);
      localStorage.setItem("smartpockets:users", JSON.stringify(updated));
      localStorage.setItem("smartpockets:entity:users", JSON.stringify(updated));
    } catch {}
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Change your language anytime</p>
      
      <div className="border rounded-xl p-4">
        <label className="font-medium flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4"/> Preferred Language
        </label>
        <select 
          value={lang} 
          onChange={e=>handleChange(e.target.value)} 
          className="w-full h-12 border rounded-md px-3 bg-background"
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label} - {l.code}</option>)}
        </select>
        <p className="text-xs text-muted-foreground mt-2">Current: {LANGUAGES.find(l=>l.code===lang)?.label}</p>
      </div>
    </div>
  );
}