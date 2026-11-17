# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
npm run dev          # servidor de desarrollo (Turbopack)
npm run build        # build de producción
npm run start        # sirve el build
npm run lint         # ESLint, incluye las reglas de frontera entre capas
npm run typecheck    # next typegen && tsc --noEmit
npm test             # Vitest, una pasada
npm run test:watch   # Vitest en modo watch
npx vitest run src/engine/foo.test.ts     # un único archivo
npx vitest run -t "nombre del test"       # un único test por nombre
```

`typecheck` necesita `next typegen` antes de `tsc`: los tipos globales `LayoutProps` / `PageProps` se generan en `.next/types`.

Tests escritos en TDD (test primero, verlo fallar por aserción, luego implementar). Las expectativas son literales calculados a mano, nunca derivados del código bajo test.

## Stack

Next.js 16 (App Router, `src/`), React 19, TypeScript estricto con `noUncheckedIndexedAccess`, Tailwind 4, Zod 4, Vitest 5, npm. `cacheComponents` y `partialPrefetching` están activos en `next.config.ts`: condicionan cómo se escribe cualquier lectura de datos, leer la guía correspondiente en `node_modules/next/dist/docs/` antes de añadirla.

La documentación de Next que vale es la que viene en el paquete instalado (ver `AGENTS.md`), no la memorizada.

Zod valida en las fronteras: entrada de usuario, carga de contenido, respuestas de la IA, variables de entorno.

## Producto

Aplicación de aprendizaje de inglés orientada a B2 (MCER/CEFR). Interfaz en español. Contexto regulatorio: España (AEPD). PWA, sin app nativa.

Contenido de partida: verbos irregulares, phrasal verbs y gramática. Ese contenido **no basta** para B2: el diseño incluye actividades integradas de comprensión, expresión, interacción y mediación.

El nombre "Phrasal Verb" es provisional y vive solo en `src/site.ts`.

## Fundamentos pedagógicos

| Fundamento | Cómo se aplica |
|---|---|
| MCER / CEFR (Consejo de Europa) | Los descriptores B2 definen objetivos y tipos de actividad. Cada actividad se asocia a un descriptor. |
| Repetición espaciada | Revisiones programadas para retención a largo plazo (metaanálisis de 48 experimentos en segundas lenguas). |
| Recuperación activa | El alumno produce la respuesta sin ver la solución; el feedback llega después. |
| IA en aprendizaje lingüístico | Conversación, personalización y feedback, siempre con controles de calidad. La evidencia es positiva pero heterogénea: no asumir que la IA mejora un ejercicio por defecto. |
| Protección de menores y accesibilidad | Privacidad desde el diseño; WCAG 2.2 AA. |

Las URLs de las fuentes no estaban en el material original. No inventar citas; pedirlas a Ricardo si hay que mostrarlas.

## Reglas de diseño no negociables

1. **Indicador interno ≠ certificación.** Ninguna pantalla, texto o métrica puede sugerir que el alumno "tiene" o "ha alcanzado" un B2 oficial. Los indicadores describen el desempeño dentro de la app y se etiquetan como tales.
2. **Núcleo verificable separado de la IA.** La corrección de ítems de respuesta cerrada y la programación de repasos son deterministas, reproducibles y testeables sin red. La IA se reserva para conversación, generación contextual y feedback sobre producción abierta, donde aporta valor real.
3. **Recuperación antes que reconocimiento.** Un ejercicio no muestra la solución antes de que el alumno responda. Las opciones múltiples no son el formato por defecto.
4. **Recorridos separados menores / adultos**, con controles parentales. Afecta al modelo de datos desde el inicio: tipo de cuenta, consentimiento, minimización de datos, qué se envía a un proveedor de IA.
5. **Monetización por suscripción.** Sin anuncios. Sin mecánicas de presión sobre menores (p. ej. castigo por perder rachas, ofertas con cuenta atrás, notificaciones culpabilizadoras).
6. **Accesibilidad WCAG 2.2 AA** como criterio de aceptación de cada pantalla, no como fase posterior. Específico de esta app: la página es `lang="es"`, así que todo texto en inglés mostrado al alumno lleva `lang="en"` (WCAG 3.1.2); sin eso un lector de pantalla lo pronuncia con fonética española.

### Integridad de los datos mostrados

La regla global de Ricardo (CLAUDE.md global, sección 5) aplica aquí de forma directa: progreso, dominio, rachas y cualquier señal social se calculan sobre respuestas reales registradas. No se muestran niveles "estimados", porcentajes de "B2 completado" ni contadores de usuarios que no salgan de datos reales. Un valor bajo se muestra bajo.

## Arquitectura por capas

Dirección de import permitida, impuesta por `no-restricted-imports` en `eslint.config.mjs`:

```
src/content  ←  src/engine  ←  src/ai, src/app
```

- **`src/content`** — banco de ítems y sus esquemas, mapeados a descriptores CEFR. No importa de ninguna otra capa ni de Next/React.
- **`src/engine`** — corrección de respuestas y scheduler de repetición espaciada. TypeScript puro: puede importar de `content`, nunca de `ai`, `app`, Next o React. Además tiene prohibidos `Date.now()`, `new Date()` sin argumentos, `Math.random()` y `fetch`: el tiempo y el azar entran como parámetros para que cada resultado sea reproducible.
- **`src/ai`** — conversación, generación contextual, feedback sobre producción abierta. Su salida se valida (esquema, adecuación al nivel, filtros reforzados en el recorrido infantil) antes de llegar al alumno.
- **`src/app`** — rutas y UI.

La carpeta `ai` se crea con su primer archivo real; la regla de ESLint ya está activa para ella.

### Flujo de un intento de práctica (`/practice`)

1. `practice/page.tsx` (servidor) pasa al cliente solo `toPublicItem(...)`: enunciado, pista y frase. **Las respuestas aceptadas y la explicación nunca llegan al cliente antes de responder**; si llegaran, la recuperación activa se rompe abriendo DevTools.
2. `practice-session.tsx` (cliente) envía `{ itemId, response }` a la Server Action `submitAttempt` (`actions.ts`).
3. `grade-attempt.ts` valida con Zod, corrige con `engine/grading` y devuelve solución, explicación y `gradedAt` (hora del servidor).
4. El cliente añade `{ itemId, outcome, at: gradedAt }` a su log de intentos (en memoria por ahora) y `engine/scheduling.nextItemId` decide el siguiente ítem plegando ese log.

Reglas que este flujo impone:

- La hora de un intento la pone el servidor. El cliente no lee el reloj durante el render (`react-hooks/purity` y el prerender de `cacheComponents` lo rechazan); solo un `setInterval` en `useEffect` avanza `now` de forma monotónica para que los repasos vencidos reaparezcan.
- Las respuestas del alumno no se registran en logs: puede haber menores.
- La lógica de una Server Action vive en una función pura con `now` como parámetro (`gradeItemAttempt`); el archivo `'use server'` solo la envuelve. Así se testea sin Next.

### Repetición espaciada (provisional)

Leitner de 5 cajas en `engine/scheduling.ts`. Acierto: sube una caja (tope 5), próximo repaso a 1/3/7/16/35 días. Fallo: caja 0, vuelve a los 10 minutos (no antes, para que la solución recién vista no siga en pantalla). Prioridad: repaso vencido más antiguo → primer ítem nuevo en orden del banco → nada. El estado de repaso no se almacena: se deriva siempre del log de intentos.

### Contenido

`content/phrasal-verbs.ts` es un banco semilla de 10 ítems de hueco. **No está contrastado con ninguna referencia de nivel** (p. ej. English Vocabulary Profile): no etiquetar esos ítems como B2. `parseItemBank` valida en la carga del módulo; un ítem mal formado rompe el build y los tests.

Consecuencias que deben mantenerse:

- Si el proveedor de IA no responde, los ejercicios del núcleo siguen funcionando.
- El registro de respuestas es la fuente de verdad de todo indicador mostrado; los indicadores se derivan de él, no se almacenan como cifras editables.
- Vitest corre en entorno `node` e incluye solo `src/**/*.test.ts`. Tests de componentes requerirían añadir jsdom y ampliar `include`.

## Decisiones abiertas

- Proveedor de Postgres (región UE) y capa de acceso a datos.
- Proveedor y modelo de IA; qué datos de menores pueden salir del sistema.
- Algoritmo de repetición espaciada definitivo (Leitner es provisional; SM-2/FSRS encajan detrás de `deriveReviewStates`/`nextItemId`).
- Persistencia del log de intentos: hoy se pierde al recargar.
- Revisión del banco semilla por alguien con criterio docente.
- Flujo de verificación de edad y consentimiento parental. Verificar la edad de consentimiento digital vigente en España (LOPDGDD / AEPD) antes de implementarlo; no asumir un umbral.
- Precios y estructura de la suscripción.
- PWA incompleta: hay `manifest.ts`, faltan iconos (192/512) y service worker para uso offline.
- Nombre del producto e identidad visual.
- El documento completo de especificación ("system prompt") al que alude el material original no está en el repositorio.
