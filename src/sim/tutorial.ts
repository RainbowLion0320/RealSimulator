import type { Game } from "./types";

export type TutorialStep = NonNullable<Game["tutorial"]>["step"];
export const STEPS: TutorialStep[] = [
  "welcome",
  "read",
  "decision",
  "orders",
  "audience",
  "wait",
  "reply",
  "archive",
  "map",
  "done",
];
export const GUIDE: Record<
  Exclude<TutorialStep, "done">,
  { title: string; text: string; action: string }
> = {
  welcome: {
    title: "亲政第一课：先办一件事",
    text: "天下的事很多，先从一份军饷奏折开始。我们会陪你走过批阅、问话和等候来文，再逐步打开其他入口。你决定怎么办，引导只教操作。",
    action: "开始亲政引导",
  },
  read: {
    title: "先看是谁说的、何时说的",
    text: "下面是巡抚送来的军饷奏折。先读事情经过、所求金额和来文日期。这里的数字是臣下的呈报，皇帝暂时没有另一份实时账本。读完再打开批示。",
    action: "读过了，拟定批示",
  },
  decision: {
    title: "作出你的第一道批示",
    text: "拨款、派人查验或暂缓，都可以。选项会写清你准备做什么；事情最后办成怎样，要等后续来文。这里没有指定的正确答案。",
    action: "打开批示选项",
  },
  orders: {
    title: "批示已经留下记录",
    text: "到诏令页看看刚才的决定。发出诏令不等于事情已经办好；如果你选择暂缓，也会留存批复，但不会生成拨款。现在先认识记录，随后再问一位大臣。",
    action: "查看批示记录",
  },
  audience: {
    title: "再听一个人的说法",
    text: "召见入口已开放。这次先请戚继光谈谈山陕的军务，练习指定询问对象和问题。臣下的答复同样是一种说法，不能代替地方实情。",
    action: "召见戚继光",
  },
  wait: {
    title: "让消息走到你的案头",
    text: "问话已经安排。点击继续时间，等这次召对记录送来；引导会在它到达时暂停。日后普通阅知来文不会都打断时间，需要你裁决的奏报才会自动暂停。",
    action: "继续时间，等候来文",
  },
  reply: {
    title: "读到回话，也要分清它回答了什么",
    text: "这份来文是刚才召见的答复，不是先前批示的执行回报。看看说话的人、日期和内容。听到了回复，并不代表已经核实，也不代表钱已经送到。",
    action: "读完了，核对旧奏报",
  },
  archive: {
    title: "把前后的说法放在一起",
    text: "档案里保留着原奏折、户部汇册和刚收到的答复。点开一份旧文看看；新消息不会改写旧数字。系统不替你判定谁对谁错。",
    action: "查看档案",
  },
  map: {
    title: "按地方整理你知道的事",
    text: "舆图汇集各地已到的来文，没有报告的地方仍然是未知。看完后，主动施政、人事、改革和内阁授权将全部开放。遇到新事，再按读报、问话、下旨、追看来文的节奏处理。",
    action: "查看舆图",
  },
};
export function tutorialStep(g: Game): TutorialStep {
  return g.ended ? "done" : (g.tutorial?.step ?? "done");
}
export function tutorialAllows(step: TutorialStep, page: string) {
  const unlock = {
    desk: "welcome",
    orders: "orders",
    people: "audience",
    archive: "archive",
    map: "map",
  } as const;
  const at = unlock[page as keyof typeof unlock];
  return !!at && STEPS.indexOf(step) >= STEPS.indexOf(at);
}
export function tutorialEvent(g: Game, event: string, replyId?: number) {
  const t = g.tutorial;
  if (!t || g.ended) return;
  const transitions: Partial<Record<TutorialStep, string>> = {
    welcome: "begin",
    read: "read",
    decision: "decided",
    orders: "orders",
    audience: "asked",
    reply: "reply",
    archive: "archive",
    map: "map",
  };
  if (transitions[t.step] !== event) return;
  if (
    t.step === "decision" &&
    !g.reports.find((r) => r.id === t.firstReportId)?.resolved
  )
    return;
  if (t.step === "audience") {
    // Track the question the player just asked, never infer completion from hidden outcomes.
    if (
      !g.mail.some((r) => r.id === replyId) &&
      !g.reports.some((r) => r.id === replyId)
    )
      return;
    t.replyId = replyId;
  }
  t.step = STEPS[STEPS.indexOf(t.step) + 1];
}
export function syncTutorial(g: Game) {
  const t = g.tutorial;
  if (t?.step === "wait" && g.reports.some((r) => r.id === t.replyId))
    t.step = "reply";
}
export function skipTutorial(g: Game) {
  if (g.tutorial) g.tutorial.step = "done";
}
export function validateTutorial(g: Game) {
  const t = g.tutorial;
  if (!t) return; // Older campaigns remain fully open.
  if (
    !STEPS.includes(t.step) ||
    !Number.isInteger(t.firstReportId) ||
    !g.reports.some((r) => r.id === t.firstReportId)
  )
    throw new Error("存档引导记录不完整。");
  if (
    ["wait", "reply"].includes(t.step) &&
    ![...g.mail, ...g.reports].some((r) => r.id === t.replyId)
  )
    throw new Error("存档缺少引导所需的召对记录。");
  syncTutorial(g);
}
