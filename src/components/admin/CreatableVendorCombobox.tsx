"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreatableVendorComboboxProps {
    options: string[];
    value?: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    lang?: string;
}

export function CreatableVendorCombobox({
    options = [],
    value = "",
    onChange,
    placeholder = "e.g. Amann Inkspiration",
    disabled = false,
    className,
    lang = "en",
}: CreatableVendorComboboxProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [query, setQuery] = React.useState(value || "");
    const [localOptions, setLocalOptions] = React.useState<string[]>(options);
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const isFrench = lang?.startsWith("fr");
    const createText = isFrench ? "Créer" : "Create";
    const noOptionsText = isFrench ? "Aucun artiste enregistré" : "No registered artist";

    // Keep local options in sync with incoming options prop
    React.useEffect(() => {
        setLocalOptions((prev) => {
            const merged = Array.from(new Set([...options, ...prev]));
            return merged;
        });
    }, [options]);

    // Keep query in sync with incoming value if not active input
    React.useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setQuery(value || "");
        }
    }, [value]);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    const trimmedQuery = query.trim();

    // Filtered options based on query
    const filteredOptions = React.useMemo(() => {
        if (!trimmedQuery) return localOptions;
        return localOptions.filter((opt) =>
            opt.toLowerCase().includes(trimmedQuery.toLowerCase())
        );
    }, [localOptions, trimmedQuery]);

    // Check if query exactly matches an existing option (case-insensitive)
    const hasExactMatch = React.useMemo(() => {
        if (!trimmedQuery) return false;
        return localOptions.some(
            (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
        );
    }, [localOptions, trimmedQuery]);

    const showCreateOption = trimmedQuery.length > 0 && !hasExactMatch;

    // Total actionable items in dropdown
    const totalItems = (showCreateOption ? 1 : 0) + filteredOptions.length;

    const handleSelect = (selectedVal: string) => {
        const clean = selectedVal.trim();
        setQuery(clean);
        onChange(clean);
        if (!localOptions.includes(clean)) {
            setLocalOptions((prev) => [...prev, clean]);
        }
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleCreate = () => {
        if (!trimmedQuery) return;
        handleSelect(trimmedQuery);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setQuery(newVal);
        onChange(newVal); // Free typing support
        setIsOpen(true);
        setHighlightedIndex(0);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQuery("");
        onChange("");
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                setHighlightedIndex(0);
            } else {
                setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                setHighlightedIndex(totalItems - 1);
            } else {
                setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
            }
        } else if (e.key === "Enter") {
            if (isOpen && totalItems > 0) {
                e.preventDefault();
                if (showCreateOption && (highlightedIndex === 0 || highlightedIndex === -1)) {
                    handleCreate();
                } else {
                    const optionIndex = showCreateOption ? highlightedIndex - 1 : highlightedIndex;
                    if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
                        handleSelect(filteredOptions[optionIndex]);
                    } else if (showCreateOption) {
                        handleCreate();
                    }
                }
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Input Wrapper */}
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    disabled={disabled}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    autoComplete="off"
                    className={cn(
                        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                        "placeholder:text-muted-foreground",
                        "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "pr-16"
                    )}
                />

                {/* Right side controls */}
                <div className="absolute right-1.5 flex items-center gap-1 text-muted-foreground">
                    {query && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label="Clear"
                            className="p-1 rounded-sm hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            setIsOpen((prev) => !prev);
                            inputRef.current?.focus();
                        }}
                        aria-label="Toggle options"
                        className="p-1 rounded-sm hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    >
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                    <ul ref={listRef} className="max-h-60 overflow-y-auto p-1 text-sm">
                        {/* Creatable option */}
                        {showCreateOption && (
                            <li className="mb-1 pb-1 border-b border-border/50">
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm text-left font-medium transition-colors cursor-pointer",
                                        highlightedIndex === 0
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                    )}
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                        {createText} <span className="font-bold underline decoration-current/40">« {trimmedQuery} »</span>
                                    </span>
                                </button>
                            </li>
                        )}

                        {/* Existing list items */}
                        {filteredOptions.map((opt, idx) => {
                            const isSelected = (value || "").toLowerCase() === opt.toLowerCase();
                            const itemIndex = showCreateOption ? idx + 1 : idx;
                            const isHighlighted = highlightedIndex === itemIndex;

                            return (
                                <li key={opt}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-sm text-left transition-colors cursor-pointer",
                                            isHighlighted ? "bg-accent text-accent-foreground" : "hover:bg-muted/70 text-foreground",
                                            isSelected && !isHighlighted && "bg-muted/50 font-medium text-foreground"
                                        )}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 shrink-0 text-primary ml-2" />
                                        )}
                                    </button>
                                </li>
                            );
                        })}

                        {/* Empty state */}
                        {filteredOptions.length === 0 && !showCreateOption && (
                            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                                {noOptionsText}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
