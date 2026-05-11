export const CREATE_ENTRY_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const CREATE_ENTRY_ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;
export const CREATE_ENTRY_ALLOWED_COLORS = [
  "Black",
  "White",
  "Silver",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Other",
] as const;

const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/gu;
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu;
const HTML_ENTITY_REGEX = /&(#x?[0-9a-f]+|[a-z]+);/giu;
const DANGEROUS_MARKUP_REGEX =
  /<[^>]*>|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html|srcdoc\s*=|on[a-z]+\s*=|<\s*(script|iframe|object|embed|svg|math|img|style|link|meta)\b/iu;

export type CreateEntryField = "title" | "description" | "zone" | "hiddenNote" | "category" | "color" | "image";

export type CreateEntryErrors = Partial<Record<CreateEntryField, string>>;

export type CreateEntryInput = {
  entryType: "lost" | "found";
  selectedCategory: number | null;
  selectedColor: string | null;
  title: string;
  description: string;
  zone: string;
  hiddenNote: string;
  imageUrl?: string | null;
};

export type SanitizedCreateEntryInput = {
  entryType: "lost" | "found";
  selectedCategory: number;
  selectedColor: (typeof CREATE_ENTRY_ALLOWED_COLORS)[number];
  title: string;
  description: string;
  zone: string;
  hiddenNote: string;
  imageUrl: string | null;
};

type CreateEntryValidationOptions = {
  requireImage?: boolean;
};

type NormalizeOptions = {
  multiline?: boolean;
};

type ValidationResult =
  | {
      ok: true;
      data: SanitizedCreateEntryInput;
      errors: CreateEntryErrors;
    }
  | {
      ok: false;
      errors: CreateEntryErrors;
    };

export function getCreateEntryErrorMessage(errors: CreateEntryErrors) {
  return Object.values(errors).find(Boolean) ?? "Please review the highlighted fields and try again.";
}

export function normalizeCreateEntryText(value: string, options: NormalizeOptions = {}) {
  const normalizedLineEndings = value.replace(/\r\n?/g, "\n");
  const withoutUnsafeCharacters = normalizedLineEndings
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(CONTROL_CHAR_REGEX, "");

  if (options.multiline) {
    return withoutUnsafeCharacters
      .replace(/[^\S\n]+/gu, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return withoutUnsafeCharacters.replace(/\s+/gu, " ").trim();
}

export function validateCreateEntryInput(
  input: CreateEntryInput,
  options: CreateEntryValidationOptions = {}
): ValidationResult {
  const errors: CreateEntryErrors = {};
  const requireImage = options.requireImage ?? true;

  if (!Number.isInteger(input.selectedCategory) || (input.selectedCategory ?? 0) <= 0) {
    errors.category = "Choose a category before posting your entry.";
  }

  if (!input.selectedColor || !isAllowedColor(input.selectedColor)) {
    errors.color = "Select the item's primary color.";
  }

  const title = validateTextField("title", input.title, {
    label: "Title",
    maxLength: 120,
  });
  if (!title.ok) {
    errors.title = title.error;
  }

  const zone = validateTextField("zone", input.zone, {
    label: "Location",
    maxLength: 120,
  });
  if (!zone.ok) {
    errors.zone = zone.error;
  }

  const description = validateTextField("description", input.description, {
    label: "Description",
    maxLength: 1200,
    multiline: true,
  });
  if (!description.ok) {
    errors.description = description.error;
  }

  const hiddenNote = validateTextField("hiddenNote", input.hiddenNote, {
    label: "Hidden note",
    maxLength: 600,
    multiline: true,
    required: false,
  });
  if (!hiddenNote.ok) {
    errors.hiddenNote = hiddenNote.error;
  }

  const imageUrl = validateImageUrl(input.imageUrl, requireImage);
  if (!imageUrl.ok) {
    errors.image = imageUrl.error;
  }

  if (Object.keys(errors).length > 0 || !title.ok || !zone.ok || !description.ok || !hiddenNote.ok || !imageUrl.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      entryType: input.entryType === "found" ? "found" : "lost",
      selectedCategory: input.selectedCategory!,
      selectedColor: input.selectedColor as (typeof CREATE_ENTRY_ALLOWED_COLORS)[number],
      title: title.value,
      description: description.value,
      zone: zone.value,
      hiddenNote: hiddenNote.value,
      imageUrl: imageUrl.value,
    },
    errors,
  };
}

type TextValidationOptions = {
  label: string;
  maxLength: number;
  multiline?: boolean;
  required?: boolean;
};

function validateTextField(field: CreateEntryField, rawValue: string, options: TextValidationOptions) {
  const normalizedValue = normalizeCreateEntryText(rawValue, {
    multiline: options.multiline,
  });
  const isRequired = options.required ?? true;

  if (!normalizedValue) {
    if (isRequired) {
      return { ok: false as const, error: `${options.label} cannot be empty or contain only whitespace.` };
    }

    return { ok: true as const, value: "" };
  }

  if (normalizedValue.length > options.maxLength) {
    return {
      ok: false as const,
      error: `${options.label} must be ${options.maxLength} characters or fewer.`,
    };
  }

  if (containsBlockedContent(rawValue) || containsBlockedContent(normalizedValue)) {
    return {
      ok: false as const,
      error: `${options.label} contains blocked HTML or script content. Please remove it and try again.`,
    };
  }

  if (field === "title" && normalizedValue.length < 3) {
    return {
      ok: false as const,
      error: "Title must be at least 3 characters long after trimming.",
    };
  }

  return { ok: true as const, value: normalizedValue };
}

function validateImageUrl(imageUrl?: string | null, required = true) {
  if (!imageUrl) {
    if (required) {
      return {
        ok: false as const,
        error: "Upload at least one image before posting your entry.",
      };
    }

    return { ok: true as const, value: null };
  }

  try {
    const parsed = new URL(imageUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        ok: false as const,
        error: "The uploaded image URL is invalid. Please upload the file again.",
      };
    }

    return { ok: true as const, value: imageUrl };
  } catch {
    return {
      ok: false as const,
      error: "The uploaded image URL is invalid. Please upload the file again.",
    };
  }
}

function containsBlockedContent(value: string) {
  if (!value) {
    return false;
  }

  if (value.includes("<") || value.includes(">")) {
    return true;
  }

  const decoded = decodePotentialPayload(value);
  return DANGEROUS_MARKUP_REGEX.test(decoded) || decoded.includes("<") || decoded.includes(">");
}

function decodePotentialPayload(value: string) {
  let decoded = value;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const htmlDecoded = decodeHtmlEntities(decoded);
    let uriDecoded = htmlDecoded;

    try {
      uriDecoded = decodeURIComponent(htmlDecoded);
    } catch {
      uriDecoded = htmlDecoded;
    }

    if (uriDecoded === decoded) {
      break;
    }

    decoded = uriDecoded;
  }

  return decoded.toLowerCase();
}

function decodeHtmlEntities(value: string) {
  return value.replace(HTML_ENTITY_REGEX, (_, entity: string) => {
    const lowered = entity.toLowerCase();

    if (lowered === "lt") return "<";
    if (lowered === "gt") return ">";
    if (lowered === "amp") return "&";
    if (lowered === "quot") return '"';
    if (lowered === "apos") return "'";

    if (lowered.startsWith("#x")) {
      const codePoint = Number.parseInt(lowered.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
    }

    if (lowered.startsWith("#")) {
      const codePoint = Number.parseInt(lowered.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
    }

    return `&${entity};`;
  });
}

function isAllowedColor(color: string): color is (typeof CREATE_ENTRY_ALLOWED_COLORS)[number] {
  return CREATE_ENTRY_ALLOWED_COLORS.includes(color as (typeof CREATE_ENTRY_ALLOWED_COLORS)[number]);
}
