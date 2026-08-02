// export async function getBasePoints(habit: string, time: number) {
// try {
//   const response = await fetch(
//     "https://cdjlkelizdalisrzqvep.supabase.co/functions/v1/base-points",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
//       },
//       body: JSON.stringify({ habit, time }),
//     },
//   );

//   if (!response.ok) {
//     console.log(response);
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }

//   const res = await response.json();
//   return res.points;
// } catch (error) {
//   console.error("Error getting base points:", error);
//   return 10;
// }
// }

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