import { Router } from "express";
import {
  CEFR_DESCRIPTIONS,
  CEFR_LEVELS,
  TARGET_LANGUAGES,
} from "../constants/languages";

export const languagesRouter = Router();

languagesRouter.get("/", (_req, res) => {
  res.json({
    languages: TARGET_LANGUAGES,
    levels: CEFR_LEVELS.map((level) => ({
      level,
      description: CEFR_DESCRIPTIONS[level],
    })),
  });
});
