"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"
import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel"

export type TranscriptWord = {
  kind: "word"
  text: string
  startTime: number
  endTime: number
  segmentIndex: number
}

export type TranscriptGap = {
  kind: "gap"
  text: string
  segmentIndex: number
}

export type TranscriptSegment = TranscriptWord | TranscriptGap

export type SegmentComposer = (
  segments: TranscriptSegment[]
) => TranscriptSegment[]

export type UseTranscriptViewerOptions = {
  alignment: CharacterAlignmentResponseModel
  hideAudioTags?: boolean
  segmentComposer?: SegmentComposer
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
  onDurationChange?: (duration: number) => void
}

export type UseTranscriptViewerResult = {
  audioRef: RefObject<HTMLAudioElement | null>
  spokenSegments: TranscriptSegment[]
  unspokenSegments: TranscriptSegment[]
  currentWord: TranscriptWord | null
  segments: TranscriptSegment[]
  words: TranscriptWord[]
  duration: number
  currentTime: number
  isPlaying: boolean
  isScrubbing: boolean
  currentWordIndex: number
  currentSegmentIndex: number
  play: () => void
  pause: () => void
  seekToTime: (time: number) => void
  seekToWord: (word: TranscriptWord) => void
  startScrubbing: () => void
  endScrubbing: () => void
}

function buildSegmentsFromAlignment(
  alignment: CharacterAlignmentResponseModel,
  hideAudioTags: boolean
): TranscriptSegment[] {
  const { characters, characterStartTimesSeconds, characterEndTimesSeconds } =
    alignment
  if (
    !characters?.length ||
    !characterStartTimesSeconds?.length ||
    !characterEndTimesSeconds?.length
  ) {
    return []
  }

  const segments: TranscriptSegment[] = []
  let wordChars: string[] = []
  let wordStart = 0
  let segmentIndex = 0

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    const start = characterStartTimesSeconds[i] ?? 0
    const end = characterEndTimesSeconds[i] ?? 0

    if (hideAudioTags && char === "[") {
      const close = characters.indexOf("]", i)
      if (close !== -1) {
        i = close
        continue
      }
    }

    if (char === " " || char === "\n") {
      if (wordChars.length > 0) {
        segments.push({
          kind: "word",
          text: wordChars.join(""),
          startTime: wordStart,
          endTime: characterEndTimesSeconds[i - 1] ?? wordStart,
          segmentIndex: segmentIndex++,
        })
        wordChars = []
      }
      segments.push({
        kind: "gap",
        text: char,
        segmentIndex: segmentIndex++,
      })
    } else {
      if (wordChars.length === 0) wordStart = start
      wordChars.push(char)
    }
  }

  if (wordChars.length > 0) {
    const lastIdx = characters.length - 1
    segments.push({
      kind: "word",
      text: wordChars.join(""),
      startTime: wordStart,
      endTime: characterEndTimesSeconds[lastIdx] ?? wordStart,
      segmentIndex: segmentIndex++,
    })
  }

  return segments
}

export function useTranscriptViewer(
  options: UseTranscriptViewerOptions
): UseTranscriptViewerResult {
  const {
    alignment,
    hideAudioTags = true,
    segmentComposer,
    onPlay,
    onPause,
    onTimeUpdate,
    onEnded,
    onDurationChange,
  } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const segments = useMemo(() => {
    const raw = buildSegmentsFromAlignment(alignment, hideAudioTags)
    return segmentComposer ? segmentComposer(raw) : raw
  }, [alignment, hideAudioTags, segmentComposer])

  const words = useMemo(
    () => segments.filter((s): s is TranscriptWord => s.kind === "word"),
    [segments]
  )

  const spokenSegments = useMemo(() => {
    return segments.filter((s) => {
      if (s.kind === "gap") return true
      return s.endTime <= currentTime + 0.05
    })
  }, [segments, currentTime])

  const unspokenSegments = useMemo(() => {
    return segments.filter((s) => {
      if (s.kind === "gap") return true
      return s.startTime > currentTime + 0.05
    })
  }, [segments, currentTime])

  const currentWord = useMemo(() => {
    const w = words.find(
      (word) => currentTime >= word.startTime - 0.05 && currentTime <= word.endTime + 0.05
    )
    return w ?? null
  }, [words, currentTime])

  const currentWordIndex = currentWord ? currentWord.segmentIndex : -1
  const currentSegmentIndex = currentWord
    ? segments.findIndex((s) => s === currentWord)
    : -1

  const play = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
    onPlay?.()
  }, [onPlay])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
    onPause?.()
  }, [onPause])

  const seekToTime = useCallback(
    (time: number) => {
      const el = audioRef.current
      if (el) {
        el.currentTime = Math.max(0, Math.min(time, duration || 0))
        setCurrentTime(el.currentTime)
        onTimeUpdate?.(el.currentTime)
      }
    },
    [duration, onTimeUpdate]
  )

  const seekToWord = useCallback(
    (word: TranscriptWord) => {
      seekToTime(word.startTime)
    },
    [seekToTime]
  )

  const startScrubbing = useCallback(() => setIsScrubbing(true), [])
  const endScrubbing = useCallback(() => setIsScrubbing(false), [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onTimeUpdateEv = () => {
      setCurrentTime(el.currentTime)
      onTimeUpdate?.(el.currentTime)
    }
    const onDurationChangeEv = () => {
      const d = el.duration
      if (Number.isFinite(d)) {
        setDuration(d)
        onDurationChange?.(d)
      }
    }
    const onPlayEv = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const onPauseEv = () => {
      setIsPlaying(false)
      onPause?.()
    }
    const onEndedEv = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    el.addEventListener("timeupdate", onTimeUpdateEv)
    el.addEventListener("durationchange", onDurationChangeEv)
    el.addEventListener("play", onPlayEv)
    el.addEventListener("pause", onPauseEv)
    el.addEventListener("ended", onEndedEv)

    if (Number.isFinite(el.duration)) {
      setDuration(el.duration)
    }

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdateEv)
      el.removeEventListener("durationchange", onDurationChangeEv)
      el.removeEventListener("play", onPlayEv)
      el.removeEventListener("pause", onPauseEv)
      el.removeEventListener("ended", onEndedEv)
    }
  }, [onPlay, onPause, onTimeUpdate, onEnded, onDurationChange])

  return {
    audioRef,
    spokenSegments,
    unspokenSegments,
    currentWord: currentWord ?? null,
    segments,
    words,
    duration,
    currentTime,
    isPlaying,
    isScrubbing,
    currentWordIndex,
    currentSegmentIndex,
    play,
    pause,
    seekToTime,
    seekToWord,
    startScrubbing,
    endScrubbing,
  }
}
