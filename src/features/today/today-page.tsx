import { useEffect, useMemo, useState } from "react";
import type { RuleDefinition, RuleStep } from "../../domain/types";
import { useAppStore } from "../../state/use-app-store";

type RowStatus = "done" | "missed";

type DailyItem = {
  id: string;
  name: string;
  unitLabel: string;
  score: number;
};

const dailyItemSpecs = [
  { ruleId: "must-ai-study-30m", name: "学习", unitLabel: "每 30 分钟" },
  { ruleId: "must-meditation-5m", name: "冥想", unitLabel: "每 5 分钟" },
  { ruleId: "must-plank", name: "平板支撑", unitLabel: "每 3 x 30s" },
  { ruleId: "must-standing-pushup", name: "站姿俯卧撑", unitLabel: "每 3 组" },
  { ruleId: "must-wall-sit", name: "靠墙静卧", unitLabel: "每 3 x 30s" },
  { ruleId: "must-squat", name: "深蹲", unitLabel: "每 3 x 15" },
  { ruleId: "bonus-swim-1km", name: "游泳", unitLabel: "每 1 公里" },
] as const;

const viceNameOverrides: Record<string, string> = {
  "vice-late-sleep": "熬夜",
  "vice-game-overtime": "游戏超时",
  "vice-junk-food": "垃圾饮食",
  "vice-mobile-game-spend": "手游氪金",
  "vice-phone-scroll": "刷手机",
  "vice-oil-burst-forced": "强制油冲",
  "vice-family-emotion": "在家不耐烦，发脾气",
};

function getRuleScore(rule: RuleDefinition | undefined): number | null {
  return rule && "score" in rule ? rule.score : null;
}

function getPositiveQuantity(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatSigned(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

function findRule(rules: RuleDefinition[], ruleId: string): RuleDefinition | undefined {
  return rules.find((rule) => rule.id === ruleId);
}

function getStep(rule: RuleDefinition, stepIndex: number): RuleStep | null {
  if (!("steps" in rule)) {
    return null;
  }

  return rule.steps[stepIndex] ?? null;
}

function getViceName(rule: RuleDefinition): string {
  return viceNameOverrides[rule.id] ?? rule.name;
}

function QuantityControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (quantity: number) => void;
}) {
  const [draftValue, setDraftValue] = useState(`${value}`);

  useEffect(() => {
    setDraftValue(`${value}`);
  }, [value]);

  function handleChange(nextValue: string) {
    setDraftValue(nextValue);

    if (nextValue === "") {
      return;
    }

    onChange(getPositiveQuantity(nextValue));
  }

  function handleBlur() {
    if (draftValue === "") {
      setDraftValue(`${value}`);
    }
  }

  return (
    <div className="quantity-control">
      <input
        aria-label={`${label}数量`}
        className="table-number-input table-number-input--compact"
        min={1}
        type="number"
        value={draftValue}
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.target.value)}
      />
    </div>
  );
}

