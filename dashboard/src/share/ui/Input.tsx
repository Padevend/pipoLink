import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", leftIcon, rightIcon, label, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-zinc-900 px-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {/* Icône gauche */}
          {leftIcon && (
            <div className="absolute left-4 text-zinc-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          {/* Champ de saisie */}
          <input
            ref={ref}
            type={currentType}
            className={`
              w-full h-14 bg-zinc-100 text-zinc-900 rounded-full border-transparent 
              focus:bg-white focus:ring-2 focus:ring-zinc-900 focus:border-transparent
              hover:bg-zinc-200/60 transition-all duration-200
              placeholder:text-zinc-400 text-base font-medium outline-none
              ${leftIcon ? "pl-12" : "pl-6"} 
              ${(rightIcon || isPassword) ? "pr-12" : "pr-6"}
              ${className}
            `}
            {...props}
          />

          {/* Gestion dynamique de l'icône droite (mot de passe ou custom) */}
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-zinc-400 hover:text-zinc-900 transition-colors focus:outline-none"
            >
              {showPassword ? <Eye size={20} strokeWidth={2} /> : <EyeOff size={20} strokeWidth={2} />}
            </button>
          ) : rightIcon ? (
             <div className="absolute right-4 text-zinc-400 flex items-center">
              {rightIcon}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";