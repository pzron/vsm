import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

interface InvoiceItem {
  id: string;
  product: string;
  qty: number;
  price: number;
}

export function InvoiceForm() {
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", product: "Wireless Mouse", qty: 2, price: 29.99 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(10);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), product: "", qty: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <Card data-testid="card-invoice-form">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">New Invoice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select>
              <SelectTrigger id="customer" data-testid="select-customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="c1">Sarah Johnson</SelectItem>
                <SelectItem value="c2">Mike Chen</SelectItem>
                <SelectItem value="c3">Emily Davis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salesperson">Salesperson</Label>
            <Select>
              <SelectTrigger id="salesperson" data-testid="select-salesperson">
                <SelectValue placeholder="Select salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="s1">John Doe</SelectItem>
                <SelectItem value="s2">Jane Smith</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button size="sm" variant="outline" onClick={addItem} data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="flex gap-2 items-end" data-testid={`invoice-item-${index}`}>
              <div className="flex-1">
                <Input placeholder="Product name" data-testid={`input-product-${index}`} />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="Qty"
                  defaultValue={item.qty}
                  data-testid={`input-qty-${index}`}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="Price"
                  defaultValue={item.price}
                  data-testid={`input-price-${index}`}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                data-testid={`button-remove-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                data-testid="input-discount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                data-testid="input-tax"
              />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-mono text-destructive">-${discountAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-mono">+${taxAmount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total</span>
            <span className="font-mono font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" data-testid="button-save-invoice">
            Save Invoice
          </Button>
          <Button variant="outline" data-testid="button-print-invoice">
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
