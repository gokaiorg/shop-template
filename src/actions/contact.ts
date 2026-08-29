"use server";

import { adminDb } from "@/lib/firebase-admin";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validate the data
    const validatedData = contactSchema.parse(data);

    // Insert into Firestore
    await adminDb.collection("contact_messages").add({
      ...validatedData,
      status: "unread",
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.issues };
    }
    return { success: false, error: "Failed to send message. Please try again later." };
  }
}
