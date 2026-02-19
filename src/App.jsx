import { useState } from "react";

// ─── DESIGN SYSTEM — matches jpgsystems.com ───────────────────────────────────
// Colors:    White bg · Navy #1a1a5e text · Neon green #39ff14 accent
// Type:      Playfair Display serif (headlines) · DM Sans (body)
// Buttons:   Bracketed outline [ Like This ] — no rounded corners
// Nav:       Blue-indigo gradient header matching jpgsystems.com
// Aesthetic: Editorial, documentary, human — not tech-startup
// ─────────────────────────────────────────────────────────────────────────────

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --navy:#1a1a5e;--ink:#111;--white:#fff;--green:#39ff14;
    --muted:#666;--light:#f8f8f8;--border:#d0d0d0;
    --nav:linear-gradient(135deg,#2a2a7e 0%,#1a1a5e 50%,#2d1f7e 100%);
  }
  html,body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);min-height:100vh}

  /* NAV */
  .nav{background:var(--nav);padding:0 48px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;min-height:72px}
  .nav-logo{font-family:'DM Sans',sans-serif;font-weight:600;font-size:20px;color:white;letter-spacing:-.3px}
  .nav-links{display:flex;align-items:center;gap:28px}
  .nav-link{font-size:13px;color:rgba(255,255,255,.7);text-decoration:none;cursor:pointer;transition:color .2s}
  .nav-link:hover{color:white}
  .nav-btn{padding:8px 20px;border:1.5px solid rgba(255,255,255,.5);background:transparent;color:white;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;letter-spacing:.3px}
  .nav-btn:hover{background:rgba(255,255,255,.1);border-color:white}
  @media(max-width:640px){.nav-links{display:none}.nav{padding:0 20px}}

  /* HERO */
  .hero{padding:80px 48px 70px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
  @media(max-width:768px){.hero{grid-template-columns:1fr;padding:48px 24px;gap:32px}}
  .hero-eyebrow{font-size:11px;font-weight:600;color:var(--green);letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;display:block}
  .hero h1{font-family:'Playfair Display',serif;font-size:clamp(36px,4.5vw,58px);font-weight:700;line-height:1.08;letter-spacing:-.5px;color:var(--navy);margin-bottom:20px}
  .hero h1 em{font-style:italic;font-weight:400;color:var(--ink)}
  .hero-sub{font-size:16px;color:var(--muted);line-height:1.7;margin-bottom:36px;max-width:440px}
  .hero-btns{display:flex;flex-direction:column;gap:12px;max-width:280px}

  /* BRACKETED BUTTONS — signature jpgsystems.com style */
  .btn{padding:14px 24px;border:1.5px solid var(--ink);background:transparent;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;text-align:center;letter-spacing:.3px;display:block;width:100%}
  .btn:hover{background:var(--ink);color:white}
  .btn.navy{background:var(--navy);color:white;border-color:var(--navy)}
  .btn.navy:hover{background:#111155}
  .btn:disabled{opacity:.5;cursor:wait}

  /* HERO PANEL */
  .hero-panel{border:1.5px solid var(--border);padding:36px;background:var(--light)}
  .hero-panel-title{font-family:'Playfair Display',serif;font-size:15px;font-style:italic;color:var(--muted);margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border)}
  .panel-stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
  .stat-val{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--navy);letter-spacing:-1px;line-height:1}
  .stat-key{font-size:12px;color:var(--muted);margin-top:4px}
  .panel-note{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:var(--muted);line-height:1.6;border-top:1px solid var(--border);padding-top:16px;margin-top:4px}
  .panel-note strong{font-style:normal;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--navy)}

  /* SECTIONS */
  .section{padding:72px 48px;border-top:1px solid var(--border)}
  .section.light{background:var(--light)}
  .section.dark{background:var(--navy);color:white}
  .container{max-width:1100px;margin:0 auto}
  @media(max-width:768px){.section{padding:48px 24px}}
  .eyebrow{font-size:11px;font-weight:600;color:var(--green);letter-spacing:3px;text-transform:uppercase;display:block;margin-bottom:16px}
  .eyebrow.navy{color:var(--navy)}
  .sec-title{font-family:'Playfair Display',serif;font-size:clamp(28px,3.5vw,44px);font-weight:700;letter-spacing:-.5px;line-height:1.1;margin-bottom:16px;color:var(--navy)}
  .sec-title.white{color:white}
  .sec-title em{font-style:italic;font-weight:400}
  .sec-body{font-size:16px;color:var(--muted);line-height:1.75;max-width:560px}
  .sec-body.white{color:rgba(255,255,255,.65)}

  /* GRID CELLS */
  .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-top:48px}
  @media(max-width:768px){.grid-3{grid-template-columns:1fr}}
  .cell{background:white;padding:36px 28px}
  .cell-num{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;color:var(--border);line-height:1;margin-bottom:16px}
  .cell-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--navy);margin-bottom:10px}
  .cell-desc{font-size:14px;color:var(--muted);line-height:1.65}

  /* TIER CARDS */
  .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);margin-top:0}
  @media(max-width:768px){.tiers{grid-template-columns:1fr}}
  .tier{background:white;padding:32px 24px;cursor:pointer;position:relative}
  .tier.featured{background:var(--navy)}
  .tier-label{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
  .tier.featured .tier-label{color:rgba(255,255,255,.5)}
  .tier-price{font-family:'Playfair Display',serif;font-size:38px;font-weight:900;color:var(--navy);letter-spacing:-1.5px;line-height:1;margin-bottom:4px}
  .tier.featured .tier-price{color:white}
  .tier-period{font-size:12px;color:var(--muted);margin-bottom:18px}
  .tier.featured .tier-period{color:rgba(255,255,255,.5)}
  .tier-feats{list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
  .tier-feats li{font-size:13px;color:var(--muted);display:flex;gap:8px;align-items:flex-start}
  .tier.featured .tier-feats li{color:rgba(255,255,255,.7)}
  .tier-feats li::before{content:'→';color:var(--navy);font-weight:700;flex-shrink:0}
  .tier.featured .tier-feats li::before{color:var(--green)}
  .tier-btn{width:100%;padding:12px;border:1.5px solid var(--navy);background:transparent;color:var(--navy);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;letter-spacing:.3px}
  .tier-btn:hover{background:var(--navy);color:white}
  .tier.featured .tier-btn{border-color:white;color:white}
  .tier.featured .tier-btn:hover{background:white;color:var(--navy)}
  .tier.selected-tier{outline:2.5px solid var(--green)}

  /* FORM */
  .form-wrap{background:white;padding:48px}
  @media(max-width:640px){.form-wrap{padding:28px 20px}}
  .mode-bar{display:flex;border-bottom:2px solid var(--border);margin-bottom:36px}
  .mode-tab{flex:1;padding:15px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .2s;letter-spacing:.3px}
  .mode-tab.on{color:var(--navy);font-weight:600;border-bottom-color:var(--navy)}
  .step-bar{display:flex;gap:0;margin-bottom:32px;border:1.5px solid var(--border);overflow:hidden}
  .pip{flex:1;padding:10px 4px;font-size:11px;font-weight:600;text-align:center;color:var(--muted);background:white;transition:all .2s;border-right:1px solid var(--border);letter-spacing:.5px}
  .pip:last-child{border-right:none}
  .pip.on{background:var(--navy);color:white}
  .pip.done{background:var(--light);color:var(--navy)}
  .form-title{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:var(--navy);margin-bottom:8px;letter-spacing:-.3px}
  .form-title em{font-style:italic;font-weight:400}
  .form-sub{font-size:15px;color:var(--muted);line-height:1.6;margin-bottom:28px}
  .field{display:flex;flex-direction:column;gap:7px;margin-bottom:16px}
  .field label{font-size:11px;font-weight:600;color:var(--ink);letter-spacing:1px;text-transform:uppercase}
  .field input,.field select{padding:13px 15px;border:1.5px solid var(--border);background:white;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;border-radius:0;appearance:none}
  .field input:focus,.field select:focus{border-color:var(--navy)}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media(max-width:480px){.row{grid-template-columns:1fr}}
  .check-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .check{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1.5px solid var(--border);cursor:pointer;transition:all .15s;font-size:14px;user-select:none}
  .check:hover{border-color:var(--navy)}
  .check.on{border-color:var(--navy);background:#f0f0fa}
  .check-mark{width:16px;height:16px;border:1.5px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px}
  .check.on .check-mark{background:var(--navy);border-color:var(--navy);color:white}
  .states-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  @media(max-width:480px){.states-grid{grid-template-columns:repeat(3,1fr)}}
  .state{padding:9px 4px;border:1.5px solid var(--border);text-align:center;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--muted)}
  .state:hover{border-color:var(--navy);color:var(--navy)}
  .state.on{background:var(--navy);color:white;border-color:var(--navy)}
  .estimate-box{border:1.5px solid var(--navy);padding:24px;background:var(--light);margin:4px 0 16px}
  .est-label{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
  .est-value{font-family:'Playfair Display',serif;font-size:42px;font-weight:900;color:var(--navy);letter-spacing:-2px;line-height:1;margin-bottom:6px}
  .est-details{font-size:13px;color:var(--muted);display:flex;gap:20px;flex-wrap:wrap;margin-bottom:14px}
  .est-note{font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:var(--muted);line-height:1.55;padding-top:14px;border-top:1px solid var(--border)}
  .form-footer{display:flex;gap:12px;margin-top:28px;padding-top:24px;border-top:1px solid var(--border)}
  .btn-back{padding:13px 22px;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .2s}
  .btn-back:hover{border-color:var(--ink);color:var(--ink)}
  .btn-next{flex:1;padding:13px 22px;border:1.5px solid var(--navy);background:var(--navy);color:white;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;letter-spacing:.5px}
  .btn-next:hover{background:#111155}
  .btn-next:disabled{opacity:.5;cursor:wait}
  .review-row{display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);font-size:14px}
  .review-key{width:90px;color:var(--muted);font-weight:600;font-size:11px;letter-spacing:.5px;text-transform:uppercase;flex-shrink:0}
  .error-box{padding:12px 16px;border:1.5px solid #cc3333;color:#cc3333;font-size:13px;background:#fff8f8;margin-bottom:16px}
  .success{text-align:center;padding:60px 40px;border:1.5px solid var(--border);max-width:520px;margin:0 auto}
  .success-num{font-family:'Playfair Display',serif;font-size:64px;color:var(--navy);line-height:1;margin-bottom:20px}
  .success-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--navy);margin-bottom:12px}
  .success-sub{font-size:15px;color:var(--muted);line-height:1.65}

  /* FOOTER */
  footer{background:var(--nav);padding:40px 48px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
  .foot-logo{font-family:'DM Sans',sans-serif;font-weight:600;font-size:18px;color:white}
  .foot-links{display:flex;gap:24px;flex-wrap:wrap}
  .foot-link{font-size:13px;color:rgba(255,255,255,.5);text-decoration:none}
  .foot-link:hover{color:white}
  .foot-copy{font-size:12px;color:rgba(255,255,255,.3);width:100%}
  @media(max-width:768px){footer{padding:32px 24px}}
`;

const EST = {
  studio: { low: 350, high: 700, crew: 2, hl: 2, hh: 4 },
  "1br": { low: 500, high: 900, crew: 2, hl: 3, hh: 5 },
  "2br": { low: 800, high: 1400, crew: 3, hl: 4, hh: 7 },
  "3br": { low: 1200, high: 2000, crew: 3, hl: 5, hh: 9 },
  "4br": { low: 1800, high: 3000, crew: 4, hl: 7, hh: 12 },
  "5br+": { low: 2500, high: 4500, crew: 4, hl: 9, hh: 16 },
};
const SIZES = [{ id: "studio", l: "Studio" }, { id: "1br", l: "1 Bedroom" }, { id: "2br", l: "2 Bedroom" }, { id: "3br", l: "3 Bedroom" }, { id: "4br", l: "4 Bedroom" }, { id: "5br+", l: "5+ Bedrooms" }];
const FLOORS = ["Ground", "2nd Floor", "3rd Floor", "4th+ Floor", "Elevator"];
const EXTRAS = ["Packing", "Storage", "Assembly", "Piano", "Junk Removal", "Cleaning"];
const STATES = ["AL", "AR", "AZ", "CA", "CO", "CT", "DC", "FL", "GA", "IA", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "MI", "MN", "MO", "MS", "NC", "NE", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "SC", "TN", "TX", "UT", "VA", "WA", "WI"];
const fmt = n => n?.toLocaleString();

function ConsumerFlow() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ fromZip: "", toZip: "", moveDate: "", flexibility: "flexible", homeSize: "", fromFloor: "Ground", toFloor: "Ground", extras: [], name: "", email: "", phone: "" });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleExtra = x => set("extras", f.extras.includes(x) ? f.extras.filter(e => e !== x) : [...f.extras, x]);
  const est = f.homeSize ? EST[f.homeSize] : null;

  const submit = () => {
    console.log("Consumer lead submitted:", f);
    setDone(true);
  };

  if (done) return (
    <div className="success">
      <div className="success-num">✓</div>
      <div className="success-title">Request Received.</div>
      <p className="success-sub">We've matched your move with verified companies in your area. Expect to hear from up to 3 movers within 24 hours. Check your email for a confirmation from JPG Connect.</p>
    </div>
  );

  const PIPS = ["Location & Date", "Home Size", "Details", "Contact"];
  return (
    <div>
      <div className="step-bar">{PIPS.map((s, i) => <div key={s} className={`pip ${step === i + 1 ? "on" : step > i + 1 ? "done" : ""}`}>{s}</div>)}</div>

      {step === 1 && <>
        <h2 className="form-title">Where are you <em>moving?</em></h2>
        <p className="form-sub">Tell us your origin and destination. We'll match you with verified companies in your area.</p>
        <div className="row">
          <div className="field"><label>Moving From (ZIP)</label><input placeholder="30301" maxLength={5} value={f.fromZip} onChange={e => set("fromZip", e.target.value.replace(/\D/g, ""))} /></div>
          <div className="field"><label>Moving To (ZIP)</label><input placeholder="10001" maxLength={5} value={f.toZip} onChange={e => set("toZip", e.target.value.replace(/\D/g, ""))} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Move Date</label><input type="date" value={f.moveDate} onChange={e => set("moveDate", e.target.value)} /></div>
          <div className="field"><label>Flexibility</label>
            <select value={f.flexibility} onChange={e => set("flexibility", e.target.value)}>
              <option value="exact">Exact date only</option>
              <option value="flexible">± 1–2 days</option>
              <option value="very_flexible">± 1 week</option>
            </select>
          </div>
        </div>
        <div className="form-footer">
          <button className="btn-next" onClick={() => setStep(2)} disabled={!f.fromZip || f.fromZip.length < 5 || !f.toZip || f.toZip.length < 5 || !f.moveDate}>[ Continue → ]</button>
        </div>
      </>}

      {step === 2 && <>
        <h2 className="form-title">What size <em>home?</em></h2>
        <p className="form-sub">Select your home size and see an instant market-rate estimate — before you give us any contact information.</p>
        <div className="check-grid" style={{ marginBottom: 16 }}>
          {SIZES.map(s => (
            <div key={s.id} className={`check ${f.homeSize === s.id ? "on" : ""}`} onClick={() => set("homeSize", s.id)}>
              <div className="check-mark">{f.homeSize === s.id ? "✓" : ""}</div>{s.l}
            </div>
          ))}
        </div>
        {est && <div className="estimate-box">
          <div className="est-label">Instant Market Estimate</div>
          <div className="est-value">${fmt(est.low)}<span style={{ fontSize: 26, letterSpacing: 0 }}> – </span>${fmt(est.high)}</div>
          <div className="est-details"><span>{est.crew} movers</span><span>{est.hl}–{est.hh} hrs estimated</span></div>
          <div className="est-note">"This is what your move should cost. Not a bait-and-switch number — a real market-rate range based on 30 years of industry data."</div>
        </div>}
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
          <button className="btn-next" onClick={() => setStep(3)} disabled={!f.homeSize}>[ Continue → ]</button>
        </div>
      </>}

      {step === 3 && <>
        <h2 className="form-title">A few more <em>details.</em></h2>
        <p className="form-sub">Floor access and any extras help us match you with the right companies for your specific move.</p>
        <div className="row">
          <div className="field"><label>Pickup Floor</label><select value={f.fromFloor} onChange={e => set("fromFloor", e.target.value)}>{FLOORS.map(fl => <option key={fl}>{fl}</option>)}</select></div>
          <div className="field"><label>Delivery Floor</label><select value={f.toFloor} onChange={e => set("toFloor", e.target.value)}>{FLOORS.map(fl => <option key={fl}>{fl}</option>)}</select></div>
        </div>
        <div className="field"><label>Additional Services (Optional)</label>
          <div className="check-grid">{EXTRAS.map(x => (
            <div key={x} className={`check ${f.extras.includes(x) ? "on" : ""}`} onClick={() => toggleExtra(x)}>
              <div className="check-mark">{f.extras.includes(x) ? "✓" : ""}</div>{x}
            </div>
          ))}</div>
        </div>
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
          <button className="btn-next" onClick={() => setStep(4)}>[ Continue → ]</button>
        </div>
      </>}

      {step === 4 && <>
        <h2 className="form-title">Last step — <em>your info.</em></h2>
        <p className="form-sub">Your contact details are shared only with matched, verified companies. Maximum 3 movers will receive your request.</p>
        <div className="field"><label>Full Name</label><input placeholder="Your name" value={f.name} onChange={e => set("name", e.target.value)} /></div>
        <div className="row">
          <div className="field"><label>Email</label><input type="email" placeholder="you@email.com" value={f.email} onChange={e => set("email", e.target.value)} /></div>
          <div className="field"><label>Phone</label><input type="tel" placeholder="(404) 555-0100" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
        </div>
        {est && <div style={{ padding: "14px 16px", background: "var(--light)", border: "1px solid var(--border)", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
          <strong style={{ color: "var(--navy)", fontWeight: 600 }}>Your estimate:</strong> ${fmt(est.low)} – ${fmt(est.high)} · {est.crew} movers · {est.hl}–{est.hh} hrs
        </div>}
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
          <button className="btn-next" onClick={submit} disabled={!f.name || !f.email || !f.phone}>[ Get My Quotes → ]</button>
        </div>
      </>}
    </div>
  );
}

function CompanyFlow() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ company: "", dot: "", mc: "", contact: "", email: "", phone: "", states: [], tier: "free" });
  const [done, setDone] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggleState = s => set("states", f.states.includes(s) ? f.states.filter(x => x !== s) : [...f.states, s]);

  const submit = () => {
    console.log("Company registered:", f);
    setDone(true);
  };

  if (done) return (
    <div className="success">
      <div className="success-num">✓</div>
      <div className="success-title">You're In the Network.</div>
      <p className="success-sub">Your company is being verified. Once active, you'll receive leads matching your coverage area by email. Login credentials will arrive within 24 hours.</p>
    </div>
  );

  const PIPS = ["Company Info", "Coverage", "Plan", "Review"];
  return (
    <div>
      <div className="step-bar">{PIPS.map((s, i) => <div key={s} className={`pip ${step === i + 1 ? "on" : step > i + 1 ? "done" : ""}`}>{s}</div>)}</div>

      {step === 1 && <>
        <h2 className="form-title">Your <em>company.</em></h2>
        <p className="form-sub">Basic information and DOT credentials. We verify every company before activating your profile in the network.</p>
        <div className="field"><label>Company Name</label><input placeholder="Atlas Moving Co." value={f.company} onChange={e => set("company", e.target.value)} /></div>
        <div className="row">
          <div className="field"><label>USDOT Number</label><input placeholder="1234567" value={f.dot} onChange={e => set("dot", e.target.value.replace(/\D/g, ""))} /></div>
          <div className="field"><label>MC Number (Optional)</label><input placeholder="MC-123456" value={f.mc} onChange={e => set("mc", e.target.value)} /></div>
        </div>
        <div className="field"><label>Primary Contact</label><input placeholder="Your name" value={f.contact} onChange={e => set("contact", e.target.value)} /></div>
        <div className="row">
          <div className="field"><label>Business Email</label><input type="email" placeholder="ops@company.com" value={f.email} onChange={e => set("email", e.target.value)} /></div>
          <div className="field"><label>Phone</label><input type="tel" placeholder="(404) 555-0100" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
        </div>
        <div className="form-footer">
          <button className="btn-next" onClick={() => setStep(2)} disabled={!f.company || !f.dot || !f.contact || !f.email || !f.phone}>[ Continue → ]</button>
        </div>
      </>}

      {step === 2 && <>
        <h2 className="form-title">Where do you <em>operate?</em></h2>
        <p className="form-sub">Select every state you actively service. You'll only receive leads from areas you cover.</p>
        <div className="states-grid" style={{ marginBottom: 12 }}>
          {STATES.map(s => <div key={s} className={`state ${f.states.includes(s) ? "on" : ""}`} onClick={() => toggleState(s)}>{s}</div>)}
        </div>
        {f.states.length > 0 && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{f.states.length} state{f.states.length !== 1 ? "s" : ""} selected</div>}
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
          <button className="btn-next" onClick={() => setStep(3)} disabled={f.states.length === 0}>[ Continue → ]</button>
        </div>
      </>}

      {step === 3 && <>
        <h2 className="form-title">Choose your <em>plan.</em></h2>
        <p className="form-sub">Start free. Upgrade when the leads prove their value.</p>
        <div className="tiers" style={{ marginBottom: 4 }}>
          {[
            { id: "free", label: "Starter", price: "Free", period: "No credit card needed", feats: ["5 leads/month", "Email alerts", "Basic profile"], cta: "[ Start Free ]" },
            { id: "ppl", label: "Pay Per Lead", price: "$15", period: "per lead claimed", feats: ["Unlimited leads", "Priority alerts", "Phone + email contacts"], cta: "[ Pay Per Lead ]", featured: true },
            { id: "sub", label: "Pro", price: "$197", period: "per month", feats: ["Unlimited leads", "Verified badge", "Review tools", "Analytics"], cta: "[ Go Pro ]" },
          ].map(p => (
            <div key={p.id} className={`tier ${p.featured ? "featured" : ""} ${f.tier === p.id ? "selected-tier" : ""}`} onClick={() => set("tier", p.id)}>
              <div className="tier-label">{p.label}</div>
              <div className="tier-price">{p.price}</div>
              <div className="tier-period">{p.period}</div>
              <ul className="tier-feats">{p.feats.map(ft => <li key={ft}>{ft}</li>)}</ul>
              <button className="tier-btn" onClick={e => { e.stopPropagation(); set("tier", p.id); }}>{f.tier === p.id ? "✓ Selected" : p.cta}</button>
            </div>
          ))}
        </div>
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
          <button className="btn-next" onClick={() => setStep(4)}>[ Continue → ]</button>
        </div>
      </>}

      {step === 4 && <>
        <h2 className="form-title">Review and <em>submit.</em></h2>
        <p className="form-sub">Confirm your details. We'll verify your DOT number and activate your profile within 24 hours.</p>
        {[["Company", f.company], ["USDOT", f.dot], ["Contact", f.contact], ["Email", f.email], ["States", f.states.join(", ") || "None selected"], ["Plan", f.tier === "free" ? "Starter (Free)" : f.tier === "ppl" ? "Pay Per Lead ($15/lead)" : "Pro ($197/mo)"]].map(([k, v]) => (
          <div key={k} className="review-row"><span className="review-key">{k}</span><span>{v}</span></div>
        ))}
        <div className="form-footer">
          <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
          <button className="btn-next" onClick={submit}>[ Join the Network → ]</button>
        </div>
      </>}
    </div>
  );
}

export default function JPGConnect() {
  const [mode, setMode] = useState("consumer");

  return (
    <>
      <style>{S}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">JPG Connect</div>
        <div className="nav-links">
          <a className="nav-link" href="#quote" onClick={() => setMode("consumer")}>Get Quotes</a>
          <a className="nav-link" href="#join" onClick={() => setMode("company")}>For Companies</a>
          <a className="nav-link" href="https://jpgsystems.com" target="_blank" rel="noreferrer">JPG Systems</a>
          <a className="nav-link" href="/dashboard">Dashboard</a>
          <button className="nav-btn" onClick={() => document.getElementById("start")?.scrollIntoView({ behavior: "smooth" })}>[ Get Started ]</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="hero">
          <div>
            <span className="hero-eyebrow">JPG Connect · Built on Operational Honesty</span>
            <h1>Moving Quotes.<br /><em>Verified.</em><br />No Guessing.</h1>
            <p className="hero-sub">Instant market-rate estimates before you give us your number. Matched with up to 3 licensed companies — not 12. Built on 30 years of moving industry expertise.</p>
            <div className="hero-btns">
              <button className="btn navy" onClick={() => { setMode("consumer"); document.getElementById("start")?.scrollIntoView({ behavior: "smooth" }) }}>[ Get My Free Estimate ]</button>
              <button className="btn" onClick={() => { setMode("company"); document.getElementById("start")?.scrollIntoView({ behavior: "smooth" }) }}>[ List My Company ]</button>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-title">Why JPG Connect is different</div>
            <div className="panel-stats">
              {[["3", "Max companies per lead"], ["72h", "Lead response window"], ["$0", "To start as a company"], ["30 yrs", "Industry expertise"]].map(([v, k]) => (
                <div key={k}><div className="stat-val">{v}</div><div className="stat-key">{k}</div></div>
              ))}
            </div>
            <div className="panel-note">
              <strong>JPG Systems</strong><br />
              "Every estimate on this platform is based on real market data — not a number designed to get you in the door."
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="container">
          <div style={{ maxWidth: 580 }}>
            <span className="eyebrow navy">For Consumers</span>
            <h2 className="sec-title">How It <em>Works.</em></h2>
            <p className="sec-body">No mystery pricing. No 47 companies calling your phone. Just a transparent process from estimate to move day.</p>
          </div>
          <div className="grid-3">
            {[["01", "Tell Us Your Move", "Origin, destination, home size, move date. Takes about 3 minutes."], ["02", "See Your Estimate", "Get a real market-rate price range before you give us your contact information."], ["03", "Get Matched", "Up to 3 verified companies in your area receive your request and compete for your job."]].map(([n, t, d]) => (
              <div key={n} className="cell"><div className="cell-num">{n}</div><div className="cell-title">{t}</div><div className="cell-desc">{d}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* FOR COMPANIES */}
      <div className="section light">
        <div className="container">
          <div style={{ maxWidth: 580 }}>
            <span className="eyebrow">For Moving Companies</span>
            <h2 className="sec-title">Leads That <em>Actually Convert.</em></h2>
            <p className="sec-body">Most platforms sell the same lead to 6 competitors and charge you whether it converts or not. JPG Connect works differently.</p>
          </div>
          <div className="grid-3">
            {[["01", "Verified Consumer Intent", "Every consumer has already seen a market-rate estimate. By the time you see the lead, they know what their move costs."], ["02", "Max 3 Companies", "You compete against two other operators — not a crowd."], ["03", "Free to Start", "Receive up to 5 leads/month at no cost. Upgrade only when the platform proves its value."]].map(([n, t, d]) => (
              <div key={n} className="cell"><div className="cell-num">{n}</div><div className="cell-title">{t}</div><div className="cell-desc">{d}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="section dark" id="start">
        <div className="container" style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <span className="eyebrow">Get Started</span>
            <h2 className="sec-title white">Ready to <em>begin?</em></h2>
          </div>
          <div className="form-wrap">
            <div className="mode-bar">
              <button className={`mode-tab ${mode === "consumer" ? "on" : ""}`} onClick={() => setMode("consumer")}>I Need Moving Quotes</button>
              <button className={`mode-tab ${mode === "company" ? "on" : ""}`} onClick={() => setMode("company")}>I Own a Moving Company</button>
            </div>
            {mode === "consumer" ? <ConsumerFlow /> : <CompanyFlow />}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="foot-logo">JPG Connect</div>
        <div className="foot-links">
          <a className="foot-link" href="https://jpgsystems.com">JPG Systems</a>
          <a className="foot-link" href="https://jpgventures.com">JPG Ventures</a>
          <a className="foot-link" href="/dashboard">Company Login</a>
        </div>
        <div className="foot-copy">© 2026 JPG Ventures LLC · A JPG Systems Product · Atlanta, GA</div>
      </footer>
    </>
  );
}
