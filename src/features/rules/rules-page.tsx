import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../state/use-app-store";
import type { RuleDefinition, RuleKind, RuleStep, RuleUnit } from "../../domain/types";
import { defaultRules } from "../../domain/rules/default-rules";
import { familyTasks, type FamilyTask } from "../family/family-page";

const dailyRuleIds = new Set([
  "must-ai-study-30m",
  "must-meditation-5m",
  "must-plank",
  "must-standing-pushup",
  "must-wall-sit",
  "must-squat",
  "bonus-swim-1km",
]);

const hiddenDeductionRuleIds = new Set(["vice-phone-scroll"]);

const exchangeRuleIds = new Set([
  "redeem-game-30m",
  "redeem-mobile-game-30",
  "redeem-oil-burst",
  "redeem-figure-blindbox-50",
  "redeem-shopping-50",
]);

const sections: Array<{
  title: string;
  color: string;
  filter: (rule: RuleDefinition) => boolean;
}> = [
  {
    title: "每日项",
    color: "blue",
    filter: (rule) =>
      dailyRuleIds.has(rule.id) ||
      (rule.id.startsWith("custom-") && (rule.kind === "must" || rule.kind === "bonus")),
  },
  {
    title: "扣分项",
    color: "red",
    filter: (rule) => rule.kind === "vice" && !hiddenDeductionRuleIds.has(rule.id),
  },
  {
    title: "兑换项",
    color: "yellow",
    filter: (rule) => exchangeRuleIds.has(rule.id) || (rule.id.startsWith("custom-") && rule.kind === "redeem"),
  },
];

const ruleNameOverrides: Record<string, string> = {
  "must-ai-study-30m": "学习",
  "must-meditation-5m": "冥想",
  "must-plank": "平板支撑",
  "must-standing-pushup": "站姿俯卧撑",
  "must-wall-sit": "靠墙静卧",
  "must-squat": "深蹲",
  "bonus-swim-1km": "游泳",
  "vice-late-sleep": "熬夜",
  "vice-game-overtime": "游戏超时",
  "vice-junk-food": "垃圾饮食",
  "vice-mobile-game-spend": "手游氪金",
  "vice-oil-burst-forced": "强制油冲",
  "vice-family-emotion": "在家不耐烦，发脾气",
  "redeem-game-30m": "游戏时间",
  "redeem-mobile-game-30": "手游氪金额度",
  "redeem-oil-burst": "油冲次数",
  "redeem-figure-blindbox-50": "手办额度",
  "redeem-shopping-50": "购物额度",
  "family-task-basic": "家务完成基础分",
  "family-companion-10m": "家务陪伴基础分",
};

const unitLabels: Record<RuleUnit, string> = {
  count: "次数/单位",
  minute: "分钟",
  money: "金额",
  "time-slot": "时间档位",
};

const quantityUnitOverrides: Record<string, string> = {
  "must-ai-study-30m": "每 30 分钟",
  "must-meditation-5m": "每 5 分钟",
  "must-plank": "每 3 x 30s",
  "must-standing-pushup": "每 3 组",
  "must-wall-sit": "每 3 x 30s",
  "must-squat": "每 3 x 15",
  "bonus-swim-1km": "每 1 公里",
  "redeem-game-30m": "每 30 分钟",
  "redeem-mobile-game-30": "每 50 元",
  "redeem-oil-burst": "每 1 次",
  "redeem-figure-blindbox-50": "每 50 元",
  "redeem-shopping-50": "每 50 元",
};

const customQuantityUnitLabels: Record<RuleUnit, string> = {
  count: "每 1 次",
  minute: "每 1 分钟",
  money: "每 1 元",
  "time-slot": "每 1 档",
};

type NewRuleType = "daily" | "family" | "deduction" | "redeem";
type NewRuleMode = "quantity" | "steps";

const newRuleTypeOptions: Array<{ value: NewRuleType; label: string }> = [
  { value: "daily", label: "每日项" },
  { value: "family", label: "家务项" },
  { value: "deduction", label: "扣分项" },
  { value: "redeem", label: "兑换项" },
];

const newRuleModeOptions: Array<{ value: NewRuleMode; label: string }> = [
  { value: "quantity", label: "数量" },
  { value: "steps", label: "挡位" },
];

const unitOptions: Array<{ value: RuleUnit; label: string }> = [
  { value: "count", label: "次数/项目" },
  { value: "minute", label: "分钟" },
  { value: "money", label: "金额" },
  { value: "time-slot", label: "时间段" },
];

type EditForm = {
  id: string;
  name: string;
  score: string;
  unit: RuleUnit;
  stepsText: string;
};

function hasSteps(rule: RuleDefinition): rule is RuleDefinition & { steps: readonly RuleStep[] } {
  return "steps" in rule;
}

function formatScore(rule: RuleDefinition): string {
  if ("score" in rule) {
    if (rule.kind === "redeem") {
      return `消耗 ${rule.score}`;
    }

    return `${rule.score > 0 ? "+" : ""}${rule.score}`;
  }

  return "递进";
}

