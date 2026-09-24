"use client";

import * as React from "react";
import { ContactMessage } from "@/types/database";
import { sendUserAccountMessage, replyToMessage } from "@/actions/contact";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Send, 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  CornerDownRight, 
  ShieldCheck, 
  User, 
  X,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AccountMessagesViewProps {
  initialMessages: ContactMessage[];
  lang: string;
  dict?: any;
}

export function AccountMessagesView({ initialMessages, lang, dict }: AccountMessagesViewProps) {
  const [messages, setMessages] = React.useState<ContactMessage[]>(initialMessages);
  const [showNewForm, setShowNewForm] = React.useState<boolean>(initialMessages.length === 0);
  
  // New Message Form State
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Thread Reply State (map of messageId -> replyText)
  const [replyTexts, setReplyTexts] = React.useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = React.useState<string | null>(null);

  const accountDict = dict?.account || {};

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

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      toast.error(
        lang === "fr"
          ? "Le message doit comporter au moins 5 caractères."
          : "Message must be at least 5 characters."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendUserAccountMessage({
        subject: subject.trim() || undefined,
        message: message.trim(),
      });

      if (res.success) {
        toast.success(
          accountDict.message_sent_success ||
            (lang === "fr"
              ? "Votre message a été envoyé avec succès !"
              : "Your message has been sent successfully!")
        );

        const newMsg: ContactMessage = {
          id: res.id || crypto.randomUUID(),
          name: "Moi",
          email: "",
          subject: subject.trim() || (lang === "fr" ? "Message client" : "Client message"),
          message: message.trim(),
          status: "unread",
          source: "User",
          userUnread: false,
          replies: [],
          brandKey: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setMessages((prev) => [newMsg, ...prev]);
        setSubject("");
        setMessage("");
        setShowNewForm(false);
      } else {
        toast.error(res.error || (lang === "fr" ? "Erreur lors de l'envoi." : "Failed to send message."));
      }
    } catch (err: any) {
      toast.error(err?.message || (lang === "fr" ? "Erreur imprévue." : "Unexpected error."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (messageId: string) => {
    const text = (replyTexts[messageId] || "").trim();
    if (!text) return;

    setSubmittingReplyId(messageId);
    try {
      const res = await replyToMessage(messageId, text);
      if (res.success && res.reply) {
        toast.success(
          accountDict.reply_sent_success ||
            (lang === "fr" ? "Votre réponse a été envoyée !" : "Your reply has been sent!")
        );

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                replies: [...(msg.replies || []), res.reply!],
                updatedAt: new Date().toISOString(),
              };
            }
            return msg;
          })
        );

        setReplyTexts((prev) => ({ ...prev, [messageId]: "" }));
      } else {
        toast.error(res.error || (lang === "fr" ? "Erreur lors de l'envoi." : "Failed to send reply."));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reply");
    } finally {
      setSubmittingReplyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span>{accountDict.messages || "Messages"}</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {accountDict.messages_subtitle ||
              (lang === "fr"
                ? "Consultez vos échanges avec notre équipe et envoyez un nouveau message."
                : "View conversations with our team and send a new message.")}
          </p>
        </div>

        <Button
          onClick={() => setShowNewForm((prev) => !prev)}
          variant={showNewForm ? "outline" : "default"}
          className="gap-2 cursor-pointer shrink-0"
        >
          {showNewForm ? (
            <>
              <X className="h-4 w-4" />
              <span>{lang === "fr" ? "Fermer le formulaire" : "Close form"}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{accountDict.new_message || (lang === "fr" ? "Nouveau message" : "New message")}</span>
            </>
          )}
        </Button>
      </div>

      {/* New Message Composer Card */}
      {showNewForm && (
        <Card className="border-primary/30 shadow-md bg-card/60 backdrop-blur-xs transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span>{accountDict.new_message || (lang === "fr" ? "Nouveau message" : "New message")}</span>
            </CardTitle>
            <CardDescription>
              {lang === "fr"
                ? "Posez votre question ou détaillez votre demande à notre équipe support."
                : "Ask a question or explain your inquiry to our support team."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMessage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {accountDict.subject || (lang === "fr" ? "Sujet (facultatif)" : "Subject (optional)")}
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    accountDict.subject_placeholder ||
                    (lang === "fr" ? "Objet de votre message..." : "What is this about?")
                  }
                  className="bg-background text-sm"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {accountDict.message || "Message"} <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    accountDict.message_placeholder ||
                    (lang === "fr" ? "Écrivez votre message ici..." : "Write your message here...")
                  }
                  className="min-h-28 bg-background text-sm"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowNewForm(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="gap-2 font-semibold cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? accountDict.sending_message || (lang === "fr" ? "Envoi..." : "Sending...")
                      : accountDict.send_message || (lang === "fr" ? "Envoyer le message" : "Send message")}
                  </span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Messages / Conversations List */}
      {messages.length === 0 ? (
        <Card className="border-dashed bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">
                {accountDict.no_messages || (lang === "fr" ? "Vous n'avez aucun message pour le moment." : "You have no messages yet.")}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {accountDict.no_messages_subtitle ||
                  (lang === "fr"
                    ? "Vous pouvez nous écrire directement en cliquant sur « Nouveau message »."
                    : "You can write to us directly by clicking on 'New message'.")}
              </p>
            </div>
            {!showNewForm && (
              <Button
                onClick={() => setShowNewForm(true)}
                size="sm"
                className="gap-2 mt-2 cursor-pointer font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>{accountDict.new_message || (lang === "fr" ? "Nouveau message" : "New message")}</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const repliesCount = msg.replies?.length || 0;
            const hasAdminReply = msg.replies?.some((r) => r.senderRole === "admin");
            const currentReplyText = replyTexts[msg.id] || "";
            const isSubmittingThis = submittingReplyId === msg.id;

            return (
              <Card key={msg.id} className="overflow-hidden border bg-card shadow-xs">
                {/* Message Header */}
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-semibold text-foreground">
                          {msg.subject || (lang === "fr" ? "Message client" : "Customer inquiry")}
                        </CardTitle>
                        {hasAdminReply ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs gap-1 py-0.5 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {lang === "fr" ? "Réponse reçue" : "Replied"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs gap-1 py-0.5">
                            <Clock className="h-3 w-3" />
                            {lang === "fr" ? "En attente" : "Pending"}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>

                    {repliesCount > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium shrink-0">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {repliesCount} {lang === "fr" ? (repliesCount > 1 ? "réponses" : "réponse") : (repliesCount > 1 ? "replies" : "reply")}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Original Message Content */}
                  <div className="space-y-1">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {msg.message}
                    </p>
                  </div>

                  {/* Replies Thread */}
                  {repliesCount > 0 && (
                    <div className="pt-3 border-t border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CornerDownRight className="h-3.5 w-3.5" />
                        <span>{accountDict.replies || (lang === "fr" ? "Échanges" : "Replies")}</span>
                      </h4>

                      <div className="space-y-2.5">
                        {msg.replies!.map((reply) => {
                          const isAdmin = reply.senderRole === "admin";
                          return (
                            <div
                              key={reply.id}
                              className={cn(
                                "rounded-lg p-3.5 text-sm space-y-1.5 border transition-colors",
                                isAdmin
                                  ? "bg-primary/5 border-primary/25 ml-2 sm:ml-4"
                                  : "bg-muted/40 border-border mr-2 sm:mr-4"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  {isAdmin ? (
                                    <>
                                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                      <span>{reply.senderName || (accountDict.admin_reply || (lang === "fr" ? "Équipe Support" : "Support Team"))}</span>
                                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                        Support
                                      </Badge>
                                    </>
                                  ) : (
                                    <>
                                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span>{lang === "fr" ? "Moi" : "Me"}</span>
                                    </>
                                  )}
                                </span>
                                <span className="text-muted-foreground text-[11px]">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                                {reply.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Reply Form on thread */}
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={currentReplyText}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        placeholder={
                          accountDict.reply_placeholder ||
                          (lang === "fr" ? "Ajouter une réponse..." : "Add a reply...")
                        }
                        className="text-sm bg-background flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(msg.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSendReply(msg.id)}
                        disabled={!currentReplyText.trim() || isSubmittingThis}
                        className="gap-1.5 cursor-pointer font-medium shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>
                          {isSubmittingThis
                            ? (lang === "fr" ? "Envoi..." : "Sending...")
                            : (accountDict.reply_button || (lang === "fr" ? "Répondre" : "Reply"))}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
