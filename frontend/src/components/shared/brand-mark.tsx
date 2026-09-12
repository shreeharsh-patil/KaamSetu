import Image from "next/image";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 36, className }: BrandMarkProps) {
  return (
    <Image
      src="/brand-logo.png"
      alt="KaamSetu"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
