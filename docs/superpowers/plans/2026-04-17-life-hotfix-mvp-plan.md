# Life Hotfix MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working iPhone PWA MVP of Life Hotfix with local-first persistence, rule-driven scoring, daily settlement, exchange flow, and the core pages defined in the approved product spec.

**Architecture:** Use a single React + TypeScript frontend app with explicit domain modules for rules, scoring, daily settlement, and persistence. Keep the app offline-capable and local-first through IndexedDB, expose domain services behind small pure functions, and make UI state thin so the scoring engine can be tested independently.

**Tech Stack:** Vite, React, TypeScript, Zustand, Dexie, React Router, Vitest, Testing Library, Playwright, vite-plugin-pwa

---

## File Structure

### App Shell and Tooling

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `index.html`
- Create: `public/manifest.webmanifest`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/router.tsx`
- Create: `src/app/providers.tsx`
- Create: `src/app/styles.css`

### Domain

- Create: `src/domain/types.ts`
- Create: `src/domain/rules/default-rules.ts`
- Create: `src/domain/scoring/score-event.ts`
- Create: `src/domain/scoring/apply-score-event.ts`
- Create: `src/domain/scoring/calculate-risk-status.ts`
- Create: `src/domain/settlement/settle-day.ts`
- Create: `src/domain/exchange/redeem-item.ts`
- Create: `src/domain/family/family-tasks.ts`

### Persistence and State

- Create: `src/data/db.ts`
- Create: `src/data/repositories/rules-repository.ts`
- Create: `src/data/repositories/events-repository.ts`
- Create: `src/data/repositories/daily-summary-repository.ts`
- Create: `src/state/use-app-store.ts`

### Features and Pages

- Create: `src/features/home/home-page.tsx`
- Create: `src/features/today/today-page.tsx`
- Create: `src/features/family/family-page.tsx`
- Create: `src/features/exchange/exchange-page.tsx`
- Create: `src/features/ledger/ledger-page.tsx`
- Create: `src/features/rules/rules-page.tsx`
- Create: `src/features/shared/page-shell.tsx`
- Create: `src/features/shared/score-chip.tsx`
- Create: `src/features/shared/risk-banner.tsx`

### Tests

- Create: `src/domain/scoring/apply-score-event.test.ts`
- Create: `src/domain/scoring/calculate-risk-status.test.ts`
- Create: `src/domain/settlement/settle-day.test.ts`
- Create: `src/domain/exchange/redeem-item.test.ts`
- Create: `src/state/use-app-store.test.ts`
- Create: `tests/e2e/smoke.spec.ts`

## Task 1: Bootstrap the PWA App Shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `index.html`
- Create: `public/manifest.webmanifest`, `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/app/providers.tsx`, `src/app/styles.css`

- [ ] **Step 1: Write the failing smoke test for the app shell**

```tsx
// src/app/App.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders the main navigation", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "今日执行" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "兑换中心" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/App.test.tsx`
Expected: FAIL because the Vite app and test runner do not exist yet.

- [ ] **Step 3: Create the initial toolchain and app shell**

```json
// package.json
{
  "name": "life-hotfix",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "dexie": "^4.0.8",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.0",
    "zustand": "^5.0.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.4.1",
    "jsdom": "^25.0.1",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vite-plugin-pwa": "^1.0.0",
    "vitest": "^3.1.4"
  }
}
```

```tsx
// src/app/App.tsx
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "首页" },
  { to: "/today", label: "今日执行" },
  { to: "/family", label: "家庭" },
  { to: "/exchange", label: "兑换中心" },
  { to: "/ledger", label: "账本" },
  { to: "/rules", label: "规则" },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Life Hotfix</h1>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/App.test.tsx`
Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts .gitignore index.html public src/app src/main.tsx
git commit -m "feat: bootstrap life hotfix pwa shell"
```

## Task 2: Implement the Domain Types and Default Rules

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/rules/default-rules.ts`
- Test: `src/domain/scoring/apply-score-event.test.ts`

