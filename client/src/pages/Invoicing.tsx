import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function Invoicing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground">Create and manage invoices</p>
        </div>
        <Button variant="outline" data-testid="button-view-invoices">
          <FileText className="h-4 w-4 mr-2" />
          View All Invoices
        </Button>
      </div>

      <div className="max-w-4xl">
        <InvoiceForm />
      </div>
    </div>
  );
}
