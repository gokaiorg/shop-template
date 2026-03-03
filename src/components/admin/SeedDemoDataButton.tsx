"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { seedDemoData } from "@/actions/admin";

export function SeedDemoDataButton({ dict }: {
    dict: {
        dashboard_seedWarning: string;
        dashboard_seedSuccess: string;
        dashboard_seedError: string;
        dashboard_seedButton: string;
    }
}) {
    const [isPending, startTransition] = useTransition();

    const handleSeed = () => {
        if (!confirm(dict.dashboard_seedWarning)) return;

        startTransition(async () => {
            const result = await seedDemoData();
            if (result.success) {
                toast.success(dict.dashboard_seedSuccess);
            } else {
                toast.error(result.error || dict.dashboard_seedError);
            }
        });
    };

    return (
        <Button variant="destructive" onClick={handleSeed} disabled={isPending}>
            {isPending ? "..." : dict.dashboard_seedButton}
        </Button>
    );
}
