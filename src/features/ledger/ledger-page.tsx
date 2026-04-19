import { useEffect } from "react";
import type { PersistedEvent } from "../../data/db";
import { useAppStore } from "../../state/use-app-store";

type RecordDisplay = {
  type: string;
  name: string;
  quantity: string;
  step: string;
};

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
};

const stepLabels: Record<string, string[]> = {
  "vice-late-sleep": ["22:30-22:59", "23:00-23:29", "23:30-23:59", "00:00-00:29", "00:30-00:59", "01:00+"],
  "vice-game-overtime": ["<=30 分钟", "30-60 分钟", "1-2 小时", "2-4 小时", "4 小时以上"],
  "vice-junk-food": ["奶茶甜品 1 次", "外卖重油 1 次", "油炸零食 1 次", "深夜加餐 1 次", "少量额外饮食"],
  "vice-mobile-game-spend": ["1-30 元", "31-98 元", "99-198 元", "198 元以上"],
};

const stepScores: Record<string, number[]> = {
  "vice-late-sleep": [-2, -4, -6, -9, -13, -18],
  "vice-game-overtime": [0, -2, -5, -9, -15],
  "vice-junk-food": [-3, -5, -5, -4, -2],
  "vice-mobile-game-spend": [-3, -6, -10, -16],
};

const dailyScoreUnit: Record<string, number> = {
  "must-ai-study-30m": 6,
  "must-meditation-5m": 3,
  "must-plank": 2,
  "must-standing-pushup": 2,
  "must-wall-sit": 2,
  "must-squat": 2,
  "bonus-swim-1km": 10,
};

const redeemNameOverrides: Record<string, string> = {
  "game-time": "游戏时间",
  "mobile-game": "手游氪金额度",
  "oil-burst": "油冲次数",
  figure: "手办额度",
  shopping: "购物额度",
  "redeem-shopping-50": "购物额度",
};

const redeemCostUnit: Record<string, number> = {
  "game-time": 6,
  "mobile-game": 22,
  "oil-burst": 35,
  figure: 35,
  shopping: 30,
  "redeem-shopping-50": 30,
};

const familyNameOverrides: Record<string, string> = {
  "bedroom-quilts-window": "主动两个卧室叠被子，开窗户通风",
  "family-breakfast": "主动 7 点起床去买全家早饭",
  "boil-water": "主动烧水",
  "wash-clothes": "主动洗衣",
  "dry-clothes": "主动晒衣服",
  "fold-clothes": "主动叠衣服",
  "brush-shoes": "主动刷鞋子",
  "dry-shoes": "主动晒鞋子",
  "clean-surfaces": "主动清理桌面垃圾",
  "take-trash": "主动倒垃圾",
  "mop-floor": "主动拖地",
  "return-items": "常用东西用完放回原位",
  "buy-fruit": "主动买水果",
  "cook-meal": "主动买菜烧饭",
  "wash-dishes": "主动洗碗",
  "clean-toilet": "主动清洁马桶",
  "collect-clothes-before-four": "主动四点前收衣服",
  "sun-quilts": "主动晒被子",
  "go-out-together": "主动提出一起出门",
  "child-school-pickup": "接送孩子",
  "child-study": "教作业",
  "bedtime-companion": "睡前陪伴",
  "ebike-park-charge": "主动电动车入库，没电的时候充电",
};

