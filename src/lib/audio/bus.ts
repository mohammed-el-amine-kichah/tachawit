// Only one clip plays at a time across the whole app.

let current: HTMLAudioElement | null = null;

export function claimAudio(element: HTMLAudioElement): void {
  if (current && current !== element) current.pause();
  current = element;
}

export function releaseAudio(element: HTMLAudioElement): void {
  if (current === element) current = null;
}

/** Plays a URL once (a single word, a recording) and resolves when it ends or fails. */
export function playOnce(url: string): Promise<void> {
  const element = new Audio(url);
  claimAudio(element);
  return new Promise((resolve) => {
    const done = () => {
      releaseAudio(element);
      resolve();
    };
    element.addEventListener("ended", done, { once: true });
    element.addEventListener("error", done, { once: true });
    element.addEventListener("pause", done, { once: true });
    element.play().catch(done);
  });
}
