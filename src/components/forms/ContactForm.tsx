"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactForm, type ContactFormData } from "@/actions/contact";

interface ContactFormProps {
  lang?: string;
  dict?: any;
}

export function ContactForm({ lang = "en", dict }: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactSchema = useMemo(() => {
    return z.object({
      name: z.string().min(2, dict?.validation?.name_min || (lang === "fr" ? "Le nom doit comporter au moins 2 caractères" : "Name must be at least 2 characters")),
      email: z.string().email(dict?.validation?.email_invalid || (lang === "fr" ? "Adresse email invalide" : "Invalid email address")),
      subject: z.string().min(5, dict?.validation?.subject_min || (lang === "fr" ? "Le sujet doit comporter au moins 5 caractères" : "Subject must be at least 5 characters")),
      message: z.string().min(10, dict?.validation?.message_min || (lang === "fr" ? "Le message doit comporter au moins 10 caractères" : "Message must be at least 10 characters")),
    });
  }, [dict, lang]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormData) {
    setIsLoading(true);
    try {
      const result = await submitContactForm(data);
      if (result.success) {
        setIsSubmitted(true);
        toast.success(dict?.success_toast || (lang === "fr" ? "Message envoyé avec succès !" : "Message sent successfully!"));
        form.reset();
      } else {
        toast.error(result.error || dict?.error_toast || (lang === "fr" ? "Échec de l'envoi du message." : "Failed to send message."));
      }
    } catch (error) {
      toast.error(dict?.unexpected_error || (lang === "fr" ? "Une erreur inattendue est survenue." : "An unexpected error occurred."));
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 sm:p-12 bg-card rounded-xl border shadow-sm mt-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {dict?.success_title || (lang === "fr" ? "Message envoyé avec succès !" : "Message sent successfully!")}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {dict?.success_message ||
              (lang === "fr"
                ? "Merci de nous avoir contactés. Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais."
                : "Thank you for reaching out. We have received your message and will get back to you as soon as possible.")}
          </p>
        </div>
        <div className="pt-3">
          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setIsSubmitted(false);
            }}
            className="cursor-pointer"
          >
            {dict?.send_another || (lang === "fr" ? "Envoyer un autre message" : "Send another message")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-lg border shadow-sm mt-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict?.name_label || (lang === "fr" ? "Nom" : "Name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict?.name_placeholder || (lang === "fr" ? "Votre nom" : "Your name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict?.email_label || (lang === "fr" ? "Email" : "Email")}</FormLabel>
                  <FormControl>
                    <Input placeholder={dict?.email_placeholder || "your@email.com"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict?.subject_label || (lang === "fr" ? "Sujet" : "Subject")}</FormLabel>
                <FormControl>
                  <Input placeholder={dict?.subject_placeholder || (lang === "fr" ? "De quoi s'agit-il ?" : "What is this about?")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict?.message_label || (lang === "fr" ? "Message" : "Message")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={dict?.message_placeholder || (lang === "fr" ? "Dites-nous en plus..." : "Tell us more...")}
                    className="min-h-[150px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dict?.submitting_button || (lang === "fr" ? "Envoi en cours..." : "Sending...")}
              </>
            ) : (
              dict?.submit_button || (lang === "fr" ? "Envoyer le message" : "Send Message")
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
