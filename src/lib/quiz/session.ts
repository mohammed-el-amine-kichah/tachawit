import { XP } from "@/lib/progress/xp";

// No hearts: a missed question simply comes back at the end, up to MAX_ATTEMPTS in total.

export const MAX_ATTEMPTS = 3;

export type QuestionResult = { firstTry: boolean; attempts: number };

export type SessionState = {
  queue: string[];
  position: number;
  feedback: "correct" | "wrong" | null;
  results: Record<string, QuestionResult>;
  finished: boolean;
};

export type SessionAction = { type: "answer"; correct: boolean } | { type: "continue" };

export function initialSession(questionIds: readonly string[]): SessionState {
  return { queue: [...questionIds], position: 0, feedback: null, results: {}, finished: questionIds.length === 0 };
}

export function quizSession(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "answer": {
      if (state.feedback !== null || state.finished) return state;
      const id = state.queue[state.position];
      const previous = state.results[id];
      const attempts = (previous?.attempts ?? 0) + 1;
      const result = { firstTry: previous ? previous.firstTry : action.correct, attempts };
      const repeat = !action.correct && attempts < MAX_ATTEMPTS;
      return {
        ...state,
        feedback: action.correct ? "correct" : "wrong",
        results: { ...state.results, [id]: result },
        queue: repeat ? [...state.queue, id] : state.queue,
      };
    }
    case "continue": {
      if (state.feedback === null) return state;
      const position = state.position + 1;
      return { ...state, position, feedback: null, finished: position >= state.queue.length };
    }
  }
}

export type QuizScore = { firstTry: number; total: number; accuracy: number };

export function quizScore(results: Readonly<Record<string, QuestionResult>>): QuizScore {
  const all = Object.values(results);
  const firstTry = all.filter((r) => r.firstTry).length;
  return { firstTry, total: all.length, accuracy: all.length ? firstTry / all.length : 1 };
}

/** Finishing always earns a star; accuracy on first tries earns the rest. */
export function starsFor(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.6) return 2;
  return 1;
}

export function xpFor(score: QuizScore): number {
  return XP.quizBase + XP.quizPerFirstTry * score.firstTry;
}
