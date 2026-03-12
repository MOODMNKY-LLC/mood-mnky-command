/**
 * JotForm API client. Server-only.
 * Uses fetch with APIKEY header.
 */

import { getJotformBaseUrl, getJotformApiKey } from "./config"
import type { FormQuestion, CreateFormPayload } from "./types"

export class JotformError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = "JotformError"
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getJotformBaseUrl()
  const apiKey = getJotformApiKey()
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`

  const headers: Record<string, string> = {
    APIKEY: apiKey,
    ...(options.headers as Record<string, string>),
  }
  if (
    (options.method === "POST" || options.method === "PUT") &&
    options.body &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/x-www-form-urlencoded"
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const data = (await res.json().catch(() => ({}))) as {
    responseCode?: number
    message?: string
    content?: unknown
  }

  if (!res.ok) {
    const msg =
      data?.message || `JotForm API error: ${res.status} ${res.statusText}`
    throw new JotformError(msg, res.status, String(data?.responseCode ?? ""))
  }

  if (data?.responseCode === 401) {
    throw new JotformError("JotForm API key invalid or expired", 401, "401")
  }

  if (data?.responseCode === 429) {
    throw new JotformError(
      "JotForm API rate limit exceeded. Try again later.",
      429,
      "429"
    )
  }

  return (data?.content ?? data) as T
}

export interface JotformForm {
  id: string
  username: string
  title: string
  height: string
  status: string
  created_at: string
  updated_at: string
  last_submission_date: string
  new: string
  count: string
  type: string
  favorite: string
  archived: string
  url: string
}

export interface JotformQuestion {
  id: string
  type: string
  text: string
  order: string
  name?: string
  [key: string]: unknown
}

export interface JotformSubmission {
  id: string
  form_id: string
  ip: string
  created_at: string
  status: string
  new: string
  flag: string
  notes: string
  updated_at: string
  answers?: Record<string, { text?: string; answer?: string }>
}

export interface JotformWebhook {
  id: string
  webhookURL: string
}

/**
 * Get form details.
 */
export async function getForm(formId: string): Promise<JotformForm | null> {
  const data = await request<JotformForm | { id: string }>(`/form/${formId}`)
  if (data && typeof data === "object" && "title" in data) return data as JotformForm
  return null
}

/**
 * Get form questions (for mapping question IDs to keys).
 */
export async function getQuestions(
  formId: string
): Promise<Record<string, JotformQuestion>> {
  const data = await request<Record<string, JotformQuestion>>(
    `/form/${formId}/questions`
  )
  return (data && typeof data === "object") ? data : {}
}

/**
 * Get form submissions with optional filters.
 */
export async function getSubmissions(
  formId: string,
  params?: { offset?: number; limit?: number; filter?: Record<string, string> }
): Promise<JotformSubmission[]> {
  const search = new URLSearchParams()
  if (params?.offset != null) search.set("offset", String(params.offset))
  if (params?.limit != null) search.set("limit", String(params.limit))
  if (params?.filter) {
    Object.entries(params.filter).forEach(([k, v]) => search.set(k, v))
  }
  const qs = search.toString()
  const path = `/form/${formId}/submissions${qs ? `?${qs}` : ""}`
  const data = await request<JotformSubmission[] | { id: string }[]>(path)
  return Array.isArray(data) ? data : []
}

/**
 * Register a webhook for a form. Returns webhook ID.
 * JotForm uses /v1/form/... for webhooks.
 */
export async function createWebhook(
  formId: string,
  webhookUrl: string
): Promise<string> {
  const body = new URLSearchParams()
  body.set("webhookURL", webhookUrl)
  const data = await request<{ id: string }>(`/form/${formId}/webhooks`, {
    method: "POST",
    body: body.toString(),
  })
  return (data && typeof data === "object" && "id" in data) ? String(data.id) : ""
}

/**
 * Delete a webhook.
 */
export async function deleteWebhook(
  formId: string,
  webhookId: string
): Promise<void> {
  await request(`/form/${formId}/webhooks/${webhookId}`, {
    method: "DELETE",
  })
}

/**
 * Simple health check (GET user).
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await request<{ username: string }>("/user")
    return true
  } catch {
    return false
  }
}

const TYPE_TO_CONTROL: Record<string, string> = {
  text: "control_textbox",
  textarea: "control_textarea",
  dropdown: "control_dropdown",
  radio: "control_radio",
  checkbox: "control_checkbox",
  hidden: "control_hidden",
  header: "control_head",
}

function toJotformType(t: string): string {
  return TYPE_TO_CONTROL[t] ?? "control_textbox"
}

function buildQuestionParams(
  q: FormQuestion,
  index: number
): Record<string, string> {
  const prefix = `questions[${index}]`
  const type = toJotformType(q.type)
  const params: Record<string, string> = {
    [`${prefix}[type]`]: type,
    [`${prefix}[text]`]: q.text,
    [`${prefix}[order]`]: String(q.order),
  }
  if (q.name) params[`${prefix}[name]`] = q.name
  if (q.required) params[`${prefix}[required]`] = "Yes"
  if (q.options && q.options.length > 0) {
    params[`${prefix}[options]`] = q.options.join("\n")
  }
  return params
}

/**
 * Create a new form in JotForm. Returns the new form ID.
 * Uses application/x-www-form-urlencoded per JotForm API conventions.
 */
export async function createForm(payload: CreateFormPayload): Promise<string> {
  const body = new URLSearchParams()
  body.set("properties[title]", payload.properties.title)
  if (payload.properties.height != null) {
    body.set("properties[height]", String(payload.properties.height))
  }
  payload.questions.forEach((q, i) => {
    Object.entries(buildQuestionParams(q, i)).forEach(([k, v]) => {
      body.set(k, v)
    })
  })
  const data = await request<{ id: string }>("/form", {
    method: "POST",
    body: body.toString(),
  })
  return (data && typeof data === "object" && "id" in data)
    ? String(data.id)
    : ""
}

/**
 * Add a question to an existing form.
 * Uses PUT /form/{id}/questions with form-urlencoded body.
 */
export async function addQuestion(
  formId: string,
  question: FormQuestion
): Promise<string> {
  const body = new URLSearchParams()
  body.set("question[type]", toJotformType(question.type))
  body.set("question[text]", question.text)
  body.set("question[order]", String(question.order))
  if (question.name) body.set("question[name]", question.name)
  if (question.required) body.set("question[required]", "Yes")
  if (question.options && question.options.length > 0) {
    body.set("question[options]", question.options.join("\n"))
  }
  const data = await request<{ id: string; qid?: string }>(
    `/form/${formId}/questions`,
    {
      method: "PUT",
      body: body.toString(),
    }
  )
  return (data?.qid ?? data?.id ?? "") as string
}

/**
 * Update an existing question.
 * Uses POST /form/{id}/question/{questionId}.
 */
export async function updateQuestion(
  formId: string,
  questionId: string,
  question: Partial<FormQuestion>
): Promise<void> {
  const body = new URLSearchParams()
  if (question.type) body.set("question[type]", toJotformType(question.type))
  if (question.text) body.set("question[text]", question.text)
  if (question.order != null) body.set("question[order]", String(question.order))
  if (question.name) body.set("question[name]", question.name)
  if (question.required != null)
    body.set("question[required]", question.required ? "Yes" : "No")
  if (question.options && question.options.length > 0) {
    body.set("question[options]", question.options.join("\n"))
  }
  await request(`/form/${formId}/question/${questionId}`, {
    method: "POST",
    body: body.toString(),
  })
}
