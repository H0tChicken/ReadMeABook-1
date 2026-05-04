/**
 * Component: Admin Blocklist API
 * Documentation: documentation/features/release-blocklist.md
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "@/lib/middleware/auth";
import { prisma } from "@/lib/db";
import { RMABLogger } from "@/lib/utils/logger";

const logger = RMABLogger.create("API.Admin.Blocklist");

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    return requireAdmin(req, async () => {
      try {
        const blockedReleases = await prisma.blockedRelease.findMany({
          orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(blockedReleases);
      } catch (error) {
        logger.error("Failed to fetch blocklist", { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Failed to fetch blocklist" }, { status: 500 });
      }
    });
  });
}

export async function DELETE(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    return requireAdmin(req, async () => {
      try {
        const { count } = await prisma.blockedRelease.deleteMany({});
        logger.info(`Cleared all blocked releases (${count} entries)`);
        return NextResponse.json({ success: true, cleared: count });
      } catch (error) {
        logger.error("Failed to clear blocklist", { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Failed to clear blocklist" }, { status: 500 });
      }
    });
  });
}
