import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaAward } from "react-icons/fa";
import { FiCalendar, FiX, FiClock, FiPlus, FiBriefcase, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { MdLightMode, MdDarkMode } from "react-icons/md";

/* ── Floating background symbols ─────────────────────────────────── */
const BG_SYMBOLS = ["₹", "%", "+", "−", "×", "÷", "=", "0", "1", "2", "7", "8", "9"];
function AnimatedBackground({ dark }) {
  const items = Array.from({ length: 30 }, (_, i) => ({
    symbol: BG_SYMBOLS[i % BG_SYMBOLS.length],
    left: `${(i * 3.4) % 100}%`,
    size: `${16 + ((i * 9) % 28)}px`,
    duration: 14 + ((i * 4) % 18),
    delay: -((i * 2.1) % 22),
  }));
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
      {items.map((it, i) => (
        <span key={i} aria-hidden style={{
          position: "absolute",
          fontFamily: "'Share Tech Mono', monospace",
          color: dark ? "rgba(160,160,160,0.07)" : "rgba(80,80,80,0.07)",
          userSelect: "none", pointerEvents: "none",
          animation: `floatUp ${it.duration}s linear ${it.delay}s infinite`,
          left: it.left, fontSize: it.size, bottom: "-60px", fontWeight: 700,
        }}>{it.symbol}</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function SalaryCalculator() {
  const [isThisMonth, setIsThisMonth]       = useState(true);
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [calculationMode, setCalculationMode] = useState("time");
  const [darkMode, setDarkMode]             = useState(false);

  const [usedOnePaid, setUsedOnePaid]   = useState(false);
  const [usedTwoPaid, setUsedTwoPaid]   = useState(false);
  const [usedExtra, setUsedExtra]       = useState(false);
  const [extraDays, setExtraDays]       = useState(0);

  const [paidLeaveDays, setPaidLeaveDays]       = useState(0);
  const [paidLeaveHours, setPaidLeaveHours]     = useState(0);
  const [paidLeaveMinutes, setPaidLeaveMinutes] = useState(0);
  const [extraLeaveDays, setExtraLeaveDays]     = useState(0);
  const [extraLeaveHours, setExtraLeaveHours]   = useState(0);
  const [extraLeaveMinutes, setExtraLeaveMinutes] = useState(0);

  const [salary, setSalary]   = useState("");
  const [result, setResult]   = useState(null);
  const [isFullMonth, setIsFullMonth] = useState(false);

  const [otEntries, setOtEntries] = useState([
    { date: "", hours: 0, minutes: 0, seconds: 0, otPercent: "", otMode: "time" },
  ]);

  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal]     = useState(false);
  const [otCalOpen, setOtCalOpen]       = useState({});

  const startCalRef = useRef(null);
  const endCalRef   = useRef(null);
  const otCalRefs   = useRef({});

  useEffect(() => {
    const h = (e) => {
      if (startCalRef.current && !startCalRef.current.contains(e.target)) setShowStartCal(false);
      if (endCalRef.current   && !endCalRef.current.contains(e.target))   setShowEndCal(false);
      Object.keys(otCalRefs.current).forEach((idx) => {
        if (otCalRefs.current[idx] && !otCalRefs.current[idx].contains(e.target))
          setOtCalOpen((p) => ({ ...p, [idx]: false }));
      });
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toYMD = (d) => {
    if (!d) return "";
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  };
  const fmtDisplay = (s) => {
    if (!s) return "Pick a date";
    return new Date(s+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  };
  const curMonthName = () => new Date().toLocaleString("default",{month:"long",year:"numeric"});

  useEffect(() => {
    if (isThisMonth) {
      const n = new Date();
      setStartDate(toYMD(new Date(n.getFullYear(), n.getMonth(), 1)));
      setEndDate(toYMD(new Date(n.getFullYear(), n.getMonth()+1, 0)));
      setIsFullMonth(true);
    }
  }, [isThisMonth]);

  useEffect(() => {
    if (!isThisMonth && startDate && endDate) checkFull(startDate, endDate);
  }, [isThisMonth, startDate, endDate]);

  const checkFull = (s, e) => {
    const sd = new Date(s), ed = new Date(e);
    const last = new Date(sd.getFullYear(), sd.getMonth()+1, 0);
    setIsFullMonth(
      sd.getDate()===1 && ed.getDate()===last.getDate() &&
      sd.getMonth()===ed.getMonth() && sd.getFullYear()===ed.getFullYear()
    );
  };

  const daysInMonth  = (y,m) => new Date(y,m+1,0).getDate();
  const sundaysInMonth = (y,m) => { let s=0; for(let d=1;d<=daysInMonth(y,m);d++) if(new Date(y,m,d).getDay()===0) s++; return s; };
  const workingDays  = (s,e) => { let w=0,c=new Date(s); while(c<=e){ if(c.getDay()!==0)w++; c.setDate(c.getDate()+1); } return w; };

  const propSalary = (s, e, base) => {
    if (s.getMonth()===e.getMonth() && s.getFullYear()===e.getFullYear()) {
      const td=daysInMonth(s.getFullYear(),s.getMonth()), sun=sundaysInMonth(s.getFullYear(),s.getMonth());
      return (base/(td-sun))*workingDays(s,e);
    }
    let total=0, cur=new Date(s);
    while (cur<=e) {
      const y=cur.getFullYear(), m=cur.getMonth();
      const ms=new Date(y,m,1), me=new Date(y,m+1,0);
      const rs=cur>ms?cur:ms, re=e<me?e:me;
      total+=(base/(daysInMonth(y,m)-sundaysInMonth(y,m)))*workingDays(rs,re);
      cur=new Date(y,m+1,1);
    }
    return total;
  };

  const handleDayChk = (t) => {
    if(t==="one"){setUsedOnePaid(!usedOnePaid);setUsedTwoPaid(false);setUsedExtra(false);setExtraDays(0);}
    else if(t==="two"){setUsedTwoPaid(!usedTwoPaid);setUsedOnePaid(false);setUsedExtra(false);setExtraDays(0);}
    else{setUsedExtra(!usedExtra);setUsedOnePaid(false);setUsedTwoPaid(false);}
  };
  const resetTime = () => {setPaidLeaveDays(0);setPaidLeaveHours(0);setPaidLeaveMinutes(0);setExtraLeaveDays(0);setExtraLeaveHours(0);setExtraLeaveMinutes(0);};
  const resetDay  = () => {setUsedOnePaid(false);setUsedTwoPaid(false);setUsedExtra(false);setExtraDays(0);};

  const addOt    = () => setOtEntries([...otEntries,{date:"",hours:0,minutes:0,seconds:0,otPercent:"",otMode:"time"}]);
  const removeOt = (i) => setOtEntries(otEntries.filter((_,x)=>x!==i));
  const updateOt = (i,f,v) => {
    const u=[...otEntries]; u[i]={...u[i],[f]:v};
    if(f==="otPercent") u[i].otMode=v!==""?"percent":"time";
    else if(["hours","minutes","seconds"].includes(f)){u[i].otMode="time";u[i].otPercent="";}
    setOtEntries(u);
  };
  const pct2time = (p) => { const m=parseFloat(p)*9*60; return {h:Math.floor(m/60),m:Math.floor(m%60),s:Math.round((m*60)%60),totalMins:m}; };
  const otMins   = (e) => e.otMode==="percent"&&e.otPercent!==""?parseFloat(e.otPercent)*9*60:(parseInt(e.hours)||0)*60+(parseInt(e.minutes)||0)+(parseInt(e.seconds)||0)/60;
  const otPct    = (m) => m/(9*60);

  const calculate = () => {
    const now=new Date(); let s,e;
    if(isThisMonth){s=new Date(now.getFullYear(),now.getMonth(),1);e=new Date(now.getFullYear(),now.getMonth()+1,0);}
    else{
      if(!startDate||!endDate){alert("Select dates");return;}
      s=new Date(startDate);e=new Date(endDate);
      if(s>e){alert("Start cannot be after end");return;}
    }
    const base=parseFloat(salary);
    if(!base||base<=0){alert("Enter valid salary");return;}
    const totalDays=Math.floor((e-s)/(864e5))+1;
    let suns=0,c=new Date(s); while(c<=e){if(c.getDay()===0)suns++;c.setDate(c.getDate()+1);}
    const wd=totalDays-suns, mpd=540;
    const validOT=otEntries.filter(x=>x.date&&otMins(x)>0);
    const totOTm=validOT.reduce((a,x)=>a+otMins(x),0);
    const totOTpct=otPct(totOTm);
    const pmrOT=base/(wd*mpd);
    const totOTamt=totOTm*pmrOT;
    const otBD=validOT.map(x=>{const m=otMins(x),p=otPct(m),w=m*pmrOT;return{date:x.date,hours:parseInt(x.hours)||0,minutes:parseInt(x.minutes)||0,seconds:parseInt(x.seconds)||0,totalMinutes:m,percent:p,wage:w,mode:x.otMode};});

    let usedPM=0,extraM=0,unusedPD=0,final=0;
    if(isThisMonth||isFullMonth){
      const bm=wd*mpd, pmr=base/bm;
      if(calculationMode==="day"){
        let ud=0;
        if(usedExtra){ud=2;extraM=(parseInt(extraDays)||0)*mpd;}
        else if(usedTwoPaid)ud=2; else if(usedOnePaid)ud=1;
        usedPM=ud*mpd; unusedPD=2-ud;
      } else {
        const pl=(parseInt(paidLeaveDays)||0)*mpd+(parseInt(paidLeaveHours)||0)*60+(parseInt(paidLeaveMinutes)||0);
        const el=(parseInt(extraLeaveDays)||0)*mpd+(parseInt(extraLeaveHours)||0)*60+(parseInt(extraLeaveMinutes)||0);
        if(pl>2*mpd){alert("Paid leave cannot exceed 2 days");return;}
        usedPM=pl; unusedPD=Math.floor((2*mpd-pl)/mpd); extraM=el;
      }
      const effM=bm+unusedPD*mpd-extraM; final=pmr*effM;
      setResult({baseSalary:base,baseWorkingDays:wd,baseMinutes:bm,usedPaidMinutes:usedPM,extraMinutes:extraM,unusedPaidDays:unusedPD,inHand:Math.round(final),calculationMode,totalDays,sundays:suns,perMinuteRate:pmr.toFixed(4),effectiveMinutes:Math.round(effM),monthName:isThisMonth?curMonthName():getMonthName(s),isCustomRange:!isThisMonth,isFullMonth:true,proportionalBase:Math.round(base),deduction:Math.round(base-final),totalOtMinutes:totOTm,totalOtPercent:totOTpct,totalOtAmount:totOTamt,otBreakdown:otBD,netSalary:Math.round(final+totOTamt)});
    } else {
      const ps=propSalary(s,e,base); let ded=0; const dr=base/wd;
      if(calculationMode==="day"){
        let pld=0;
        if(usedExtra){pld=2;ded+=(parseInt(extraDays)||0)*dr;}
        else if(usedTwoPaid)pld=2; else if(usedOnePaid)pld=1;
        const apd=2*(wd/(daysInMonth(s.getFullYear(),s.getMonth())-sundaysInMonth(s.getFullYear(),s.getMonth())));
        if(pld>apd)ded+=(pld-apd)*dr;
      } else {
        const pl=(parseInt(paidLeaveDays)||0)*mpd+(parseInt(paidLeaveHours)||0)*60+(parseInt(paidLeaveMinutes)||0);
        const el=(parseInt(extraLeaveDays)||0)*mpd+(parseInt(extraLeaveHours)||0)*60+(parseInt(extraLeaveMinutes)||0);
        const pdd=pl/mpd,edd=el/mpd;
        const twdm=daysInMonth(s.getFullYear(),s.getMonth())-sundaysInMonth(s.getFullYear(),s.getMonth());
        const apd=2*(wd/twdm);
        if(pdd>apd)ded+=(pdd-apd)*dr; ded+=edd*dr;
      }
      final=Math.max(0,ps-ded);
      setResult({baseSalary:base,baseWorkingDays:wd,baseMinutes:wd*mpd,usedPaidMinutes:calculationMode==="day"?(usedOnePaid?mpd:usedTwoPaid?2*mpd:usedExtra?2*mpd:0):(parseInt(paidLeaveDays)||0)*mpd+(parseInt(paidLeaveHours)||0)*60+(parseInt(paidLeaveMinutes)||0),extraMinutes:calculationMode==="day"?(usedExtra?(parseInt(extraDays)||0)*mpd:0):(parseInt(extraLeaveDays)||0)*mpd+(parseInt(extraLeaveHours)||0)*60+(parseInt(extraLeaveMinutes)||0),unusedPaidDays:calculationMode==="day"?(usedOnePaid?1:usedTwoPaid?0:usedExtra?0:2):Math.max(0,2-((parseInt(paidLeaveDays)||0)+((parseInt(paidLeaveHours)||0)+(parseInt(paidLeaveMinutes)||0)/60)/9)),inHand:Math.round(final),calculationMode,totalDays,sundays:suns,perMinuteRate:(base/(wd*mpd)).toFixed(4),effectiveMinutes:Math.round(wd*mpd),monthName:fmtRange(s,e),isCustomRange:true,isFullMonth:false,proportionalBase:Math.round(ps),deduction:Math.round(ded),totalOtMinutes:totOTm,totalOtPercent:totOTpct,totalOtAmount:totOTamt,otBreakdown:otBD,netSalary:Math.round(final+totOTamt)});
    }
  };

  const reset = () => {setSalary("");setResult(null);resetDay();resetTime();setOtEntries([{date:"",hours:0,minutes:0,seconds:0,otPercent:"",otMode:"time"}]);};
  const getMonthName = (d) => d?new Date(d).toLocaleString("default",{month:"long",year:"numeric"}):"--";
  const fmtRange = (s,e) => (!s||!e)?"--":`${s.toLocaleDateString("en-GB")} to ${e.toLocaleDateString("en-GB")}`;
  const periodDisplay = () => {
    if(isThisMonth) return curMonthName();
    if(startDate&&endDate) return fmtRange(new Date(startDate),new Date(endDate));
    return "--";
  };

  /* ── Theme: Gray stone school calculator ──────────────────────── */
  const dm = darkMode;
  const C = {
    pageBg:     dm ? "#1c1c1c" : "#d0d0c8",
    cardBg:     dm ? "#2e2e2e" : "#c4c4bc",
    panelBg:    dm ? "#262626" : "#b8b8b0",
    insetBg:    dm ? "#1a1a1a" : "#a4a49c",
    displayBg:  dm ? "#0d0d0d" : "#111",
    displayTxt: dm ? "#b8ffb0" : "#9dffb0",
    border:     dm ? "#555" : "#88887e",
    borderDk:   dm ? "#444" : "#78786e",
    text:       dm ? "#e0e0d8" : "#1a1a12",
    textSub:    dm ? "#989890" : "#38382e",
    textMuted:  dm ? "#686860" : "#585850",
    accent:     dm ? "#808078" : "#505048",
    btnFace:    dm ? "#3a3a3a" : "#aeaea6",
    btnShadow:  dm ? "#111" : "#7a7a72",
    btnTop:     dm ? "#4a4a4a" : "#ccccc4",
    green:      dm ? "#6daf5a" : "#3a7030",
    red:        dm ? "#b05050" : "#802020",
    segGlow:    dm ? "rgba(150,255,150,0.15)" : "rgba(80,220,100,0.1)",
  };

  /* ── Shared style helpers ─────────────────────────────────────── */
  const card = {
    background: C.cardBg,
    border: `2px solid ${C.border}`,
    borderRadius: "6px",
    boxShadow: dm
      ? `inset 0 1px 0 #4a4a4a, 0 4px 12px rgba(0,0,0,0.5), 3px 3px 0 #111`
      : `inset 0 1px 0 #deded6, 0 4px 12px rgba(0,0,0,0.2), 3px 3px 0 #7a7a72`,
    position: "relative",
  };

  const panel = {
    background: C.panelBg,
    border: `1px solid ${C.borderDk}`,
    borderRadius: "4px",
    padding: "12px 14px",
    boxShadow: `inset 0 2px 5px rgba(0,0,0,0.18)`,
  };

  const inp = {
    background: C.displayBg,
    border: `1px solid ${C.border}`,
    borderRadius: "3px",
    color: C.displayTxt,
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    fontSize: "15px",
    padding: "9px 12px",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6)`,
    outline: "none",
    letterSpacing: "0.04em",
  };

  const lbl = {
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: C.textSub,
    marginBottom: "5px",
    display: "block",
  };

  const calcKey = (variant = "normal") => ({
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    border: `1px solid ${C.borderDk}`,
    borderRadius: "4px",
    padding: "12px 16px",
    transition: "all 0.07s",
    boxShadow: variant === "primary"
      ? `0 4px 0 #2a4e2a, inset 0 1px 0 rgba(255,255,255,0.1)`
      : variant === "reset"
      ? `0 4px 0 #4e2a2a, inset 0 1px 0 rgba(255,255,255,0.1)`
      : `0 4px 0 ${C.btnShadow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
    background: variant === "primary"
      ? `linear-gradient(180deg, #558855 0%, #446644 100%)`
      : variant === "reset"
      ? `linear-gradient(180deg, #886666 0%, #775555 100%)`
      : `linear-gradient(180deg, ${C.btnTop} 0%, ${C.btnFace} 100%)`,
    color: variant === "primary" || variant === "reset" ? "#e8ffe8" : C.text,
    flex: 1,
  });

  const secHead = {
    fontFamily: "'Share Tech Mono', 'Courier New', monospace",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: C.textMuted,
    borderBottom: `1px solid ${C.borderDk}`,
    paddingBottom: "6px",
    marginBottom: "10px",
  };

  const Row = ({ label, value, color, bold, last }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom: last ? "none" : `1px dashed ${C.borderDk}` }}>
      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"18px", color:C.textSub }}>{label}</span>
      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"16px", color:color||C.text, fontWeight:bold?700:500 }}>{value}</span>
    </div>
  );

  const calBtn = {
    ...inp,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    cursor: "pointer", padding: "9px 12px", textAlign: "left", fontSize: "13px",
  };

  /* Corner bolt */
  const Bolt = ({pos}) => (
    <div style={{position:"absolute",width:"11px",height:"11px",borderRadius:"50%",
      background:`radial-gradient(circle at 35% 35%, ${C.btnTop}, ${C.btnShadow})`,
      border:`1px solid ${C.border}`, ...pos, zIndex:2,
    }}>
      <div style={{position:"absolute",top:"50%",left:"10%",right:"10%",height:"1px",
        background:"rgba(0,0,0,0.4)",transform:"translateY(-50%) rotate(45deg)"}} />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Share+Tech&display=swap');
        @keyframes floatUp {
          0%   { transform:translateY(0) rotate(0deg); opacity:0; }
          5%   { opacity:1; }
          90%  { opacity:0.7; }
          100% { transform:translateY(-105vh) rotate(20deg); opacity:0; }
        }
        * { box-sizing:border-box; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; background:${C.insetBg}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
        input[type=number] { -moz-appearance:textfield; }
        input:focus { outline:none!important; border-color:${C.displayTxt}!important;
          box-shadow:inset 0 2px 6px rgba(0,0,0,0.6), 0 0 0 2px ${C.segGlow}!important; }
        .ckey:active { transform:translateY(3px)!important; box-shadow:none!important; }

        .react-calendar { border-radius:4px!important; border:2px solid ${C.border}!important;
          background:${C.cardBg}!important; font-family:'Share Tech Mono',monospace!important;
          box-shadow:3px 3px 0 rgba(0,0,0,0.35)!important; color:${C.text}!important; }
        .react-calendar__tile { color:${C.text}!important; border-radius:2px!important;
          font-family:'Share Tech Mono',monospace!important; font-size:12px!important; }
        .react-calendar__tile--active { background:${C.accent}!important; color:#fff!important; }
        .react-calendar__tile:hover { background:${C.insetBg}!important; }
        .react-calendar__navigation button { color:${C.textSub}!important; font-weight:700;
          font-family:'Share Tech Mono',monospace!important; }
        .react-calendar__navigation button:hover { background:${C.insetBg}!important; }
        .react-calendar__month-view__weekdays { color:${C.textMuted}!important;
          font-family:'Share Tech Mono',monospace!important; font-size:11px!important; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration:none!important; }
        .cal-popup { position:absolute; z-index:50; top:calc(100% + 4px); left:0; }

        .rtoggle { position:relative; display:inline-flex; align-items:center; cursor:pointer; gap:10px; }
        .rtoggle input { position:absolute; opacity:0; width:0; height:0; }
        .rslider { width:62px; height:30px; background:${C.displayBg}; border:2px solid ${C.border};
          border-radius:3px; position:relative; transition:background 0.2s;
          box-shadow:inset 0 2px 6px rgba(0,0,0,0.5); flex-shrink:0; }
        .rslider::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px;
          background:${C.accent}; border-radius:2px; transition:transform 0.2s;
          box-shadow:0 1px 3px rgba(0,0,0,0.4); }
        input:checked + .rslider::after { transform:translateX(30px); background:${C.displayTxt};
          box-shadow:0 0 6px ${C.displayTxt}; }

        .rcheck { display:flex; align-items:center; gap:8px; cursor:pointer; padding:5px 0; }
        .rcheck input { display:none; }
        .rchkbox { width:17px; height:17px; border:2px solid ${C.border}; background:${C.displayBg};
          border-radius:2px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
          box-shadow:inset 0 1px 3px rgba(0,0,0,0.4); transition:border-color 0.15s; }
        .rcheck:hover .rchkbox { border-color:${C.displayTxt}; }
        .rchktick { width:9px; height:9px; background:${C.displayTxt}; display:none;
          border-radius:1px; box-shadow:0 0 4px ${C.displayTxt}; }
        .rcheck input:checked ~ .rchkbox .rchktick { display:block; }

        .rradio { display:flex; align-items:center; gap:8px; cursor:pointer; }
        .rradio input { display:none; }
        .rrdot { width:16px; height:16px; border:2px solid ${C.border}; border-radius:50%;
          background:${C.displayBg}; display:flex; align-items:center; justify-content:center;
          flex-shrink:0; box-shadow:inset 0 1px 3px rgba(0,0,0,0.4); transition:border-color 0.15s; }
        .rradio:hover .rrdot { border-color:${C.displayTxt}; }
        .rrfill { width:8px; height:8px; border-radius:50%; background:${C.displayTxt};
          display:none; box-shadow:0 0 4px ${C.displayTxt}; }
        .rradio input:checked ~ .rrdot .rrfill { display:block; }

        .scanlines { position:fixed; inset:0; pointer-events:none; z-index:999;
          background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.022) 3px,rgba(0,0,0,0.022) 4px); }

        /* ── RESPONSIVE BREAKPOINTS ── */

        /* Main 2-col grid → single column on tablet/mobile */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Date range row: 3 cols → 1 col on mobile */
        .date-range-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 600px) {
          .date-range-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (min-width: 601px) and (max-width: 900px) {
          .date-range-grid {
            grid-template-columns: 1fr 1fr;
          }
          .date-range-grid > :first-child {
            grid-column: 1 / -1;
          }
        }

        /* Mode + leave: 120px 1fr → stack on mobile */
        .mode-leave-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 10px;
        }
        @media (max-width: 600px) {
          .mode-leave-grid {
            grid-template-columns: 1fr;
          }
        }

        /* OT entry grid: date + h+m+s+% → stack date then row on mobile */
        .ot-entry-grid {
          display: grid;
          grid-template-columns: 1.8fr 0.65fr 0.65fr 0.65fr 0.65fr;
          gap: 7px;
          align-items: end;
        }
        @media (max-width: 600px) {
          .ot-entry-grid {
            grid-template-columns: 1fr;
          }
          .ot-hms-group {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 7px;
          }
        }
        @media (min-width: 601px) and (max-width: 780px) {
          .ot-entry-grid {
            grid-template-columns: 1fr 1fr;
          }
          .ot-entry-grid > :first-child {
            grid-column: 1 / -1;
          }
        }

        /* Salary row: 1fr auto → stack on very small */
        .salary-action-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: end;
        }
        @media (max-width: 400px) {
          .salary-action-grid {
            grid-template-columns: 1fr;
          }
          .salary-action-btns {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }

        /* Result 2x2 grid → 1 col on small mobile */
        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .result-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Leave time inputs: 1fr auto 1fr → stack on mobile */
        .leave-time-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 10px;
        }
        @media (max-width: 500px) {
          .leave-time-grid {
            grid-template-columns: 1fr;
          }
          .leave-divider {
            display: none !important;
          }
        }

        /* Paid leave checkboxes: 2 col → 1 col on small */
        .paid-leave-checks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 12px;
        }
        @media (max-width: 400px) {
          .paid-leave-checks {
            grid-template-columns: 1fr;
          }
        }

        /* Header flex: wrap on mobile */
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* Month badge: reposition on small screens */
        .month-badge {
          display: inline-block;
        }
        @media (max-width: 600px) {
          .month-badge {
            order: 3;
            width: 100%;
            text-align: center;
          }
        }

        /* Calendar popup: ensure it doesn't overflow viewport on mobile */
        @media (max-width: 480px) {
          .cal-popup {
            left: 50% !important;
            transform: translateX(-50%);
          }
          .react-calendar {
            width: 280px !important;
          }
        }

        /* Padding adjustments for cards on mobile */
        @media (max-width: 600px) {
          .main-card {
            padding: 14px !important;
          }
        }

        /* OT summary row on mobile */
        @media (max-width: 480px) {
          .ot-summary-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
      `}</style>

      <div className="scanlines" />
      <AnimatedBackground dark={dm} />

      <div style={{
        minHeight: "100vh",
        background: dm
          ? "linear-gradient(135deg,#1c1c1c 0%,#222 50%,#1a1a1a 100%)"
          : "linear-gradient(135deg,#c8c8c0 0%,#d8d8d0 50%,#c0c0b8 100%)",
        padding: "20px 16px",
        position: "relative", zIndex: 1,
        fontFamily: "'Share Tech Mono','Courier New',monospace",
        transition: "background 0.3s",
      }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto" }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign:"center", marginBottom:"20px" }}>
            <div className="header-row">
              <div>
                <h1 style={{
                  margin:0, fontSize:"clamp(20px,3vw,30px)", fontWeight:700,
                  letterSpacing:"0.1em", color:C.text, textTransform:"uppercase",
                  fontFamily:"'Share Tech','Share Tech Mono',monospace",
                  textShadow: dm ? "0 0 20px rgba(200,200,180,0.15)" : "1px 1px 0 rgba(0,0,0,0.18)",
                }}>Salary Calculator</h1>
              </div>
            {isThisMonth && (
              <div className="month-badge" style={{
                background:C.displayBg, border:`1px solid ${C.border}`,
                borderRadius:"3px", padding:"5px 18px", fontSize:"13px", fontWeight:700,
                color:C.displayTxt, letterSpacing:"0.1em",
                boxShadow:`inset 0 2px 5px rgba(0,0,0,0.5), 0 0 10px ${C.segGlow}`,
                textShadow:`0 0 8px ${C.displayTxt}`,
              }}>
                ▶ {curMonthName().toUpperCase()} ◀
              </div>
            )}
            <button onClick={()=>setDarkMode(!dm)} className="ckey" style={{
                ...calcKey("normal"), flex:"none", padding:"8px 12px", fontSize:"12px",
                display:"flex", alignItems:"center", gap:"6px",
              }}>
                {dm ? <MdLightMode size={14}/> : <MdDarkMode size={14}/>}
                {dm ? "LIGHT" : "DARK"}
              </button>
            </div>
          </div>

          {/* ── MAIN 2-COL GRID ── */}
          <div className="main-grid">

            {/* ══ LEFT PANEL — INPUT ══ */}
            <div className="main-card" style={{ ...card, padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              <Bolt pos={{top:"8px",left:"8px"}} />
              <Bolt pos={{top:"8px",right:"8px"}} />
              <Bolt pos={{bottom:"8px",left:"8px"}} />
              <Bolt pos={{bottom:"8px",right:"8px"}} />

              {/* ROW A: Period + From + To — 3 columns */}
              <div className="date-range-grid">

                {/* Period toggle */}
                <div style={{ ...panel }}>
                  <div style={secHead}>Date Range</div>
                  <label className="rtoggle" style={{marginBottom:"8px"}}>
                    <input type="checkbox" checked={isThisMonth} onChange={()=>setIsThisMonth(!isThisMonth)} />
                    <div className="rslider" />
                    <span style={{ fontSize:"16px", fontWeight:700, color:C.text, letterSpacing:"0.08em" }}>{isThisMonth?"THIS MONTH":"CUSTOM"}</span>
                  </label>
                  <div style={{ marginTop:"8px", fontSize:"14px", color: isFullMonth?C.green:"#b06020", letterSpacing:"0.04em" }}>
                    {isFullMonth
                      ? <><FiCheckCircle style={{display:"inline",marginRight:"4px"}} size={14}/>Full month</>
                      : <><FiAlertTriangle style={{display:"inline",marginRight:"4px"}} size={14}/>Partial range</>}
                  </div>
                </div>

                {/* Start date */}
                <div style={panel}>
                  <div style={secHead}>From Date</div>
                  <div style={{ position:"relative" }} ref={startCalRef}>
                    <button type="button" disabled={isThisMonth}
                      onClick={()=>{ if(!isThisMonth){setShowStartCal(v=>!v);setShowEndCal(false);} }}
                      style={{ ...calBtn, opacity:isThisMonth?0.4:1, cursor:isThisMonth?"not-allowed":"pointer" }}>
                      <span>{startDate?fmtDisplay(startDate):"Pick date"}</span>
                      <FiCalendar size={18} style={{color:C.textSub}}/>
                    </button>
                    {showStartCal && (
                      <div className="cal-popup">
                        <Calendar value={startDate?new Date(startDate+"T00:00:00"):new Date()}
                          onChange={d=>{setStartDate(toYMD(d));setShowStartCal(false);}}
                          prev2Label={null} next2Label={null}/>
                      </div>
                    )}
                  </div>
                </div>

                {/* End date */}
                <div style={panel}>
                  <div style={secHead}>To Date</div>
                  <div style={{ position:"relative" }} ref={endCalRef}>
                    <button type="button" disabled={isThisMonth}
                      onClick={()=>{ if(!isThisMonth){setShowEndCal(v=>!v);setShowStartCal(false);} }}
                      style={{ ...calBtn, opacity:isThisMonth?0.4:1, cursor:isThisMonth?"not-allowed":"pointer" }}>
                      <span>{endDate?fmtDisplay(endDate):"Pick date"}</span>
                      <FiCalendar size={18} style={{color:C.textSub}}/>
                    </button>
                    {showEndCal && (
                      <div className="cal-popup">
                        <Calendar value={endDate?new Date(endDate+"T00:00:00"):new Date()}
                          onChange={d=>{setEndDate(toYMD(d));setShowEndCal(false);}}
                          minDate={startDate?new Date(startDate+"T00:00:00"):undefined}
                          prev2Label={null} next2Label={null}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW B: Leave mode + Leave inputs — 2 columns */}
              <div className="mode-leave-grid">

                {/* Mode */}
                <div style={panel}>
                  <div style={secHead}>Mode</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    {[{v:"day",l:"Day"},{v:"time",l:"D:H:M"}].map(({v,l})=>(
                      <label key={v} className="rradio">
                        <input type="radio" name="mode" value={v} checked={calculationMode===v}
                          onChange={()=>{setCalculationMode(v);v==="day"?resetTime():resetDay();}} />
                        <div className="rrdot"><div className="rrfill"/></div>
                        <span style={{ fontSize:"16px", color:C.text }}>{l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Leave inputs */}
                <div style={panel}>
                  {(isThisMonth || isFullMonth) ? (
                    calculationMode === "day" ? (
                      <>
                        <div style={secHead}>Paid Leave</div>
                        <div className="paid-leave-checks">
                          {[
                            {label:"1 paid leave", type:"one", checked:usedOnePaid},
                            {label:"2 paid leaves", type:"two", checked:usedTwoPaid},
                            {label:"Extra leaves",  type:"extra", checked:usedExtra},
                          ].map(item=>(
                            <label key={item.type} className="rcheck">
                              <input type="checkbox" checked={item.checked} onChange={()=>handleDayChk(item.type)} />
                              <div className="rchkbox"><div className="rchktick"/></div>
                              <span style={{ fontSize:"16px", color:C.text }}>{item.label}</span>
                            </label>
                          ))}
                          {usedExtra && (
                            <div>
                              <label style={lbl}>Extra Days</label>
                              <input type="number" value={extraDays} onChange={e=>setExtraDays(e.target.value)} min="1" placeholder="0" style={inp} />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={secHead}>Leave Time Inputs</div>
                        <div className="leave-time-grid">
                          {[
                            {title:"Paid Leave", sub:"(max 2d)", states:[paidLeaveDays,paidLeaveHours,paidLeaveMinutes], setters:[setPaidLeaveDays,setPaidLeaveHours,setPaidLeaveMinutes], maxes:["2","23","59"]},
                            {title:"Extra Leave", sub:"", states:[extraLeaveDays,extraLeaveHours,extraLeaveMinutes], setters:[setExtraLeaveDays,setExtraLeaveHours,setExtraLeaveMinutes], maxes:[undefined,"23","59"]},
                          ].map((g, gIdx)=>(
                            <React.Fragment key={g.title}>
                              {gIdx === 1 && (
                                <div className="leave-divider" style={{
                                  display: "flex",
                                  alignItems: "stretch",
                                  justifyContent: "center",
                                  padding: "4px 0",
                                }}>
                                  <div style={{
                                    width: "1px",
                                    borderLeft: `2px dotted ${C.borderDk}`,
                                    opacity: 0.7,
                                  }} />
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize:"16px", color:C.textSub, letterSpacing:"0.08em", marginBottom:"6px", fontWeight:700 }}>
                                  {g.title} <span style={{fontSize:"14px",color:C.textMuted,fontWeight:400}}>{g.sub}</span>
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"5px" }}>
                                  {["D","H","M"].map((lbx,ix)=>(
                                    <div key={lbx}>
                                      <label style={{ ...lbl, textAlign:"center", fontSize:"16px" }}>{lbx}</label>
                                      <input type="number" value={g.states[ix]} onChange={e=>g.setters[ix](e.target.value)} min="0" max={g.maxes[ix]} placeholder="0" style={{ ...inp, textAlign:"center", padding:"7px 4px", fontSize:"16px" }} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </>
                    )
                  ) : (
                    <div style={{ fontSize:"13px", color:"#b06020", letterSpacing:"0.04em" }}>
                      <FiAlertTriangle style={{display:"inline",marginRight:"6px"}} size={13}/>
                      Partial month — deductions are proportional.
                    </div>
                  )}
                </div>
              </div>

              {/* ROW C: OT Section */}
              <div style={panel}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px", flexWrap:"wrap", gap:"6px" }}>
                  <div style={secHead}>Over Time (OT)</div>
                  <span style={{
                    background:C.displayBg, border:`1px solid ${C.border}`, borderRadius:"2px",
                    padding:"2px 10px", fontSize:"14px", color:C.displayTxt,
                    letterSpacing:"0.08em", fontWeight:700,
                    boxShadow:`inset 0 1px 3px rgba(0,0,0,0.4)`,
                  }}>9 HRS = 1%</span>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {otEntries.map((entry, idx) => {
                    const isP = entry.otMode==="percent" && entry.otPercent!=="";
                    const hasT = parseInt(entry.hours)>0||parseInt(entry.minutes)>0||parseInt(entry.seconds)>0;
                    const rev  = isP ? pct2time(entry.otPercent) : null;
                    const mins = otMins(entry), pct = otPct(mins);

                    return (
                      <div key={idx} style={{
                        background:C.insetBg, border:`1px solid ${C.borderDk}`,
                        borderRadius:"3px", padding:"10px",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
                          <span style={{ fontSize:"16px", fontWeight:700, color:C.textSub, letterSpacing:"0.1em" }}>OT #{idx+1}</span>
                          {isP && <span style={{ fontSize:"15px", background:C.panelBg, color:C.text, padding:"1px 7px", borderRadius:"2px", border:`1px solid ${C.border}` }}>% MODE</span>}
                          {!isP&&hasT && <span style={{ fontSize:"15px", background:C.panelBg, color:C.green, padding:"1px 7px", borderRadius:"2px", border:`1px solid ${C.border}` }}>TIME MODE</span>}
                          {otEntries.length>1 && (
                            <button onClick={()=>removeOt(idx)} className={`border`} style={{ marginLeft:"auto", background:"none", color:C.red, cursor:"pointer", padding:0, border:"none" }}>
                              <FiX size={18}/>
                            </button>
                          )}
                        </div>

                        {/* Date row */}
                        <div style={{ marginBottom:"7px" }}>
                          <label style={{...lbl,fontSize:"16px"}}>Date</label>
                          <div style={{position:"relative"}} ref={el=>{otCalRefs.current[idx]=el;}}>
                            <button type="button"
                              onClick={()=>setOtCalOpen(p=>({...p,[idx]:!p[idx]}))}
                              style={{...calBtn,fontSize:"15px",padding:"8px 10px"}}>
                              <span>{entry.date?fmtDisplay(entry.date):"Pick date"}</span>
                              <FiCalendar size={18} style={{color:C.textSub}}/>
                            </button>
                            {otCalOpen[idx] && (
                              <div className="cal-popup">
                                <Calendar value={entry.date?new Date(entry.date+"T00:00:00"):new Date()}
                                  onChange={d=>{updateOt(idx,"date",toYMD(d));setOtCalOpen(p=>({...p,[idx]:false}));}}
                                  prev2Label={null} next2Label={null}/>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* H + M + S + % row */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"7px", alignItems:"end" }}>
                          {[{f:"hours",l:"H"},{f:"minutes",l:"M"},{f:"seconds",l:"S"},{f:"otPercent",l:"%"}].map(({f,l})=>{
                            const isPctField = f==="otPercent";
                            return (
                              <div key={f}>
                                <label style={{...lbl,fontSize:"16px",textAlign:"center",
                                  color:isPctField&&isP?C.displayTxt:C.textSub}}>{l}</label>
                                <input type="number"
                                  value={isPctField?entry.otPercent:(isP?"":entry[f])}
                                  onChange={e=>updateOt(idx,f,e.target.value)}
                                  disabled={!isPctField&&isP}
                                  min="0" max={f==="minutes"||f==="seconds"?"59":undefined}
                                  step={isPctField?"0.001":undefined}
                                  placeholder="0"
                                  style={{...inp,textAlign:"center",padding:"7px 3px",fontSize:"16px",
                                    opacity:(!isPctField&&isP)?0.35:1,
                                    cursor:(!isPctField&&isP)?"not-allowed":"text",
                                    borderColor:isPctField&&isP?C.displayTxt:C.border,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Feedback */}
                        {isP && rev && (
                          <div style={{ marginTop:"6px", textAlign:"center", fontSize:"16px", color:C.displayTxt,
                            background:C.displayBg, borderRadius:"2px", padding:"5px 8px",
                            boxShadow:`inset 0 1px 4px rgba(0,0,0,0.4)` }}>
                            {entry.otPercent}% → {rev.h}h {rev.m}m {rev.s}s | {rev.totalMins.toFixed(1)} min
                          </div>
                        )}
                        {!isP && hasT && (
                          <div style={{ marginTop:"6px", textAlign:"center", fontSize:"16px", color:C.displayTxt,
                            background:C.displayBg, borderRadius:"2px", padding:"4px 8px",
                            boxShadow:`inset 0 1px 4px rgba(0,0,0,0.4)` }}>
                            {entry.hours||0}h {entry.minutes||0}m {entry.seconds||0}s → <strong>{pct.toFixed(3)}% OT</strong>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={addOt} className="ckey" style={{
                  width:"100%", marginTop:"8px", padding:"8px",
                  background:"transparent", border:`2px dashed ${C.border}`,
                  borderRadius:"3px", color:C.textSub,
                  fontFamily:"'Share Tech Mono',monospace", fontSize:"16px",
                  fontWeight:700, letterSpacing:"0.1em", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
                }}>
                  <FiPlus size={18}/> ADD MORE OT DAYS
                </button>
              </div>

              {/* ROW D: Salary input + action buttons */}
              <div className="salary-action-grid">
                <div style={panel}>
                  <label style={{...lbl,fontSize:"18px"}}>Monthly Salary (₹)</label>
                  <input type="number" value={salary} onChange={e=>setSalary(e.target.value)}
                    placeholder="e.g. 25000"
                    style={{...inp, fontSize:"19px", padding:"12px 14px", letterSpacing:"0.06em"}}/>
                </div>
                <div className="salary-action-btns" style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  <button onClick={calculate} className="ckey" style={{...calcKey("primary"),whiteSpace:"nowrap",fontSize:"20px"}}>▶ CALC</button>
                  <button onClick={reset} className="ckey" style={{...calcKey("reset"),whiteSpace:"nowrap",fontSize:"15px"}}>↺ RESET</button>
                </div>
              </div>
            </div>

            {/* ══ RIGHT PANEL — RESULTS ══ */}
            <div className="main-card" style={{ ...card, padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
              <Bolt pos={{top:"8px",left:"8px"}} />
              <Bolt pos={{top:"8px",right:"8px"}} />
              <Bolt pos={{bottom:"8px",left:"8px"}} />
              <Bolt pos={{bottom:"8px",right:"8px"}} />

              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"18px", letterSpacing:"0.22em", color:C.textMuted, textTransform:"uppercase", marginBottom:"4px" }}>Calculation Results</div>
                <div style={{ width:"44px", height:"2px", background:C.border, margin:"0 auto" }}/>
              </div>

              {/* LED Net Salary display */}
              <div style={{
                background:C.displayBg, border:`3px solid ${C.border}`,
                borderRadius:"5px", padding:"16px", textAlign:"center",
                boxShadow:`inset 0 4px 12px rgba(0,0,0,0.7), 0 0 ${result?"18px 2px":"0"} ${C.segGlow}, 3px 3px 0 ${C.btnShadow}`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", inset:0, pointerEvents:"none",
                  background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 3px)" }}/>
                <div style={{ fontSize:"14px", letterSpacing:"0.22em", color:C.displayTxt, marginBottom:"3px", textTransform:"uppercase" }}>
                  <FaAward style={{display:"inline",marginRight:"5px",color:C.displayTxt}} size={11}/>
                  Total Net Salary
                </div>
                <div style={{
                  fontSize:"clamp(28px,3.5vw,46px)", fontWeight:700, letterSpacing:"0.06em",
                  color:C.displayTxt,
                  textShadow:result?`0 0 10px ${C.displayTxt},0 0 28px rgba(100,255,120,0.25)`:"none",
                  transition:"text-shadow 0.3s", lineHeight:1.1, marginBottom:"6px",
                }}>
                  {result ? `₹${result.netSalary.toLocaleString()}` : "-- -- --"}
                </div>
                {result ? (
                  <>
                    <div style={{ display:"flex", justifyContent:"center", gap:"16px", fontSize:"13px", color:C.displayTxt, opacity:0.75, flexWrap:"wrap" }}>
                      <span><FiBriefcase size={12} style={{display:"inline",marginRight:"3px"}}/>Your Basic Salary: ₹{result.inHand.toLocaleString()}</span>
                      {result.otBreakdown?.length>0 && <>
                        <span>+</span>
                        <span><FiClock size={12} style={{display:"inline",marginRight:"3px"}}/>Your Total OT: ₹{Math.round(result.totalOtAmount).toLocaleString()}</span>
                      </>}
                    </div>
                    <div style={{ marginTop:"4px", fontSize:"14px", color:C.textMuted, letterSpacing:"0.05em" }}>
                      {result.isFullMonth
                        ? `${result.effectiveMinutes?.toLocaleString()} effective minutes`
                        : `${result.totalDays} days · ${result.baseWorkingDays} working`}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:"14px", color:C.textMuted, letterSpacing:"0.1em" }}>PRESS CALCULATE</div>
                )}
              </div>

              {/* 2×2 result grid */}
              <div className="result-grid">

                {/* Days info */}
                <div style={panel}>
                  <div style={secHead}>Days Info</div>
                  <Row label="Period" value={periodDisplay()}/>
                  <Row label="Type" value={result?(result.isFullMonth?"Full Month":"Partial"):(isThisMonth||isFullMonth?"Full Month":"Partial")}/>
                  <Row label="Total" value={result?`${result.totalDays}d`:"--"}/>
                  <Row label="Sundays" value={result?`${result.sundays}d`:"--"}/>
                  <Row label="Working" value={result?`${result.baseWorkingDays}d`:"--"} bold last/>
                </div>

                {/* Salary breakdown */}
                <div style={panel}>
                  <div style={secHead}>Breakdown</div>
                  <Row label="Base" value={result?`₹${result.baseSalary.toLocaleString()}`:"--"}/>
                  <Row label="Base Mins" value={result?`${result.baseMinutes.toLocaleString()}`:"--"}/>
                  <Row label="₹/min" value={result?`₹${result.perMinuteRate}`:"--"}/>
                  {result?.isCustomRange&&!result?.isFullMonth&&<>
                    <Row label="Prop Base" value={result?`₹${result.proportionalBase.toLocaleString()}`:"--"}/>
                    <Row label="Deduction" value={result?`-₹${result.deduction.toLocaleString()}`:"--"} color={C.red}/>
                  </>}
                  <Row label="In-Hand" value={result?`₹${result.inHand.toLocaleString()}`:"--"} color={C.displayTxt} bold last/>
                </div>

                {/* Leave details */}
                {(isThisMonth||isFullMonth) && (
                  <div style={panel}>
                    <div style={secHead}>Leave Details</div>
                    <Row label="Paid Used" value={result?`${result.usedPaidMinutes}m`:"--"}/>
                    <Row label="Extra" value={result?`-${result.extraMinutes}m`:"--"} color={C.red}/>
                    <Row label="Unused PL" value={result?`+${result.unusedPaidDays}d`:"--"} color={C.green}/>
                    <Row label="Mode" value={result?`${result.calculationMode}-based`:"--"} last/>
                  </div>
                )}

                {/* OT summary */}
                <div style={panel}>
                  <div style={secHead}>OT Summary</div>
                  <Row label="OT Minutes" value={result?`${result.totalOtMinutes.toFixed(1)}m`:"--"}/>
                  <Row label="OT Hours" value={result?`${(result.totalOtMinutes/60).toFixed(2)}h`:"--"}/>
                  <Row label="OT %" value={result?`${result.totalOtPercent.toFixed(3)}%`:"--"}/>
                  <Row label="OT Amount" value={result?`₹${Math.round(result.totalOtAmount).toLocaleString()}`:"--"} color={C.green} bold last/>
                </div>
              </div>

              {/* Date-wise OT breakdown */}
              {result?.otBreakdown?.length>0 && (
                <div style={panel}>
                  <div style={secHead}><FiCalendar size={10} style={{display:"inline",marginRight:"5px"}}/>Date-wise OT</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    {result.otBreakdown.map((ot,i)=>(
                      <div key={i} className="ot-summary-row" style={{
                        background:C.insetBg, border:`1px solid ${C.borderDk}`,
                        borderRadius:"3px", padding:"8px 10px",
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        flexWrap:"wrap", gap:"6px",
                      }}>
                        <div>
                          <span style={{ fontSize:"13px", fontWeight:700, color:C.text }}>
                            {new Date(ot.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                          </span>
                          <span style={{ marginLeft:"10px", fontSize:"12px", color:C.textSub }}>
                            <FiClock size={10} style={{display:"inline",marginRight:"2px"}}/>
                            {Math.floor(ot.totalMinutes/60)}h {Math.floor(ot.totalMinutes%60)}m
                          </span>
                        </div>
                        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                          <span style={{ fontSize:"12px", color:C.displayTxt, fontWeight:700 }}>{ot.percent.toFixed(3)}%</span>
                          <span style={{ fontSize:"13px", color:C.green, fontWeight:700 }}>₹{Math.round(ot.wage).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign:"center", marginTop:"16px", fontSize:"11px", color:C.textMuted, letterSpacing:"0.18em" }}>
            ● BUILT BY KRISH ● SALARY CALCULATOR ● *Terms of {new Date().getFullYear()} Used ●
          </div>
        </div>
      </div>
    </>
  );
}