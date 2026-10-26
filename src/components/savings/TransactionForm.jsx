import { useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryOptions, isoDate } from "@/lib/transactionOptions";

export default function TransactionForm({ onSaved, onCancel }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("groceries");
  const [date, setDate] = useState(isoDate());
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.entities.Transaction.create({
        description: description.trim(),
        amount: Number(amount || 0),
        category,
        transaction_date: date,
        is_recurring: false,
        recurrence: "none",
        roundup_amount: 0,
        roundup_applied: false,
      });
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tx-description">What did you spend on?</Label>
        <Input
          id="tx-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="e.g. Checkers basket"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">Amount (R)</Label>
          <Input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tx-date">Date</Label>
          <Input id="tx-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={saving || !description.trim() || !Number(amount)}>
          {saving ? "Saving…" : "Add purchase"}
        </Button>
      </div>
    </div>
  );
}