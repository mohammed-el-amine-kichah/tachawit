export type QuestionStatus = "answering" | "correct" | "wrong";

/** Contract between the quiz player and each question type. */
export type QuestionProps<Item> = {
  item: Item;
  status: QuestionStatus;
  seed: number;
  /** Register how to check the current answer (null while nothing is selected). */
  onCheckChange: (check: (() => boolean) | null) => void;
  /** For questions that decide by themselves (match pairs). */
  onAnswer: (correct: boolean) => void;
};
