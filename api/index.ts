import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, ApiError } from "@google/genai";

// Load environment variables (no-op on Vercel, which injects env vars directly)
dotenv.config();

const app = express();

app.use(express.json());

// Helper functions for Hevy API
async function fetchAllExerciseTemplates(apiKey: string): Promise<Record<string, { id: string, name: string, primary_muscle_group: string }>> {
  const map: Record<string, { id: string, name: string, primary_muscle_group: string }> = {};
  
  let page = 1;
  // La API de Hevy usa "pageSize" (no "limit"); para /v1/exercise_templates el máximo real es 100.
  const pageSize = 100;
  let hasMore = true;

  while (hasMore && page <= 20) {
    try {
      const response = await fetch(`https://api.hevyapp.com/v1/exercise_templates?page=${page}&pageSize=${pageSize}`, {
        headers: {
          "api-key": apiKey,
          "accept": "application/json"
        }
      });
      if (!response.ok) {
        console.error(`Failed to fetch exercise templates page ${page}: ${response.status}`);
        break;
      }
      const data: any = await response.json();
      const templates = data.exercise_templates || data.templates || (Array.isArray(data) ? data : []);
      const pageCount = data.page_count;

      if (templates.length === 0) {
        hasMore = false;
      } else {
        templates.forEach((tpl: any) => {
          const id = tpl.id || tpl.exercise_template_id;
          const muscle = tpl.primary_muscle_group || tpl.primaryMuscleGroup || tpl.muscle_group || "";
          const name = tpl.title || tpl.name || "";
          if (id) {
            map[id] = { id, name, primary_muscle_group: muscle.toLowerCase() };
          }
        });
        // Usar page_count de la API cuando está disponible; si no, inferir por tamaño de página.
        if (typeof pageCount === "number" ? page >= pageCount : templates.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (err) {
      console.error(`Error fetching exercise templates page ${page}:`, err);
      break;
    }
  }
  
  return map;
}

async function fetchSingleExerciseTemplate(apiKey: string, id: string): Promise<{ id: string, name: string, primary_muscle_group: string } | null> {
  try {
    const response = await fetch(`https://api.hevyapp.com/v1/exercise_templates/${id}`, {
      headers: {
        "api-key": apiKey,
        "accept": "application/json"
      }
    });
    if (response.ok) {
      const tpl: any = await response.json();
      const muscle = tpl.primary_muscle_group || tpl.primaryMuscleGroup || tpl.muscle_group || "";
      const name = tpl.title || tpl.name || "";
      return {
        id: tpl.id || id,
        name,
        primary_muscle_group: muscle.toLowerCase()
      };
    }
  } catch (err) {
    console.error(`Error fetching single exercise template ${id}:`, err);
  }
  return null;
}

function getMovementPattern(muscle: string): 'empuje' | 'jalon' | 'pierna' | null {
  const m = muscle.toLowerCase().trim();
  
  if (
    m.includes('abs') || 
    m.includes('core') || 
    m.includes('cardio') || 
    m.includes('oblique') || 
    m.includes('abdominal')
  ) {
    return null;
  }
  
  if (
    m === 'chest' || m.includes('chest') ||
    m === 'shoulders' || m.includes('shoulder') ||
    m === 'triceps' || m.includes('tricep')
  ) {
    return 'empuje';
  }
  
  if (
    m === 'back' || m.includes('back') ||
    m === 'biceps' || m.includes('bicep') ||
    m === 'forearms' || m.includes('forearm')
  ) {
    return 'jalon';
  }
  
  if (
    m === 'quadriceps' || m.includes('quad') ||
    m === 'hamstrings' || m.includes('hamstring') ||
    m === 'glutes' || m.includes('glute') ||
    m === 'calves' || m.includes('calf') ||
    m.includes('leg')
  ) {
    return 'pierna';
  }
  
  return null;
}

const COACH_SYSTEM_PROMPT = `Sos el coach personal de fuerza de NextPR, un asistente que conoce el historial de entrenamiento del usuario. Respondé siempre en español, de forma breve, concreta y directa, como lo haría un entrenador experimentado.

Reglas importantes:
- Solo podés basarte en los datos de entrenamiento que se te entregan a continuación como contexto.
- Si te preguntan algo que no podés responder con esos datos (un ejercicio que no aparece, un período sin registros, o cualquier dato que no esté en el contexto), decilo explícitamente en vez de inventar una respuesta.
- No inventes números, fechas ni récords que no estén en el contexto entregado.`;

// API: Chat with the NextPR AI Coach (Gemini), grounded on a bounded training summary
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const summary = typeof req.body?.summary === "string" ? req.body.summary : "";

  if (!apiKey) {
    return res.status(400).json({
      error: "api_key_missing",
      message: "GEMINI_API_KEY no está configurada en el servidor."
    });
  }

  if (!message) {
    return res.status(400).json({ error: "empty_message", message: "El mensaje no puede estar vacío." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `${COACH_SYSTEM_PROMPT}\n\nDATOS DE ENTRENAMIENTO DEL USUARIO:\n${summary || "Sin datos de entrenamiento disponibles."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: message,
      config: {
        systemInstruction,
        httpOptions: { timeout: 20000 }
      }
    });

    return res.json({ reply: response.text });
  } catch (err: any) {
    console.error("[NextPR Server] Gemini chat error:", err);

    if (err instanceof ApiError) {
      if (err.status === 429) {
        return res.status(429).json({
          error: "rate_limit",
          message: "Demasiadas consultas seguidas al coach IA. Esperá unos segundos e intentá de nuevo."
        });
      }
      return res.status(502).json({
        error: "gemini_api_error",
        message: `El coach IA no pudo responder (${err.status}). Intenta de nuevo en un momento.`
      });
    }

    if (err?.name === "AbortError" || /timeout/i.test(err?.message || "")) {
      return res.status(504).json({
        error: "timeout",
        message: "El coach IA tardó demasiado en responder. Intenta de nuevo."
      });
    }

    return res.status(500).json({
      error: "server_error",
      message: "No se pudo contactar al coach IA. Intenta nuevamente."
    });
  }
});

// API: Validate a Hevy Developer API key by calling the real Hevy API
app.post("/api/hevy/validate", async (req, res) => {
  const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";

  if (!apiKey) {
    return res.status(400).json({ valid: false, error: "missing_api_key", message: "Debes ingresar una API Key." });
  }

  try {
    const response = await fetch("https://api.hevyapp.com/v1/workouts?page=1&limit=1", {
      headers: { "api-key": apiKey, "accept": "application/json" }
    });

    if (response.ok) {
      return res.json({ valid: true });
    }
    if (response.status === 401 || response.status === 403) {
      return res.status(401).json({
        valid: false,
        error: "invalid_api_key",
        message: "API Key inválida o sin permisos. Verifica que la copiaste correctamente desde Hevy."
      });
    }
    return res.status(502).json({
      valid: false,
      error: "hevy_api_error",
      message: `Error inesperado de la API de Hevy (${response.status}).`
    });
  } catch (err: any) {
    console.error("Hevy validate API error:", err);
    return res.status(500).json({ valid: false, error: "server_error", message: "No se pudo contactar a Hevy. Intenta nuevamente." });
  }
});

// API: Sync with Hevy Developer API
app.get("/api/sync-hevy", async (req, res) => {
  const clientKey = req.header("x-hevy-api-key");
  const apiKey = (clientKey && clientKey.trim()) || process.env.HEVY_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: "api_key_missing",
      message: "No hay ninguna API Key de Hevy configurada. Conéctala desde \"Conectar aplicaciones\"."
    });
  }

  try {
    // Fetch all workouts from Hevy Developer API using pagination to get the complete history.
    // La API de Hevy usa "pageSize" (no "limit"); para /v1/workouts el máximo real es 10.
    let page = 1;
    let rawWorkouts: any[] = [];
    let fetchMore = true;
    const pageSize = 10;
    const maxPages = 300; // Safe ceiling of 3000 workouts to prevent timeout/quota issues, normally covers full history

    while (fetchMore && page <= maxPages) {
      console.log(`[NextPR Server] Fetching Hevy workouts page ${page}...`);
      const response = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=${pageSize}`, {
        method: "GET",
        headers: {
          "api-key": apiKey,
          "accept": "application/json"
        }
      });

      if (!response.ok) {
        if (page === 1) {
          const errorText = await response.text();
          return res.status(response.status).json({
            error: "hevy_api_error",
            message: `Error de la API de Hevy (${response.status}): ${errorText || response.statusText}`
          });
        } else {
          console.error(`[NextPR Server] Failed to fetch page ${page}. Stopping pagination.`, response.statusText);
          break;
        }
      }

      const data = await response.json();
      const pageWorkouts = data.workouts || [];
      const pageCount = data.page_count;

      if (pageWorkouts.length === 0) {
        fetchMore = false;
      } else {
        rawWorkouts = rawWorkouts.concat(pageWorkouts);
        // Usar page_count de la API cuando está disponible; si no, inferir por tamaño de página.
        if (typeof pageCount === "number" ? page >= pageCount : pageWorkouts.length < pageSize) {
          fetchMore = false;
        } else {
          page++;
        }
      }
    }

    console.log(`[NextPR Server] Dynamic Sync successfully fetched ${rawWorkouts.length} total workouts across ${page} page(s).`);

    if (rawWorkouts.length === 0) {
      return res.json({
        success: true,
        empty: true,
        message: "No se encontraron entrenamientos en Hevy para esta cuenta.",
        exercises: []
      });
    }

    // Collect all unique exercise template IDs present in the workouts
    const uniqueTemplateIds = new Set<string>();
    rawWorkouts.forEach((wk: any) => {
      const exercisesList = wk.exercises || [];
      exercisesList.forEach((item: any) => {
        const tplId = item.exercise_template_id || item.id;
        if (tplId) {
          uniqueTemplateIds.add(tplId);
        }
      });
    });

    // Fetch catalog of templates & supplement any missing ones
    const templatesLookup = await fetchAllExerciseTemplates(apiKey);
    const missingIds = Array.from(uniqueTemplateIds).filter(id => !templatesLookup[id]);
    if (missingIds.length > 0) {
      console.log(`Fetching ${missingIds.length} missing templates individually...`);
      const promises = missingIds.map(async (id) => {
        const tpl = await fetchSingleExerciseTemplate(apiKey, id);
        if (tpl) {
          templatesLookup[tpl.id] = tpl;
        }
      });
      await Promise.all(promises);
    }

    // Parse exercises dynamically from the workout history instead of static templates
    const exercisesMap: Record<string, {
      name: string;
      templateId: string;
      primaryMuscleGroup: string;
      pattern: 'empuje' | 'jalon' | 'pierna' | null;
      logs: { date: string; weight: number; reps: number; sets: number; volume: number; est1RM: number }[];
    }> = {};

    let minDateMs = Infinity;

    rawWorkouts.forEach((wk: any) => {
      const startTime = wk.start_time;
      if (!startTime) return;
      const dateStr = startTime.substring(0, 10); // YYYY-MM-DD
      const dateMs = new Date(startTime).getTime();
      if (dateMs < minDateMs) {
        minDateMs = dateMs;
      }

      const exercisesList = wk.exercises || [];
      exercisesList.forEach((item: any) => {
        const tplId = item.exercise_template_id || item.id;
        if (!tplId) return;

        const title = item.title || (templatesLookup[tplId] ? templatesLookup[tplId].name : "") || "Ejercicio Desconocido";
        const sets = item.sets || [];
        if (sets.length === 0) return;

        // Find best set (highest weight) and total volume
        let bestWeight = 0;
        let bestReps = 0;
        let totalVolume = 0;

        // TEMP DEBUG: ver los campos crudos de peso que manda la API de Hevy
        if (title.toLowerCase().includes('press')) {
          console.log(`[NextPR Debug] "${title}" sets crudos:`, JSON.stringify(sets));
        }

        sets.forEach((set: any) => {
          const w = parseFloat(set.weight_kg) || parseFloat(set.weight) || 0;
          const r = parseInt(set.reps) || 0;

          if (w > 0) {
            totalVolume += w * r;
            if (w > bestWeight) {
              bestWeight = w;
              bestReps = r;
            }
          }
        });

        // Only include if there is valid weight
        if (bestWeight > 0) {
          // Check lookup for muscle group and pattern
          const tplInfo = templatesLookup[tplId];
          const muscle = tplInfo ? tplInfo.primary_muscle_group : "";
          const pattern = getMovementPattern(muscle);

          if (!exercisesMap[tplId]) {
            exercisesMap[tplId] = {
              name: title,
              templateId: tplId,
              primaryMuscleGroup: muscle,
              pattern,
              logs: []
            };
          }

          const est1RM = bestReps === 1 ? bestWeight : Math.round(bestWeight * (1 + 0.0333 * bestReps) * 10) / 10;

          exercisesMap[tplId].logs.push({
            date: dateStr,
            weight: bestWeight,
            reps: bestReps,
            sets: sets.length,
            volume: Math.round(totalVolume),
            est1RM
          });
        }
      });
    });

    // Handle case if no logs found
    const hasAnyLogs = Object.keys(exercisesMap).length > 0;
    if (!hasAnyLogs) {
      return res.json({
        success: true,
        empty: true,
        message: "No se encontraron ejercicios con pesas registrados en tus entrenamientos de Hevy (se requiere peso > 0).",
        exercises: []
      });
    }

    // Set fallback minDateMs if invalid
    if (minDateMs === Infinity) {
      minDateMs = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago fallback
    }

    // Selection criteria for primary exercises
    const now = Date.now();
    const limit60Days = now - 60 * 24 * 60 * 60 * 1000;
    const limit28Days = now - 28 * 24 * 60 * 60 * 1000;

    const patternExercises: Record<'empuje' | 'jalon' | 'pierna', string[]> = {
      empuje: [],
      jalon: [],
      pierna: []
    };

    const exerciseStats: Record<string, {
      sessionsLast60Days: number;
      weightVariationLast4Weeks: number;
      totalSessions: number;
    }> = {};

    Object.entries(exercisesMap).forEach(([id, data]) => {
      const logs = data.logs;
      const totalSessions = logs.length;

      // Count sessions in last 60 days
      const sessionsLast60Days = logs.filter(l => new Date(l.date).getTime() >= limit60Days).length;

      // Calculate max weight variation in last 4 weeks (28 days)
      const logsLast4Weeks = logs.filter(l => new Date(l.date).getTime() >= limit28Days);
      let weightVariationLast4Weeks = 0;
      if (logsLast4Weeks.length > 0) {
        const weights = logsLast4Weeks.map(l => l.weight);
        weightVariationLast4Weeks = Math.max(...weights) - Math.min(...weights);
      }

      exerciseStats[id] = {
        sessionsLast60Days,
        weightVariationLast4Weeks,
        totalSessions
      };

      if (data.pattern) {
        patternExercises[data.pattern].push(id);
      }
    });

    // Find winners for each pattern
    const winners: Record<'empuje' | 'jalon' | 'pierna', string | null> = {
      empuje: null,
      jalon: null,
      pierna: null
    };

    (['empuje', 'jalon', 'pierna'] as const).forEach(pattern => {
      const candidates = patternExercises[pattern].filter(id => {
        // Exclude exercises with less than 2 total registered sessions
        return exerciseStats[id].totalSessions >= 2;
      });

      if (candidates.length > 0) {
        // Sort according to selection rules:
        // 1. Most sessions in last 60 days
        // 2. Highest variation of max weight in last 4 weeks (progression)
        // 3. Highest total sessions
        // 4. Alphabetical by ID as ultimate desempate
        candidates.sort((a, b) => {
          const statsA = exerciseStats[a];
          const statsB = exerciseStats[b];

          if (statsA.sessionsLast60Days !== statsB.sessionsLast60Days) {
            return statsB.sessionsLast60Days - statsA.sessionsLast60Days;
          }
          if (statsA.weightVariationLast4Weeks !== statsB.weightVariationLast4Weeks) {
            return statsB.weightVariationLast4Weeks - statsA.weightVariationLast4Weeks;
          }
          if (statsA.totalSessions !== statsB.totalSessions) {
            return statsB.totalSessions - statsA.totalSessions;
          }
          return a.localeCompare(b);
        });

        winners[pattern] = candidates[0];
      }
    });

    // Map to final Exercise array format
    const mappedExercises = Object.entries(exercisesMap).map(([id, data]) => {
      const rawLogs = data.logs;
      
      // Sort raw logs chronologically
      rawLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Group into weekly logs
      const weeklyLogsMap: Record<number, typeof rawLogs[0]> = {};
      
      rawLogs.forEach(log => {
        const logMs = new Date(log.date).getTime();
        // Calculate week index (1-based)
        const weekIndex = Math.max(1, Math.floor((logMs - minDateMs) / (7 * 24 * 60 * 60 * 1000)) + 1);

        // If multiple entries in the same week, pick the heavier one
        if (!weeklyLogsMap[weekIndex] || log.weight > weeklyLogsMap[weekIndex].weight) {
          weeklyLogsMap[weekIndex] = log;
        }
      });

      // Transform to the LiftLog interface format
      const finalLogs = Object.keys(weeklyLogsMap).map(weekStr => {
        const weekNum = parseInt(weekStr);
        const logData = weeklyLogsMap[weekNum];
        return {
          week: weekNum,
          date: logData.date,
          weight: logData.weight,
          reps: logData.reps,
          sets: logData.sets,
          volume: logData.volume
        };
      }).sort((a, b) => a.week - b.week);

      // Determine starting point, maximum and milestones
      const maxEst1RM = rawLogs.length > 0 ? Math.max(...rawLogs.map(l => l.est1RM)) : 100;
      const firstEst1RM = rawLogs.length > 0 ? rawLogs[0].est1RM : 80;
      
      const current1RM = Math.round(maxEst1RM * 10) / 10;
      const baseline1RM = Math.round(firstEst1RM * 10) / 10;
      const target1RM = Math.round((current1RM * 1.25) / 2.5) * 2.5 || current1RM + 10;

      // TEMP DEBUG: comparar peso crudo/reps vs. el 1RM calculado
      if (data.name.toLowerCase().includes('shoulder press') || data.name.toLowerCase().includes('press')) {
        console.log(`[NextPR Debug] "${data.name}": current1RM=${current1RM}kg. Sets crudos:`,
          rawLogs.map(l => `${l.date}: ${l.weight}kg x${l.reps}reps -> est1RM=${l.est1RM}`).join(' | '));
      }

      // Assign category and pattern
      const category = (data.pattern && winners[data.pattern] === id) ? 'primary' as const : 'secondary' as const;

      // Find last improvement date
      let lastImprovementDate = new Date(minDateMs).toISOString().substring(0, 10);
      const peakLog = rawLogs.find(l => l.est1RM === maxEst1RM);
      if (peakLog) {
        lastImprovementDate = peakLog.date;
      }

      return {
        id,
        name: data.name,
        category,
        pattern: data.pattern || undefined,
        current1RM,
        target1RM,
        baseline1RM,
        logs: finalLogs,
        lastImprovementDate,
        unit: 'kg'
      };
    });

    // Sort by: primary first, then secondary, and sub-sort by log count descending
    mappedExercises.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'primary' ? -1 : 1;
      }
      return b.logs.length - a.logs.length;
    });

    res.json({
      success: true,
      exercises: mappedExercises
    });

  } catch (err: any) {
    console.error("Hevy Sync API Error:", err);
    res.status(500).json({
      error: "server_error",
      message: `Error al procesar la sincronización: ${err.message || err}`
    });
  }
});

// The Express app is exported so it can be reused by:
//  - dev.ts (local development: adds Vite middleware + listens on a port)
//  - api/index.ts (Vercel: served as a serverless function for /api/* routes)
export default app;
