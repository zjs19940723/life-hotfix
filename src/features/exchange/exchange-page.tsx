import { useEffect, useMemo, useState } from "react";
import type { RuleDefinition } from "../../domain/types";
import { useAppStore } from "../../state/use-app-store";

const redeemReasonCopy = {
  INSUFFICIENT_SCORE: "总积分不足",
  COOLDOWN_ACTIVE: "冷却中",
  INVALID_RULE_KIND: "不可兑换",
  RULE_NOT_FOUND: "未找到",
  DAILY_CAP_REACHED: "已达上限",
  ALREADY_COMPLETED_TODAY: "今天已处理",
  INVALID_STEP: "档位无效",
  null: "可兑换",
} as const;

type ExchangeTool = {
  id: string;
  ruleId?: string;
  name: string;
  unitLabel: string;
  resultUnit: string;
  pointsPerUnit: number;
  defaultUnits: number;
};

const exchangeTools: ExchangeTool[] = [
  { id: "game-time", ruleId: "redeem-game-30m", name: "游戏时间", unitLabel: "每 30 分钟", resultUnit: "分钟", pointsPerUnit: 6, defaultUnits: 1 },
  { id: "mobile-game", ruleId: "redeem-mobile-game-30", name: "手游氪金额度", unitLabel: "每 50 元", resultUnit: "元", pointsPerUnit: 22, defaultUnits: 1 },
  { id: "oil-burst", ruleId: "redeem-oil-burst", name: "油冲次数", unitLabel: "每 1 次", resultUnit: "次", pointsPerUnit: 35, defaultUnits: 1 },
  { id: "figure", ruleId: "redeem-figure-blindbox-50", name: "手办额度", unitLabel: "每 50 元", resultUnit: "元", pointsPerUnit: 35, defaultUnits: 1 },
  { id: "shopping", ruleId: "redeem-shopping-50", name: "购物额度", unitLabel: "每 50 元", resultUnit: "元", pointsPerUnit: 30, defaultUnits: 1 },
];

function getRedeemAmount(tool: ExchangeTool, units: number): string {
  if (tool.id === "game-time") {
    return `${units * 30} ${tool.resultUnit}`;
  }

  if (tool.id === "oil-burst") {
    return `${units} ${tool.resultUnit}`;
  }

  return `${units * 50} ${tool.resultUnit}`;
}

function getPositiveQuantity(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function hasSteps(rule: RuleDefinition): rule is RuleDefinition & { steps: readonly { label: string; score: number }[] } {
  return "steps" in rule;
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
        type="number"
        min="1"
        step="1"
        value={draftValue}
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.target.value)}
      />
    </div>
  );
}

export function ExchangePage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const rules = useAppStore((state) => state.rules);
  const totalScore = useAppStore((state) => state.totalScore);
  const redeemCustom = useAppStore((state) => state.redeemCustom);
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(exchangeTools.map((tool) => [tool.id, tool.defaultUnits])),
  );

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const rows = useMemo(
    () => {
      const presetRows = exchangeTools.map((tool) => {
        const ruleScore =
          tool.ruleId && "score" in (rules.find((rule) => rule.id === tool.ruleId) ?? {})
            ? (rules.find((rule) => rule.id === tool.ruleId) as { score: number }).score
            : tool.pointsPerUnit;
        const units = Math.max(1, counts[tool.id] ?? tool.defaultUnits);
        const cost = units * ruleScore;

        return {
          ...tool,
          pointsPerUnit: ruleScore,
          units,
          cost,
          amount: getRedeemAmount(tool, units),
          afterScore: Math.max(0, totalScore - cost),
          disabled: totalScore < cost,
        };
      });
      const customRows = rules
        .filter((rule) => rule.id.startsWith("custom-") && rule.kind === "redeem")
        .flatMap((rule) => {
          if (hasSteps(rule)) {
            return rule.steps.map((step, index) => {
              const rowId = `${rule.id}-step-${index}`;
              const units = Math.max(1, counts[rowId] ?? 1);
              const cost = units * Math.abs(step.score);

              return {
                id: rowId,
                name: `${rule.name} - ${step.label}`,
                unitLabel: "挡位",
                resultUnit: "档",
                pointsPerUnit: Math.abs(step.score),
                defaultUnits: 1,
                units,
                cost,
                amount: step.label,
                afterScore: Math.max(0, totalScore - cost),
                disabled: totalScore < cost,
              };
            });
          }

          if (!("score" in rule)) {
            return [];
          }

          const units = Math.max(1, counts[rule.id] ?? 1);
          const cost = units * rule.score;

          return [{
            id: rule.id,
            name: rule.name,
            unitLabel: rule.unit === "minute" ? "每 1 分钟" : rule.unit === "money" ? "每 1 元" : "每 1 次",
            resultUnit: rule.unit === "minute" ? "分钟" : rule.unit === "money" ? "元" : "次",
            pointsPerUnit: rule.score,
            defaultUnits: 1,
            units,
            cost,
            amount: `${units} ${rule.unit === "minute" ? "分钟" : rule.unit === "money" ? "元" : "次"}`,
            afterScore: Math.max(0, totalScore - cost),
            disabled: totalScore < cost,
          }];
        });

      return [...presetRows, ...customRows];
    },
    [counts, rules, totalScore],
  );

  async function handleRedeem(itemId: string, cost: number) {
    const result = await redeemCustom({ itemId, cost });
    setMessage(result.ok ? "兑换已记录，总积分已扣减。" : redeemReasonCopy[result.reason]);
  }

  return (
    <section className="page-card page-card--wide">
      <div>
        <p className="eyebrow">Exchange</p>
        <h2>兑换中心</h2>
      </div>
      <p className="page-copy">
        当前总积分：<strong>{totalScore}</strong>。按单位填写数量，系统自动计算消耗积分。
      </p>
      {message ? <p className="status-message">{message}</p> : null}

      <div className="table-wrap">
        <table className="data-table" aria-label="兑换工具表">
          <thead>
            <tr>
              <th>兑换项</th>
              <th>单位</th>
              <th>数量</th>
              <th>兑换额度</th>
              <th>本次消耗</th>
              <th>兑换后余额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.unitLabel}</td>
                <td>
                  <QuantityControl
                    label={row.name}
                    value={row.units}
                    onChange={(quantity) =>
                      setCounts((current) => ({
                        ...current,
                        [row.id]: quantity,
                      }))
                    }
                  />
                </td>
                <td>{row.amount}</td>
                <td>{row.cost}</td>
                <td>{row.afterScore}</td>
                <td>
                  <span className={row.disabled ? "status-danger" : "status-done"}>
                    {row.disabled ? "积分不足" : "可兑换"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => void handleRedeem(row.id, row.cost)}
                    disabled={row.disabled}
                  >
                    兑换
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
