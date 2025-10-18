import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Search, Plus, Star } from "lucide-react";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "Retail" | "Wholesale" | "VIP" | "Member";
  loyaltyPoints: number;
  totalSpent: string;
  lastVisit: string;
}

export function CustomerTable() {
  const [search, setSearch] = useState("");

  // todo: remove mock functionality
  const customers: Customer[] = [
    { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0123", type: "VIP", loyaltyPoints: 2450, totalSpent: "$12,450", lastVisit: "2 days ago" },
    { id: "2", name: "Mike Chen", email: "mike.c@email.com", phone: "+1-555-0124", type: "Member", loyaltyPoints: 850, totalSpent: "$4,280", lastVisit: "5 days ago" },
    { id: "3", name: "Emily Davis", email: "emily.d@email.com", phone: "+1-555-0125", type: "Wholesale", loyaltyPoints: 1200, totalSpent: "$8,900", lastVisit: "1 week ago" },
    { id: "4", name: "James Wilson", email: "james.w@email.com", phone: "+1-555-0126", type: "Retail", loyaltyPoints: 120, totalSpent: "$680", lastVisit: "Today" },
  ];

  const getTypeColor = (type: Customer["type"]) => {
    switch (type) {
      case "VIP": return "default";
      case "Member": return "secondary";
      case "Wholesale": return "outline";
      case "Retail": return "outline";
    }
  };

  return (
    <div className="space-y-4" data-testid="customers-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-customers"
          />
        </div>
        <Button data-testid="button-add-customer">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Loyalty Points</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const initials = customer.name.split(" ").map(n => n[0]).join("");
              return (
                <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{customer.email}</div>
                      <div className="text-muted-foreground">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(customer.type)}>
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="font-mono font-medium">{customer.loyaltyPoints}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">{customer.totalSpent}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{customer.lastVisit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-edit-${customer.id}`}
                        onClick={() => console.log("Edit", customer.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-${customer.id}`}
                        onClick={() => console.log("Delete", customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
