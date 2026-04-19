import { useEffect } from "react";
import { useAppStore } from "../../state/use-app-store";
import { RiskBanner } from "../shared/risk-banner";
import { ScoreChip } from "../shared/score-chip";

const riskCopy = {
  safe: "今天节奏稳定，先守住必做项，再考虑奖励行为。",
  warning: "今天已经进入警戒区，优先补齐必做项，避免积分被进一步拉低。",
  danger: "今天已经在危险边缘，先停止兑换和额外放纵，立即补做关键任务。",
} as const;

const riskLabel = {
  safe: "安全",
  warning: "警戒",
  danger: "危险",
} as const;

export function HomePage() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const rules = useAppStore((state) => state.rules);
  const dayScore = useAppStore((state) => state.dayScore);
  const totalScore = useAppStore((state) => state.totalScore);
  const riskStatus = useAppStore((state) => state.riskStatus);
  const hasCompletedToday = useAppStore((state) => state.hasCompletedToday);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const pendingMustRules = rules.filter(
    (rule) => rule.kind === "must" && !hasCompletedToday(rule.id),
  );

  return (
    <section className="page-card">
      <h2>今日总览</h2>
      <p className="page-copy">
        这里展示日积分、总积分、风险等级和今天最不能失守的任务。
      </p>

      <div className="page-stack">
        <ScoreChip label="日积分" value={dayScore} />
        <ScoreChip label="总积分" value={totalScore} />
        <ScoreChip label="风险状态" value={riskLabel[riskStatus]} />
        <RiskBanner title="风险提示" description={riskCopy[riskStatus]} />
      </div>

      <section className="page-stack" aria-label="今日底线">
        <h3>今日底线</h3>
        {pendingMustRules.length > 0 ? (
          <ul>
            {pendingMustRules.map((rule) => (
              <li key={rule.id}>
                {rule.name}
                {" 未完成"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="page-copy">今天的必做项已经全部完成。</p>
        )}
      </section>
    </section>
  );
}
