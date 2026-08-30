"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveStoreSettings } from "@/lib/services/settings";
import { storeSettingsSchema, StoreSettingsFormData } from "@/schemas/settings";

export async function updateStoreSettings(data: StoreSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin" && role !== "user") {
        return { success: false, error: "Forbidden: Admin or authorized role required" };
    }

    const parsed = storeSettingsSchema.safeParse(data);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "),
        };
    }

    try {
        await saveStoreSettings(parsed.data);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_STORE_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update store settings" };
    }
}
