import { useEffect, useMemo, useState } from "react";
import { defaultRules } from "../../domain/rules/default-rules";
import { useAppStore } from "../../state/use-app-store";

export type FamilyTask = {
  id: string;
  ruleId?: string;
  category: string;
  task: string;
  detail: string;
  scoreType: "task" | "companion" | "loss";
};

export const familyTasks: FamilyTask[] = [
  {
    id: "bedroom-quilts-window",
    category: "家庭日常",
    task: "主动两个卧室叠被子，开窗户通风",
    detail: "起床后整理卧室，保持空气流通。",
    scoreType: "task",
  },
  {
    id: "family-breakfast",
    category: "家庭日常",
    task: "主动 7 点起床去买全家早饭",
    detail: "烧粥、豆浆、油条、包子、茶叶蛋、南瓜粥等。",
    scoreType: "task",
  },
  {
    id: "boil-water",
    category: "家庭日常",
    task: "主动烧水，并在烧开后装进热水瓶中",
    detail: "三人杯子里装好热水，天热注意水散热。",
    scoreType: "task",
  },
  { id: "wash-clothes", category: "衣物鞋袜", task: "主动洗衣", detail: "包括常用毛巾。", scoreType: "task" },
  { id: "dry-clothes", category: "衣物鞋袜", task: "主动晒衣服", detail: "衣服洗完及时晾晒。", scoreType: "task" },
  { id: "fold-clothes", category: "衣物鞋袜", task: "主动叠衣服", detail: "收下后整理归位。", scoreType: "task" },
  { id: "brush-shoes", category: "衣物鞋袜", task: "主动刷鞋子", detail: "常穿鞋保持干净。", scoreType: "task" },
  { id: "dry-shoes", category: "衣物鞋袜", task: "主动晒鞋子", detail: "常穿鞋需要及时晾晒。", scoreType: "task" },
  {
    id: "clean-surfaces",
    category: "环境整理",
    task: "主动清理桌面垃圾",
    detail: "电视柜、餐桌、厨房台面、电脑桌、床头柜等。",
    scoreType: "task",
  },
  {
    id: "take-trash",
    category: "环境整理",
    task: "主动倒垃圾",
    detail: "包括厨房、卧室、客厅、卫生间。",
    scoreType: "task",
  },
  {
    id: "mop-floor",
    category: "环境整理",
    task: "主动拖地",
    detail: "不要问，看到家里脏就拖。",
    scoreType: "task",
  },
  {
    id: "return-items",
    category: "环境整理",
    task: "常用东西用完放回原位",
    detail: "毛巾、电动车钥匙、厨房剪刀、裁纸刀等。",
    scoreType: "task",
  },
  {
    id: "buy-fruit",
    category: "饮食采购",
    task: "主动买水果",
    detail: "一周两到三次，看每次购买的种类和量。",
    scoreType: "task",
  },
  {
    id: "cook-meal",
    category: "饮食采购",
    task: "主动买菜烧饭",
    detail: "尽量每天不重样。",
    scoreType: "task",
  },
  { id: "wash-dishes", category: "饮食采购", task: "主动洗碗", detail: "饭后及时处理。", scoreType: "task" },
  {
    id: "clean-toilet",
    category: "卫生清洁",
    task: "主动清洁马桶",
    detail: "重点处理马桶圈尿渍，当天没有被批评才能得分。",
    scoreType: "task",
  },
  {
    id: "collect-clothes-before-four",
    category: "卫生清洁",
    task: "主动四点前收衣服",
    detail: "包括可能晒到隔壁阿姨的衣服。",
    scoreType: "task",
  },
  {
    id: "sun-quilts",
    category: "卫生清洁",
    task: "主动晒被子",
    detail: "两到三周一次，尽量挂到隔壁阿姨的架子上，追着太阳晒。",
    scoreType: "task",
  },
  {
    id: "go-out-together",
    category: "关系经营",
    task: "主动提出一起出门",
    detail: "提出具体去处和时间。",
    scoreType: "companion",
  },
  {
    id: "child-school-pickup",
    category: "孩子相关",
    task: "接送孩子",
    detail: "上学 08:15，放学 16:05。",
    scoreType: "companion",
  },
  { id: "child-study", category: "孩子相关", task: "教作业", detail: "主动陪孩子学习作业。", scoreType: "companion" },
  {
    id: "bedtime-companion",
    category: "孩子相关",
    task: "睡前陪伴",
    detail: "陪玩、睡前故事，减少看电视。",
    scoreType: "companion",
  },
  {
    id: "ebike-park-charge",
    category: "车辆物品",
    task: "主动电动车入库，没电的时候充电",
    detail: "发现没电及时处理。",
    scoreType: "task",
  },
];

