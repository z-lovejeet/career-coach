/** Shuffle MCQ options so the correct answer's position is uniformly random (LLMs favour option B). */
export function shuffleOptions(options: string[], answer: number, random: () => number = Math.random) {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) };
}
