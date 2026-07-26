import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        resumes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      resumes: user.resumes,
    });
  } catch (err: any) {
    console.error("❌ Error fetching resumes:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch resumes",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("id");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.resume.delete({
      where: {
        id: resumeId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, message: "Resume deleted" });
  } catch (err: any) {
    console.error("❌ Error deleting resume:", err);
    return NextResponse.json(
      { error: "Failed to delete resume", details: err?.message },
      { status: 500 }
    );
  }
}


