'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Mic, MicOff, Volume2, VolumeX, Headphones, ChevronDown, Loader2 } from 'lucide-react'

interface SpeechControlsProps {
  onTranscription: (text: string) => void
  messageToSpeak?: string
}

type SpeechMode = 'stt' | 'tts' | 's2s'

export function SpeechControls({ onTranscription, messageToSpeak }: SpeechControlsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechMode, setSpeechMode] = useState<SpeechMode>('stt')
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')

      if (event.results[event.results.length - 1].isFinal) {
        onTranscription(transcript)
        if (speechMode === 's2s') {
          // In speech-to-speech mode, we'd trigger TTS after getting response
        }
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [onTranscription, speechMode])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  useEffect(() => {
    if (messageToSpeak && (speechMode === 'tts' || speechMode === 's2s')) {
      speakText(messageToSpeak)
    }
  }, [messageToSpeak, speechMode])

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" disabled className="h-9 w-9">
              <MicOff className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Speech not supported in this browser</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const modeLabels: Record<SpeechMode, { label: string; icon: React.ReactNode; description: string }> = {
    stt: { label: 'Speech-to-Text', icon: <Mic className="w-4 h-4" />, description: 'Convert voice to text' },
    tts: { label: 'Text-to-Speech', icon: <Volume2 className="w-4 h-4" />, description: 'Read responses aloud' },
    s2s: { label: 'Speech-to-Speech', icon: <Headphones className="w-4 h-4" />, description: 'Full voice conversation' },
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* Mode Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              {modeLabels[speechMode].icon}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-strong border-border/50">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Speech Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            {(Object.keys(modeLabels) as SpeechMode[]).map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => setSpeechMode(mode)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  speechMode === mode && 'bg-accent/30'
                )}
              >
                {modeLabels[mode].icon}
                <div className="flex-1">
                  <div className="text-sm">{modeLabels[mode].label}</div>
                  <div className="text-xs text-muted-foreground">{modeLabels[mode].description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mic Button */}
        {(speechMode === 'stt' || speechMode === 's2s') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={cn(
                  'h-9 w-9 transition-all duration-200',
                  isListening
                    ? 'bg-foreground text-background hover:bg-foreground/90 animate-pulse-ring'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {isListening ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="glass-strong border-border/50">
              {isListening ? 'Stop listening' : 'Start voice input'}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Speaker Button */}
        {(speechMode === 'tts' || speechMode === 's2s') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => isSpeaking ? stopSpeaking() : messageToSpeak && speakText(messageToSpeak)}
                className={cn(
                  'h-9 w-9 transition-all duration-200',
                  isSpeaking
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="glass-strong border-border/50">
              {isSpeaking ? 'Stop speaking' : 'Read aloud'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
