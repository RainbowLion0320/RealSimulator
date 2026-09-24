import { PEOPLE, POLICY, REGION_SEEDS, amount, dateOf, yearOf } from "./data";
import type { Game, Person, Policy, Region, Report, YearRecord } from "./types";
import { modernText } from "./copy";

export function random(g: Game): number {
  let t = (g.rng += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  g.rng = g.rng >>> 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const totalSilver = (g: Game) =>
  g.treasury +
  g.regions.reduce((s, r) => s + r.silver, 0) +
  g.commands.reduce((s, c) => s + c.transit, 0);
const totalGrain = (g: Game) =>
  g.granary + g.regions.reduce((s, r) => s + r.grain, 0);
const person = (g: Game, id: string) =>
  g.people.find((p) => p.id === id && !p.retired) ||
  g.people.find((p) => !p.retired)!;
const local = (g: Game, id: string) =>
  g.regions.find((r) => r.id === id) || g.regions[0];
const log = (g: Game, text: string) => {
  g.history.push({ day: g.day, text });
};
function report(
  g: Game,
  data: Omit<Report, "id" | "read" | "resolved" | "received" | "written">,
  delay = 0,
  written = g.day,
) {
  const item: Report = {
    ...data,
    body: modernText(data.body),
    options: data.options.includes("observe")
      ? data.options
      : [...data.options, "observe"],
    id: g.nextId++,
    written,
    received: g.day + delay,
    read: false,
    resolved: false,
  };
  if (delay) g.mail.push(item);
  else g.reports.push(item);
  return item;
}
function snapshot(g: Game): YearRecord {
  return {
    day: g.day,
    population: g.regions.reduce((s, r) => s + r.population, 0),
    grain: totalGrain(g),
    treasury: g.treasury,
    claimedTreasury:
      [...g.reports].reverse().find((r) => r.claimSilver !== undefined)
        ?.claimSilver ?? null,
    controlled: g.regions.filter((r) => r.control).length,
    deaths: g.deaths,
    diversion: g.diversion,
  };
}
function recordSnapshot(g: Game) {
  const row = snapshot(g);
  if (g.annual.at(-1)?.day === g.day) g.annual[g.annual.length - 1] = row;
  else g.annual.push(row);
}
export function newGame(seed = Date.now() >>> 0): Game {
  const g: Game = {
    version: 1,
    seed: seed >>> 0,
    rng: seed >>> 0,
    day: 0,
    nextId: 1,
    treasury: 480,
    granary: 350,
    regions: [],
    people: structuredClone(PEOPLE),
    reports: [],
    mail: [],
    commands: [],
    history: [],
    annual: [],
    ledger: {
      minted: 0,
      consumed: 0,
      lost: 0,
      initialSilver: 0,
      grown: 0,
      eaten: 0,
      spoiled: 0,
      initialGrain: 0,
    },
    foreign: { pressure: 0.3, truce: 0, trade: 0 },
    court: { authority: 0.8, education: 0, arms: 0, tax: 1, delegated: false },
    ruler: {
      name: "朱翊钧",
      born: 1563,
      generation: 1,
      ends: 360 * (45 + Math.floor(12 * Math.sin(seed) ** 2)),
      heirAge: 0,
    },
    capital: "capital",
    ended: null,
    deaths: 0,
    diversion: 0,
    lastPetition: -100,
  };
  for (const [id, name, pop] of REGION_SEEDS) {
    const variance = 0.94 + random(g) * 0.12;
    g.regions.push({
      id,
      name,
      population: pop * variance,
      grain: pop * (158 + random(g) * 16),
      silver: pop * 20,
      army: id === "border" ? 35 : 14,
      unrest: 0.08 + random(g) * 0.04,
      infrastructure: 0.15,
      harvest: 0.85 + random(g) * 0.3,
      control: true,
      ledgerGrain: pop * 190,
      ledgerPopulation: pop,
      ledgerSilver: pop * 20,
      governor: 0.35 + random(g) * 0.45,
    });
  }
  g.ledger.initialSilver = totalSilver(g);
  g.ledger.initialGrain = totalGrain(g);
  report(g, {
    title: "宁夏军饷未至",
    source: "山陕巡抚题本",
    person: "zhang",
    region: "north",
    domain: "边务",
    body: "陛下，边镇说已经两个月没发军饷了。士兵仍在守营，但粮商不肯继续赊账。请先拨三十万两银子，让军队渡过眼前的难关。之前发出的军饷为什么还没到，也需要另派人查清。",
    facts: [
      { label: "边镇所报", value: "欠饷二月" },
      { label: "本次请拨", value: "银三十万两" },
    ],
    options: ["pay", "audit", "defend", "observe"],
    decision: true,
  });
  report(g, {
    title: "太仓钱粮汇册",
    source: "户部岁中汇报",
    person: "shen",
    region: "capital",
    domain: "钱粮",
    body: "陛下，户部根据现有账本整理了国库情况。有些省份说钱已经发出，但京城还没收到。完整账目要等秋后再汇总。眼下请先留够京城官员的俸禄、边军军饷和救灾用的钱。",
    facts: [
      { label: "册报库银", value: "五百二十万两" },
      { label: "本年预计岁入", value: "五百一十万两" },
    ],
    claimSilver: 520,
    options: ["tax", "audit", "observe"],
    decision: false,
  });
  report(
    g,
    {
      title: "辽东请求议开边市",
      source: "辽东经略来文",
      person: "qi",
      region: "border",
      domain: "外交",
      body: "陛下，边外几个部族派人来，请求开办互市，用马匹换我们的粮食和布匹。当地守将认为，这样能缓和边境关系。但也有人担心，粮食和铁器会流到对方手中。是否同意，请陛下决定。",
      facts: [
        { label: "来文请求", value: "重议边市" },
        { label: "礼部拟议", value: "遣使定约" },
      ],
      options: ["trade", "peace", "defend", "observe"],
      decision: true,
    },
    12,
  );
  recordSnapshot(g);
  log(g, "万历十年，张居正去世后，皇帝亲裁政务。");
  return g;
}

function spend(g: Game, wanted: number): number {
  const paid = Math.min(g.treasury, Math.max(0, wanted));
  g.treasury -= paid;
  return paid;
}
// All silver leaving a stock has an explicit destination, including merchants and private diversion.
function consume(g: Game, value: number) {
  g.ledger.consumed += value;
}
function officialClaim(g: Game, r: Region, p: Person, independent = false) {
  const observation = clamp(
    (independent ? 0.6 + p.skill * 0.3 : 0.18 + p.skill * 0.3) +
      g.court.education * 0.08,
  );
  const estimate = r.ledgerGrain * (1 - observation) + r.grain * observation;
  const bias =
    1 + (p.rent * 0.25 + r.governor * 0.07) * (r.unrest > 0.2 ? 1.6 : 1);
  return Math.max(0, estimate * bias * (0.975 + random(g) * 0.05));
}
function regionalReport(
  g: Game,
  r: Region,
  kind: "routine" | "audit" | "audience" = "routine",
  speaker = "shen",
) {
  const p = person(g, speaker),
    claimed = officialClaim(g, r, p, kind === "audit");
  const people =
    r.ledgerPopulation * (kind === "audit" ? 0.55 : 0.8) +
    r.population * (kind === "audit" ? 0.45 : 0.2);
  const shortage = claimed / (Math.max(0.1, people) * 20);
  const statements =
    shortage < 3
      ? [
          "地方官说，存粮越来越少，希望朝廷早点安排救济。",
          "臣沿途看到粮价已经上涨，但当地官员仍说存粮够用。",
        ]
      : [
          "地方官说仓库里的粮食还够用，已经催各县整理秋粮账目。",
          "各县说农事正常，建议仍按原来的额度收税。",
        ];
  const title =
    kind === "audit"
      ? `${r.name}查验复奏`
      : kind === "audience"
        ? `${p.name}奉询回话`
        : `${r.name}钱粮季报`;
  report(
    g,
    {
      title,
      source:
        kind === "audit"
          ? `${p.name}差遣御史复核`
          : `${r.name}有司呈册 · ${p.name}转呈`,
      person: p.id,
      region: r.id,
      domain: "民生",
      body: `${statements[Math.floor(random(g) * statements.length)]} 这份报告根据${kind === "audit" ? "沿途抽查结果和各县提供的材料" : "地方账本"}整理。没有实地走访的县，仍然沿用以前的数据。${r.unrest > 0.45 && random(g) > 0.4 ? "另有商人说，路上看到不少离乡逃难的百姓。" : "钱粮还在运输安排中，收到以后会再报告。"}`,
      facts: [
        { label: "呈报仓粮", value: `${amount(claimed)}万石` },
        { label: "册籍人口", value: `${amount(people * 100)}万人` },
      ],
      claimGrain: claimed,
      claimPopulation: people,
      decision: kind === "routine" && shortage < 2.5,
      options: ["relief", "audit", "irrigation", "observe"],
    },
    4 + Math.floor(random(g) * 12),
  );
}
export function issue(
  g: Game,
  policy: Policy,
  regionId = "capital",
  reportId?: number,
  speaker = "shen",
): boolean {
  if (g.ended) return false;
  const r = local(g, regionId);
  const item =
    reportId === undefined
      ? undefined
      : g.reports.find((x) => x.id === reportId);
  if (
    reportId !== undefined &&
    (!item || item.resolved || !item.options.includes(policy))
  )
    return false;
  if (
    policy !== "observe" &&
    policy !== "delegate" &&
    g.commands.filter((c) => !c.reported).length >= 12
  )
    return false;
  if (item) {
    item.resolved = true;
    item.read = true;
  }
  if (policy === "observe") {
    log(g, `${item?.title || r.name}：留中观察。`);
    return true;
  }
  if (policy === "delegate") {
    g.court.delegated = !g.court.delegated;
    log(
      g,
      g.court.delegated
        ? "诏令：内阁按章办理例行事务。"
        : "诏令：恢复亲自审阅例行请示。",
    );
    return true;
  }
  const executor = person(g, speaker);
  const delay = regionId === "capital" ? 2 : 8 + Math.floor(random(g) * 16);
  const work: Partial<Record<Policy, number>> = {
    irrigation: 120,
    school: 180,
    arms: 150,
    tax: 90,
    audit: 40,
    campaign: 60,
    peace: 45,
    trade: 60,
    appoint: 25,
    recover: 15,
  };
  const arrives = g.day + delay;
  g.commands.push({
    id: g.nextId++,
    policy,
    region: r.id,
    issued: g.day,
    arrives,
    returns: arrives + (work[policy] || 16) + delay,
    executor: executor.id,
    budget: POLICY[policy].budget,
    spent: 0,
    delivered: 0,
    loss: 0,
    transit: 0,
    funded: false,
    executed: false,
    reported: false,
    outcome: "",
  });
  log(g, `诏令：${r.name}，${POLICY[policy].name}。交${executor.name}督办。`);
  return true;
}
export function ask(
  g: Game,
  speaker: string,
  regionId: string,
  topic: "grain" | "military" | "court",
): boolean {
  if (g.ended || g.day - g.lastPetition < 5) return false;
  const p = person(g, speaker),
    r = local(g, regionId);
  g.lastPetition = g.day;
  if (topic === "grain") regionalReport(g, r, "audience", p.id);
  else
    report(
      g,
      {
        title: `${p.name}奏对`,
        source: `御前召对 · ${p.role}`,
        person: p.id,
        region: r.id,
        domain: topic === "military" ? "边务" : "朝政",
        body:
          topic === "military"
            ? `${p.voice} ${r.name}名册上的兵员，还需要将领实际清点。臣会再问问军饷、训练和防御的情况，等回信到了再向陛下报告。`
            : `${p.voice} 最近各部门都说人手紧张、事务太多。请陛下明确谁负责这件事，同时也听听其他人的意见。`,
        facts: [
          { label: "所询地方", value: r.name },
          { label: "奏对人", value: p.name },
        ],
        options:
          topic === "military"
            ? ["pay", "defend", "arms", "observe"]
            : ["audit", "appoint", "recover", "observe"],
        decision: false,
      },
      1,
    );
  log(
    g,
    `召见${p.name}，垂询${r.name}${topic === "grain" ? "钱粮" : topic === "military" ? "军务" : "政事"}。`,
  );
  return true;
}
function fund(g: Game, c: Game["commands"][number]) {
  c.funded = true;
  const r = local(g, c.region),
    p = person(g, c.executor);
  const paid = spend(g, c.budget);
  c.spent = paid;
  // Divergence arises at authorization, transport and execution; never reroll an opened report.
  const capture = clamp(
    p.rent * 0.55 + r.governor * 0.11 + (1 - g.court.authority) * 0.09,
    0,
    0.42,
  );
  const loss = paid * capture;
  const delivered = paid - loss;
  c.loss = loss;
  c.transit = delivered;
  g.diversion += loss;
  r.silver += loss;
}
function execute(g: Game, c: Game["commands"][number]) {
  c.executed = true;
  const r = local(g, c.region),
    p = person(g, c.executor),
    paid = c.spent,
    delivered = c.transit,
    loss = c.loss;
  c.transit = 0;
  c.delivered = delivered;
  const effectiveness =
    delivered * (0.65 + p.skill * 0.35) * (r.control ? 1 : 0.3);
  consume(g, delivered);
  const funded = paid / (c.budget || 1);
  let outcome = funded < 0.9 ? "库银不足，未能足额起解。" : "已按诏起解。";
  switch (c.policy) {
    case "relief": {
      // Purchases move existing grain from another region; they never create grain.
      const donor = [...g.regions]
        .filter((x) => x.id !== r.id && x.control)
        .sort(
          (a, b) =>
            b.grain / (b.population || 1) - a.grain / (a.population || 1),
        )[0];
      const price = donor
        ? clamp(1.6 - donor.grain / (donor.population * 200), 0.6, 2.2)
        : 2.2;
      const requested = effectiveness / price;
      const food = donor
        ? Math.min(requested, Math.max(0, donor.grain - donor.population * 40))
        : 0;
      if (donor) {
        donor.grain -= food;
        r.grain += food;
      }
      r.unrest = clamp(r.unrest - Math.min(0.1, food / (r.population * 50)));
      outcome += ` 实际购粮${amount(food)}万石，侵耗银${amount(loss)}万两。`;
      break;
    }
    case "pay":
      r.army = clamp(r.army + effectiveness * 0.6, 0, 100);
      r.unrest = clamp(r.unrest - 0.04 * funded);
      outcome += ` 军镇实收银${amount(delivered)}万两。`;
      break;
    case "defend":
      r.army = clamp(r.army + effectiveness * 0.9, 0, 100);
      g.foreign.pressure = clamp(g.foreign.pressure - 0.07 * funded);
      break;
    case "campaign": {
      const strength =
        (r.army * 0.009 + g.court.arms * 0.5) * funded * (0.8 + p.skill * 0.4);
      const opposition = 0.45 + g.foreign.pressure * 0.7 + random(g) * 0.35;
      const won = strength > opposition;
      const killed = Math.min(
        r.population * 0.008,
        0.005 + Math.max(0, opposition - strength) * 0.04,
      );
      r.population -= killed;
      g.deaths += killed;
      r.army = clamp(r.army - 12 - opposition * 12, 0, 100);
      if (won) {
        g.foreign.pressure = clamp(g.foreign.pressure - 0.3);
        if (!r.control) r.control = true;
      } else {
        g.foreign.pressure = clamp(g.foreign.pressure + 0.1);
        r.unrest = clamp(r.unrest + 0.08);
      }
      outcome += won ? " 前线击退来敌。" : " 进军受挫，伤亡失粮。";
      break;
    }
    case "peace":
      g.foreign.truce = Math.round((180 + random(g) * 360) * funded);
      g.foreign.pressure = clamp(g.foreign.pressure - 0.15 * funded);
      break;
    case "trade":
      g.foreign.trade = clamp(g.foreign.trade + effectiveness * 0.01);
      g.foreign.pressure = clamp(g.foreign.pressure - 0.04 * funded);
      break;
    case "irrigation":
      r.infrastructure = clamp(r.infrastructure + effectiveness * 0.005);
      break;
    case "tax":
      g.court.tax = clamp(g.court.tax + effectiveness * 0.008, 0.65, 1.4);
      r.governor = clamp(r.governor - 0.1 * funded);
      r.unrest = clamp(r.unrest + 0.07 * funded);
      break;
    case "school":
      g.court.education = clamp(g.court.education + effectiveness * 0.008);
      break;
    case "arms":
      g.court.arms = clamp(g.court.arms + effectiveness * 0.007);
      break;
    case "appoint":
      r.governor = 0.2 + random(g) * 0.55;
      r.ledgerGrain = r.ledgerGrain * 0.7 + r.grain * 0.3;
      r.unrest = clamp(r.unrest + 0.025);
      break;
    case "recover":
      g.court.authority = clamp(g.court.authority + 0.12);
      break;
    case "relocate":
      if (r.control) {
        g.capital = r.id;
        outcome += ` 行在迁至${r.name}。`;
      } else outcome += " 该地失去控制，迁驻未成。";
      break;
    case "audit":
      r.governor = clamp(r.governor - 0.05 * funded);
      regionalReport(g, r, "audit", p.id);
      break;
  }
  c.outcome = outcome;
}
function commandReply(g: Game, c: Game["commands"][number]) {
  const p = person(g, c.executor),
    r = local(g, c.region);
  c.reported = true;
  let text: string;
  if (c.policy === "relocate")
    text =
      g.capital === r.id
        ? `礼部报告：朝廷已经迁到新的临时驻地——${r.name}，各部门已经跟随皇帝开始办公。`
        : "沿途官员说道路不通，搬迁还没有完成，请考虑别的驻地。";
  else if (c.policy === "recover")
    text =
      "内阁已经转达陛下的新要求，各部门都说会照办。实际是否做到，还要看接下来的报告。";
  else if (c.spent < c.budget * 0.8)
    text =
      "户部说国库的钱不够，这次没能发足款项。负责办理的官员希望再给一些时间。";
  else if (c.policy === "campaign")
    text = c.outcome.includes("击退")
      ? "前线将领说敌军已经退走，目前正在重新集合各营。伤亡人数还在清点，之后再报。"
      : "前线说敌军的行动有了变化，已经暂停进攻，请朝廷继续筹集援军和军费。";
  else
    text = [
      "负责办理的官员说，已经按诏令安排，花费的账目也已送到主管部门。各地收到款项的回执还没收齐。",
      "主管部门说，人员已经派出。地方官承诺会按时办完，请朝廷之后检查。",
      "督办官说，第一批工作已经完成。剩下的事情还在处理，下次再报告。",
    ][c.id % 3];
  report(g, {
    title: `${POLICY[c.policy].name} · 督办回奏`,
    source: `${p.name}转呈执行覆文`,
    person: p.id,
    region: r.id,
    domain: POLICY[c.policy].domain as Report["domain"],
    body: text,
    facts: [
      { label: "原诏日期", value: dateOf(c.issued) },
      { label: "原定拨银", value: `${amount(c.budget)}万两` },
    ],
    options: ["audit", "appoint", "observe"],
    decision: false,
  });
}
function treasuryReport(g: Game) {
  const p = person(g, "shen");
  const unarrived = g.commands
    .filter((c) => !c.executed)
    .reduce((s, c) => s + c.budget, 0);
  const claim = Math.max(
    0,
    g.treasury * (1.02 + p.rent * 0.3) + unarrived * 0.45 + 12,
  );
  report(
    g,
    {
      title: "户部钱粮月报",
      source: `户部汇册 · ${p.name}进呈`,
      person: p.id,
      region: g.capital,
      domain: "钱粮",
      body: "陛下，这次国库收支是根据各部门账本汇总的。已发出但还没到的钱，以及决定要花但尚未支付的钱，账上仍暂按原数记录。各地税款有早有晚，安排支出时请留些余地。",
      facts: [
        { label: "册报库银", value: `${amount(claim)}万两` },
        { label: "汇册年月", value: dateOf(g.day) },
      ],
      claimSilver: claim,
      options: ["tax", "trade", "audit", "observe"],
      decision: claim < 80,
    },
    3,
  );
}
function month(g: Game) {
  const monthIndex = Math.floor(((g.day + 180) % 360) / 30);
  let arrears = 0;
  for (const r of g.regions) {
    const produce =
      r.population *
      (0.85 + g.foreign.trade * 0.3 + g.court.education * 0.12) *
      (r.control ? 1 : 0.55);
    r.silver += produce;
    g.ledger.minted += produce;
    const assessment = r.population * 0.58 * g.court.tax * (r.control ? 1 : 0);
    const tax = Math.min(r.silver, assessment);
    r.silver -= tax;
    const cut =
      tax * (0.1 + r.governor * 0.16 + (1 - g.court.authority) * 0.04);
    r.silver += cut;
    g.treasury += tax - cut;
    g.diversion += cut;
    const living = Math.min(r.silver, r.population * 0.22);
    r.silver -= living;
    consume(g, living);
    if (monthIndex === 5 || monthIndex === 9) {
      // Arable capacity is independent of current population. More people do not create farmland.
      const land = REGION_SEEDS.find(([id]) => id === r.id)![2];
      const crop =
        land *
        150 *
        r.harvest *
        (0.93 + r.infrastructure * 0.45) *
        (1 + g.court.education * 0.65) *
        (1 - r.unrest * 0.16);
      r.grain += crop;
      g.ledger.grown += crop;
      const levy = crop * 0.025 * (r.control ? 1 : 0);
      r.grain -= levy;
      g.granary += levy;
      r.ledgerGrain += crop * (1.025 + r.governor * 0.05) - levy;
    }
    const need = r.population * 20,
      food = Math.min(r.grain, need);
    r.grain -= food;
    g.ledger.eaten += food;
    const lack = (need - food) / (need || 1);
    const deaths = r.population * lack * 0.018;
    r.population -= deaths;
    g.deaths += deaths;
    r.unrest = clamp(
      r.unrest + lack * 0.15 + (g.court.tax - 1) * 0.008 - 0.012,
    );
    r.population *= 1 + (0.00032 * (1 - r.unrest) - lack * 0.003); // Net vital growth excludes recorded famine/war deaths.
    const rot = r.grain * 0.0025;
    r.grain -= rot;
    g.ledger.spoiled += rot;
    r.ledgerGrain = Math.max(
      0,
      r.ledgerGrain - need * 0.94 - r.ledgerGrain * 0.001,
    );
    r.ledgerGrain = r.ledgerGrain * 0.96 + r.grain * 0.04;
    r.ledgerPopulation = r.ledgerPopulation * 0.99 + r.population * 0.01;
    r.ledgerSilver = r.ledgerSilver * 0.8 + r.silver * 0.2;
    r.army = clamp(r.army - 0.42 - r.unrest * 0.25, 0, 100);
    r.infrastructure *= 0.998;
    if (r.unrest > 0.77 && r.control && random(g) < 0.18) {
      r.control = false;
      report(
        g,
        {
          title: `${r.name}道路中断`,
          source: "邻省守臣急报",
          person: "qi",
          region: r.id,
          domain: "边务",
          body: "邻省官员报告，已经联系不上当地几座城池，公文和税款也连续几次没有送到。对方说还有官军留守，但具体情况不清楚。请陛下决定是否派兵支援，或先安排救济。",
          facts: [
            { label: "所报情形", value: "城池失联" },
            { label: "消息渠道", value: "邻省来文" },
          ],
          options: ["campaign", "relief", "defend", "observe"],
          decision: true,
        },
        8,
      );
    }
    // Flight redistributes people inside the simulated realm, rather than deleting them.
    if (r.unrest > 0.4) {
      const to = g.regions.find(
        (x) => x.control && x.unrest < 0.2 && x.id !== r.id,
      );
      if (to) {
        const migrants = r.population * 0.001 * r.unrest;
        r.population -= migrants;
        to.population += migrants;
      }
    }
  }
  const governed = g.regions.filter((r) => r.control);
  const budget =
    governed.reduce((s, r) => s + r.population * 0.4 + r.army * 0.02, 0) +
    g.court.education * 5 +
    g.court.arms * 7 +
    g.foreign.pressure * 7;
  const paid = spend(g, budget);
  consume(g, paid);
  arrears = 1 - paid / budget;
  const grainUse = Math.min(g.granary, 28);
  g.granary -= grainUse;
  g.ledger.eaten += grainUse;
  const rot = g.granary * 0.004;
  g.granary -= rot;
  g.ledger.spoiled += rot;
  if (arrears > 0.15) {
    for (const r of g.regions) {
      r.army = clamp(r.army - arrears * 2, 0, 100);
      r.unrest = clamp(r.unrest + arrears * 0.024);
    }
  }
  g.court.authority = clamp(
    g.court.authority -
      (g.court.delegated ? 0.004 : 0.0005) +
      g.court.education * 0.0006,
    0.18,
    1,
  );
  g.court.education *= 0.999;
  g.court.arms *= 0.998;
  g.foreign.pressure = clamp(
    g.foreign.pressure + 0.008 + random(g) * 0.015 - g.foreign.trade * 0.007,
  );
  if (g.foreign.truce === 0 && g.foreign.pressure > 0.68 && random(g) < 0.22) {
    const front = [
      "border",
      "capital",
      "north",
      "river",
      "lake",
      "south",
      "west",
      "coast",
    ]
      .map((id) => local(g, id))
      .find((r) => r.control);
    if (!front) {
      g.ended = "defeat";
      return;
    }
    const strength = front.army / 100 + g.court.arms * 0.4;
    const damage = Math.max(0, g.foreign.pressure - strength) * 0.07;
    const destroyed = Math.min(front.grain, damage * 300);
    front.grain -= destroyed;
    g.ledger.spoiled += destroyed;
    const dead = Math.min(front.population, damage * 0.2);
    front.population -= dead;
    g.deaths += dead;
    front.unrest = clamp(front.unrest + damage * 1.5);
    front.army = clamp(front.army - 4, 0, 100);
    report(
      g,
      {
        title: `${front.name}烽报`,
        source: "兵部转前线守臣急递",
        person: "qi",
        region: front.id,
        domain: "边务",
        body: `敌军骑兵越过了边界。${front.name}守将说，几个村庄受到袭击。军队正在催要粮饷，请陛下决定加强防守、派兵进攻，还是派使者谈和。伤亡和粮食损失还没有报齐。`,
        facts: [
          { label: "守臣所请", value: "议援兵饷" },
          { label: "递送途径", value: "驿站急递" },
        ],
        options: ["defend", "pay", "campaign", "peace", "observe"],
        decision: true,
      },
      7,
    );
  }
  if (g.day % 90 === 0) {
    const r = g.regions[Math.floor(random(g) * g.regions.length)];
    regionalReport(g, r);
    treasuryReport(g);
  }
  if (g.day % 180 === 0) {
    const r = g.regions[Math.floor(random(g) * g.regions.length)];
    report(
      g,
      {
        title: `${r.name}呈请兴修`,
        source: "工部会同地方题请",
        person: "shen",
        region: r.id,
        domain: "工务",
        body: "地方希望修堤坝、疏通水渠，减少水灾和旱灾的影响。工部另外提出开办学馆、改进军器。如果一起做，钱和人手可能不够。请陛下决定先做哪一项。",
        facts: [
          { label: "地方建议", value: "修堤疏渠" },
          { label: "内阁意见", value: "量力择先" },
        ],
        options: ["irrigation", "school", "arms", "observe"],
        decision: true,
      },
      10,
    );
  }
  if (g.day % 360 === 0) {
    for (const r of g.regions) {
      r.harvest = 0.7 + random(g) * 0.55;
      if (random(g) < 0.13) r.harvest *= 0.62;
    }
    g.ruler.heirAge++;
    recordSnapshot(g);
    replaceOfficials(g);
  }
  if (!local(g, g.capital).control) {
    const haven = g.regions
      .filter((r) => r.control)
      .sort((a, b) => b.population - a.population)[0];
    if (haven) {
      g.capital = haven.id;
      report(
        g,
        {
          title: "百司随驾转驻行在",
          source: "随驾礼部奏报",
          person: "shen",
          region: haven.id,
          domain: "朝政",
          body: `京城的道路已经被切断。大臣们陪同陛下转移到了${haven.name}。各部门的印信仍然保留，继续支持朝廷的地方也还在听从命令。请陛下决定下一步怎样恢复局面。`,
          facts: [
            { label: "暂驻行在", value: haven.name },
            { label: "礼部所报", value: "百司续办" },
          ],
          options: ["recover", "campaign", "observe"],
          decision: true,
        },
        1,
      );
    } else g.ended = "defeat";
  }
}
function replaceOfficials(g: Game) {
  for (const p of [...g.people]) {
    if (!p.retired && yearOf(g.day) - p.born > 62 && random(g) < 0.18) {
      p.retired = true;
      const surnames = ["王", "陈", "李", "徐", "刘", "周", "赵", "孙"];
      const names = [
        "廷瑞",
        "允中",
        "文衡",
        "应麟",
        "维桢",
        "秉谦",
        "世宁",
        "景明",
      ];
      const id = `official-${g.nextId++}`;
      const successor: Person = {
        id,
        name:
          surnames[Math.floor(random(g) * 8)] +
          names[Math.floor(random(g) * 8)],
        role: p.role,
        born: yearOf(g.day) - 39 - Math.floor(random(g) * 12),
        portrait: p.portrait,
        voice:
          "陛下，臣会按规定办事。先把本部门了解到的情况说明白，再请陛下决定。",
        skill: 0.45 + random(g) * 0.45,
        rent: 0.04 + random(g) * 0.3,
        network: 0.25 + random(g) * 0.6,
        retired: false,
      };
      g.people.push(successor);
      log(g, `${p.name}离任，${successor.name}接掌${successor.role}。`);
      report(g, {
        title: "官员交接名册",
        source: "吏部奏报",
        person: successor.id,
        region: g.capital,
        domain: "朝政",
        body: `${p.name}因年老离任。吏部按照通常的选任程序，安排${successor.name}接掌${successor.role}。请陛下过目，之后可以召见他，问问具体打算。`,
        facts: [
          { label: "新任官员", value: successor.name },
          { label: "接任职务", value: successor.role },
        ],
        options: ["recover", "observe"],
        decision: false,
      });
    }
  }
}
function succession(g: Game) {
  const prev = g.ruler.name;
  g.ruler = {
    name: `朱${["常", "由", "慈", "和", "承", "绍", "景", "祐"][(g.ruler.generation - 1) % 8]}${["宁", "晟", "钧", "宸", "熙", "澄"][(g.ruler.generation - 1) % 6]}`,
    born: yearOf(g.day) - Math.max(17, Math.min(35, g.ruler.heirAge)),
    generation: g.ruler.generation + 1,
    ends: g.day + 360 * (22 + Math.floor(random(g) * 22)),
    heirAge: 0,
  };
  g.court.authority = clamp(g.court.authority - 0.1, 0.18, 1);
  log(g, `${prev}驾崩，宗室${g.ruler.name}承统，钱粮与诏令沿旧办理。`);
  report(g, {
    title: "奉迎新君承统",
    source: "礼部奉诏颁告",
    person: "shen",
    region: g.capital,
    domain: "朝政",
    body: `先帝${prev}驾崩，${g.ruler.name}继位。国库、尚未办完的诏令和边境事务，都会由新君继续接手。建议召集大臣开一次廷议，明确接下来的安排。`,
    facts: [
      { label: "新君", value: g.ruler.name },
      { label: "朝廷", value: "延续旧章" },
    ],
    options: ["recover", "delegate", "observe"],
    decision: true,
  });
}
export function pending(g: Game) {
  return g.reports.filter((r) => r.decision && !r.resolved);
}
/** Advances only through actual calendar ticks; pause is driven by received petitions, not secret facts. */
export function advance(g: Game, days = 30): number {
  if (g.ended || pending(g).length) return 0;
  let count = 0;
  for (let n = 0; n < Math.min(days, 360); n++) {
    g.day++;
    count++;
    if (g.foreign.truce > 0) g.foreign.truce--;
    if (g.day % 30 === 0) month(g);
    for (const c of g.commands) {
      if (!c.funded && g.day >= c.issued + 2) fund(g, c);
      if (!c.executed && g.day >= c.arrives + (c.returns - c.arrives) * 0.65)
        execute(g, c);
      if (!c.reported && g.day >= c.returns) commandReply(g, c);
    }
    const arrived = g.mail.filter((m) => m.received <= g.day);
    g.mail = g.mail.filter((m) => m.received > g.day);
    g.reports.push(...arrived);
    if (g.court.delegated)
      for (const r of pending(g)) {
        if (r.domain === "民生" || r.domain === "工务") {
          if (g.commands.filter((c) => !c.reported).length < 12)
            issue(
              g,
              r.options.includes("relief") ? "relief" : "observe",
              r.region,
              r.id,
            );
        }
      }
    if (g.day >= g.ruler.ends) succession(g);
    if (g.day >= 108000 && !g.ended) g.ended = "victory";
    if (g.ended) {
      recordSnapshot(g);
      log(
        g,
        g.ended === "victory"
          ? "自亲政起三百年，王朝仍在延续。"
          : "诸地已无可接续的皇室政权。",
      );
      break;
    }
    if (pending(g).length) break;
  }
  return count;
}
export function retire(g: Game) {
  if (g.ended) return;
  g.ended = "retired";
  recordSnapshot(g);
  log(g, "结束本局，封存史册。");
}
export function invariants(g: Game) {
  return {
    silverError:
      totalSilver(g) -
      (g.ledger.initialSilver +
        g.ledger.minted -
        g.ledger.consumed -
        g.ledger.lost),
    grainError:
      totalGrain(g) -
      (g.ledger.initialGrain +
        g.ledger.grown -
        g.ledger.eaten -
        g.ledger.spoiled),
  };
}

/** Explicit UI boundary. No hidden state, queued mail, scores, actual execution or live stocks. */
export function view(g: Game) {
  return {
    day: g.day,
    date: dateOf(g.day),
    ruler: {
      name: g.ruler.name,
      generation: g.ruler.generation,
      age: yearOf(g.day) - g.ruler.born,
    },
    capital: local(g, g.capital).name,
    ended: g.ended,
    delegated: g.court.delegated,
    canAsk: g.day - g.lastPetition >= 5,
    commands: g.commands.map((c) => ({
      id: c.id,
      title: POLICY[c.policy].name,
      region: local(g, c.region).name,
      issued: c.issued,
      status: c.reported ? "收到覆文" : "诏令已发",
      executor: g.people.find((p) => p.id === c.executor)?.name || "经办官",
      budget: c.budget,
    })),
    reports: g.reports,
    people: g.people
      .filter((p) => !p.retired)
      .map(({ id, name, role, portrait, voice }) => ({
        id,
        name,
        role,
        portrait,
        voice,
      })),
    regions: g.regions.map(({ id, name }) => ({ id, name })),
    history: g.history.slice(-300),
    pending: pending(g).map((r) => r.id),
    lastSilver: [...g.reports]
      .reverse()
      .find((r) => r.claimSilver !== undefined),
    settlement: g.ended
      ? {
          annual: g.annual,
          commands: g.commands.map((c) => ({
            ...c,
            name: POLICY[c.policy].name,
          })),
          ledger: g.ledger,
          actual: snapshot(g),
          seed: g.seed,
        }
      : null,
  };
}
export type View = ReturnType<typeof view>;
