const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || "7d";
const PHYSICAL_ACTIVITY_FACTORS = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  alto: 1.725,
  muitoAlto: 1.9,
};
const PHYSICAL_GOALS = new Set(["perder", "manter", "ganhar"]);
const PHYSICAL_SEX_OPTIONS = new Set(["masculino", "feminino"]);
const CIRCUMFERENCE_TYPES = new Set(["cintura", "quadril", "pescoco", "braco", "coxa"]);
const SKINFOLD_SITES = new Set([
  "triceps",
  "subescapular",
  "suprailiaca",
  "abdominal",
  "peitoral",
  "axilarMedia",
  "coxa",
  "panturrilha",
]);

if (!DATABASE_URL) {
  console.error("DATABASE_URL nao configurada. Defina no arquivo .env.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET nao configurada. Usando valor padrao inseguro para desenvolvimento.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

app.use(cors());
app.use(express.json());

async function ensureDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Nutricionista',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      age INTEGER,
      goal TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      current_weight DOUBLE PRECISION,
      target_weight DOUBLE PRECISION,
      target_weight_set_at TIMESTAMPTZ,
      target_history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      weight_history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Outros',
      measurement_basis TEXT NOT NULL DEFAULT '100g',
      calories DOUBLE PRECISION NOT NULL CHECK (calories >= 0),
      protein DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (protein >= 0),
      carbs DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (carbs >= 0),
      fat DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (fat >= 0),
      fiber DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (fiber >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
      type TEXT NOT NULL DEFAULT 'Consulta',
      notes TEXT NOT NULL DEFAULT '',
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS groups_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS substitutions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS current_weight DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS target_weight DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS target_weight_set_at TIMESTAMPTZ;
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS target_history_json JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS weight_history_json JSONB NOT NULL DEFAULT '[]'::jsonb;
  `);

  await pool.query(`
    UPDATE patients
    SET target_history_json = '[]'::jsonb
    WHERE target_history_json IS NULL;
  `);

  await pool.query(`
    UPDATE patients
    SET weight_history_json = '[]'::jsonb
    WHERE weight_history_json IS NULL;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id);
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS measurement_basis TEXT;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS category TEXT;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS protein DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS carbs DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS fat DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE foods
    ADD COLUMN IF NOT EXISTS fiber DOUBLE PRECISION;
  `);

  await pool.query(`
    ALTER TABLE foods
    ALTER COLUMN calories TYPE DOUBLE PRECISION USING calories::DOUBLE PRECISION;
  `);

  await pool.query(`
    UPDATE foods
    SET
      category = COALESCE(NULLIF(TRIM(category), ''), 'Outros'),
      measurement_basis = COALESCE(measurement_basis, '100g'),
      protein = COALESCE(protein, 0),
      carbs = COALESCE(carbs, 0),
      fat = COALESCE(fat, 0),
      fiber = COALESCE(fiber, 0);
  `);

  await pool.query(`
    ALTER TABLE foods
    ALTER COLUMN category SET DEFAULT 'Outros',
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN measurement_basis SET DEFAULT '100g',
    ALTER COLUMN measurement_basis SET NOT NULL,
    ALTER COLUMN protein SET DEFAULT 0,
    ALTER COLUMN protein SET NOT NULL,
    ALTER COLUMN carbs SET DEFAULT 0,
    ALTER COLUMN carbs SET NOT NULL,
    ALTER COLUMN fat SET DEFAULT 0,
    ALTER COLUMN fat SET NOT NULL,
    ALTER COLUMN fiber SET DEFAULT 0,
    ALTER COLUMN fiber SET NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
  `);

  await pool.query(`
    ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Consulta';
  `);

  await pool.query(`
    ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
  `);

  await pool.query(`
    UPDATE consultations
    SET scheduled_at = created_at
    WHERE scheduled_at IS NULL;
  `);

  await pool.query(`
    ALTER TABLE consultations
    ALTER COLUMN scheduled_at SET NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_consultations_user_scheduled_at
    ON consultations(user_id, scheduled_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_user_patient ON plans(user_id, patient_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS physical_assessments (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
      assessment_date DATE NOT NULL,
      weight_kg DOUBLE PRECISION NOT NULL CHECK (weight_kg > 0),
      height_cm DOUBLE PRECISION NOT NULL CHECK (height_cm > 0),
      age INTEGER NOT NULL CHECK (age > 0),
      sex TEXT NOT NULL CHECK (sex IN ('masculino', 'feminino')),
      activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentario', 'leve', 'moderado', 'alto', 'muitoAlto')),
      goal TEXT NOT NULL CHECK (goal IN ('perder', 'manter', 'ganhar')),
      notes TEXT NOT NULL DEFAULT '',
      bmr DOUBLE PRECISION NOT NULL,
      tdee DOUBLE PRECISION NOT NULL,
      calorie_target DOUBLE PRECISION NOT NULL,
      protein_g DOUBLE PRECISION NOT NULL,
      fat_g DOUBLE PRECISION NOT NULL,
      carbs_g DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_physical_assessments_user_patient_date
    ON physical_assessments(user_id, patient_id, assessment_date DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS circumference_measurements (
      id TEXT PRIMARY KEY,
      assessment_id TEXT REFERENCES physical_assessments(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('cintura', 'quadril', 'pescoco', 'braco', 'coxa')),
      value_cm DOUBLE PRECISION NOT NULL CHECK (value_cm > 0)
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_circumference_measurement_unique
    ON circumference_measurements(assessment_id, type);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS skinfold_measurements (
      id TEXT PRIMARY KEY,
      assessment_id TEXT REFERENCES physical_assessments(id) ON DELETE CASCADE,
      site TEXT NOT NULL CHECK (site IN ('triceps', 'subescapular', 'suprailiaca', 'abdominal', 'peitoral', 'axilarMedia', 'coxa', 'panturrilha')),
      value_mm DOUBLE PRECISION NOT NULL CHECK (value_mm >= 2 AND value_mm <= 60)
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_skinfold_measurement_unique
    ON skinfold_measurements(assessment_id, site);
  `);
}

function validatePatient(body) {
  if (!body.name || typeof body.name !== "string") {
    return "Nome do paciente e obrigatorio.";
  }
  if (body.age !== undefined && (!Number.isFinite(body.age) || body.age < 0)) {
    return "Idade precisa ser um numero valido.";
  }
  if (body.currentWeight !== undefined && body.currentWeight !== null && body.currentWeight !== "") {
    const parsedWeight = Number(body.currentWeight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      return "Peso atual precisa ser um numero maior que zero.";
    }
  }
  if (body.targetWeight !== undefined && body.targetWeight !== null && body.targetWeight !== "") {
    const parsedTargetWeight = Number(body.targetWeight);
    if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) {
      return "Meta de peso precisa ser um numero maior que zero.";
    }
  }
  if (body.weightHistory !== undefined) {
    if (!Array.isArray(body.weightHistory)) {
      return "Historico de peso invalido.";
    }
    for (const entry of body.weightHistory) {
      const parsedWeight = Number(entry?.weight);
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
        return "Historico de peso contem valores invalidos.";
      }
      const parsedDate = new Date(entry?.recordedAt || "");
      if (Number.isNaN(parsedDate.getTime())) {
        return "Historico de peso contem datas invalidas.";
      }
    }
  }
  if (body.targetHistory !== undefined) {
    if (!Array.isArray(body.targetHistory)) {
      return "Historico de metas invalido.";
    }
    for (const entry of body.targetHistory) {
      const parsedTargetWeight = Number(entry?.targetWeight);
      if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) {
        return "Historico de metas contem valores invalidos.";
      }
      const parsedDate = new Date(entry?.setAt || "");
      if (Number.isNaN(parsedDate.getTime())) {
        return "Historico de metas contem datas invalidas.";
      }
    }
  }
  return null;
}

function normalizeWeightHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .map((entry) => {
      const parsedWeight = Number(entry?.weight);
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) return null;
      const parsedDate = new Date(entry?.recordedAt || Date.now());
      if (Number.isNaN(parsedDate.getTime())) return null;
      return {
        id:
          typeof entry?.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        weight: Number(parsedWeight.toFixed(2)),
        recordedAt: parsedDate.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

function buildAssessmentWeightEntry(assessmentId, assessmentDate, weightKg) {
  const parsedDate = new Date(`${assessmentDate}T12:00:00.000Z`);
  const recordedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  return {
    id: `assessment-${assessmentId}`,
    weight: Number(Number(weightKg).toFixed(2)),
    recordedAt,
  };
}

async function syncPatientWeightFromAssessment(client, { userId, patientId, assessmentId, assessmentDate, weightKg }) {
  const patientResult = await client.query(
    `
      SELECT weight_history_json AS "weightHistory"
      FROM patients
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE;
    `,
    [patientId, userId],
  );
  if (!patientResult.rows.length) return;

  const assessmentEntry = buildAssessmentWeightEntry(assessmentId, assessmentDate, weightKg);
  const baseHistory = Array.isArray(patientResult.rows[0].weightHistory) ? patientResult.rows[0].weightHistory : [];
  const historyWithoutAssessment = baseHistory.filter(
    (entry) => String(entry?.id || "").trim() !== assessmentEntry.id,
  );
  const nextWeightHistory = normalizeWeightHistory([...historyWithoutAssessment, assessmentEntry]);
  const nextCurrentWeight = nextWeightHistory.length
    ? nextWeightHistory[nextWeightHistory.length - 1].weight
    : assessmentEntry.weight;

  await client.query(
    `
      UPDATE patients
      SET
        current_weight = $3,
        weight_history_json = $4::jsonb
      WHERE id = $1 AND user_id = $2;
    `,
    [patientId, userId, nextCurrentWeight, JSON.stringify(nextWeightHistory)],
  );
}

async function removeAssessmentWeightFromPatient(client, { userId, patientId, assessmentId }) {
  const patientResult = await client.query(
    `
      SELECT weight_history_json AS "weightHistory"
      FROM patients
      WHERE id = $1 AND user_id = $2
      LIMIT 1
      FOR UPDATE;
    `,
    [patientId, userId],
  );
  if (!patientResult.rows.length) return;

  const assessmentEntryId = `assessment-${assessmentId}`;
  const baseHistory = Array.isArray(patientResult.rows[0].weightHistory) ? patientResult.rows[0].weightHistory : [];
  const nextWeightHistory = normalizeWeightHistory(
    baseHistory.filter((entry) => String(entry?.id || "").trim() !== assessmentEntryId),
  );
  const nextCurrentWeight = nextWeightHistory.length ? nextWeightHistory[nextWeightHistory.length - 1].weight : null;

  await client.query(
    `
      UPDATE patients
      SET
        current_weight = $3,
        weight_history_json = $4::jsonb
      WHERE id = $1 AND user_id = $2;
    `,
    [patientId, userId, nextCurrentWeight, JSON.stringify(nextWeightHistory)],
  );
}

function normalizeTargetHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .map((entry) => {
      const parsedTargetWeight = Number(entry?.targetWeight);
      if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) return null;
      const parsedDate = new Date(entry?.setAt || Date.now());
      if (Number.isNaN(parsedDate.getTime())) return null;
      return {
        id:
          typeof entry?.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        targetWeight: Number(parsedTargetWeight.toFixed(2)),
        setAt: parsedDate.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.setAt).getTime() - new Date(b.setAt).getTime());
}

function normalizeFoodCategory(value) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!raw) return "Outros";
  if (["proteina", "proteinas"].includes(raw)) return "Proteinas";
  if (["carboidrato", "carboidratos"].includes(raw)) return "Carboidratos";
  if (["vegetal", "vegetais", "verdura", "verduras", "legume", "legumes"].includes(raw)) {
    return "Vegetais";
  }
  if (["fruta", "frutas"].includes(raw)) return "Frutas";
  if (["leguminosa", "leguminosas"].includes(raw)) return "Leguminosas";
  if (["laticinio", "laticinios", "leite", "leites"].includes(raw)) return "Laticinios";
  if (["gordura", "gorduras", "oleo", "oleos", "semente", "sementes", "castanha", "castanhas"].includes(raw)) {
    return "Gorduras";
  }
  return "Outros";
}

function validateFood(body) {
  const allowedMeasurementBasis = new Set(["100g", "100ml", "unidade"]);
  if (!body.name || typeof body.name !== "string") {
    return "Nome do alimento e obrigatorio.";
  }
  if (!body.category || typeof body.category !== "string") {
    return "Categoria do alimento e obrigatoria.";
  }
  if (!allowedMeasurementBasis.has(body.measurementBasis)) {
    return "Base de calculo deve ser 100g, 100ml ou unidade.";
  }
  if (!Number.isFinite(body.calories) || body.calories < 0) {
    return "Calorias precisam ser um numero valido.";
  }
  if (!Number.isFinite(body.protein) || body.protein < 0) {
    return "Proteina precisa ser um numero valido.";
  }
  if (!Number.isFinite(body.carbs) || body.carbs < 0) {
    return "Carboidrato precisa ser um numero valido.";
  }
  if (!Number.isFinite(body.fat) || body.fat < 0) {
    return "Gordura precisa ser um numero valido.";
  }
  if (!Number.isFinite(body.fiber) || body.fiber < 0) {
    return "Fibra precisa ser um numero valido.";
  }
  return null;
}

function validateConsultation(body) {
  if (!body.scheduledAt || Number.isNaN(new Date(body.scheduledAt).getTime())) {
    return "Data e horario da consulta sao obrigatorios.";
  }
  if (body.type !== undefined && typeof body.type !== "string") {
    return "Tipo de consulta invalido.";
  }
  if (body.notes !== undefined && typeof body.notes !== "string") {
    return "Observacoes invalidas.";
  }
  return null;
}

function normalizeAssessmentDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toISOString().slice(0, 10);
}

function inferPhysicalGoalFromPatientGoal(value, fallback = "manter") {
  const normalizedFallback = PHYSICAL_GOALS.has(fallback) ? fallback : "manter";
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!raw) return normalizedFallback;
  if (
    raw.includes("perd") ||
    raw.includes("emagrec") ||
    raw.includes("redu") ||
    raw.includes("deficit") ||
    raw.includes("seca")
  ) {
    return "perder";
  }
  if (
    raw.includes("ganh") ||
    raw.includes("hipertrof") ||
    raw.includes("massa") ||
    raw.includes("aument") ||
    raw.includes("bulk")
  ) {
    return "ganhar";
  }
  if (raw.includes("mant")) return "manter";
  return normalizedFallback;
}

function normalizePhysicalAssessmentMeasurements(list, keyName, valueName) {
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => ({
      [keyName]: String(entry?.[keyName] || "").trim(),
      [valueName]: Number(entry?.[valueName]),
    }))
    .filter((entry) => entry[keyName] && Number.isFinite(entry[valueName]) && entry[valueName] > 0);
}

function calculatePhysicalAssessmentResult({
  weightKg,
  heightCm,
  age,
  sex,
  activityLevel,
  goal,
}) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  const ageNumber = Number(age);
  const factor = PHYSICAL_ACTIVITY_FACTORS[activityLevel] || PHYSICAL_ACTIVITY_FACTORS.moderado;

  const bmrRaw =
    sex === "masculino"
      ? 10 * weight + 6.25 * height - 5 * ageNumber + 5
      : 10 * weight + 6.25 * height - 5 * ageNumber - 161;
  const tdeeRaw = bmrRaw * factor;

  let calorieTargetRaw = tdeeRaw;
  if (goal === "perder") calorieTargetRaw = tdeeRaw - 400;
  if (goal === "ganhar") calorieTargetRaw = tdeeRaw + 300;

  if (goal === "perder") {
    const minCalories = sex === "masculino" ? 1500 : 1200;
    calorieTargetRaw = Math.max(calorieTargetRaw, minCalories);
  }

  const proteinMultiplier = goal === "perder" ? 1.8 : 1.6;
  const proteinRaw = weight * proteinMultiplier;
  let fatRaw = weight * 0.8;
  let carbsRaw = (calorieTargetRaw - (proteinRaw * 4 + fatRaw * 9)) / 4;

  if (carbsRaw < 0) {
    fatRaw = weight * 0.6;
    carbsRaw = (calorieTargetRaw - (proteinRaw * 4 + fatRaw * 9)) / 4;
  }
  if (carbsRaw < 0) carbsRaw = 0;

  return {
    bmr: Number(bmrRaw.toFixed(2)),
    tdee: Number(tdeeRaw.toFixed(2)),
    calorieTarget: Number(calorieTargetRaw.toFixed(2)),
    proteinG: Number(proteinRaw.toFixed(2)),
    fatG: Number(fatRaw.toFixed(2)),
    carbsG: Number(carbsRaw.toFixed(2)),
  };
}

function validatePhysicalAssessment(body) {
  const patientId = String(body?.patientId || "").trim();
  if (!patientId) return "Paciente e obrigatorio.";

  const assessmentDate = normalizeAssessmentDate(body?.date);
  if (!assessmentDate) return "Data da avaliacao invalida.";

  const weightKg = Number(body?.weightKg);
  if (!Number.isFinite(weightKg) || weightKg <= 0) return "Peso (kg) invalido.";

  const heightCm = Number(body?.heightCm);
  if (!Number.isFinite(heightCm) || heightCm <= 0) return "Altura (cm) invalida.";

  const age = Number(body?.age);
  if (!Number.isInteger(age) || age <= 0) return "Idade invalida.";

  const sex = String(body?.sex || "").trim();
  if (!PHYSICAL_SEX_OPTIONS.has(sex)) return "Sexo biologico invalido.";

  const activityLevel = String(body?.activityLevel || "").trim();
  if (!Object.prototype.hasOwnProperty.call(PHYSICAL_ACTIVITY_FACTORS, activityLevel)) {
    return "Nivel de atividade invalido.";
  }

  const goal = String(body?.goal || "").trim();
  if (goal && !PHYSICAL_GOALS.has(goal)) return "Objetivo invalido.";

  if (body?.circumferences !== undefined && !Array.isArray(body.circumferences)) {
    return "Circunferencias invalidas.";
  }
  if (Array.isArray(body?.circumferences)) {
    const usedTypes = new Set();
    for (const entry of body.circumferences) {
      const type = String(entry?.type || "").trim();
      const valueCm = Number(entry?.valueCm);
      if (!CIRCUMFERENCE_TYPES.has(type)) return "Tipo de circunferencia invalido.";
      if (!Number.isFinite(valueCm) || valueCm <= 0) return "Valor de circunferencia invalido.";
      if (usedTypes.has(type)) return "Circunferencia duplicada.";
      usedTypes.add(type);
    }
  }

  if (body?.skinfolds !== undefined && !Array.isArray(body.skinfolds)) {
    return "Dobras cutaneas invalidas.";
  }
  if (Array.isArray(body?.skinfolds)) {
    const usedSites = new Set();
    for (const entry of body.skinfolds) {
      const site = String(entry?.site || "").trim();
      const valueMm = Number(entry?.valueMm);
      if (!SKINFOLD_SITES.has(site)) return "Local de dobra cutanea invalido.";
      if (!Number.isFinite(valueMm) || valueMm < 2 || valueMm > 60) {
        return "Dobras cutaneas devem estar entre 2 e 60 mm.";
      }
      if (usedSites.has(site)) return "Dobra cutanea duplicada.";
      usedSites.add(site);
    }
  }

  return null;
}

function normalizePhysicalAssessmentPayload(body, resolvedGoal = "manter") {
  const date = normalizeAssessmentDate(body?.date);
  const weightKg = Number(Number(body?.weightKg).toFixed(2));
  const heightCm = Number(Number(body?.heightCm).toFixed(2));
  const age = Number(body?.age);
  const sex = String(body?.sex || "").trim();
  const activityLevel = String(body?.activityLevel || "").trim();
  const bodyGoal = String(body?.goal || "").trim();
  const goal = PHYSICAL_GOALS.has(resolvedGoal) ? resolvedGoal : PHYSICAL_GOALS.has(bodyGoal) ? bodyGoal : "manter";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const circumferences = normalizePhysicalAssessmentMeasurements(body?.circumferences, "type", "valueCm").map(
    (entry) => ({
      type: entry.type,
      valueCm: Number(entry.valueCm.toFixed(2)),
    }),
  );
  const skinfolds = normalizePhysicalAssessmentMeasurements(body?.skinfolds, "site", "valueMm").map((entry) => ({
    site: entry.site,
    valueMm: Number(entry.valueMm.toFixed(2)),
  }));
  const result = calculatePhysicalAssessmentResult({
    weightKg,
    heightCm,
    age,
    sex,
    activityLevel,
    goal,
  });

  return {
    patientId: String(body?.patientId || "").trim(),
    date,
    weightKg,
    heightCm,
    age,
    sex,
    activityLevel,
    goal,
    notes,
    circumferences,
    skinfolds,
    result,
  };
}

const PHYSICAL_ASSESSMENT_SELECT_SQL = `
  SELECT
    pa.id,
    pa.patient_id AS "patientId",
    pa.assessment_date AS "date",
    pa.weight_kg AS "weightKg",
    pa.height_cm AS "heightCm",
    pa.age,
    pa.sex,
    pa.activity_level AS "activityLevel",
    pa.goal,
    pa.notes,
    pa.bmr,
    pa.tdee,
    pa.calorie_target AS "calorieTarget",
    pa.protein_g AS "proteinG",
    pa.fat_g AS "fatG",
    pa.carbs_g AS "carbsG",
    pa.created_at AS "createdAt",
    pa.updated_at AS "updatedAt",
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', cm.id,
            'type', cm.type,
            'valueCm', cm.value_cm
          )
          ORDER BY cm.type
        )
        FROM circumference_measurements cm
        WHERE cm.assessment_id = pa.id
      ),
      '[]'::jsonb
    ) AS circumferences,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', sm.id,
            'site', sm.site,
            'valueMm', sm.value_mm
          )
          ORDER BY sm.site
        )
        FROM skinfold_measurements sm
        WHERE sm.assessment_id = pa.id
      ),
      '[]'::jsonb
    ) AS skinfolds
  FROM physical_assessments pa
