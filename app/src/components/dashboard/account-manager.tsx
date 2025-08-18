"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountUpdate } from "@/lib/contract/types";
import { hexFrom } from "@ckb-ccc/core";
import { Plus, Trash2, Upload, Download } from "lucide-react";
import { CSVLink } from "react-csv";

interface AccountManagerProps {
  accounts: AccountUpdate[];
  onAccountsChange: (accounts: AccountUpdate[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function AccountManager({
  accounts,
  onAccountsChange,
  onSubmit,
  isSubmitting,
}: AccountManagerProps) {
  const [newAccount, setNewAccount] = useState({
    address: "",
    oldPoint: "",
    newPoint: "",
  });

  const addAccount = () => {
    if (!newAccount.address || !newAccount.oldPoint || !newAccount.newPoint) {
      return;
    }

    const account: AccountUpdate = {
      address: hexFrom(
        newAccount.address.startsWith("0x")
          ? newAccount.address
          : `0x${newAccount.address}`,
      ),
      oldPoint: parseInt(newAccount.oldPoint),
      newPoint: parseInt(newAccount.newPoint),
    };

    onAccountsChange([...accounts, account]);
    setNewAccount({ address: "", oldPoint: "", newPoint: "" });
  };

  const removeAccount = (index: number) => {
    const newAccounts = accounts.filter((_, i) => i !== index);
    onAccountsChange(newAccounts);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const csvAccounts: AccountUpdate[] = [];

      // Skip header row if it exists
      const startIndex = lines[0]?.includes("address") ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const [address, oldPoint, newPoint] = lines[i]
          .split(",")
          .map((s) => s.trim());
        if (address && oldPoint && newPoint) {
          csvAccounts.push({
            address: hexFrom(
              address.startsWith("0x") ? address : `0x${address}`,
            ),
            oldPoint: parseInt(oldPoint),
            newPoint: parseInt(newPoint),
          });
        }
      }

      onAccountsChange([...accounts, ...csvAccounts]);
    };
    reader.readAsText(file);
  };

  const csvData = accounts.map((account) => ({
    address: account.address,
    oldPoint: account.oldPoint,
    newPoint: account.newPoint,
  }));

  const csvHeaders = [
    { label: "Address", key: "address" },
    { label: "Old Point", key: "oldPoint" },
    { label: "New Point", key: "newPoint" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Point Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Account */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Address (0x...)"
            value={newAccount.address}
            onChange={(e) =>
              setNewAccount({ ...newAccount, address: e.target.value })
            }
            className="md:col-span-2"
          />
          <Input
            type="number"
            placeholder="Old Point"
            value={newAccount.oldPoint}
            onChange={(e) =>
              setNewAccount({ ...newAccount, oldPoint: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="New Point"
            value={newAccount.newPoint}
            onChange={(e) =>
              setNewAccount({ ...newAccount, newPoint: e.target.value })
            }
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={addAccount} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>

          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-upload")?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>

            {accounts.length > 0 && (
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename="merkle-points.csv"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </CSVLink>
            )}
          </div>
        </div>

        {/* Accounts Table */}
        {accounts.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Old Point</TableHead>
                  <TableHead>New Point</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">
                      {account.address.slice(0, 10)}...
                      {account.address.slice(-8)}
                    </TableCell>
                    <TableCell>{account.oldPoint}</TableCell>
                    <TableCell>{account.newPoint}</TableCell>
                    <TableCell>
                      <span
                        className={
                          account.newPoint > account.oldPoint
                            ? "text-green-600"
                            : account.newPoint < account.oldPoint
                              ? "text-red-600"
                              : "text-gray-600"
                        }
                      >
                        {account.newPoint > account.oldPoint ? "+" : ""}
                        {account.newPoint - account.oldPoint}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAccount(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} to
                update
              </p>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting || accounts.length === 0}
                className="flex items-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Submit to Chain"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
