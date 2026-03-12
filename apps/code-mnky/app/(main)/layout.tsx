import "./main-site.css"
import "./main-glass.css"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function MainLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="main-site min-h-screen flex flex-col bg-background text-foreground">
        {children}
      </div>
    </TooltipProvider>
  )
}
