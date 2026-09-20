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
    GlobalSettingsFormData,
    blocksSchema,
    BlocksFormData,
} from "@/schemas/settings";

export async function updateCatalogSettings(data: CatalogSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin") {
        return { success: false, error: "Forbidden: Admin role required" };
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
    if (role !== "admin") {
        return { success: false, error: "Forbidden: Admin role required" };
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
        if (!('aboutSection' in data) || (data as any).aboutSection === undefined) {
            delete (updatePayload as any).aboutSection;
        }
        if (!('contactSection' in data) || (data as any).contactSection === undefined) {
            delete (updatePayload as any).contactSection;
        }
        await saveStoreSettings(updatePayload);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_GLOBAL_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update global settings" };
    }
}

export async function updateBlocksSettings(data: BlocksFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin") {
        return { success: false, error: "Forbidden: Admin role required" };
    }

    const parsed = blocksSchema.safeParse(data);
    if (!parsed.success) {
        return {
            success: false,
            error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "),
        };
    }

    try {
        const updatePayload: Record<string, any> = {
            aboutSection: parsed.data.aboutSection,
        };
        if (parsed.data.contactSection) {
            updatePayload.contactSection = parsed.data.contactSection;
        }
        await saveStoreSettings(updatePayload);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_BLOCKS_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update blocks settings" };
    }
}

export async function updateStoreSettings(data: GlobalSettingsFormData | StoreSettingsFormData) {
    const session = await auth();

    if (!session || !session.user) {
        return { success: false, error: "Unauthorized" };
    }

    const role = (session.user.role || "").toLowerCase();
    if (role !== "admin") {
        return { success: false, error: "Forbidden: Admin role required" };
    }

    const parsedStore = storeSettingsSchema.safeParse(data);
    if (parsedStore.success) {
        try {
            await saveStoreSettings(parsedStore.data);
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
        if (!('aboutSection' in data) || (data as any).aboutSection === undefined) {
            delete (updatePayload as any).aboutSection;
        }
        if (!('contactSection' in data) || (data as any).contactSection === undefined) {
            delete (updatePayload as any).contactSection;
        }
        await saveStoreSettings(updatePayload);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("[UPDATE_STORE_SETTINGS_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to update store settings" };
    }
}
