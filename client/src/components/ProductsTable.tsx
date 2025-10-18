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
import { Edit, Trash2, Search, Plus } from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: string;
  status: "active" | "inactive";
}

interface ProductsTableProps {
  products?: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [search, setSearch] = useState("");

  // todo: remove mock functionality
  const defaultProducts: Product[] = [
    { id: "1", name: "Wireless Mouse", sku: "WM-001", category: "Electronics", stock: 45, price: "$29.99", status: "active" },
    { id: "2", name: "USB-C Cable 2m", sku: "UC-002", category: "Accessories", stock: 120, price: "$12.99", status: "active" },
    { id: "3", name: "Mechanical Keyboard", sku: "MK-003", category: "Electronics", stock: 8, price: "$89.99", status: "active" },
    { id: "4", name: "Desk Lamp LED", sku: "DL-004", category: "Furniture", stock: 0, price: "$34.99", status: "inactive" },
    { id: "5", name: "Notebook A5", sku: "NB-005", category: "Stationery", stock: 200, price: "$4.99", status: "active" },
  ];

  const productList = products || defaultProducts;

  return (
    <div className="space-y-4" data-testid="products-table">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>
        <Button data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => (
              <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <Badge
                    variant={product.stock === 0 ? "destructive" : product.stock < 20 ? "outline" : "secondary"}
                    className={product.stock < 20 && product.stock > 0 ? "bg-warning/10 text-warning border-warning/20" : ""}
                  >
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">{product.price}</TableCell>
                <TableCell>
                  <Badge variant={product.status === "active" ? "default" : "secondary"}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-edit-${product.id}`}
                      onClick={() => console.log("Edit", product.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-${product.id}`}
                      onClick={() => console.log("Delete", product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
