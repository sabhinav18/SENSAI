"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId},
    });

    if(!user) throw new Error("User not found")

    try {
        const result = await db.$transaction(
            async (tx) => {
                //find if the industry exist
                let industryInsight =  await tx.industryInsight.findUnique({
                    where: {
                        industry: data.industry,
                    },
                });

                //if industry doesn't exists, create it with default value - will replace it with ai later
                if(!industryInsight) {
                    const insights = await generateAIInsights(data.industry);

                    industryInsight = await tx.industryInsight.create({
                        data: {
                            industry: data.industry,
                            demandLevel: (insights.demandLevel || "MEDIUM").toUpperCase(), // ✅ ensure enum is uppercase
                            marketOutlook: (insights.marketOutlook || "NEUTRAL").toUpperCase(), // same for MarketOutlook enum
                            salaryRanges: insights.salaryRanges || [],
                            growthRate: insights.growthRate || 0,
                            topSkills: insights.topSkills || [],
                            keyTrends: insights.keyTrends || [],
                            recommendedSkills: insights.recommendedSkills || [],
                            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    });


                    // industryInsight = await tx.industryInsight.create({
                    //     data: {
                    //         industry: data.industry,
                    //         salaryRanges: [],
                    //         growthRate: 0,
                    //         demandLevel: "MEDIUM",
                    //         topSkills: [],
                    //         marketOutlook: "NEUTRAL",
                    //         keyTrends: [],
                    //         nextUpdate: new Date(Date.now() + 7 * 24 * 60* 60 * 1000)
                    //     }
                    // })




                    // const insights = await generateAIInsights(data.industry);

                    // industryInsight = await db.industryInsight.create({
                    //     data: {
                    //         industry: data.industry,
                    //         demandLevel: "High"|| "Medium" || "Low",
                    //         ...insights,
                    //         nextUpdate: new Date(Date.now() + 7*24*60*60*100),
                    //     },
                    // });
                }

                //const updated user

                const updatedUser = await tx.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        industry: data.industry,
                        experience: data.experience,
                        bio: data.bio,
                        skills: data.skills,
                    },
                });
                return { updatedUser, industryInsight };
            },
            {
                timeout: 10000,
            }
        );
        return {success: true, ...result};
    } catch (error) {
        console.error("Error updating user and industry:", error.message);
        throw new Error("Failed to update profile" + error.message);
    }
}


export async function getUserOnboardingStatus() {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId},
    });

    if(!user) throw new Error("User not found")

    try {
        const user = await db.user.findUnique({
            where:{
                clerkUserId: userId,
            },
            select: {
                industry: true,
            },
        });

         

            // User is onboarded if industry exists
            return { isOnboarded: !!user?.industry };

       
    } catch (error) {
        console.error("Error updating user and industry:", error.message);
        throw new Error("Failed to update profile");
    }

}
