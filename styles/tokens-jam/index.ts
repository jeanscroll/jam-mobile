// src/tokens/index.ts
import { colors } from "./tokens-colors";
import { typography } from "./tokens-typography";
import { spacing } from "./tokens-spacing";

export const tokens = [...colors, ...typography, ...spacing]; // Combine tous les tokens
