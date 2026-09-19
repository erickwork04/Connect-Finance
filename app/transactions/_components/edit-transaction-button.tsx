"use client";

import { Button } from "@/app/_components/ui/button";
import UpsertTransactionDialog from "@/app/_components/upsert-transaction-dialog";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { toTransactionFormValues, type TransactionRow } from "../_lib/transaction-row";

interface EditTransactionButtonProps {
  transaction: TransactionRow;
}

const EditTransactionButton = ({ transaction }: EditTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
      >
        <PencilIcon />
      </Button>
      <UpsertTransactionDialog
        IsOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        defaultValues={toTransactionFormValues(transaction)}
        transactionId={transaction.id}
      />
    </>
  );
};

export default EditTransactionButton;
