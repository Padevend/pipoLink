interface AppLogoProps {
  size?: number;
  withName?: boolean;
  withLogo?: boolean;
  className?: string;
}

export function AppLogo({
  size = 24,
  withName = true,
  className = "",
  withLogo = true,
}: AppLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {withLogo && (
        <div className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <img src="/icon.png" width={size*2} height={size*2} className="grayscale" />
        </div>
      )}
      {withName && (
        <span className="text-xl font-bold tracking-tight text-zinc-900">
          PipoLink
        </span>
      )}
    </div>
  );
}
