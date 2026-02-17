import React from "react"

import { cn } from "@/lib/utils"

export interface OrbitingCirclesProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
  reverse?: boolean
  duration?: number
  delay?: number
  radius?: number
  /** When true, use parent's --orbit-radius (or --radius) for responsive orbit matching container */
  useContainerRadius?: boolean
  path?: boolean
  iconSize?: number
  speed?: number
}

export function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  radius = 160,
  useContainerRadius = false,
  path = true,
  iconSize = 30,
  speed = 1,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / speed
  const radiusValue = useContainerRadius ? "var(--orbit-radius)" : radius
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
          {...(useContainerRadius && {
            viewBox: "0 0 100 100",
            preserveAspectRatio: "xMidYMid meet",
          })}
        >
          <circle
            className="stroke-black/10 stroke-1 dark:stroke-white/10"
            cx={useContainerRadius ? "50" : "50%"}
            cy={useContainerRadius ? "50" : "50%"}
            r={useContainerRadius ? 50 : radius}
            fill="none"
          />
        </svg>
      )}
      {React.Children.map(children, (child, index) => {
        const angle = (360 / React.Children.count(children)) * index
        return (
          <div
            style={
              {
                "--duration": calculatedDuration,
                "--radius": radiusValue,
                "--angle": angle,
                "--icon-size": `${iconSize}px`,
              } as React.CSSProperties
            }
            className={cn(
              `animate-orbit absolute flex size-[var(--icon-size)] transform-gpu items-center justify-center rounded-full`,
              { "[animation-direction:reverse]": reverse },
              className
            )}
            {...props}
          >
            {child}
          </div>
        )
      })}
    </>
  )
}