`;

function normalizePlanPayload(body) {
  const rawDescription = typeof body.description === "string" ? body.description.trim() : "";
  const description = rawDescription || "Plano sem descricao";

  const groups = Array.isArray(body.groups)
    ? body.groups
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    : [];
  const items = Array.isArray(body.items) ? body.items : [];
  const history = Array.isArray(body.history) ? body.history : [];
  const substitutions =
    body.substitutions && typeof body.substitutions === "object" && !Array.isArray(body.substitutions)
      ? body.substitutions
      : {};
  const status = typeof body.status === "string" && body.status.trim() ? body.status.trim() : "active";

  const parsedSavedAt = new Date(body.savedAt || Date.now());
  const savedAt = Number.isNaN(parsedSavedAt.getTime()) ? new Date().toISOString() : parsedSavedAt.toISOString();

  return {
    description,
    groups,
    items,
    substitutions,
    history,
    status,
    savedAt,
  };
}

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function validateAuthPayload(body) {
  const email = normalizeEmail(body.email);
  if (!email) {
    return "Email e obrigatorio.";
  }
  if (!body.password || typeof body.password !== "string" || body.password.length < 6) {
    return "Senha precisa ter ao menos 6 caracteres.";
  }
  return null;
}

function signUserToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

function calculateTrend(currentPeriod, previousPeriod) {
  if (previousPeriod === 0 && currentPeriod === 0) {
    return { direction: "stable", percentage: 0 };
  }
  if (previousPeriod === 0) {
    return { direction: "up", percentage: 100 };
  }

  const delta = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  if (delta > 0) {
    return { direction: "up", percentage: Math.round(delta) };
  }
  if (delta < 0) {
    return { direction: "down", percentage: Math.round(Math.abs(delta)) };
  }
  return { direction: "stable", percentage: 0 };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Nao autenticado." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalido ou expirado." });
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({
    message: "BioFit API ativa.",
    health: "/health",
    docs: {
      summary: "/api/dashboard/summary",
      patients: "/api/patients",
      foods: "/api/foods",
    },
  });
});

app.post("/api/auth/register", (_req, res) => {
  return res.status(403).json({ error: "Cadastro desabilitado." });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const validationError = validateAuthPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const email = normalizeEmail(req.body.email);
    const { rows } = await pool.query(
      `
        SELECT id, name, email, role, password_hash, created_at
        FROM users
        WHERE email = $1
        LIMIT 1;
      `,
      [email],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Email ou senha invalidos." });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou senha invalidos." });
    }

    const token = signUserToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = $1
        LIMIT 1;
      `,
      [req.auth.userId],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Usuario nao encontrado." });
    }

    return res.json(sanitizeUser(rows[0]));
  } catch (error) {
    return next(error);
  }
});

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth")) {
    return next();
  }
  return requireAuth(req, res, next);
});

