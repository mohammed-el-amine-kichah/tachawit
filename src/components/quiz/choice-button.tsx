import { CheckIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ChoiceState = "idle" | "selected" | "correct" | "wrong" | "dimmed";

const stateClassName: Record<ChoiceState, string> = {
  idle: "bg-card ring-border hover:ring-primary/50",
  selected: "bg-accent ring-primary ring-2 text-accent-foreground",
  correct: "bg-success/15 ring-success ring-2",
  wrong: "bg-destructive/10 ring-destructive ring-2 motion-safe:animate-nudge",
  dimmed: "bg-card ring-border opacity-50",
};

/** A tappable answer with a tactile press and clear feedback states. */
export function ChoiceButton({
  state,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { state: ChoiceState }) {
  return (
    <button
      type="button"
      aria-pressed={state === "selected" || undefined}
      className={cn(
        "relative flex min-h-14 w-full items-center gap-3 rounded-2xl border-b-4 border-shade px-4 py-3 text-start text-lg font-medium ring-1 transition-[transform,background-color] duration-150 active:translate-y-0.5 active:border-b-2 disabled:cursor-default",
        stateClassName[state],
        className,
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {state === "correct" && <CheckIcon aria-hidden className="size-6 text-success" />}
      {state === "wrong" && <XIcon aria-hidden className="size-6 text-destructive" />}
    </button>
  );
}

export function choiceState(id: string, selected: string | null, answer: string, status: "answering" | "correct" | "wrong"): ChoiceState {
  if (status === "answering") return selected === id ? "selected" : "idle";
  if (id === answer) return "correct";
  if (id === selected) return "wrong";
  return "dimmed";
}
