"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StoreSettings } from "@/types/database";
import { BookOpen, Mail, Pencil } from "lucide-react";

interface BlocksTableProps {
    settings: StoreSettings;
    lang: string;
}

export function BlocksTable({ settings, lang }: BlocksTableProps) {
    const isFr = lang === "fr";

    const blocks = [
        {
            id: "about",
            name: isFr ? "Section À propos" : "About Section",
            slug: "about",
            description: isFr
                ? "Mettez en avant l'histoire, les valeurs ou le savoir-faire de votre marque avec un carrousel d'images."
                : "Highlight your brand story, craft, and values with an interactive photo carousel.",
            icon: BookOpen,
            enabled: Boolean(settings.aboutSection?.enabled),
            editUrl: `/${lang}/admin/blocks/about`,
        },
        {
            id: "contact",
            name: isFr ? "Section Contact" : "Contact Section",
            slug: "contact",
            description: isFr
                ? "Formulaire de contact et messages d'introduction pour vos visiteurs."
                : "Contact inquiry form and introductory copy for your visitors.",
            icon: Mail,
            enabled: Boolean(settings.contactSection?.enabled),
            editUrl: `/${lang}/admin/blocks/contact`,
        },
    ];

    return (
        <div className="bg-background border rounded-lg overflow-x-auto shadow-xs">
            <Table className="w-full text-sm text-left min-w-[700px]">
                <TableHeader className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <TableRow>
                        <TableHead className="px-6 py-3 whitespace-nowrap font-semibold w-56">
                            {isFr ? "Nom" : "Name"}
                        </TableHead>
                        <TableHead className="px-6 py-3 font-semibold">
                            {isFr ? "Description" : "Description"}
                        </TableHead>
                        <TableHead className="px-6 py-3 whitespace-nowrap font-semibold w-32">
                            {isFr ? "Statut" : "Status"}
                        </TableHead>
                        <TableHead className="px-6 py-3 text-right whitespace-nowrap font-semibold w-24">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {blocks.map((block) => {
                        const Icon = block.icon;
                        return (
                            <TableRow key={block.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <TableCell className="px-6 py-4 font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-muted text-muted-foreground shrink-0">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <p className="font-medium text-foreground">{block.name}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-muted-foreground text-sm whitespace-normal leading-relaxed">
                                    {block.description}
                                </TableCell>
                                <TableCell className="px-6 py-4 whitespace-nowrap w-32">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                            block.enabled
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {block.enabled
                                            ? isFr
                                                ? "Actif"
                                                : "Active"
                                            : isFr
                                            ? "Inactif"
                                            : "Inactive"}
                                    </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="text-muted-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors cursor-pointer"
                                        title={isFr ? "Modifier le bloc" : "Edit block"}
                                    >
                                        <Link href={block.editUrl}>
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
