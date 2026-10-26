import { useState } from "react";
import { Globe, Check } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "af", label: "Afrikaans", native: "Afrikaans" },
  { code: "zu", label: "isiZulu", native: "isiZulu" },
  { code: "xh", label: "isiXhosa", native: "isiXhosa" },
  { code: "nso", label: "Sepedi", native: "Sepedi" },
  { code: "st", label: "Sesotho", native: "Sesotho" },
  { code: "tn", label: "Setswana", native: "Setswana" },
  { code: "ts", label: "Xitsonga", native: "Xitsonga" },
  { code: "ve", label: "Tshivenda", native: "Tshivenda" },
  { code: "ss", label: "siSwati", native: "siSwati" },
  { code: "nr", label: "isiNdebele", native: "isiNdebele" },
];

export default function Settings() {
  const [lang, setLang] = useState(() => localStorage.getItem("smartpockets:lang") || "en");
  const [saved, setSaved] = useState(false);
  const handleChange = (code) => {
    setLang(code);
    localStorage.setItem("smartpockets:lang", code);
    setSaved(true);
    setTimeout(() => { setSaved(false); window.location.reload(); }, 800);
  };
  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app preferences</p>
      </div>
      <div className="border rounded-xl p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5" /></div>
          <div><p className="font-semibold">Language</p><p className="text-xs text-muted-foreground">AI Investor speaks your language</p></div>
        </div>
        <select value={lang} onChange={(e) => handleChange(e.target.value)} className="w-full h-12 border rounded-lg px-3 bg-background focus:ring-2 focus:ring-primary outline-none">
          {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label} ({l.native})</option>))}
        </select>
        {saved && <p className="mt-3 text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Saved! Reloading...</p>}
        <div className="mt-4 text-xs text-muted-foreground p-3 bg-muted rounded-lg">Current: <b>{LANGUAGES.find(l => l.code === lang)?.label}</b></div>
      </div>
    </div>
  );
}