"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { GAP, type PublicItem } from "@/content/items";
import { type Attempt, nextItemId } from "@/engine/scheduling";
import { submitAttempt } from "./actions";
import { type AttemptFeedback, MAX_RESPONSE_LENGTH } from "./grade-attempt";

type GradedFeedback = Extract<AttemptFeedback, { status: "graded" }>;

type Phase =
  | { kind: "answering"; error: string | null }
  | { kind: "feedback"; feedback: GradedFeedback };

const FAILURE_MESSAGE = "No se ha podido corregir la respuesta. Inténtalo de nuevo.";
const CLOCK_TICK_MS = 30_000;

export function PracticeSession({ items }: { items: PublicItem[] }) {
  const itemIds = useMemo(() => items.map(({ id }) => id), [items]);

  // Attempt log for this session (in memory until persistence exists).
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  // Never read the clock during render (impure; breaks prerendering). Attempts carry
  // server time; this clock only lets due reviews reappear without a reload.
  // 0 is safe initially because with no attempts no review can be due.
  const [now, setNow] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "answering", error: null });
  const [response, setResponse] = useState("");
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  const currentId = nextItemId(itemIds, attempts, now);
  const item = items.find(({ id }) => id === currentId);

  useEffect(() => {
    if (phase.kind === "feedback") feedbackRef.current?.focus();
  }, [phase.kind]);

  useEffect(() => {
    // Monotonic: a client clock behind the server's must not move `now` backwards.
    const tick = () => setNow((previous) => Math.max(previous, Date.now()));
    const id = setInterval(tick, CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (item === undefined || isPending) return;

    const itemId = item.id;
    startTransition(async () => {
      let feedback: AttemptFeedback;
      try {
        feedback = await submitAttempt({ itemId, response });
      } catch {
        setPhase({ kind: "answering", error: FAILURE_MESSAGE });
        return;
      }
      if (feedback.status !== "graded") {
        setPhase({ kind: "answering", error: FAILURE_MESSAGE });
        return;
      }
      setPhase({ kind: "feedback", feedback });
    });
  }

  function handleNext() {
    if (phase.kind !== "feedback" || item === undefined) return;
    const { outcome, gradedAt: at } = phase.feedback;
    setAttempts((log) => [...log, { itemId: item.id, outcome, at }]);
    setNow((previous) => Math.max(previous, at));
    setResponse("");
    setPhase({ kind: "answering", error: null });
    // The input remounts for the next item; focus it once it exists.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  if (item === undefined) {
    return (
      <section aria-labelledby="done-heading" className="space-y-4">
        <h2 id="done-heading" className="text-xl font-semibold">
          No hay nada pendiente ahora mismo
        </h2>
        <p>
          Las respuestas falladas vuelven a los 10 minutos. Las acertadas, a partir de mañana.
          Si dejas esta página abierta, aparecerán aquí cuando toquen.
        </p>
      </section>
    );
  }

  const [before, after] = item.sentence.split(GAP);

  return (
    <section aria-labelledby="item-heading" className="space-y-6">
      <h2 id="item-heading" className="sr-only">
        Ejercicio
      </h2>
      <p>{item.instruction}</p>
      <p className="text-sm">
        Pista: <span className="font-medium">{item.hint}</span>
      </p>

      <p lang="en" className="text-xl leading-relaxed">
        {before}
        <span aria-hidden="true">_____</span>
        <span className="sr-only" lang="es">
          (hueco)
        </span>
        {after}
      </p>

      {phase.kind === "answering" ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="response" className="block font-medium">
            Tu respuesta
          </label>
          <input
            ref={inputRef}
            id="response"
            name="response"
            lang="en"
            type="text"
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            maxLength={MAX_RESPONSE_LENGTH}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={phase.error ? "submit-error" : undefined}
            className="block w-full rounded border-2 border-current px-3 py-2 text-lg"
          />
          {phase.error && (
            <p id="submit-error" role="alert" className="font-medium">
              {phase.error}
            </p>
          )}
          <button type="submit" disabled={isPending} className={buttonClass}>
            {isPending ? "Corrigiendo…" : "Comprobar"}
          </button>
        </form>
      ) : (
        // No aria-live: the region mounts with its content, which screen readers
        // announce unreliably. Moving focus to the heading reads the result instead.
        <div className="space-y-3">
          <h3 ref={feedbackRef} tabIndex={-1} className="text-lg font-semibold">
            {phase.feedback.outcome === "correct" ? "Correcto" : "No es correcto"}
          </h3>
          {phase.feedback.outcome === "incorrect" && (
            <p>
              Escribiste: <span lang="en">«{response.trim() || "(vacío)"}»</span>
            </p>
          )}
          <p>
            Respuesta: <strong lang="en">{phase.feedback.solution}</strong>
          </p>
          <p>{phase.feedback.explanation}</p>
          <button type="button" onClick={handleNext} className={buttonClass}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}

const buttonClass =
  "rounded border-2 border-current px-4 py-2 font-medium disabled:opacity-60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2";
