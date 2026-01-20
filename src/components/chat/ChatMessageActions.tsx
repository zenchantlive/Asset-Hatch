"use client";

import type { ReactNode } from "react";
import { Copy, MoreHorizontal, Pencil, Quote, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatMessageActionsProps {
  textContent: string;
  role: "user" | "assistant";
  onQuote?: (text: string) => void;
  onEdit?: (text: string) => void;
  onRegenerate?: () => void;
  className?: string;
}

interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

const copyToClipboard = async (text: string) => {
  if (!text.trim()) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('❌ Copy failed:', error);
  }
};

export function ChatMessageActions({
  textContent,
  role,
  onQuote,
  onEdit,
  onRegenerate,
  className,
}: ChatMessageActionsProps) {
  const canQuote = Boolean(onQuote) && textContent.trim().length > 0;
  const canEdit = role === "user" && Boolean(onEdit) && textContent.trim().length > 0;
  const canRegenerate = role === "assistant" && Boolean(onRegenerate);

  const actions: ActionItem[] = [
    {
      id: "copy",
      label: "Copy",
      icon: <Copy className="h-3.5 w-3.5" />,
      onSelect: () => {
        void copyToClipboard(textContent);
      },
      disabled: textContent.trim().length === 0,
    },
    {
      id: "quote",
      label: "Quote",
      icon: <Quote className="h-3.5 w-3.5" />,
      onSelect: () => onQuote?.(textContent),
      disabled: !canQuote,
    },
    {
      id: "edit",
      label: "Edit & resend",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onSelect: () => onEdit?.(textContent),
      hidden: role !== "user",
      disabled: !canEdit,
    },
    {
      id: "regenerate",
      label: "Regenerate",
      icon: <RefreshCcw className="h-3.5 w-3.5" />,
      onSelect: () => onRegenerate?.(),
      hidden: role !== "assistant",
      disabled: !canRegenerate,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="hidden items-center gap-1 sm:flex">
        {visibleActions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon"
            onClick={action.onSelect}
            disabled={action.disabled}
            className="h-7 w-7 rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={action.label}
          >
            {action.icon}
          </Button>
        ))}
      </div>
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Message actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {visibleActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.onSelect}
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