function formatScore(scoreDelta: number): string {
  return scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`;
}

function getQuantityFromRuleId(ruleId: string): string | null {
  const match = ruleId.match(/-qty-(\d+)$/);
  return match ? match[1] : null;
}

function getStepIndexFromRuleId(ruleId: string): number | null {
  const match = ruleId.match(/-step-(\d+)-qty-\d+$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function stripMetadata(ruleId: string): string {
  return ruleId.replace(/-step-\d+-qty-\d+$/, "").replace(/-qty-\d+$/, "");
}

function inferQuantityFromScore(ruleId: string, scoreDelta: number): string {
  const unitScore = dailyScoreUnit[ruleId];

  if (!unitScore) {
    return "1";
  }

  return `${Math.max(1, Math.abs(scoreDelta / unitScore))}`;
}

function inferStepFromScore(ruleId: string, scoreDelta: number): string {
  const scores = stepScores[ruleId];
  const labels = stepLabels[ruleId];

  if (!scores || !labels) {
    return "-";
  }

  const index = scores.findIndex((score) => score === scoreDelta);
  return index >= 0 ? labels[index] : "-";
}

function resolveRecordDisplay(event: PersistedEvent, getRuleName: (ruleId: string) => string): RecordDisplay {
  const { ruleId, scoreDelta } = event;

  if (ruleId.startsWith("custom-score-today-deduction-")) {
    const rawSourceRuleId = ruleId.replace("custom-score-today-deduction-", "");
    const sourceRuleId = stripMetadata(rawSourceRuleId);
    const stepIndex = getStepIndexFromRuleId(ruleId);
    const quantity = getQuantityFromRuleId(ruleId) ?? "1";
    const step = stepIndex === null ? inferStepFromScore(sourceRuleId, scoreDelta) : (stepLabels[sourceRuleId]?.[stepIndex] ?? "-");

    return {
      type: "扣分",
      name: ruleNameOverrides[sourceRuleId] ?? getRuleName(sourceRuleId),
      quantity,
      step,
    };
  }

  if (ruleId.startsWith("custom-score-today-")) {
    const rawSourceRuleId = ruleId.replace("custom-score-today-", "");
    const sourceRuleId = stripMetadata(rawSourceRuleId);

    return {
      type: "积分",
      name: ruleNameOverrides[sourceRuleId] ?? getRuleName(sourceRuleId),
      quantity: getQuantityFromRuleId(ruleId) ?? inferQuantityFromScore(sourceRuleId, scoreDelta),
      step: "-",
    };
  }

  if (ruleId.startsWith("redeem-custom-")) {
    const redeemId = ruleId.replace("redeem-custom-", "");
    const unitCost = redeemCostUnit[redeemId];
    const quantity = unitCost ? `${Math.max(1, Math.abs(scoreDelta / unitCost))}` : "-";
    const customRule = getRuleName(redeemId);

    return {
      type: "兑换",
      name: redeemNameOverrides[redeemId] ?? (customRule === redeemId ? "自定义兑换" : customRule),
      quantity,
      step: "-",
    };
  }

  if (ruleId.startsWith("family-item-")) {
    const familyId = ruleId.replace("family-item-", "");

    return {
      type: "家务",
      name: familyNameOverrides[familyId] ?? "家务记录",
      quantity: "1",
      step: "-",
    };
  }

  if (ruleId.startsWith("vice-")) {
    return {
      type: "扣分",
      name: ruleNameOverrides[ruleId] ?? getRuleName(ruleId),
      quantity: "1",
      step: inferStepFromScore(ruleId, scoreDelta),
    };
  }

  const directName = ruleNameOverrides[ruleId] ?? getRuleName(ruleId);
  return {
    type: scoreDelta > 0 ? "积分" : "扣分 / 兑换",
    name: directName === ruleId ? "未命名记录" : directName,
    quantity: "1",
    step: "-",
  };
}

function formatQuantityAndStep(display: RecordDisplay): string {
  return display.step === "-" ? display.quantity : display.step;
}

export function LedgerPage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const events = useAppStore((state) => state.events);
  const getRuleName = useAppStore((state) => state.getRuleName);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <section className="page-card page-card--wide">
      <h2>热修记录</h2>
      <p className="page-copy">
        记录所有积分、扣分和兑换流水。每日项会展示数量，扣分项会展示档位和数量。
      </p>
      {events.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table" aria-label="热修记录明细">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>项目</th>
                <th>数量&档位</th>
                <th>分值变化</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const display = resolveRecordDisplay(event, getRuleName);

                return (
                  <tr key={event.id ?? `${event.ruleId}-${event.happenedAt}`}>
                    <td>{new Date(event.happenedAt).toLocaleString()}</td>
                    <td>{display.type}</td>
                    <td>{display.name}</td>
                    <td>{formatQuantityAndStep(display)}</td>
                    <td>
                      <span className={event.scoreDelta > 0 ? "status-done" : "status-danger"}>
                        {formatScore(event.scoreDelta)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="page-copy">暂时还没有热修记录，从今日执行、家务或兑换中心开始记录。</p>
      )}
    </section>
  );
}
