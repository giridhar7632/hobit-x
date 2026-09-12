export function getBasePoints(habit: string, time: number) {
  if (!time || time <= 0) return 0;

  const name = habit.toLowerCase();
  let multiplier = 1.0;

  if (/(gym|run|workout|lift|swim|cycle|exercise|yoga|sport|fitness)/.test(name)) {
    multiplier = 1.5;
  } else if (/(code|study|read|learn|write|work|focus|project|math)/.test(name)) {
    multiplier = 1.3;
  } else if (/(clean|wash|tidy|email|pay|chore|dishes|laundry)/.test(name)) {
    multiplier = 0.8;
  }

  const baseTotal = 5 + (time * 1.0);

  const finalTotalPoints = baseTotal * multiplier;
  return finalTotalPoints / time;
};