export function FamilyPage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const rules = useAppStore((state) => state.rules);
  const recordFamilyItem = useAppStore((state) => state.recordFamilyItem);
  const hasCompletedFamilyItemToday = useAppStore((state) => state.hasCompletedFamilyItemToday);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const scoringRules = useMemo(
    () => ({
      task: rules.find((rule) => rule.kind === "family-task"),
      companion: rules.find((rule) => rule.kind === "family-companion"),
      loss: rules.find((rule) => rule.id === "vice-family-emotion"),
    }),
    [rules],
  );

  function getScoreLabel(item: FamilyTask): string {
    const rule = item.ruleId
      ? rules.find((rule) => rule.id === item.ruleId)
      :
      item.scoreType === "loss"
        ? scoringRules.loss ?? defaultRules.find((rule) => rule.id === "vice-family-emotion")
        : item.scoreType === "companion"
          ? scoringRules.companion ?? defaultRules.find((rule) => rule.kind === "family-companion")
          : scoringRules.task ?? defaultRules.find((rule) => rule.kind === "family-task");

    if (!rule || !("score" in rule)) {
      return "-";
    }

    return rule.score > 0 ? `+${rule.score}` : `${rule.score}`;
  }

  const displayTasks = useMemo(
    () => [
      ...familyTasks,
      ...rules
        .filter((rule) => rule.id.startsWith("custom-") && rule.kind === "family-task" && "score" in rule)
        .map((rule) => ({
          id: rule.id,
          ruleId: rule.id,
          category: "自定义家务",
          task: rule.name,
          detail: "每天完成一次，按规则中心设置的分值计入。",
          scoreType: "task" as const,
        })),
    ],
    [rules],
  );

  async function handleRecord(item: FamilyTask) {
    const result = await recordFamilyItem({
      itemId: item.id,
      scoreType: item.scoreType,
    });

    if (!result.ok && result.reason === "ALREADY_COMPLETED_TODAY") {
      setMessage("今天已经记录过这项，避免重复计分。");
      return;
    }

    setMessage(result.ok ? "家务已完成，积分已记录。" : "记录失败，请检查规则配置。");
  }

  return (
    <section className="page-card page-card--wide">
      <div>
        <p className="eyebrow">Housework</p>
        <h2>家务</h2>
      </div>
      <p className="page-copy">家务按具体事项记录，点击完成后操作按钮会变为蓝色已完成。</p>
      {message ? <p className="status-message">{message}</p> : null}

      <div className="table-wrap">
        <table className="data-table data-table--family" aria-label="家务清单">
          <thead>
            <tr>
              <th>分类</th>
              <th>事项</th>
              <th>细节</th>
              <th>分值</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {displayTasks.map((item) => {
              const completed = hasCompletedFamilyItemToday(item.id);

              return (
                <tr key={item.id} className={completed ? "row-done" : undefined}>
                  <td>
                    <span className={`category-pill category-pill--${item.scoreType}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>{item.task}</td>
                  <td>{item.detail}</td>
                  <td>{getScoreLabel(item)}</td>
                  <td>
                    <button
                      type="button"
                      className={completed ? "choice-button choice-button--active" : "choice-button"}
                      onClick={() => void handleRecord(item)}
                      disabled={completed}
                    >
                      {completed ? "已完成" : "完成"}
                    </button>
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
