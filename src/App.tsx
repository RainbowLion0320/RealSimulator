import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Users,
  Scroll,
  Archive,
  MapTrifold,
  Play,
  Pause,
  Gear,
  Sword,
  Seal,
  ArrowLeft,
  ArrowRight,
  X,
  FloppyDisk,
  DownloadSimple,
  UploadSimple,
  Check,
  EnvelopeSimple,
  CaretRight,
  Clock,
  Plus,
  LockSimple,
} from "@phosphor-icons/react";
import { Capacitor } from "@capacitor/core";
import { SaveFile } from "./native";
import { App as NativeApp } from "@capacitor/app";
import {
  advance,
  ask,
  issue,
  newGame,
  retire,
  view,
  type View,
} from "./sim/engine";
import { POLICY, amount, dateOf, reignDate } from "./sim/data";
import { decode, encode, load, save, slotInfo } from "./sim/save";
import type { Game, Policy, Report } from "./sim/types";
import { opinion } from "./sim/dialogue";
import {
  GUIDE,
  STEPS,
  tutorialStep,
  tutorialAllows,
  tutorialEvent,
  syncTutorial,
  skipTutorial,
} from "./sim/tutorial";

type Page = "desk" | "people" | "orders" | "archive" | "map";
const NAV = [
  ["desk", "案头", BookOpen],
  ["people", "召见", Users],
  ["orders", "诏令", Scroll],
  ["archive", "档案", Archive],
  ["map", "舆图", MapTrifold],
] as const;
function Portrait({
  id,
  size = "small",
  name = "",
}: {
  id: string;
  size?: "small" | "large";
  name?: string;
}) {
  return (
    <img className={`portrait ${size}`} src={`assets/${id}.png`} alt={name} />
  );
}
export default function App() {
  const [initial] = useState(() => {
    try {
      return { game: load() || newGame(), error: "" };
    } catch (e) {
      return { game: newGame(), error: (e as Error).message };
    }
  });
  const game = useRef<Game>(initial.game);
  const [v, setV] = useState(() => view(game.current));
  const [page, setPage] = useState<Page>(() => {
    const step = tutorialStep(game.current);
    return step === "orders"
      ? "orders"
      : step === "audience"
        ? "people"
        : step === "archive"
          ? "archive"
          : step === "map"
            ? "map"
            : "desk";
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState(initial.error);
  const [settings, setSettings] = useState(Boolean(initial.error));
  const [sheet, setSheet] = useState<{
    region: string;
    report?: Report;
  } | null>(null);
  const [speaker, setSpeaker] = useState("shen");
  const [region, setRegion] = useState("north");
  const [audience, setAudience] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<"new" | "end" | null>(null);
  const [safeToSave, setSafeToSave] = useState(!initial.error);
  const file = useRef<HTMLInputElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const [slotVersion, setSlotVersion] = useState(0);
  const [archiveLimit, setArchiveLimit] = useState(50);
  const [orderLimit, setOrderLimit] = useState(60);
  const lastSaved = useRef(game.current.day);
  const step = tutorialStep(game.current);
  const learning = step !== "done";
  const canOpen = (target: Page) => tutorialAllows(step, target);
  useEffect(() => setArchiveLimit(50), [query]);
  const refresh = (persist = true) => {
    syncTutorial(game.current);
    setV(view(game.current));
    if (safeToSave && persist)
      try {
        save(game.current);
        lastSaved.current = game.current.day;
      } catch {
        setNotice(
          "自动存档未成功：设备存储不足或被限制。请打开存档并导出备份。",
        );
      }
  };
  useEffect(() => {
    if (!safeToSave) return;
    try {
      save(game.current);
    } catch {
      setNotice("本机暂时无法保存，请导出存档备份。");
    }
  }, [safeToSave]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const guidedWait = tutorialStep(game.current) === "wait";
      const elapsed = advance(game.current, guidedWait ? 1 : 7);
      syncTutorial(game.current);
      const guideArrived = guidedWait && tutorialStep(game.current) === "reply";
      refresh(
        game.current.day - lastSaved.current >= 30 ||
          !elapsed ||
          !!game.current.ended ||
          view(game.current).pending.length > 0 ||
          guideArrived,
      );
      if (guideArrived) {
        setPage("desk");
        setSelected(game.current.tutorial?.replyId ?? null);
      }
      if (
        guideArrived ||
        !elapsed ||
        game.current.ended ||
        view(game.current).pending.length
      )
        setRunning(false);
    }, 650);
    return () => clearInterval(timer);
  }, [running, safeToSave]);
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 });
  }, [page, selected, step]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const back = NativeApp.addListener("backButton", () => {
      setRunning(false);
      if (settings) setSettings(false);
      else if (sheet) setSheet(null);
      else if (audience) setAudience(null);
      else if (page !== "desk") setPage("desk");
      else setSettings(true);
    });
    const pause = NativeApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        setRunning(false);
        refresh();
      }
    });
    return () => {
      back.then((h) => h.remove());
      pause.then((h) => h.remove());
    };
  }, [settings, sheet, audience, page]);
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setRunning(false);
        refresh();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  const unread = v.reports.filter((r) => !r.resolved);
  const current =
    (learning && ["read", "decision"].includes(step)
      ? v.reports.find((r) => r.id === game.current.tutorial?.firstReportId)
      : undefined) ||
    (step === "reply"
      ? v.reports.find((r) => r.id === game.current.tutorial?.replyId)
      : undefined) ||
    v.reports.find((r) => r.id === selected) ||
    unread.find((r) => r.decision) ||
    unread[unread.length - 1] ||
    v.reports[v.reports.length - 1];
  const activeSpeaker = v.people.find((p) => p.id === speaker) || v.people[0];
  const act = (p: Policy, target: string, report?: Report) => {
    if (!issue(game.current, p, target, report?.id, activeSpeaker.id)) {
      setNotice(
        "尚有十二道诏令等待覆文，请先推进时间，或检查该奏报是否已经批复。",
      );
      return;
    }
    setRunning(false);
    setSheet(null);
    if (step === "decision") {
      tutorialEvent(game.current, "decided");
      setPage("orders");
    }
    setNotice(
      p === "observe"
        ? "这次暂不批准，奏折已存入档案。"
        : p === "delegate"
          ? "常务呈报章程已更新。"
          : "诏令已发出，等待负责官员的报告。",
    );
    setSelected(null);
    refresh();
  };
  const start = () => {
    if (v.ended) return;
    if (learning && step !== "wait") return;
    if (v.pending.length) {
      setPage("desk");
      setSelected(v.pending[0]);
      setNotice("请先批阅需要裁决的奏报。");
      return;
    }
    refresh();
    setRunning((x) => !x);
  };
  const read = (r: Report) => {
    if (step === "archive" && game.current.tutorial)
      game.current.tutorial.reviewedArchive = true;
    r.read = true;
    setSelected(r.id);
    setPage("desk");
    refresh();
  };
  const mark = () => {
    if (current) {
      current.read = true;
      current.resolved = true;
      setSelected(null);
      refresh();
    }
  };
  const replace = (g: Game) => {
    game.current = g;
    lastSaved.current = g.day;
    setSafeToSave(true);
    try {
      save(g);
    } catch {
      setNotice("读档成功，但自动保存未成功，请保留导出的文件。");
    }
    setV(view(g));
    setSelected(null);
    setRunning(false);
    setSheet(null);
    setAudience(null);
    setQuery("");
    setSettings(false);
    const restoredStep = tutorialStep(g);
    setPage(
      restoredStep === "orders"
        ? "orders"
        : restoredStep === "audience"
          ? "people"
          : restoredStep === "archive"
            ? "archive"
            : restoredStep === "map"
              ? "map"
              : "desk",
    );
    setSlotVersion((x) => x + 1);
  };
  const exportSave = async () => {
    try {
      const text = encode(game.current);
      const name = `大明王朝1582-${game.current.day}.json`;
      if (Capacitor.isNativePlatform()) {
        await SaveFile.save({ name, content: text });
      } else {
        const u = URL.createObjectURL(
          new Blob([text], { type: "application/json" }),
        );
        const a = document.createElement("a");
        a.href = u;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 60000);
      }
      setNotice(
        Capacitor.isNativePlatform()
          ? "存档文件已保存，可转移到网页版。"
          : "已请求下载存档，请在浏览器下载记录中确认。",
      );
    } catch (e) {
      setNotice(
        (e as { code?: string }).code === "CANCELED"
          ? "已取消导出，本机存档保持不变。"
          : "导出未完成，请保留本机存档后重试。",
      );
    }
  };
  const importSave = async (f: File) => {
    try {
      if (f.size > 30_000_000) throw new Error("存档文件过大。");
      const g = decode(await f.text());
      save(game.current, "3");
      replace(g);
      setNotice("已导入存档，原王朝已备份到存档 3。");
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const leaveGuide = () => {
    skipTutorial(game.current);
    setRunning(false);
    setSheet(null);
    setAudience(null);
    setSettings(false);
    refresh();
    setNotice("全部系统已开放。点击皇帝头像可以查看玩法说明和存档。");
  };
  const guideAction = () => {
    if (step === "welcome") tutorialEvent(game.current, "begin");
    if (step === "read" || step === "decision") {
      tutorialEvent(game.current, "read");
      const first = game.current.reports.find(
        (r) => r.id === game.current.tutorial?.firstReportId,
      );
      if (first) setSheet({ region: first.region, report: first });
    }
    if (step === "orders") {
      if (page !== "orders") setPage("orders");
      else {
        tutorialEvent(game.current, "orders");
        setPage("people");
      }
    }
    if (step === "audience") {
      setRegion("north");
      setAudience("qi");
      setRunning(false);
    }
    if (step === "wait") {
      setPage("desk");
      start();
    }
    if (step === "reply") {
      const reply = game.current.reports.find(
        (r) => r.id === game.current.tutorial?.replyId,
      );
      if (reply) {
        reply.read = true;
        reply.resolved = true;
      }
      tutorialEvent(game.current, "reply");
      setQuery("");
      setPage("archive");
    }
    if (step === "archive") {
      if (game.current.tutorial?.reviewedArchive) {
        tutorialEvent(game.current, "archive");
        setPage("map");
      } else if (page !== "archive") setPage("archive");
      else {
        const first = game.current.reports.find(
          (r) => r.id === game.current.tutorial?.firstReportId,
        );
        if (first) read(first);
      }
    }
    if (step === "map") {
      if (page !== "map") setPage("map");
      else {
        tutorialEvent(game.current, "map");
        setPage("desk");
        setSelected(null);
        setNotice("亲政引导完成。现在可以独立处理朝政，点击皇帝头像随时存档。");
      }
    }
    refresh();
  };
  const guideLabel =
    step === "orders" && page === "orders"
      ? "看过记录，继续召见"
      : step === "archive" && game.current.tutorial?.reviewedArchive
        ? "了解了，看看地方来文"
        : step === "archive" && page === "archive"
          ? "翻阅最初的军饷奏折"
          : step === "map" && page === "map"
            ? "开始独立处理朝政"
            : step === "wait" && running
              ? "正在等候来文…"
              : learning
                ? GUIDE[step].action
                : "";
  return (
    <div className="stage">
      <aside className="desktop-note">
        <span className="seal">御</span>
        <h1>
          大明<span>王朝1582</span>
        </h1>
        <p>
          一纸奏报之内，
          <br />
          一个王朝之外。
        </p>
        <small>
          万历十年 · 从亲政开始
          <br />
          离线王朝模拟 / 第一版
        </small>
      </aside>
      <main className={learning ? "phone guided" : "phone"}>
        <header className="topbar">
          <button
            className="emperor"
            onClick={() => {
              setRunning(false);
              setSettings(true);
            }}
            aria-label="王朝与存档"
          >
            <Portrait id="wanli" name={v.ruler.name} />
            <span>
              <strong>大明王朝1582</strong>
              <small>
                {v.ruler.generation === 1
                  ? "万历" + (Math.floor((v.day + 180) / 360) + 10) + "年 · "
                  : ""}
                {dateOf(v.day)}
              </small>
            </span>
          </button>
          <button
            className="time"
            onClick={start}
            disabled={!!v.ended || (learning && step !== "wait")}
            aria-label={running ? "暂停时间" : "继续时间"}
          >
            {running ? (
              <Pause size={16} weight="fill" />
            ) : (
              <Play size={16} weight="fill" />
            )}
            <span>{v.ended ? "已封卷" : running ? "行进中" : "已暂停"}</span>
          </button>
        </header>
        <div className="content" ref={scroll}>
          {v.ended && v.settlement ? (
            <Settlement v={v} onSettings={() => setSettings(true)} />
          ) : (
            <>
              {learning && (
                <section className="guide-card" aria-label="亲政引导">
                  <div className="guide-meta">
                    <span>
                      亲政引导 ·{" "}
                      {step === "welcome"
                        ? "启程"
                        : `${STEPS.indexOf(step)} / 8`}
                    </span>
                    <button onClick={leaveGuide}>跳过引导</button>
                  </div>
                  <h2>{GUIDE[step].title}</h2>
                  <p>{GUIDE[step].text}</p>
                </section>
              )}
              {page === "desk" && step !== "welcome" && (
                <>
                  <div className="eyebrow">
                    <span>
                      <Seal size={17} /> 待阅奏报
                    </span>
                    {canOpen("archive") && (
                      <button onClick={() => setPage("archive")}>
                        {unread.length} 份在案 <CaretRight size={14} />
                      </button>
                    )}
                  </div>
                  {current ? (
                    <article className="memorial">
                      <div className="report-kicker">
                        <span>{current.domain}</span>
                        <span>
                          {current.resolved
                            ? "已批复"
                            : current.decision
                              ? "候旨"
                              : "阅知"}
                        </span>
                      </div>
                      <h2>{current.title}</h2>
                      <p className="source">
                        {current.source}
                        <br />
                        <span>
                          {dateOf(current.received)}收到 ·{" "}
                          {dateOf(current.written)}成文
                        </span>
                      </p>
                      <div className="rule">
                        <span>奏</span>
                      </div>
                      <p className="report-body">{current.body}</p>
                      {current.facts.length > 0 && (
                        <div className="facts">
                          {current.facts.map((f) => (
                            <div key={f.label}>
                              <small>{f.label}</small>
                              <strong>{f.value}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                      {canOpen("archive") && (
                        <button
                          className="related"
                          onClick={() => {
                            setPage("archive");
                            setQuery(
                              v.regions.find((r) => r.id === current.region)
                                ?.name || "",
                            );
                          }}
                        >
                          <Archive size={18} />
                          <span>翻阅相关来文</span>
                          <CaretRight size={16} />
                        </button>
                      )}
                      {!learning && (
                        <div className="opinions">
                          <h3>臣下拟议</h3>
                          {v.people.slice(0, 2).map((p, i) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setAudience(p.id);
                                setRegion(current.region);
                              }}
                            >
                              <Portrait id={p.portrait} />
                              <span>
                                <strong>
                                  {p.name} <small>{p.role}</small>
                                </strong>
                                <q>{opinion(current.domain, p.portrait)}</q>
                              </span>
                              <CaretRight size={14} />
                            </button>
                          ))}
                        </div>
                      )}
                      <img
                        className="landscape"
                        src="assets/landscape.png"
                        alt="淡墨山川与边关"
                      />
                      {current.resolved ? (
                        <div className="read-note">
                          <Check size={16} /> 此件已批复，原文留存于档案。
                        </div>
                      ) : !learning ? (
                        <div className="report-actions">
                          <button
                            className="primary"
                            onClick={() => {
                              setRunning(false);
                              setSheet({
                                region: current.region,
                                report: current,
                              });
                            }}
                          >
                            <Scroll size={18} />
                            拟定批示
                          </button>
                          {current.decision ? (
                            <button
                              onClick={() => {
                                setRegion(current.region);
                                setAudience(activeSpeaker.id);
                                setRunning(false);
                              }}
                            >
                              召见问询
                            </button>
                          ) : (
                            <button onClick={mark}>阅毕归档</button>
                          )}
                        </div>
                      ) : null}
                    </article>
                  ) : (
                    <Empty text="案头暂无新报。可继续时间，等候来文。" />
                  )}
                  {!learning && (
                    <div className="queue">
                      {unread
                        .filter((r) => r.id !== current?.id)
                        .slice(0, 6)
                        .map((r) => (
                          <button key={r.id} onClick={() => read(r)}>
                            <EnvelopeSimple size={17} />
                            <span>
                              {r.title}
                              <small>{r.source}</small>
                            </span>
                            <CaretRight size={16} />
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
              {page === "people" && (
                <>
                  <PageHeading
                    label="召见"
                    title="朝堂诸臣"
                    text="听他们说什么，也记住是谁在说。"
                  />
                  <div className="people-list">
                    {v.people
                      .filter((p) => !learning || p.id === "qi")
                      .map((p) => (
                        <button
                          className="person-card"
                          key={p.id}
                          disabled={learning && step !== "audience"}
                          onClick={() => {
                            setAudience(p.id);
                            if (learning) setRegion("north");
                            setRunning(false);
                          }}
                        >
                          <Portrait
                            id={p.portrait}
                            size="large"
                            name={p.name}
                          />
                          <span>
                            <small>{p.role}</small>
                            <h3>{p.name}</h3>
                            <p>{p.voice}</p>
                            {p.id.startsWith("official") && (
                              <small>职官示意画像</small>
                            )}
                            <b>
                              召见垂询 <ArrowRight size={14} />
                            </b>
                          </span>
                        </button>
                      ))}
                  </div>
                  <p className="footnote">
                    后续人物依本局时间更替。召见所得记为来文，仍需等候回话。
                  </p>
                </>
              )}
              {page === "orders" && (
                <>
                  <PageHeading
                    label="诏令"
                    title="定策与督办"
                    text="决定要做什么、交给谁办，再等他们报告。"
                  />
                  {!learning && (
                    <div className="section-card">
                      <label className="field">
                        诏令所及
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                        >
                          {v.regions.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="primary full"
                        onClick={() => {
                          setRunning(false);
                          setSheet({ region });
                        }}
                      >
                        <Plus size={18} />
                        颁发新诏
                      </button>
                      <button
                        className="delegation"
                        onClick={() => act("delegate", region)}
                      >
                        <Scroll size={18} />
                        <span>
                          例行事务
                          <small>
                            {v.delegated ? "交内阁按章办理" : "仍由皇帝亲阅"}
                          </small>
                        </span>
                        <b>{v.delegated ? "恢复亲阅" : "授权内阁"}</b>
                      </button>
                    </div>
                  )}
                  {learning && (
                    <div className="section-card">
                      <h3>首份奏报已批复</h3>
                      <p>决定已留存。主动颁诏与内阁授权会在引导结束后开放。</p>
                    </div>
                  )}
                  <h3 className="section-title">诏令簿</h3>
                  {v.commands.length ? (
                    [...v.commands]
                      .reverse()
                      .slice(0, orderLimit)
                      .map((c) => (
                        <div className="order-card" key={c.id}>
                          <span className="stamp">{c.status}</span>
                          <h3>{c.title}</h3>
                          <p>
                            {c.region} · {c.executor}督办
                          </p>
                          <small>
                            {dateOf(c.issued)}发出 · 诏准银{amount(c.budget)}
                            万两
                          </small>
                        </div>
                      ))
                  ) : (
                    <Empty
                      text={
                        learning
                          ? "你选择了暂缓，没有新拨款或派遣；原奏折的批复仍会留在档案中。"
                          : "尚未颁发诏令。"
                      }
                    />
                  )}
                  {v.commands.length > orderLimit && (
                    <button
                      className="load-more"
                      onClick={() => setOrderLimit((x) => x + 60)}
                    >
                      加载更早的诏令
                    </button>
                  )}
                </>
              )}
              {page === "archive" && (
                <>
                  <PageHeading
                    label="档案"
                    title="御前文库"
                    text="留存当时的说法，后来的来文另行成册。"
                  />
                  <div className="search">
                    <Archive size={18} />
                    <input
                      aria-label="检索奏报"
                      placeholder="按标题、地方或来文人检索"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="archive-list">
                    {[...v.reports]
                      .reverse()
                      .filter((r) =>
                        `${r.title}${r.source}${r.body}${v.regions.find((x) => x.id === r.region)?.name}`.includes(
                          query,
                        ),
                      )
                      .slice(0, archiveLimit)
                      .map((r) => (
                        <button key={r.id} onClick={() => read(r)}>
                          <div>
                            <span className="tag">{r.domain}</span>
                            <small>{dateOf(r.received)}</small>
                          </div>
                          <h3>{r.title}</h3>
                          <p>{r.source}</p>
                          <span className="status-text">
                            {r.resolved
                              ? "已批复"
                              : r.decision
                                ? "候旨"
                                : "阅知"}{" "}
                            <CaretRight size={14} />
                          </span>
                        </button>
                      ))}
                  </div>
                  {v.reports.length > archiveLimit && (
                    <button
                      className="load-more"
                      onClick={() => setArchiveLimit((x) => x + 50)}
                    >
                      加载更多奏报
                    </button>
                  )}
                  <h3 className="section-title">起居纪事</h3>
                  <div className="chronicle">
                    {[...v.history]
                      .reverse()
                      .slice(0, 30)
                      .map((h, i) => (
                        <p key={i}>
                          <small>{dateOf(h.day)}</small>
                          {h.text}
                        </p>
                      ))}
                  </div>
                </>
              )}
              {page === "map" && (
                <>
                  <PageHeading
                    label="舆图"
                    title="天下来文"
                    text="按地方查阅已到奏报；无来文处，仍待后续。"
                  />
                  <div className="map-intro">
                    <MapTrifold size={34} />
                    <div>
                      <small>礼部所记行在</small>
                      <h3>{v.capital}</h3>
                    </div>
                  </div>
                  <div className="region-grid">
                    {v.regions.map((r) => {
                      const rep = [...v.reports]
                        .reverse()
                        .find(
                          (x) =>
                            x.region === r.id && x.claimGrain !== undefined,
                        );
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setQuery(r.name);
                            setPage("archive");
                          }}
                        >
                          <span className="region-mark">
                            {r.name.slice(0, 1)}
                          </span>
                          <h3>{r.name}</h3>
                          {rep ? (
                            <>
                              <p>呈报仓粮 {amount(rep.claimGrain!)}万石</p>
                              <small>{dateOf(rep.received)}收到</small>
                            </>
                          ) : (
                            <p>钱粮册报尚未到案</p>
                          )}
                          <span className="map-link">
                            查看来文 <CaretRight size={13} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="footnote">
                    本版以八个区域合并模拟。此处依来文归档，不显示实时地情或统治状态。
                  </p>
                </>
              )}
            </>
          )}
        </div>
        {learning && (
          <div className="guide-action">
            <button
              className="primary full"
              onClick={guideAction}
              disabled={step === "wait" && running}
            >
              {guideLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        <nav className="bottom-nav" aria-label="主要导航">
          {NAV.map(([id, label, Icon]) => (
            <button
              disabled={!!v.ended || !canOpen(id)}
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => {
                setPage(id);
                setSelected(null);
                if (id === "archive") setQuery("");
              }}
              aria-current={page === id ? "page" : undefined}
            >
              {canOpen(id) ? (
                <Icon size={24} weight={page === id ? "fill" : "regular"} />
              ) : (
                <LockSimple size={21} />
              )}
              <span>
                {label}
                {!canOpen(id) && <small>稍后开放</small>}
              </span>
            </button>
          ))}
        </nav>
        {notice && !settings && !sheet && !audience && !confirm && (
          <div className="toast" role="status">
            <span>{notice}</span>
            <button aria-label="关闭提示" onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {sheet && (
          <Modal title="拟定批示" close={() => setSheet(null)}>
            <p className="modal-subtitle">
              {v.regions.find((r) => r.id === sheet.region)?.name} ·{" "}
              {sheet.report?.title || "主动施政"}
            </p>
            <label className="field">
              让谁负责督办
              <select
                value={activeSpeaker.id}
                onChange={(e) => setSpeaker(e.target.value)}
              >
                {v.people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.role}
                  </option>
                ))}
              </select>
            </label>
            <div className="policy-list">
              {(
                sheet.report?.options ||
                ([
                  "relief",
                  "audit",
                  "pay",
                  "defend",
                  "campaign",
                  "peace",
                  "trade",
                  "irrigation",
                  "tax",
                  "school",
                  "arms",
                  "appoint",
                  "relocate",
                  "recover",
                ] as Policy[])
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => act(p, sheet.region, sheet.report)}
                >
                  <h3>
                    {POLICY[p].name}
                    <ArrowRight size={17} />
                  </h3>
                  <p>{POLICY[p].detail}</p>
                </button>
              ))}
            </div>
            <p className="footnote">
              按这个金额发出诏令。钱是否送到、事情办得怎样，需要等官员报告。
            </p>
          </Modal>
        )}
        {audience &&
          (() => {
            const p = v.people.find((x) => x.id === audience) || v.people[0];
            return (
              <Modal title="御前召见" close={() => setAudience(null)}>
                <div className="audience-hero">
                  <Portrait id={p.portrait} size="large" name={p.name} />
                  <small>{p.role}</small>
                  <h2>{p.name}</h2>
                  <p>“{p.voice}”</p>
                </div>
                <label className="field">
                  询问哪个地方
                  <select
                    value={region}
                    disabled={learning}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    {v.regions.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="policy-list">
                  {(
                    [
                      ["grain", "询问钱粮与民情"],
                      ["military", "询问军饷与守备"],
                      ["court", "询问经办与朝议"],
                    ] as const
                  )
                    .filter(([topic]) => !learning || topic === "military")
                    .map(([topic, label]) => (
                      <button
                        key={topic}
                        disabled={
                          !v.canAsk || (learning && step !== "audience")
                        }
                        onClick={() => {
                          if (ask(game.current, p.id, region, topic)) {
                            tutorialEvent(
                              game.current,
                              "asked",
                              game.current.nextId - 1,
                            );
                            setPage("desk");
                            refresh();
                            setAudience(null);
                            setNotice("已经安排问话，答复会送到案头。");
                          }
                        }}
                      >
                        <h3>
                          {label}
                          <CaretRight size={16} />
                        </h3>
                      </button>
                    ))}
                </div>
                {!v.canAsk && (
                  <p className="footnote">
                    上次问话还在整理，五天后可以再次召见。
                  </p>
                )}
              </Modal>
            );
          })()}
        {settings && (
          <Modal title="王朝与存档" close={() => setSettings(false)}>
            <div className="dynasty-card">
              <Portrait id="wanli" size="large" />
              <div>
                <small>第{v.ruler.generation}任在位之君</small>
                <h2>{v.ruler.name}</h2>
                <p>
                  {v.ruler.age}岁 · {v.capital}
                </p>
                <small>自亲政起已过 {Math.floor(v.day / 360)} 年</small>
                {v.ruler.generation > 1 && <small>皇帝示意画像</small>}
              </div>
            </div>
            <p className="footnote">
              本机自动保存。网页与 APK
              的存档可通过文件互相转移；卸载或清除浏览数据前请导出。
            </p>
            <div className="save-slots" key={slotVersion}>
              {["1", "2", "3"].map((slot) => {
                const info = slotInfo(slot);
                return (
                  <div key={slot}>
                    <span>
                      <b>存档 {slot}</b>
                      <small>
                        {info ? `${info.name} · ${dateOf(info.day)}` : "空白"}
                      </small>
                    </span>
                    <button
                      onClick={() => {
                        try {
                          save(game.current, slot);
                          setSlotVersion((x) => x + 1);
                          setNotice(`已写入存档 ${slot}。`);
                        } catch {
                          setNotice("保存失败，请导出文件。");
                        }
                      }}
                      aria-label={`写入存档${slot}`}
                    >
                      <FloppyDisk size={20} />
                    </button>
                    <button
                      disabled={!info}
                      onClick={() => {
                        try {
                          const g = load(slot);
                          if (g) {
                            replace(g);
                            setNotice(`已读取存档 ${slot}。`);
                          }
                        } catch (e) {
                          setNotice((e as Error).message);
                        }
                      }}
                    >
                      读取
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="two-buttons">
              <button onClick={exportSave}>
                <DownloadSimple size={18} />
                导出存档
              </button>
              <button onClick={() => file.current?.click()}>
                <UploadSimple size={18} />
                导入存档
              </button>
            </div>
            <input
              ref={file}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importSave(f);
                e.target.value = "";
              }}
            />
            <div className="rules">
              <h3>御前须知</h3>
              <p>
                开局为 1582
                年七月。批阅候旨奏报后，点击「已暂停」继续时间；新请示送达时自动暂停。
              </p>
              <p>
                册报与来文可能滞后、有遗漏或相互不合。拨款、查验、改革都由官员执行；可在诏令簿及档案追看。
              </p>
              <p>
                皇位继承后继续同一王朝。存续三百年完成一局，结算开放实际数据与执行记录。
              </p>
              <p>
                第一版采用每月三十日的模拟历法；数值为公开说明的设计标定，并非明代精确统计复原。完全离线，无大模型调用。
              </p>
            </div>
            {learning && (
              <button className="full" onClick={leaveGuide}>
                跳过引导，开放全部系统
              </button>
            )}
            <button className="full" onClick={() => setConfirm("new")}>
              开启新王朝
            </button>
            {!v.ended && (
              <button className="danger-link" onClick={() => setConfirm("end")}>
                结束本局并查看结算
              </button>
            )}
            <small className="version">大明王朝1582 v0.2.0</small>
          </Modal>
        )}
        {confirm && (
          <Modal
            title={confirm === "end" ? "封存本局史册" : "开启新王朝"}
            close={() => setConfirm(null)}
          >
            <p className="confirm-text">
              {confirm === "end"
                ? "结算将公开实际数据，并结束这条时间线。系统会先保留一份终局前存档，便于回到结算前。"
                : "当前王朝将先保存在「存档 3」，新局使用新的随机种子。继续吗？"}
            </p>
            <button
              className="primary full"
              onClick={() => {
                try {
                  save(game.current, "3");
                  if (confirm === "end") {
                    retire(game.current);
                    refresh();
                    setSettings(false);
                  } else replace(newGame());
                  setConfirm(null);
                  setSlotVersion((x) => x + 1);
                } catch {
                  setNotice("备份存档失败，请先导出，尚未结束或替换本局。");
                }
              }}
            >
              {confirm === "end" ? "封卷结算" : "开始新局"}
            </button>
          </Modal>
        )}
      </main>
    </div>
  );
}
function PageHeading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <span>{label}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Scroll size={36} />
      <p>{text}</p>
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,input,a[href],[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={close} aria-label={`关闭${title}`}>
            <X size={22} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
function Settlement({ v, onSettings }: { v: View; onSettings: () => void }) {
  const s = v.settlement!;
  return (
    <div className="settlement">
      <div className="end-seal">史</div>
      <p className="overline">本局史册已封存</p>
      <h2>
        {v.ended === "victory"
          ? "国祚三百年"
          : v.ended === "defeat"
            ? "山河余烬"
            : "御览终卷"}
      </h2>
      <p>
        {dateOf(v.day)} · 历经 {v.ruler.generation} 任君主
      </p>
      <p className="end-note">
        以下开放后台实际数据，可与当年的呈报对照。统计仅覆盖本版八区域模拟范围。
      </p>
      <div className="end-grid">
        <div>
          <small>实际人口</small>
          <strong>
            {amount(s.actual.population * 100)}
            <em>万人</em>
          </strong>
        </div>
        <div>
          <small>实际库银</small>
          <strong>
            {amount(s.actual.treasury)}
            <em>万两</em>
          </strong>
        </div>
        <div>
          <small>累计灾战死亡</small>
          <strong>
            {amount(s.actual.deaths * 100)}
            <em>万人</em>
          </strong>
        </div>
        <div>
          <small>累计钱粮侵耗（银）</small>
          <strong>
            {amount(s.actual.diversion)}
            <em>万两</em>
          </strong>
        </div>
      </div>
      <h3>库银：实际与当时册报</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>实际 / 万两</th>
              <th>当时最新册报</th>
            </tr>
          </thead>
          <tbody>
            {s.annual
              .filter(
                (_, i) =>
                  s.annual.length < 35 ||
                  i % 10 === 0 ||
                  i === s.annual.length - 1,
              )
              .map((a, i) => (
                <tr key={i}>
                  <td>{dateOf(a.day)}</td>
                  <td>{amount(a.treasury)}</td>
                  <td>
                    {a.claimedTreasury === null
                      ? "无"
                      : amount(a.claimedTreasury)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <h3>诏令执行实录</h3>
      {s.commands.length ? (
        [...s.commands]
          .reverse()
          .slice(0, 100)
          .map((c) => (
            <div className="order-card" key={c.id}>
              <h3>{c.name}</h3>
              <p>
                诏准 {amount(c.budget)} / 支出 {amount(c.spent)} / 侵耗{" "}
                {amount(c.loss)} 万两
              </p>
              <p>{c.outcome || "本局结束时尚未执行。"}</p>
              <small>{dateOf(c.issued)}</small>
            </div>
          ))
      ) : (
        <p>本局尚无执行记录。</p>
      )}
      <button className="primary full" onClick={onSettings}>
        保存史册 / 开启新局
      </button>
    </div>
  );
}
