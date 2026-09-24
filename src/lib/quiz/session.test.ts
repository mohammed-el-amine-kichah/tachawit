import { describe, expect, it } from "vitest";
import { initialSession, quizScore, quizSession, starsFor, xpFor } from "./session";

const ids = ["q1", "q2", "q3"];

describe("quizSession", () => {
  it("walks through the questions in order", () => {
    let s = initialSession(ids);
    expect(s.queue).toEqual(ids);
    s = quizSession(s, { type: "answer", correct: true });
    expect(s.feedback).toBe("correct");
    s = quizSession(s, { type: "continue" });
    expect(s.position).toBe(1);
    expect(s.feedback).toBeNull();
  });

  it("repeats a missed question at the end instead of taking anything away", () => {
    let s = initialSession(ids);
    s = quizSession(s, { type: "answer", correct: false });
    expect(s.feedback).toBe("wrong");
    expect(s.queue).toEqual(["q1", "q2", "q3", "q1"]);
    expect(s.results.q1).toEqual({ firstTry: false, attempts: 1 });
  });

  it("keeps the first-try result when a repeated question is answered correctly", () => {
    let s = initialSession(["q1"]);
    s = quizSession(s, { type: "answer", correct: false });
    s = quizSession(s, { type: "continue" });
    s = quizSession(s, { type: "answer", correct: true });
    expect(s.results.q1).toEqual({ firstTry: false, attempts: 2 });
    s = quizSession(s, { type: "continue" });
    expect(s.finished).toBe(true);
  });

  it("keeps repeating a missed question at the end until it is answered", () => {
    let s = initialSession(["q1", "q2"]);
    s = quizSession(s, { type: "answer", correct: false });
    s = quizSession(s, { type: "continue" });
    s = quizSession(s, { type: "answer", correct: true });
    s = quizSession(s, { type: "continue" });
    s = quizSession(s, { type: "answer", correct: false });
    expect(s.queue).toEqual(["q1", "q2", "q1", "q1"]);
  });

  it("stops repeating after three attempts so nobody gets stuck", () => {
    let s = initialSession(["q1"]);
    for (let i = 0; i < 3; i++) {
      s = quizSession(s, { type: "answer", correct: false });
      s = quizSession(s, { type: "continue" });
    }
    expect(s.results.q1.attempts).toBe(3);
    expect(s.finished).toBe(true);
  });

  it("ignores answers while feedback is showing", () => {
    let s = initialSession(ids);
    s = quizSession(s, { type: "answer", correct: true });
    expect(quizSession(s, { type: "answer", correct: false })).toBe(s);
  });

  it("finishes after the last queued question", () => {
    let s = initialSession(["q1"]);
    s = quizSession(s, { type: "answer", correct: true });
    s = quizSession(s, { type: "continue" });
    expect(s.finished).toBe(true);
  });
});

describe("scoring", () => {
  it("counts first-try answers", () => {
    expect(quizScore({ q1: { firstTry: true, attempts: 1 }, q2: { firstTry: false, attempts: 2 } })).toEqual({
      firstTry: 1,
      total: 2,
      accuracy: 0.5,
    });
  });

  it("gives 3 stars from 90%, 2 from 60%, and always at least 1 for finishing", () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.9)).toBe(3);
    expect(starsFor(0.6)).toBe(2);
    expect(starsFor(0.2)).toBe(1);
    expect(starsFor(0)).toBe(1);
  });

  it("awards base XP plus a bonus per first-try answer", () => {
    expect(xpFor({ firstTry: 4, total: 6, accuracy: 4 / 6 })).toBe(18);
  });
});
