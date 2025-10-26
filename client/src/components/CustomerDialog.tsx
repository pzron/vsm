import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Customer } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { ChevronDown, ChevronUp } from "lucide-react";

export function CustomerDialog({ trigger, customer }: { trigger: React.ReactNode; customer?: Customer | null }) {
  const isEdit = !!customer;
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLFormElement | null>(null);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    type: "Retail",
    address: "",
    preferredPayment: "Cash",
    birthday: "",
    anniversary: "",
    specialDay: "",
    userId: "",
  });
  const { data: staff = [] } = useQuery<User[]>({ queryKey: ["/api/staff"] });

  useEffect(() => {
    if (customer && open) {
      setForm({
        username: (customer as any).username || "",
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        type: customer.type || "Retail",
        address: (customer as any).address || "",
        preferredPayment: (customer as any).preferredPayment || "Cash",
        birthday: customer.birthday ? new Date(customer.birthday as any).toISOString().slice(0,10) : "",
        anniversary: customer.anniversary ? new Date(customer.anniversary as any).toISOString().slice(0,10) : "",
        specialDay: customer.specialDay ? new Date(customer.specialDay as any).toISOString().slice(0,10) : "",
        userId: (customer as any).userId || "",
      });
    }
    if (!customer && open) {
      setForm({ username: "", name: "", email: "", phone: "", type: "Retail", address: "", preferredPayment: "Cash", birthday: "", anniversary: "", specialDay: "", userId: "" });
    }
  }, [customer, open]);

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { ...form } as any;
      // sanitize optional fields: empty string -> undefined
      if (!payload.username) delete payload.username;
      if (!payload.email) delete payload.email;
      if (!payload.address) delete payload.address;
      if (!payload.preferredPayment) delete payload.preferredPayment;
      if (!payload.userId) delete payload.userId;
      // convert date inputs (yyyy-mm-dd) to Date or remove if blank
      if (payload.birthday) payload.birthday = new Date(payload.birthday);
      else delete payload.birthday;
      if (payload.anniversary) payload.anniversary = new Date(payload.anniversary);
      else delete payload.anniversary;
      if (payload.specialDay) payload.specialDay = new Date(payload.specialDay);
      else delete payload.specialDay;
      if (isEdit && customer) {
        await apiRequest("PATCH", `/api/customers/${customer.id}`, payload);
      } else {
        await apiRequest("POST", "/api/customers", payload);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setOpen(false);
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutateAsync();
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.toLowerCase().includes("username") && msg.toLowerCase().includes("taken")) {
        alert("Username already taken. Please choose another.");
      } else {
        alert("Failed to save customer. Please check inputs.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end mb-2 gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })} aria-label="Scroll to bottom">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <form className="space-y-3 max-h-[70vh] overflow-auto pr-2" onSubmit={onSubmit} ref={scrollRef}>
          <div className="space-y-1">
            <Label>Username (unique, optional)</Label>
            <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="Set a handle like 'mike-chen'" />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Dealer">Dealer</SelectItem>
                <SelectItem value="Depo">Depo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Preferred Payment</Label>
              <Select value={form.preferredPayment} onValueChange={(v) => setForm(f => ({ ...f, preferredPayment: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Linked User</Label>
              <Select value={form.userId || 'none'} onValueChange={(v) => setForm(f => ({ ...f, userId: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staff.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.fullName} (@{u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Birthday</Label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm(f => ({ ...f, birthday: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Anniversary</Label>
              <Input type="date" value={form.anniversary} onChange={(e) => setForm(f => ({ ...f, anniversary: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Special Day</Label>
              <Input type="date" value={form.specialDay} onChange={(e) => setForm(f => ({ ...f, specialDay: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>User ID (optional)</Label>
            <Input
              placeholder="Paste an existing staff user ID"
              value={form.userId}
              onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
