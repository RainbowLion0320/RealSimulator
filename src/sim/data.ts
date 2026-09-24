import type { Person, Policy } from "./types";
export const PEOPLE: Person[] = [
  {
    id: "zhang",
    name: "张四维",
    role: "内阁首辅",
    born: 1526,
    portrait: "zhang",
    voice:
      "陛下，先让经办官说明情况，再决定是否调整制度。一下改动太多，地方可能跟不上。",
    skill: 0.7,
    rent: 0.19,
    network: 0.75,
    retired: false,
  },
  {
    id: "shen",
    name: "申时行",
    role: "内阁大学士",
    born: 1535,
    portrait: "shen",
    voice:
      "陛下，可以多听几方的说法。地方有什么困难要问清，朝廷也得留出应急的钱。",
    skill: 0.77,
    rent: 0.12,
    network: 0.65,
    retired: false,
  },
  {
    id: "feng",
    name: "冯保",
    role: "司礼监掌印太监",
    born: 1531,
    portrait: "feng",
    voice: "陛下，奴婢可以另外派人去问。但路上来回需要时间，未必马上就有回话。",
    skill: 0.66,
    rent: 0.24,
    network: 0.8,
    retired: false,
  },
  {
    id: "qi",
    name: "戚继光",
    role: "蓟镇总兵",
    born: 1528,
    portrait: "qi",
    voice:
      "陛下，名册上有兵，不等于都能上阵。先让士兵按时拿到粮饷，训练才能坚持下去。",
    skill: 0.9,
    rent: 0.05,
    network: 0.28,
    retired: false,
  },
];
export const REGION_SEEDS = [
  ["capital", "北直隶", 8],
  ["north", "山陕", 10],
  ["river", "河南山东", 12],
  ["south", "南直隶浙江", 14],
  ["lake", "湖广江西", 10],
  ["west", "四川云贵", 8],
  ["coast", "福建两广", 6],
  ["border", "辽东蓟镇", 5],
] as const;
export const POLICY: Record<
  Policy,
  { name: string; detail: string; budget: number; domain: string }
> = {
  relief: {
    name: "拨款赈济",
    detail:
      "批准花二十万两银子买粮救灾。交地方官办理，之后上报花费和发粮情况。",
    budget: 20,
    domain: "民生",
  },
  audit: {
    name: "另派人查验",
    detail: "花二万两差旅费，派人核对账目、走访当地。之后送回查验报告。",
    budget: 2,
    domain: "朝政",
  },
  pay: {
    name: "先发军饷",
    detail: "批准拨出三十万两军饷。让将领在收到钱后上报。",
    budget: 30,
    domain: "边务",
  },
  defend: {
    name: "加强边防",
    detail: "拨二十五万两修缮防御、训练士兵。具体安排交给兵部和将领。",
    budget: 25,
    domain: "边务",
  },
  campaign: {
    name: "批准出兵",
    detail:
      "拨六十万两，授权将领制定进攻计划。军粮运输、战果和伤亡由前线继续报告。",
    budget: 60,
    domain: "边务",
  },
  peace: {
    name: "派使者议和",
    detail:
      "拨十五万两准备使团和礼物，商谈停战条件。对方是否接受，要等使者回报。",
    budget: 15,
    domain: "外交",
  },
  trade: {
    name: "开放边境互市",
    detail: "拨十二万两筹建边境市场。让礼部和地方商量交易范围及税收办法。",
    budget: 12,
    domain: "外交",
  },
  irrigation: {
    name: "兴修水利",
    detail: "拨四十万两修堤坝、疏通水渠。让工部与地方分期完成工程。",
    budget: 40,
    domain: "工务",
  },
  tax: {
    name: "清查田亩与税册",
    detail:
      "拨十八万两，重新丈量土地、核对税册。地方需要安排人手，也可能遇到阻力。",
    budget: 18,
    domain: "钱粮",
  },
  school: {
    name: "开办学馆",
    detail:
      "拨二十万两，培养算学、水利和翻译人才。办学和推广新方法都需要时间。",
    budget: 20,
    domain: "工务",
  },
  arms: {
    name: "改进军器",
    detail:
      "拨三十五万两，让工匠试制火器、军队安排试用。之后听取试制和训练报告。",
    budget: 35,
    domain: "边务",
  },
  appoint: {
    name: "更换经办官员",
    detail:
      "让吏部选派新人，交接地方账目。拨一万两安排赴任，新官需要时间熟悉当地。",
    budget: 1,
    domain: "朝政",
  },
  observe: {
    name: "暂不批准，继续观察",
    detail: "这次不作新的安排，维持现状，等待后续消息。奏折保留在档案中。",
    budget: 0,
    domain: "朝政",
  },
  delegate: {
    name: "授权内阁常务",
    detail: "让内阁处理例行钱粮和救灾申请。战争、继承等重大事项仍由皇帝决定。",
    budget: 0,
    domain: "朝政",
  },
  relocate: {
    name: "迁驻新的行在",
    detail:
      "拨三十万两，把朝廷迁到所选地方的行在，也就是临时驻地。让礼部安排沿途事务。",
    budget: 30,
    domain: "朝政",
  },
  recover: {
    name: "召集廷议，亲自决策",
    detail: "召集各部大臣，重新说明办事规矩，要求重要公文直接送到皇帝手中。",
    budget: 0,
    domain: "朝政",
  },
};
export const yearOf = (day: number) => 1582 + Math.floor((day + 180) / 360);
export const dateOf = (day: number) =>
  `${yearOf(day)}年${Math.floor(((day + 180) % 360) / 30) + 1}月${(day % 30) + 1}日`;
export const reignDate = (day: number) =>
  `${yearOf(day) < 1620 ? "万历" + (yearOf(day) - 1572) + "年" : "皇明纪年"} · ${dateOf(day)}`;
export const amount = (n: number) =>
  n.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
