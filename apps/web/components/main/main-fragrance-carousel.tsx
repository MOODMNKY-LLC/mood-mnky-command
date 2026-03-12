"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { MnkyFragranceCard } from "@/components/main/mnky-fragrance-card"
import type { FragranceOil } from "@/lib/types"

const AUTOPLAY_MS = 4500

export interface MainFragranceCarouselProps {
  oils: FragranceOil[]
  className?: string
}

export function MainFragranceCarousel({ oils, className }: MainFragranceCarouselProps) {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startAutoplay = useCallback(() => {
    if (!api) return
    stopAutoplay()
    intervalRef.current = setInterval(() => {
      api.scrollNext()
    }, AUTOPLAY_MS)
  }, [api, stopAutoplay])

  useEffect(() => {
    if (!api || isHovered) return
    startAutoplay()
    return () => stopAutoplay()
  }, [api, isHovered, startAutoplay, stopAutoplay])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    stopAutoplay()
  }, [stopAutoplay])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (api) startAutoplay()
  }, [api, startAutoplay])

  if (oils.length === 0) return null

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
          containScroll: "trimSnaps",
          dragFree: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 flex flex-nowrap">
          {oils.map((oil) => (
            <CarouselItem
              key={oil.id}
              className="basis-[220px] pl-2 sm:basis-[220px]"
            >
              <MnkyFragranceCard oil={oil} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
