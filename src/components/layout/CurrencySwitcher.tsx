"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
                    size="sm"
                    aria-label={`Current currency: ${currentItem.code}. Click to change currency.`}
                    className={cn(
                        "h-9 px-2 sm:px-2.5 gap-1 font-semibold text-xs sm:text-sm text-foreground hover:text-primary hover:bg-transparent focus-visible:text-primary transition-colors cursor-pointer",
                        className
                    )}
                >
                    <span className="tracking-tight">{currentItem.code}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground font-normal">
                        ({currentItem.symbol})
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-200" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-72 overflow-y-auto p-1">
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b mb-1">
                    Select Currency
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
