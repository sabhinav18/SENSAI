
"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    try {
        // 1️⃣ Generate AI insights first (slow operation, outside transaction)
        let insights = null;
        const existingIndustry = await db.industryInsight.findUnique({
            where: { industry: data.industry },
        });

        if (!existingIndustry) {
            insights = await generateAIInsights(data.industry);
        }

        // 2️⃣ Transaction for fast DB operations only
        const result = await db.$transaction(async (tx) => {
            let industryInsight = existingIndustry;

            if (!industryInsight && insights) {
                industryInsight = await tx.industryInsight.create({
                    data: {
                        industry: data.industry,
                        demandLevel: (insights.demandLevel || "MEDIUM").toUpperCase(),
                        marketOutlook: (insights.marketOutlook || "NEUTRAL").toUpperCase(),
                        salaryRanges: insights.salaryRanges || [],
                        growthRate: insights.growthRate || 0,
                        topSkills: insights.topSkills || [],
                        keyTrends: insights.keyTrends || [],
                        recommendedSkills: insights.recommendedSkills || [],
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }

            // Update the user
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: {
                    industry: data.industry,
                    experience: data.experience,
                    bio: data.bio,
                    skills: data.skills,
                },
            });

            return { updatedUser, industryInsight };
        });

        return { success: true, ...result };
    } catch (error) {
        console.error("Error updating user and industry:", error.message);
        throw new Error("Failed to update profile: " + error.message);
    }
}

export async function getUserOnboardingStatus() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { industry: true },
    });

    if (!user) throw new Error("User not found");

    return { isOnboarded: !!user?.industry };
}

