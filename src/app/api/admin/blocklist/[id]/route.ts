/**
 * Component: Admin Blocklist Entry API
 * Documentation: documentation/features/release-blocklist.md
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "@/lib/middleware/auth";
import { prisma } from "@/lib/db";
import { RMABLogger } from "@/lib/utils/logger";

const logger = RMABLogger.create("API.Admin.Blocklist");

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    return requireAdmin(req, async () => {
      try {
        const { id } = await params;

        const deleted = await prisma.blockedRelease.delete({
          where: { id },
        });

        logger.info(`Removed blocked release: "${deleted.releaseName}"`);
        return NextResponse.json({ success: true, deleted });
      } catch (error) {
        logger.error("Failed to remove blocked release", { error: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Blocked release not found" }, { status: 404 });
      }
    });
  });
}
