import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TransactionForm from "@/components/savings/TransactionForm";

export default function LogTransactionDialog({ onSaved }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add purchase
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a purchase</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onCancel={() => setOpen(false)}
            onSaved={async () => {
              setOpen(false);
              await onSaved();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
