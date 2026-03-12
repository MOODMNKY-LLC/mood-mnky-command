import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppFactoryCustomersPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Customer directory with project rollups and status. Data from <code>public.customers</code>.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Customer list and create form will be implemented here. Schema is ready in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the Launch Wizard or Backoffice to manage customers once the UI is built.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
