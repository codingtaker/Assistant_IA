import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { aiService } from "../services/ai";
import { buildPrompts } from "../services/pitch/prompts";
import { pitchRateLimiter } from "../middleware/rateLimiter";
import type { PitchRequestBody, GeneratedPitch } from "../types";

const router = Router();

const PitchRequestSchema = z.object({
  projectName: z.string().min(2).max(120),
  description: z.string().min(10).max(1000),
  targetMarket: z.string().min(5).max(500),
  uniqueValue: z.string().min(5).max(500),
  features: z.string().max(500).optional(),
  template: z.enum(["lean-canvas", "elevator-pitch", "investor-pitch", "executive-summary"]),
  provider: z.string().min(1).max(64).optional(),
  language: z.enum(["en", "fr"]).optional(),
});

// GET /api/pitch/providers — list available providers
router.get("/providers", (_req: Request, res: Response) => {
  const available = aiService.getAvailableProviders();
  res.json({ providers: available });
});

// POST /api/pitch/generate — generate a pitch
router.post(
  "/generate",
  pitchRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = PitchRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: {
            message: "Invalid request body",
            details: parseResult.error.flatten(),
          },
        });
        return;
      }

      const body = parseResult.data as PitchRequestBody;
      const { systemPrompt, userPrompt } = buildPrompts(body);

      const aiResponse = await aiService.complete(
        { systemPrompt, userPrompt, maxTokens: 2048, temperature: 0.7 },
        body.provider
      );

      // Parse the JSON returned by the LLM
      let parsed: { sections: { title: string; content: string }[] };
      try {
        parsed = JSON.parse(aiResponse.content);
      } catch {
        // LLM returned non-JSON — wrap as single section
        parsed = {
          sections: [{ title: "Generated Pitch", content: aiResponse.content }],
        };
      }

      const pitch: GeneratedPitch = {
        id: randomUUID(),
        template: body.template,
        provider: aiResponse.provider as GeneratedPitch["provider"],
        model: aiResponse.model,
        projectName: body.projectName,
        sections: parsed.sections,
        rawContent: aiResponse.content,
        generatedAt: new Date().toISOString(),
      };

      res.status(201).json({ pitch });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