- [ ] **Step 1: Write the failing test for default rule coverage**

```ts
// src/domain/scoring/apply-score-event.test.ts
import { defaultRules } from "../rules/default-rules";

test("contains core default rules from the approved spec", () => {
  const ids = defaultRules.map((rule) => rule.id);

  expect(ids).toContain("must-ai-study-30m");
  expect(ids).toContain("must-plank");
  expect(ids).toContain("vice-late-sleep");
  expect(ids).toContain("vice-oil-burst");
  expect(ids).toContain("redeem-game-30m");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/scoring/apply-score-event.test.ts`
Expected: FAIL because the domain types and rule list do not exist yet.

- [ ] **Step 3: Define the types and default rules**

```ts
// src/domain/types.ts
export type RuleKind = "must" | "bonus" | "vice" | "redeem" | "family-task" | "family-companion";

export type ScoreDirection = "gain" | "loss" | "spend";

export type RiskStatus = "safe" | "warning" | "danger";

export interface RuleStep {
  threshold: number;
  score: number;
  label: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  kind: RuleKind;
  unit: "count" | "minute" | "money" | "time-slot";
  steps?: RuleStep[];
  score?: number;
  dailyCap?: number;
  cooldownDays?: number;
  enabledByDefault: boolean;
  privateLabel?: boolean;
}
```

```ts
// src/domain/rules/default-rules.ts
import type { RuleDefinition } from "../types";

export const defaultRules: RuleDefinition[] = [
  { id: "must-ai-study-30m", name: "AI 学习 30 分钟", kind: "must", unit: "minute", score: 6, enabledByDefault: true },
  { id: "must-plank", name: "平板支撑 3 x 30s", kind: "must", unit: "count", score: 2, enabledByDefault: true },
  { id: "must-wall-sit", name: "靠墙静蹲 3 x 30s", kind: "must", unit: "count", score: 2, enabledByDefault: true },
  { id: "must-squat", name: "深蹲 3 x 15", kind: "must", unit: "count", score: 2, enabledByDefault: true },
  { id: "must-push-up", name: "站姿俯卧撑 3 组", kind: "must", unit: "count", score: 2, enabledByDefault: true },
  { id: "must-meditation-5m", name: "冥想 5 分钟", kind: "must", unit: "minute", score: 3, enabledByDefault: true },
  { id: "vice-late-sleep", name: "熬夜", kind: "vice", unit: "time-slot", enabledByDefault: true, steps: [
    { threshold: 2230, score: -2, label: "22:30-22:59" },
    { threshold: 2300, score: -4, label: "23:00-23:29" },
    { threshold: 2330, score: -6, label: "23:30-23:59" },
    { threshold: 2400, score: -9, label: "00:00-00:29" },
    { threshold: 2430, score: -13, label: "00:30-00:59" },
    { threshold: 2500, score: -18, label: "01:00+" },
  ]},
  { id: "vice-game-time", name: "打游戏", kind: "vice", unit: "minute", enabledByDefault: true, steps: [
    { threshold: 30, score: 0, label: "<=30 分钟" },
    { threshold: 60, score: -2, label: "30-60 分钟" },
    { threshold: 120, score: -5, label: "1-2 小时" },
    { threshold: 240, score: -9, label: "2-4 小时" },
    { threshold: 9999, score: -15, label: "4 小时以上" },
  ]},
  { id: "vice-oil-burst", name: "油冲", kind: "redeem", unit: "count", score: 35, cooldownDays: 3, enabledByDefault: true, privateLabel: true },
  { id: "redeem-game-30m", name: "游戏 30 分钟", kind: "redeem", unit: "count", score: 6, enabledByDefault: true },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/scoring/apply-score-event.test.ts`
Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/rules/default-rules.ts src/domain/scoring/apply-score-event.test.ts
git commit -m "feat: add default life hotfix rules"
```

## Task 3: Implement Score Event Application and Exchange Guardrails

**Files:**
- Create: `src/domain/scoring/score-event.ts`
- Create: `src/domain/scoring/apply-score-event.ts`
- Create: `src/domain/exchange/redeem-item.ts`
- Test: `src/domain/scoring/apply-score-event.test.ts`, `src/domain/exchange/redeem-item.test.ts`

- [ ] **Step 1: Write the failing tests for score application**

```ts
// src/domain/exchange/redeem-item.test.ts
import { redeemItem } from "./redeem-item";

