"use client"

import React from "react"

import { useState } from "react"
import useSWR from "swr"
import {
  Users,
  Search,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StoreCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const apiUrl = searchQuery
    ? `/api/shopify/customers?query=${encodeURIComponent(searchQuery)}`
    : "/api/shopify/customers?limit=100"

  const { data, isLoading, error, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: countData } = useSWR("/api/shopify/customers?count=true", fetcher, {
    revalidateOnFocus: false,
  })

  const customers = data?.customers || []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            {countData?.count !== undefined
              ? `${countData.count} customers in your store`
              : "Manage your Shopify customers"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="bg-transparent">
          Search
        </Button>
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setSearchInput("")
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Customers Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">Failed to load customers.</div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Users className="h-8 w-8" />
              <p className="text-sm">
                {searchQuery ? "No matching customers" : "No customers found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(
                  (customer: {
                    id: number
                    first_name: string
                    last_name: string
                    email: string
                    phone: string | null
                    orders_count: number
                    total_spent: string
                    state: string
                    accepts_marketing: boolean
                    tags: string
                    default_address?: {
                      city: string
                      province: string
                      country: string
                    }
                    created_at: string
                  }) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">
                            {customer.first_name} {customer.last_name}
                          </span>
                          {customer.tags && (
                            <div className="flex gap-1">
                              {customer.tags
                                .split(",")
                                .slice(0, 2)
                                .map((tag) => (
                                  <Badge
                                    key={tag.trim()}
                                    variant="secondary"
                                    className="text-[9px]"
                                  >
                                    {tag.trim()}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{customer.email}</span>
                      </TableCell>
                      <TableCell>
                        {customer.default_address ? (
                          <span className="text-xs text-muted-foreground">
                            {[
                              customer.default_address.city,
                              customer.default_address.province,
                              customer.default_address.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-mono text-foreground">
                          {customer.orders_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-mono font-medium text-foreground">
                          ${customer.total_spent}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={`text-[10px] border-0 ${
                              customer.state === "enabled"
                                ? "bg-success/10 text-success"
                                : customer.state === "invited"
                                  ? "bg-info/10 text-info"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {customer.state}
                          </Badge>
                          {customer.accepts_marketing && (
                            <Badge
                              variant="secondary"
                              className="text-[9px]"
                            >
                              Marketing
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                          <a
                            href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/customers/${customer.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
