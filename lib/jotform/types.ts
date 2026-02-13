/**
 * Internal form schema for MOOD MNKY form builder.
 * Maps to JotForm control_* types.
 */

export type FormQuestionType =
  | "text"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "hidden"
  | "header"

export type SemanticKey =
  | "product_type"
  | "fragrance_hints"
  | "target_mood"
  | "experience_level"
  | "preferred_notes"
  | "blend_style"
  | "run_id"
  | "user_id"

export interface FormQuestion {
  type: FormQuestionType
  text: string
  order: number
  name?: string
  required?: boolean
  options?: string[]
  semanticKey?: SemanticKey | string
}

export interface CreateFormPayload {
  properties: {
    title: string
    height?: number
  }
  questions: FormQuestion[]
}