function formatSteps(rule: RuleDefinition): string {
  if (!hasSteps(rule)) {
    return "-";
  }

  return rule.steps
    .map((step) => `${step.label} ${step.score > 0 ? "+" : ""}${step.score}`)
    .join(" / ");
}

function getRuleDisplayName(rule: RuleDefinition): string {
  return ruleNameOverrides[rule.id] ?? rule.name;
}

function getRuleUnitLabel(rule: RuleDefinition): string {
  if (quantityUnitOverrides[rule.id]) {
    return quantityUnitOverrides[rule.id];
  }

  if (rule.id.startsWith("custom-") && "score" in rule) {
    return customQuantityUnitLabels[rule.unit];
  }

  if (hasSteps(rule)) {
    return "按档位";
  }

  return unitLabels[rule.unit] ?? rule.unit;
}

function getFamilyScoreRule(item: FamilyTask, rules: RuleDefinition[]): RuleDefinition | undefined {
  if (item.scoreType === "companion") {
    return (
      rules.find((rule) => rule.kind === "family-companion") ??
      defaultRules.find((rule) => rule.kind === "family-companion")
    );
  }

  if (item.scoreType === "loss") {
    return (
      rules.find((rule) => rule.id === "vice-family-emotion") ??
      defaultRules.find((rule) => rule.id === "vice-family-emotion")
    );
  }

  return (
    rules.find((rule) => rule.kind === "family-task") ??
    defaultRules.find((rule) => rule.kind === "family-task")
  );
}

function formatFamilyScore(item: FamilyTask, rules: RuleDefinition[]): string {
  const rule = getFamilyScoreRule(item, rules);

  if (!rule || !("score" in rule)) {
    return "-";
  }

  return `${rule.score > 0 ? "+" : ""}${rule.score}`;
}

function stepsToText(rule: RuleDefinition): string {
  if (!hasSteps(rule)) {
    return "";
  }

  return rule.steps.map((step) => `${step.label}|${step.score}`).join("\n");
}

function parseSteps(text: string, fallback: readonly RuleStep[]): RuleStep[] {
  const steps = text
    .split(/\r?\n/)
    .map((line, index) => {
      const [label, scoreText] = line.split("|");
      const score = Number(scoreText);

      if (!label?.trim() || !Number.isFinite(score)) {
        return null;
      }

      return {
        threshold: fallback[index]?.threshold ?? index + 1,
        label: label.trim(),
        score,
      };
    })
    .filter((step): step is RuleStep => Boolean(step));

  return steps.length > 0 ? steps : [...fallback];
}

function parseNewRuleSteps(text: string): RuleStep[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => {
      const [label, scoreText] = line.split("|");
      const score = Number(scoreText);

      if (!label?.trim() || !Number.isFinite(score)) {
        return null;
      }

      return {
        threshold: index + 1,
        label: label.trim(),
        score: score > 0 ? -score : score,
      };
    })
    .filter((step): step is RuleStep => Boolean(step));
}

function getRuleKindFromType(ruleType: NewRuleType): RuleKind {
  if (ruleType === "daily") {
    return "bonus";
  }

  if (ruleType === "family") {
    return "family-task";
  }

  if (ruleType === "deduction") {
    return "vice";
  }

  return "redeem";
}

function buildEditedRule(rule: RuleDefinition, form: EditForm): RuleDefinition {
  const name = form.name.trim() || rule.name;

  if (hasSteps(rule)) {
    return {
      ...rule,
      name,
      unit: form.unit,
      steps: parseSteps(form.stepsText, rule.steps),
    };
  }

  const numericScore = Number(form.score);
  const safeScore = Number.isFinite(numericScore) ? Math.abs(numericScore) : Math.abs(rule.score);
  const score = rule.direction === "loss" ? -safeScore : safeScore;

  return {
    ...rule,
    name,
    unit: form.unit,
    score,
  };
}

