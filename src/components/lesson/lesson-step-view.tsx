import type { LessonViewStep } from "@/lib/lesson/view";
import { CultureNoteStep } from "./culture-note-step";
import { DialogueStep } from "./dialogue-step";
import { IntroduceStep } from "./introduce-step";
import { ListenRepeatStep } from "./listen-repeat-step";

export function LessonStepView({ step }: { step: LessonViewStep }) {
  switch (step.type) {
    case "introduce":
      return <IntroduceStep entry={step.entry} audio={step.audio} />;
    case "listen_repeat":
      return <ListenRepeatStep entry={step.entry} audio={step.audio} />;
    case "culture_note":
      return <CultureNoteStep title={step.title} body={step.body} imageUrl={step.imageUrl} noteSlug={step.noteSlug} />;
    case "dialogue":
      return <DialogueStep title={step.title} lines={step.lines} />;
  }
}
