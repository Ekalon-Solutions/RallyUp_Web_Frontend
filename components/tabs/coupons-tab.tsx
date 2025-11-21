import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCoupons();
      if (response.success && response.data) {
        setCoupons(response.data);
      } else {
        toast.error("Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("An error occurred while fetching coupons");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manage Coupons</h2>
        <Button onClick={() => toast("Add Coupon functionality coming soon!")}>Add Coupon</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell>{coupon.code}</TableCell>
              <TableCell>{coupon.discount}</TableCell>
              <TableCell>{coupon.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => toast("Edit functionality coming soon!")}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => toast("Delete functionality coming soon!")}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}