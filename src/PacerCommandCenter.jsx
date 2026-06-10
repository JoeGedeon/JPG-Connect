// src/PacerCommandCenter.jsx
// Pacer Command Center - Main Component
// JPG Ventures LLC
//
// DO NOT paste this through any rich text editor.
// All quotes must be straight. All regex must be literal.

import { useState, useRef, useEffect, useCallback } from "react";
import { LANES, LANE_MAP, STARTERS, IMAGE_STARTERS, IMAGE_SIZES, TASK_STATUSES } from "./config/lanes.js";
import { SYSTEM_MAP } from "./config/prompts.js";
import { loadStorage, saveStorage, formatTime } from "./utils/storage.js";
import { formatMessage } from "./utils/formatMessage.jsx";
import { sendChat } from "./api/chat.js";
import { generateImage } from "./api/image.js";
import { db } from "./engine/firebase.js";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function PacerCommandCenter() {
  const initRef = useRef(loadStorage());
  const init = initRef.current;

  const [lane, setLane] = useState(() => init?.lane || "ops");
  const [view, setView] = useState("chat");
  const [messages, setMessages] = useState(() => init?.messages || []);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [tasks, setTasks] = useState(() => init?.tasks || []);
  const [taskFilter, setTaskFilter] = useState("all");

  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageStyle, setImageStyle] = useState("vivid");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [gallery, setGallery] = useState(() => init?.gallery || []);
  const [imageError, setImageError] = useState("");
  const [activeImage, setActiveImage] = useState(null);

  const [intake, setIntake] = useState([]);

  const opsHistoryRef      = useRef(init?.opsHistory      || []);
  const creativeHistoryRef = useRef(init?.creativeHistory || []);
  const clawHistoryRef     = useRef(init?.clawHistory     || []);

  const getHistory = (l) => {
    if (l === "ops")      return opsHistoryRef.current;
    if (l === "creative") return creativeHistoryRef.current;
    return clawHistoryRef.current;
  };

  const setHistory = (l, val) => {
    if (l === "ops")           opsHistoryRef.current = val;
    else if (l === "creative") creativeHistoryRef.current = val;
    else                       clawHistoryRef.current = val;
  };

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const laneConfig = LANE_MAP[lane];
  const { color: primary, dim, glow, accent } = laneConfig;

  useEffect(() => {
    saveStorage({
      lane, messages, tasks, gallery,
      opsHistory:      opsHistoryRef.current,
      creativeHistory: creativeHistoryRef.current,
      clawHistory:     clawHistoryRef.current,
    });
  }, [lane, messages, tasks, gallery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "pacer_intake"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setIntake(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // ── LANE SWITCH ────────────────────────────────────────────────────────────────────────────

  function switchLane(l) {
    if (l === lane) return;
    setLane(l);
    setView("chat");
    if (messages.length > 0) {
      setMessages((prev) => [
        ...prev,
        { type: "divider", text: "Switched to " + LANE_MAP[l].label, ts: Date.now() },
      ]);
    }
  }

  // ── CLEAR LANE ─────────────────────────────────────────────────────────────────────────

  function clearLane() {
    const laneToRemove = lane;
    setHistory(laneToRemove, []);
    const filtered = messages.filter(
      (m) => m.lane !== laneToRemove && m.type !== "divider"
    );
    setMessages(filtered);
    saveStorage({
      lane, messages: filtered, tasks, gallery,
      opsHistory:      opsHistoryRef.current,
      creativeHistory: creativeHistoryRef.current,
      clawHistory:     clawHistoryRef.current,
    });
  }

  // ── SEND CHAT ────────────────────────────────────────────────────────────────────────────

  async function send(prefill) {
    const msg = (prefill || input).trim();
    if (!msg || thinking) return;

    const laneAtSend = lane;
    const system = SYSTEM_MAP[laneAtSend];

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg, lane: laneAtSend, ts: Date.now() }]);

    const newHistory = [...getHistory(laneAtSend), { role: "user", content: msg }];
    setHistory(laneAtSend, newHistory);
    setThinking(true);

    try {
      const reply = await sendChat({ lane: laneAtSend, system, messages: newHistory });
      setHistory(laneAtSend, [...newHistory, { role: "assistant", content: reply }]);
      setMessages((prev) => [...prev, { role: "bot", text: reply, lane: laneAtSend, ts: Date.now() }]);
      if (laneAtSend === "claw") extractTask(msg, reply);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "error", text: err.message, ts: Date.now() }]);
    }

    setThinking(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  // ── TASK HELPERS ─────────────────────────────────────────────────────────────────────────

  function extractTask(userMsg, clawReply) {
    const task = {
      id: Date.now(),
      title: userMsg.replace(/^Plan:\s*/i, "").slice(0, 60),
      plan: clawReply,
      status: "draft",
      lane: "claw",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks((prev) => [task, ...prev]);
  }

  function updateTask(id, status) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: Date.now() } : t))
    );
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ── IMAGE GENERATION ──────────────────────────────────────────────────────────────────────

  async function handleGenerateImage() {
    if (!imagePrompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    setImageError("");

    try {
      const result = await generateImage({ prompt: imagePrompt, size: imageSize, style: imageStyle });
      const newImg = {
        id: Date.now(),
        prompt: imagePrompt,
        enhancedPrompt: result.enhancedPrompt,
        url: result.url,
        size: imageSize,
        style: imageStyle,
        ts: Date.now(),
      };
      setGallery((prev) => [newImg, ...prev]);
      setActiveImage(newImg);
      setImagePrompt("");
    } catch (err) {
      setImageError(err.message);
    }

    setGeneratingImage(false);
  }

  // ── STYLES ──────────────────────────────────────────────────────────────────────────────

  const filteredTasks = taskFilter === "all" ? tasks : tasks.filter((t) => t.status === taskFilter);

  const ROOT = {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#080810",
    color: "#e8e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    "--primary": primary,
    "--accent": accent,
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────────────────

  return (
    <div style={ROOT}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} } @keyframes blink  { 0%,100%{opacity:.15;transform:scale(.75)} 50%{opacity:1;transform:scale(1.1)} } @keyframes spin   { to{transform:rotate(360deg)} } @keyframes pulse  { 0%,100%{opacity:.5} 50%{opacity:1} } ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#2a2a38;border-radius:4px}`}</style>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:52, background:"#0c0c16", borderBottom:"1px solid #1a1a2e", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, background:primary, clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", boxShadow:`0 0 16px ${glow}`, transition:"all 0.4s", flexShrink:0 }} />
          <div>
            <div style={{ fontWeight:800, fontSize:"0.88rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#f0f0f8", lineHeight:1 }}>Pacer</div>
            <div style={{ fontSize:"0.5rem", color:"#555570", letterSpacing:"0.14em", textTransform:"uppercase", marginTop:2 }}>JPG Ventures OS</div>
          </div>
        </div>

        <div style={{ display:"flex", background:"#111120", borderRadius:8, padding:3, gap:2, border:"1px solid #1a1a2e" }}>
          {LANES.map(({ id, label, color }) => (
            <button key={id} onClick={() => switchLane(id)} style={{ padding:"5px 14px", border:"none", borderRadius:6, fontWeight:700, fontSize:"0.65rem", letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", background:lane === id ? color : "transparent", color:lane === id ? "#000" : "#444460", transition:"all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ display:"flex", gap:4 }}>
            {[
              { id:"chat", label:"Chat" },
              ...(lane === "claw"     ? [{ id:"tasks",    label:`Tasks${tasks.length > 0 ? " " + tasks.length : ""}` }] : []),
              ...(lane === "creative" ? [{ id:"imagelab", label:"Image Lab" }] : []),
              { id:"intake", label:`Intake${intake.length > 0 ? " " + intake.length : ""}` },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setView(id)} style={{ padding:"4px 12px", border:`1px solid ${view === id ? primary + "60" : "#1a1a2e"}`, borderRadius:6, background:view === id ? dim : "transparent", color:view === id ? primary : "#444460", fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.18s" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ width:1, height:14, background:"#1a1a2e" }} />
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.58rem", color:"#444460", fontFamily:"monospace" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:primary, boxShadow:`0 0 6px ${primary}`, animation:"pulse 2s infinite", transition:"all 0.4s" }} />
            JPG Ventures
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex:1, overflow:"hidden", display:"flex" }}>

        {/* CHAT */}
        {view === "chat" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"24px 0" }}>
              <div style={{ maxWidth:720, margin:"0 auto", padding:"0 20px", display:"flex", flexDirection:"column", gap:18 }}>

                {messages.length === 0 && (
                  <div style={{ textAlign:"center", paddingTop:56, paddingBottom:28 }}>
                    <div style={{ width:48, height:48, margin:"0 auto 18px", background:dim, border:`1px solid ${primary}40`, clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />
                    <div style={{ fontWeight:800, fontSize:"1.3rem", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:6, color:"#f0f0f8" }}>{laneConfig.label}</div>
                    <div style={{ fontSize:"0.76rem", color:"#444460", marginBottom:28 }}>{laneConfig.subtitle}</div>
                    {lane === "claw" && (
                      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:6, background:"rgba(255,159,67,0.08)", border:"1px solid rgba(255,159,67,0.25)", fontSize:"0.65rem", color:"#ff9f43", fontFamily:"monospace", marginBottom:24 }}>
                        All tasks require approval before execution
                      </div>
                    )}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                      {STARTERS[lane].map((s, i) => (
                        <div key={i} onClick={() => send(s)}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = "#e8e8f0"; e.currentTarget.style.background = dim; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#444460"; e.currentTarget.style.background = "#0e0e1a"; }}
                          style={{ padding:"8px 14px", border:"1px solid #1a1a2e", borderRadius:6, fontSize:"0.74rem", color:"#444460", cursor:"pointer", background:"#0e0e1a", transition:"all 0.16s" }}>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => {
                  if (m.type === "divider") return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ flex:1, height:1, background:"#1a1a2e" }} />
                      <span style={{ fontSize:"0.56rem", color:"#333350", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{m.text}</span>
                      <div style={{ flex:1, height:1, background:"#1a1a2e" }} />
                    </div>
                  );

                  if (m.role === "error") return (
                    <div key={i} style={{ padding:"9px 13px", borderRadius:8, fontSize:"0.76rem", color:"#ff6b6b", background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.16)", fontFamily:"monospace" }}>
                      Error: {m.text}
                    </div>
                  );

                  const isUser = m.role === "user";
                  const mc = LANE_MAP[m.lane] || laneConfig;

                  return (
                    <div key={i} style={{ display:"flex", gap:10, flexDirection:isUser ? "row-reverse" : "row", animation:"fadeUp 0.22s ease" }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.5rem", fontWeight:800, letterSpacing:"0.06em", flexShrink:0, marginTop:4, background:isUser ? "#1a1a28" : mc.dim, border:isUser ? "1px solid #1a1a2e" : `1px solid ${mc.color}40`, color:isUser ? "#666680" : mc.color }}>
                        {isUser ? "J" : "P"}
                      </div>
                      <div style={{ maxWidth:"82%", display:"flex", flexDirection:"column", gap:4, alignItems:isUser ? "flex-end" : "flex-start" }}>
                        {!isUser && (
                          <div style={{ fontSize:"0.52rem", fontFamily:"monospace", letterSpacing:"0.12em", color:mc.color, textTransform:"uppercase", paddingLeft:2 }}>
                            {mc.label}
                          </div>
                        )}
                        <div style={{ padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", lineHeight:1.7, background:isUser ? "#111120" : "#0d0d1a", border:"1px solid #1a1a2e", borderLeft:!isUser ? `2px solid ${mc.color}` : undefined, borderTopRightRadius:isUser ? 2 : 10, borderTopLeftRadius:!isUser ? 2 : 10 }}>
                          {formatMessage(m.text)}
                        </div>
                        <div style={{ fontSize:"0.54rem", color:"#333350", fontFamily:"monospace" }}>{formatTime(m.ts)}</div>
                      </div>
                    </div>
                  );
                })}

                {thinking && (
                  <div style={{ display:"flex", gap:10 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.5rem", fontWeight:800, background:dim, border:`1px solid ${primary}40`, color:primary, flexShrink:0, marginTop:4 }}>P</div>
                    <div style={{ padding:"12px 15px", borderRadius:10, borderTopLeftRadius:2, background:"#0d0d1a", border:"1px solid #1a1a2e", borderLeft:`2px solid ${primary}`, display:"flex", gap:5, alignItems:"center" }}>
                      {[0, 0.18, 0.36].map((d, i) => (
                        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:primary, animation:`blink 1.1s ${d}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            {/* INPUT */}
            <div style={{ flexShrink:0, padding:"12px 20px 16px", background:"#0c0c16", borderTop:"1px solid #1a1a2e" }}>
              <div style={{ maxWidth:720, margin:"0 auto", display:"flex", gap:10, alignItems:"flex-end" }}>
                <div
                  style={{ flex:1, background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:10, display:"flex", alignItems:"flex-end", transition:"border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = primary + "80"; e.currentTarget.style.boxShadow = "0 0 0 2px " + dim; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <textarea
                    ref={textareaRef}
                    style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#e8e8f0", fontFamily:"inherit", fontSize:"0.84rem", lineHeight:1.55, padding:"11px 13px", resize:"none", maxHeight:160, minHeight:42, overflow:"auto" }}
                    placeholder={laneConfig.placeholder}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1}
                  />
                </div>
                <button
                  onClick={() => send()}
                  disabled={thinking || !input.trim()}
                  style={{ width:40, height:40, border:"none", background:thinking || !input.trim() ? "#1a1a28" : primary, cursor:thinking || !input.trim() ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, boxShadow:!thinking && input.trim() ? `0 0 14px ${glow}` : "none", opacity:thinking || !input.trim() ? 0.35 : 1, transition:"all 0.2s", flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={thinking || !input.trim() ? "#444460" : "#000"}><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                </button>
              </div>
              <div style={{ maxWidth:720, margin:"6px auto 0", display:"flex", justifyContent:"space-between", fontSize:"0.56rem", color:"#333350", fontFamily:"monospace" }}>
                <span>{laneConfig.label} / /api/chat</span>
                <button onClick={clearLane}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff6b6b"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#333350"}
                  style={{ background:"none", border:"none", color:"#333350", fontFamily:"monospace", fontSize:"0.56rem", cursor:"pointer" }}>
                  Clear Lane
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TASK LOG */}
        {view === "tasks" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #1a1a2e", display:"flex", gap:6, alignItems:"center", flexShrink:0, background:"#0c0c16" }}>
              <span style={{ fontSize:"0.6rem", color:"#444460", fontFamily:"monospace", letterSpacing:"0.1em", marginRight:6 }}>FILTER</span>
              {["all","draft","pending","approved","complete","rejected"].map((f) => (
                <button key={f} onClick={() => setTaskFilter(f)} style={{ padding:"3px 10px", border:`1px solid ${taskFilter === f ? "#ff9f43" : "#1a1a2e"}`, borderRadius:5, background:taskFilter === f ? "rgba(255,159,67,0.1)" : "transparent", color:taskFilter === f ? "#ff9f43" : "#444460", fontSize:"0.6rem", fontFamily:"monospace", cursor:"pointer", textTransform:"capitalize", transition:"all 0.15s" }}>
                  {f}
                </button>
              ))}
              <div style={{ marginLeft:"auto", fontSize:"0.58rem", color:"#333350", fontFamily:"monospace" }}>{filteredTasks.length} tasks</div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:20 }}>
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign:"center", paddingTop:60, color:"#333350" }}>
                  <div style={{ fontSize:"0.74rem", fontFamily:"monospace" }}>No tasks. Ask CLAW to plan something.</div>
                </div>
              ) : filteredTasks.map((task) => {
                const sc = TASK_STATUSES[task.status];
                return (
                  <div key={task.id} style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:10, padding:"14px 16px", marginBottom:12, animation:"fadeUp 0.2s ease" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10 }}>
                      <div style={{ fontWeight:700, fontSize:"0.84rem", color:"#e8e8f0", flex:1 }}>{task.title}</div>
                      <span style={{ padding:"2px 8px", borderRadius:4, fontSize:"0.56rem", fontFamily:"monospace", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:sc.color, background:sc.color + "18", border:`1px solid ${sc.color}40`, flexShrink:0 }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontSize:"0.76rem", color:"#666680", lineHeight:1.6, marginBottom:12, maxHeight:120, overflow:"hidden" }}>
                      {task.plan.slice(0, 280)}{task.plan.length > 280 ? "..." : ""}
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {task.status === "draft"     && <button onClick={() => updateTask(task.id, "pending")}   style={btnStyle("#ff9f43")}>Submit for Approval</button>}
                      {task.status === "pending"   && <button onClick={() => updateTask(task.id, "approved")}  style={btnStyle("#00c896")}>Approve</button>}
                      {task.status === "pending"   && <button onClick={() => updateTask(task.id, "rejected")}  style={btnStyle("#ff6b6b")}>Reject</button>}
                      {task.status === "approved"  && <button onClick={() => updateTask(task.id, "executing")} style={btnStyle("#c87dff")}>Send to CLAW</button>}
                      {task.status === "executing" && <button onClick={() => updateTask(task.id, "complete")}  style={btnStyle("#00c896")}>Mark Complete</button>}
                      <button onClick={() => removeTask(task.id)} style={{ padding:"4px 10px", border:"1px solid #1a1a2e", borderRadius:5, background:"transparent", color:"#444460", fontSize:"0.62rem", fontFamily:"monospace", cursor:"pointer" }}>Delete</button>
                    </div>
                    <div style={{ marginTop:10, fontSize:"0.54rem", color:"#2a2a40", fontFamily:"monospace" }}>
                      Created {formatTime(task.createdAt)} &bull; Updated {formatTime(task.updatedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* IMAGE LAB */}
        {view === "imagelab" && (
          <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
            <div style={{ width:300, borderRight:"1px solid #1a1a2e", background:"#0c0c16", display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
              <div style={{ padding:"18px 18px 0" }}>
                <div style={{ fontWeight:800, fontSize:"0.76rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"#f0f0f8", marginBottom:3 }}>Image Lab</div>
                <div style={{ fontSize:"0.58rem", color:"#444460", fontFamily:"monospace", marginBottom:18 }}>DALL-E 3 via /api/image</div>

                <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:16 }}>
                  {IMAGE_STARTERS.map((s, i) => (
                    <div key={i} onClick={() => setImagePrompt(s)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c87dff60"; e.currentTarget.style.color = "#c0c0d0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a2e";   e.currentTarget.style.color = "#444460"; }}
                      style={{ padding:"6px 10px", border:"1px solid #1a1a2e", borderRadius:6, fontSize:"0.68rem", color:"#444460", cursor:"pointer", background:"#0d0d1a", transition:"all 0.14s", lineHeight:1.4 }}>
                      {s}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:"0.58rem", color:"#444460", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Prompt</div>
                  <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe your vision..." style={{ width:"100%", background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:8, color:"#e8e8f0", fontFamily:"inherit", fontSize:"0.8rem", padding:"9px 11px", resize:"none", height:84, outline:"none", lineHeight:1.5, boxSizing:"border-box", transition:"border-color 0.2s" }} onFocus={(e) => e.target.style.borderColor = "#c87dff60"} onBlur={(e) => e.target.style.borderColor = "#1a1a2e"} />
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:"0.58rem", color:"#444460", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Size</div>
                  <div style={{ display:"flex", gap:5 }}>
                    {Object.entries(IMAGE_SIZES).map(([s, label]) => (
                      <button key={s} onClick={() => setImageSize(s)} style={{ flex:1, padding:"6px 4px", border:`1px solid ${imageSize === s ? "#c87dff" : "#1a1a2e"}`, borderRadius:6, background:imageSize === s ? "rgba(200,125,255,0.08)" : "#0d0d1a", color:imageSize === s ? "#c87dff" : "#444460", fontSize:"0.6rem", fontFamily:"monospace", cursor:"pointer", transition:"all 0.14s", fontWeight:600 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontSize:"0.58rem", color:"#444460", fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Style</div>
                  <div style={{ display:"flex", gap:5 }}>
                    {["vivid","natural"].map((s) => (
                      <button key={s} onClick={() => setImageStyle(s)} style={{ flex:1, padding:"6px 4px", border:`1px solid ${imageStyle === s ? "#c87dff" : "#1a1a2e"}`, borderRadius:6, background:imageStyle === s ? "rgba(200,125,255,0.08)" : "#0d0d1a", color:imageStyle === s ? "#c87dff" : "#444460", fontSize:"0.6rem", fontFamily:"monospace", cursor:"pointer", transition:"all 0.14s", fontWeight:600, textTransform:"capitalize" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {imageError && (
                  <div style={{ padding:"7px 11px", borderRadius:6, fontSize:"0.68rem", color:"#ff6b6b", background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.16)", marginBottom:12, fontFamily:"monospace" }}>
                    {imageError}
                  </div>
                )}

                <button onClick={handleGenerateImage} disabled={generatingImage || !imagePrompt.trim()} style={{ width:"100%", padding:"11px", border:"none", borderRadius:8, background:generatingImage || !imagePrompt.trim() ? "#1a1a28" : "#c87dff", color:generatingImage || !imagePrompt.trim() ? "#444460" : "#000", fontWeight:800, fontSize:"0.72rem", letterSpacing:"0.1em", textTransform:"uppercase", cursor:generatingImage || !imagePrompt.trim() ? "not-allowed" : "pointer", transition:"all 0.2s", boxShadow:!generatingImage && imagePrompt.trim() ? "0 0 18px rgba(200,125,255,0.25)" : "none", marginBottom:16 }}>
                  {generatingImage
                    ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <span style={{ display:"inline-block", width:11, height:11, border:"2px solid #444460", borderTopColor:"#c87dff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
                        Generating...
                      </span>
                    : "Generate"}
                </button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:20, background:"#080810" }}>
              {gallery.length === 0 ? (
                <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"#2a2a40" }}>
                  <div style={{ fontSize:"2.5rem", opacity:0.3 }}>+</div>
                  <div style={{ fontSize:"0.7rem", fontFamily:"monospace", letterSpacing:"0.1em" }}>No images yet</div>
                </div>
              ) : (
                <div>
                  {activeImage && (
                    <div style={{ marginBottom:20 }}>
                      <img src={activeImage.url} alt={activeImage.prompt} style={{ width:"100%", borderRadius:10, display:"block", border:"1px solid #1a1a2e" }} />
                      <div style={{ marginTop:10, padding:"10px 13px", background:"#0c0c16", borderRadius:8, border:"1px solid #1a1a2e" }}>
                        <div style={{ fontSize:"0.76rem", color:"#c0c0d0", marginBottom:4 }}>{activeImage.prompt}</div>
                        <div style={{ fontSize:"0.58rem", color:"#444460", fontFamily:"monospace" }}>{activeImage.size} &bull; {activeImage.style} &bull; {formatTime(activeImage.ts)}</div>
                        <a href={activeImage.url} download target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:7, fontSize:"0.62rem", color:"#c87dff", fontFamily:"monospace", textDecoration:"none" }}>Download</a>
                      </div>
                    </div>
                  )}
                  {gallery.length > 1 && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
                      {gallery.map((img) => (
                        <div key={img.id} onClick={() => setActiveImage(img)} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:`1px solid ${activeImage?.id === img.id ? "#c87dff" : "#1a1a2e"}`, opacity:activeImage?.id === img.id ? 1 : 0.65, transition:"all 0.14s" }}>
                          <img src={img.url} alt={img.prompt} style={{ width:"100%", display:"block" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTAKE */}
        {view === "intake" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:"1px solid #1a1a2e", display:"flex", alignItems:"center", gap:8, flexShrink:0, background:"#0c0c16" }}>
              <span style={{ fontSize:"0.6rem", color:"#444460", fontFamily:"monospace", letterSpacing:"0.12em", textTransform:"uppercase" }}>PACER Intake</span>
              <div style={{ marginLeft:"auto", fontSize:"0.58rem", color:"#333350", fontFamily:"monospace" }}>
                {intake.length} signal{intake.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:20 }}>
              {intake.length === 0 ? (
                <div style={{ textAlign:"center", paddingTop:60 }}>
                  <div style={{ fontSize:"0.74rem", fontFamily:"monospace", color:"#333350", marginBottom:8 }}>No signals. Campus intake is open.</div>
                  <div style={{ fontSize:"0.6rem", fontFamily:"monospace", color:"#2a2a40" }}>Send an observation from Atrium to see it here.</div>
                </div>
              ) : intake.map((sig) => {
                const signalMs = sig.createdAt?.toMillis ? sig.createdAt.toMillis() : null;
                return (
                  <div key={sig.id} style={{ background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:10, padding:"14px 16px", marginBottom:12, animation:"fadeUp 0.2s ease" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontSize:"0.56rem", fontFamily:"monospace", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:"#333350" }}>Signal Arrived</span>
                      <span style={{ fontSize:"0.54rem", color:"#2a2a40", fontFamily:"monospace" }}>
                        {signalMs ? formatTime(signalMs) : "—"}
                      </span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 20px", marginBottom:sig.text ? 10 : 0 }}>
                      <div>
                        <div style={{ fontSize:"0.52rem", color:"#333350", fontFamily:"monospace", marginBottom:2 }}>source</div>
                        <div style={{ fontSize:"0.78rem", color:"#3b82f6", fontWeight:600 }}>
                          {sig.source === "PACER_ATRIUM" ? "Atrium" : sig.source}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:"0.52rem", color:"#333350", fontFamily:"monospace", marginBottom:2 }}>mode</div>
                        <div style={{ fontSize:"0.78rem", color:"#666680" }}>{sig.mode || sig.type}</div>
                      </div>
                      {sig.constellation && (
                        <div>
                          <div style={{ fontSize:"0.52rem", color:"#333350", fontFamily:"monospace", marginBottom:2 }}>constellation</div>
                          <div style={{ fontSize:"0.78rem", color:"#b8860b" }}>{sig.constellation}</div>
                        </div>
                      )}
                      {sig.destination && (
                        <div>
                          <div style={{ fontSize:"0.52rem", color:"#333350", fontFamily:"monospace", marginBottom:2 }}>destination</div>
                          <div style={{ fontSize:"0.78rem", color:"#666680" }}>{sig.destination}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:"0.52rem", color:"#333350", fontFamily:"monospace", marginBottom:2 }}>status</div>
                        <span style={{ padding:"2px 8px", borderRadius:4, fontSize:"0.56rem", fontFamily:"monospace", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#ff9f43", background:"rgba(255,159,67,0.1)", border:"1px solid rgba(255,159,67,0.25)" }}>
                          {sig.status}
                        </span>
                      </div>
                    </div>
                    {sig.text && (
                      <div style={{ paddingTop:10, borderTop:"1px solid #1a1a2e" }}>
                        <div style={{ fontSize:"0.76rem", color:"#555570", lineHeight:1.6 }}>
                          {sig.text.length > 200 ? sig.text.slice(0, 200) + "..." : sig.text}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── TASK BUTTON HELPER ─────────────────────────────────────────────────────────────────────────────

function btnStyle(color) {
  return {
    padding: "4px 12px",
    border: `1px solid ${color}60`,
    borderRadius: 5,
    background: color + "18",
    color,
    fontSize: "0.62rem",
    fontFamily: "monospace",
    cursor: "pointer",
    fontWeight: 700,
  };
}