app.get("/api/dashboard/summary", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          (SELECT COUNT(*)::INT FROM patients WHERE user_id = $1) AS "activePatients",
          (SELECT COUNT(*)::INT FROM consultations WHERE user_id = $1) AS "consultationsCount",
          (SELECT COUNT(*)::INT FROM plans WHERE user_id = $1 AND LOWER(status) = 'active') AS "activePlans",
          (SELECT COUNT(*)::INT FROM foods WHERE user_id = $1) AS "foodsInBase",

          (SELECT COUNT(*)::INT FROM patients WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days') AS "patientsCurrentPeriod",
          (SELECT COUNT(*)::INT FROM patients WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS "patientsPreviousPeriod",

          (SELECT COUNT(*)::INT FROM consultations WHERE user_id = $1 AND scheduled_at >= NOW() - INTERVAL '30 days') AS "consultationsCurrentPeriod",
          (SELECT COUNT(*)::INT FROM consultations WHERE user_id = $1 AND scheduled_at >= NOW() - INTERVAL '60 days' AND scheduled_at < NOW() - INTERVAL '30 days') AS "consultationsPreviousPeriod",

          (SELECT COUNT(*)::INT FROM plans WHERE user_id = $1 AND LOWER(status) = 'active' AND created_at >= NOW() - INTERVAL '30 days') AS "plansCurrentPeriod",
          (SELECT COUNT(*)::INT FROM plans WHERE user_id = $1 AND LOWER(status) = 'active' AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS "plansPreviousPeriod",

          (SELECT COUNT(*)::INT FROM foods WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days') AS "foodsCurrentPeriod",
          (SELECT COUNT(*)::INT FROM foods WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS "foodsPreviousPeriod";
      `,
      [req.auth.userId],
    );

    const row = rows[0];
    res.json({
      activePatients: row.activePatients,
      consultationsCount: row.consultationsCount,
      activePlans: row.activePlans,
      foodsInBase: row.foodsInBase,
      trends: {
        activePatients: calculateTrend(row.patientsCurrentPeriod, row.patientsPreviousPeriod),
        consultationsCount: calculateTrend(
          row.consultationsCurrentPeriod,
          row.consultationsPreviousPeriod,
        ),
        activePlans: calculateTrend(row.plansCurrentPeriod, row.plansPreviousPeriod),
        foodsInBase: calculateTrend(row.foodsCurrentPeriod, row.foodsPreviousPeriod),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/consultations", async (req, res, next) => {
  try {
    const dateParam = req.query.date;
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: "Parametro date obrigatorio no formato YYYY-MM-DD." });
    }

    const { rows } = await pool.query(
      `
        SELECT
          c.id,
          c.patient_id AS "patientId",
          p.name AS "patientName",
          c.type,
          c.notes,
          c.scheduled_at AS "scheduledAt",
          c.created_at AS "createdAt"
        FROM consultations c
        LEFT JOIN patients p
          ON p.id = c.patient_id AND p.user_id = c.user_id
        WHERE c.user_id = $1
          AND c.scheduled_at >= $2::date
          AND c.scheduled_at < ($2::date + INTERVAL '1 day')
        ORDER BY c.scheduled_at ASC;
      `,
      [req.auth.userId, dateParam],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/consultations/calendar", async (req, res, next) => {
  try {
    const monthParam = req.query.month;
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return res.status(400).json({ error: "Parametro month obrigatorio no formato YYYY-MM." });
    }
    const monthStart = `${monthParam}-01`;

    const { rows } = await pool.query(
      `
        SELECT
          TO_CHAR(c.scheduled_at::date, 'YYYY-MM-DD') AS "date",
          COUNT(*)::INT AS "count"
        FROM consultations c
        WHERE c.user_id = $1
          AND c.scheduled_at >= DATE_TRUNC('month', $2::date)
          AND c.scheduled_at < DATE_TRUNC('month', $2::date) + INTERVAL '1 month'
        GROUP BY c.scheduled_at::date
        ORDER BY c.scheduled_at::date ASC;
      `,
      [req.auth.userId, monthStart],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/consultations", async (req, res, next) => {
  try {
    const validationError = validateConsultation(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const patientId = req.body.patientId || null;
    if (patientId) {
      const patientCheck = await pool.query(
        "SELECT id FROM patients WHERE id = $1 AND user_id = $2 LIMIT 1;",
        [patientId, req.auth.userId],
      );
      if (!patientCheck.rows.length) {
        return res.status(400).json({ error: "Paciente invalido para este usuario." });
      }
    }

    const { rows } = await pool.query(
      `
        INSERT INTO consultations (id, user_id, patient_id, type, notes, scheduled_at)
        VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
        RETURNING
          id,
          patient_id AS "patientId",
          type,
          notes,
          scheduled_at AS "scheduledAt",
          created_at AS "createdAt";
      `,
      [
        randomUUID(),
        req.auth.userId,
        patientId,
        req.body.type?.trim() || "Consulta",
        req.body.notes?.trim() || "",
        req.body.scheduledAt,
      ],
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/plans", async (req, res, next) => {
  try {
    const patientId = req.query.patientId ? String(req.query.patientId) : "";
    const values = [req.auth.userId];
    let whereSql = "WHERE user_id = $1";

    if (patientId) {
      values.push(patientId);
      whereSql += " AND patient_id = $2";
    }

    const { rows } = await pool.query(
      `
        SELECT
          id,
          patient_id AS "patientId",
          status,
          description,
          groups_json AS groups,
          items_json AS items,
          substitutions_json AS substitutions,
          history_json AS history,
          saved_at AS "savedAt",
          updated_at AS "updatedAt",
          created_at AS "createdAt"
        FROM plans
        ${whereSql}
        ORDER BY updated_at DESC;
      `,
      values,
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.put("/api/plans/:patientId", async (req, res, next) => {
  try {
    const patientId = String(req.params.patientId || "").trim();
    if (!patientId) {
      return res.status(400).json({ error: "Paciente invalido." });
    }

    const patientCheck = await pool.query(
      "SELECT id FROM patients WHERE id = $1 AND user_id = $2 LIMIT 1;",
      [patientId, req.auth.userId],
    );
    if (!patientCheck.rows.length) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }

    const payload = normalizePlanPayload(req.body || {});
    const { rows } = await pool.query(
      `
        INSERT INTO plans (
          id,
          user_id,
          patient_id,
          status,
          description,
          groups_json,
          items_json,
          substitutions_json,
          history_json,
          saved_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::timestamptz, NOW())
        ON CONFLICT (user_id, patient_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          groups_json = EXCLUDED.groups_json,
          items_json = EXCLUDED.items_json,
          substitutions_json = EXCLUDED.substitutions_json,
          history_json = EXCLUDED.history_json,
          saved_at = EXCLUDED.saved_at,
          updated_at = NOW()
        RETURNING
          id,
          patient_id AS "patientId",
          status,
          description,
          groups_json AS groups,
          items_json AS items,
          substitutions_json AS substitutions,
          history_json AS history,
          saved_at AS "savedAt",
          updated_at AS "updatedAt",
          created_at AS "createdAt";
      `,
      [
        randomUUID(),
        req.auth.userId,
        patientId,
        payload.status,
        payload.description,
        JSON.stringify(payload.groups),
        JSON.stringify(payload.items),
        JSON.stringify(payload.substitutions),
        JSON.stringify(payload.history),
        payload.savedAt,
      ],
    );
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/physical-assessments", async (req, res, next) => {
  try {
    const patientId = String(req.query.patientId || "").trim();
    const values = [req.auth.userId];
    let whereSql = "WHERE pa.user_id = $1";

    if (patientId) {
      const patientCheck = await pool.query(
        "SELECT id FROM patients WHERE id = $1 AND user_id = $2 LIMIT 1;",
        [patientId, req.auth.userId],
      );
      if (!patientCheck.rows.length) {
        return res.status(404).json({ error: "Paciente nao encontrado." });
      }
      values.push(patientId);
      whereSql += " AND pa.patient_id = $2";
    }

    const { rows } = await pool.query(
      `
        ${PHYSICAL_ASSESSMENT_SELECT_SQL}
        ${whereSql}
        ORDER BY pa.assessment_date DESC, pa.created_at DESC;
      `,
      values,
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/physical-assessments/:id", async (req, res, next) => {
  try {
    const assessmentId = String(req.params.id || "").trim();
    if (!assessmentId) {
      return res.status(400).json({ error: "Avaliacao fisica invalida." });
    }

    const { rows } = await pool.query(
      `
        ${PHYSICAL_ASSESSMENT_SELECT_SQL}
        WHERE pa.id = $1 AND pa.user_id = $2
        LIMIT 1;
      `,
      [assessmentId, req.auth.userId],
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Avaliacao fisica nao encontrada." });
    }
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/physical-assessments", async (req, res, next) => {
  try {
    const validationError = validatePhysicalAssessment(req.body || {});
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const patientId = String(req.body?.patientId || "").trim();
    const requestedGoal = String(req.body?.goal || "").trim();
    const fallbackGoal = PHYSICAL_GOALS.has(requestedGoal) ? requestedGoal : "manter";
    const patientCheck = await pool.query(
      "SELECT id, goal FROM patients WHERE id = $1 AND user_id = $2 LIMIT 1;",
      [patientId, req.auth.userId],
    );
    if (!patientCheck.rows.length) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }
    const resolvedGoal = inferPhysicalGoalFromPatientGoal(patientCheck.rows[0].goal, fallbackGoal);
    const payload = normalizePhysicalAssessmentPayload(req.body || {}, resolvedGoal);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const assessmentId = randomUUID();
      await client.query(
        `
          INSERT INTO physical_assessments (
            id,
            user_id,
            patient_id,
            assessment_date,
            weight_kg,
            height_cm,
            age,
            sex,
            activity_level,
            goal,
            notes,
            bmr,
            tdee,
            calorie_target,
            protein_g,
            fat_g,
            carbs_g
          )
          VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
        `,
        [
          assessmentId,
          req.auth.userId,
          payload.patientId,
          payload.date,
          payload.weightKg,
          payload.heightCm,
          payload.age,
          payload.sex,
          payload.activityLevel,
          payload.goal,
          payload.notes,
          payload.result.bmr,
          payload.result.tdee,
          payload.result.calorieTarget,
          payload.result.proteinG,
          payload.result.fatG,
          payload.result.carbsG,
        ],
      );

      for (const item of payload.circumferences) {
        await client.query(
          `
            INSERT INTO circumference_measurements (id, assessment_id, type, value_cm)
            VALUES ($1, $2, $3, $4);
          `,
          [randomUUID(), assessmentId, item.type, item.valueCm],
        );
      }

      for (const item of payload.skinfolds) {
        await client.query(
          `
            INSERT INTO skinfold_measurements (id, assessment_id, site, value_mm)
            VALUES ($1, $2, $3, $4);
          `,
          [randomUUID(), assessmentId, item.site, item.valueMm],
        );
      }
      await syncPatientWeightFromAssessment(client, {
        userId: req.auth.userId,
        patientId: payload.patientId,
        assessmentId,
        assessmentDate: payload.date,
        weightKg: payload.weightKg,
      });

      const { rows } = await client.query(
        `
          ${PHYSICAL_ASSESSMENT_SELECT_SQL}
          WHERE pa.id = $1 AND pa.user_id = $2
          LIMIT 1;
        `,
        [assessmentId, req.auth.userId],
      );
      await client.query("COMMIT");
      return res.status(201).json(rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
});

app.put("/api/physical-assessments/:id", async (req, res, next) => {
  try {
    const validationError = validatePhysicalAssessment(req.body || {});
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const assessmentId = String(req.params.id || "").trim();
    if (!assessmentId) {
      return res.status(400).json({ error: "Avaliacao fisica invalida." });
    }

    const patientId = String(req.body?.patientId || "").trim();
    const requestedGoal = String(req.body?.goal || "").trim();
    const fallbackGoal = PHYSICAL_GOALS.has(requestedGoal) ? requestedGoal : "manter";
    const patientCheck = await pool.query(
      "SELECT id, goal FROM patients WHERE id = $1 AND user_id = $2 LIMIT 1;",
      [patientId, req.auth.userId],
    );
    if (!patientCheck.rows.length) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }
    const resolvedGoal = inferPhysicalGoalFromPatientGoal(patientCheck.rows[0].goal, fallbackGoal);
    const payload = normalizePhysicalAssessmentPayload(req.body || {}, resolvedGoal);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existingAssessmentResult = await client.query(
        `
          SELECT patient_id AS "patientId"
          FROM physical_assessments
          WHERE id = $1 AND user_id = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [assessmentId, req.auth.userId],
      );
      if (!existingAssessmentResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Avaliacao fisica nao encontrada." });
      }
      const previousPatientId = String(existingAssessmentResult.rows[0].patientId || "").trim();

      const updateResult = await client.query(
        `
          UPDATE physical_assessments
          SET
            patient_id = $3,
            assessment_date = $4::date,
            weight_kg = $5,
            height_cm = $6,
            age = $7,
            sex = $8,
            activity_level = $9,
            goal = $10,
            notes = $11,
            bmr = $12,
            tdee = $13,
            calorie_target = $14,
            protein_g = $15,
            fat_g = $16,
            carbs_g = $17,
            updated_at = NOW()
          WHERE id = $1 AND user_id = $2;
        `,
        [
          assessmentId,
          req.auth.userId,
          payload.patientId,
          payload.date,
          payload.weightKg,
          payload.heightCm,
          payload.age,
          payload.sex,
          payload.activityLevel,
          payload.goal,
          payload.notes,
          payload.result.bmr,
          payload.result.tdee,
          payload.result.calorieTarget,
          payload.result.proteinG,
          payload.result.fatG,
          payload.result.carbsG,
        ],
      );
      if (updateResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Avaliacao fisica nao encontrada." });
      }

      await client.query("DELETE FROM circumference_measurements WHERE assessment_id = $1;", [assessmentId]);
      await client.query("DELETE FROM skinfold_measurements WHERE assessment_id = $1;", [assessmentId]);

      for (const item of payload.circumferences) {
        await client.query(
          `
            INSERT INTO circumference_measurements (id, assessment_id, type, value_cm)
            VALUES ($1, $2, $3, $4);
          `,
          [randomUUID(), assessmentId, item.type, item.valueCm],
        );
      }

      for (const item of payload.skinfolds) {
        await client.query(
          `
            INSERT INTO skinfold_measurements (id, assessment_id, site, value_mm)
            VALUES ($1, $2, $3, $4);
          `,
          [randomUUID(), assessmentId, item.site, item.valueMm],
        );
      }
      await syncPatientWeightFromAssessment(client, {
        userId: req.auth.userId,
        patientId: payload.patientId,
        assessmentId,
        assessmentDate: payload.date,
        weightKg: payload.weightKg,
      });
      if (previousPatientId && previousPatientId !== payload.patientId) {
        await removeAssessmentWeightFromPatient(client, {
          userId: req.auth.userId,
          patientId: previousPatientId,
          assessmentId,
        });
      }

      const { rows } = await client.query(
        `
          ${PHYSICAL_ASSESSMENT_SELECT_SQL}
          WHERE pa.id = $1 AND pa.user_id = $2
          LIMIT 1;
        `,
        [assessmentId, req.auth.userId],
      );
      await client.query("COMMIT");
      return res.json(rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/physical-assessments/:id", async (req, res, next) => {
  try {
    const assessmentId = String(req.params.id || "").trim();
    if (!assessmentId) {
      return res.status(400).json({ error: "Avaliacao fisica invalida." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const assessmentResult = await client.query(
        `
          SELECT patient_id AS "patientId"
          FROM physical_assessments
          WHERE id = $1 AND user_id = $2
          LIMIT 1
          FOR UPDATE;
        `,
        [assessmentId, req.auth.userId],
      );
      if (!assessmentResult.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Avaliacao fisica nao encontrada." });
      }
      const patientId = String(assessmentResult.rows[0].patientId || "").trim();

      await client.query("DELETE FROM physical_assessments WHERE id = $1 AND user_id = $2;", [
        assessmentId,
        req.auth.userId,
      ]);
      if (patientId) {
        await removeAssessmentWeightFromPatient(client, {
          userId: req.auth.userId,
          patientId,
          assessmentId,
        });
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

app.get("/api/patients", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        name,
        age,
        goal,
        phone,
        email,
        current_weight AS "currentWeight",
        target_weight AS "targetWeight",
        target_weight_set_at AS "targetWeightSetAt",
        target_history_json AS "targetHistory",
        weight_history_json AS "weightHistory",
        created_at AS "createdAt"
      FROM patients
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `,
      [req.auth.userId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/patients", async (req, res, next) => {
  try {
    const validationError = validatePatient(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const patient = {
      id: randomUUID(),
      name: req.body.name.trim(),
      age: req.body.age ?? null,
      goal: req.body.goal?.trim() || "",
      phone: req.body.phone?.trim() || "",
      email: req.body.email?.trim() || "",
      weightHistory: normalizeWeightHistory(req.body.weightHistory),
      targetHistory: normalizeTargetHistory(req.body.targetHistory),
    };
    const rawCurrentWeight = req.body.currentWeight;
    const explicitCurrentWeight =
      rawCurrentWeight === undefined || rawCurrentWeight === null || rawCurrentWeight === ""
        ? null
        : Number(rawCurrentWeight);
    const rawTargetWeight = req.body.targetWeight;
    const explicitTargetWeight =
      rawTargetWeight === undefined || rawTargetWeight === null || rawTargetWeight === ""
        ? null
        : Number(rawTargetWeight);
    const currentWeight =
      Number.isFinite(explicitCurrentWeight) && explicitCurrentWeight > 0
        ? Number(explicitCurrentWeight.toFixed(2))
        : patient.weightHistory.length
          ? patient.weightHistory[patient.weightHistory.length - 1].weight
          : null;
    const targetWeight =
      Number.isFinite(explicitTargetWeight) && explicitTargetWeight > 0
        ? Number(explicitTargetWeight.toFixed(2))
        : null;
    const targetWeightSetAt = targetWeight !== null ? new Date().toISOString() : null;
    const targetHistory =
      patient.targetHistory.length > 0
        ? patient.targetHistory
        : targetWeight !== null
          ? [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                targetWeight,
                setAt: targetWeightSetAt,
              },
            ]
          : [];

    const { rows } = await pool.query(
      `
        INSERT INTO patients (
          id,
          user_id,
          name,
          age,
          goal,
          phone,
          email,
          current_weight,
          target_weight,
          target_weight_set_at,
          target_history_json,
          weight_history_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::jsonb, $12::jsonb)
        RETURNING
          id,
          name,
          age,
          goal,
          phone,
          email,
          current_weight AS "currentWeight",
          target_weight AS "targetWeight",
          target_weight_set_at AS "targetWeightSetAt",
          target_history_json AS "targetHistory",
          weight_history_json AS "weightHistory",
          created_at AS "createdAt";
      `,
      [
        patient.id,
        req.auth.userId,
        patient.name,
        patient.age,
        patient.goal,
        patient.phone,
        patient.email,
        currentWeight,
        targetWeight,
        targetWeightSetAt,
        JSON.stringify(targetHistory),
        JSON.stringify(patient.weightHistory),
      ],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/patients/:id", async (req, res, next) => {
  try {
    const validationError = validatePatient(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const hasWeightHistoryField = Object.prototype.hasOwnProperty.call(req.body, "weightHistory");
    const normalizedWeightHistory = hasWeightHistoryField ? normalizeWeightHistory(req.body.weightHistory) : null;
    const hasCurrentWeightField = Object.prototype.hasOwnProperty.call(req.body, "currentWeight");
    const rawCurrentWeight = req.body.currentWeight;
    const explicitCurrentWeight =
      rawCurrentWeight === undefined || rawCurrentWeight === null || rawCurrentWeight === ""
        ? null
        : Number(rawCurrentWeight);
    const resolvedCurrentWeight = hasWeightHistoryField
      ? normalizedWeightHistory.length
        ? normalizedWeightHistory[normalizedWeightHistory.length - 1].weight
        : null
      : hasCurrentWeightField && Number.isFinite(explicitCurrentWeight) && explicitCurrentWeight > 0
        ? Number(explicitCurrentWeight.toFixed(2))
        : null;
    const isTryingToRegisterProgress =
      (hasWeightHistoryField && normalizedWeightHistory.length > 0) ||
      (!hasWeightHistoryField &&
        hasCurrentWeightField &&
        Number.isFinite(explicitCurrentWeight) &&
        explicitCurrentWeight > 0);
    if (isTryingToRegisterProgress) {
      const assessmentCheck = await pool.query(
        `
          SELECT 1
          FROM physical_assessments
          WHERE patient_id = $1 AND user_id = $2
          LIMIT 1;
        `,
        [req.params.id, req.auth.userId],
      );
      if (!assessmentCheck.rowCount) {
        return res.status(400).json({ error: "Registre uma avaliacao fisica antes de salvar a progressao." });
      }
    }

    const hasTargetWeightField = Object.prototype.hasOwnProperty.call(req.body, "targetWeight");
    const rawTargetWeight = req.body.targetWeight;
    const explicitTargetWeight =
      rawTargetWeight === undefined || rawTargetWeight === null || rawTargetWeight === ""
        ? null
        : Number(rawTargetWeight);
    const hasTargetHistoryField = Object.prototype.hasOwnProperty.call(req.body, "targetHistory");
    const normalizedTargetHistory = hasTargetHistoryField ? normalizeTargetHistory(req.body.targetHistory) : null;
    const resolvedTargetWeight =
      hasTargetWeightField && Number.isFinite(explicitTargetWeight) && explicitTargetWeight > 0
        ? Number(explicitTargetWeight.toFixed(2))
        : null;
    const resolvedTargetWeightSetAt = hasTargetWeightField
      ? resolvedTargetWeight !== null
        ? new Date().toISOString()
        : null
      : null;

    const { rows } = await pool.query(
      `
        UPDATE patients
        SET
          name = $3,
          age = $4,
          goal = $5,
          phone = $6,
          email = $7,
          current_weight = CASE WHEN $8::boolean THEN $9::double precision ELSE current_weight END,
          weight_history_json = CASE
            WHEN $10::boolean THEN COALESCE($11::jsonb, '[]'::jsonb)
            ELSE weight_history_json
          END,
          target_weight = CASE WHEN $12::boolean THEN $13::double precision ELSE target_weight END,
          target_weight_set_at = CASE WHEN $12::boolean THEN $14::timestamptz ELSE target_weight_set_at END,
          target_history_json = CASE
            WHEN $15::boolean THEN COALESCE($16::jsonb, '[]'::jsonb)
            ELSE target_history_json
          END
        WHERE id = $1 AND user_id = $2
        RETURNING
          id,
          name,
          age,
          goal,
          phone,
          email,
          current_weight AS "currentWeight",
          target_weight AS "targetWeight",
          target_weight_set_at AS "targetWeightSetAt",
          target_history_json AS "targetHistory",
          weight_history_json AS "weightHistory",
          created_at AS "createdAt";
      `,
      [
        req.params.id,
        req.auth.userId,
        req.body.name.trim(),
        req.body.age ?? null,
        req.body.goal?.trim() || "",
        req.body.phone?.trim() || "",
        req.body.email?.trim() || "",
        hasCurrentWeightField || hasWeightHistoryField,
        resolvedCurrentWeight,
        hasWeightHistoryField,
        hasWeightHistoryField ? JSON.stringify(normalizedWeightHistory) : null,
        hasTargetWeightField,
        hasTargetWeightField ? resolvedTargetWeight : null,
        hasTargetWeightField ? resolvedTargetWeightSetAt : null,
        hasTargetHistoryField,
        hasTargetHistoryField ? JSON.stringify(normalizedTargetHistory) : null,
      ],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/patients/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM plans WHERE patient_id = $1 AND user_id = $2;", [
      req.params.id,
      req.auth.userId,
    ]);
    const result = await pool.query("DELETE FROM patients WHERE id = $1 AND user_id = $2;", [
      req.params.id,
      req.auth.userId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Paciente nao encontrado." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/foods", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        name,
        category,
        measurement_basis AS "measurementBasis",
        calories,
        protein,
        carbs,
        fat,
        fiber,
        created_at AS "createdAt"
      FROM foods
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `,
      [req.auth.userId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/foods", async (req, res, next) => {
  try {
    const normalizedFoodBody = {
      name: req.body.name?.trim(),
      category: normalizeFoodCategory(req.body.category),
      measurementBasis: req.body.measurementBasis,
      calories: Number(req.body.calories),
      protein: Number(req.body.protein),
      carbs: Number(req.body.carbs),
      fat: Number(req.body.fat),
      fiber: Number(req.body.fiber),
    };
    const validationError = validateFood(normalizedFoodBody);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const food = {
      id: randomUUID(),
      name: normalizedFoodBody.name,
      category: normalizedFoodBody.category,
      measurementBasis: normalizedFoodBody.measurementBasis,
      calories: normalizedFoodBody.calories,
      protein: normalizedFoodBody.protein,
      carbs: normalizedFoodBody.carbs,
      fat: normalizedFoodBody.fat,
      fiber: normalizedFoodBody.fiber,
    };
    const { rows } = await pool.query(
      `
        INSERT INTO foods (id, user_id, name, category, measurement_basis, calories, protein, carbs, fat, fiber)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          name,
          category,
          measurement_basis AS "measurementBasis",
          calories,
          protein,
          carbs,
          fat,
          fiber,
          created_at AS "createdAt";
      `,
      [
        food.id,
        req.auth.userId,
        food.name,
        food.category,
        food.measurementBasis,
        food.calories,
        food.protein,
        food.carbs,
        food.fat,
        food.fiber,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/foods/:id", async (req, res, next) => {
  try {
    const normalizedFoodBody = {
      name: req.body.name?.trim(),
      category: normalizeFoodCategory(req.body.category),
      measurementBasis: req.body.measurementBasis,
      calories: Number(req.body.calories),
      protein: Number(req.body.protein),
      carbs: Number(req.body.carbs),
      fat: Number(req.body.fat),
      fiber: Number(req.body.fiber),
    };

    const validationError = validateFood(normalizedFoodBody);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { rows } = await pool.query(
      `
        UPDATE foods
        SET
          name = $3,
          category = $4,
          measurement_basis = $5,
          calories = $6,
          protein = $7,
          carbs = $8,
          fat = $9,
          fiber = $10
        WHERE id = $1 AND user_id = $2
        RETURNING
          id,
          name,
          category,
          measurement_basis AS "measurementBasis",
          calories,
          protein,
          carbs,
          fat,
          fiber,
          created_at AS "createdAt";
      `,
      [
        req.params.id,
        req.auth.userId,
        normalizedFoodBody.name,
        normalizedFoodBody.category,
        normalizedFoodBody.measurementBasis,
        normalizedFoodBody.calories,
        normalizedFoodBody.protein,
        normalizedFoodBody.carbs,
        normalizedFoodBody.fat,
        normalizedFoodBody.fiber,
      ],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Alimento nao encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/foods/:id", async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM foods WHERE id = $1 AND user_id = $2;", [
      req.params.id,
      req.auth.userId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Alimento nao encontrado." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Erro interno do servidor." });
});

async function startServer() {
  try {
    await ensureDatabase();
    app.listen(PORT, () => {
      console.log(`BioFit API rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar backend:", error);
    process.exit(1);
  }
}

startServer();
