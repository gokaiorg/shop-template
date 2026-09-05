"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveStoreSettings } from "@/lib/services/settings";
import { 
    storeSettingsSchema, 
    StoreSettingsFormData,
    catalogSettingsSchema,
    CatalogSettingsFormData,
    globalSettingsSchema,
    GlobalSettingsFormData
} from "@/schemas/settings";

export async function updateCatalogSettings(data: CatalogSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin" && role !== "user") {
        return { success: false, error: "Forbidden: Admin or authorized role required" };
    }

    const parsed = catalogSettingsSchema.safeParse(data);
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
        console.error("[UPDATE_CATALOG_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update catalog settings" };
    }
}

export async function updateGlobalSettings(data: GlobalSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin" && role !== "user") {
        return { success: false, error: "Forbidden: Admin or authorized role required" };
    }

    const parsed = globalSettingsSchema.safeParse(data);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "),
        };
    }

    try {
        const updatePayload = { ...parsed.data };
        if (!('vendors' in data) || (data as any).vendors === undefined) {
            delete (updatePayload as any).vendors;
        }
        await saveStoreSettings(updatePayload);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_GLOBAL_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update global settings" };
    }
}

export async function updateStoreSettings(data: GlobalSettingsFormData | StoreSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin" && role !== "user") {
        return { success: false, error: "Forbidden: Admin or authorized role required" };
    }

    const parsedStore = storeSettingsSchema.safeParse(data);
    if (parsedStore.success) {
        try {
            const updatePayload = { ...parsedStore.data };
            if (!('vendors' in data) || (data as any).vendors === undefined) {
                delete (updatePayload as any).vendors;
            }
            await saveStoreSettings(updatePayload);
            revalidatePath("/", "layout");
            return { success: true };
        } catch (error: any) {
            console.error("[UPDATE_STORE_SETTINGS_ACTION_ERROR]", error);
            return { success: false, error: error?.message || "Failed to update store settings" };
        }
    }

    const parsedGlobal = globalSettingsSchema.safeParse(data);
    if (!parsedGlobal.success) {
        const issues = [...(parsedStore.error?.issues || []), ...parsedGlobal.error.issues];
        return {
            success: false,
            error: "Validation failed: " + issues.map((i) => i.message).join(", "),
        };
    }

    try {
        const updatePayload = { ...parsedGlobal.data };
        if (!('vendors' in data) || (data as any).vendors === undefined) {
            delete (updatePayload as any).vendors;
        }
        await saveStoreSettings(updatePayload);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_STORE_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update store settings" };
    }
}
