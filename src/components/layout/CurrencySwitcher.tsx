"use client";

import * as React from "react";
import { DollarSign, Euro, PoundSterling, JapaneseYen, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBrand } from "@/components/providers/BrandProvider";
import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/store/useCurrencyStore";
import { useMounted } from "@/hooks/useMounted";
import { cn } from "@/lib/utils";

interface CurrencySwitcherProps {
    className?: string;
}

function CurrencyIcon({ code }: { code: string }) {
    switch (code) {
        case "EUR":
            return <Euro className="h-[1.2rem] w-[1.2rem]" />;
        case "USD":
        case "CAD":
        case "AUD":
            return <DollarSign className="h-[1.2rem] w-[1.2rem]" />;
        case "GBP":
            return <PoundSterling className="h-[1.2rem] w-[1.2rem]" />;
        case "JPY":
            return <JapaneseYen className="h-[1.2rem] w-[1.2rem]" />;
        case "THB":
            return <span className="font-bold text-base leading-none select-none">฿</span>;
        case "CHF":
            return <span className="font-bold text-xs leading-none select-none tracking-tight">CHF</span>;
        default:
            return <Coins className="h-[1.2rem] w-[1.2rem]" />;
    }
}

export function CurrencySwitcher({ className }: CurrencySwitcherProps) {
    const { currency: storeBaseCurrency } = useBrand();
    const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
    const setCurrency = useCurrencyStore((state) => state.setCurrency);
    const initializeDefault = useCurrencyStore((state) => state.initializeDefault);
    const mounted = useMounted();

    const baseCurrency = (storeBaseCurrency || "EUR").toUpperCase();

    // Initialize store currency with store default if not yet chosen
    React.useEffect(() => {
        if (storeBaseCurrency) {
            initializeDefault(storeBaseCurrency);
        }
    }, [storeBaseCurrency, initializeDefault]);

    // Active currency code (fall back to store base currency before client hydration)
    const activeCurrency = (mounted && selectedCurrency)
        ? selectedCurrency.toUpperCase()
        : baseCurrency;

    const currentItem = SUPPORTED_CURRENCIES.find((c) => c.code === activeCurrency) || {
        code: activeCurrency,
        symbol: activeCurrency,
        name: activeCurrency,
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Devise active : ${currentItem.code}`}
                    className={className}
                >
                    <CurrencyIcon code={activeCurrency} />
                    <span className="sr-only">Devise : {currentItem.code}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-72 overflow-y-auto p-1">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b mb-1">
                    Sélectionner la devise
                </div>
                {SUPPORTED_CURRENCIES.map((item) => {
                    const isSelected = activeCurrency === item.code;
                    return (
                        <DropdownMenuItem
                            key={item.code}
                            onClick={() => setCurrency(item.code)}
                            className={cn(
                                "flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-xs sm:text-sm transition-colors",
                                isSelected
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "hover:bg-muted/60 focus:bg-muted/60 text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span className="font-semibold">{item.code}</span>
                                <span className="text-muted-foreground text-xs">{item.name}</span>
                            </span>
                            <span className="text-muted-foreground font-mono text-xs ml-2">
                                {item.symbol}
                            </span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
