export type FlowState = {
  index: number;
  /** 1 when moving forwards, -1 when going back: drives the card transition direction. */
  direction: 1 | -1;
  finished: boolean;
};

export type FlowAction = { type: "next"; total: number } | { type: "back" };

export const initialFlow: FlowState = { index: 0, direction: 1, finished: false };

export function lessonFlow(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case "next":
      return state.index >= action.total - 1
        ? { ...state, direction: 1, finished: true }
        : { index: state.index + 1, direction: 1, finished: false };
    case "back":
      return state.index === 0 ? state : { index: state.index - 1, direction: -1, finished: false };
  }
}
