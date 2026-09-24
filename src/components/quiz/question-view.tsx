import type { QuizItem } from "@/lib/quiz/build";
import { BuildSentenceQuestion } from "./build-sentence-question";
import { FillBlankQuestion } from "./fill-blank-question";
import { ListenPickQuestion } from "./listen-pick-question";
import { MatchPairsQuestion } from "./match-pairs-question";
import { PickAudioQuestion } from "./pick-audio-question";
import { SpeakQuestion } from "./speak-question";
import type { QuestionProps } from "./types";

export function QuestionView({ item, ...props }: QuestionProps<QuizItem>) {
  switch (item.type) {
    case "listen_pick_translation":
      return <ListenPickQuestion item={item} {...props} />;
    case "pick_audio":
      return <PickAudioQuestion item={item} {...props} />;
    case "build_sentence":
      return <BuildSentenceQuestion item={item} {...props} />;
    case "match_pairs":
      return <MatchPairsQuestion item={item} {...props} />;
    case "fill_blank":
      return <FillBlankQuestion item={item} {...props} />;
    case "speak":
      return <SpeakQuestion item={item} {...props} />;
  }
}
