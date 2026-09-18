interface LogoProps {
  size?: number
}

export default function HireStreamLogo({ size = 32 }: LogoProps) {
  return (
    <img
      src="/favicon.svg"
      alt="HireStream"
      width={size}
      height={size}
      className="flex-shrink-0"
    />
  )
}
