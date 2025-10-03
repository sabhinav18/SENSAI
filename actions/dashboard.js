

// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// export const generateAIInsights = async (industry) => {
//   const prompt = `
//     Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
//     {
//       "salaryRanges": [
//         { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
//       ],
//       "growthRate": number,
//       "demandLevel": "High" | "Medium" | "Low",
//       "topSkills": ["skill1", "skill2"],
//       "marketOutlook": "Positive" | "Neutral" | "Negative",
//       "keyTrends": ["trend1", "trend2"],
//       "recommendedSkills": ["skill1", "skill2"]
//     }
//     IMPORTANT: Return ONLY the JSON.
//   `;

//   const result = await model.generateContent(prompt);
//   const text = result.response.text();
//   const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
//   const parsed = JSON.parse(cleanedText);

//   return {
//     ...parsed,
//     demandLevel: parsed.demandLevel?.toUpperCase(),
//     marketOutlook: parsed.marketOutlook?.toUpperCase(),
//   };
// };

// export async function getIndustryInsights() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   // Fetch user without starting a transaction
//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//     include: { industryInsight: true },
//   });

//   if (!user) throw new Error("User not found");

//   const industry = user.industry || "General";

//   // Only generate AI insights if none exist
//   if (!user.industryInsight) {
//     // 1️⃣ Generate AI data first (slow)
//     const insights = await generateAIInsights(industry);

//     // 2️⃣ Insert into DB (fast, no long-running operation inside transaction)
//     const industryInsight = await db.industryInsight.create({
//       data: {
//         industry,
//         ...insights,
//         nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
//       },
//     });

//     return industryInsight;
//   }

//   return user.industryInsight;
// }




"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }
    IMPORTANT: Return ONLY the JSON.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
  const parsed = JSON.parse(cleanedText);

  return {
    ...parsed,
    demandLevel: parsed.demandLevel?.toUpperCase(),
    marketOutlook: parsed.marketOutlook?.toUpperCase(),
  };
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  const industry = user.industry || "General";

  // Generate AI insights only if none exist
  let insights = null;
  if (!user.industryInsight) {
    insights = await generateAIInsights(industry);
  }

  // Use upsert to safely create or update
  const industryInsight = await db.industryInsight.upsert({
    where: { industry },
    update: insights
      ? {
          demandLevel: insights.demandLevel || "MEDIUM",
          marketOutlook: insights.marketOutlook || "NEUTRAL",
          salaryRanges: insights.salaryRanges || [],
          growthRate: insights.growthRate || 0,
          topSkills: insights.topSkills || [],
          keyTrends: insights.keyTrends || [],
          recommendedSkills: insights.recommendedSkills || [],
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      : {},
    create: insights
      ? {
          industry,
          demandLevel: insights.demandLevel || "MEDIUM",
          marketOutlook: insights.marketOutlook || "NEUTRAL",
          salaryRanges: insights.salaryRanges || [],
          growthRate: insights.growthRate || 0,
          topSkills: insights.topSkills || [],
          keyTrends: insights.keyTrends || [],
          recommendedSkills: insights.recommendedSkills || [],
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      : {
          industry,
          demandLevel: "MEDIUM",
          marketOutlook: "NEUTRAL",
          salaryRanges: [],
          growthRate: 0,
          topSkills: [],
          keyTrends: [],
          recommendedSkills: [],
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
  });

  return industryInsight;
}

