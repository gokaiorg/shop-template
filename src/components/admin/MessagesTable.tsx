"use client";

import { useState, useTransition } from "react";
import { ContactMessage } from "@/types/database";
import { updateMessageStatus, deleteContactMessage } from "@/actions/contact";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Mail, 
  MailOpen, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  Search, 
  Reply, 
  Eye, 
  Calendar,
  User,
  Inbox,
  CheckCircle2,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessagesTableProps {
  initialMessages: ContactMessage[];
  lang: string;
  dict: any;
}

export function MessagesTable({ initialMessages, lang, dict }: MessagesTableProps) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  const secDict = dict?.admin?.messages_section || {};
  const colDict = secDict?.columns || {};
  const statusDict = secDict?.status || {};

  const unreadCount = messages.filter((m) => m.status === "unread").length;
  const readCount = messages.filter((m) => m.status === "read").length;
  const archivedCount = messages.filter((m) => m.status === "archived").length;

  const filteredMessages = messages.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchSubject = m.subject?.toLowerCase().includes(q);
      const matchMessage = m.message?.toLowerCase().includes(q);
      return matchName || matchEmail || matchSubject || matchMessage;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateString;
    }
  };

  const handleStatusChange = (id: string, newStatus: "unread" | "read" | "archived") => {
    // Optimistic UI update
    const prev = [...messages];
    setMessages((current) =>
      current.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage((prevMsg) => (prevMsg ? { ...prevMsg, status: newStatus } : null));
    }

    startTransition(async () => {
      const result = await updateMessageStatus(id, newStatus);
      if (!result.success) {
        setMessages(prev);
        toast.error(result.error || (lang === "fr" ? "Erreur de mise à jour" : "Update error"));
      } else {
        const labels: Record<string, string> = {
          read: lang === "fr" ? "Message marqué comme lu" : "Message marked as read",
          unread: lang === "fr" ? "Message marqué comme non lu" : "Message marked as unread",
          archived: lang === "fr" ? "Message archivé" : "Message archived",
        };
        toast.success(labels[newStatus]);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (
      !window.confirm(
        lang === "fr"
          ? "Êtes-vous sûr de vouloir supprimer définitivement ce message ?"
          : "Are you sure you want to permanently delete this message?"
      )
    ) {
      return;
    }

    const prev = [...messages];
    setMessages((current) => current.filter((m) => m.id !== id));
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage(null);
    }

    startTransition(async () => {
      const result = await deleteContactMessage(id);
      if (!result.success) {
        setMessages(prev);
        toast.error(result.error || (lang === "fr" ? "Erreur de suppression" : "Delete error"));
      } else {
        toast.success(lang === "fr" ? "Message supprimé" : "Message deleted");
      }
    });
  };

  const getMailtoUrl = (email: string, subject: string) => {
    const cleanSubject = subject?.startsWith("Re:") ? subject : `Re: ${subject || ""}`;
    return `mailto:${email}?subject=${encodeURIComponent(cleanSubject)}`;
  };

  const renderStatusBadge = (status: "unread" | "read" | "archived") => {
    if (status === "unread") {
      return (
        <Badge
          variant="default"
          className="bg-blue-600 hover:bg-blue-600 text-white font-medium border-0 gap-1.5 px-2.5 py-0.5 shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          {statusDict.unread || (lang === "fr" ? "Non lu" : "Unread")}
        </Badge>
      );
    }
    if (status === "archived") {
      return (
        <Badge variant="outline" className="text-muted-foreground gap-1 px-2.5 py-0.5">
          <Archive className="h-3 w-3" />
          {statusDict.archived || (lang === "fr" ? "Archivé" : "Archived")}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 px-2.5 py-0.5 font-normal">
        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
        {statusDict.read || (lang === "fr" ? "Lu" : "Read")}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/50 text-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
              statusFilter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {lang === "fr" ? "Tous" : "All"}
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-muted font-semibold">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("unread")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
              statusFilter === "unread"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {statusDict.unread || (lang === "fr" ? "Non lus" : "Unread")}
            {unreadCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("read")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
              statusFilter === "read"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {statusDict.read || (lang === "fr" ? "Lus" : "Read")}
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-muted font-medium">
              {readCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={cn(
              "px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
              statusFilter === "archived"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {statusDict.archived || (lang === "fr" ? "Archivés" : "Archived")}
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-muted font-medium">
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === "fr"
                ? "Rechercher un message..."
                : "Search messages..."
            }
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Messages Table Card */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[180px] font-semibold">{colDict.name || (lang === "fr" ? "Nom" : "Name")}</TableHead>
              <TableHead className="w-[220px] font-semibold">{colDict.email || (lang === "fr" ? "Email" : "Email")}</TableHead>
              <TableHead className="font-semibold">{colDict.subject || (lang === "fr" ? "Sujet" : "Subject")}</TableHead>
              <TableHead className="w-[170px] font-semibold">{colDict.date || (lang === "fr" ? "Date" : "Date")}</TableHead>
              <TableHead className="w-[120px] font-semibold">{colDict.status || (lang === "fr" ? "Statut" : "Status")}</TableHead>
              <TableHead className="w-[140px] text-right font-semibold">{colDict.actions || (lang === "fr" ? "Actions" : "Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Inbox className="h-8 w-8 text-muted-foreground/60" />
                    <p className="font-medium text-sm">
                      {searchQuery
                        ? lang === "fr"
                          ? "Aucun message ne correspond à votre recherche."
                          : "No messages match your search."
                        : secDict.empty || (lang === "fr" ? "Aucun message reçu pour le moment." : "No messages received yet.")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMessages.map((msg) => {
                const isUnread = msg.status === "unread";
                return (
                  <TableRow
                    key={msg.id}
                    className={cn(
                      "transition-colors hover:bg-muted/50 cursor-pointer",
                      isUnread && "bg-blue-50/40 dark:bg-blue-950/20 font-medium"
                    )}
                    onClick={() => setSelectedMessage(msg)}
                  >
                    {/* Name */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0",
                            isUnread
                              ? "bg-blue-600 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {msg.name?.charAt(0) || "U"}
                        </div>
                        <div className="truncate max-w-[140px]">
                          <span className={cn(isUnread && "text-foreground font-semibold")}>
                            {msg.name}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <a
                        href={getMailtoUrl(msg.email, msg.subject)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        title={msg.email}
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{msg.email}</span>
                      </a>
                    </TableCell>

                    {/* Subject */}
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-md">
                        <span
                          className={cn(
                            "truncate text-sm",
                            isUnread
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {msg.subject}
                        </span>
                        {msg.brandKey && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border shrink-0">
                            {msg.brandName || msg.brandKey}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(msg.createdAt)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>{renderStatusBadge(msg.status)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Reply Native Mailto Button */}
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 gap-1.5 text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                          title={secDict.reply || (lang === "fr" ? "Répondre" : "Reply")}
                        >
                          <a href={getMailtoUrl(msg.email, msg.subject)}>
                            <Reply className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {secDict.reply || (lang === "fr" ? "Répondre" : "Reply")}
                            </span>
                          </a>
                        </Button>

                        {/* View & Dropdown Options */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedMessage(msg)} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              {secDict.view || (lang === "fr" ? "Voir le message" : "View message")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {msg.status !== "read" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(msg.id, "read")}
                                className="cursor-pointer"
                              >
                                <MailOpen className="h-4 w-4 mr-2 text-blue-600" />
                                {secDict.mark_read || (lang === "fr" ? "Marquer comme lu" : "Mark as read")}
                              </DropdownMenuItem>
                            )}

                            {msg.status !== "unread" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(msg.id, "unread")}
                                className="cursor-pointer"
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                {secDict.mark_unread || (lang === "fr" ? "Marquer comme non lu" : "Mark as unread")}
                              </DropdownMenuItem>
                            )}

                            {msg.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(msg.id, "archived")}
                                className="cursor-pointer"
                              >
                                <Archive className="h-4 w-4 mr-2 text-muted-foreground" />
                                {secDict.archive || (lang === "fr" ? "Archiver" : "Archive")}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(msg.id)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {secDict.delete || (lang === "fr" ? "Supprimer" : "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detailed Message Drawer / Sheet */}
      <Sheet open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-6 flex flex-col justify-between overflow-y-auto">
          {selectedMessage && (
            <div className="space-y-6">
              <SheetHeader className="text-left space-y-2 border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  {renderStatusBadge(selectedMessage.status)}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(selectedMessage.createdAt)}
                  </span>
                </div>
                <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                  {selectedMessage.subject}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {lang === "fr" ? "Détail du message reçu" : "Received contact message detail"}
                </SheetDescription>
              </SheetHeader>

              {/* Sender Details */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-foreground">{selectedMessage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={getMailtoUrl(selectedMessage.email, selectedMessage.subject)}
                    className="text-primary hover:underline break-all"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.brandKey && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {lang === "fr" ? "Boutique / Marque :" : "Store / Brand:"}{" "}
                      <strong className="text-foreground">
                        {selectedMessage.brandName || selectedMessage.brandKey}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Message Content Body */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {lang === "fr" ? "Message" : "Message"}
                </h4>
                <div className="rounded-lg border bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed min-h-[160px] text-foreground">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                {/* Mailto Reply button */}
                <Button asChild className="w-full gap-2 font-semibold" size="lg">
                  <a href={getMailtoUrl(selectedMessage.email, selectedMessage.subject)}>
                    <Reply className="h-4 w-4" />
                    {secDict.reply || (lang === "fr" ? "Répondre par email" : "Reply via email")}
                  </a>
                </Button>

                {/* Status toggles */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedMessage.status !== "read" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(selectedMessage.id, "read")}
                      className="gap-1.5"
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      {secDict.mark_read || (lang === "fr" ? "Marquer lu" : "Mark read")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(selectedMessage.id, "unread")}
                      className="gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {secDict.mark_unread || (lang === "fr" ? "Marquer non lu" : "Mark unread")}
                    </Button>
                  )}

                  {selectedMessage.status !== "archived" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(selectedMessage.id, "archived")}
                      className="gap-1.5"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      {secDict.archive || (lang === "fr" ? "Archiver" : "Archive")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(selectedMessage.id, "read")}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {lang === "fr" ? "Restaurer" : "Restore"}
                    </Button>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="w-full text-destructive hover:bg-destructive/10 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {secDict.delete || (lang === "fr" ? "Supprimer ce message" : "Delete this message")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
