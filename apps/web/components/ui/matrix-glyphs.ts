/**
 * 7×5 LED matrix letter glyphs for brand text (MOOD, MNKY, MOOD MNKY).
 * Same row/col convention as matrix.tsx digits: 7 rows, 5 cols per character.
 */

import type { Frame } from "@/components/ui/matrix"

const ROWS = 7
const COLS = 5

function emptyFrame(rows: number, cols: number): Frame {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

/** Single 7×5 glyphs for M, O, D, N, K, Y */
export const letterM: Frame = [
  [1, 0, 0, 0, 1],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
]

export const letterO: Frame = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
]

export const letterD: Frame = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
]

export const letterN: Frame = [
  [1, 0, 0, 0, 1],
  [1, 1, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
]

export const letterK: Frame = [
  [1, 0, 0, 0, 1],
  [1, 0, 0, 1, 0],
  [1, 0, 1, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 0, 1, 0, 0],
  [1, 0, 0, 1, 0],
  [1, 0, 0, 0, 1],
]

export const letterY: Frame = [
  [1, 0, 0, 0, 1],
  [0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
]

export const letterT: Frame = [
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
]

export const letterA: Frame = [
  [0, 0, 1, 0, 0],
  [0, 1, 0, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
]

export const letterL: Frame = [
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
]

/** Space between letters: 1 column; between words: 2 columns */
const spaceLetter: Frame = emptyFrame(ROWS, 1)
const spaceWord: Frame = emptyFrame(ROWS, 2)

/**
 * Concatenate glyphs horizontally with a single-column gap between characters.
 * Each glyph is 7×5.
 */
function concatGlyphs(glyphs: Frame[], gapCols: number = 1): Frame {
  const rows = ROWS
  const cols = glyphs.length * COLS + (glyphs.length - 1) * gapCols
  const frame = emptyFrame(rows, cols)
  for (let r = 0; r < rows; r++) {
    let c = 0
    for (let g = 0; g < glyphs.length; g++) {
      const glyph = glyphs[g]
      for (let col = 0; col < glyph[0].length; col++) {
        frame[r][c] = glyph[r][col]
        c++
      }
      if (g < glyphs.length - 1) {
        for (let k = 0; k < gapCols; k++) {
          c++
        }
      }
    }
  }
  return frame
}

/** MOOD = M + O + O + D */
export const patternMOOD: Frame = concatGlyphs(
  [letterM, letterO, letterO, letterD]
)

/** MNKY = M + N + K + Y */
export const patternMNKY: Frame = concatGlyphs(
  [letterM, letterN, letterK, letterY]
)

/** MOOD MNKY = MOOD + space + MNKY (2-col space between words) */
export const patternMOODMNKY: Frame = (() => {
  const mood = patternMOOD
  const mnky = patternMNKY
  const rows = ROWS
  const cols = mood[0].length + 2 + mnky[0].length
  const frame = emptyFrame(rows, cols)
  for (let r = 0; r < rows; r++) {
    let c = 0
    for (let i = 0; i < mood[r].length; i++) {
      frame[r][c] = mood[r][i]
      c++
    }
    c += 2
    for (let i = 0; i < mnky[r].length; i++) {
      frame[r][c] = mnky[r][i]
      c++
    }
  }
  return frame
})()

/**
 * Build a horizontal strip from words: 1-col gap between letters, 2-col between words.
 */
function buildPhraseStrip(words: Frame[][]): Frame {
  const rows = ROWS
  let totalCols = 0
  words.forEach((word, wi) => {
    word.forEach((g, gi) => {
      totalCols += g[0].length
      if (gi < word.length - 1) totalCols += 1
    })
    if (wi < words.length - 1) totalCols += 2
  })
  const frame = emptyFrame(rows, totalCols)
  let c = 0
  words.forEach((word, wi) => {
    word.forEach((glyph, gi) => {
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < glyph[0].length; col++) {
          frame[r][c + col] = glyph[r][col]
        }
      }
      c += glyph[0].length
      if (gi < word.length - 1) {
        c += 1
      }
    })
    if (wi < words.length - 1) {
      c += 2
    }
  })
  return frame
}

/**
 * Horizontal strip for "TALK TO MOOD MNKY" (1-col gap between letters, 2-col between words).
 * Used to generate scrolling frames for the hero CTA.
 */
export const stripTalkToMoodMnky: Frame = buildPhraseStrip([
  [letterT, letterA, letterL, letterK],
  [letterT, letterO],
  [letterM, letterO, letterO, letterD],
  [letterM, letterN, letterK, letterY],
])

/**
 * Returns a slice of a frame from column start to start+cols (with modulo for wrapping).
 */
function sliceFrame(frame: Frame, start: number, cols: number): Frame {
  const stripCols = frame[0].length
  const rows = frame.length
  const out = emptyFrame(rows, cols)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const srcCol = (start + c) % stripCols
      out[r][c] = frame[r][srcCol]
    }
  }
  return out
}

const VISIBLE_COLS = 28
const SCROLL_FPS = 10

/**
 * Scroll frames for "TALK TO MOOD MNKY": fixed visible width, right-to-left scroll.
 * Strip is duplicated so one full cycle is seamless. Precomputed for performance.
 */
export const scrollFramesTalkToMoodMnky: Frame[] = (() => {
  const strip = stripTalkToMoodMnky
  const stripCols = strip[0].length
  const extendedCols = stripCols * 2
  const frames: Frame[] = []
  for (let i = 0; i < stripCols; i++) {
    frames.push(sliceFrame(strip, i, VISIBLE_COLS))
  }
  return frames
})()

export const TALK_TO_MOOD_MNKY_VISIBLE_COLS = VISIBLE_COLS
export const TALK_TO_MOOD_MNKY_SCROLL_FPS = SCROLL_FPS

export const GLYPH_ROWS = ROWS
export const GLYPH_COLS = COLS
