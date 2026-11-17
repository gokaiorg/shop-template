import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const HealthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal("healthy"),
    timestamp: z.string(),
    uptimeSeconds: z.number().nonnegative(),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const payload = HealthResponseSchema.parse({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
