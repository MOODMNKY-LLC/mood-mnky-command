import type { Formula } from "@/lib/types"
import { FORMULA_CATEGORY_LABELS } from "@/lib/types"

/**
 * Build inline-CSS HTML for a formula card, suitable for Adobe PDF Services HTML-to-PDF.
 */
export function formulaToHtml(formula: Formula): string {
  const categoryLabel = formula.categoryId
    ? FORMULA_CATEGORY_LABELS[formula.categoryId]
    : "Formula"
  const totalWeight = formula.totalWeight ?? 100

  const phasesHtml = formula.phases
    .map(
      (phase) => `
    <div class="phase">
      <h3 class="phase-name">${escapeHtml(phase.name)}</h3>
      <table class="ingredients">
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Function</th>
            <th>%</th>
            <th>Amount (g)</th>
          </tr>
        </thead>
        <tbody>
          ${phase.ingredients
            .map(
              (i) => `
            <tr>
              <td>${escapeHtml(i.name)}</td>
              <td>${escapeHtml(i.function)}</td>
              <td class="num">${i.percentage.toFixed(1)}%</td>
              <td class="num">${((i.percentage / 100) * totalWeight).toFixed(1)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(formula.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 12px; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 8px 0; }
    .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
    .description { margin-bottom: 24px; }
    .phase { margin-bottom: 24px; }
    .phase-name { font-size: 14px; margin: 0 0 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
    .num { text-align: right; }
    .tags { margin-top: 16px; font-size: 11px; color: #666; }
  </style>
</head>
<body>
  <h1>${escapeHtml(formula.name)}</h1>
  <div class="meta">${escapeHtml(categoryLabel)} · Batch: ${totalWeight}g</div>
  ${formula.description ? `<div class="description">${escapeHtml(formula.description)}</div>` : ""}
  ${phasesHtml}
  ${formula.tags?.length ? `<div class="tags">${formula.tags.map((t) => escapeHtml(t)).join(", ")}</div>` : ""}
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
