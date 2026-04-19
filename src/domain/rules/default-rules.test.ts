import { defaultRules } from "./default-rules";

test("includes the approved first-round preset rule set", () => {
  const ids = defaultRules.map((rule) => rule.id);

  expect(ids).toEqual(
    expect.arrayContaining([
      "must-ai-study-30m",
      "must-plank",
      "must-wall-sit",
      "must-squat",
      "must-standing-pushup",
      "must-meditation-5m",
      "bonus-ai-study-60m",
      "bonus-ai-study-90m",
      "bonus-swim-1km",
      "bonus-healthy-meal",
      "bonus-evening-family-focus",
      "bonus-emotion-review",
      "bonus-extra-housework",
      "vice-late-sleep",
      "vice-game-overtime",
      "vice-junk-food",
      "vice-mobile-game-spend",
      "vice-phone-scroll",
      "vice-oil-burst-forced",
      "vice-family-emotion",
      "family-task-basic",
      "family-companion-10m",
      "redeem-game-30m",
      "redeem-game-1h",
      "redeem-snack-10",
      "redeem-snack-20",
      "redeem-mobile-game-30",
      "redeem-figure-blindbox-50",
      "redeem-oil-burst",
    ]),
  );
});

test("keeps stepped preset rules explicit and ordered", () => {
  const lateSleep = defaultRules.find((rule) => rule.id === "vice-late-sleep");
  const gameOvertime = defaultRules.find((rule) => rule.id === "vice-game-overtime");
  const mobileSpend = defaultRules.find(
    (rule) => rule.id === "vice-mobile-game-spend",
  );
  const phoneScroll = defaultRules.find((rule) => rule.id === "vice-phone-scroll");

  expect(lateSleep?.steps).toEqual([
    { threshold: 2230, score: -2, label: "22:30-22:59" },
    { threshold: 2300, score: -4, label: "23:00-23:29" },
    { threshold: 2330, score: -6, label: "23:30-23:59" },
    { threshold: 2400, score: -9, label: "00:00-00:29" },
    { threshold: 2430, score: -13, label: "00:30-00:59" },
    { threshold: 2500, score: -18, label: "01:00+" },
  ]);
  expect(gameOvertime?.steps?.map((step) => step.score)).toEqual([0, -2, -5, -9, -15]);
  expect(mobileSpend?.steps?.map((step) => step.score)).toEqual([-3, -6, -10, -16]);
  expect(phoneScroll?.steps?.map((step) => step.score)).toEqual([-2, -5, -8]);
});
