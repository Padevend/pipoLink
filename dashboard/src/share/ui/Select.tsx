import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  desc?: string;
  default?: boolean;
}

export interface SelectProps {
  data: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  className?: string;
}

export function Select({
  data,
  value,
  onChange,
  disabled = false,
  placeholder = "Sélectionner...",
  label,
  leftIcon,
  className = "",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trouve l'option actuellement sélectionnée (priorité à `value`, sinon l'option par défaut)
  const selectedOption = data.find((opt) => opt.value === value) || data.find((opt) => opt.default);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative flex flex-col gap-2 w-full ${className}`} ref={containerRef}>
      {/* LABEL (Optionnel) */}
      {label && (
        <label className="text-sm font-medium text-zinc-900 px-2">
          {label}
        </label>
      )}

      {/* TRIGGER (Le faux input cliquable) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center justify-between w-full h-14 px-6
          bg-zinc-100 rounded-full text-base font-medium transition-all duration-200 outline-none
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-200/60 focus:bg-white focus:ring-2 focus:ring-zinc-900"}
          ${leftIcon ? "pl-12" : ""}
        `}
      >
        {/* Icône gauche optionnelle */}
        {leftIcon && (
          <div className="absolute left-4 text-zinc-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        {/* Texte affiché */}
        <span className={selectedOption ? "text-zinc-900" : "text-zinc-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* Icône Chevron droite animée */}
        <div className="absolute right-4 text-zinc-400 flex items-center pointer-events-none">
          <ChevronDown 
            size={20} 
            strokeWidth={2} 
            className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-zinc-900" : ""}`} 
          />
        </div>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && !disabled && (
        <div className="absolute top-[calc(100%+8px)] left-0 min-w-full w-[max-content] z-50 bg-white border border-zinc-200 rounded-[2rem] p-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {data.map((opt) => {
              const isSelected = selectedOption?.value === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-full text-left transition-colors
                    ${isSelected ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{opt.label}</span>
                    {opt.desc && (
                      <span className={`text-xs ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                        {opt.desc}
                      </span>
                    )}
                  </div>
                  
                  {isSelected && <Check size={16} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}