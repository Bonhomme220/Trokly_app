import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium" style={{ color: "#0B1A2B" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn("input", error && "border-red-400 focus:border-red-500", className)}
          {...props}
        />
        {error && <p className="text-xs" style={{ color: "#CC0000" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
