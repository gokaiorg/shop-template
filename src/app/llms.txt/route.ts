import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GOKAI_LABS_LLMS = `# Gokai Labs
> AI-Powered Digital Solutions & Modern Web Engineering based in Paris, France.

## About Us
Gokai Labs is a technical consultancy and digital engineering studio founded by Jérémy Douchamps, a Senior Software & Growth Engineer with over 15 years of experience. We help SMBs and e-commerce brands build high-performance digital ecosystems engineered for velocity, scale, and profitability.

## Core Services
### 1. Modern Web Engineering
We build high-velocity web applications and e-commerce platforms.
- Technologies: Next.js, React, Node.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Supabase, Firebase.
- Infrastructure: High-availability deployment on Google Cloud Platform (GCP Cloud Run).
- Focus: Core Web Vitals optimization, Server-Side Rendering (SSR), and technical SEO.

### 2. AI Automations
We design custom intelligent workflows to operate and streamline your business 24/7.
- RAG (Retrieval-Augmented Generation) Conversational Agents deployed via enterprise APIs.
- Complex automation workflows and API bridges using n8n, Google Flow, and Stitch.
- Autonomous AI agents for lead qualification and customer support.

### 3. Growth & Acquisition
We engineer data-driven pipelines for relentless acquisition.
- Server-Side Tracking (Google Tag Manager Server-Side).
- Programmatic SEO.
- B2B Outbound automated pipelines (Dropcontact, HubSpot, Lemlist, PhantomBuster).

## Contact & Location
- Headquarters: 1 Square du Thimerais, 75017 Paris, France
- Phone / WhatsApp: +33 6 51 36 81 96
- Website: [https://gokai.org](https://gokai.org)
- WhatsApp Direct: [WhatsApp Chat](https://wa.me/33651368196)
`;

const ART_FATE_LLMS = `# Art Fate

> Independent contemporary art studio and digital exhibition gallery featuring original paintings, urban street art, sculptures, mixed media collages, and custom hand-painted skate decks.

Art Fate functions as a digital exhibition space and curated artist portfolio rather than an automated e-commerce store. Artworks are displayed for discovery, exhibitions, and direct inquiry. Acquisitions, commissions, and shipping logistics are arranged individually via direct contact.

## Core Artworks & Collections

- [Paintings](https://art-fate.com/en/artworks/painting): Original textured oil on canvas, acrylic paintings, and stencil spray artworks.
- [Sculptures](https://art-fate.com/en/artworks/sculpture): Three-dimensional contemporary objects and mixed media collectible art figures.
- [Abstract and More](https://art-fate.com/en/artworks/abstract-and-more): Expressive abstract art, dynamic color compositions, and intuitive textural work.
- [Walls](https://art-fate.com/en/artworks/walls): Iconic pop-urban collection created with aerosol paint on walls.
- [Collage](https://art-fate.com/en/artworks/collage): Mixed media compositions combining layered urban paper, typography, and painted elements.
- [Skate Decks](https://art-fate.com/en/artworks/skate-decks): Custom skateboard decks transformed into collectible wall-hanging fine art.

## Studio & Artist Information

- [About & Ethos](https://art-fate.com/en/about): Background of Art Fate studio, artistic vision, and catalog presentation.
- [Artist Amann](https://art-fate.com/en/amann): Profile and body of work by resident visual artist Amann.
- [Contact Studio](https://art-fate.com/en/contact): Direct communication channel for private viewings, acquisition inquiries, and art collaborations.

## Acquisition & Logistics Details

- Direct Purchases: No direct automated checkout or online payment processing. All acquisitions are arranged via email or inquiry form.
- Worldwide Shipping: Artworks are dispatched across Thailand and worldwide using museum-grade protective packaging and insured couriers. Shipping fees and any applicable customs duties are covered by the collector.
- Sales Policy: All sales of original artworks and limited series are final (no returns, refunds, or exchanges).
- Studio Location: Kathu, Phuket, Thailand.
- Direct Contact Email: [barstoeck@gmail.com](mailto:barstoeck@gmail.com)
- Website: [https://art-fate.com](https://art-fate.com)
`;

const SHOP_TEMPLATE_LLMS = `# Shop Template
> High-Performance Turnkey E-Commerce Boilerplate.

## About
Shop Template is an advanced e-commerce boilerplate engineered for speed, scalability, and modern developer experience. Developed and maintained by Gokai Labs.

## Technical Stack & Architecture
- Frontend: Next.js 16 (App Router), React, Tailwind CSS.
- Backend & Database: Node.js, PostgreSQL, Prisma, Supabase.
- Authentication: Auth.js v5.
- Infrastructure: Deployed on Google Cloud Platform (GCP Cloud Run) with Firebase integration.

## Core Features
- Server-Side Rendering (SSR) for optimal technical SEO and Core Web Vitals.
- Global state management for multi-currency UI modifiers.
- Dynamic JSON-LD structured data generation (GEO optimized for Product & CollectionPage).
- Headless CMS integration for custom modular content blocks.

## Links
- Developer: [Gokai Labs](https://gokai.org)
`;

const GREEN_GHOST_LLMS = `# Green Ghost
> Premium Dispensaries in Phuket, Thailand.

## About Us
Green Ghost operates premium dispensaries located in the heart of Phuket. We provide high-quality curated products, accessories, and expert guidance in a welcoming environment, backed by robust digital inventory operations.

## Locations
- Rawai Branch: Rawai, Phuket, Thailand
- Karon Branch: Karon, Phuket, Thailand

## Operations & Contact
- Local SEO and digital architecture optimized for seamless customer experience.
- Website: [https://green.gd](https://green.gd)
`;

export async function GET(request: Request) {
    // 1. Resolve active brand from environment variables
    let activeBrand = (
        process.env.NEXT_PUBLIC_BRAND ||
        process.env.BRAND ||
        ''
    )
        .toLowerCase()
        .trim();

    // 2. Resolve or verify brand from incoming request host
    const host = (
        request.headers.get('x-forwarded-host') ||
        request.headers.get('host') ||
        ''
    ).toLowerCase();

    if (host.includes('gokai')) {
        activeBrand = 'gokai-labs';
    } else if (host.includes('art-fate')) {
        activeBrand = 'art-fate';
    } else if (host.includes('green')) {
        activeBrand = 'green-ghost';
    }

    // 3. Fallback to Cloud Run or Firebase service names if still undefined
    if (!activeBrand) {
        const kService = (process.env.K_SERVICE || '').toLowerCase();
        const fbProject = (process.env.FIREBASE_PROJECT_ID || '').toLowerCase();

        if (kService.includes('art-fate') || fbProject.includes('art-fate')) {
            activeBrand = 'art-fate';
        } else if (kService.includes('green-ghost') || fbProject.includes('green-ghost')) {
            activeBrand = 'green-ghost';
        } else if (kService.includes('gokai-labs') || fbProject.includes('gokai-labs')) {
            activeBrand = 'gokai-labs';
        }
    }

    // Server-side debugging log for Cloud Run
    console.log('LLMS Route - Active Brand:', activeBrand);

    let content: string | null = null;

    switch (activeBrand) {
        case 'gokai-labs':
            content = GOKAI_LABS_LLMS;
            break;
        case 'art-fate':
            content = ART_FATE_LLMS;
            break;
        case 'shop-template':
            content = SHOP_TEMPLATE_LLMS;
            break;
        case 'green-ghost':
            content = GREEN_GHOST_LLMS;
            break;
        default:
            return new NextResponse('Brand not configured or not found', { status: 404 });
    }

    return new NextResponse(content, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
}