export function RulesPage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const rules = useAppStore((state) => state.rules);
  const addFixedRule = useAppStore((state) => state.addFixedRule);
  const updateRule = useAppStore((state) => state.updateRule);
  const [name, setName] = useState("");
  const [score, setScore] = useState("1");
  const [newRuleType, setNewRuleType] = useState<NewRuleType>("daily");
  const [newRuleMode, setNewRuleMode] = useState<NewRuleMode>("quantity");
  const [newRuleStepsText, setNewRuleStepsText] = useState("\u8f7b\u5fae|2\n\u4e25\u91cd|5");
  const [editing, setEditing] = useState<EditForm | null>(null);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const rulesByKind = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      rules: rules.filter(section.filter),
    }));
  }, [rules]);

  function startEdit(rule: RuleDefinition) {
    setEditing({
      id: rule.id,
      name: rule.name,
      score: "score" in rule ? String(Math.abs(rule.score)) : "",
      unit: rule.unit,
      stepsText: stepsToText(rule),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericScore = Number(score);

    if (!name.trim()) {
      return;
    }

    if (newRuleMode === "steps") {
      const steps = parseNewRuleSteps(newRuleStepsText);

      if ((newRuleType !== "deduction" && newRuleType !== "redeem") || steps.length === 0) {
        return;
      }

      await addFixedRule({
        name,
        kind: getRuleKindFromType(newRuleType),
        score: 0,
        unit: "time-slot",
        steps,
      });
      setName("");
      setNewRuleStepsText("\u8f7b\u5fae|2\n\u4e25\u91cd|5");
      return;
    }

    if (!Number.isFinite(numericScore) || numericScore <= 0) {
      return;
    }

    await addFixedRule({
      name,
      kind: getRuleKindFromType(newRuleType),
      score: numericScore,
      unit: "count",
    });
    setName("");
    setScore("1");
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const rule = rules.find((item) => item.id === editing.id);

    if (!rule) {
      return;
    }

    await updateRule(buildEditedRule(rule, editing));
    setEditing(null);
  }

  return (
    <section className="page-card page-card--wide">
      <div>
        <p className="eyebrow">Rule studio</p>
        <h2>规则中心</h2>
      </div>
      <p className="page-copy">新增和修改都在这里完成，预制规则也可以直接调整。</p>

      <form className="rule-form rules-form" onSubmit={handleSubmit} aria-label="新增规则">
        <label>
          名称
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：散步 20 分钟"
          />
        </label>
        <label>
          类型
          <select
            value={newRuleType}
            onChange={(event) => {
              const nextType = event.target.value as NewRuleType;
              setNewRuleType(nextType);

              if (nextType !== "deduction" && nextType !== "redeem") {
                setNewRuleMode("quantity");
              }
            }}
          >
            {newRuleTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          数量单位
          <select
            value={newRuleMode}
            onChange={(event) => setNewRuleMode(event.target.value as NewRuleMode)}
          >
            {newRuleModeOptions
              .filter((option) => newRuleType === "deduction" || newRuleType === "redeem" || option.value === "quantity")
              .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {newRuleMode === "steps" ? (
          <label className="rule-form__wide">
            挡位区间和扣分
            <textarea
              value={newRuleStepsText}
              onChange={(event) => setNewRuleStepsText(event.target.value)}
              placeholder={"30-60 分钟|2\n60-120 分钟|5"}
            />
          </label>
        ) : (
          <label>
            {newRuleType === "redeem"
              ? "每次数量消耗"
              : newRuleType === "deduction"
                ? "每次数量扣分"
                : "每次数量积分"}
            <input
              inputMode="numeric"
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </label>
        )}
        <button type="submit">新增规则</button>
      </form>

      {editing ? (
        <form className="rule-form rule-form--edit rules-form rules-form--edit" onSubmit={handleEditSubmit} aria-label="修改规则">
          <label>
            规则名称
            <input
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
          </label>
          <label>
            数量单位
            <select
              value={editing.unit}
              onChange={(event) =>
                setEditing({ ...editing, unit: event.target.value as RuleUnit })
              }
            >
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {editing.stepsText ? (
            <label className="rule-form__wide">
              递进档位
              <textarea
                value={editing.stepsText}
                onChange={(event) => setEditing({ ...editing, stepsText: event.target.value })}
              />
            </label>
          ) : (
            <label>
              单位分值
              <input
                inputMode="numeric"
                value={editing.score}
                onChange={(event) => setEditing({ ...editing, score: event.target.value })}
              />
            </label>
          )}
          <button type="submit">保存修改</button>
          <button type="button" className="button-secondary" onClick={() => setEditing(null)}>
            取消
          </button>
        </form>
      ) : null}

      <div className="table-grid rules-grid">
        {rulesByKind.map((section) => (
          <section key={section.title} className={`sheet-panel rules-panel sheet-panel--${section.color}`}>
            <h3>{section.title}</h3>
            <div className="table-wrap">
              <table className="data-table rules-table" aria-label={`${section.title}规则表`}>
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>单位分值</th>
                    <th>数量单位</th>
                    <th>限制</th>
                    <th>档位</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{getRuleDisplayName(rule)}</td>
                      <td>{formatScore(rule)}</td>
                      <td>{getRuleUnitLabel(rule)}</td>
                      <td>
                        {rule.cooldownDays
                          ? `${rule.cooldownDays} 天冷却`
                          : rule.dailyCap
                            ? `每天 ${rule.dailyCap} 次`
                            : "-"}
                      </td>
                      <td className="steps-cell">{formatSteps(rule)}</td>
                      <td>
                        <button type="button" onClick={() => startEdit(rule)}>
                          修改
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <section className="sheet-panel rules-panel sheet-panel--purple">
          <h3>家务分值</h3>
          <div className="table-wrap">
            <table className="data-table rules-table" aria-label="家务分值规则表">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>家务项</th>
                  <th>细节</th>
                  <th>分值</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {familyTasks.map((item) => {
                  const scoreRule = getFamilyScoreRule(item, rules);

                  return (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{item.task}</td>
                      <td className="steps-cell">{item.detail}</td>
                      <td>{formatFamilyScore(item, rules)}</td>
                      <td>
                        {scoreRule ? (
                          <button type="button" onClick={() => startEdit(scoreRule)}>
                            修改分值
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
