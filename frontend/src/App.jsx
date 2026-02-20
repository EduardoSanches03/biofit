import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "./api";

const SESSION_KEY = "biofit_nutri_session";
const THEME_KEY = "biofit_theme";

const emptyPatient = { name: "", age: "", goal: "", phone: "", email: "" };
const emptyFood = {
  name: "",
  category: "Outros",
  measurementBasis: "100g",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
};

const FOOD_TEMPLATE_FILENAME = "modelo_alimentos.csv";
const FOOD_CATEGORIES = [
  "Proteinas",
  "Carboidratos",
  "Vegetais",
  "Frutas",
  "Leguminosas",
  "Laticinios",
  "Gorduras",
  "Outros",
];
const MEAL_GROUP_PRESETS = [
  "Cafe da manha",
  "Lanche da manha",
  "Almoco",
  "Lanche da tarde",
  "Jantar",
  "Ceia",
];
const DEFAULT_MEAL_OCCASION = "Almoco";
const PHYSICAL_ACTIVITY_LEVELS = [
  { value: "sedentario", label: "Sedentário" },
  { value: "leve", label: "Leve" },
  { value: "moderado", label: "Moderado" },
  { value: "alto", label: "Alto" },
  { value: "muitoAlto", label: "Muito alto" },
];
const PHYSICAL_GOALS = [
  { value: "perder", label: "Perder" },
  { value: "manter", label: "Manter" },
  { value: "ganhar", label: "Ganhar" },
];
const PHYSICAL_SEX_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
];
const CIRCUMFERENCE_FIELDS = [
  { key: "cintura", label: "Cintura" },
  { key: "quadril", label: "Quadril" },
  { key: "pescoco", label: "Pescoço" },
  { key: "braco", label: "Braço" },
  { key: "coxa", label: "Coxa" },
];
const SKINFOLD_FIELDS = [
  { key: "triceps", label: "Tríceps" },
  { key: "subescapular", label: "Subescapular" },
  { key: "suprailiaca", label: "Suprailíaca" },
  { key: "abdominal", label: "Abdominal" },
  { key: "peitoral", label: "Peitoral" },
  { key: "axilarMedia", label: "Axilar média" },
  { key: "coxa", label: "Coxa" },
  { key: "panturrilha", label: "Panturrilha" },
];

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "patients", label: "Pacientes" },
  { id: "foods", label: "Alimentos" },
  { id: "exercises", label: "Exercicios" },
  { id: "reports", label: "Relatorios" },
];

function MenuIcon({ id }) {
  if (id === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }

  if (id === "patients") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8.5" r="3" />
        <circle cx="16.5" cy="10" r="2.5" />
        <path d="M4.5 18.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
        <path d="M14 18.5c0-2.1 1.7-3.7 3.8-3.7S21.5 16.4 21.5 18.5" />
      </svg>
    );
  }

  if (id === "foods") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20c-4.3 0-7-3.2-7-7.4C5 8.5 7.4 5.5 12 4c4.6 1.5 7 4.5 7 8.6 0 4.2-2.7 7.4-7 7.4Z" />
        <path d="M12 8.2c1.2-1.3 3-1.3 4 0 1.1 1.3.9 3.2-.3 4.4L12 16l-3.7-3.4c-1.2-1.2-1.4-3.1-.3-4.4 1-1.3 2.8-1.3 4 0Z" />
      </svg>
    );
  }

  if (id === "exercises") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9h2v6H5zM17 9h2v6h-2zM9 10h6v4H9zM7 11h2v2H7zM15 11h2v2h-2z" />
      </svg>
    );
  }

  if (id === "reports") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10l2 2v14H7z" />
        <path d="M9 10h8M9 13h8M9 16h6" />
      </svg>
    );
  }

  if (id === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1.3 1.3a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-2.4a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1.3-1.3a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-2.4a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4L6.1 4a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V3a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1 1 0 0 1 1 1v2.4a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6Z" />
      </svg>
    );
  }

  if (id === "logout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
        <path d="M14 16l4-4-4-4" />
        <path d="M9 12h9" />
      </svg>
    );
  }

  return null;
}

function readStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // noop
  }
  return null;
}

function readStoredTheme() {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function initials(name) {
  if (!name) return "NT";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPatientCardName(name) {
  const normalized = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return "Sem nome";
  const parts = normalized.split(" ");
  if (parts.length <= 2) return normalized;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function formatValue(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDecimal(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return "0";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function formatDateTime(value) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoToBrDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function parseBrDate(brDate) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(brDate || "");
  if (!match) return "";
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }
  return iso;
}

function normalizeBrDateInput(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeHourInput(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidHour(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value || "");
}

function normalizeHeader(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseDelimitedLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseFoodNumber(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) return NaN;

  let normalized = value;
  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(",", ".");
  } else if (normalized.includes(",") && normalized.includes(".")) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  }

  return Number(normalized);
}

function normalizeMeasurementBasis(value) {
  const raw = normalizeHeader(value);
  if (["100g", "por100g", "100gramas", "por100gramas"].includes(raw)) return "100g";
  if (["100ml", "por100ml", "100mililitros", "por100mililitros"].includes(raw)) return "100ml";
  if (["unidade", "porunidade", "unitario", "unitaria"].includes(raw)) return "unidade";
  return "";
}

function normalizeFoodCategory(value) {
  const raw = normalizeHeader(value);
  if (!raw) return "Outros";
  if (["proteina", "proteinas"].includes(raw)) return "Proteinas";
  if (["carboidrato", "carboidratos"].includes(raw)) return "Carboidratos";
  if (["vegetal", "vegetais", "verdura", "verduras", "legume", "legumes"].includes(raw)) {
    return "Vegetais";
  }
  if (["fruta", "frutas"].includes(raw)) return "Frutas";
  if (["leguminosa", "leguminosas"].includes(raw)) return "Leguminosas";
  if (["laticinio", "laticinios", "leite", "leites", "derivadodeleite", "derivadosdeleite"].includes(raw)) {
    return "Laticinios";
  }
  if (["gordura", "gorduras", "oleo", "oleos", "semente", "sementes", "castanha", "castanhas"].includes(raw)) {
    return "Gorduras";
  }
  return "Outros";
}

function foodCategoryTone(category) {
  if (category === "Proteinas") return "protein";
  if (category === "Carboidratos") return "carb";
  if (category === "Vegetais") return "vegetable";
  if (category === "Frutas") return "fruit";
  if (category === "Leguminosas") return "legume";
  if (category === "Laticinios") return "dairy";
  if (category === "Gorduras") return "fat";
  return "neutral";
}

function measurementBasisLabel(value) {
  if (value === "100ml") return "por 100ml";
  if (value === "unidade") return "por unidade";
  return "por 100g";
}

function measurementBasisPortionUnit(value) {
  if (value === "100ml") return "ml";
  if (value === "unidade") return "unidade";
  return "g";
}

function addMonths(monthKey, amount) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return formatDateKey(date).slice(0, 7);
}

function formatMonthTitle(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function buildCalendarCells(monthKey, selectedDate, countsByDate) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPreviousMonth = new Date(year, month - 1, 0).getDate();
  const todayKey = formatDateKey(new Date());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - firstWeekday + 1;
    let cellDate;

    if (dayOffset < 1) {
      cellDate = new Date(year, month - 2, daysInPreviousMonth + dayOffset);
    } else if (dayOffset > daysInMonth) {
      cellDate = new Date(year, month - 1, dayOffset);
    } else {
      cellDate = new Date(year, month - 1, dayOffset);
    }

    const dateKey = formatDateKey(cellDate);
    cells.push({
      dateKey,
      dayLabel: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === month - 1,
      isSelected: dateKey === selectedDate,
      isToday: dateKey === todayKey,
      count: countsByDate[dateKey] || 0,
    });
  }

  return cells;
}

function formatTrend(trend) {
  if (!trend || trend.direction === "stable") {
    return { label: "0%", className: "stable", arrow: "->" };
  }
  if (trend.direction === "up") {
    return { label: `+${trend.percentage}%`, className: "up", arrow: "^" };
  }
  return { label: `-${trend.percentage}%`, className: "down", arrow: "v" };
}

function readPatientsRoute(pathname) {
  const segments = String(pathname || "")
    .split("/")
    .filter(Boolean);
  const patientsIndex = segments.lastIndexOf("patients");
  if (patientsIndex < 0) {
    return { isPatientsRoute: false, patientId: "" };
  }
  const rawId = segments[patientsIndex + 1] || "";
  return {
    isPatientsRoute: true,
    patientId: rawId ? decodeURIComponent(rawId) : "",
  };
}

function formatDateOnly(value) {
  if (!value) return "Sem data";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(parsed);
}

function physicalActivityLabel(value) {
  return PHYSICAL_ACTIVITY_LEVELS.find((item) => item.value === value)?.label || value || "--";
}

function physicalGoalLabel(value) {
  return PHYSICAL_GOALS.find((item) => item.value === value)?.label || value || "--";
}

function inferPhysicalGoalFromPatientGoal(value, fallback = "manter") {
  const normalizedFallback = PHYSICAL_GOALS.some((item) => item.value === fallback) ? fallback : "manter";
  const raw = normalizeHeader(value);
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

function physicalSexLabel(value) {
  return PHYSICAL_SEX_OPTIONS.find((item) => item.value === value)?.label || value || "--";
}

function buildEmptyPhysicalAssessmentForm(patient, latestAssessment) {
  const baseCircumferences = CIRCUMFERENCE_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {});
  const baseSkinfolds = SKINFOLD_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: "" }), {});
  const latestCircumferences = (latestAssessment?.circumferences || []).reduce((acc, item) => {
    if (!item?.type) return acc;
    acc[item.type] = String(item.valueCm ?? "").replace(".", ",");
    return acc;
  }, {});
  const latestSkinfolds = (latestAssessment?.skinfolds || []).reduce((acc, item) => {
    if (!item?.site) return acc;
    acc[item.site] = String(item.valueMm ?? "").replace(".", ",");
    return acc;
  }, {});

  return {
    date: isoToBrDate(formatDateKey(new Date())),
    weightKg: patient?.currentWeight ? String(patient.currentWeight).replace(".", ",") : "",
    heightCm: latestAssessment?.heightCm ? String(latestAssessment.heightCm).replace(".", ",") : "",
    age:
      Number.isFinite(Number(patient?.age)) && Number(patient?.age) > 0
        ? String(Math.trunc(Number(patient.age)))
        : latestAssessment?.age
          ? String(latestAssessment.age)
          : "",
    sex: latestAssessment?.sex || "",
    activityLevel: latestAssessment?.activityLevel || "moderado",
    notes: "",
    circumferences: { ...baseCircumferences, ...latestCircumferences },
    skinfolds: { ...baseSkinfolds, ...latestSkinfolds },
  };
}

function buildPhysicalAssessmentPreviewFromForm(form, resolvedGoal = "manter") {
  const weightKg = parseFoodNumber(form?.weightKg);
  const heightCm = parseFoodNumber(form?.heightCm);
  const age = Number(form?.age);
  const sex = String(form?.sex || "").trim();
  const activityLevel = String(form?.activityLevel || "").trim();
  const goal = PHYSICAL_GOALS.some((item) => item.value === resolvedGoal) ? resolvedGoal : "manter";

  const activityFactorByLevel = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    alto: 1.725,
    muitoAlto: 1.9,
  };
  if (
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !Number.isFinite(heightCm) ||
    heightCm <= 0 ||
    !Number.isInteger(age) ||
    age <= 0 ||
    !["masculino", "feminino"].includes(sex) ||
    !Object.prototype.hasOwnProperty.call(activityFactorByLevel, activityLevel) ||
    !["perder", "manter", "ganhar"].includes(goal)
  ) {
    return null;
  }

  const bmrRaw =
    sex === "masculino"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdeeRaw = bmrRaw * activityFactorByLevel[activityLevel];

  let calorieTargetRaw = tdeeRaw;
  if (goal === "perder") calorieTargetRaw = tdeeRaw - 400;
  if (goal === "ganhar") calorieTargetRaw = tdeeRaw + 300;
  if (goal === "perder") {
    calorieTargetRaw = Math.max(calorieTargetRaw, sex === "masculino" ? 1500 : 1200);
  }

  const proteinMultiplier = goal === "perder" ? 1.8 : 1.6;
  const proteinRaw = weightKg * proteinMultiplier;
  let fatRaw = weightKg * 0.8;
  let carbsRaw = (calorieTargetRaw - (proteinRaw * 4 + fatRaw * 9)) / 4;
  if (carbsRaw < 0) {
    fatRaw = weightKg * 0.6;
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

function deterministicSeed(text) {
  return Array.from(String(text || "seed")).reduce(
    (acc, char, index) => (acc + char.charCodeAt(0) * (index + 1)) % 9973,
    97,
  );
}

function buildProgressDataset(seedText, points = 7) {
  const seed = deterministicSeed(seedText);
  const values = [];
  let current = 76 + (seed % 8);
  for (let index = 0; index < points; index += 1) {
    const wave = ((seed + index * 19) % 7) - 3;
    const decay = index * 0.4;
    current = Math.max(52, Math.min(110, current + wave - decay * 0.25));
    values.push(Number(current.toFixed(1)));
  }
  return values;
}

function buildProgressLabels(count) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const labels = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    labels.push(formatter.format(new Date(now.getFullYear(), now.getMonth() - index, 1)));
  }
  return labels;
}

function normalizePatientWeightHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .map((entry) => {
      const parsedWeight = Number(entry?.weight);
      const parsedDate = new Date(entry?.recordedAt || "");
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || Number.isNaN(parsedDate.getTime())) return null;
      return {
        id:
          typeof entry?.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : `${parsedDate.toISOString()}-${parsedWeight}`,
        weight: Number(parsedWeight.toFixed(2)),
        recordedAt: parsedDate.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

function buildProgressLabelsFromHistory(weightHistory) {
  if (!weightHistory.length) return [];
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dayCounts = new Map();
  const dayTimeCounts = new Map();

  weightHistory.forEach((entry) => {
    const recordedAt = new Date(entry.recordedAt);
    const dayKey = formatDateKey(recordedAt);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
  });

  return weightHistory.map((entry) => {
    const recordedAt = new Date(entry.recordedAt);
    const dayKey = formatDateKey(recordedAt);
    const dayLabel = dayFormatter.format(recordedAt);
    if ((dayCounts.get(dayKey) || 0) <= 1) return dayLabel;

    const timeLabel = timeFormatter.format(recordedAt);
    const dayTimeKey = `${dayKey}-${timeLabel}`;
    const duplicateCount = (dayTimeCounts.get(dayTimeKey) || 0) + 1;
    dayTimeCounts.set(dayTimeKey, duplicateCount);

    if (duplicateCount > 1) {
      return `${dayLabel} ${timeLabel} (${duplicateCount})`;
    }
    return `${dayLabel} ${timeLabel}`;
  });
}

function buildProgressLabelsFromTimeline(entries) {
  if (!entries.length) return [];
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dayCounts = new Map();
  const dayTimeCounts = new Map();

  entries.forEach((entry) => {
    const recordedAt = new Date(entry?.recordedAt || "");
    if (Number.isNaN(recordedAt.getTime())) return;
    const dayKey = formatDateKey(recordedAt);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
  });

  return entries.map((entry) => {
    const recordedAt = new Date(entry?.recordedAt || "");
    if (Number.isNaN(recordedAt.getTime())) return "";
    const dayKey = formatDateKey(recordedAt);
    const dayLabel = dayFormatter.format(recordedAt);
    if ((dayCounts.get(dayKey) || 0) <= 1) return dayLabel;

    const timeLabel = timeFormatter.format(recordedAt);
    const dayTimeKey = `${dayKey}-${timeLabel}`;
    const duplicateCount = (dayTimeCounts.get(dayTimeKey) || 0) + 1;
    dayTimeCounts.set(dayTimeKey, duplicateCount);

    if (duplicateCount > 1) {
      return `${dayLabel} ${timeLabel} (${duplicateCount})`;
    }
    return `${dayLabel} ${timeLabel}`;
  });
}

function normalizePatientTargetHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];
  return rawHistory
    .map((entry) => {
      const parsedTarget = Number(entry?.targetWeight);
      const parsedDate = new Date(entry?.setAt || "");
      if (!Number.isFinite(parsedTarget) || parsedTarget <= 0 || Number.isNaN(parsedDate.getTime())) return null;
      return {
        id:
          typeof entry?.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : `${parsedDate.toISOString()}-${parsedTarget}`,
        targetWeight: Number(parsedTarget.toFixed(2)),
        setAt: parsedDate.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.setAt).getTime() - new Date(b.setAt).getTime());
}

function hasReachedTargetValue(currentWeight, targetWeight, initialWeight) {
  const current = Number(currentWeight);
  const target = Number(targetWeight);
  const initial = Number(initialWeight);
  if (!Number.isFinite(current) || !Number.isFinite(target) || !Number.isFinite(initial)) return false;

  const tolerance = 0.05;
  if (Math.abs(target - initial) <= tolerance) {
    return Math.abs(current - target) <= tolerance;
  }
  if (target < initial) {
    return current <= target + tolerance;
  }
  return current >= target - tolerance;
}

function buildSparklinePath(values, width, height, options = {}) {
  if (!values.length) return "";
  const paddingX = Number.isFinite(options.paddingX) ? options.paddingX : 14;
  const paddingY = Number.isFinite(options.paddingY) ? options.paddingY : 14;
  const minValue = Number.isFinite(options.minValue) ? options.minValue : Math.min(...values);
  const maxValue = Number.isFinite(options.maxValue) ? options.maxValue : Math.max(...values);
  const span = maxValue - minValue || 1;
  const xStep = values.length > 1 ? (width - paddingX * 2) / (values.length - 1) : 0;
  const chartHeight = height - paddingY * 2;
  return values
    .map((value, index) => {
      const x = paddingX + index * xStep;
      const y = paddingY + ((maxValue - value) / span) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function calculateMealPlanItemTotals(item, foodsCatalog) {
  const linkedFood = foodsCatalog.find((candidate) => candidate.id === item?.foodId);
  const basis = linkedFood?.measurementBasis || "100g";
  const unit = measurementBasisPortionUnit(basis);
  const portion = Number(item?.portion) || 0;
  if (!linkedFood || portion <= 0) {
    return {
      linkedFood,
      unit,
      portion,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
  }
  const factor = basis === "unidade" ? portion : portion / 100;
  return {
    linkedFood,
    unit,
    portion,
    calories: (Number(linkedFood.calories) || 0) * factor,
    protein: (Number(linkedFood.protein) || 0) * factor,
    carbs: (Number(linkedFood.carbs) || 0) * factor,
    fat: (Number(linkedFood.fat) || 0) * factor,
    fiber: (Number(linkedFood.fiber) || 0) * factor,
  };
}

function isMealPlanItemReady(item) {
  const portion = Number(item?.portion);
  return Boolean(item?.foodId) && Number.isFinite(portion) && portion > 0;
}

function mealPlanSubstitutionItemEditKey(groupName, substitutionId, itemId) {
  return `${String(groupName || "")}::${String(substitutionId || "")}::${String(itemId || "")}`;
}

function revokePhotoEntries(entries) {
  entries.forEach((photo) => {
    if (photo?.url) {
      URL.revokeObjectURL(photo.url);
    }
  });
}

export default function App() {
  const initialSession = readStoredSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(initialSession);
  const [theme, setTheme] = useState(() => readStoredTheme());
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [section, setSection] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [summary, setSummary] = useState({
    activePatients: 0,
    consultationsCount: 0,
    activePlans: 0,
    foodsInBase: 0,
    trends: {
      activePatients: { direction: "stable", percentage: 0 },
      consultationsCount: { direction: "stable", percentage: 0 },
      activePlans: { direction: "stable", percentage: 0 },
      foodsInBase: { direction: "stable", percentage: 0 },
    },
  });
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState("Todos");
  const [patientMealPlans, setPatientMealPlans] = useState({});
  const [patientMealPlanSavedAt, setPatientMealPlanSavedAt] = useState({});
  const [patientMealPlanExpanded, setPatientMealPlanExpanded] = useState({});
  const [patientMealPlanGroups, setPatientMealPlanGroups] = useState({});
  const [patientMealPlanGroupDraft, setPatientMealPlanGroupDraft] = useState({});
  const [patientMealPlanGroupCollapsed, setPatientMealPlanGroupCollapsed] = useState({});
  const [patientMealPlanItemEditMode, setPatientMealPlanItemEditMode] = useState({});
  const [patientMealPlanSubstitutionItemEditMode, setPatientMealPlanSubstitutionItemEditMode] = useState({});
  const [patientMealPlanSubstitutions, setPatientMealPlanSubstitutions] = useState({});
  const [patientMealPlanSubstitutionExpanded, setPatientMealPlanSubstitutionExpanded] = useState({});
  const [patientMealPlanDescription, setPatientMealPlanDescription] = useState({});
  const [patientMealPlanHistory, setPatientMealPlanHistory] = useState({});
  const [patientPhysicalAssessments, setPatientPhysicalAssessments] = useState({});
  const [showPhysicalAssessmentModal, setShowPhysicalAssessmentModal] = useState(false);
  const [showPhysicalAssessmentFormModal, setShowPhysicalAssessmentFormModal] = useState(false);
  const [physicalAssessmentFormMode, setPhysicalAssessmentFormMode] = useState("create");
  const [physicalAssessmentFormTab, setPhysicalAssessmentFormTab] = useState("basicos");
  const [editingPhysicalAssessmentId, setEditingPhysicalAssessmentId] = useState("");
  const [physicalAssessmentForm, setPhysicalAssessmentForm] = useState(() =>
    buildEmptyPhysicalAssessmentForm(null, null),
  );
  const [physicalAssessmentSubmitting, setPhysicalAssessmentSubmitting] = useState(false);
  const [showMealPlanHistoryModal, setShowMealPlanHistoryModal] = useState(false);
  const [showProgressHistoryModal, setShowProgressHistoryModal] = useState(false);
  const [showWeightEntryModal, setShowWeightEntryModal] = useState(false);
  const [showTargetRefreshModal, setShowTargetRefreshModal] = useState(false);
  const [weightEntryForm, setWeightEntryForm] = useState({
    progressWeight: "",
  });
  const [editingWeightEntryId, setEditingWeightEntryId] = useState("");
  const [activeProgressPointId, setActiveProgressPointId] = useState("");
  const [targetRefreshValue, setTargetRefreshValue] = useState("");
  const [patientPhotos, setPatientPhotos] = useState({});
  const [latestPatientConsultation, setLatestPatientConsultation] = useState(null);
  const [latestPatientConsultationLoading, setLatestPatientConsultationLoading] = useState(false);
  const [foodForm, setFoodForm] = useState(emptyFood);
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState("Todos");
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState("");
  const [editFoodForm, setEditFoodForm] = useState(emptyFood);
  const [foodEditSubmitting, setFoodEditSubmitting] = useState(false);
  const [patientSubmitting, setPatientSubmitting] = useState(false);
  const [foodSubmitting, setFoodSubmitting] = useState(false);
  const [consultationSubmitting, setConsultationSubmitting] = useState(false);
  const [weightEntrySubmitting, setWeightEntrySubmitting] = useState(false);
  const [targetRefreshSubmitting, setTargetRefreshSubmitting] = useState(false);
  const [mealPlanSubmitting, setMealPlanSubmitting] = useState(false);
  const [patientRemoving, setPatientRemoving] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialSession));
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const foodImportInputRef = useRef(null);
  const patientPhotosRef = useRef({});
  const settingsMenuRef = useRef(null);
  const progressChartRef = useRef(null);
  const alertedTargetMilestoneKeyRef = useRef("");
  const isDevelopmentMode = import.meta.env.DEV;
  const [foodImportFeedback, setFoodImportFeedback] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [calendarCounts, setCalendarCounts] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(Boolean(initialSession));
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => formatDateKey(new Date()).slice(0, 7));
  const [progressChartViewportRatio, setProgressChartViewportRatio] = useState(780 / 300);
  const [progressChartMode, setProgressChartMode] = useState("weight");
  const [consultationForm, setConsultationForm] = useState(() => ({
    patientId: "",
    type: "Retorno",
    date: isoToBrDate(formatDateKey(new Date())),
    time: "09:00",
    notes: "",
  }));

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        goal: item.goal || "Plano personalizado",
        createdAt: item.createdAt,
      }));
  }, [patients]);

  const patientsRoute = useMemo(() => readPatientsRoute(location.pathname), [location.pathname]);
  const isPatientsRoute = patientsRoute.isPatientsRoute;
  const routePatientId = patientsRoute.patientId;
  const isPatientProfileRoute = isPatientsRoute && Boolean(routePatientId);

  const selectedPatient = useMemo(
    () => patients.find((item) => item.id === routePatientId) || null,
    [patients, routePatientId],
  );

  const selectedMealPlanItems = useMemo(
    () => (routePatientId ? patientMealPlans[routePatientId] || [] : []),
    [patientMealPlans, routePatientId],
  );

  const selectedMealPlanSavedAt = useMemo(
    () => (routePatientId ? patientMealPlanSavedAt[routePatientId] || "" : ""),
    [patientMealPlanSavedAt, routePatientId],
  );

  const isMealPlanExpanded = useMemo(
    () => Boolean(routePatientId && patientMealPlanExpanded[routePatientId]),
    [patientMealPlanExpanded, routePatientId],
  );

  const selectedMealPlanHistory = useMemo(
    () => (routePatientId ? patientMealPlanHistory[routePatientId] || [] : []),
    [patientMealPlanHistory, routePatientId],
  );

  const selectedMealPlanGroups = useMemo(() => {
    if (!routePatientId) return [];
    const explicitGroups = (patientMealPlanGroups[routePatientId] || []).map((item) => String(item || "").trim());
    const itemGroups = (patientMealPlans[routePatientId] || [])
      .map((item) => String(item.mealOccasion || DEFAULT_MEAL_OCCASION).trim())
      .filter(Boolean);
    const merged = [];
    [...explicitGroups, ...itemGroups].forEach((groupName) => {
      if (groupName && !merged.includes(groupName)) merged.push(groupName);
    });
    return merged;
  }, [patientMealPlanGroups, patientMealPlans, routePatientId]);

  const selectedMealPlanGroupDraft = useMemo(
    () => (routePatientId ? patientMealPlanGroupDraft[routePatientId] || "" : ""),
    [patientMealPlanGroupDraft, routePatientId],
  );

  const selectedMealPlanGroupCollapsedMap = useMemo(
    () => (routePatientId ? patientMealPlanGroupCollapsed[routePatientId] || {} : {}),
    [patientMealPlanGroupCollapsed, routePatientId],
  );

  const selectedMealPlanItemEditModeMap = useMemo(
    () => (routePatientId ? patientMealPlanItemEditMode[routePatientId] || {} : {}),
    [patientMealPlanItemEditMode, routePatientId],
  );

  const selectedMealPlanSubstitutionItemEditModeMap = useMemo(
    () => (routePatientId ? patientMealPlanSubstitutionItemEditMode[routePatientId] || {} : {}),
    [patientMealPlanSubstitutionItemEditMode, routePatientId],
  );

  const selectedMealPlanSubstitutionsMap = useMemo(
    () => (routePatientId ? patientMealPlanSubstitutions[routePatientId] || {} : {}),
    [patientMealPlanSubstitutions, routePatientId],
  );

  const selectedMealPlanSubstitutionExpandedMap = useMemo(
    () => (routePatientId ? patientMealPlanSubstitutionExpanded[routePatientId] || {} : {}),
    [patientMealPlanSubstitutionExpanded, routePatientId],
  );

  const selectedMealPlanDescription = useMemo(
    () => (routePatientId ? patientMealPlanDescription[routePatientId] || "" : ""),
    [patientMealPlanDescription, routePatientId],
  );

  const selectedPatientPhysicalAssessments = useMemo(() => {
    if (!routePatientId) return [];
    return [...(patientPhysicalAssessments[routePatientId] || [])].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [patientPhysicalAssessments, routePatientId]);

  const selectedPatientPhotos = useMemo(
    () => (routePatientId ? patientPhotos[routePatientId] || [] : []),
    [patientPhotos, routePatientId],
  );

  const selectedPatientWeightHistory = useMemo(
    () => normalizePatientWeightHistory(selectedPatient?.weightHistory),
    [selectedPatient],
  );

  const selectedPatientTargetHistory = useMemo(
    () => normalizePatientTargetHistory(selectedPatient?.targetHistory),
    [selectedPatient],
  );

  const latestPhysicalAssessment = useMemo(
    () => selectedPatientPhysicalAssessments[0] || null,
    [selectedPatientPhysicalAssessments],
  );
  const canRegisterWeightProgress = selectedPatientPhysicalAssessments.length > 0;

  const physicalAssessmentEvolution = useMemo(() => {
    if (selectedPatientPhysicalAssessments.length < 2) return null;
    const latest = selectedPatientPhysicalAssessments[0];
    const oldest = selectedPatientPhysicalAssessments[selectedPatientPhysicalAssessments.length - 1];
    return {
      weightDelta: Number((Number(latest.weightKg || 0) - Number(oldest.weightKg || 0)).toFixed(2)),
      tdeeDelta: Number((Number(latest.tdee || 0) - Number(oldest.tdee || 0)).toFixed(2)),
    };
  }, [selectedPatientPhysicalAssessments]);
  const resolvedPhysicalAssessmentGoal = useMemo(
    () => inferPhysicalGoalFromPatientGoal(selectedPatient?.goal, latestPhysicalAssessment?.goal || "manter"),
    [latestPhysicalAssessment?.goal, selectedPatient?.goal],
  );

  const physicalAssessmentPreviewResult = useMemo(
    () => buildPhysicalAssessmentPreviewFromForm(physicalAssessmentForm, resolvedPhysicalAssessmentGoal),
    [physicalAssessmentForm, resolvedPhysicalAssessmentGoal],
  );

  const isPhysicalAssessmentReadOnly = physicalAssessmentFormMode === "view";

  const progressTarget =
    selectedPatient?.targetWeight !== undefined &&
    selectedPatient?.targetWeight !== null &&
    Number.isFinite(Number(selectedPatient.targetWeight))
      ? Number(selectedPatient.targetWeight)
      : null;

  const persistedCurrentWeight =
    selectedPatient?.currentWeight !== undefined &&
    selectedPatient?.currentWeight !== null &&
    Number.isFinite(Number(selectedPatient.currentWeight))
      ? Number(selectedPatient.currentWeight)
      : null;

  const progressSeries = useMemo(
    () =>
      selectedPatientWeightHistory.length
        ? selectedPatientWeightHistory.map((entry) => entry.weight)
        : persistedCurrentWeight !== null
          ? [persistedCurrentWeight]
          : [],
    [persistedCurrentWeight, selectedPatientWeightHistory],
  );

  const progressLabels = useMemo(() => {
    if (selectedPatientWeightHistory.length) {
      return buildProgressLabelsFromHistory(selectedPatientWeightHistory);
    }
    return buildProgressLabels(progressSeries.length);
  }, [progressSeries.length, selectedPatientWeightHistory]);
  const progressMeasurementEntries = useMemo(() => {
    if (!selectedPatientPhysicalAssessments.length) return [];
    return selectedPatientPhysicalAssessments
      .map((assessment) => {
        const recordedAt = new Date(assessment?.date || assessment?.createdAt || "");
        if (Number.isNaN(recordedAt.getTime())) return null;

        const circumferenceEntries = Array.isArray(assessment?.circumferences) ? assessment.circumferences : [];
        const skinfoldEntries = Array.isArray(assessment?.skinfolds) ? assessment.skinfolds : [];

        const waistEntry = circumferenceEntries.find((entry) => String(entry?.type || "").trim() === "cintura");
        const waistValue = Number(waistEntry?.valueCm);

        const circumferenceValues = circumferenceEntries
          .map((entry) => Number(entry?.valueCm))
          .filter((value) => Number.isFinite(value) && value > 0);
        const skinfoldValues = skinfoldEntries
          .map((entry) => Number(entry?.valueMm))
          .filter((value) => Number.isFinite(value) && value > 0);

        const measurementValue =
          Number.isFinite(waistValue) && waistValue > 0
            ? Number(waistValue.toFixed(2))
            : circumferenceValues.length
              ? Number(
                  (circumferenceValues.reduce((sum, value) => sum + value, 0) / circumferenceValues.length).toFixed(
                    2,
                  ),
                )
              : null;

        if (measurementValue === null || !skinfoldValues.length) return null;

        const skinfoldTotal = Number(skinfoldValues.reduce((sum, value) => sum + value, 0).toFixed(2));
        if (!Number.isFinite(skinfoldTotal) || skinfoldTotal <= 0) return null;

        return {
          id: String(assessment?.id || `${recordedAt.toISOString()}-${measurementValue}-${skinfoldTotal}`),
          recordedAt: recordedAt.toISOString(),
          measurementValue,
          skinfoldTotal,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }, [selectedPatientPhysicalAssessments]);
  const progressMeasurementSeries = useMemo(
    () => progressMeasurementEntries.map((entry) => entry.measurementValue),
    [progressMeasurementEntries],
  );
  const progressSkinfoldSeries = useMemo(
    () => progressMeasurementEntries.map((entry) => entry.skinfoldTotal),
    [progressMeasurementEntries],
  );
  const progressMeasurementLabels = useMemo(
    () => buildProgressLabelsFromTimeline(progressMeasurementEntries),
    [progressMeasurementEntries],
  );
  const progressChartHeight = 320;
  const progressChartWidth = Math.max(520, Math.round(progressChartViewportRatio * progressChartHeight));
  const progressChartPaddingX = 42;
  const progressChartPaddingY = 30;
  const progressChartLeftX = progressChartPaddingX;
  const progressChartRightX = progressChartWidth - progressChartPaddingX;
  const progressChartBottomY = progressChartHeight - progressChartPaddingY;
  const progressScale = useMemo(() => {
    if (!progressSeries.length) return null;
    const rawMin = Math.min(...progressSeries);
    const rawMax = Math.max(...progressSeries);
    const rawSpan = rawMax - rawMin;
    const breathingSpace = Math.max(0.6, rawSpan * 0.18);
    const minValue = Math.max(0, Number((rawMin - breathingSpace).toFixed(2)));
    const maxValue = Number((rawMax + breathingSpace).toFixed(2));
    const span = maxValue - minValue || 1;
    return {
      minValue,
      maxValue,
      span,
      innerWidth: progressChartWidth - progressChartPaddingX * 2,
      innerHeight: progressChartHeight - progressChartPaddingY * 2,
    };
  }, [progressChartHeight, progressChartPaddingX, progressChartPaddingY, progressChartWidth, progressSeries]);
  const progressPath = useMemo(() => {
    if (!progressScale) return "";
    return buildSparklinePath(progressSeries, progressChartWidth, progressChartHeight, {
      paddingX: progressChartPaddingX,
      paddingY: progressChartPaddingY,
      minValue: progressScale.minValue,
      maxValue: progressScale.maxValue,
    });
  }, [progressChartHeight, progressChartPaddingX, progressChartPaddingY, progressChartWidth, progressScale, progressSeries]);
  const progressYAxisTicks = useMemo(() => {
    if (!progressScale) return [];
    return [0, 0.5, 1].map((ratio) => ({
      ratio,
      value: Number((progressScale.maxValue - progressScale.span * ratio).toFixed(1)),
      y: progressChartPaddingY + progressScale.innerHeight * ratio,
    }));
  }, [progressChartPaddingY, progressScale]);
  const progressTargetY = useMemo(() => {
    if (progressTarget === null || !progressScale) return null;
    const clampedTarget = Math.min(progressScale.maxValue, Math.max(progressScale.minValue, progressTarget));
    return progressChartPaddingY + ((progressScale.maxValue - clampedTarget) / progressScale.span) * progressScale.innerHeight;
  }, [progressChartPaddingY, progressScale, progressTarget]);
  const progressCurrent = progressSeries.length > 0 ? progressSeries[progressSeries.length - 1] : null;
  const progressStart = progressSeries.length > 0 ? progressSeries[0] : progressCurrent;
  const progressDelta =
    progressCurrent !== null && progressStart !== null
      ? Number((progressCurrent - progressStart).toFixed(1))
      : null;
  const hasWeightMeasurements = progressCurrent !== null || selectedPatientWeightHistory.length > 0;
  const hasEvolutionData = hasWeightMeasurements || progressTarget !== null;
  const activeTargetEntry = useMemo(() => {
    if (selectedPatientTargetHistory.length > 0) {
      return selectedPatientTargetHistory[selectedPatientTargetHistory.length - 1];
    }
    if (progressTarget !== null) {
      return {
        id: "current-target",
        targetWeight: progressTarget,
        setAt: selectedPatient?.targetWeightSetAt || "",
      };
    }
    return null;
  }, [progressTarget, selectedPatient?.targetWeightSetAt, selectedPatientTargetHistory]);
  const activeTargetCycleStartWeight = useMemo(() => {
    if (!activeTargetEntry) return progressStart;
    if (!selectedPatientWeightHistory.length) return progressCurrent;
    const targetSetAtMs = activeTargetEntry.setAt ? new Date(activeTargetEntry.setAt).getTime() : NaN;
    if (!Number.isFinite(targetSetAtMs)) return progressStart;
    const firstAfterTargetSet = selectedPatientWeightHistory.find(
      (entry) => new Date(entry.recordedAt).getTime() >= targetSetAtMs,
    );
    if (firstAfterTargetSet) return firstAfterTargetSet.weight;
    const beforeTargetSet = [...selectedPatientWeightHistory]
      .reverse()
      .find((entry) => new Date(entry.recordedAt).getTime() < targetSetAtMs);
    if (beforeTargetSet) return beforeTargetSet.weight;
    return progressStart;
  }, [activeTargetEntry, progressCurrent, progressStart, selectedPatientWeightHistory]);
  const shouldShowTargetRefreshAlert = useMemo(() => {
    if (!activeTargetEntry || progressCurrent === null) return false;
    const cycleStartWeight =
      activeTargetCycleStartWeight !== null && activeTargetCycleStartWeight !== undefined
        ? activeTargetCycleStartWeight
        : progressStart !== null
          ? progressStart
          : progressCurrent;
    return hasReachedTargetValue(progressCurrent, activeTargetEntry.targetWeight, cycleStartWeight);
  }, [activeTargetCycleStartWeight, activeTargetEntry, progressCurrent, progressStart]);
  const activeTargetMilestoneKey = useMemo(() => {
    if (!selectedPatient?.id || !activeTargetEntry) return "";
    return `${selectedPatient.id}:${activeTargetEntry.id || "target"}:${activeTargetEntry.setAt || ""}:${activeTargetEntry.targetWeight}`;
  }, [activeTargetEntry, selectedPatient?.id]);
  useEffect(() => {
    if (!shouldShowTargetRefreshAlert || !activeTargetMilestoneKey) return;
    if (alertedTargetMilestoneKeyRef.current === activeTargetMilestoneKey) return;
    alertedTargetMilestoneKeyRef.current = activeTargetMilestoneKey;
    window.alert("Meta atual atingida. Defina uma nova meta para continuar a progressao.");
  }, [activeTargetMilestoneKey, shouldShowTargetRefreshAlert]);
  const progressHistoryEntries = useMemo(() => {
    const entries = [];
    const firstWeightEntry = selectedPatientWeightHistory[0] || null;

    if (selectedPatientTargetHistory.length > 0) {
      selectedPatientTargetHistory.forEach((entry, index) => {
        entries.push({
          id: `target-${entry.id}`,
          title: index === 0 ? "Meta inicial" : `Nova meta ${index}`,
          value: `${formatDecimal(entry.targetWeight)} kg`,
          date: entry.setAt || firstWeightEntry?.recordedAt || "",
        });
      });
    } else if (progressTarget !== null) {
      entries.push({
        id: "initial-target",
        title: "Meta inicial",
        value: `${formatDecimal(progressTarget)} kg`,
        date: selectedPatient?.targetWeightSetAt || firstWeightEntry?.recordedAt || "",
      });
    }

    selectedPatientWeightHistory.forEach((entry, index) => {
      entries.push({
        id: `progress-${entry.id}`,
        title: `Progressão ${index + 1}`,
        value: `${formatDecimal(entry.weight)} kg`,
        date: entry.recordedAt,
      });
    });

    return entries.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }, [progressTarget, selectedPatient?.targetWeightSetAt, selectedPatientTargetHistory, selectedPatientWeightHistory]);
  const progressPoints = useMemo(() => {
    if (!progressSeries.length || !progressScale) return [];
    const xStep = progressSeries.length > 1 ? progressScale.innerWidth / (progressSeries.length - 1) : 0;
    const latestIndex = progressSeries.length - 1;
    return progressSeries.map((value, index) => {
      const sourceEntry = selectedPatientWeightHistory[index] || null;
      const sourceEntryId = String(sourceEntry?.id || "").trim();
      const isAssessmentSource = sourceEntryId.startsWith("assessment-");
      return {
        key: `${index}-${value}`,
        value,
        sourceEntry,
        sourceEntryId,
        isAssessmentSource,
        canManage: Boolean(sourceEntry) && !isAssessmentSource,
        isLatest: index === latestIndex,
        x: progressChartPaddingX + index * xStep,
        y: progressChartPaddingY + ((progressScale.maxValue - value) / progressScale.span) * progressScale.innerHeight,
      };
    });
  }, [progressChartPaddingX, progressChartPaddingY, progressScale, progressSeries, selectedPatientWeightHistory]);
  const progressMeasurementScale = useMemo(() => {
    if (!progressMeasurementSeries.length) return null;
    const rawMin = Math.min(...progressMeasurementSeries);
    const rawMax = Math.max(...progressMeasurementSeries);
    const rawSpan = rawMax - rawMin;
    const breathingSpace = Math.max(0.8, rawSpan * 0.2);
    const minValue = Math.max(0, Number((rawMin - breathingSpace).toFixed(2)));
    const maxValue = Number((rawMax + breathingSpace).toFixed(2));
    const span = maxValue - minValue || 1;
    return {
      minValue,
      maxValue,
      span,
      innerWidth: progressChartWidth - progressChartPaddingX * 2,
      innerHeight: progressChartHeight - progressChartPaddingY * 2,
    };
  }, [progressChartHeight, progressChartPaddingX, progressChartPaddingY, progressChartWidth, progressMeasurementSeries]);
  const progressSkinfoldScale = useMemo(() => {
    if (!progressSkinfoldSeries.length) return null;
    const rawMin = Math.min(...progressSkinfoldSeries);
    const rawMax = Math.max(...progressSkinfoldSeries);
    const rawSpan = rawMax - rawMin;
    const breathingSpace = Math.max(2, rawSpan * 0.2);
    const minValue = Math.max(0, Number((rawMin - breathingSpace).toFixed(2)));
    const maxValue = Number((rawMax + breathingSpace).toFixed(2));
    const span = maxValue - minValue || 1;
    return {
      minValue,
      maxValue,
      span,
      innerWidth: progressChartWidth - progressChartPaddingX * 2,
      innerHeight: progressChartHeight - progressChartPaddingY * 2,
    };
  }, [progressChartHeight, progressChartPaddingX, progressChartPaddingY, progressChartWidth, progressSkinfoldSeries]);
  const progressMeasurementPath = useMemo(() => {
    if (!progressMeasurementScale) return "";
    return buildSparklinePath(progressMeasurementSeries, progressChartWidth, progressChartHeight, {
      paddingX: progressChartPaddingX,
      paddingY: progressChartPaddingY,
      minValue: progressMeasurementScale.minValue,
      maxValue: progressMeasurementScale.maxValue,
    });
  }, [
    progressChartHeight,
    progressChartPaddingX,
    progressChartPaddingY,
    progressChartWidth,
    progressMeasurementScale,
    progressMeasurementSeries,
  ]);
  const progressSkinfoldPath = useMemo(() => {
    if (!progressSkinfoldScale) return "";
    return buildSparklinePath(progressSkinfoldSeries, progressChartWidth, progressChartHeight, {
      paddingX: progressChartPaddingX,
      paddingY: progressChartPaddingY,
      minValue: progressSkinfoldScale.minValue,
      maxValue: progressSkinfoldScale.maxValue,
    });
  }, [
    progressChartHeight,
    progressChartPaddingX,
    progressChartPaddingY,
    progressChartWidth,
    progressSkinfoldScale,
    progressSkinfoldSeries,
  ]);
  const progressMeasurementYAxisTicks = useMemo(() => {
    if (!progressMeasurementScale) return [];
    return [0, 0.5, 1].map((ratio) => ({
      ratio,
      value: Number((progressMeasurementScale.maxValue - progressMeasurementScale.span * ratio).toFixed(1)),
      y: progressChartPaddingY + progressMeasurementScale.innerHeight * ratio,
    }));
  }, [progressChartPaddingY, progressMeasurementScale]);
  const progressSkinfoldYAxisTicks = useMemo(() => {
    if (!progressSkinfoldScale) return [];
    return [0, 0.5, 1].map((ratio) => ({
      ratio,
      value: Number((progressSkinfoldScale.maxValue - progressSkinfoldScale.span * ratio).toFixed(1)),
      y: progressChartPaddingY + progressSkinfoldScale.innerHeight * ratio,
    }));
  }, [progressChartPaddingY, progressSkinfoldScale]);
  const progressMeasurementPoints = useMemo(() => {
    if (!progressMeasurementEntries.length || !progressMeasurementScale || !progressSkinfoldScale) return [];
    const xStep = progressMeasurementEntries.length > 1 ? progressMeasurementScale.innerWidth / (progressMeasurementEntries.length - 1) : 0;
    return progressMeasurementEntries.map((entry, index) => ({
      key: entry.id || `assessment-point-${index}`,
      x: progressChartPaddingX + index * xStep,
      measurementY:
        progressChartPaddingY +
        ((progressMeasurementScale.maxValue - entry.measurementValue) / progressMeasurementScale.span) *
          progressMeasurementScale.innerHeight,
      skinfoldY:
        progressChartPaddingY +
        ((progressSkinfoldScale.maxValue - entry.skinfoldTotal) / progressSkinfoldScale.span) *
          progressSkinfoldScale.innerHeight,
      measurementValue: entry.measurementValue,
      skinfoldTotal: entry.skinfoldTotal,
    }));
  }, [
    progressChartPaddingX,
    progressChartPaddingY,
    progressMeasurementEntries,
    progressMeasurementScale,
    progressSkinfoldScale,
  ]);
  const progressMeasurementCurrent =
    progressMeasurementSeries.length > 0 ? progressMeasurementSeries[progressMeasurementSeries.length - 1] : null;
  const progressMeasurementStart =
    progressMeasurementSeries.length > 0 ? progressMeasurementSeries[0] : progressMeasurementCurrent;
  const progressMeasurementDelta =
    progressMeasurementCurrent !== null && progressMeasurementStart !== null
      ? Number((progressMeasurementCurrent - progressMeasurementStart).toFixed(1))
      : null;
  const progressSkinfoldCurrent =
    progressSkinfoldSeries.length > 0 ? progressSkinfoldSeries[progressSkinfoldSeries.length - 1] : null;
  const progressSkinfoldStart =
    progressSkinfoldSeries.length > 0 ? progressSkinfoldSeries[0] : progressSkinfoldCurrent;
  const progressSkinfoldDelta =
    progressSkinfoldCurrent !== null && progressSkinfoldStart !== null
      ? Number((progressSkinfoldCurrent - progressSkinfoldStart).toFixed(1))
      : null;
  const isWeightProgressChart = progressChartMode === "weight";
  const progressBadgeLabel = isWeightProgressChart
    ? progressDelta !== null
      ? progressDelta <= 0
        ? "Evolucao positiva"
        : "Atencao"
      : "Sem dados"
    : progressMeasurementDelta !== null || progressSkinfoldDelta !== null
      ? progressMeasurementDelta !== null && progressMeasurementDelta <= 0
        ? "Medidas em queda"
        : progressSkinfoldDelta !== null && progressSkinfoldDelta <= 0
          ? "Dobras em queda"
          : "Acompanhamento"
      : "Sem dados";
  const progressPrimaryActionLabel = isWeightProgressChart
    ? "Registrar progressão de pesagem"
    : "Nova avaliação física";
  const progressPrimaryActionDisabled = isWeightProgressChart ? !canRegisterWeightProgress : !selectedPatient?.id;
  useEffect(() => {
    setActiveProgressPointId("");
    setEditingWeightEntryId("");
    setProgressChartMode("weight");
  }, [routePatientId]);

  useEffect(() => {
    if (isWeightProgressChart) return;
    setActiveProgressPointId("");
    setEditingWeightEntryId("");
  }, [isWeightProgressChart]);

  const mealPlanTotals = useMemo(() => {
    return selectedMealPlanItems.reduce(
      (acc, item) => {
        const itemTotals = calculateMealPlanItemTotals(item, foods);
        acc.calories += itemTotals.calories;
        acc.protein += itemTotals.protein;
        acc.carbs += itemTotals.carbs;
        acc.fat += itemTotals.fat;
        acc.fiber += itemTotals.fiber;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }, [foods, selectedMealPlanItems]);

  const filteredPatients = useMemo(() => {
    const normalizedQuery = normalizeHeader(patientSearch);
    return patients.filter((item) => {
      const hasGoal = Boolean(item.goal?.trim());
      const hasEmail = Boolean(item.email?.trim());
      const hasPhone = Boolean(item.phone?.trim());

      let matchesFilter = true;
      if (patientFilter === "Com objetivo") matchesFilter = hasGoal;
      if (patientFilter === "Sem objetivo") matchesFilter = !hasGoal;
      if (patientFilter === "Com email") matchesFilter = hasEmail;
      if (patientFilter === "Sem email") matchesFilter = !hasEmail;
      if (patientFilter === "Com telefone") matchesFilter = hasPhone;
      if (patientFilter === "Sem telefone") matchesFilter = !hasPhone;

      const matchesSearch =
        !normalizedQuery ||
        normalizeHeader(item.name).includes(normalizedQuery) ||
        normalizeHeader(item.goal).includes(normalizedQuery) ||
        normalizeHeader(item.email).includes(normalizedQuery) ||
        normalizeHeader(item.phone).includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    });
  }, [patients, patientFilter, patientSearch]);

  const filteredFoods = useMemo(() => {
    const normalizedQuery = normalizeHeader(foodSearch);
    return foods.filter((item) => {
      const itemCategory = normalizeFoodCategory(item.category);
      const matchesCategory =
        selectedFoodCategory === "Todos" || itemCategory === selectedFoodCategory;
      const matchesQuery =
        !normalizedQuery ||
        normalizeHeader(item.name).includes(normalizedQuery) ||
        normalizeHeader(itemCategory).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [foods, foodSearch, selectedFoodCategory]);

  const calendarCells = useMemo(
    () => buildCalendarCells(selectedMonth, selectedDate, calendarCounts),
    [calendarCounts, selectedDate, selectedMonth],
  );

  const cards = useMemo(
    () => [
      {
        title: "Pacientes Ativos",
        value: summary.activePatients ?? 0,
        tone: "blue",
        trend: formatTrend(summary.trends?.activePatients),
      },
      {
        title: "Quantidade de Consultas",
        value: summary.consultationsCount ?? 0,
        tone: "green",
        trend: formatTrend(summary.trends?.consultationsCount),
      },
      {
        title: "Planos Ativos",
        value: summary.activePlans ?? 0,
        tone: "purple",
        trend: formatTrend(summary.trends?.activePlans),
      },
      {
        title: "Alimentos na Base",
        value: summary.foodsInBase ?? 0,
        tone: "orange",
        trend: formatTrend(summary.trends?.foodsInBase),
      },
    ],
    [summary]
  );

  const selectedDateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${selectedDate}T00:00:00`));
  }, [selectedDate]);

  async function loadData(options = {}) {
    const { showGlobalLoader = true } = options;
    if (showGlobalLoader) {
      setLoading(true);
    }
    setError("");
    try {
      const [summaryData, patientsData, foodsData, plansData, physicalAssessmentsData] = await Promise.all([
        api.getSummary(),
        api.getPatients(),
        api.getFoods(),
        api.getPlans(),
        api.getPhysicalAssessments(),
      ]);
      setSummary(summaryData);
      setPatients(patientsData);
      setFoods(foodsData);

      const nextMealPlans = {};
      const nextMealPlanSavedAt = {};
      const nextMealPlanGroups = {};
      const nextMealPlanSubstitutions = {};
      const nextMealPlanDescription = {};
      const nextMealPlanHistory = {};
      const nextPhysicalAssessments = {};

      (plansData || []).forEach((plan) => {
        const patientId = String(plan?.patientId || "").trim();
        if (!patientId) return;
        nextMealPlans[patientId] = Array.isArray(plan.items) ? plan.items : [];
        nextMealPlanSavedAt[patientId] = plan.savedAt || "";
        nextMealPlanGroups[patientId] = Array.isArray(plan.groups) ? plan.groups : [];
        nextMealPlanSubstitutions[patientId] =
          plan.substitutions && typeof plan.substitutions === "object" && !Array.isArray(plan.substitutions)
            ? plan.substitutions
            : {};
        nextMealPlanDescription[patientId] = typeof plan.description === "string" ? plan.description : "";
        nextMealPlanHistory[patientId] = Array.isArray(plan.history) ? plan.history : [];
      });

      (physicalAssessmentsData || []).forEach((assessment) => {
        const patientId = String(assessment?.patientId || "").trim();
        if (!patientId) return;
        if (!nextPhysicalAssessments[patientId]) nextPhysicalAssessments[patientId] = [];
        nextPhysicalAssessments[patientId].push(assessment);
      });

      setPatientMealPlans(nextMealPlans);
      setPatientMealPlanSavedAt(nextMealPlanSavedAt);
      setPatientMealPlanGroups(nextMealPlanGroups);
      setPatientMealPlanSubstitutions(nextMealPlanSubstitutions);
      setPatientMealPlanDescription(nextMealPlanDescription);
      setPatientMealPlanHistory(nextMealPlanHistory);
      setPatientPhysicalAssessments(nextPhysicalAssessments);
    } catch (requestError) {
      if (
        requestError.message === "Nao autenticado." ||
        requestError.message === "Token invalido ou expirado."
      ) {
        handleLogout();
        return;
      }
      setError(requestError.message);
    } finally {
      if (showGlobalLoader) {
        setLoading(false);
      }
    }
  }

  async function loadScheduleData() {
    setScheduleLoading(true);
    try {
      const [consultationsData, calendarData] = await Promise.all([
        api.getConsultationsByDate(selectedDate),
        api.getConsultationsCalendar(selectedMonth),
      ]);
      setConsultations(consultationsData);
      const nextCounts = {};
      calendarData.forEach((entry) => {
        nextCounts[entry.date] = entry.count;
      });
      setCalendarCounts(nextCounts);
    } catch (requestError) {
      if (
        requestError.message === "Nao autenticado." ||
        requestError.message === "Token invalido ou expirado."
      ) {
        handleLogout();
        return;
      }
      setError(requestError.message);
    } finally {
      setScheduleLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      loadScheduleData();
    }
  }, [session, selectedDate, selectedMonth]);

  useEffect(() => {
    setConsultationForm((prev) => ({ ...prev, date: isoToBrDate(selectedDate) }));
  }, [selectedDate]);

  useEffect(() => {
    if (!editingFoodId) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFoodEditor();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingFoodId, foodEditSubmitting]);

  useEffect(() => {
    if (isPatientsRoute) {
      if (section !== "patients") setSection("patients");
      return;
    }
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, [isPatientsRoute, location.pathname, navigate, section]);

  useEffect(() => {
    patientPhotosRef.current = patientPhotos;
  }, [patientPhotos]);

  useEffect(() => {
    return () => {
      Object.values(patientPhotosRef.current)
        .flat()
        .forEach((photo) => {
          if (photo?.url) URL.revokeObjectURL(photo.url);
        });
    };
  }, []);

  useEffect(() => {
    if (!isPatientProfileRoute || !selectedPatient?.id) {
      setLatestPatientConsultation(null);
      setLatestPatientConsultationLoading(false);
      return;
    }

    let cancelled = false;
    async function loadLatestConsultation() {
      setLatestPatientConsultationLoading(true);
      try {
        const latest = await api.getLatestConsultation(selectedPatient.id);
        if (!cancelled) {
          setLatestPatientConsultation(latest || null);
        }
      } catch {
        if (!cancelled) {
          setLatestPatientConsultation(null);
        }
      } finally {
        if (!cancelled) {
          setLatestPatientConsultationLoading(false);
        }
      }
    }

    loadLatestConsultation();
    return () => {
      cancelled = true;
    };
  }, [isPatientProfileRoute, selectedPatient?.id]);

  useEffect(() => {
    if (!isPatientProfileRoute) {
      setShowPhysicalAssessmentModal(false);
      setShowPhysicalAssessmentFormModal(false);
      setShowMealPlanHistoryModal(false);
    }
  }, [isPatientProfileRoute, loading, selectedPatient?.id]);

  useEffect(() => {
    const chartElement = progressChartRef.current;
    if (!isPatientProfileRoute || !chartElement) return undefined;

    function updateRatio(width, height) {
      const nextWidth = Number(width || 0);
      const nextHeight = Number(height || 0);
      if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth <= 0 || nextHeight <= 0) {
        return;
      }
      const nextRatio = nextWidth / nextHeight;
      setProgressChartViewportRatio((prev) => (Math.abs(prev - nextRatio) < 0.01 ? prev : nextRatio));
    }

    function measureNow() {
      const rect = chartElement.getBoundingClientRect();
      updateRatio(rect.width, rect.height);
    }

    measureNow();
    const frameId = window.requestAnimationFrame(measureNow);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        updateRatio(entry.contentRect.width, entry.contentRect.height);
      });
      observer.observe(chartElement);
      return () => {
        window.cancelAnimationFrame(frameId);
        observer.disconnect();
      };
    }

    window.addEventListener("resize", measureNow);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measureNow);
    };
  }, [isPatientProfileRoute, selectedPatient?.id]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!showSettingsMenu) return undefined;

    function handleOutsideSettings(event) {
      if (!settingsMenuRef.current?.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    }

    function handleEscapeSettings(event) {
      if (event.key === "Escape") {
        setShowSettingsMenu(false);
      }
    }

    window.addEventListener("mousedown", handleOutsideSettings);
    window.addEventListener("keydown", handleEscapeSettings);
    return () => {
      window.removeEventListener("mousedown", handleOutsideSettings);
      window.removeEventListener("keydown", handleEscapeSettings);
    };
  }, [showSettingsMenu]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;
    if (!email || !password) {
      setLoginError("Preencha email e senha.");
      return;
    }

    setAuthSubmitting(true);
    try {
      const auth = await api.login({ email, password });
      const nextSession = {
        token: auth.token,
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      if (isPatientsRoute) {
        setSection("patients");
      } else {
        setSection("dashboard");
        navigate("/", { replace: true });
      }
    } catch (requestError) {
      setLoginError(requestError.message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleLogout() {
    Object.values(patientPhotos)
      .flat()
      .forEach((photo) => {
        if (photo?.url) URL.revokeObjectURL(photo.url);
      });
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setLoading(false);
    setScheduleLoading(false);
    setSection("dashboard");
    setError("");
    setLoginError("");
    setFoodImportFeedback(null);
    setLoginForm({ email: "", password: "" });
    setConsultations([]);
    setCalendarCounts({});
    const today = formatDateKey(new Date());
    setSelectedDate(today);
    setSelectedMonth(today.slice(0, 7));
    setShowConsultationForm(false);
    setFoodSearch("");
    setSelectedFoodCategory("Todos");
    setPatientSearch("");
    setPatientFilter("Todos");
    setPatientMealPlans({});
    setPatientMealPlanSavedAt({});
    setPatientMealPlanExpanded({});
    setPatientMealPlanGroups({});
    setPatientMealPlanGroupDraft({});
    setPatientMealPlanGroupCollapsed({});
    setPatientMealPlanItemEditMode({});
    setPatientMealPlanSubstitutionItemEditMode({});
    setPatientMealPlanSubstitutions({});
    setPatientMealPlanSubstitutionExpanded({});
    setPatientMealPlanDescription({});
    setPatientMealPlanHistory({});
    setPatientPhysicalAssessments({});
    setShowPhysicalAssessmentModal(false);
    setShowPhysicalAssessmentFormModal(false);
    setPhysicalAssessmentFormMode("create");
    setPhysicalAssessmentFormTab("basicos");
    setEditingPhysicalAssessmentId("");
    setPhysicalAssessmentForm(buildEmptyPhysicalAssessmentForm(null, null));
    setPhysicalAssessmentSubmitting(false);
    setShowMealPlanHistoryModal(false);
    setShowProgressHistoryModal(false);
    setShowWeightEntryModal(false);
    setShowTargetRefreshModal(false);
    setWeightEntryForm({ progressWeight: "" });
    setTargetRefreshValue("");
    setPatientPhotos({});
    setLatestPatientConsultation(null);
    setLatestPatientConsultationLoading(false);
    setShowFoodForm(false);
    setEditingFoodId("");
    setEditFoodForm(emptyFood);
    setFoodEditSubmitting(false);
    setPatientSubmitting(false);
    setFoodSubmitting(false);
    setConsultationSubmitting(false);
    setWeightEntrySubmitting(false);
    setTargetRefreshSubmitting(false);
    setMealPlanSubmitting(false);
    setPatientRemoving(false);
    navigate("/", { replace: true });
  }

  async function handlePatientSubmit(event) {
    event.preventDefault();
    setError("");
    setPatientSubmitting(true);
    try {
      await api.createPatient({
        name: patientForm.name,
        age: patientForm.age ? Number(patientForm.age) : undefined,
        goal: patientForm.goal,
        phone: patientForm.phone,
        email: patientForm.email,
      });
      setPatientForm(emptyPatient);
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPatientSubmitting(false);
    }
  }

  async function handleFoodSubmit(event) {
    event.preventDefault();
    setError("");
    setFoodImportFeedback(null);
    setFoodSubmitting(true);
    try {
      await api.createFood({
        name: foodForm.name.trim(),
        category: normalizeFoodCategory(foodForm.category),
        measurementBasis: foodForm.measurementBasis,
        calories: Number(foodForm.calories),
        protein: Number(foodForm.protein),
        carbs: Number(foodForm.carbs),
        fat: Number(foodForm.fat),
        fiber: Number(foodForm.fiber),
      });
      setFoodForm(emptyFood);
      setShowFoodForm(false);
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFoodSubmitting(false);
    }
  }

  function downloadFoodTemplate() {
    const csvContent = [
      "name;category;measurementBasis;calories;protein;carbs;fat;fiber",
      "Banana prata;Frutas;100g;89;1.1;22.8;0.3;2.6",
      "Leite integral;Laticinios;100ml;61;3.2;4.7;3.3;0",
      "Ovo cozido;Proteinas;unidade;78;6.3;0.6;5.3;0",
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = FOOD_TEMPLATE_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFoodsFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setFoodImportFeedback(null);

    try {
      const rawContent = (await file.text()).replace(/^\uFEFF/, "");
      const lines = rawContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("A planilha precisa ter cabecalho e pelo menos uma linha de alimento.");
      }

      const semicolonCount = (lines[0].match(/;/g) || []).length;
      const commaCount = (lines[0].match(/,/g) || []).length;
      const delimiter = semicolonCount >= commaCount ? ";" : ",";

      const headers = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader);
      const aliases = {
        name: ["name", "nome"],
        category: ["category", "categoria"],
        measurementBasis: ["measurementbasis", "basecalculo", "base", "medida"],
        calories: ["calories", "calorias", "kcal"],
        protein: ["protein", "proteina", "proteinas"],
        carbs: ["carbs", "carboidrato", "carboidratos"],
        fat: ["fat", "gordura", "gorduras", "lipideos"],
        fiber: ["fiber", "fibra", "fibras"],
      };

      function indexFor(field) {
        return headers.findIndex((header) => aliases[field].includes(header));
      }

      const indexMap = {
        name: indexFor("name"),
        category: indexFor("category"),
        measurementBasis: indexFor("measurementBasis"),
        calories: indexFor("calories"),
        protein: indexFor("protein"),
        carbs: indexFor("carbs"),
        fat: indexFor("fat"),
        fiber: indexFor("fiber"),
      };

      const requiredColumns = ["name", "measurementBasis", "calories", "protein", "carbs", "fat", "fiber"];
      const missingColumns = requiredColumns.filter((field) => indexMap[field] < 0);
      if (missingColumns.length > 0) {
        throw new Error(`Colunas ausentes no arquivo: ${missingColumns.join(", ")}.`);
      }

      let successCount = 0;
      const rowErrors = [];

      for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const row = parseDelimitedLine(lines[lineIndex], delimiter);
        const payload = {
          name: (row[indexMap.name] || "").trim(),
          category: normalizeFoodCategory(indexMap.category >= 0 ? row[indexMap.category] : ""),
          measurementBasis: normalizeMeasurementBasis(row[indexMap.measurementBasis]),
          calories: parseFoodNumber(row[indexMap.calories]),
          protein: parseFoodNumber(row[indexMap.protein]),
          carbs: parseFoodNumber(row[indexMap.carbs]),
          fat: parseFoodNumber(row[indexMap.fat]),
          fiber: parseFoodNumber(row[indexMap.fiber]),
        };

        if (
          !payload.name ||
          !payload.measurementBasis ||
          !Number.isFinite(payload.calories) ||
          !Number.isFinite(payload.protein) ||
          !Number.isFinite(payload.carbs) ||
          !Number.isFinite(payload.fat) ||
          !Number.isFinite(payload.fiber)
        ) {
          rowErrors.push(`Linha ${lineIndex + 1}: dados invalidos.`);
          continue;
        }

        try {
          await api.createFood(payload);
          successCount += 1;
        } catch (requestError) {
          rowErrors.push(`Linha ${lineIndex + 1}: ${requestError.message}`);
        }
      }

      if (successCount > 0) {
        await loadData({ showGlobalLoader: false });
      }

      if (rowErrors.length > 0) {
        setFoodImportFeedback({
          type: "warning",
          text: `Importados: ${successCount}. Erros: ${rowErrors.length}. Primeiro erro: ${rowErrors[0]}`,
        });
      } else {
        setFoodImportFeedback({
          type: "success",
          text: `${successCount} alimentos importados com sucesso.`,
        });
      }
    } catch (importError) {
      setFoodImportFeedback({ type: "error", text: importError.message });
    }
  }

  function handleSelectDay(dateKey) {
    setSelectedDate(dateKey);
    setSelectedMonth(dateKey.slice(0, 7));
  }

  function handleRegisterConsultationFromProfile() {
    if (!selectedPatient?.id) return;
    const today = formatDateKey(new Date());
    setSection("dashboard");
    setSelectedDate(today);
    setSelectedMonth(today.slice(0, 7));
    setConsultationForm({
      patientId: selectedPatient.id,
      type: "Retorno",
      date: isoToBrDate(today),
      time: "09:00",
      notes: "",
    });
    setShowConsultationForm(true);
    navigate("/");
  }

  function openWeightEntryModal() {
    if (!canRegisterWeightProgress) {
      setError("Registre uma avaliacao fisica antes de salvar a progressao.");
      return;
    }
    setEditingWeightEntryId("");
    setActiveProgressPointId("");
    setWeightEntryForm({ progressWeight: "" });
    setShowTargetRefreshModal(false);
    setShowWeightEntryModal(true);
  }

  function openWeightEntryEditModal(weightEntryId) {
    if (!selectedPatient?.id || !weightEntryId) return;
    const entryId = String(weightEntryId).trim();
    if (!entryId) return;
    if (entryId.startsWith("assessment-")) {
      setError("Pesagens originadas da avaliacao fisica devem ser editadas na propria avaliacao.");
      return;
    }
    const selectedEntry = selectedPatientWeightHistory.find((entry) => entry.id === entryId);
    if (!selectedEntry) {
      setError("Progressao de pesagem nao encontrada.");
      return;
    }
    setEditingWeightEntryId(entryId);
    setActiveProgressPointId("");
    setWeightEntryForm({ progressWeight: String(selectedEntry.weight).replace(".", ",") });
    setShowTargetRefreshModal(false);
    setShowWeightEntryModal(true);
  }

  function openTargetRefreshModal() {
    setActiveProgressPointId("");
    setTargetRefreshValue("");
    setShowTargetRefreshModal(true);
  }

  function closeWeightEntryModal() {
    setEditingWeightEntryId("");
    setShowWeightEntryModal(false);
  }

  async function handleWeightEntrySubmit(event) {
    event.preventDefault();
    if (!selectedPatient?.id) return;
    if (!canRegisterWeightProgress) {
      setError("Registre uma avaliacao fisica antes de salvar a progressao.");
      return;
    }

    const parsedWeight = parseFoodNumber(weightEntryForm.progressWeight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError("Informe um peso valido em kg.");
      return;
    }

    const roundedWeight = Number(parsedWeight.toFixed(2));
    const nowIso = new Date().toISOString();
    const isEditingEntry = Boolean(editingWeightEntryId);
    const nextHistory = isEditingEntry
      ? selectedPatientWeightHistory.map((entry) =>
          entry.id === editingWeightEntryId ? { ...entry, weight: roundedWeight } : entry,
        )
      : [
          ...selectedPatientWeightHistory,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            weight: roundedWeight,
            recordedAt: nowIso,
          },
        ];
    if (isEditingEntry && !selectedPatientWeightHistory.some((entry) => entry.id === editingWeightEntryId)) {
      setError("Progressao de pesagem nao encontrada.");
      return;
    }
    if (isEditingEntry && String(editingWeightEntryId).startsWith("assessment-")) {
      setError("Pesagens originadas da avaliacao fisica devem ser editadas na propria avaliacao.");
      return;
    }
    const nextCurrentWeight = nextHistory.length ? nextHistory[nextHistory.length - 1].weight : null;
    const baselineWeight =
      activeTargetCycleStartWeight !== null && activeTargetCycleStartWeight !== undefined
        ? activeTargetCycleStartWeight
        : selectedPatientWeightHistory.length
          ? selectedPatientWeightHistory[0].weight
          : roundedWeight;
    const wasTargetReached =
      progressTarget !== null &&
      progressCurrent !== null &&
      hasReachedTargetValue(progressCurrent, progressTarget, baselineWeight);
    const isTargetReachedNow =
      progressTarget !== null &&
      nextCurrentWeight !== null &&
      hasReachedTargetValue(nextCurrentWeight, progressTarget, baselineWeight);

    setError("");
    setWeightEntrySubmitting(true);
    try {
      await api.updatePatient(selectedPatient.id, {
        name: selectedPatient.name,
        age: selectedPatient.age ?? undefined,
        goal: selectedPatient.goal || "",
        phone: selectedPatient.phone || "",
        email: selectedPatient.email || "",
        currentWeight: nextCurrentWeight,
        weightHistory: nextHistory,
      });
      closeWeightEntryModal();
      await loadData({ showGlobalLoader: false });
      if (isTargetReachedNow && !wasTargetReached) {
        openTargetRefreshModal();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWeightEntrySubmitting(false);
    }
  }

  async function handleWeightEntryDelete(weightEntryId) {
    if (!selectedPatient?.id || !weightEntryId) return;
    const entryId = String(weightEntryId).trim();
    if (!entryId) return;
    if (entryId.startsWith("assessment-")) {
      setError("Pesagens originadas da avaliacao fisica devem ser removidas na propria avaliacao.");
      return;
    }
    const selectedEntry = selectedPatientWeightHistory.find((entry) => entry.id === entryId);
    if (!selectedEntry) {
      setError("Progressao de pesagem nao encontrada.");
      return;
    }
    const confirmed = window.confirm("Deseja remover esta progressao de pesagem?");
    if (!confirmed) return;

    const nextHistory = selectedPatientWeightHistory.filter((entry) => entry.id !== entryId);
    const nextCurrentWeight = nextHistory.length ? nextHistory[nextHistory.length - 1].weight : null;
    setError("");
    try {
      await api.updatePatient(selectedPatient.id, {
        name: selectedPatient.name,
        age: selectedPatient.age ?? undefined,
        goal: selectedPatient.goal || "",
        phone: selectedPatient.phone || "",
        email: selectedPatient.email || "",
        currentWeight: nextCurrentWeight,
        weightHistory: nextHistory,
      });
      setActiveProgressPointId("");
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleTargetRefreshSubmit(event) {
    event.preventDefault();
    if (!selectedPatient?.id) return;

    const parsedTargetWeight = parseFoodNumber(targetRefreshValue);
    if (!Number.isFinite(parsedTargetWeight) || parsedTargetWeight <= 0) {
      setError("Informe uma nova meta valida em kg.");
      return;
    }

    const roundedTargetWeight = Number(parsedTargetWeight.toFixed(2));
    const nowIso = new Date().toISOString();
    const nextTargetHistory = [
      ...selectedPatientTargetHistory,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        targetWeight: roundedTargetWeight,
        setAt: nowIso,
      },
    ];

    setError("");
    setTargetRefreshSubmitting(true);
    try {
      await api.updatePatient(selectedPatient.id, {
        name: selectedPatient.name,
        age: selectedPatient.age ?? undefined,
        goal: selectedPatient.goal || "",
        phone: selectedPatient.phone || "",
        email: selectedPatient.email || "",
        targetWeight: roundedTargetWeight,
        targetHistory: nextTargetHistory,
      });
      setShowTargetRefreshModal(false);
      setTargetRefreshValue("");
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTargetRefreshSubmitting(false);
    }
  }

  async function clearPatientEvolutionData() {
    if (!selectedPatient?.id) return;
    const confirmed = window.confirm("Deseja remover todos os dados de evolucao (pesagens e meta)?");
    if (!confirmed) return;

    setError("");
    try {
      await api.updatePatient(selectedPatient.id, {
        name: selectedPatient.name,
        age: selectedPatient.age ?? undefined,
        goal: selectedPatient.goal || "",
        phone: selectedPatient.phone || "",
        email: selectedPatient.email || "",
        currentWeight: null,
        targetWeight: null,
        targetHistory: [],
        weightHistory: [],
      });
      setShowWeightEntryModal(false);
      setShowProgressHistoryModal(false);
      setShowTargetRefreshModal(false);
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function mapPhysicalAssessmentToForm(assessment) {
    const base = buildEmptyPhysicalAssessmentForm(selectedPatient, latestPhysicalAssessment);
    if (!assessment) return base;

    const nextCircumferences = { ...base.circumferences };
    (assessment.circumferences || []).forEach((entry) => {
      if (!entry?.type || !Object.prototype.hasOwnProperty.call(nextCircumferences, entry.type)) return;
      nextCircumferences[entry.type] = String(entry.valueCm ?? "").replace(".", ",");
    });
    const nextSkinfolds = { ...base.skinfolds };
    (assessment.skinfolds || []).forEach((entry) => {
      if (!entry?.site || !Object.prototype.hasOwnProperty.call(nextSkinfolds, entry.site)) return;
      nextSkinfolds[entry.site] = String(entry.valueMm ?? "").replace(".", ",");
    });

    const assessmentDate = String(assessment.date || formatDateKey(new Date())).slice(0, 10);
    return {
      date: isoToBrDate(assessmentDate) || base.date,
      weightKg: String(assessment.weightKg ?? "").replace(".", ","),
      heightCm: String(assessment.heightCm ?? "").replace(".", ","),
      age: String(assessment.age ?? ""),
      sex: assessment.sex || "",
      activityLevel: assessment.activityLevel || "moderado",
      notes: assessment.notes || "",
      circumferences: nextCircumferences,
      skinfolds: nextSkinfolds,
    };
  }

  function buildPhysicalAssessmentPayload(form, patientId) {
    const dateInput = String(form.date || "").trim();
    const date = parseBrDate(dateInput);
    if (!date) {
      return { error: "Data da avaliação inválida. Use o formato dd/mm/aaaa." };
    }

    const weightKg = parseFoodNumber(form.weightKg);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return { error: "Peso (kg) inválido." };
    }
    const heightCm = parseFoodNumber(form.heightCm);
    if (!Number.isFinite(heightCm) || heightCm <= 0) {
      return { error: "Altura (cm) inválida." };
    }

    const age = Number(form.age);
    if (!Number.isInteger(age) || age <= 0) {
      return { error: "Idade inválida." };
    }
    if (!["masculino", "feminino"].includes(form.sex)) {
      return { error: "Selecione o sexo biológico." };
    }
    if (!PHYSICAL_ACTIVITY_LEVELS.some((item) => item.value === form.activityLevel)) {
      return { error: "Selecione um nível de atividade válido." };
    }

    const circumferences = [];
    for (const field of CIRCUMFERENCE_FIELDS) {
      const rawValue = String(form.circumferences?.[field.key] || "").trim();
      if (!rawValue) continue;
      const parsed = parseFoodNumber(rawValue);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { error: `Circunferência inválida em ${field.label}.` };
      }
      circumferences.push({ type: field.key, valueCm: Number(parsed.toFixed(2)) });
    }

    const skinfolds = [];
    for (const field of SKINFOLD_FIELDS) {
      const rawValue = String(form.skinfolds?.[field.key] || "").trim();
      if (!rawValue) continue;
      const parsed = parseFoodNumber(rawValue);
      if (!Number.isFinite(parsed) || parsed < 2 || parsed > 60) {
        return { error: `Dobra cutânea em ${field.label} deve estar entre 2 e 60 mm.` };
      }
      skinfolds.push({ site: field.key, valueMm: Number(parsed.toFixed(2)) });
    }

    return {
      payload: {
        patientId,
        date,
        weightKg: Number(weightKg.toFixed(2)),
        heightCm: Number(heightCm.toFixed(2)),
        age,
        sex: form.sex,
        activityLevel: form.activityLevel,
        notes: String(form.notes || "").trim(),
        circumferences,
        skinfolds,
      },
    };
  }

  function changePhysicalAssessmentField(field, value) {
    setPhysicalAssessmentForm((prev) => ({ ...prev, [field]: value }));
  }

  function changePhysicalAssessmentCircumference(type, value) {
    setPhysicalAssessmentForm((prev) => ({
      ...prev,
      circumferences: {
        ...(prev.circumferences || {}),
        [type]: value,
      },
    }));
  }

  function changePhysicalAssessmentSkinfold(site, value) {
    setPhysicalAssessmentForm((prev) => ({
      ...prev,
      skinfolds: {
        ...(prev.skinfolds || {}),
        [site]: value,
      },
    }));
  }

  function openPhysicalAssessmentModule() {
    if (!routePatientId) return;
    setPhysicalAssessmentSubmitting(false);
    setShowPhysicalAssessmentModal(true);
    setShowPhysicalAssessmentFormModal(false);
    setPhysicalAssessmentFormTab("basicos");
    setEditingPhysicalAssessmentId("");
    setPhysicalAssessmentFormMode("create");
    setPhysicalAssessmentForm(buildEmptyPhysicalAssessmentForm(selectedPatient, latestPhysicalAssessment));
  }

  function closePhysicalAssessmentModule() {
    setPhysicalAssessmentSubmitting(false);
    setShowPhysicalAssessmentModal(false);
    setShowPhysicalAssessmentFormModal(false);
    setPhysicalAssessmentFormMode("create");
    setPhysicalAssessmentFormTab("basicos");
    setEditingPhysicalAssessmentId("");
    setPhysicalAssessmentForm(buildEmptyPhysicalAssessmentForm(selectedPatient, latestPhysicalAssessment));
  }

  function openPhysicalAssessmentCreateForm() {
    setPhysicalAssessmentSubmitting(false);
    setPhysicalAssessmentFormMode("create");
    setEditingPhysicalAssessmentId("");
    setPhysicalAssessmentFormTab("basicos");
    setPhysicalAssessmentForm(buildEmptyPhysicalAssessmentForm(selectedPatient, latestPhysicalAssessment));
    setShowPhysicalAssessmentFormModal(true);
  }

  async function openPhysicalAssessmentFormMode(assessmentId, mode) {
    if (!assessmentId) return;
    setError("");
    setPhysicalAssessmentSubmitting(true);
    try {
      const assessment = await api.getPhysicalAssessment(assessmentId);
      setPhysicalAssessmentFormMode(mode);
      setEditingPhysicalAssessmentId(assessment.id);
      setPhysicalAssessmentFormTab("basicos");
      setPhysicalAssessmentForm(mapPhysicalAssessmentToForm(assessment));
      setShowPhysicalAssessmentFormModal(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPhysicalAssessmentSubmitting(false);
    }
  }

  function closePhysicalAssessmentForm() {
    setPhysicalAssessmentSubmitting(false);
    setShowPhysicalAssessmentFormModal(false);
    setPhysicalAssessmentFormMode("create");
    setPhysicalAssessmentFormTab("basicos");
    setEditingPhysicalAssessmentId("");
    setPhysicalAssessmentForm(buildEmptyPhysicalAssessmentForm(selectedPatient, latestPhysicalAssessment));
  }

  async function handlePhysicalAssessmentSubmit(event) {
    event.preventDefault();
    if (!selectedPatient?.id || isPhysicalAssessmentReadOnly) return;

    const { payload, error: payloadError } = buildPhysicalAssessmentPayload(
      physicalAssessmentForm,
      selectedPatient.id,
    );
    if (payloadError) {
      setError(payloadError);
      return;
    }

    setError("");
    setPhysicalAssessmentSubmitting(true);
    try {
      if (physicalAssessmentFormMode === "edit" && editingPhysicalAssessmentId) {
        await api.updatePhysicalAssessment(editingPhysicalAssessmentId, payload);
      } else {
        await api.createPhysicalAssessment(payload);
      }
      await loadData({ showGlobalLoader: false });
      closePhysicalAssessmentForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPhysicalAssessmentSubmitting(false);
    }
  }

  async function removePhysicalAssessment(assessmentId) {
    if (!assessmentId) return;
    const confirmed = window.confirm("Deseja realmente excluir esta avaliação física?");
    if (!confirmed) return;

    setError("");
    try {
      await api.deletePhysicalAssessment(assessmentId);
      if (editingPhysicalAssessmentId === assessmentId) {
        closePhysicalAssessmentForm();
      }
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleConsultationSubmit(event) {
    event.preventDefault();
    setError("");

    const isoDate = parseBrDate(consultationForm.date.trim());
    if (!isoDate) {
      setError("Use a data no formato dd/mm/aaaa.");
      return;
    }
    const normalizedTime = consultationForm.time.trim();
    if (!isValidHour(normalizedTime)) {
      setError("Use o horario no formato HH:mm (24h).");
      return;
    }

    const datetime = new Date(`${isoDate}T${normalizedTime}:00`);
    if (Number.isNaN(datetime.getTime())) {
      setError("Data e horario da consulta invalidos.");
      return;
    }

    setConsultationSubmitting(true);
    try {
      await api.createConsultation({
        patientId: consultationForm.patientId || undefined,
        type: consultationForm.type,
        notes: consultationForm.notes,
        scheduledAt: datetime.toISOString(),
      });
      setShowConsultationForm(false);
      setConsultationForm((prev) => ({
        ...prev,
        patientId: "",
        type: "Retorno",
        date: isoToBrDate(selectedDate),
        time: "09:00",
        notes: "",
      }));
      await Promise.all([loadData({ showGlobalLoader: false }), loadScheduleData()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setConsultationSubmitting(false);
    }
  }

  async function removePatient(id) {
    setError("");
    setPatientRemoving(true);
    try {
      if (patientPhotos[id]?.length) {
        revokePhotoEntries(patientPhotos[id]);
      }
      await api.deletePatient(id);
      setPatientMealPlans((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanSavedAt((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanGroups((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanGroupDraft((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanGroupCollapsed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanItemEditMode((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanSubstitutionItemEditMode((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanSubstitutions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanSubstitutionExpanded((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanDescription((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientMealPlanHistory((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientPhysicalAssessments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPatientPhotos((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (id === routePatientId) {
        setShowPhysicalAssessmentModal(false);
        setShowPhysicalAssessmentFormModal(false);
        setShowMealPlanHistoryModal(false);
        navigate("/patients", { replace: true });
      }
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPatientRemoving(false);
    }
  }

  function openPatientProfile(id) {
    setSection("patients");
    navigate(`/patients/${encodeURIComponent(id)}`);
  }

  function closePatientProfile() {
    setShowPhysicalAssessmentModal(false);
    setShowPhysicalAssessmentFormModal(false);
    setShowMealPlanHistoryModal(false);
    setShowProgressHistoryModal(false);
    setShowWeightEntryModal(false);
    setShowTargetRefreshModal(false);
    navigate("/patients");
  }

  function toggleMealPlanEditor(forceValue) {
    if (!routePatientId) return;
    setPatientMealPlanExpanded((prev) => ({
      ...prev,
      [routePatientId]: typeof forceValue === "boolean" ? forceValue : !prev[routePatientId],
    }));
  }

  function setMealPlanItemEditMode(itemId, isEditing) {
    if (!routePatientId || !itemId) return;
    setPatientMealPlanItemEditMode((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      if (isEditing) current[itemId] = true;
      else delete current[itemId];
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
  }

  function setMealPlanSubstitutionItemEditMode(groupName, substitutionId, itemId, isEditing) {
    if (!routePatientId || !groupName || !substitutionId || !itemId) return;
    const key = mealPlanSubstitutionItemEditKey(groupName, substitutionId, itemId);
    setPatientMealPlanSubstitutionItemEditMode((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      if (isEditing) current[key] = true;
      else delete current[key];
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
  }

  function addMealPlanGroup(rawName) {
    if (!routePatientId) return;
    const nextName = String(rawName || "").trim();
    if (!nextName) return;
    setPatientMealPlanGroups((prev) => {
      const current = prev[routePatientId] || [];
      if (current.some((groupName) => groupName.toLowerCase() === nextName.toLowerCase())) return prev;
      return {
        ...prev,
        [routePatientId]: [...current, nextName],
      };
    });
    setPatientMealPlanGroupDraft((prev) => ({ ...prev, [routePatientId]: "" }));
  }

  function removeMealPlanGroup(groupName) {
    if (!routePatientId || !groupName) return;
    const removedItemIds = (patientMealPlans[routePatientId] || [])
      .filter((item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) === groupName)
      .map((item) => item.id);
    const hasItems = (patientMealPlans[routePatientId] || []).some(
      (item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) === groupName,
    );
    const hasSubstitutions = Boolean((patientMealPlanSubstitutions[routePatientId] || {})[groupName]?.length);
    if (hasItems) {
      const confirmed = window.confirm(
        `Remover o grupo "${groupName}" tambem removera os alimentos vinculados a ele. Continuar?`,
      );
      if (!confirmed) return;
    }
    setPatientMealPlanGroups((prev) => ({
      ...prev,
      [routePatientId]: (prev[routePatientId] || []).filter((item) => item !== groupName),
    }));
    if (hasItems) {
      setPatientMealPlans((prev) => ({
        ...prev,
        [routePatientId]: (prev[routePatientId] || []).filter(
          (item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) !== groupName,
        ),
      }));
      setPatientMealPlanItemEditMode((prev) => {
        const current = { ...(prev[routePatientId] || {}) };
        removedItemIds.forEach((itemId) => {
          delete current[itemId];
        });
        return {
          ...prev,
          [routePatientId]: current,
        };
      });
    }
    if (hasSubstitutions) {
      setPatientMealPlanSubstitutions((prev) => {
        const current = { ...(prev[routePatientId] || {}) };
        delete current[groupName];
        return {
          ...prev,
          [routePatientId]: current,
        };
      });
    }
    setPatientMealPlanSubstitutionExpanded((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      delete current[groupName];
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
    setPatientMealPlanGroupCollapsed((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      delete current[groupName];
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
    setPatientMealPlanSubstitutionItemEditMode((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      const groupPrefix = `${groupName}::`;
      Object.keys(current).forEach((key) => {
        if (key.startsWith(groupPrefix)) delete current[key];
      });
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
  }

  function toggleMealPlanGroupCollapsed(groupName) {
    if (!routePatientId || !groupName) return;
    setPatientMealPlanGroupCollapsed((prev) => ({
      ...prev,
      [routePatientId]: {
        ...(prev[routePatientId] || {}),
        [groupName]: !(prev[routePatientId] || {})[groupName],
      },
    }));
  }

  function toggleMealPlanSubstitutionPanel(groupName) {
    if (!routePatientId || !groupName) return;
    setPatientMealPlanSubstitutionExpanded((prev) => ({
      ...prev,
      [routePatientId]: {
        ...(prev[routePatientId] || {}),
        [groupName]: !(prev[routePatientId] || {})[groupName],
      },
    }));
  }

  function addMealPlanSubstitution(groupName) {
    if (!routePatientId || !groupName) return;
    setPatientMealPlanSubstitutions((prev) => {
      const currentByGroup = prev[routePatientId] || {};
      const currentList = currentByGroup[groupName] || [];
      const next = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: `Substituicao ${currentList.length + 1}`,
        items: [],
      };
      return {
        ...prev,
        [routePatientId]: {
          ...currentByGroup,
          [groupName]: [...currentList, next],
        },
      };
    });
    setPatientMealPlanSubstitutionExpanded((prev) => ({
      ...prev,
      [routePatientId]: {
        ...(prev[routePatientId] || {}),
        [groupName]: true,
      },
    }));
  }

  function updateMealPlanSubstitution(groupName, substitutionId, updater) {
    if (!routePatientId || !groupName || !substitutionId) return;
    setPatientMealPlanSubstitutions((prev) => {
      const currentByGroup = prev[routePatientId] || {};
      const currentList = currentByGroup[groupName] || [];
      return {
        ...prev,
        [routePatientId]: {
          ...currentByGroup,
          [groupName]: currentList.map((substitution) => {
            if (substitution.id !== substitutionId) return substitution;
            return updater(substitution);
          }),
        },
      };
    });
  }

  function removeMealPlanSubstitution(groupName, substitutionId) {
    if (!routePatientId || !groupName || !substitutionId) return;
    setPatientMealPlanSubstitutions((prev) => {
      const currentByGroup = prev[routePatientId] || {};
      const currentList = currentByGroup[groupName] || [];
      return {
        ...prev,
        [routePatientId]: {
          ...currentByGroup,
          [groupName]: currentList.filter((substitution) => substitution.id !== substitutionId),
        },
      };
    });
    setPatientMealPlanSubstitutionItemEditMode((prev) => {
      const current = { ...(prev[routePatientId] || {}) };
      const substitutionPrefix = `${groupName}::${substitutionId}::`;
      Object.keys(current).forEach((key) => {
        if (key.startsWith(substitutionPrefix)) delete current[key];
      });
      return {
        ...prev,
        [routePatientId]: current,
      };
    });
  }

  function changeMealPlanSubstitutionLabel(groupName, substitutionId, value) {
    updateMealPlanSubstitution(groupName, substitutionId, (substitution) => ({
      ...substitution,
      label: value,
    }));
  }

  function addMealPlanSubstitutionItem(groupName, substitutionId) {
    if (!routePatientId || !groupName || !substitutionId) return;
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      foodId: "",
      portion: "",
      foodSearch: "",
    };
    updateMealPlanSubstitution(groupName, substitutionId, (substitution) => ({
      ...substitution,
      items: [...(substitution.items || []), nextItem],
    }));
    setMealPlanSubstitutionItemEditMode(groupName, substitutionId, nextItem.id, true);
  }

  function updateMealPlanSubstitutionItem(groupName, substitutionId, itemId, updater) {
    updateMealPlanSubstitution(groupName, substitutionId, (substitution) => ({
      ...substitution,
      items: (substitution.items || []).map((item) => {
        if (item.id !== itemId) return item;
        return updater(item);
      }),
    }));
  }

  function changeMealPlanSubstitutionFoodSearch(groupName, substitutionId, itemId, value) {
    const typedValue = String(value || "");
    const normalizedTyped = normalizeHeader(typedValue.trim());
    const exactMatch = foods.find((food) => normalizeHeader(food.name) === normalizedTyped);

    updateMealPlanSubstitutionItem(groupName, substitutionId, itemId, (item) => {
      if (!exactMatch) {
        return {
          ...item,
          foodSearch: typedValue,
          ...(typedValue.trim() ? {} : { foodId: "" }),
        };
      }
      const basis = exactMatch.measurementBasis || "100g";
      const defaultPortion = basis === "unidade" ? 1 : 100;
      return {
        ...item,
        foodId: exactMatch.id,
        foodSearch: exactMatch.name,
        portion: item.foodId === exactMatch.id ? item.portion : defaultPortion,
      };
    });
  }

  function changeMealPlanSubstitutionPortion(groupName, substitutionId, itemId, value) {
    const normalized = value === "" ? "" : Number(value);
    updateMealPlanSubstitutionItem(groupName, substitutionId, itemId, (item) => ({
      ...item,
      portion: normalized,
    }));
  }

  function removeMealPlanSubstitutionItem(groupName, substitutionId, itemId) {
    updateMealPlanSubstitution(groupName, substitutionId, (substitution) => ({
      ...substitution,
      items: (substitution.items || []).filter((item) => item.id !== itemId),
    }));
    setMealPlanSubstitutionItemEditMode(groupName, substitutionId, itemId, false);
  }

  function openMealPlanEditor() {
    if (!routePatientId) return;
    toggleMealPlanEditor(true);
  }

  function addMealPlanItem(groupName = DEFAULT_MEAL_OCCASION) {
    if (!routePatientId) return;
    const nextGroup = String(groupName || DEFAULT_MEAL_OCCASION).trim() || DEFAULT_MEAL_OCCASION;
    addMealPlanGroup(nextGroup);
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      foodId: "",
      portion: "",
      mealOccasion: nextGroup,
      foodSearch: "",
    };
    setPatientMealPlans((prev) => ({
      ...prev,
      [routePatientId]: [...(prev[routePatientId] || []), item],
    }));
    setMealPlanItemEditMode(item.id, true);
  }

  function updateMealPlanItem(itemId, updater) {
    if (!routePatientId) return;
    setPatientMealPlans((prev) => ({
      ...prev,
      [routePatientId]: (prev[routePatientId] || []).map((item) => {
        if (item.id !== itemId) return item;
        return updater(item);
      }),
    }));
  }

  function changeMealPlanFoodSearch(itemId, value) {
    const typedValue = String(value || "");
    const normalizedTyped = normalizeHeader(typedValue.trim());
    const exactMatch = foods.find((food) => normalizeHeader(food.name) === normalizedTyped);

    updateMealPlanItem(itemId, (item) => {
      if (!exactMatch) {
        return {
          ...item,
          foodSearch: typedValue,
          ...(typedValue.trim() ? {} : { foodId: "" }),
        };
      }

      const basis = exactMatch.measurementBasis || "100g";
      const defaultPortion = basis === "unidade" ? 1 : 100;
      return {
        ...item,
        foodId: exactMatch.id,
        foodSearch: exactMatch.name,
        portion: item.foodId === exactMatch.id ? item.portion : defaultPortion,
      };
    });
  }

  function changeMealPlanPortion(itemId, value) {
    const normalized = value === "" ? "" : Number(value);
    updateMealPlanItem(itemId, (item) => ({ ...item, portion: normalized }));
  }

  function removeMealPlanItem(itemId) {
    if (!routePatientId) return;
    setPatientMealPlans((prev) => ({
      ...prev,
      [routePatientId]: (prev[routePatientId] || []).filter((item) => item.id !== itemId),
    }));
    setMealPlanItemEditMode(itemId, false);
  }

  async function saveMealPlan() {
    if (!routePatientId) return;
    setError("");
    setMealPlanSubmitting(true);
    const savedAt = new Date().toISOString();
    const rawDescription = (patientMealPlanDescription[routePatientId] || "").trim();
    const description = rawDescription || "Plano sem descricao";
    const snapshotItems = (patientMealPlans[routePatientId] || []).map((item) => ({
      ...item,
      mealOccasion: item.mealOccasion || DEFAULT_MEAL_OCCASION,
    }));
    const snapshotGroups = selectedMealPlanGroups.length ? selectedMealPlanGroups : [DEFAULT_MEAL_OCCASION];
    const snapshotSubstitutions = Object.entries(patientMealPlanSubstitutions[routePatientId] || {}).reduce(
      (acc, [groupName, substitutions]) => {
        acc[groupName] = (substitutions || []).map((substitution) => ({
          ...substitution,
          label: (substitution.label || "").trim() || "Substituicao",
          items: (substitution.items || []).map((item) => ({ ...item })),
        }));
        return acc;
      },
      {},
    );

    const nextHistory = [
      {
        id: `${savedAt}-${Math.random().toString(36).slice(2, 8)}`,
        savedAt,
        description,
        groups: snapshotGroups,
        items: snapshotItems,
        substitutions: snapshotSubstitutions,
      },
      ...(selectedMealPlanHistory || []),
    ].slice(0, 25);

    try {
      const persisted = await api.savePlan(routePatientId, {
        status: "active",
        description,
        groups: snapshotGroups,
        items: snapshotItems,
        substitutions: snapshotSubstitutions,
        history: nextHistory,
        savedAt,
      });

      const persistedItems = Array.isArray(persisted?.items) ? persisted.items : snapshotItems;
      const persistedGroups = Array.isArray(persisted?.groups) ? persisted.groups : snapshotGroups;
      const persistedSubstitutions =
        persisted?.substitutions &&
        typeof persisted.substitutions === "object" &&
        !Array.isArray(persisted.substitutions)
          ? persisted.substitutions
          : snapshotSubstitutions;
      const persistedHistory = Array.isArray(persisted?.history) ? persisted.history : nextHistory;
      const persistedDescription =
        typeof persisted?.description === "string" && persisted.description.trim()
          ? persisted.description
          : description;
      const persistedSavedAt = persisted?.savedAt || savedAt;

      setPatientMealPlans((prev) => ({ ...prev, [routePatientId]: persistedItems }));
      setPatientMealPlanSavedAt((prev) => ({ ...prev, [routePatientId]: persistedSavedAt }));
      setPatientMealPlanGroups((prev) => ({ ...prev, [routePatientId]: persistedGroups }));
      setPatientMealPlanSubstitutions((prev) => ({ ...prev, [routePatientId]: persistedSubstitutions }));
      setPatientMealPlanDescription((prev) => ({ ...prev, [routePatientId]: persistedDescription }));
      setPatientMealPlanHistory((prev) => ({ ...prev, [routePatientId]: persistedHistory }));

      toggleMealPlanEditor(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setMealPlanSubmitting(false);
    }
  }

  function exportMealPlanPdf() {
    if (!selectedPatient || !selectedMealPlanItems.length) return;

    const groups = selectedMealPlanGroups.length ? selectedMealPlanGroups : [DEFAULT_MEAL_OCCASION];
    const generatedAt = new Date().toISOString();
    const description = selectedMealPlanDescription?.trim() || "Plano sem descricao";

    const groupsHtml = groups
      .map((groupName) => {
        const groupItems = selectedMealPlanItems.filter(
          (item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) === groupName,
        );
        if (!groupItems.length) return "";

        const groupTotals = groupItems.reduce(
          (acc, item) => {
            const totals = calculateMealPlanItemTotals(item, foods);
            acc.calories += totals.calories;
            acc.protein += totals.protein;
            acc.carbs += totals.carbs;
            acc.fat += totals.fat;
            acc.fiber += totals.fiber;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        );

        const itemsRows = groupItems
          .map((item) => {
            const totals = calculateMealPlanItemTotals(item, foods);
            return `
              <tr>
                <td>${escapeHtml(totals.linkedFood?.name || "Alimento nao selecionado")}</td>
                <td>${escapeHtml(`${formatDecimal(totals.portion)} ${totals.unit}`)}</td>
                <td>${escapeHtml(`${formatDecimal(totals.calories)} kcal`)}</td>
                <td>${escapeHtml(`${formatDecimal(totals.protein)}g`)}</td>
                <td>${escapeHtml(`${formatDecimal(totals.carbs)}g`)}</td>
                <td>${escapeHtml(`${formatDecimal(totals.fat)}g`)}</td>
                <td>${escapeHtml(`${formatDecimal(totals.fiber)}g`)}</td>
              </tr>
            `;
          })
          .join("");

        const substitutions = selectedMealPlanSubstitutionsMap[groupName] || [];
        const substitutionsHtml =
          substitutions.length === 0
            ? ""
            : `
              <div class="substitutions">
                <h4>Substituicoes</h4>
                ${substitutions
                  .map((substitution) => {
                    const subItems = substitution.items || [];
                    const subRows = subItems
                      .map((item) => {
                        const totals = calculateMealPlanItemTotals(item, foods);
                        return `
                          <tr>
                            <td>${escapeHtml(totals.linkedFood?.name || "Alimento nao selecionado")}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.portion)} ${totals.unit}`)}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.calories)} kcal`)}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.protein)}g`)}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.carbs)}g`)}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.fat)}g`)}</td>
                            <td>${escapeHtml(`${formatDecimal(totals.fiber)}g`)}</td>
                          </tr>
                        `;
                      })
                      .join("");

                    return `
                      <div class="substitution-card">
                        <strong>${escapeHtml(substitution.label || "Substituicao")}</strong>
                        <table>
                          <thead>
                            <tr>
                              <th>Alimento</th>
                              <th>Porção</th>
                              <th>Kcal</th>
                              <th>P</th>
                              <th>C</th>
                              <th>G</th>
                              <th>F</th>
                            </tr>
                          </thead>
                          <tbody>${subRows || '<tr><td colspan="7">Sem alimentos.</td></tr>'}</tbody>
                        </table>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            `;

        return `
          <section class="group-card">
            <header>
              <h3>${escapeHtml(groupName)}</h3>
              <div class="chips">
                <span>P ${escapeHtml(formatDecimal(groupTotals.protein))}g</span>
                <span>C ${escapeHtml(formatDecimal(groupTotals.carbs))}g</span>
                <span>G ${escapeHtml(formatDecimal(groupTotals.fat))}g</span>
              </div>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Alimento</th>
                  <th>Porção</th>
                  <th>Kcal</th>
                  <th>P</th>
                  <th>C</th>
                  <th>G</th>
                  <th>F</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>
            ${substitutionsHtml}
          </section>
        `;
      })
      .join("");

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Plano alimentar - ${escapeHtml(selectedPatient.name)}</title>
          <style>
            body { font-family: Manrope, Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 6px; font-size: 28px; }
            .meta { margin: 0 0 20px; color: #475569; font-size: 13px; }
            .summary { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
            .summary span, .chips span { border: 1px solid #ccefe2; border-radius: 999px; background: #f0fdf8; padding: 4px 9px; font-size: 12px; font-weight: 700; color: #116149; }
            .group-card { border: 1px solid #d4e3ea; border-radius: 12px; background: #f8fbfa; padding: 12px; margin-bottom: 12px; }
            .group-card > header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
            .group-card h3 { margin: 0; font-size: 18px; color: #0f7a54; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; text-align: left; font-size: 12px; }
            th { font-size: 11px; color: #475569; text-transform: uppercase; letter-spacing: .03em; }
            .substitutions { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; }
            .substitutions h4 { margin: 0 0 8px; font-size: 14px; color: #35536d; }
            .substitution-card { border: 1px solid #dbe7f2; border-radius: 10px; background: #fff; padding: 8px; margin-top: 6px; }
            .substitution-card strong { display: block; margin-bottom: 4px; font-size: 13px; }
            @media print {
              body { margin: 12px; }
              .group-card { break-inside: avoid; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Plano Alimentar</h1>
          <p class="meta">
            Paciente: <strong>${escapeHtml(selectedPatient.name)}</strong> |
            Descricao: <strong>${escapeHtml(description)}</strong> |
            Atualizado: <strong>${escapeHtml(
              formatDateTime(selectedMealPlanSavedAt || generatedAt),
            )}</strong>
          </p>
          <div class="summary">
            <span>${escapeHtml(`${formatDecimal(mealPlanTotals.calories)} kcal`)}</span>
            <span>${escapeHtml(`P ${formatDecimal(mealPlanTotals.protein)}g`)}</span>
            <span>${escapeHtml(`C ${formatDecimal(mealPlanTotals.carbs)}g`)}</span>
            <span>${escapeHtml(`G ${formatDecimal(mealPlanTotals.fat)}g`)}</span>
            <span>${escapeHtml(`F ${formatDecimal(mealPlanTotals.fiber)}g`)}</span>
          </div>
          ${groupsHtml || "<p>Nenhum grupo com alimentos.</p>"}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) {
      window.alert("Nao foi possivel abrir a janela de exportacao. Verifique o bloqueador de pop-up.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 200);
  }

  function handlePatientPhotosUpload(event) {
    if (!routePatientId) return;
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const nextPhotos = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    }));
    setPatientPhotos((prev) => ({
      ...prev,
      [routePatientId]: [...(prev[routePatientId] || []), ...nextPhotos],
    }));
  }

  function removePatientPhoto(photoId) {
    if (!routePatientId) return;
    setPatientPhotos((prev) => {
      const existing = prev[routePatientId] || [];
      const removed = existing.find((photo) => photo.id === photoId);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return {
        ...prev,
        [routePatientId]: existing.filter((photo) => photo.id !== photoId),
      };
    });
  }

  async function removeFood(id) {
    setError("");
    try {
      await api.deleteFood(id);
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function editPatient(item) {
    const name = window.prompt("Nome do paciente:", item.name);
    if (name === null) return;
    const ageInput = window.prompt("Idade:", item.age ?? "");
    if (ageInput === null) return;
    const goal = window.prompt("Objetivo:", item.goal ?? "");
    if (goal === null) return;
    const phone = window.prompt("Telefone:", item.phone ?? "");
    if (phone === null) return;
    const email = window.prompt("Email:", item.email ?? "");
    if (email === null) return;

    try {
      await api.updatePatient(item.id, {
        name,
        age: ageInput ? Number(ageInput) : undefined,
        goal,
        phone,
        email,
      });
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function editFood(item) {
    setEditFoodForm({
      name: item.name ?? "",
      category: normalizeFoodCategory(item.category),
      measurementBasis: normalizeMeasurementBasis(item.measurementBasis) || "100g",
      calories: String(item.calories ?? ""),
      protein: String(item.protein ?? ""),
      carbs: String(item.carbs ?? ""),
      fat: String(item.fat ?? ""),
      fiber: String(item.fiber ?? ""),
    });
    setEditingFoodId(item.id);
  }

  function closeFoodEditor() {
    if (foodEditSubmitting) return;
    setEditingFoodId("");
    setEditFoodForm(emptyFood);
  }

  async function handleFoodEditSubmit(event) {
    event.preventDefault();
    if (!editingFoodId) return;
    setError("");
    setFoodEditSubmitting(true);
    try {
      await api.updateFood(editingFoodId, {
        name: editFoodForm.name.trim(),
        category: normalizeFoodCategory(editFoodForm.category),
        measurementBasis: editFoodForm.measurementBasis,
        calories: Number(editFoodForm.calories),
        protein: Number(editFoodForm.protein),
        carbs: Number(editFoodForm.carbs),
        fat: Number(editFoodForm.fat),
        fiber: Number(editFoodForm.fiber),
      });
      closeFoodEditor();
      await loadData({ showGlobalLoader: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFoodEditSubmitting(false);
    }
  }

  if (!session) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <aside className="login-aside">
            <div className="brand login-brand">
              <div className="brand-icon">NF</div>
              <div>
                <strong>NutriPro</strong>
                <p>Gestao para Nutricionistas</p>
              </div>
            </div>
            <h2>Login Profissional</h2>
            <p>Acesse seu painel para acompanhar pacientes, consultas e base de alimentos.</p>
            <div className="demo-box">
              <strong>Banco Neon conectado</strong>
              <p>Use seu email e senha cadastrados no sistema.</p>
              <p>Cadastro por tela foi desabilitado.</p>
            </div>
          </aside>

          <section className="login-panel">
            <h1>Entrar no Dashboard</h1>
            <p>Seu usuario sera validado direto no banco de dados.</p>
            <form className="login-form" onSubmit={handleLogin}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />

              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Sua senha"
                autoComplete="current-password"
                required
              />

              {loginError && <div className="login-error">{loginError}</div>}
              <button type="submit" disabled={authSubmitting}>
                {authSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className={`app ${theme === "dark" ? "app-dark" : ""}`}>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">NF</div>
            <div>
              <strong>NutriPro</strong>
              <p>Gestao Nutricional</p>
            </div>
          </div>

          <p className="menu-title">MENU</p>
          <nav className="menu">
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`menu-item ${
                  item.id === "patients"
                    ? (section === "patients" || isPatientsRoute ? "active" : "")
                    : section === item.id
                      ? "active"
                      : ""
                }`}
                onClick={() => {
                  setSection(item.id);
                  if (item.id === "patients") {
                    navigate("/patients");
                  } else {
                    navigate("/");
                  }
                }}
              >
                <span className="menu-glyph">
                  <MenuIcon id={item.id} />
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="settings-menu" ref={settingsMenuRef}>
              <button
                type="button"
                className={`menu-item ghost ${showSettingsMenu ? "active" : ""}`}
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                aria-expanded={showSettingsMenu}
                aria-controls="settings-menu-panel"
              >
                <span className="menu-glyph">
                  <MenuIcon id="settings" />
                </span>
                Configuracoes
              </button>
              {showSettingsMenu && (
                <div className="settings-popover" id="settings-menu-panel">
                  <p className="settings-popover-title">Aparencia</p>
                  <button
                    type="button"
                    className="settings-theme-btn"
                    onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  >
                    <span className="settings-theme-label">
                      <strong>Modo escuro</strong>
                      <small>{theme === "dark" ? "Ativado" : "Desativado"}</small>
                    </span>
                    <span className={`settings-theme-switch ${theme === "dark" ? "on" : ""}`} aria-hidden="true">
                      <span />
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="menu-item logout-btn" onClick={handleLogout}>
              <span className="menu-glyph">
                <MenuIcon id="logout" />
              </span>
              Sair
            </button>
            <div className="profile">
              <div className="profile-avatar">{initials(session.name)}</div>
              <div>
                <strong>{session.name}</strong>
                <p>{session.role}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className={`content ${isPatientProfileRoute ? "patient-fullscreen-content" : ""}`}>
          {!isPatientProfileRoute && (
            <header className="content-header">
              <div>
                <h1>Dashboard</h1>
                <p>Bem-vinda de volta, {session.name}</p>
              </div>
              <div className="header-tools">
                <div className="search">
                  <span>SR</span>
                  <input placeholder="Buscar..." />
                </div>
                <button type="button" className="notify">
                  BL
                </button>
              </div>
            </header>
          )}

          {error && <div className="alert">{error}</div>}
          {loading && <section className="panel">Carregando dados...</section>}

          {!loading && isPatientProfileRoute && (
            <section className="patient-fullscreen-page">
              <div className="patient-breadcrumb">
                <button type="button" className="patient-breadcrumb-link" onClick={closePatientProfile}>
                  Pacientes
                </button>
                <span className="patient-breadcrumb-sep">›</span>
                <strong>{selectedPatient?.name || "Paciente"}</strong>
              </div>

              {!selectedPatient && (
                <div className="patients-empty">
                  <strong>Paciente nao encontrado.</strong>
                  <p>Ele pode ter sido removido ou o link esta incorreto.</p>
                </div>
              )}

              {selectedPatient && (
                <>
                  <div className="patient-hero">
                    <div className="patient-hero-main">
                      <div className="patient-hero-avatar-stack">
                        <div className="patient-profile-avatar patient-hero-avatar">{initials(selectedPatient.name)}</div>
                        <div className="patient-hero-goal" title={selectedPatient.goal || "Sem objetivo cadastrado"}>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="7" />
                            <circle cx="12" cy="12" r="3.2" />
                            <path d="M19.2 4.8 14.8 9.2" />
                            <path d="m16 4 4 0 0 4" />
                          </svg>
                          <span>{selectedPatient.goal || "Sem objetivo cadastrado"}</span>
                        </div>
                      </div>
                      <div className="patient-hero-text">
                        <h4>{selectedPatient.name}</h4>
                        <p className="patient-hero-submeta">
                          <span>{selectedPatient.age ? `${selectedPatient.age} anos` : "Idade nao informada"}</span>
                          <span className="dot">•</span>
                          <span>Criado em {formatDateTime(selectedPatient.createdAt)}</span>
                        </p>
                        <div className="patient-hero-latest">
                          <div className="patient-hero-latest-card">
                            <span className="patient-hero-latest-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24">
                                <path d="M8.5 3.5c0 2 1.2 3.5 3.5 3.5s3.5-1.5 3.5-3.5" />
                                <path d="M15.5 6.8v4.2l2.2 2.2a2.8 2.8 0 0 1 0 4l-.3.3a2.8 2.8 0 0 1-4 0l-1.4-1.4a4.3 4.3 0 0 1-1.2-3V6.8" />
                                <circle cx="18.4" cy="18.4" r="2.1" />
                                <path d="M8.5 6.8v2.9a6.6 6.6 0 0 0 2.5 5.2" />
                              </svg>
                            </span>
                            <div className="patient-hero-latest-content">
                              {latestPatientConsultationLoading && <p>Carregando ultima consulta...</p>}
                              {!latestPatientConsultationLoading && !latestPatientConsultation && (
                                <p>Nenhuma consulta registrada</p>
                              )}
                              {!latestPatientConsultationLoading && latestPatientConsultation && (
                                <p>
                                  {formatDateTime(latestPatientConsultation.scheduledAt)}{" "}
                                  {latestPatientConsultation.type ? `| ${latestPatientConsultation.type}` : ""}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              className="patient-btn patient-btn-primary patient-hero-consult-btn"
                              onClick={handleRegisterConsultationFromProfile}
                            >
                              Registrar consulta
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="patient-hero-side">
                      <div className="patient-hero-contact">
                        <strong>Contato</strong>
                        <p>
                          <span>Email</span>
                          <b className="patient-hero-contact-value">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
                              <path d="m4.5 7 7.5 5.4L19.5 7" />
                            </svg>
                            {selectedPatient.email || "Nao informado"}
                          </b>
                        </p>
                        <p>
                          <span>Telefone</span>
                          <b className="patient-hero-contact-value">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M7.6 4.8a1.6 1.6 0 0 1 2.2-.2l1.7 1.4a1.6 1.6 0 0 1 .5 1.8l-.6 2a1.6 1.6 0 0 0 .4 1.6l1 1a1.6 1.6 0 0 0 1.6.4l2-.6a1.6 1.6 0 0 1 1.8.5l1.4 1.7a1.6 1.6 0 0 1-.2 2.2l-1 1c-.8.8-2 1.1-3.1.8-2.2-.7-4.5-2.3-6.6-4.4-2.1-2.1-3.7-4.4-4.4-6.6-.3-1.1 0-2.3.8-3.1l1-1Z" />
                            </svg>
                            {selectedPatient.phone || "Nao informado"}
                          </b>
                        </p>
                      </div>
                      <div className="patient-hero-actions">
                        <button
                          type="button"
                          className="patient-btn patient-btn-primary"
                          onClick={() => editPatient(selectedPatient)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 20h4l10.6-10.6a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3Z" />
                            <path d="m13.5 6.5 4 4" />
                          </svg>
                          Editar paciente
                        </button>
                        <button
                          type="button"
                          className="patient-btn patient-btn-danger-soft"
                          onClick={() => removePatient(selectedPatient.id)}
                          disabled={patientRemoving}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16" />
                            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7" />
                            <path d="M10 11v5M14 11v5" />
                          </svg>
                          {patientRemoving ? "Removendo..." : "Remover paciente"}
                        </button>
                      </div>
                    </div>

                  </div>

                  <div className="patient-overview-grid">
                    <section className="patient-profile-panel patient-overview-card patient-plan-card">
                      <div className="patient-overview-head">
                        <span className="patient-overview-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 11h14a7 7 0 0 1-14 0Z" />
                            <path d="M9 8.5a2 2 0 0 1 4 0M7 8.5a2 2 0 0 1 2-2m8 2a2 2 0 0 0-2-2" />
                          </svg>
                        </span>
                        <div>
                          <h5>Plano alimentar</h5>
                        </div>
                      </div>
                      <div className="patient-overview-actions">
                        <div className="patient-plan-actions-row">
                          <button
                            type="button"
                            className="patient-action-btn"
                            onClick={() => {
                              if (isMealPlanExpanded) {
                                toggleMealPlanEditor(false);
                                return;
                              }
                              openMealPlanEditor();
                            }}
                          >
                            {isMealPlanExpanded
                              ? "Fechar editor"
                              : selectedMealPlanItems.length > 0
                                ? "Editar plano"
                                : "Criar plano alimentar"}
                          </button>
                          <button
                            type="button"
                            className="patient-action-btn ghost"
                            onClick={() => setShowMealPlanHistoryModal(true)}
                          >
                            Ver planos antigos
                          </button>
                        </div>
                        <span className="patient-plan-updated">
                          {!foods.length && "Cadastre alimentos para iniciar."}
                          {!!foods.length &&
                            (selectedMealPlanSavedAt
                              ? `Atualizado em ${formatDateTime(selectedMealPlanSavedAt)}`
                              : "Sem versao salva ainda.")}
                        </span>
                      </div>
                    </section>

                    <section className="patient-profile-panel patient-overview-card patient-photos-card">
                      <div className="patient-overview-head">
                        <span className="patient-overview-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" />
                            <path d="m8.5 15 2.7-2.8 2.3 2.2 2.8-3.4L20 15" />
                            <circle cx="9" cy="9" r="1.2" />
                          </svg>
                        </span>
                        <div>
                          <h5>Fotos do Paciente</h5>
                          <p>comparacao visual</p>
                        </div>
                      </div>
                      <p className="patient-overview-muted">
                        Adicione fotos da evolucao corporal para comparar progresso.
                      </p>
                      <div className="patient-overview-actions patient-overview-actions-end">
                        <label className="patient-photo-upload-btn">
                          <input type="file" accept="image/*" multiple onChange={handlePatientPhotosUpload} />
                          Adicionar fotos
                        </label>
                      </div>
                      <p className="patient-photo-counter">
                        {selectedPatientPhotos.length > 0
                          ? `${selectedPatientPhotos.length} foto(s) cadastrada(s)`
                          : "Nenhuma foto adicionada no momento."}
                      </p>
                    </section>

                    <section className="patient-profile-panel patient-overview-card patient-bio-side-card">
                      <div className="patient-overview-head">
                        <span className="patient-overview-icon">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 3v18" />
                            <path d="M7 7h10" />
                            <path d="M8 12h8" />
                            <path d="M9 17h6" />
                          </svg>
                        </span>
                        <div>
                          <h5>Avaliação Física</h5>
                          <p>antropometria e cálculo energético</p>
                        </div>
                      </div>
                      <div className="patient-physical-side-stats">
                        <span>
                          Avaliações: <strong>{selectedPatientPhysicalAssessments.length}</strong>
                        </span>
                        <span>
                          Última: <strong>{latestPhysicalAssessment ? formatDateOnly(latestPhysicalAssessment.date) : "--"}</strong>
                        </span>
                        <span>
                          TDEE: <strong>{latestPhysicalAssessment ? `${formatDecimal(latestPhysicalAssessment.tdee)} kcal` : "--"}</strong>
                        </span>
                      </div>
                      <button type="button" className="patient-action-btn" onClick={openPhysicalAssessmentModule}>
                        Abrir módulo
                      </button>
                    </section>
                  </div>

                  {isMealPlanExpanded && (
                    <div className="patient-meal-modal-backdrop" onClick={() => toggleMealPlanEditor(false)}>
                      <section
                        className="patient-profile-panel patient-meal-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>Editor de plano alimentar</h5>
                            <p className="patient-panel-hint">
                              Vincule os alimentos cadastrados e ajuste suas respectivas porções.
                            </p>
                          </div>
                          <button type="button" className="patient-action-btn ghost" onClick={() => toggleMealPlanEditor(false)}>
                            Fechar
                          </button>
                        </div>

                        <label className="patient-meal-description-field">
                          <span>Descricao do plano</span>
                          <input
                            type="text"
                            value={selectedMealPlanDescription}
                            onChange={(event) =>
                              setPatientMealPlanDescription((prev) => ({
                                ...prev,
                                [routePatientId]: event.target.value,
                              }))
                            }
                            placeholder="Ex.: Plano de definicao - Marco 2026"
                          />
                        </label>

                        <div className="patient-meal-builder">
                          <div className="patient-meal-group-create">
                            <input
                              type="text"
                              value={selectedMealPlanGroupDraft}
                              onChange={(event) =>
                                setPatientMealPlanGroupDraft((prev) => ({
                                  ...prev,
                                  [routePatientId]: event.target.value,
                                }))
                              }
                              placeholder="Novo grupo (ex.: Almoco, Cafe da manha)"
                            />
                            <button
                              type="button"
                              className="patient-action-btn ghost"
                              onClick={() => addMealPlanGroup(selectedMealPlanGroupDraft)}
                              disabled={
                                !selectedMealPlanGroupDraft.trim() ||
                                selectedMealPlanGroups.some(
                                  (item) =>
                                    item.toLowerCase() === selectedMealPlanGroupDraft.trim().toLowerCase(),
                                )
                              }
                            >
                              Adicionar grupo
                            </button>
                          </div>
                          <div className="patient-meal-group-presets">
                            {MEAL_GROUP_PRESETS.map((mealGroup) => {
                              const exists = selectedMealPlanGroups.some(
                                (groupName) => groupName.toLowerCase() === mealGroup.toLowerCase(),
                              );
                              return (
                                <button
                                  key={mealGroup}
                                  type="button"
                                  className={`patient-meal-group-chip ${exists ? "active" : ""}`}
                                  onClick={() => addMealPlanGroup(mealGroup)}
                                  disabled={exists}
                                >
                                  {mealGroup}
                                </button>
                              );
                            })}
                          </div>

                          {!foods.length && <p className="patient-meal-empty">Sem alimentos cadastrados na base.</p>}
                          {selectedMealPlanGroups.length === 0 && (
                            <p className="patient-meal-empty">
                              Nenhum grupo criado ainda. Adicione um grupo para comecar (ex.: Almoco).
                            </p>
                          )}
                          {selectedMealPlanGroups.map((groupName) => {
                            const groupItems = selectedMealPlanItems.filter(
                              (item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) === groupName,
                            );
                            const substitutionsForGroup = selectedMealPlanSubstitutionsMap[groupName] || [];
                            const isSubstitutionPanelOpen = Boolean(
                              selectedMealPlanSubstitutionExpandedMap[groupName],
                            );
                            const isGroupCollapsed = Boolean(selectedMealPlanGroupCollapsedMap[groupName]);
                            const groupTotals = groupItems.reduce(
                              (acc, item) => {
                                const itemTotals = calculateMealPlanItemTotals(item, foods);
                                acc.protein += itemTotals.protein;
                                acc.carbs += itemTotals.carbs;
                                acc.fat += itemTotals.fat;
                                return acc;
                              },
                              { protein: 0, carbs: 0, fat: 0 },
                            );
                            return (
                              <article className={`patient-meal-group ${isGroupCollapsed ? "collapsed" : ""}`} key={groupName}>
                                <header className="patient-meal-group-head">
                                  <div
                                    className="patient-meal-group-title-wrap patient-meal-group-title-toggle"
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={!isGroupCollapsed}
                                    aria-label={`${isGroupCollapsed ? "Expandir" : "Minimizar"} grupo ${groupName}`}
                                    onClick={() => toggleMealPlanGroupCollapsed(groupName)}
                                    onKeyDown={(event) => {
                                      if (event.key !== "Enter" && event.key !== " ") return;
                                      event.preventDefault();
                                      toggleMealPlanGroupCollapsed(groupName);
                                    }}
                                  >
                                    <div className="patient-meal-group-title-line">
                                      <button
                                        type="button"
                                        className={`patient-substitution-arrow ${isSubstitutionPanelOpen ? "open" : ""}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          toggleMealPlanSubstitutionPanel(groupName);
                                        }}
                                        aria-label={`Substituicoes de ${groupName}`}
                                        title="Abrir substituicoes"
                                      >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                          <path d="m9 6 6 6-6 6" />
                                        </svg>
                                      </button>
                                      <strong>{groupName}</strong>
                                    </div>
                                    <div className="patient-group-macros">
                                      <span>P {formatDecimal(groupTotals.protein)}g</span>
                                      <span>C {formatDecimal(groupTotals.carbs)}g</span>
                                      <span>G {formatDecimal(groupTotals.fat)}g</span>
                                    </div>
                                  </div>
                                  <div className="patient-meal-group-actions">
                                    <button
                                      type="button"
                                      className="patient-action-btn ghost"
                                      onClick={() => toggleMealPlanGroupCollapsed(groupName)}
                                    >
                                      {isGroupCollapsed ? "Expandir grupo" : "Minimizar grupo"}
                                    </button>
                                    <button
                                      type="button"
                                      className="patient-action-btn ghost"
                                      onClick={() => addMealPlanItem(groupName)}
                                      disabled={!foods.length}
                                    >
                                      Adicionar alimento
                                    </button>
                                    <button
                                      type="button"
                                      className="danger"
                                      onClick={() => removeMealPlanGroup(groupName)}
                                    >
                                      Remover grupo
                                    </button>
                                  </div>
                                </header>
                                {!isGroupCollapsed && (
                                  <>
                                    {groupItems.map((item) => {
                                      const itemTotals = calculateMealPlanItemTotals(item, foods);
                                      const linkedFood = itemTotals.linkedFood;
                                      const unit = itemTotals.unit;
                                      const foodSearchValue = item.foodSearch ?? linkedFood?.name ?? "";
                                      const isItemEditing =
                                        Boolean(selectedMealPlanItemEditModeMap[item.id]) || !isMealPlanItemReady(item);
                                      return (
                                        <div key={item.id} className="patient-meal-item-card">
                                          {!isItemEditing && (
                                            <div className="patient-meal-item-card-actions">
                                              <button
                                                type="button"
                                                className="patient-item-icon-btn"
                                                onClick={() => setMealPlanItemEditMode(item.id, true)}
                                                aria-label="Editar alimento"
                                                title="Editar alimento"
                                              >
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                  <path d="M12 20h9" />
                                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                </svg>
                                              </button>
                                              <button
                                                type="button"
                                                className="patient-item-icon-btn danger-icon"
                                                onClick={() => removeMealPlanItem(item.id)}
                                                aria-label="Remover alimento"
                                                title="Remover alimento"
                                              >
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                  <path d="M3 6h18" />
                                                  <path d="M8 6V4h8v2" />
                                                  <path d="M19 6l-1 14H6L5 6" />
                                                  <path d="M10 11v6" />
                                                  <path d="M14 11v6" />
                                                </svg>
                                              </button>
                                            </div>
                                          )}
                                          {isItemEditing ? (
                                            <div className="patient-meal-row">
                                              <div className="patient-food-autocomplete">
                                                <input
                                                  type="text"
                                                  list={`meal-plan-food-options-${item.id}`}
                                                  value={foodSearchValue}
                                                  onChange={(event) => changeMealPlanFoodSearch(item.id, event.target.value)}
                                                  placeholder="Digite para buscar alimento..."
                                                />
                                                <datalist id={`meal-plan-food-options-${item.id}`}>
                                                  {foods.map((food) => (
                                                    <option
                                                      key={food.id}
                                                      value={food.name}
                                                      label={`${food.name} (${measurementBasisLabel(food.measurementBasis)})`}
                                                    />
                                                  ))}
                                                </datalist>
                                              </div>
                                              <div className="patient-meal-portion-field">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step={unit === "unidade" ? "1" : "0.01"}
                                                  value={item.portion}
                                                  onChange={(event) => changeMealPlanPortion(item.id, event.target.value)}
                                                  placeholder="Porção"
                                                />
                                                <span>{unit}</span>
                                              </div>
                                              <div className="patient-meal-row-actions">
                                                <button
                                                  type="button"
                                                  className="patient-action-btn ghost"
                                                  onClick={() => setMealPlanItemEditMode(item.id, false)}
                                                  disabled={!isMealPlanItemReady(item)}
                                                >
                                                  Confirmar
                                                </button>
                                                <button
                                                  type="button"
                                                  className="danger"
                                                  onClick={() => removeMealPlanItem(item.id)}
                                                >
                                                  Remover
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="patient-meal-item-display">
                                              <strong>{linkedFood?.name || "Alimento não selecionado"}</strong>
                                              <span>{`${formatDecimal(itemTotals.portion)} ${unit}`}</span>
                                            </div>
                                          )}
                                          <div className="patient-meal-row-meta">
                                            {isItemEditing && (
                                              <strong>{linkedFood?.name || "Alimento nao selecionado"}</strong>
                                            )}
                                            <div className="patient-item-nutrients">
                                              <span>{formatDecimal(itemTotals.calories)} kcal</span>
                                              <span>P {formatDecimal(itemTotals.protein)}g</span>
                                              <span>C {formatDecimal(itemTotals.carbs)}g</span>
                                              <span>G {formatDecimal(itemTotals.fat)}g</span>
                                              <span>F {formatDecimal(itemTotals.fiber)}g</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {isSubstitutionPanelOpen && (
                                      <section className="patient-substitutions-panel">
                                        <div className="patient-substitutions-head">
                                          <strong>Substituicoes do grupo</strong>
                                          <button
                                            type="button"
                                            className="patient-action-btn ghost"
                                            onClick={() => addMealPlanSubstitution(groupName)}
                                          >
                                            Nova substituicao
                                          </button>
                                        </div>

                                        {substitutionsForGroup.length === 0 && (
                                          <p className="patient-meal-empty">
                                            Nenhuma substituicao cadastrada para este grupo.
                                          </p>
                                        )}

                                        {substitutionsForGroup.map((substitution) => (
                                          <article key={substitution.id} className="patient-substitution-card">
                                            <header className="patient-substitution-head">
                                              <input
                                                value={substitution.label || ""}
                                                onChange={(event) =>
                                                  changeMealPlanSubstitutionLabel(
                                                    groupName,
                                                    substitution.id,
                                                    event.target.value,
                                                  )
                                                }
                                                placeholder="Nome da substituicao"
                                              />
                                              <button
                                                type="button"
                                                className="danger"
                                                onClick={() => removeMealPlanSubstitution(groupName, substitution.id)}
                                              >
                                                Remover substituicao
                                              </button>
                                            </header>

                                            {(substitution.items || []).length === 0 && (
                                              <p className="patient-meal-empty">
                                                Nenhum alimento nesta substituicao.
                                              </p>
                                            )}

                                            {(substitution.items || []).map((item) => {
                                              const itemTotals = calculateMealPlanItemTotals(item, foods);
                                              const linkedFood = itemTotals.linkedFood;
                                              const unit = itemTotals.unit;
                                              const foodSearchValue = item.foodSearch ?? linkedFood?.name ?? "";
                                              const substitutionItemEditKey = mealPlanSubstitutionItemEditKey(
                                                groupName,
                                                substitution.id,
                                                item.id,
                                              );
                                              const isSubstitutionItemEditing =
                                                Boolean(
                                                  selectedMealPlanSubstitutionItemEditModeMap[substitutionItemEditKey],
                                                ) || !isMealPlanItemReady(item);
                                              return (
                                                <div
                                                  key={item.id}
                                                  className="patient-meal-item-card patient-substitution-item-card"
                                                >
                                                  {!isSubstitutionItemEditing && (
                                                    <div className="patient-meal-item-card-actions">
                                                      <button
                                                        type="button"
                                                        className="patient-item-icon-btn"
                                                        onClick={() =>
                                                          setMealPlanSubstitutionItemEditMode(
                                                            groupName,
                                                            substitution.id,
                                                            item.id,
                                                            true,
                                                          )
                                                        }
                                                        aria-label="Editar alimento"
                                                        title="Editar alimento"
                                                      >
                                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                                          <path d="M12 20h9" />
                                                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                        </svg>
                                                      </button>
                                                      <button
                                                        type="button"
                                                        className="patient-item-icon-btn danger-icon"
                                                        onClick={() =>
                                                          removeMealPlanSubstitutionItem(groupName, substitution.id, item.id)
                                                        }
                                                        aria-label="Remover alimento"
                                                        title="Remover alimento"
                                                      >
                                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                                          <path d="M3 6h18" />
                                                          <path d="M8 6V4h8v2" />
                                                          <path d="M19 6l-1 14H6L5 6" />
                                                          <path d="M10 11v6" />
                                                          <path d="M14 11v6" />
                                                        </svg>
                                                      </button>
                                                    </div>
                                                  )}
                                                  {isSubstitutionItemEditing ? (
                                                    <div className="patient-meal-row">
                                                      <div className="patient-food-autocomplete">
                                                        <input
                                                          type="text"
                                                          list={`meal-plan-substitution-food-options-${substitution.id}-${item.id}`}
                                                          value={foodSearchValue}
                                                          onChange={(event) =>
                                                            changeMealPlanSubstitutionFoodSearch(
                                                              groupName,
                                                              substitution.id,
                                                              item.id,
                                                              event.target.value,
                                                            )
                                                          }
                                                          placeholder="Digite para buscar alimento..."
                                                        />
                                                        <datalist
                                                          id={`meal-plan-substitution-food-options-${substitution.id}-${item.id}`}
                                                        >
                                                          {foods.map((food) => (
                                                            <option
                                                              key={food.id}
                                                              value={food.name}
                                                              label={`${food.name} (${measurementBasisLabel(food.measurementBasis)})`}
                                                            />
                                                          ))}
                                                        </datalist>
                                                      </div>
                                                      <div className="patient-meal-portion-field">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step={unit === "unidade" ? "1" : "0.01"}
                                                          value={item.portion}
                                                          onChange={(event) =>
                                                            changeMealPlanSubstitutionPortion(
                                                              groupName,
                                                              substitution.id,
                                                              item.id,
                                                              event.target.value,
                                                            )
                                                          }
                                                          placeholder="Porção"
                                                        />
                                                        <span>{unit}</span>
                                                      </div>
                                                      <div className="patient-meal-row-actions">
                                                        <button
                                                          type="button"
                                                          className="patient-action-btn ghost"
                                                          onClick={() =>
                                                            setMealPlanSubstitutionItemEditMode(
                                                              groupName,
                                                              substitution.id,
                                                              item.id,
                                                              false,
                                                            )
                                                          }
                                                          disabled={!isMealPlanItemReady(item)}
                                                        >
                                                          Confirmar
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="danger"
                                                          onClick={() =>
                                                            removeMealPlanSubstitutionItem(groupName, substitution.id, item.id)
                                                          }
                                                        >
                                                          Remover
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="patient-meal-item-display">
                                                      <strong>{linkedFood?.name || "Alimento não selecionado"}</strong>
                                                      <span>{`${formatDecimal(itemTotals.portion)} ${unit}`}</span>
                                                    </div>
                                                  )}
                                                  <div className="patient-meal-row-meta">
                                                    {isSubstitutionItemEditing && (
                                                      <strong>{linkedFood?.name || "Alimento nao selecionado"}</strong>
                                                    )}
                                                    <div className="patient-item-nutrients">
                                                      <span>{formatDecimal(itemTotals.calories)} kcal</span>
                                                      <span>P {formatDecimal(itemTotals.protein)}g</span>
                                                      <span>C {formatDecimal(itemTotals.carbs)}g</span>
                                                      <span>G {formatDecimal(itemTotals.fat)}g</span>
                                                      <span>F {formatDecimal(itemTotals.fiber)}g</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}

                                            <div className="patient-substitution-actions">
                                              <button
                                                type="button"
                                                className="patient-action-btn ghost"
                                                onClick={() => addMealPlanSubstitutionItem(groupName, substitution.id)}
                                                disabled={!foods.length}
                                              >
                                                Adicionar alimento na substituicao
                                              </button>
                                            </div>
                                          </article>
                                        ))}
                                      </section>
                                    )}
                                  </>
                                )}
                              </article>
                            );
                          })}
                          <div className="patient-meal-builder-actions">
                            <button
                              type="button"
                              className="patient-action-btn ghost"
                              onClick={exportMealPlanPdf}
                              disabled={!selectedMealPlanItems.length}
                            >
                              Exportar plano (PDF)
                            </button>
                            <button
                              type="button"
                              className="patient-action-btn"
                              onClick={saveMealPlan}
                              disabled={!selectedMealPlanItems.length || mealPlanSubmitting}
                            >
                              {mealPlanSubmitting ? "Salvando plano..." : "Salvar plano alimentar"}
                            </button>
                          </div>
                        </div>

                        {!!selectedMealPlanItems.length && (
                          <div className="patient-meal-summary patient-meal-summary-modal">
                            <div className="patient-meal-totals">
                              <span>{formatDecimal(mealPlanTotals.calories)} kcal</span>
                              <span>P {formatDecimal(mealPlanTotals.protein)}g</span>
                              <span>C {formatDecimal(mealPlanTotals.carbs)}g</span>
                              <span>G {formatDecimal(mealPlanTotals.fat)}g</span>
                              <span>F {formatDecimal(mealPlanTotals.fiber)}g</span>
                            </div>
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {showMealPlanHistoryModal && (
                    <div className="patient-meal-modal-backdrop" onClick={() => setShowMealPlanHistoryModal(false)}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-meal-history-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>Planos alimentares antigos</h5>
                            <p className="patient-panel-hint">Historico de versoes salvas do plano alimentar.</p>
                          </div>
                          <button
                            type="button"
                            className="patient-action-btn ghost"
                            onClick={() => setShowMealPlanHistoryModal(false)}
                          >
                            Fechar
                          </button>
                        </div>

                        {selectedMealPlanHistory.length === 0 && (
                          <p className="patient-meal-empty">Nenhum plano antigo salvo para este paciente.</p>
                        )}

                        {selectedMealPlanHistory.length > 0 && (
                          <div className="patient-history-list">
                            {selectedMealPlanHistory.map((entry) => {
                              const totals = entry.items.reduce(
                                (acc, item) => {
                                  const itemTotals = calculateMealPlanItemTotals(item, foods);
                                  acc.calories += itemTotals.calories;
                                  acc.protein += itemTotals.protein;
                                  acc.carbs += itemTotals.carbs;
                                  acc.fat += itemTotals.fat;
                                  acc.fiber += itemTotals.fiber;
                                  return acc;
                                },
                                { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
                              );
                              const entryGroups = (
                                Array.isArray(entry.groups) && entry.groups.length
                                  ? entry.groups
                                  : entry.items.map((item) => item.mealOccasion || DEFAULT_MEAL_OCCASION)
                              ).filter(Boolean);
                              const normalizedGroups = [];
                              entryGroups.forEach((groupName) => {
                                if (!normalizedGroups.includes(groupName)) normalizedGroups.push(groupName);
                              });

                              return (
                                <article key={entry.id} className="patient-history-item">
                                  <header>
                                    <strong>{entry.description || "Plano sem descricao"}</strong>
                                    <span>
                                      {formatDateTime(entry.savedAt)} | {entry.items.length} alimento(s)
                                    </span>
                                  </header>
                                  <div className="patient-history-body">
                                    {normalizedGroups.map((groupName) => {
                                      const groupItems = entry.items.filter(
                                        (item) => (item.mealOccasion || DEFAULT_MEAL_OCCASION) === groupName,
                                      );
                                      const groupSubstitutions = (entry.substitutions && entry.substitutions[groupName]) || [];
                                      return (
                                        <div key={`${entry.id}-${groupName}`} className="patient-history-group">
                                          <strong className="patient-history-group-title">{groupName}</strong>
                                          {groupItems.length === 0 && (
                                            <p className="patient-history-empty-group">Nenhum alimento nesse grupo.</p>
                                          )}
                                          {groupItems.map((item) => {
                                            const itemTotals = calculateMealPlanItemTotals(item, foods);
                                            const linkedFood = itemTotals.linkedFood;
                                            const unit = itemTotals.unit;
                                            return (
                                              <div key={item.id} className="patient-history-food-line">
                                                <p>
                                                  <strong>{linkedFood?.name || "Alimento removido"}</strong>:{" "}
                                                  {item.portion || 0} {unit}
                                                </p>
                                                <div className="patient-item-nutrients">
                                                  <span>{formatDecimal(itemTotals.calories)} kcal</span>
                                                  <span>P {formatDecimal(itemTotals.protein)}g</span>
                                                  <span>C {formatDecimal(itemTotals.carbs)}g</span>
                                                  <span>G {formatDecimal(itemTotals.fat)}g</span>
                                                  <span>F {formatDecimal(itemTotals.fiber)}g</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          {groupSubstitutions.length > 0 && (
                                            <div className="patient-history-substitutions">
                                              <span className="patient-history-substitutions-title">Substituicoes</span>
                                              {groupSubstitutions.map((substitution) => (
                                                <article
                                                  key={`${entry.id}-${groupName}-${substitution.id}`}
                                                  className="patient-history-substitution-card"
                                                >
                                                  <strong>{substitution.label || "Substituicao"}</strong>
                                                  {(substitution.items || []).length === 0 && (
                                                    <p className="patient-history-empty-group">
                                                      Nenhum alimento nesta substituicao.
                                                    </p>
                                                  )}
                                                  {(substitution.items || []).map((item) => {
                                                    const itemTotals = calculateMealPlanItemTotals(item, foods);
                                                    const linkedFood = itemTotals.linkedFood;
                                                    const unit = itemTotals.unit;
                                                    return (
                                                      <div
                                                        key={`${substitution.id}-${item.id}`}
                                                        className="patient-history-food-line"
                                                      >
                                                        <p>
                                                          <strong>{linkedFood?.name || "Alimento removido"}</strong>:{" "}
                                                          {item.portion || 0} {unit}
                                                        </p>
                                                        <div className="patient-item-nutrients">
                                                          <span>{formatDecimal(itemTotals.calories)} kcal</span>
                                                          <span>P {formatDecimal(itemTotals.protein)}g</span>
                                                          <span>C {formatDecimal(itemTotals.carbs)}g</span>
                                                          <span>G {formatDecimal(itemTotals.fat)}g</span>
                                                          <span>F {formatDecimal(itemTotals.fiber)}g</span>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </article>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="patient-meal-totals">
                                    <span>{formatDecimal(totals.calories)} kcal</span>
                                    <span>P {formatDecimal(totals.protein)}g</span>
                                    <span>C {formatDecimal(totals.carbs)}g</span>
                                    <span>G {formatDecimal(totals.fat)}g</span>
                                    <span>F {formatDecimal(totals.fiber)}g</span>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {selectedPatientPhotos.length > 0 && (
                    <section className="patient-profile-panel patient-photo-gallery-panel">
                      <h5>Galeria de fotos</h5>
                      <div className="patient-photo-grid">
                        {selectedPatientPhotos.map((photo) => (
                          <article key={photo.id} className="patient-photo-card">
                            <img src={photo.url} alt={photo.name} />
                            <div className="patient-photo-card-footer">
                              <span>{photo.name}</span>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => removePatientPhoto(photo.id)}
                              >
                                Remover
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="patient-progress-bio-grid">
                    <section className="patient-profile-panel patient-progress-spotlight">
                      <div className="patient-progress-head">
                        <div className="patient-progress-head-copy">
                          <div className="patient-progress-title-row">
                            <h5>Grafico de Progressao</h5>
                            <div className="patient-progress-badge">{progressBadgeLabel}</div>
                            <div className="patient-progress-mode-toggle" role="tablist" aria-label="Tipo de grafico de progressao">
                              <button
                                type="button"
                                className={`patient-progress-mode-btn ${isWeightProgressChart ? "active" : ""}`}
                                onClick={() => setProgressChartMode("weight")}
                                role="tab"
                                aria-selected={isWeightProgressChart}
                              >
                                Pesagem
                              </button>
                              <button
                                type="button"
                                className={`patient-progress-mode-btn ${!isWeightProgressChart ? "active" : ""}`}
                                onClick={() => setProgressChartMode("measurements")}
                                role="tab"
                                aria-selected={!isWeightProgressChart}
                              >
                                Medidas e dobras
                              </button>
                            </div>
                          </div>
                          <p>
                            {isWeightProgressChart
                              ? "Acompanhe tendencia, meta e proximos passos do paciente."
                              : "Dados puxados diretamente das avaliacoes fisicas."}
                          </p>
                        </div>
                        <div className="patient-metrics-actions">
                          <button
                            type="button"
                            className="patient-action-btn patient-progress-primary-btn"
                            onClick={isWeightProgressChart ? openWeightEntryModal : openPhysicalAssessmentCreateForm}
                            disabled={progressPrimaryActionDisabled}
                            title={
                              isWeightProgressChart && !canRegisterWeightProgress
                                ? "Cadastre uma avaliacao fisica para liberar este recurso."
                                : undefined
                            }
                          >
                            {progressPrimaryActionLabel}
                          </button>
                        </div>
                      </div>
                      <div className="patient-progress-kpi-strip">
                        {isWeightProgressChart ? (
                          <>
                            <article className="patient-progress-kpi-item">
                              <span>Peso atual</span>
                              <strong>{progressCurrent !== null ? `${formatDecimal(progressCurrent)} kg` : "--"}</strong>
                            </article>
                            <article className="patient-progress-kpi-item">
                              <span>Variacao</span>
                              <strong>
                                {progressDelta !== null
                                  ? `${progressDelta > 0 ? "+" : ""}${formatDecimal(progressDelta)} kg`
                                  : "--"}
                              </strong>
                            </article>
                            <article className="patient-progress-kpi-item">
                              <span>Meta</span>
                              <strong>{progressTarget !== null ? `${formatDecimal(progressTarget)} kg` : "--"}</strong>
                            </article>
                          </>
                        ) : (
                          <>
                            <article className="patient-progress-kpi-item">
                              <span>Medida atual (cintura)</span>
                              <strong>
                                {progressMeasurementCurrent !== null
                                  ? `${formatDecimal(progressMeasurementCurrent)} cm`
                                  : "--"}
                              </strong>
                            </article>
                            <article className="patient-progress-kpi-item">
                              <span>Soma de dobras</span>
                              <strong>
                                {progressSkinfoldCurrent !== null ? `${formatDecimal(progressSkinfoldCurrent)} mm` : "--"}
                              </strong>
                            </article>
                            <article className="patient-progress-kpi-item">
                              <span>Avaliacoes usadas</span>
                              <strong>{progressMeasurementEntries.length || "--"}</strong>
                            </article>
                          </>
                        )}
                      </div>
                      {isWeightProgressChart && !canRegisterWeightProgress && (
                        <p className="patient-panel-hint patient-progress-head-hint">
                          Cadastre uma avaliacao fisica para liberar o registro de progressao.
                        </p>
                      )}
                      {isWeightProgressChart && shouldShowTargetRefreshAlert && (
                        <div className="patient-metrics-alert">
                          <span>Meta atual atingida. Defina uma nova meta no gráfico de progressão.</span>
                        </div>
                      )}
                      <div className="patient-progress-layout">
                        <div>
                          <div className="patient-progress-chart-shell">
                            <div className="patient-progress-chart-legend">
                              <div className="patient-progress-chart-legend-copy">
                                {isWeightProgressChart ? (
                                  progressScale && (
                                    <span>
                                      Escala: {formatDecimal(progressScale.minValue)} a {formatDecimal(progressScale.maxValue)} kg
                                    </span>
                                  )
                                ) : progressMeasurementScale && progressSkinfoldScale ? (
                                  <>
                                    <span>
                                      Escala medidas: {formatDecimal(progressMeasurementScale.minValue)} a{" "}
                                      {formatDecimal(progressMeasurementScale.maxValue)} cm | Dobras:{" "}
                                      {formatDecimal(progressSkinfoldScale.minValue)} a{" "}
                                      {formatDecimal(progressSkinfoldScale.maxValue)} mm
                                    </span>
                                    <div className="patient-progress-series-legend">
                                      <span className="patient-progress-series-item">
                                        <i className="patient-progress-series-swatch is-measure" aria-hidden="true" />
                                        Medidas (cintura/media) - eixo esquerdo (cm)
                                      </span>
                                      <span className="patient-progress-series-item">
                                        <i className="patient-progress-series-swatch is-skinfold" aria-hidden="true" />
                                        Dobras (soma) - eixo direito (mm)
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <span>Sem avaliacoes fisicas suficientes para montar o grafico.</span>
                                )}
                              </div>
                              <div className="patient-progress-chart-legend-actions">
                                {isWeightProgressChart ? (
                                  <>
                                    <button
                                      type="button"
                                      className="patient-progress-history-btn"
                                      onClick={() => setShowProgressHistoryModal(true)}
                                    >
                                      Historico
                                    </button>
                                    {progressTarget !== null && (
                                      <span className="patient-progress-target-chip">
                                        Meta: {formatDecimal(progressTarget)} kg
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className={`patient-progress-target-btn ${shouldShowTargetRefreshAlert ? "is-alert" : ""}`}
                                      onClick={openTargetRefreshModal}
                                    >
                                      {progressTarget === null
                                        ? "Definir meta"
                                        : shouldShowTargetRefreshAlert
                                          ? "Nova meta"
                                          : "Ajustar meta"}
                                    </button>
                                    {isDevelopmentMode && hasEvolutionData && (
                                      <button
                                        type="button"
                                        className="patient-progress-dev-btn"
                                        onClick={clearPatientEvolutionData}
                                      >
                                        Remover dados
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="patient-progress-history-btn"
                                      onClick={() => setShowPhysicalAssessmentModal(true)}
                                    >
                                      Avaliacoes fisicas
                                    </button>
                                    <span className="patient-progress-target-chip">Origem: avaliacoes fisicas</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <svg
                              ref={progressChartRef}
                              className="patient-progress-chart"
                              viewBox={`0 0 ${progressChartWidth} ${progressChartHeight}`}
                              preserveAspectRatio="xMinYMid meet"
                              role="img"
                              aria-label={
                                isWeightProgressChart
                                  ? "Grafico de progressao de pesagem do paciente"
                                  : "Grafico de medidas e dobras das avaliacoes fisicas"
                              }
                              onClick={() => setActiveProgressPointId("")}
                            >
                              <defs>
                                <linearGradient id="patientProgressGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop
                                    offset="0%"
                                    stopColor={theme === "dark" ? "#35eac6" : "#1ea57b"}
                                    stopOpacity={theme === "dark" ? "0.34" : "0.46"}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={theme === "dark" ? "#35eac6" : "#1ea57b"}
                                    stopOpacity={theme === "dark" ? "0.02" : "0.05"}
                                  />
                                </linearGradient>
                                <linearGradient id="patientMeasuresGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop
                                    offset="0%"
                                    stopColor={theme === "dark" ? "#58a6ff" : "#2f6bff"}
                                    stopOpacity={theme === "dark" ? "0.28" : "0.18"}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor={theme === "dark" ? "#58a6ff" : "#2f6bff"}
                                    stopOpacity={theme === "dark" ? "0.03" : "0.02"}
                                  />
                                </linearGradient>
                              </defs>
                              <rect
                                x={progressChartLeftX}
                                y={progressChartPaddingY}
                                width={progressChartRightX - progressChartLeftX}
                                height={progressChartBottomY - progressChartPaddingY}
                                className="patient-progress-canvas"
                              />
                              {isWeightProgressChart ? (
                                <>
                                  {progressYAxisTicks.map((tick, index) => (
                                <g key={`tick-${tick.value}-${index}`}>
                                  <path
                                    d={`M ${progressChartLeftX} ${tick.y} L ${progressChartRightX} ${tick.y}`}
                                    className={index === progressYAxisTicks.length - 1 ? "patient-progress-axis" : "patient-progress-grid-line"}
                                  />
                                  <text
                                    x={progressChartLeftX - 10}
                                    y={tick.y + 4}
                                    className="patient-progress-y-label"
                                    textAnchor="end"
                                  >
                                    {formatDecimal(tick.value)}
                                  </text>
                                </g>
                                  ))}
                              {progressTargetY !== null && (
                                <>
                                  <path
                                    d={`M ${progressChartLeftX} ${progressTargetY} L ${progressChartRightX} ${progressTargetY}`}
                                    className="patient-progress-target-line"
                                  />
                                  <text
                                    x={progressChartRightX - 6}
                                    y={Math.max(progressChartPaddingY + 12, progressTargetY - 8)}
                                    className="patient-progress-target-text"
                                    textAnchor="end"
                                  >
                                    Meta
                                  </text>
                                </>
                              )}
                              {progressPath && (
                                <>
                                  <path
                                    d={`${progressPath} L ${progressChartRightX} ${progressChartBottomY} L ${progressChartLeftX} ${progressChartBottomY} Z`}
                                    fill="url(#patientProgressGradient)"
                                  />
                                  <path d={progressPath} className="patient-progress-line" />
                                </>
                              )}
                                  {progressPoints.map((point) => {
                                const pointActionId = point.sourceEntryId || point.key;
                                const isActionVisible = point.canManage && activeProgressPointId === pointActionId;
                                const actionsWidth = 132;
                                const actionsHeight = 36;
                                const actionsX = Math.max(
                                  progressChartLeftX + 6,
                                  Math.min(point.x - actionsWidth / 2, progressChartRightX - actionsWidth - 6),
                                );
                                const preferredAboveY = point.y - actionsHeight - 10;
                                const preferredBelowY = point.y + 10;
                                const actionsY = Math.max(
                                  progressChartPaddingY + 4,
                                  Math.min(
                                    preferredAboveY >= progressChartPaddingY + 4
                                      ? preferredAboveY
                                      : preferredBelowY,
                                    progressChartBottomY - actionsHeight - 4,
                                  ),
                                );
                                const connectorStartY = actionsY < point.y ? actionsY + actionsHeight : actionsY;
                                return (
                                  <g
                                    key={point.key}
                                    className={`patient-progress-point-group ${point.canManage ? "is-manageable" : ""} ${isActionVisible ? "is-active" : ""}`}
                                  >
                                    {point.isLatest && (
                                      <circle cx={point.x} cy={point.y} r="12" className="patient-progress-point-glow" />
                                    )}
                                    <circle
                                      cx={point.x}
                                      cy={point.y}
                                      r={point.isLatest ? (isActionVisible ? 7.2 : 6.2) : isActionVisible ? 5.4 : 4.6}
                                      className={`patient-progress-point ${point.isLatest ? "is-latest" : ""} ${point.canManage ? "is-manageable" : ""} ${isActionVisible ? "is-active" : ""}`}
                                    >
                                      <title>{`${formatDecimal(point.value)} kg`}</title>
                                    </circle>
                                    {point.canManage && (
                                      <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r="14"
                                        className="patient-progress-point-hitbox"
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Gerenciar ponto de ${formatDecimal(point.value)} kg`}
                                        onMouseEnter={() => setActiveProgressPointId(pointActionId)}
                                        onMouseLeave={(event) => {
                                          if (event.currentTarget.parentElement?.contains(event.relatedTarget)) return;
                                          setActiveProgressPointId((current) =>
                                            current === pointActionId ? "" : current,
                                          );
                                        }}
                                        onFocus={() => setActiveProgressPointId(pointActionId)}
                                        onBlur={(event) => {
                                          if (event.currentTarget.parentElement?.contains(event.relatedTarget)) return;
                                          setActiveProgressPointId((current) =>
                                            current === pointActionId ? "" : current,
                                          );
                                        }}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setActiveProgressPointId((current) => (current === pointActionId ? "" : pointActionId));
                                        }}
                                        onKeyDown={(event) => {
                                          if (event.key !== "Enter" && event.key !== " ") return;
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setActiveProgressPointId((current) => (current === pointActionId ? "" : pointActionId));
                                        }}
                                      />
                                    )}
                                    {isActionVisible && (
                                      <>
                                        <path
                                          d={`M ${point.x} ${connectorStartY} L ${point.x} ${point.y}`}
                                          className="patient-progress-point-connector"
                                        />
                                        <foreignObject
                                          x={actionsX}
                                          y={actionsY}
                                          width={actionsWidth}
                                          height={actionsHeight}
                                          onClick={(event) => event.stopPropagation()}
                                        >
                                          <div className="patient-progress-point-actions" xmlns="http://www.w3.org/1999/xhtml">
                                            <button
                                              type="button"
                                              className="patient-progress-point-action-btn"
                                              onClick={() => openWeightEntryEditModal(pointActionId)}
                                            >
                                              Editar
                                            </button>
                                            <button
                                              type="button"
                                              className="patient-progress-point-action-btn is-danger"
                                              onClick={() => handleWeightEntryDelete(pointActionId)}
                                            >
                                              Excluir
                                            </button>
                                          </div>
                                        </foreignObject>
                                      </>
                                    )}
                                  </g>
                                );
                                  })}
                                </>
                              ) : (
                                <>
                                  <text
                                    x={progressChartLeftX + 2}
                                    y={progressChartPaddingY - 8}
                                    className="patient-progress-axis-caption"
                                    textAnchor="start"
                                  >
                                    Medidas (cm)
                                  </text>
                                  <text
                                    x={progressChartRightX - 2}
                                    y={progressChartPaddingY - 8}
                                    className="patient-progress-axis-caption is-right"
                                    textAnchor="end"
                                  >
                                    Dobras (mm)
                                  </text>
                                  {progressMeasurementYAxisTicks.map((tick, index) => (
                                    <g key={`measurement-tick-${tick.value}-${index}`}>
                                      <path
                                        d={`M ${progressChartLeftX} ${tick.y} L ${progressChartRightX} ${tick.y}`}
                                        className={index === progressMeasurementYAxisTicks.length - 1 ? "patient-progress-axis" : "patient-progress-grid-line"}
                                      />
                                      <text
                                        x={progressChartLeftX - 10}
                                        y={tick.y + 4}
                                        className="patient-progress-y-label"
                                        textAnchor="end"
                                      >
                                        {formatDecimal(tick.value)}
                                      </text>
                                    </g>
                                  ))}
                                  {progressSkinfoldYAxisTicks.map((tick, index) => (
                                    <text
                                      key={`skinfold-tick-${tick.value}-${index}`}
                                      x={progressChartRightX + 10}
                                      y={tick.y + 4}
                                      className="patient-progress-y-label patient-progress-y-label-right"
                                      textAnchor="start"
                                    >
                                      {formatDecimal(tick.value)}
                                    </text>
                                  ))}
                                  {progressMeasurementPath && (
                                    <>
                                      <path
                                        d={`${progressMeasurementPath} L ${progressChartRightX} ${progressChartBottomY} L ${progressChartLeftX} ${progressChartBottomY} Z`}
                                        fill="url(#patientMeasuresGradient)"
                                      />
                                      <path
                                        d={progressMeasurementPath}
                                        className="patient-progress-line patient-progress-line-measure"
                                      />
                                    </>
                                  )}
                                  {progressSkinfoldPath && (
                                    <path d={progressSkinfoldPath} className="patient-progress-line patient-progress-line-skinfold" />
                                  )}
                                  {progressMeasurementPoints.map((point) => (
                                    <g key={point.key}>
                                      <circle
                                        cx={point.x}
                                        cy={point.measurementY}
                                        r="4.8"
                                        className="patient-progress-point patient-progress-point-measure"
                                      >
                                        <title>{`${formatDecimal(point.measurementValue)} cm`}</title>
                                      </circle>
                                      <circle
                                        cx={point.x}
                                        cy={point.skinfoldY}
                                        r="4.4"
                                        className="patient-progress-point patient-progress-point-skinfold"
                                      >
                                        <title>{`${formatDecimal(point.skinfoldTotal)} mm`}</title>
                                      </circle>
                                    </g>
                                  ))}
                                  {progressMeasurementEntries.length === 0 && (
                                    <text
                                      x={(progressChartLeftX + progressChartRightX) / 2}
                                      y={(progressChartPaddingY + progressChartBottomY) / 2}
                                      className="patient-progress-empty-text"
                                      textAnchor="middle"
                                    >
                                      Registre avaliacoes fisicas para visualizar medidas e dobras.
                                    </text>
                                  )}
                                </>
                              )}
                            </svg>
                          </div>

                          <div className="patient-progress-labels">
                            {(isWeightProgressChart ? progressLabels : progressMeasurementLabels).map((label, index) => (
                              <span
                                key={`${label}-${index}`}
                                className={
                                  index ===
                                  (isWeightProgressChart ? progressLabels.length : progressMeasurementLabels.length) - 1
                                    ? "is-latest"
                                    : ""
                                }
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {showProgressHistoryModal && (
                    <div className="patient-meal-modal-backdrop" onClick={() => setShowProgressHistoryModal(false)}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-progress-history-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>Historico da evolucao</h5>
                            <p className="patient-panel-hint">
                              Datas e valores de progresso e meta do paciente.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="patient-action-btn ghost"
                            onClick={() => setShowProgressHistoryModal(false)}
                          >
                            Fechar
                          </button>
                        </div>

                        {!progressHistoryEntries.length && (
                          <p className="patient-meal-empty">Nenhum dado de evolucao registrado.</p>
                        )}

                        {progressHistoryEntries.length > 0 && (
                          <div className="patient-progress-history-list">
                            {progressHistoryEntries.map((entry) => (
                              <article key={entry.id} className="patient-progress-history-item">
                                <strong>{entry.title}</strong>
                                <span>{entry.value}</span>
                                <p>{entry.date ? formatDateTime(entry.date) : "Data nao informada"}</p>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {showPhysicalAssessmentModal && (
                    <div className="patient-meal-modal-backdrop" onClick={closePhysicalAssessmentModule}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-physical-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>Avaliação Física</h5>
                            <p className="patient-panel-hint">
                              Histórico de antropometria e cálculo energético do paciente.
                            </p>
                          </div>
                          <div className="patient-physical-head-actions">
                            <button type="button" className="patient-action-btn" onClick={openPhysicalAssessmentCreateForm}>
                              Nova avaliação
                            </button>
                            <button
                              type="button"
                              className="patient-action-btn ghost"
                              onClick={closePhysicalAssessmentModule}
                            >
                              Fechar
                            </button>
                          </div>
                        </div>

                        {!!physicalAssessmentEvolution && (
                          <div className="patient-physical-evolution">
                            <span>
                              Evolução do peso:{" "}
                              <strong>
                                {physicalAssessmentEvolution.weightDelta > 0 ? "+" : ""}
                                {formatDecimal(physicalAssessmentEvolution.weightDelta)} kg
                              </strong>
                            </span>
                            <span>
                              Evolução do TDEE:{" "}
                              <strong>
                                {physicalAssessmentEvolution.tdeeDelta > 0 ? "+" : ""}
                                {formatDecimal(physicalAssessmentEvolution.tdeeDelta)} kcal
                              </strong>
                            </span>
                          </div>
                        )}

                        {selectedPatientPhysicalAssessments.length === 0 && (
                          <p className="patient-meal-empty">
                            Nenhuma avaliação física registrada para este paciente.
                          </p>
                        )}

                        {selectedPatientPhysicalAssessments.length > 0 && (
                          <div className="patient-physical-table-wrap">
                            <table className="patient-physical-table">
                              <thead>
                                <tr>
                                  <th>Data</th>
                                  <th>Peso</th>
                                  <th>Cintura</th>
                                  <th>TDEE</th>
                                  <th>Meta calórica</th>
                                  <th>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedPatientPhysicalAssessments.map((assessment) => {
                                  const waist = (assessment.circumferences || []).find(
                                    (item) => item.type === "cintura",
                                  );
                                  return (
                                    <tr key={assessment.id}>
                                      <td>{formatDateOnly(assessment.date)}</td>
                                      <td>{formatDecimal(assessment.weightKg)} kg</td>
                                      <td>{waist ? `${formatDecimal(waist.valueCm)} cm` : "--"}</td>
                                      <td>{formatDecimal(assessment.tdee)} kcal</td>
                                      <td>{formatDecimal(assessment.calorieTarget)} kcal</td>
                                      <td>
                                        <div className="patient-physical-row-actions">
                                          <button
                                            type="button"
                                            className="patient-action-btn ghost"
                                            onClick={() => openPhysicalAssessmentFormMode(assessment.id, "view")}
                                          >
                                            Detalhes
                                          </button>
                                          <button
                                            type="button"
                                            className="patient-action-btn ghost"
                                            onClick={() => openPhysicalAssessmentFormMode(assessment.id, "edit")}
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            className="patient-action-btn subtle-danger"
                                            onClick={() => removePhysicalAssessment(assessment.id)}
                                          >
                                            Excluir
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {showPhysicalAssessmentFormModal && (
                    <div className="patient-meal-modal-backdrop" onClick={closePhysicalAssessmentForm}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-physical-form-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>
                              {physicalAssessmentFormMode === "create"
                                ? "Nova Avaliação Física"
                                : physicalAssessmentFormMode === "edit"
                                  ? "Editar Avaliação Física"
                                  : "Detalhes da Avaliação Física"}
                            </h5>
                            <p className="patient-panel-hint">
                              Dados antropométricos, dobras cutâneas e cálculo energético automático.
                            </p>
                          </div>
                          <button type="button" className="patient-action-btn ghost" onClick={closePhysicalAssessmentForm}>
                            Fechar
                          </button>
                        </div>

                        <div className="patient-physical-tabs">
                          <button
                            type="button"
                            className={`patient-physical-tab ${physicalAssessmentFormTab === "basicos" ? "active" : ""}`}
                            onClick={() => setPhysicalAssessmentFormTab("basicos")}
                          >
                            Dados básicos
                          </button>
                          <button
                            type="button"
                            className={`patient-physical-tab ${physicalAssessmentFormTab === "circ" ? "active" : ""}`}
                            onClick={() => setPhysicalAssessmentFormTab("circ")}
                          >
                            Circunferências
                          </button>
                          <button
                            type="button"
                            className={`patient-physical-tab ${physicalAssessmentFormTab === "dobras" ? "active" : ""}`}
                            onClick={() => setPhysicalAssessmentFormTab("dobras")}
                          >
                            Dobras cutâneas
                          </button>
                          <button
                            type="button"
                            className={`patient-physical-tab ${physicalAssessmentFormTab === "resultado" ? "active" : ""}`}
                            onClick={() => setPhysicalAssessmentFormTab("resultado")}
                          >
                            Resultado
                          </button>
                        </div>

                        <form className="patient-physical-form" onSubmit={handlePhysicalAssessmentSubmit}>
                          {physicalAssessmentFormTab === "basicos" && (
                            <div className="patient-physical-grid">
                              <label>
                                <span>Data da avaliação</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={physicalAssessmentForm.date}
                                  onChange={(event) =>
                                    changePhysicalAssessmentField("date", normalizeBrDateInput(event.target.value))
                                  }
                                  disabled={isPhysicalAssessmentReadOnly}
                                  placeholder="dd/mm/aaaa"
                                  maxLength={10}
                                  required
                                />
                              </label>
                              <label>
                                <span>Peso (kg)</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={physicalAssessmentForm.weightKg}
                                  onChange={(event) => changePhysicalAssessmentField("weightKg", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  placeholder="Ex.: 80,5"
                                  required
                                />
                              </label>
                              <label>
                                <span>Altura (cm)</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={physicalAssessmentForm.heightCm}
                                  onChange={(event) => changePhysicalAssessmentField("heightCm", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  placeholder="Ex.: 175"
                                  required
                                />
                              </label>
                              <label>
                                <span>Idade</span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={physicalAssessmentForm.age}
                                  onChange={(event) => changePhysicalAssessmentField("age", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  required
                                />
                              </label>
                              <label>
                                <span>Sexo biológico</span>
                                <select
                                  value={physicalAssessmentForm.sex}
                                  onChange={(event) => changePhysicalAssessmentField("sex", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  required
                                >
                                  <option value="">Selecione...</option>
                                  {PHYSICAL_SEX_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span>Nível de atividade</span>
                                <select
                                  value={physicalAssessmentForm.activityLevel}
                                  onChange={(event) => changePhysicalAssessmentField("activityLevel", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  required
                                >
                                  {PHYSICAL_ACTIVITY_LEVELS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                <span>Objetivo considerado</span>
                                <input
                                  type="text"
                                  value={`${physicalGoalLabel(resolvedPhysicalAssessmentGoal)} (automático)`}
                                  disabled
                                />
                              </label>
                              <label className="patient-physical-notes">
                                <span>Observações</span>
                                <textarea
                                  value={physicalAssessmentForm.notes}
                                  onChange={(event) => changePhysicalAssessmentField("notes", event.target.value)}
                                  disabled={isPhysicalAssessmentReadOnly}
                                  placeholder="Observações clínicas (opcional)"
                                />
                              </label>
                            </div>
                          )}

                          {physicalAssessmentFormTab === "circ" && (
                            <div className="patient-physical-grid">
                              {CIRCUMFERENCE_FIELDS.map((field) => (
                                <label key={field.key}>
                                  <span>{field.label} (cm)</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={physicalAssessmentForm.circumferences[field.key] || ""}
                                    onChange={(event) =>
                                      changePhysicalAssessmentCircumference(field.key, event.target.value)
                                    }
                                    disabled={isPhysicalAssessmentReadOnly}
                                    placeholder="Opcional"
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          {physicalAssessmentFormTab === "dobras" && (
                            <div className="patient-physical-grid">
                              {SKINFOLD_FIELDS.map((field) => (
                                <label key={field.key}>
                                  <span>{field.label} (mm)</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={physicalAssessmentForm.skinfolds[field.key] || ""}
                                    onChange={(event) => changePhysicalAssessmentSkinfold(field.key, event.target.value)}
                                    disabled={isPhysicalAssessmentReadOnly}
                                    placeholder="2 a 60 mm (opcional)"
                                  />
                                </label>
                              ))}
                            </div>
                          )}

                          {physicalAssessmentFormTab === "resultado" && (
                            <div className="patient-physical-result-grid">
                              {!physicalAssessmentPreviewResult && (
                                <p className="patient-meal-empty">
                                  Preencha os dados básicos para visualizar BMR, TDEE e meta de macros.
                                </p>
                              )}
                              {!!physicalAssessmentPreviewResult && (
                                <>
                                  <div>
                                    <span>BMR</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.bmr)} kcal</strong>
                                  </div>
                                  <div>
                                    <span>TDEE</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.tdee)} kcal</strong>
                                  </div>
                                  <div>
                                    <span>Meta calórica</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.calorieTarget)} kcal</strong>
                                  </div>
                                  <div>
                                    <span>Proteína</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.proteinG)} g</strong>
                                  </div>
                                  <div>
                                    <span>Gordura</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.fatG)} g</strong>
                                  </div>
                                  <div>
                                    <span>Carboidrato</span>
                                    <strong>{formatDecimal(physicalAssessmentPreviewResult.carbsG)} g</strong>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {!isPhysicalAssessmentReadOnly && (
                            <div className="patient-weight-entry-actions">
                              <button type="submit" className="patient-action-btn" disabled={physicalAssessmentSubmitting}>
                                {physicalAssessmentSubmitting
                                  ? physicalAssessmentFormMode === "edit"
                                    ? "Atualizando..."
                                    : "Salvando..."
                                  : physicalAssessmentFormMode === "edit"
                                    ? "Atualizar avaliação"
                                    : "Salvar avaliação"}
                              </button>
                            </div>
                          )}
                        </form>
                      </section>
                    </div>
                  )}

                  {showWeightEntryModal && (
                    <div className="patient-meal-modal-backdrop" onClick={closeWeightEntryModal}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-weight-entry-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>{editingWeightEntryId ? "Editar progressao" : "Registrar progressao"}</h5>
                            <p className="patient-panel-hint">
                              {editingWeightEntryId
                                ? "Atualize a pesagem selecionada no grafico."
                                : "Insira apenas a nova pesagem para atualizar a evolucao."}
                            </p>
                          </div>
                          <button type="button" className="patient-action-btn ghost" onClick={closeWeightEntryModal}>
                            Fechar
                          </button>
                        </div>

                        <form className="patient-weight-entry-form" onSubmit={handleWeightEntrySubmit}>
                          <label>
                            <span>{editingWeightEntryId ? "Pesagem (kg)" : "Nova pesagem (kg)"}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={weightEntryForm.progressWeight}
                              onChange={(event) =>
                                setWeightEntryForm((prev) => ({ ...prev, progressWeight: event.target.value }))
                              }
                              placeholder="Ex.: 79,8"
                              required
                            />
                          </label>

                          <div className="patient-weight-entry-meta">
                            <span>Peso atual: {progressCurrent !== null ? `${formatDecimal(progressCurrent)} kg` : "--"}</span>
                            <span>Meta: {progressTarget !== null ? `${formatDecimal(progressTarget)} kg` : "--"}</span>
                          </div>

                          <div className="patient-weight-entry-actions">
                            <button
                              type="submit"
                              className="patient-action-btn"
                              disabled={!canRegisterWeightProgress || weightEntrySubmitting}
                            >
                              {weightEntrySubmitting
                                ? "Salvando..."
                                : editingWeightEntryId
                                  ? "Salvar alteracao"
                                  : "Salvar progressao"}
                            </button>
                            {isDevelopmentMode && hasEvolutionData && (
                              <button
                                type="button"
                                className="patient-action-btn subtle-danger"
                                onClick={clearPatientEvolutionData}
                              >
                                Remover dados de evolucao
                              </button>
                            )}
                          </div>
                        </form>
                      </section>
                    </div>
                  )}

                  {showTargetRefreshModal && (
                    <div className="patient-meal-modal-backdrop" onClick={() => setShowTargetRefreshModal(false)}>
                      <section
                        className="patient-profile-panel patient-meal-modal patient-target-refresh-modal"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="patient-meal-modal-head">
                          <div>
                            <h5>Meta atingida</h5>
                            <p className="patient-panel-hint">
                              O paciente atingiu a meta atual. Defina uma nova meta para continuar o acompanhamento.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="patient-action-btn ghost"
                            onClick={() => setShowTargetRefreshModal(false)}
                          >
                            Depois
                          </button>
                        </div>

                        <form className="patient-weight-entry-form" onSubmit={handleTargetRefreshSubmit}>
                          <label>
                            <span>Nova meta de peso (kg)</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={targetRefreshValue}
                              onChange={(event) => setTargetRefreshValue(event.target.value)}
                              placeholder="Ex.: 72,0"
                              required
                            />
                          </label>

                          <div className="patient-weight-entry-meta">
                            <span>Peso atual: {progressCurrent !== null ? `${formatDecimal(progressCurrent)} kg` : "--"}</span>
                            <span>Meta anterior: {progressTarget !== null ? `${formatDecimal(progressTarget)} kg` : "--"}</span>
                          </div>

                          <div className="patient-weight-entry-actions">
                            <button type="submit" className="patient-action-btn" disabled={targetRefreshSubmitting}>
                              {targetRefreshSubmitting ? "Salvando..." : "Salvar nova meta"}
                            </button>
                          </div>
                        </form>
                      </section>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {!loading && section === "dashboard" && (
            <>
              <section className="stats-grid">
                {cards.map((card) => (
                  <article className="stat-card" key={card.title}>
                    <div className={`stat-icon ${card.tone}`}>{card.title.slice(0, 2).toUpperCase()}</div>
                    <p className={`trend ${card.trend.className}`}>
                      {card.trend.arrow} {card.trend.label}
                    </p>
                    <h2>
                      {formatValue(card.value)}
                    </h2>
                    <span>{card.title}</span>
                  </article>
                ))}
              </section>

              <section className="main-grid">
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Pacientes Recentes</h3>
                      <p>Ultimas interacoes</p>
                    </div>
                    <button type="button" className="link">
                      Ver todos
                    </button>
                  </div>
                  <div className="patient-list">
                    {recentPatients.length === 0 && (
                      <div className="patient-row">
                        <div className="patient-start">
                          <div>
                            <strong>Nenhum paciente cadastrado</strong>
                            <p>Cadastre pacientes na aba "Pacientes".</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {recentPatients.map((patient) => (
                      <div className="patient-row" key={patient.id}>
                        <div className="patient-start">
                          <div className="avatar">{initials(patient.name)}</div>
                          <div>
                            <strong>{patient.name}</strong>
                            <p>{patient.goal}</p>
                          </div>
                        </div>
                        <div className="patient-end">
                          <strong>{formatDateTime(patient.createdAt)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel schedule">
                  <div className="panel-header">
                    <div>
                      <h3>Consultas do Dia</h3>
                      <p>{selectedDateLabel}</p>
                    </div>
                  </div>
                  <div className="mini-calendar">
                    <div className="mini-calendar-head">
                      <button
                        type="button"
                        className="calendar-nav"
                        onClick={() => setSelectedMonth((current) => addMonths(current, -1))}
                      >
                        &lt;
                      </button>
                      <strong>{formatMonthTitle(selectedMonth)}</strong>
                      <button
                        type="button"
                        className="calendar-nav"
                        onClick={() => setSelectedMonth((current) => addMonths(current, 1))}
                      >
                        &gt;
                      </button>
                    </div>
                    <div className="mini-calendar-weekdays">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((weekday, index) => (
                        <span key={`${weekday}-${index}`}>{weekday}</span>
                      ))}
                    </div>
                    <div className="mini-calendar-grid">
                      {calendarCells.map((cell) => (
                        <button
                          type="button"
                          key={cell.dateKey}
                          className={`calendar-day ${cell.inCurrentMonth ? "" : "muted"} ${
                            cell.isSelected ? "selected" : ""
                          } ${cell.isToday ? "today" : ""}`}
                          onClick={() => handleSelectDay(cell.dateKey)}
                        >
                          <span>{cell.dayLabel}</span>
                          {cell.count > 0 && <small>{cell.count}</small>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="schedule-list">
                    {scheduleLoading && (
                      <div className="schedule-row">
                        <div className="schedule-person">
                          <div>
                            <strong>Carregando consultas...</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    {!scheduleLoading && consultations.length === 0 && (
                      <div className="schedule-row">
                        <div className="schedule-person">
                          <div>
                            <strong>Nenhuma consulta para este dia</strong>
                            <p>Clique em "Agendar nova consulta" para adicionar.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!scheduleLoading &&
                      consultations.map((item) => (
                      <div className="schedule-row" key={item.id}>
                        <div className="schedule-person">
                          <div>
                            <strong>{item.patientName || "Paciente nao informado"}</strong>
                            <p>{item.type || "Consulta"}</p>
                          </div>
                        </div>
                        <strong className="time">{formatTime(item.scheduledAt)}</strong>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="new-btn" onClick={() => setShowConsultationForm(true)}>
                    Agendar nova consulta
                  </button>
                  {showConsultationForm && (
                    <div
                      className="schedule-sheet-backdrop"
                      onClick={() => {
                        if (!consultationSubmitting) setShowConsultationForm(false);
                      }}
                    >
                      <div className="schedule-sheet" onClick={(event) => event.stopPropagation()}>
                        <div className="schedule-sheet-header">
                          <h3>Agendar Consulta</h3>
                          <button
                            type="button"
                            className="sheet-close"
                            onClick={() => setShowConsultationForm(false)}
                            disabled={consultationSubmitting}
                          >
                            Fechar
                          </button>
                        </div>
                        <form className="consultation-form consultation-form-sheet" onSubmit={handleConsultationSubmit}>
                          <select
                            value={consultationForm.patientId}
                            onChange={(event) =>
                              setConsultationForm((prev) => ({ ...prev, patientId: event.target.value }))
                            }
                            disabled={consultationSubmitting}
                          >
                            <option value="">Paciente (opcional)</option>
                            {patients.map((patient) => (
                              <option value={patient.id} key={patient.id}>
                                {patient.name}
                              </option>
                            ))}
                          </select>
                          <input
                            value={consultationForm.type}
                            onChange={(event) =>
                              setConsultationForm((prev) => ({ ...prev, type: event.target.value }))
                            }
                            placeholder="Tipo (ex.: Retorno)"
                            required
                            disabled={consultationSubmitting}
                          />
                          <input
                            type="text"
                            value={consultationForm.date}
                            onChange={(event) =>
                              setConsultationForm((prev) => ({
                                ...prev,
                                date: normalizeBrDateInput(event.target.value),
                              }))
                            }
                            placeholder="dd/mm/aaaa"
                            inputMode="numeric"
                            maxLength={10}
                            required
                            disabled={consultationSubmitting}
                          />
                          <input
                            type="text"
                            value={consultationForm.time}
                            onChange={(event) =>
                              setConsultationForm((prev) => ({
                                ...prev,
                                time: normalizeHourInput(event.target.value),
                              }))
                            }
                            placeholder="HH:mm"
                            inputMode="numeric"
                            maxLength={5}
                            required
                            disabled={consultationSubmitting}
                          />
                          <input
                            value={consultationForm.notes}
                            onChange={(event) =>
                              setConsultationForm((prev) => ({ ...prev, notes: event.target.value }))
                            }
                            placeholder="Observacoes (opcional)"
                            disabled={consultationSubmitting}
                          />
                          <button type="submit" disabled={consultationSubmitting}>
                            {consultationSubmitting ? "Salvando..." : "Salvar consulta"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </article>
              </section>
            </>
          )}

          {!loading && !isPatientProfileRoute && (section === "patients" || isPatientsRoute) && (
            <section className="panel management">
              <div className="panel-header">
                <h3>Cadastro de Pacientes</h3>
              </div>
              <form className="form-grid" onSubmit={handlePatientSubmit}>
                <input
                  placeholder="Nome"
                  required
                  value={patientForm.name}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Idade"
                  value={patientForm.age}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, age: event.target.value }))}
                />
                <input
                  placeholder="Objetivo"
                  value={patientForm.goal}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, goal: event.target.value }))}
                />
                <input
                  placeholder="Telefone"
                  value={patientForm.phone}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={patientForm.email}
                  onChange={(event) => setPatientForm((prev) => ({ ...prev, email: event.target.value }))}
                />
                <button type="submit" disabled={patientSubmitting}>
                  {patientSubmitting ? "Salvando..." : "Adicionar paciente"}
                </button>
              </form>

              <div className="patients-catalog-controls">
                <label className="patients-search-input">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.6" />
                    <path d="M16.1 16.1L20 20" />
                  </svg>
                  <input
                    placeholder="Buscar paciente..."
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                  />
                </label>
                <label className="patients-filter-input">
                  <span>Filtro</span>
                  <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}>
                    <option>Todos</option>
                    <option>Com objetivo</option>
                    <option>Sem objetivo</option>
                    <option>Com email</option>
                    <option>Sem email</option>
                    <option>Com telefone</option>
                    <option>Sem telefone</option>
                  </select>
                </label>
              </div>

              <div className="patients-grid">
                {patients.length === 0 && (
                  <div className="patients-empty">
                    <strong>Nenhum paciente cadastrado.</strong>
                    <p>Use o formulario acima para adicionar o primeiro paciente.</p>
                  </div>
                )}
                {patients.length > 0 && filteredPatients.length === 0 && (
                  <div className="patients-empty">
                    <strong>Nenhum paciente encontrado.</strong>
                    <p>Ajuste sua busca ou altere o filtro selecionado.</p>
                  </div>
                )}
                {filteredPatients.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="patient-card"
                    onClick={() => openPatientProfile(item.id)}
                  >
                    <div className="patient-card-header">
                      <div className="patient-card-avatar">{initials(item.name)}</div>
                      <div className="patient-card-main">
                        <strong title={item.name}>{formatPatientCardName(item.name)}</strong>
                        <p className={`patient-card-goal ${item.goal ? "" : "is-empty"}`}>
                          {item.goal || "Sem objetivo definido"}
                        </p>
                      </div>
                    </div>
                    <div className="patient-card-meta">
                      <span className="patient-card-meta-row">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="8" r="3.3" />
                          <path d="M 5.3 19.2 C 6.3 15.9 8.9 14.2 12 14.2 C 15.1 14.2 17.7 15.9 18.7 19.2" />
                        </svg>
                        {item.age ? `${item.age} anos` : "Idade nao informada"}
                      </span>
                      <span className="patient-card-meta-row">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="3.3" y="5.4" width="17.4" height="13.2" rx="2.3" />
                          <path d="M 4.8 7.2 L 12 12.6 L 19.2 7.2" />
                        </svg>
                        {item.email || "Email nao informado"}
                      </span>
                      <span className="patient-card-meta-row">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M 6.2 4.8 C 6.8 4.2 7.6 4.4 8.2 4.9 L 10.1 6.8 C 10.6 7.3 10.8 8.1 10.2 8.8 L 9.3 9.9 C 9 10.2 8.9 10.7 9.1 11 C 10 12.7 11.4 14 13.1 14.9 C 13.4 15.1 13.9 15 14.2 14.7 L 15.3 13.8 C 16 13.2 16.8 13.4 17.3 13.9 L 19.2 15.8 C 19.8 16.4 20 17.2 19.3 17.8 C 18.4 18.8 17.2 19.2 15.9 18.8 C 11.2 17.5 6.5 12.8 5.2 8.1 C 4.8 6.8 5.2 5.6 6.2 4.8 Z" />
                        </svg>
                        {item.phone || "Telefone nao informado"}
                      </span>
                    </div>
                    <div className="patient-card-footer">
                      <span>Ver perfil</span>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M 5 12 H 19" />
                        <path d="M 13 6 L 19 12 L 13 18" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!loading && section === "foods" && (
            <section className="panel management foods-management">
              <div className="panel-header">
                <h3>Base de Alimentos e Calorias</h3>
                <div className="foods-toolbar">
                  <button type="button" className="toolbar-btn" onClick={downloadFoodTemplate}>
                    Baixar planilha modelo
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => foodImportInputRef.current?.click()}
                  >
                    Importar alimentos em massa
                  </button>
                  <input
                    ref={foodImportInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden-file-input"
                    onChange={handleImportFoodsFile}
                  />
                </div>
              </div>
              {foodImportFeedback && (
                <div className={`import-feedback ${foodImportFeedback.type}`}>
                  {foodImportFeedback.text}
                </div>
              )}
              <div className="foods-controls">
                <label className="foods-search-input">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.6" />
                    <path d="M16.1 16.1L20 20" />
                  </svg>
                  <input
                    placeholder="Buscar alimento..."
                    value={foodSearch}
                    onChange={(event) => setFoodSearch(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="foods-primary-btn"
                  onClick={() => setShowFoodForm((prev) => !prev)}
                >
                  {showFoodForm ? "Fechar formulario" : "+ Novo alimento"}
                </button>
              </div>

              <div className="foods-filters">
                {["Todos", ...FOOD_CATEGORIES].map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`food-filter-chip ${selectedFoodCategory === category ? "active" : ""}`}
                    onClick={() => setSelectedFoodCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {showFoodForm && (
                <form className="form-grid food-form-grid" onSubmit={handleFoodSubmit}>
                  <div className="food-field">
                    <label htmlFor="food-name">Nome do alimento</label>
                    <input
                      id="food-name"
                      placeholder="Ex: Aveia em flocos"
                      required
                      value={foodForm.name}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-category">Categoria</label>
                    <select
                      id="food-category"
                      value={foodForm.category}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, category: event.target.value }))}
                      required
                    >
                      {FOOD_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-basis">Base de calculo</label>
                    <select
                      id="food-basis"
                      value={foodForm.measurementBasis}
                      onChange={(event) =>
                        setFoodForm((prev) => ({ ...prev, measurementBasis: event.target.value }))
                      }
                      required
                    >
                      <option value="100g">Por 100g</option>
                      <option value="100ml">Por 100ml</option>
                      <option value="unidade">Por unidade</option>
                    </select>
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-calories">Calorias (kcal)</label>
                    <input
                      id="food-calories"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 389"
                      required
                      value={foodForm.calories}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, calories: event.target.value }))}
                    />
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-protein">Proteinas (g)</label>
                    <input
                      id="food-protein"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 16.9"
                      required
                      value={foodForm.protein}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, protein: event.target.value }))}
                    />
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-carbs">Carboidratos (g)</label>
                    <input
                      id="food-carbs"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 66.3"
                      required
                      value={foodForm.carbs}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, carbs: event.target.value }))}
                    />
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-fat">Gorduras (g)</label>
                    <input
                      id="food-fat"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 6.9"
                      required
                      value={foodForm.fat}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, fat: event.target.value }))}
                    />
                  </div>
                  <div className="food-field">
                    <label htmlFor="food-fiber">Fibras (g)</label>
                    <input
                      id="food-fiber"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Ex: 10.6"
                      required
                      value={foodForm.fiber}
                      onChange={(event) => setFoodForm((prev) => ({ ...prev, fiber: event.target.value }))}
                    />
                  </div>
                  <button type="submit" disabled={foodSubmitting}>
                    {foodSubmitting ? "Salvando..." : "Salvar alimento"}
                  </button>
                </form>
              )}

              <div className="foods-table-wrap">
                <table className="foods-table">
                  <thead>
                    <tr>
                      <th>Alimento</th>
                      <th>Categoria</th>
                      <th>Kcal</th>
                      <th>Prot.</th>
                      <th>Carb.</th>
                      <th>Gord.</th>
                      <th>Fibras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoods.length === 0 && (
                      <tr>
                        <td colSpan={7} className="foods-empty-row">
                          Nenhum alimento encontrado para o filtro atual.
                        </td>
                      </tr>
                    )}
                    {filteredFoods.map((item) => {
                      const category = normalizeFoodCategory(item.category);
                      return (
                        <tr key={item.id}>
                          <td className="food-name-cell">
                            <div className="food-name-wrap">
                              <div>
                                <strong>{item.name}</strong>
                                <span>{measurementBasisLabel(item.measurementBasis)}</span>
                              </div>
                              <div className="food-row-hover-actions">
                                <button
                                  type="button"
                                  className="food-icon-btn"
                                  aria-label={`Editar ${item.name}`}
                                  onClick={() => editFood(item)}
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                                    <path d="m13.8 6.2 4 4" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="food-icon-btn danger"
                                  aria-label={`Remover ${item.name}`}
                                  onClick={() => removeFood(item.id)}
                                >
                                  <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M5 7h14" />
                                    <path d="M9 7V5h6v2" />
                                    <path d="M8 7v12h8V7" />
                                    <path d="M10 11v5M14 11v5" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`food-category-tag ${foodCategoryTone(category)}`}>
                              {category}
                            </span>
                          </td>
                          <td className="kcal-cell">{formatDecimal(item.calories)}</td>
                          <td className="protein-cell">{formatDecimal(item.protein)}g</td>
                          <td className="carb-cell">{formatDecimal(item.carbs)}g</td>
                          <td className="fat-cell">{formatDecimal(item.fat)}g</td>
                          <td className="fiber-cell">{formatDecimal(item.fiber)}g</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {editingFoodId && (
                <div
                  className="food-edit-backdrop"
                  role="dialog"
                  aria-modal="true"
                  onClick={(event) => {
                    if (event.target === event.currentTarget) closeFoodEditor();
                  }}
                >
                  <section className="food-edit-modal">
                    <div className="food-edit-header">
                      <h4>Editar alimento</h4>
                      <button type="button" onClick={closeFoodEditor} disabled={foodEditSubmitting}>
                        Fechar
                      </button>
                    </div>
                    <form className="form-grid food-edit-grid" onSubmit={handleFoodEditSubmit}>
                      <div className="food-field">
                        <label htmlFor="edit-food-name">Nome do alimento</label>
                        <input
                          id="edit-food-name"
                          placeholder="Ex: Aveia em flocos"
                          required
                          value={editFoodForm.name}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-category">Categoria</label>
                        <select
                          id="edit-food-category"
                          value={editFoodForm.category}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, category: event.target.value }))
                          }
                          required
                        >
                          {FOOD_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-basis">Base de calculo</label>
                        <select
                          id="edit-food-basis"
                          value={editFoodForm.measurementBasis}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, measurementBasis: event.target.value }))
                          }
                          required
                        >
                          <option value="100g">Por 100g</option>
                          <option value="100ml">Por 100ml</option>
                          <option value="unidade">Por unidade</option>
                        </select>
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-calories">Calorias (kcal)</label>
                        <input
                          id="edit-food-calories"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex: 389"
                          required
                          value={editFoodForm.calories}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, calories: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-protein">Proteinas (g)</label>
                        <input
                          id="edit-food-protein"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex: 16.9"
                          required
                          value={editFoodForm.protein}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, protein: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-carbs">Carboidratos (g)</label>
                        <input
                          id="edit-food-carbs"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex: 66.3"
                          required
                          value={editFoodForm.carbs}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, carbs: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-fat">Gorduras (g)</label>
                        <input
                          id="edit-food-fat"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex: 6.9"
                          required
                          value={editFoodForm.fat}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, fat: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-field">
                        <label htmlFor="edit-food-fiber">Fibras (g)</label>
                        <input
                          id="edit-food-fiber"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="Ex: 10.6"
                          required
                          value={editFoodForm.fiber}
                          onChange={(event) =>
                            setEditFoodForm((prev) => ({ ...prev, fiber: event.target.value }))
                          }
                        />
                      </div>
                      <div className="food-edit-actions">
                        <button type="button" className="ghost" onClick={closeFoodEditor} disabled={foodEditSubmitting}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={foodEditSubmitting}>
                          {foodEditSubmitting ? "Salvando..." : "Salvar alteracoes"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              )}
            </section>
          )}

          {!loading && (section === "exercises" || section === "reports") && (
            <section className="panel">
              <div className="panel-header">
                <h3>{section === "exercises" ? "Area de Exercicios" : "Area de Relatorios"}</h3>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <p>Tela em construcao para manter o layout completo do dashboard.</p>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}


