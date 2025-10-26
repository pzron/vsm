import { InvoiceForm } from "@/components/InvoiceForm";

export default function Invoicing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground">Create and manage invoices</p>
        </div>
        {/* Removed View All Invoices button as per request */}
      </div>

      <div className="max-w-4xl">
        <InvoiceForm />
      </div>
    </div>
  );
}
