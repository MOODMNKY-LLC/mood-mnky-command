"use client";

import * as React from "react";
import {
  Share2,
  Users,
  Pencil,
  FolderInput,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDojoChat } from "@/components/dojo/dojo-chat-context";
import type { DojoChatSidebarChat } from "@/components/dojo/dojo-chat-sidebar";
import { useToast } from "@/components/ui/use-toast";

export interface DojoChatCommandPaletteProps {
  chat: DojoChatSidebarChat;
  trigger: React.ReactNode;
}

export function DojoChatCommandPalette({ chat, trigger }: DojoChatCommandPaletteProps) {
  const {
    updateChatTitle,
    pinChat,
    archiveChat,
    deleteChat,
    projects,
    moveChatToProject,
  } = useDojoChat();
  const { toast } = useToast();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(chat.title || "");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleShare = React.useCallback(() => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/dojo/chat?id=${chat.id}`;
    void navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Chat link copied to clipboard." });
  }, [chat.id, toast]);

  const handleConvertToGroup = React.useCallback(() => {
    toast({ title: "Coming soon", description: "Group chats will be available in a future update." });
  }, [toast]);

  const handleRename = React.useCallback(() => {
    setRenameValue(chat.title || "");
    setRenameOpen(true);
  }, [chat.title]);

  const handleRenameSubmit = React.useCallback(() => {
    const title = renameValue.trim() || "Untitled";
    updateChatTitle(chat.id, title);
    setRenameOpen(false);
    toast({ title: "Renamed", description: `Chat renamed to "${title}".` });
  }, [chat.id, renameValue, updateChatTitle, toast]);

  const handleMoveToProject = React.useCallback(
    (projectId: string | null) => {
      moveChatToProject(chat.id, projectId);
      const name = projectId ? projects.find((p) => p.id === projectId)?.name ?? "project" : "No project";
      toast({ title: "Moved", description: `Chat moved to ${name}.` });
    },
    [chat.id, moveChatToProject, projects, toast]
  );

  const handlePin = React.useCallback(() => {
    pinChat(chat.id, !chat.pinned);
    toast({ title: chat.pinned ? "Unpinned" : "Pinned" });
  }, [chat.id, chat.pinned, pinChat, toast]);

  const handleArchive = React.useCallback(() => {
    archiveChat(chat.id, !chat.archived);
    toast({ title: chat.archived ? "Restored" : "Archived" });
  }, [chat.id, chat.archived, archiveChat, toast]);

  const handleDeleteClick = React.useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = React.useCallback(() => {
    deleteChat(chat.id);
    setDeleteOpen(false);
    toast({ title: "Deleted", description: "Chat deleted." });
  }, [chat.id, deleteChat, toast]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          {trigger}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleConvertToGroup}>
            <Users className="mr-2 h-4 w-4" />
            Convert to group chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to project
              <ChevronRight className="ml-auto h-4 w-4" />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleMoveToProject(null)}>
                No project
              </DropdownMenuItem>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(p.id)}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePin}>
            {chat.pinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                Pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            {chat.archived ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-title">Title</Label>
              <Input
                id="rename-title"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{chat.title || "Untitled"}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
