import * as React from "react"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
}

const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ length = 6, value, onChange, onComplete, disabled, error, className }, ref) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const digits = React.useMemo(() => {
      const arr = value.split("").slice(0, length)
      while (arr.length < length) arr.push("")
      return arr
    }, [value, length])

    const setDigit = (index: number, digit: string) => {
      const next = [...digits]
      next[index] = digit
      const nextValue = next.join("")
      onChange(nextValue)

      if (nextValue.length === length && !nextValue.includes("")) {
        onComplete?.(nextValue)
      }
    }

    const handleChange = (index: number, raw: string) => {
      const digit = raw.replace(/\D/g, "").slice(-1)
      setDigit(index, digit)
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          setDigit(index, "")
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus()
          setDigit(index - 1, "")
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
      if (!pasted) return
      onChange(pasted.padEnd(length, "").slice(0, length).replace(/ /g, ""))
      const filled = pasted.length
      if (filled === length) {
        onComplete?.(pasted)
        inputRefs.current[length - 1]?.focus()
      } else {
        inputRefs.current[Math.min(filled, length - 1)]?.focus()
      }
    }

    return (
      <div ref={ref} className={cn("flex gap-2 justify-center", className)}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              "h-12 w-10 rounded-md border text-center text-lg font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-500 text-red-600 focus-visible:ring-red-500"
                : "border-input bg-background"
            )}
          />
        ))}
      </div>
    )
  }
)
OtpInput.displayName = "OtpInput"

export { OtpInput }
