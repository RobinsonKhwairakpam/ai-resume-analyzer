import { auth } from '@clerk/nextjs/server';
import prisma from '../prisma';

export async function getResumeAnalysis(resumeId: string) {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        throw new Error('Unauthorized access to resume data');
    }

    const resume = await prisma.resume.findUnique({
        where: {
            id: resumeId,
        }
    })

    if (resume) {
        return resume
    }

    return null;
}