test("prevents redemption when total score is not enough", () => {
  const result = redeemItem({ totalScore: 5, cost: 6, cooldownSatisfied: true });
  expect(result.ok).toBe(false);
  expect(result.reason).toBe("INSUFFICIENT_SCORE");
});

test("caps severe loss at zero and records a violation flag", () => {
  const result = redeemItem({ totalScore: 20, cost: 50, cooldownSatisfied: false, forceViolation: true });
  expect(result.ok).toBe(false);
  expect(result.nextTotalScore).toBe(0);
  expect(result.violationFlag).toBe(true);
});
```

```ts
// append to src/domain/scoring/apply-score-event.test.ts
import { applyScoreEvent } from "./apply-score-event";

test("applies a must completion as score gain", () => {
  const result = applyScoreEvent({ currentDayScore: 0, currentTotalScore: 10, delta: 6, direction: "gain" });
  expect(result.dayScore).toBe(6);
  expect(result.totalScore).toBe(16);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/scoring/apply-score-event.test.ts src/domain/exchange/redeem-item.test.ts`
Expected: FAIL because the scoring helpers do not exist yet.

- [ ] **Step 3: Implement the minimal score and redemption logic**

```ts
// src/domain/scoring/score-event.ts
import type { ScoreDirection } from "../types";

export interface ScoreEventInput {
  currentDayScore: number;
  currentTotalScore: number;
  delta: number;
  direction: ScoreDirection;
}
```

```ts
// src/domain/scoring/apply-score-event.ts
import type { ScoreEventInput } from "./score-event";

export function applyScoreEvent(input: ScoreEventInput) {
  const signedDelta = input.direction === "loss" || input.direction === "spend" ? -Math.abs(input.delta) : Math.abs(input.delta);
  const nextDay = input.currentDayScore + signedDelta;
  const nextTotal = Math.max(0, input.currentTotalScore + signedDelta);
  const violationFlag = input.currentTotalScore + signedDelta < 0;

  return {
    dayScore: nextDay,
    totalScore: nextTotal,
    violationFlag,
  };
}
```

```ts
// src/domain/exchange/redeem-item.ts
export function redeemItem(input: {
  totalScore: number;
  cost: number;
  cooldownSatisfied: boolean;
  forceViolation?: boolean;
}) {
  if (input.forceViolation) {
    return {
      ok: false,
      reason: "FORCED_VIOLATION",
      nextTotalScore: Math.max(0, input.totalScore - input.cost),
      violationFlag: true,
    };
  }

  if (!input.cooldownSatisfied) {
    return { ok: false, reason: "COOLDOWN_ACTIVE", nextTotalScore: input.totalScore, violationFlag: false };
  }

  if (input.totalScore < input.cost) {
    return { ok: false, reason: "INSUFFICIENT_SCORE", nextTotalScore: input.totalScore, violationFlag: false };
  }

  return { ok: true, reason: null, nextTotalScore: input.totalScore - input.cost, violationFlag: false };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/scoring/apply-score-event.test.ts src/domain/exchange/redeem-item.test.ts`
Expected: PASS with all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/scoring src/domain/exchange
git commit -m "feat: implement score and redeem guardrails"
```

## Task 4: Implement Daily Settlement and Risk Calculation

**Files:**
- Create: `src/domain/scoring/calculate-risk-status.ts`
- Create: `src/domain/settlement/settle-day.ts`
- Test: `src/domain/scoring/calculate-risk-status.test.ts`, `src/domain/settlement/settle-day.test.ts`

- [ ] **Step 1: Write the failing tests for settlement**

```ts
// src/domain/settlement/settle-day.test.ts
import { settleDay } from "./settle-day";

test("deducts all uncompleted must rules during settlement", () => {
  const result = settleDay({
    currentDayScore: 6,
    currentTotalScore: 20,
    pendingMustLosses: [6, 2, 3],
  });

  expect(result.dayScore).toBe(-5);
  expect(result.totalScore).toBe(9);
});
```

```ts
// src/domain/scoring/calculate-risk-status.test.ts
import { calculateRiskStatus } from "./calculate-risk-status";

test("returns danger when projected total score reaches zero", () => {
  expect(calculateRiskStatus({ totalScore: 8, pendingLoss: 8, projectedViceLoss: 4 })).toBe("danger");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/settlement/settle-day.test.ts src/domain/scoring/calculate-risk-status.test.ts`
Expected: FAIL because the settlement and risk functions do not exist yet.

- [ ] **Step 3: Implement the settlement and risk engine**

```ts
// src/domain/settlement/settle-day.ts
export function settleDay(input: {
  currentDayScore: number;
  currentTotalScore: number;
  pendingMustLosses: number[];
}) {
  const totalLoss = input.pendingMustLosses.reduce((sum, value) => sum + value, 0);
  const nextDay = input.currentDayScore - totalLoss;
  const nextTotal = Math.max(0, input.currentTotalScore - totalLoss);

  return {
    dayScore: nextDay,
    totalScore: nextTotal,
    severeViolation: input.currentTotalScore - totalLoss < 0,
  };
}
```

```ts
// src/domain/scoring/calculate-risk-status.ts
import type { RiskStatus } from "../types";

export function calculateRiskStatus(input: {
  totalScore: number;
  pendingLoss: number;
  projectedViceLoss: number;
}): RiskStatus {
  const projected = input.totalScore - input.pendingLoss - input.projectedViceLoss;

  if (projected <= 0) return "danger";
  if (projected <= 10) return "warning";
  return "safe";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/domain/settlement/settle-day.test.ts src/domain/scoring/calculate-risk-status.test.ts`
Expected: PASS with all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/scoring/calculate-risk-status.ts src/domain/settlement/settle-day.ts src/domain/scoring/calculate-risk-status.test.ts src/domain/settlement/settle-day.test.ts
git commit -m "feat: add settlement and risk calculation"
```

## Task 5: Add IndexedDB Persistence and App Store State

**Files:**
- Create: `src/data/db.ts`
- Create: `src/data/repositories/rules-repository.ts`
- Create: `src/data/repositories/events-repository.ts`
- Create: `src/data/repositories/daily-summary-repository.ts`
- Create: `src/state/use-app-store.ts`
- Test: `src/state/use-app-store.test.ts`

- [ ] **Step 1: Write the failing store test**

```ts
// src/state/use-app-store.test.ts
import { useAppStore } from "./use-app-store";

test("hydrates defaults on first launch", async () => {
  await useAppStore.getState().bootstrap();
  expect(useAppStore.getState().rules.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/use-app-store.test.ts`
Expected: FAIL because the database and app store do not exist yet.

- [ ] **Step 3: Implement local persistence and the store**

```ts
// src/data/db.ts
import Dexie, { type Table } from "dexie";
import type { RuleDefinition } from "../domain/types";

export interface PersistedEvent {
  id?: number;
  ruleId: string;
  scoreDelta: number;
  happenedAt: string;
  note?: string;
}

export interface DailySummary {
  date: string;
  dayScore: number;
  totalScore: number;
  riskStatus: "safe" | "warning" | "danger";
}

class LifeHotfixDb extends Dexie {
  rules!: Table<RuleDefinition, string>;
  events!: Table<PersistedEvent, number>;
  dailySummaries!: Table<DailySummary, string>;

  constructor() {
    super("life-hotfix");
    this.version(1).stores({
      rules: "id,kind,enabledByDefault",
      events: "++id,ruleId,happenedAt",
      dailySummaries: "date",
    });
  }
}

export const db = new LifeHotfixDb();
```

```ts
// src/state/use-app-store.ts
import { create } from "zustand";
import { defaultRules } from "../domain/rules/default-rules";

type AppState = {
  rules: typeof defaultRules;
  bootstrap: () => Promise<void>;
};

export const useAppStore = create<AppState>((set) => ({
  rules: [],
  bootstrap: async () => {
    set({ rules: defaultRules });
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/state/use-app-store.test.ts`
Expected: PASS with one passing test.

- [ ] **Step 5: Commit**

```bash
git add src/data src/state/use-app-store.ts src/state/use-app-store.test.ts
git commit -m "feat: add local persistence and app store bootstrap"
```

## Task 6: Build the Core Pages and Navigation Flows

**Files:**
- Create: `src/features/shared/page-shell.tsx`, `src/features/shared/score-chip.tsx`, `src/features/shared/risk-banner.tsx`
- Create: `src/features/home/home-page.tsx`
- Create: `src/features/today/today-page.tsx`
- Create: `src/features/family/family-page.tsx`
- Create: `src/features/exchange/exchange-page.tsx`
- Create: `src/features/ledger/ledger-page.tsx`
- Create: `src/features/rules/rules-page.tsx`
- Modify: `src/app/router.tsx`, `src/app/App.tsx`, `src/app/styles.css`
- Test: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing end-to-end smoke test**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("user can navigate through the core MVP pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Life Hotfix")).toBeVisible();
  await page.getByRole("link", { name: "今日执行" }).click();
  await expect(page.getByRole("heading", { name: "今日执行" })).toBeVisible();
  await page.getByRole("link", { name: "家庭" }).click();
  await expect(page.getByRole("heading", { name: "家庭记录" })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL because the routed pages do not exist yet.

- [ ] **Step 3: Build the minimal UI pages**

```tsx
// src/features/home/home-page.tsx
export default function HomePage() {
  return (
    <section>
      <h2>今日总览</h2>
      <p>展示日积分、总积分、风险等级和今日底线任务。</p>
    </section>
  );
}
```

```tsx
// src/features/today/today-page.tsx
export default function TodayPage() {
  return (
    <section>
      <h2>今日执行</h2>
      <p>记录必做项、奖励项、放纵项和家庭事件。</p>
    </section>
  );
}
```

```tsx
// src/features/family/family-page.tsx
export default function FamilyPage() {
  return (
    <section>
      <h2>家庭记录</h2>
      <p>家务做了就加分，陪伴做了就加分，不做默认不扣分。</p>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS with one passing browser test.

- [ ] **Step 5: Commit**

```bash
git add src/features src/app/router.tsx src/app/App.tsx src/app/styles.css tests/e2e/smoke.spec.ts
git commit -m "feat: add core mvp page flows"
```

## Task 7: Wire Daily Actions, Exchange, and Ledger End-to-End

**Files:**
- Modify: `src/features/home/home-page.tsx`
- Modify: `src/features/today/today-page.tsx`
- Modify: `src/features/family/family-page.tsx`
- Create: `src/features/exchange/exchange-page.tsx`
- Create: `src/features/ledger/ledger-page.tsx`
- Create: `src/features/rules/rules-page.tsx`
- Modify: `src/state/use-app-store.ts`
- Test: `tests/e2e/smoke.spec.ts`, `src/state/use-app-store.test.ts`

- [ ] **Step 1: Write the failing store test for action flow**

```ts
// append to src/state/use-app-store.test.ts
test("records a must completion and updates the score summary", async () => {
  await useAppStore.getState().bootstrap();
  await useAppStore.getState().recordGain({ ruleId: "must-ai-study-30m", delta: 6 });

  expect(useAppStore.getState().dayScore).toBe(6);
  expect(useAppStore.getState().totalScore).toBe(6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/state/use-app-store.test.ts`
Expected: FAIL because score recording actions are not in the store yet.

- [ ] **Step 3: Implement store actions and connect the pages**

```ts
// append shape in src/state/use-app-store.ts
type AppState = {
  rules: typeof defaultRules;
  dayScore: number;
  totalScore: number;
  recordGain: (input: { ruleId: string; delta: number }) => Promise<void>;
};

recordGain: async ({ delta }) =>
  set((state) => ({
    dayScore: state.dayScore + delta,
    totalScore: state.totalScore + delta,
  })),
```

```tsx
// inside src/features/today/today-page.tsx
import { useAppStore } from "../../state/use-app-store";

export default function TodayPage() {
  const rules = useAppStore((state) => state.rules.filter((rule) => rule.kind === "must"));
  const recordGain = useAppStore((state) => state.recordGain);

  return (
    <section>
      <h2>今日执行</h2>
      <ul>
        {rules.map((rule) => (
          <li key={rule.id}>
            <span>{rule.name}</span>
            <button onClick={() => void recordGain({ ruleId: rule.id, delta: Math.abs(rule.score ?? 0) })}>
              完成
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/state/use-app-store.test.ts`
Expected: PASS with all store tests green.

Run: `npm run build`
Expected: PASS with a successful production build for the MVP shell.

- [ ] **Step 5: Commit**

```bash
git add src/state/use-app-store.ts src/features/home/home-page.tsx src/features/today/today-page.tsx src/features/family/family-page.tsx src/features/exchange/exchange-page.tsx src/features/ledger/ledger-page.tsx src/features/rules/rules-page.tsx src/state/use-app-store.test.ts
git commit -m "feat: wire mvp scoring and record flows"
```

## Task 8: Final Product Hardening for PWA Delivery

**Files:**
- Modify: `public/manifest.webmanifest`
- Modify: `vite.config.ts`
- Modify: `src/app/styles.css`
- Modify: `README.md`
- Test: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing e2e assertion for installable metadata**

```ts
// append to tests/e2e/smoke.spec.ts
test("serves a web app manifest", async ({ page }) => {
  const response = await page.goto("/manifest.webmanifest");
  expect(response?.ok()).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL if the manifest is missing or not wired through Vite.

- [ ] **Step 3: Finalize PWA config and operator docs**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Life Hotfix",
        short_name: "Hotfix",
        display: "standalone",
        start_url: "/",
        theme_color: "#f6f3ea",
        background_color: "#f6f3ea",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
```

```md
// README.md
# Life Hotfix

## MVP

- Local-first iPhone PWA
- Daily score, total score, settlement, redemption, family recording

## Commands

- `npm install`
- `npm run dev`
- `npm test`
- `npm run test:e2e`
- `npm run build`
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS with manifest coverage included.

Run: `npm run build`
Expected: PASS and emit a production-ready PWA bundle.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts public/manifest.webmanifest README.md tests/e2e/smoke.spec.ts
git commit -m "feat: finalize pwa delivery setup"
```

## Self-Review

### Spec coverage

- Personal single-user, local-first PWA: Tasks 1, 5, 8
- Core scoring model with must/bonus/vice/redeem: Tasks 2, 3
- No-negative total score and severe violation behavior: Tasks 3, 4
- Daily settlement and risk warnings: Task 4
- Family records as opt-in gains, not mandatory debt: Tasks 2, 6, 7
- Core pages from the spec: Tasks 1, 6, 7
- Rules center and ledger shell: Tasks 6, 7
- PWA installability: Task 8

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” markers remain.
- Each task includes exact file paths, commands, and concrete code snippets.

### Type consistency

- `RuleDefinition`, `RiskStatus`, and `AppState` names stay consistent across tasks.
- `recordGain`, `settleDay`, `redeemItem`, and `calculateRiskStatus` are introduced before later usage.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-life-hotfix-mvp-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
