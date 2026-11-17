import { GAP, parseItemBank } from "./items";

// Seed bank for the first practice slice. Items have not been checked against
// a level reference (e.g. English Vocabulary Profile): do not label them B2.

const instruction = "Escribe el phrasal verb que falta, en la forma correcta.";
const cefrScale = "Vocabulary range";

export const phrasalVerbBank = parseItemBank([
  {
    id: "put-off-meeting",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "posponer, aplazar",
    sentence: `We had to ${GAP} the meeting until next week because the manager was ill.`,
    accepted: ["put off"],
    explanation:
      "Put off = posponer. Es separable: también se dice «put the meeting off».",
  },
  {
    id: "put-up-with-complaints",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "aguantar, tolerar",
    sentence: `I don't know how she ${GAP} his constant complaints.`,
    accepted: ["puts up with"],
    explanation:
      "Put up with = tolerar. Tercera persona del presente: «puts». Las dos partículas son inseparables.",
  },
  {
    id: "take-off-plane",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "despegar",
    sentence: `The plane ${GAP} two hours late because of the fog.`,
    accepted: ["took off"],
    explanation: "Take off = despegar. Pasado irregular: take → took.",
  },
  {
    id: "give-up-smoking",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "dejar (un hábito)",
    sentence: `After years of trying, my father finally ${GAP} smoking.`,
    accepted: ["gave up"],
    explanation:
      "Give up + -ing = dejar de hacer algo. Pasado irregular: give → gave.",
  },
  {
    id: "run-out-of-milk",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "quedarse sin",
    sentence: `We've ${GAP} milk, so I'll buy some on the way home.`,
    accepted: ["run out of"],
    explanation:
      "Run out of = quedarse sin. Tras «we've» va el participio, que coincide con el infinitivo: run.",
  },
  {
    id: "fill-in-form",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "rellenar (un formulario)",
    sentence: `Please ${GAP} the form before you hand it in.`,
    accepted: ["fill in", "fill out"],
    explanation:
      "Fill in y fill out significan rellenar; fill out es más frecuente en inglés americano.",
  },
  {
    id: "get-over-flu",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "recuperarse de",
    sentence: `It took her almost two weeks to ${GAP} the flu.`,
    accepted: ["get over"],
    explanation:
      "Get over = recuperarse de una enfermedad o un disgusto. Inseparable: «get over it», nunca «get it over».",
  },
  {
    id: "go-off-alarm",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "sonar, saltar (una alarma)",
    sentence: `The fire alarm ${GAP} in the middle of the night.`,
    accepted: ["went off"],
    explanation: "Go off = sonar una alarma o explotar. Pasado irregular: go → went.",
  },
  {
    id: "look-forward-to-holidays",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "tener ganas de",
    sentence: `I'm really ${GAP} the summer holidays.`,
    accepted: ["looking forward to"],
    explanation:
      "Look forward to = tener ganas de. «To» es preposición: va seguido de sustantivo o -ing («looking forward to seeing you»).",
  },
  {
    id: "turn-down-offer",
    kind: "gap-fill",
    cefrScale,
    instruction,
    hint: "rechazar",
    sentence: `She ${GAP} the job offer because the salary was too low.`,
    accepted: ["turned down"],
    explanation:
      "Turn down = rechazar una oferta o invitación. Separable: «turned it down».",
  },
]);
