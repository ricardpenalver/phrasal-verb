# Traceability

## 2026-11-17 — Inicialización del repositorio

**Hecho**
- `git init` en rama `main`. Identidad activa: cuenta personal (`ricardpenalver`), tomada de la configuración global.
- Creados `CLAUDE.md`, `CLAUDE.local.md` (ignorado por git), `.gitignore`.
- Sin commits.

**Decisiones**
- `CLAUDE.md` documenta intención de producto y restricciones, no comandos: todavía no hay stack ni código.
- Fijada la separación núcleo determinista (corrección + repetición espaciada) / capa de IA (conversación, generación, feedback abierto) como restricción de arquitectura previa a la elección de stack.
- El registro de respuestas se define como fuente de verdad de cualquier indicador mostrado al alumno.

**Pendiente**
- Falta el documento completo de especificación; el material recibido solo incluía el resumen de fundamentos.
- Umbral de edad de consentimiento digital en España: verificar normativa vigente antes de diseñar el flujo parental.

## 2026-11-17 — Scaffold del stack

**Hecho**
- Stack aprobado por Ricardo: PWA con Next.js + TypeScript, Postgres en región UE, Zod en fronteras, motor de práctica como TS puro.
- `create-next-app` (plantilla vacía, App Router, `src/`, Tailwind, ESLint, npm): Next 16.4.6, React 19.3.0. Añadidos Zod 4 y Vitest 5.
- `eslint.config.mjs`: reglas de frontera `content ← engine ← ai/app`; en `engine` además se prohíben `Date.now()`, `new Date()` sin argumentos, `Math.random()` y `fetch`.
- `vitest.config.mts`: entorno `node`, `include: src/**/*.test.ts`, alias `@`.
- `tsconfig.json`: `noUncheckedIndexedAccess`. Script `typecheck` = `next typegen && tsc --noEmit`.
- `src/app`: `lang="es"`, página provisional, `manifest.ts`. Nombre provisional centralizado en `src/site.ts`.
- `CLAUDE.md` reescrito con comandos y arquitectura reales; importa `AGENTS.md`.

**Verificado**
- `npm run typecheck` → 0. `npm run lint` → 0. `npm run build` → OK, 3 rutas estáticas.
- Reglas de frontera probadas con archivos temporales (ya borrados): 9 violaciones detectadas, 0 falsos positivos.
- `npm test` → 1, "No test files found". No hay tests escritos.

**Decisiones**
- Fronteras de capa por lint y no por paquetes separados: un solo `package.json`, misma garantía, sin coste de monorepo.
- Determinismo del motor impuesto por lint: tiempo y azar entran como parámetros.
- Vitest sin jsdom ni Testing Library: el código a testear primero es lógica pura.
- Documentación de Next consultada en `node_modules/next/dist/docs/`; el MCP `context7` no estaba autenticado en la sesión.
- README de plantilla descartado.

**Pendiente**
- Proveedor de Postgres y capa de datos. Proveedor de IA. Algoritmo de repetición espaciada.
- PWA: iconos y service worker.
- Sin commits.

## 2026-11-17 — Primer slice de práctica (phrasal verbs)

**Hecho (TDD, cada test visto fallar por aserción antes de implementar)**
- `engine/grading.ts`: normalización (NFC, apóstrofo tipográfico, mayúsculas, espacios, puntuación final) y corrección estricta contra respuestas aceptadas.
- `engine/scheduling.ts`: Leitner 5 cajas; estado derivado del log de intentos.
- `content/items.ts`: esquema Zod del ítem de hueco, ids únicos, proyección pública sin respuestas. `content/phrasal-verbs.ts`: 10 ítems semilla.
- `app/practice`: Server Action `submitAttempt` + función pura `gradeItemAttempt`; componente cliente `PracticeSession`.

**Verificado**
- 79 tests verdes; typecheck, lint y build OK.
- Respuestas ausentes de `.next/static` y del HTML servido; solo en `.next/server`.
- E2E con Playwright en build de producción: fallo → solución + explicación; acierto con `"  Puts UP  with. "`; ítem fallado no se repite de inmediato; foco gestionado.
- No verificado en navegador: pantalla de "nada pendiente" (cubierta solo por tests de `nextItemId`) y rama de error de red.

**Decisiones**
- Corrección en servidor: las respuestas no viajan al cliente antes del intento.
- Hora del intento = hora del servidor (`gradedAt`). Motivo inicial: `react-hooks/purity` rechazaba `Date.now()` en el handler; se resolvió con diseño, no silenciando la regla.
- Retraso de 10 min tras un fallo para no convertir el repaso en reconocimiento.
- Sin `aria-live` en el feedback: el foco al encabezado ya lo anuncia.
- Respuestas del alumno fuera de los logs (minimización, posibles menores).

**Pendiente**
- Persistencia del log de intentos. Revisión docente del banco semilla. Favicon/iconos (404 en consola).
- Sin commits.
