"use client"

import Link from "next/link"
import { FlaskConical, Droplets, Package, Palette, Blend } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const actions = [
  {
    title: "New Formula",
    description: "Create a custom formula from scratch",
    href: "/formulas",
    icon: FlaskConical,
  },
  {
    title: "Browse Oils",
    description: "Explore your fragrance oil catalog",
    href: "/fragrances",
    icon: Droplets,
  },
  {
    title: "Build Product",
    description: "Assemble a new product for Shopify",
    href: "/products",
    icon: Package,
  },
  {
    title: "Blending Lab",
    description: "Build custom fragrance blends",
    href: "/blending",
    icon: Palette,
  },
]

export function QuickActions() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-secondary/50 p-4 transition-colors hover:bg-secondary hover:border-primary/30"
            >
              <action.icon className="h-5 w-5 text-primary" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground group-hover:text-primary">
                  {action.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
