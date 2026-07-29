// small hand-rolled validation helpers — kept dependency-free on purpose
// (express-validator would add a whole middleware-chain pattern across
// every route file for what is really a handful of plain checks here)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const isValidEmail = (value) =>
    typeof value === "string" && EMAIL_RE.test(value);

export const isNonEmptyString = (value, { max = 1000 } = {}) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= max;

export const isValidObjectId = (value) =>
    typeof value === "string" && OBJECT_ID_RE.test(value);
