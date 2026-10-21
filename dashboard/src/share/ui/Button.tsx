import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", children, isLoading, leftIcon, rightIcon, variant = "primary", fullWidth, disabled, ...props }, ref) => {
    
    const baseStyles = "relative flex items-center justify-center gap-2 h-14 px-8 rounded-full font-semibold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-zinc-900 text-white hover:bg-black",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
      outline: "border-2 border-zinc-200 text-zinc-900 hover:border-zinc-900 bg-transparent",
      ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />}
        {!isLoading && leftIcon}
        <span className={isLoading ? "opacity-0 absolute" : ""}>{children}</span>
        {isLoading && <span className="ml-2">Patientez...</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";