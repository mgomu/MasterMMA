import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  light = false,
}: {
  className?: string;
  markClassName?: string;
  light?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn("size-7 rounded-md bg-primary", markClassName)}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-heading text-base font-bold tracking-tight",
          light ? "text-white" : "text-foreground",
        )}
      >
        Gimnasio MMA
      </span>
    </div>
  );
}
