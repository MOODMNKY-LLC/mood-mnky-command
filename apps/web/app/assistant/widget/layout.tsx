/**
 * Minimal layout for embeddable MNKY Assistant widget.
 * No shell/nav — full viewport for iframe embed.
 */
export default function AssistantWidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh min-h-[400px] w-full bg-background text-foreground">
      {children}
    </div>
  )
}
