"use client";

import type { Tool } from "ai";
import type { ComponentProps } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BotIcon } from "lucide-react";
import { memo } from "react";

export type AgentProps = ComponentProps<"div">;

export const Agent = memo(({ className, ...props }: AgentProps) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground", className)} {...props} />
));

Agent.displayName = "Agent";

export type AgentHeaderProps = ComponentProps<"div"> & {
  name: string;
  model?: string;
};

export const AgentHeader = memo(
  ({ className, name, model, ...props }: AgentHeaderProps) => (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b px-4 py-3",
        className
      )}
      {...props}
    >
      <BotIcon className="h-5 w-5 text-muted-foreground" />
      <span className="font-semibold">{name}</span>
      {model && (
        <Badge variant="secondary" className="font-mono text-xs">
          {model}
        </Badge>
      )}
    </div>
  )
);

AgentHeader.displayName = "AgentHeader";

export type AgentContentProps = ComponentProps<"div">;

export const AgentContent = memo(({ className, ...props }: AgentContentProps) => (
  <div className={cn("p-4", className)} {...props} />
));

AgentContent.displayName = "AgentContent";

export type AgentInstructionsProps = ComponentProps<"div"> & {
  children: string;
};

export const AgentInstructions = memo(
  ({ className, children, ...props }: AgentInstructionsProps) => (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-sm font-medium text-muted-foreground">Instructions</h4>
      <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
        {children}
      </div>
    </div>
  )
);

AgentInstructions.displayName = "AgentInstructions";

export type AgentToolsProps = ComponentProps<"div">;

export const AgentTools = memo(({ className, ...props }: AgentToolsProps) => (
  <div className={cn("space-y-2", className)} {...props} />
));

AgentTools.displayName = "AgentTools";

export type AgentToolProps = ComponentProps<"div"> & {
  tool: Tool;
};

function getToolSchema(tool: Tool): string | null {
  if ("jsonSchema" in tool && tool.jsonSchema) {
    return JSON.stringify(tool.jsonSchema, null, 2);
  }
  if ("parameters" in tool && tool.parameters) {
    return JSON.stringify(tool.parameters, null, 2);
  }
  if ("inputSchema" in tool && tool.inputSchema) {
    try {
      return JSON.stringify(tool.inputSchema, null, 2);
    } catch {
      return String(tool.inputSchema);
    }
  }
  return null;
}

export const AgentTool = memo(
  ({ className, tool, ...props }: AgentToolProps) => {
    const schema = getToolSchema(tool);
    const description = tool.description ?? "No description";

    return (
      <Accordion type="single" collapsible className={cn("w-full", className)} {...props}>
        <AccordionItem value="schema" className="border rounded-md px-3">
          <AccordionTrigger className="py-3 hover:no-underline">
            <span className="text-left font-medium">{description}</span>
          </AccordionTrigger>
          <AccordionContent>
            {schema ? (
              <pre className="overflow-x-auto rounded bg-muted/50 p-3 text-xs font-mono">
                {schema}
              </pre>
            ) : (
              <span className="text-muted-foreground text-sm">No schema</span>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
);

AgentTool.displayName = "AgentTool";

export type AgentOutputProps = ComponentProps<"div"> & {
  schema: string;
};

export const AgentOutput = memo(
  ({ className, schema, ...props }: AgentOutputProps) => (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-sm font-medium text-muted-foreground">Output Schema</h4>
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs font-mono">
        {schema}
      </pre>
    </div>
  )
);

AgentOutput.displayName = "AgentOutput";