function DailyItemsTable({
  items,
  quantities,
  statuses,
  onQuantityChange,
  onComplete,
  onMiss,
}: {
  items: DailyItem[];
  quantities: Record<string, number>;
  statuses: Record<string, RowStatus>;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onComplete: (item: DailyItem) => void;
  onMiss: (itemId: string) => void;
}) {
  return (
    <section className="sheet-panel">
      <h3>每日项</h3>
      <div className="table-wrap table-wrap--no-scroll">
        <table className="data-table data-table--compact" aria-label="今日每日项">
          <thead>
            <tr>
              <th>项目</th>
              <th>单位</th>
              <th>数量</th>
              <th>本次积分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const quantity = quantities[item.id] ?? 1;
              const status = statuses[item.id];
              const score = item.score * quantity;

              return (
                <tr
                  key={item.id}
                  className={status === "done" ? "row-done" : status === "missed" ? "row-muted" : undefined}
                >
                  <td>{item.name}</td>
                  <td>{item.unitLabel}</td>
                  <td>
                    <QuantityControl
                      label={item.name}
                      value={quantity}
                      onChange={(nextQuantity) => onQuantityChange(item.id, nextQuantity)}
                    />
                  </td>
                  <td>{formatSigned(score)}</td>
                  <td>
                    {status ? (
                      <button
                        type="button"
                        className={status === "done" ? "choice-button choice-button--active" : "choice-button choice-button--danger"}
                      >
                        {status === "done" ? "已完成" : "未完成"}
                      </button>
                    ) : (
                      <div className="choice-buttons choice-buttons--inline" aria-label={`${item.name}操作`}>
                        <button
                          type="button"
                          className="choice-button"
                          onClick={() => onComplete(item)}
                        >
                          完成
                        </button>
                        <button
                          type="button"
                          className="choice-button choice-button--muted"
                          onClick={() => onMiss(item.id)}
                        >
                          未完成
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeductionTable({
  rules,
  quantities,
  stepIndexes,
  statuses,
  onQuantityChange,
  onStepChange,
  onDeduct,
}: {
  rules: RuleDefinition[];
  quantities: Record<string, number>;
  stepIndexes: Record<string, number>;
  statuses: Record<string, RowStatus>;
  onQuantityChange: (ruleId: string, quantity: number) => void;
  onStepChange: (ruleId: string, stepIndex: number) => void;
  onDeduct: (rule: RuleDefinition) => void;
}) {
  return (
    <section className="sheet-panel sheet-panel--wide">
      <h3>扣分项</h3>
      <div className="table-wrap table-wrap--no-scroll">
        <table className="data-table data-table--compact" aria-label="今日扣分项">
          <thead>
            <tr>
              <th>扣分项</th>
              <th>档位</th>
              <th>数量</th>
              <th>本次扣分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => {
              const name = getViceName(rule);
              const quantity = quantities[rule.id] ?? 1;
              const stepIndex = stepIndexes[rule.id] ?? 0;
              const step = getStep(rule, stepIndex);
              const flatScore = getRuleScore(rule);
              const score = (step?.score ?? flatScore ?? 0) * quantity;
              const status = statuses[rule.id];

              return (
                <tr key={rule.id} className={status === "done" ? "row-muted" : undefined}>
                  <td>{name}</td>
                  <td>
                    {"steps" in rule ? (
                      <select
                        aria-label={`${name}档位`}
                        className="table-number-input table-select-input"
                        value={stepIndex}
                        onChange={(event) => onStepChange(rule.id, Number.parseInt(event.target.value, 10))}
                      >
                        {rule.steps.map((item, index) => (
                          <option key={`${rule.id}-${item.label}`} value={index}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "固定扣分"
                    )}
                  </td>
                  <td>
                    <QuantityControl
                      label={name}
                      value={quantity}
                      onChange={(nextQuantity) => onQuantityChange(rule.id, nextQuantity)}
                    />
                  </td>
                  <td>{score}</td>
                  <td>
                    {status === "done" ? (
                      <button type="button" className="choice-button choice-button--danger">
                        已扣分
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="choice-button choice-button--danger"
                        onClick={() => onDeduct(rule)}
                      >
                        扣分
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TodayPage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const rules = useAppStore((state) => state.rules);
  const recordCustomScore = useAppStore((state) => state.recordCustomScore);
  const [message, setMessage] = useState("");
  const [dailyQuantities, setDailyQuantities] = useState<Record<string, number>>({});
  const [deductionQuantities, setDeductionQuantities] = useState<Record<string, number>>({});
  const [deductionSteps, setDeductionSteps] = useState<Record<string, number>>({});
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, RowStatus>>({});
  const [deductionStatuses, setDeductionStatuses] = useState<Record<string, RowStatus>>({});

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const dailyItems = useMemo(
    () => {
      const presetItems = dailyItemSpecs.flatMap((spec) => {
        const score = getRuleScore(findRule(rules, spec.ruleId));

        if (score === null) {
          return [];
        }

        return [{ id: spec.ruleId, name: spec.name, unitLabel: spec.unitLabel, score }];
      });
      const customItems = rules
        .filter((rule) => rule.id.startsWith("custom-") && (rule.kind === "must" || rule.kind === "bonus") && "score" in rule)
        .map((rule) => ({
          id: rule.id,
          name: rule.name,
          unitLabel: rule.unit === "minute" ? "每 1 分钟" : rule.unit === "money" ? "每 1 元" : "每 1 次",
          score: rule.score,
        }));

      return [...presetItems, ...customItems];
    },
    [rules],
  );

  const deductionRules = useMemo(
    () => rules.filter((rule) => rule.kind === "vice" && rule.id !== "vice-phone-scroll"),
    [rules],
  );

  async function handleCompleteDaily(item: DailyItem) {
    const quantity = dailyQuantities[item.id] ?? 1;
    const result = await recordCustomScore({
      itemId: `today-${item.id}-qty-${quantity}`,
      scoreDelta: item.score * quantity,
    });

    if (!result.ok) {
      setMessage("记录失败，请检查数量。");
      return;
    }

    setDailyStatuses((current) => ({ ...current, [item.id]: "done" }));
    setMessage("已记录完成。");
  }

  function handleMissDaily(itemId: string) {
    setDailyStatuses((current) => ({ ...current, [itemId]: "missed" }));
    setMessage("已标记未完成。");
  }

  async function handleDeduct(rule: RuleDefinition) {
    const quantity = deductionQuantities[rule.id] ?? 1;
    const stepIndex = deductionSteps[rule.id] ?? 0;

    if ("steps" in rule) {
      const step = getStep(rule, stepIndex);

      if (!step) {
        setMessage("记录失败，请检查扣分档位。");
        return;
      }

      const result = await recordCustomScore({
        itemId: `today-deduction-${rule.id}-step-${stepIndex}-qty-${quantity}`,
        scoreDelta: step.score * quantity,
      });

      if (!result.ok) {
        setMessage("记录失败，请检查扣分档位。");
        return;
      }
    } else {
      const score = getRuleScore(rule);

      if (score === null) {
        setMessage("记录失败，请检查扣分规则。");
        return;
      }

      const result = await recordCustomScore({
        itemId: `today-deduction-${rule.id}-qty-${quantity}`,
        scoreDelta: score * quantity,
      });

      if (!result.ok) {
        setMessage("记录失败，请检查扣分数量。");
        return;
      }
    }

    setDeductionStatuses((current) => ({ ...current, [rule.id]: "done" }));
    setMessage("已记录扣分。");
  }

  return (
    <section className="page-card page-card--wide">
      <div>
        <p className="eyebrow">Daily log</p>
        <h2>今日执行</h2>
      </div>
      <p className="page-copy">按实际完成数量记录每日项；扣分项按档位和数量一次登记，操作栏会保留本次点击结果。</p>
      {message ? <p className="status-message">{message}</p> : null}

      <div className="execution-stack">
        <DailyItemsTable
          items={dailyItems}
          quantities={dailyQuantities}
          statuses={dailyStatuses}
          onQuantityChange={(itemId, quantity) =>
            setDailyQuantities((current) => ({ ...current, [itemId]: quantity }))
          }
          onComplete={(item) => void handleCompleteDaily(item)}
          onMiss={handleMissDaily}
        />

        <DeductionTable
          rules={deductionRules}
          quantities={deductionQuantities}
          stepIndexes={deductionSteps}
          statuses={deductionStatuses}
          onQuantityChange={(ruleId, quantity) =>
            setDeductionQuantities((current) => ({ ...current, [ruleId]: quantity }))
          }
          onStepChange={(ruleId, stepIndex) =>
            setDeductionSteps((current) => ({ ...current, [ruleId]: Math.max(0, stepIndex) }))
          }
          onDeduct={(rule) => void handleDeduct(rule)}
        />
      </div>
    </section>
  );
}
