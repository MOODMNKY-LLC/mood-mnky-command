"use client"

import { Flame, TreeDeciduous } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WICK_OPTIONS, WAX_TYPES } from "@/lib/data"

export default function WicksPage() {
  const cottonWicks = WICK_OPTIONS.filter((w) => w.type === "cotton")
  const woodWicks = WICK_OPTIONS.filter((w) => w.type === "wood")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Wicks & Wax Reference
        </h1>
        <p className="text-sm text-muted-foreground">
          Wick sizing guide, wax type compatibility, and pairing recommendations
          for MOOD MNKY products
        </p>
      </div>

      {/* Wax Types */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Wax Types</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {WAX_TYPES.map((wax) => (
            <Card key={wax.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm text-foreground">
                    {wax.name}
                  </CardTitle>
                  <Badge
                    className="bg-primary/10 text-primary border-0 text-[10px]"
                  >
                    Max {wax.maxFragranceLoad}% FO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {wax.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Melt Point
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {wax.meltPoint}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Best For
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {wax.bestFor.map((use) => (
                      <Badge
                        key={use}
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Compatible Wicks
                  </span>
                  <div className="flex gap-1">
                    {wax.compatibleWicks.map((w) => (
                      <Badge
                        key={w}
                        className={`text-[10px] border-0 ${
                          w === "wood"
                            ? "bg-accent/10 text-accent"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {w === "wood" ? "Wood" : "Cotton"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Wick Guide */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Wick Sizing Guide
        </h2>
        <Tabs defaultValue="cotton">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="cotton"
              className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Flame className="mr-1.5 h-3 w-3" />
              Cotton Wicks ({cottonWicks.length})
            </TabsTrigger>
            <TabsTrigger
              value="wood"
              className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <TreeDeciduous className="mr-1.5 h-3 w-3" />
              Wood Wicks ({woodWicks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cotton">
            <WickTable wicks={cottonWicks} />
          </TabsContent>
          <TabsContent value="wood">
            <WickTable wicks={woodWicks} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Pairing Matrix */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Quick Pairing Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PairingCard
              title="Small Tins (4 oz)"
              wick="CD 8 or Booster 0.02 x 3.5"
              wax="464 Soy Wax or Coco-Soy Blend"
              notes="Cotton wicks give a cleaner burn in small vessels. Wood wicks work for a more premium feel but may require more testing."
            />
            <PairingCard
              title="Medium Tumblers (8 oz)"
              wick="CD 12 or Booster 0.03 x 4.0"
              wax="Coco-Soy Blend or 464 Soy Wax"
              notes="The sweet spot for both wick types. Wood wicks create a signature crackling experience. Test throw with both."
            />
            <PairingCard
              title="Large Tins (16 oz)"
              wick="CD 18 or Booster 0.04 x 5.0"
              wax="Coco-Soy Blend or Parasoy Blend"
              notes="Wide vessels need wider wicks. Consider double-wicking cotton for very wide containers. Wood wicks excel here for ambiance."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WickTable({
  wicks,
}: {
  wicks: typeof WICK_OPTIONS
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs text-muted-foreground">
              Name
            </TableHead>
            <TableHead className="text-xs text-muted-foreground">
              Series
            </TableHead>
            <TableHead className="text-xs text-muted-foreground">
              Diameter
            </TableHead>
            <TableHead className="text-xs text-muted-foreground">
              Compatible Waxes
            </TableHead>
            <TableHead className="text-xs text-muted-foreground">
              Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wicks.map((wick) => (
            <TableRow
              key={wick.id}
              className="border-border hover:bg-secondary/50"
            >
              <TableCell className="text-sm font-medium text-foreground">
                {wick.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {wick.series}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-mono text-foreground">
                {wick.recommendedDiameter}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {wick.compatibleWaxes.map((w) => (
                    <Badge
                      key={w}
                      variant="secondary"
                      className="text-[10px] bg-secondary text-muted-foreground"
                    >
                      {w}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs">
                {wick.notes}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PairingCard({
  title,
  wick,
  wax,
  notes,
}: {
  title: string
  wick: string
  wax: string
  notes: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-10 shrink-0 pt-0.5">
            Wick
          </span>
          <span className="text-xs text-foreground">{wick}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-10 shrink-0 pt-0.5">
            Wax
          </span>
          <span className="text-xs text-foreground">{wax}</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {notes}
      </p>
    </div>
  )
}
