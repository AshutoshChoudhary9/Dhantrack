'use strict';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CORS    = 'https://corsproxy.io/?';
const LS_KEY  = 'dhantrack_v1';
const POPULAR = ['RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','ITC','SBIN',
                 'BAJFINANCE','COALINDIA','NTPC','ONGC','HINDUNILVR','MARUTI','SUNPHARMA','HCLTECH'];

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
const SEED_PRICES = {
  RELIANCE:2945,TCS:3987,INFY:1756,HDFCBANK:1623,ICICIBANK:1245,
  WIPRO:478,HINDUNILVR:2389,ITC:468,SBIN:812,BAJFINANCE:7234,
  AXISBANK:1189,KOTAKBANK:1876,LT:3654,MARUTI:12450,TATAMOTORS:978,
  SUNPHARMA:1678,ONGC:278,NTPC:389,POWERGRID:328,COALINDIA:489,
  TITAN:3456,NESTLEIND:24560,HCLTECH:1567,TECHM:1234,DRREDDY:6789,
  CIPLA:1543,BAJAJFINSV:1876,JSWSTEEL:978,TATASTEEL:167,HINDALCO:678,
  IDEA:10,TATACHEM:1050,WIPRO:478,ADANIPORTS:1234,
};

const DIVIDEND_DATA = {
  RELIANCE: {yield:0.35,nextDate:'2025-07-15',lastPaid:'2024-07-15',amount:10.00,status:'upcoming'},
  TCS:      {yield:1.81,nextDate:'2025-04-10',lastPaid:'2024-10-10',amount:72.00,status:'upcoming'},
  INFY:     {yield:2.61,nextDate:'2025-06-01',lastPaid:'2024-10-25',amount:21.00,status:'paid'},
  HDFCBANK: {yield:1.23,nextDate:'2025-05-20',lastPaid:'2024-05-20',amount:19.50,status:'upcoming'},
  ICICIBANK:{yield:0.81,nextDate:'2025-08-01',lastPaid:'2024-08-01',amount:10.00,status:'upcoming'},
  ITC:      {yield:3.42,nextDate:'2025-07-20',lastPaid:'2024-07-20',amount:7.75, status:'upcoming'},
  SBIN:     {yield:1.97,nextDate:'2025-06-15',lastPaid:'2024-06-15',amount:15.90,status:'upcoming'},
  COALINDIA:{yield:6.54,nextDate:'2025-03-20',lastPaid:'2024-11-15',amount:15.75,status:'paid'},
  ONGC:     {yield:5.32,nextDate:'2025-08-10',lastPaid:'2024-08-10',amount:12.75,status:'upcoming'},
  NTPC:     {yield:2.89,nextDate:'2025-03-05',lastPaid:'2024-11-05',amount:3.25, status:'paid'},
  POWERGRID:{yield:3.76,nextDate:'2025-09-01',lastPaid:'2024-09-01',amount:7.00, status:'upcoming'},
  HINDUNILVR:{yield:1.89,nextDate:'2025-06-30',lastPaid:'2024-06-30',amount:24.00,status:'upcoming'},
  WIPRO:    {yield:0.21,nextDate:'2025-07-10',lastPaid:'2024-07-10',amount:1.00, status:'upcoming'},
  HCLTECH:  {yield:3.19,nextDate:'2025-04-20',lastPaid:'2024-10-20',amount:18.00,status:'upcoming'},
  BAJFINANCE:{yield:0.14,nextDate:'2025-07-01',lastPaid:'2024-07-01',amount:36.00,status:'upcoming'},
  DRREDDY:  {yield:0.74,nextDate:'2025-07-20',lastPaid:'2024-07-20',amount:25.00,status:'upcoming'},
};

const SECTOR_MAP = {
  RELIANCE:'Energy',TCS:'IT',INFY:'IT',HDFCBANK:'Banking',ICICIBANK:'Banking',
  WIPRO:'IT',HINDUNILVR:'FMCG',ITC:'FMCG',SBIN:'Banking',BAJFINANCE:'Finance',
  AXISBANK:'Banking',KOTAKBANK:'Banking',LT:'Infra',MARUTI:'Auto',TATAMOTORS:'Auto',
  SUNPHARMA:'Pharma',ONGC:'Oil & Gas',NTPC:'Power',POWERGRID:'Power',COALINDIA:'Mining',
  TITAN:'Consumer',NESTLEIND:'FMCG',HCLTECH:'IT',TECHM:'IT',DRREDDY:'Pharma',
  CIPLA:'Pharma',BAJAJFINSV:'Finance',JSWSTEEL:'Metal',TATASTEEL:'Metal',HINDALCO:'Metal',
};

const SECTOR_COLORS = {
  IT:'#7c6af7',Banking:'#00d4aa',FMCG:'#f7b731',Energy:'#fc5c65',
  Finance:'#45aaf2',Pharma:'#26de81',Auto:'#ff6b35',Power:'#ffd166',
  Mining:'#a8d8ea',Infra:'#8892a4',Consumer:'#e67e22','Oil & Gas':'#fd9644',Metal:'#778ca3',
};

const ACC_COLORS = ['#00d4aa','#7c6af7','#f7b731','#fc5c65','#45aaf2','#26de81'];

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_ACCOUNTS = [
  {id:1,name:'Zerodha',color:'#00d4aa'},
  {id:2,name:'Groww',  color:'#7c6af7'},
];
const DEFAULT_HOLDINGS = [
  {id:1,accountId:1,symbol:'RELIANCE', shares:20, entryPrice:2750},
  {id:2,accountId:1,symbol:'TCS',      shares:10, entryPrice:3650},
  {id:3,accountId:1,symbol:'INFY',     shares:30, entryPrice:1580},
  {id:4,accountId:1,symbol:'ITC',      shares:200,entryPrice:430},
  {id:5,accountId:2,symbol:'COALINDIA',shares:100,entryPrice:450},
  {id:6,accountId:2,symbol:'HDFCBANK', shares:25, entryPrice:1550},
  {id:7,accountId:2,symbol:'NTPC',     shares:150,entryPrice:350},
];

// ─── STATE ────────────────────────────────────────────────────────────────────
// accounts and holdings are NULL until init() sets them from localStorage or defaults
const state = {
  accounts:      null,
  holdings:      null,
  prices:        {},
  srcStatus:     {},
  activeAccount: 'all',
  activeTab:     'portfolio',
  alphaKey:      '',
  fetching:      false,
  lastUpdated:   null,
  apiLabel:      '—',
};

// ─── STORAGE: SAVE ────────────────────────────────────────────────────────────
function save() {
  // Hard guard: never save if real data hasn't been loaded yet
  if (!Array.isArray(state.accounts) || !Array.isArray(state.holdings)) {
    console.warn('[DhanTrack] save() blocked — state not ready yet');
    return;
  }
  const payload = {
    v:        2,
    savedAt:  new Date().toISOString(),
    accounts: state.accounts,
    holdings: state.holdings,
    alphaKey: state.alphaKey,
  };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    console.log('[DhanTrack] 💾 Saved —', state.holdings.length, 'holdings');
  } catch(e) {
    console.error('[DhanTrack] ❌ Save FAILED:', e.message);
    showToast('⚠️ Save failed: ' + e.message, 'red');
  }
}

// ─── STORAGE: LOAD ────────────────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { console.log('[DhanTrack] No saved data found'); return null; }
    const d = JSON.parse(raw);
    if (!Array.isArray(d.accounts) || !Array.isArray(d.holdings)) { console.warn('[DhanTrack] Saved data invalid'); return null; }
    console.log('[DhanTrack] 📂 Loaded —', d.holdings.length, 'holdings from', d.savedAt);
    return d;
  } catch(e) {
    console.error('[DhanTrack] ❌ Load FAILED:', e.message);
    return null;
  }
}

// ─── STORAGE: CLEAR ───────────────────────────────────────────────────────────
function clearSaved() {
  localStorage.removeItem(LS_KEY);
  console.log('[DhanTrack] Storage cleared');
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
const fmt  = v => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v);
const fmtP = v => `${v>=0?'+':''}${v.toFixed(2)}%`;
const getP = sym => state.prices[sym]?.price ?? SEED_PRICES[sym] ?? 0;

// ─── MARKET HOURS ─────────────────────────────────────────────────────────────
function isMarketOpen() {
  const ist = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
  const d=ist.getDay(), m=ist.getHours()*60+ist.getMinutes();
  return d>=1&&d<=5&&m>=555&&m<=930;
}

// ─── API: FETCH PRICE ─────────────────────────────────────────────────────────
async function fetchPrice(symbol) {
  try {
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?interval=1m&range=1d`;
    const res=await fetch(`${CORS}${encodeURIComponent(url)}`,{signal:AbortSignal.timeout(6000)});
    if(!res.ok) throw new Error('Yahoo HTTP '+res.status);
    const data=await res.json();
    const price=data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if(price&&price>0) return {price:+price.toFixed(2),source:'Yahoo'};
    throw new Error('No price in response');
  } catch(e) {
    console.warn(`[Yahoo] ${symbol}:`,e.message);
  }
  if(!state.alphaKey) return null;
  try {
    const url=`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}.BSE&apikey=${state.alphaKey}`;
    const res=await fetch(`${CORS}${encodeURIComponent(url)}`,{signal:AbortSignal.timeout(8000)});
    if(!res.ok) throw new Error('Alpha HTTP '+res.status);
    const data=await res.json();
    const price=parseFloat(data?.['Global Quote']?.['05. price']);
    if(price&&price>0) return {price:+price.toFixed(2),source:'Alpha'};
    throw new Error('No price in Alpha response');
  } catch(e) {
    console.warn(`[Alpha] ${symbol}:`,e.message);
  }
  return null;
}

let isFetching=false;
async function refreshPrices() {
  if(isFetching) return;
  isFetching=true; state.fetching=true; updateHeader();
  const syms=[...new Set(state.holdings.map(h=>h.symbol))];
  syms.forEach(s=>{state.srcStatus[s]='loading';});
  renderHoldings();
  let yahoo=0,alpha=0;
  for(let i=0;i<syms.length;i++){
    const r=await fetchPrice(syms[i]);
    if(r){
      state.prices[syms[i]]=r;
      state.srcStatus[syms[i]]=r.source==='Yahoo'?'yahoo':'alpha';
      r.source==='Yahoo'?yahoo++:alpha++;
    } else { state.srcStatus[syms[i]]='cached'; }
    renderHoldings();
    if(i<syms.length-1) await new Promise(r=>setTimeout(r,300));
  }
  if(yahoo>0&&alpha===0)      state.apiLabel=`Yahoo Finance (${yahoo} stocks)`;
  else if(alpha>0&&yahoo===0) state.apiLabel=`Alpha Vantage (${alpha} stocks)`;
  else if(yahoo>0&&alpha>0)   state.apiLabel=`Yahoo(${yahoo})+Alpha(${alpha})`;
  else                        state.apiLabel='Cached prices';
  state.lastUpdated=new Date();
  state.fetching=false; isFetching=false;
  updateHeader();
  // After price fetch, do a full render but DO NOT save prices to storage
  renderSummary(); renderDividends(); renderSectors(); renderAccSummary(); renderAccountTabs();
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg,type='green') {
  document.getElementById('dhantrack-toast')?.remove();
  const t=document.createElement('div');
  t.id='dhantrack-toast';
  t.textContent=msg;
  t.style.cssText=`position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${type==='green'?'#0c2a20':'#2a0c12'};
    color:${type==='green'?'#00d4aa':'#fc5c65'};
    border:1px solid ${type==='green'?'#00d4aa55':'#fc5c6555'};
    padding:12px 20px;border-radius:10px;font-family:monospace;font-size:13px;
    box-shadow:0 4px 20px rgba(0,0,0,0.5);animation:slideUp 0.3s ease;`;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

// ─── EXPORT / IMPORT ──────────────────────────────────────────────────────────
function exportData() {
  const data={version:2,exportedAt:new Date().toISOString(),accounts:state.accounts,holdings:state.holdings,alphaKey:state.alphaKey};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=`dhantrack_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('✅ Exported successfully!','green');
}

function importData(file) {
  const reader=new FileReader();
  reader.onload=e=>{
    try {
      const d=JSON.parse(e.target.result);
      if(!d.accounts||!d.holdings) throw new Error('Invalid format');
      state.accounts=d.accounts; state.holdings=d.holdings; state.alphaKey=d.alphaKey||'';
      save(); renderAll(); refreshPrices();
      showToast('✅ Imported successfully!','green');
    } catch(err) { showToast('❌ Import failed: '+err.message,'red'); }
  };
  reader.readAsText(file);
}

// ─── DERIVED ──────────────────────────────────────────────────────────────────
function getFiltered() {
  if(!state.holdings) return [];
  return state.activeAccount==='all' ? state.holdings : state.holdings.filter(h=>h.accountId===state.activeAccount);
}

function enrich(h) {
  const cp=getP(h.symbol), cost=h.shares*h.entryPrice, val=h.shares*cp;
  return {...h,cp,cost,val,pnl:val-cost,pnlPct:((cp-h.entryPrice)/h.entryPrice)*100,
    div:DIVIDEND_DATA[h.symbol]||null,sector:SECTOR_MAP[h.symbol]||'Other',
    acc:state.accounts.find(a=>a.id===h.accountId),srcKey:state.srcStatus[h.symbol]||'cached'};
}

function totals(rows) {
  const cost=rows.reduce((s,h)=>s+h.cost,0), val=rows.reduce((s,h)=>s+h.val,0);
  return {cost,val,pnl:val-cost,pnlPct:cost>0?(val-cost)/cost*100:0};
}

// ─── BADGE HELPERS ────────────────────────────────────────────────────────────
const BADGE={yahoo:{cls:'src-yahoo',lbl:'● YAHOO'},alpha:{cls:'src-alpha',lbl:'● ALPHA'},loading:{cls:'src-loading',lbl:'⟳ …'},cached:{cls:'src-cached',lbl:'◌ CACHED'}};
const badge=k=>BADGE[k]||BADGE.cached;
const pnlChip=(v,p)=>`<span class="pnl-chip ${v>=0?'profit-bg':'loss-bg'}">${fmtP(p)}</span>`;

// ─── RENDER: HEADER ───────────────────────────────────────────────────────────
function updateHeader() {
  const dot=document.getElementById('status-dot');
  const lbl=document.getElementById('api-label');
  const tim=document.getElementById('status-time');
  const btn=document.getElementById('btn-refresh');
  if(state.fetching){
    dot.textContent='⟳'; dot.className='spin'; dot.style.color='#f7b731';
    lbl.textContent='Fetching…'; btn.disabled=true; btn.textContent='⟳';
  } else {
    dot.textContent='●'; dot.className='dot pulse'; dot.style.color='#00d4aa';
    lbl.textContent=state.apiLabel; btn.disabled=false; btn.textContent='↻ REFRESH';
    if(state.lastUpdated) tim.textContent='· '+state.lastUpdated.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata'})+' IST';
  }
  const mp=document.getElementById('market-pill');
  mp.textContent=isMarketOpen()?'🟢 NSE OPEN':'🔴 MARKET CLOSED';
  mp.className='market-pill '+(isMarketOpen()?'market-open':'market-closed');
}

// ─── RENDER: ACCOUNT TABS ─────────────────────────────────────────────────────
function renderAccountTabs() {
  const bar=document.getElementById('account-bar');
  bar.querySelectorAll('[data-acc-dynamic]').forEach(el=>el.remove());
  const addBtn=document.getElementById('btn-add-account');
  state.accounts.forEach(acc=>{
    const rows=state.holdings.filter(h=>h.accountId===acc.id);
    const cost=rows.reduce((s,h)=>s+h.shares*h.entryPrice,0);
    const val =rows.reduce((s,h)=>s+h.shares*getP(h.symbol),0);
    const pct =cost>0?(val-cost)/cost*100:0;
    const btn=document.createElement('button');
    btn.className='tab'+(state.activeAccount===acc.id?' on':'');
    btn.setAttribute('data-acc',acc.id); btn.setAttribute('data-acc-dynamic','');
    btn.style.borderColor=state.activeAccount===acc.id?acc.color+'88':'';
    btn.innerHTML=`<span class="acc-dot" style="background:${acc.color}"></span> ${acc.name} <span class="${pct>=0?'profit':'loss'}" style="margin-left:6px;font-size:11px">${fmtP(pct)}</span>`;
    btn.addEventListener('click',()=>{state.activeAccount=acc.id; renderAll();});
    bar.insertBefore(btn,addBtn);
  });
  const allTab=bar.querySelector('[data-acc="all"]');
  if(allTab) allTab.className='tab'+(state.activeAccount==='all'?' on':'');
}

// ─── RENDER: SUMMARY ──────────────────────────────────────────────────────────
function renderSummary() {
  const rows=getFiltered().map(enrich);
  const {cost,val,pnl,pnlPct}=totals(rows);
  const divH=rows.filter(h=>h.div?.yield>0);
  const annDiv=divH.reduce((s,h)=>s+h.val*(h.div.yield/100),0);
  document.getElementById('sv-value').textContent=fmt(val);
  document.getElementById('sv-sub').textContent=`Invested: ${fmt(cost)}`;
  const svPnL=document.getElementById('sv-pnl');
  svPnL.textContent=fmt(pnl); svPnL.className='card-value '+(pnl>=0?'profit':'loss');
  const svPct=document.getElementById('sv-pnl-pct');
  svPct.textContent=fmtP(pnlPct); svPct.className='card-sub '+(pnl>=0?'profit':'loss');
  document.getElementById('card-pnl').querySelector('.card-icon').textContent=pnl>=0?'📈':'📉';
  document.getElementById('sv-div').textContent=fmt(annDiv);
  document.getElementById('sv-div-sub').textContent=`From ${divH.length} stocks`;
  document.getElementById('sv-pos').textContent=getFiltered().length;
  document.getElementById('sv-pos-sub').textContent=`${rows.filter(h=>h.pnl>=0).length} profitable`;
}

// ─── RENDER: HOLDINGS ─────────────────────────────────────────────────────────
function renderHoldings() {
  const tbody=document.getElementById('holdings-tbody');
  const tfoot=document.getElementById('holdings-tfoot');
  const rows=getFiltered().map(enrich);
  if(!rows.length){
    tbody.innerHTML=`<tr><td colspan="11" style="padding:40px;text-align:center;color:var(--muted)">No holdings. Add your first position!</td></tr>`;
    tfoot.innerHTML=''; return;
  }
  tbody.innerHTML=rows.map(h=>`
    <tr>
      <td><div class="sym-name">${h.symbol}</div><div class="sym-sub">${h.sector} · NSE</div>${h.div?.yield>0?`<div class="sym-div">★ DIV ${h.div.yield}%</div>`:''}</td>
      <td><span class="acc-cell"><span class="acc-dot" style="background:${h.acc?.color||'#4a5568'}"></span>${h.acc?.name||'—'}</span></td>
      <td style="color:var(--muted2)">${h.shares}</td>
      <td style="color:var(--muted2);white-space:nowrap">₹${h.entryPrice.toLocaleString('en-IN')}</td>
      <td style="color:var(--text);font-weight:600;white-space:nowrap">₹${h.cp.toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
      <td><span class="src-badge ${badge(h.srcKey).cls}">${badge(h.srcKey).lbl}</span></td>
      <td style="color:var(--muted2);white-space:nowrap">${fmt(h.cost)}</td>
      <td style="color:var(--text);white-space:nowrap">${fmt(h.val)}</td>
      <td style="white-space:nowrap"><span class="${h.pnl>=0?'profit':'loss'}" style="font-weight:600">${fmt(h.pnl)}</span></td>
      <td>${pnlChip(h.pnl,h.pnlPct)}</td>
      <td><button class="btn btn-danger" data-remove="${h.id}">✕</button></td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=parseInt(btn.getAttribute('data-remove'));
      state.holdings=state.holdings.filter(h=>h.id!==id);
      save();
      renderAll();
      showToast('🗑 Holding removed','green');
    });
  });
  const {cost,val,pnl,pnlPct}=totals(rows);
  tfoot.innerHTML=`<tr>
    <td class="foot-label" colspan="6">TOTAL PORTFOLIO</td>
    <td class="foot-val">${fmt(cost)}</td><td class="foot-val">${fmt(val)}</td>
    <td class="foot-pnl"><span class="${pnl>=0?'profit':'loss'}">${fmt(pnl)}</span></td>
    <td class="foot-pct">${pnlChip(pnl,pnlPct)}</td><td></td></tr>`;
}

// ─── RENDER: DIVIDENDS ────────────────────────────────────────────────────────
function renderDividends() {
  const rows=getFiltered().map(enrich);
  const divH=rows.filter(h=>h.div?.yield>0);
  const ann=divH.reduce((s,h)=>s+h.val*(h.div.yield/100),0);
  document.getElementById('div-annual').textContent=fmt(ann);
  document.getElementById('div-monthly').textContent=fmt(ann/12);
  document.getElementById('div-count').textContent=`${divH.length}/${getFiltered().length}`;
  const tbody=document.getElementById('div-tbody');
  tbody.innerHTML=divH.length===0
    ?`<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--muted)">No dividend stocks.</td></tr>`
    :divH.map(h=>`<tr>
      <td><div class="sym-name">${h.symbol}</div><div class="sym-sub">${h.sector}</div></td>
      <td style="color:var(--muted2)">${h.shares}</td>
      <td style="color:var(--yellow)">₹${h.div.amount.toFixed(2)}</td>
      <td><span class="yield-chip">${h.div.yield}%</span></td>
      <td style="color:var(--green);font-weight:600;white-space:nowrap">${fmt(h.val*(h.div.yield/100))}</td>
      <td style="color:var(--muted2)">${h.div.nextDate||'—'}</td>
      <td>${h.div.status==='paid'?'<span class="tag tag-paid">✓ Paid</span>':'<span class="tag tag-up">⏳ Upcoming</span>'}</td>
    </tr>`).join('');
}

// ─── RENDER: SECTORS ──────────────────────────────────────────────────────────
function renderSectors() {
  const rows=getFiltered().map(enrich);
  const totVal=rows.reduce((s,h)=>s+h.val,0);
  const sec={};
  rows.forEach(h=>{sec[h.sector]=(sec[h.sector]||0)+h.val;});
  const grid=document.getElementById('sectors-grid');
  if(!Object.keys(sec).length){grid.innerHTML=`<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--muted)">Add holdings to see sector breakdown.</div>`;return;}
  grid.innerHTML=Object.entries(sec).sort((a,b)=>b[1]-a[1]).map(([s,v])=>{
    const color=SECTOR_COLORS[s]||'#4a5568', share=totVal>0?(v/totVal)*100:0;
    return `<div class="card sector-card" style="border-left-color:${color}">
      <div class="sector-name">${s.toUpperCase()}</div>
      <div class="sector-val">${fmt(v)}</div>
      <div class="sector-bar-wrap"><div class="sector-bar" style="width:${share.toFixed(1)}%;background:${color}"></div></div>
      <div class="sector-pct" style="color:${color}">${share.toFixed(1)}% of portfolio</div>
    </div>`;
  }).join('');
}

// ─── RENDER: ACCOUNT SUMMARY ──────────────────────────────────────────────────
function renderAccSummary() {
  const grid=document.getElementById('acc-summary-grid');
  if(state.activeAccount!=='all'){grid.innerHTML='';return;}
  grid.innerHTML=state.accounts.map(acc=>{
    const rows=state.holdings.filter(h=>h.accountId===acc.id);
    const cost=rows.reduce((s,h)=>s+h.shares*h.entryPrice,0);
    const val =rows.reduce((s,h)=>s+h.shares*getP(h.symbol),0);
    const pnl=val-cost, pct=cost>0?(val-cost)/cost*100:0;
    return `<div class="card acc-card" style="border-left-color:${acc.color}">
      <div class="acc-card-header"><span class="acc-card-name">${acc.name}</span>
      <span class="pnl-chip ${pnl>=0?'profit-bg':'loss-bg'}">${fmtP(pct)}</span></div>
      <div class="acc-card-grid">
        <div><div class="acc-stat-label">VALUE</div><div class="acc-stat-value">${fmt(val)}</div></div>
        <div><div class="acc-stat-label">P&L</div><div class="acc-stat-value ${pnl>=0?'profit':'loss'}">${fmt(pnl)}</div></div>
      </div></div>`;
  }).join('');
}

// ─── RENDER: SYMBOL STATUS ────────────────────────────────────────────────────
function renderSymbolStatus() {
  const grid=document.getElementById('symbol-status-grid');
  const entries=Object.entries(state.srcStatus);
  if(!entries.length){grid.innerHTML=`<span class="muted-text">Press Refresh to fetch prices</span>`;return;}
  grid.innerHTML=entries.map(([sym,st])=>{
    const b=badge(st);
    return `<span class="sym-status-chip src-badge ${b.cls}">${sym}: ${b.lbl.replace('●','').replace('⟳','').trim()}</span>`;
  }).join('');
}

// ─── RENDER: ALL ──────────────────────────────────────────────────────────────
function renderAll() {
  // Save ONLY if real data is loaded (not null)
  if(Array.isArray(state.holdings) && Array.isArray(state.accounts)) {
    save();
  }
  updateHeader();
  renderAccountTabs();
  renderSummary();
  renderHoldings();
  renderDividends();
  renderSectors();
  renderAccSummary();
  renderSymbolStatus();
}

// Save before tab closes
window.addEventListener('beforeunload', ()=>{
  if(Array.isArray(state.holdings)) save();
});

// ─── PANEL SWITCH ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  state.activeTab=tab;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-tab')===tab));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${tab}`));
}

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────
const openModal =id=>document.getElementById(id).classList.add('open');
const closeModal=id=>document.getElementById(id).classList.remove('open');
document.querySelectorAll('.overlay').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.remove('open');}));

// ─── ADD HOLDING ──────────────────────────────────────────────────────────────
document.getElementById('btn-add-holding').addEventListener('click',()=>{
  const sel=document.getElementById('new-h-account');
  sel.innerHTML=state.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  const chips=document.getElementById('quick-chips');
  chips.innerHTML=POPULAR.slice(0,8).map(s=>`<button class="quick-chip" data-sym="${s}">${s}</button>`).join('');
  chips.querySelectorAll('.quick-chip').forEach(b=>b.addEventListener('click',()=>{document.getElementById('new-h-symbol').value=b.getAttribute('data-sym');}));
  document.getElementById('new-h-symbol').value='';
  document.getElementById('new-h-shares').value='';
  document.getElementById('new-h-price').value='';
  openModal('modal-add-holding');
});

document.getElementById('cancel-add-holding').addEventListener('click',()=>closeModal('modal-add-holding'));

document.getElementById('confirm-add-holding').addEventListener('click',()=>{
  const accId=parseInt(document.getElementById('new-h-account').value);
  const sym=document.getElementById('new-h-symbol').value.trim().toUpperCase();
  const shares=parseFloat(document.getElementById('new-h-shares').value);
  const price=parseFloat(document.getElementById('new-h-price').value);
  if(!sym||!shares||!price){alert('Please fill in all fields.');return;}
  state.holdings.push({id:Date.now(),accountId:accId,symbol:sym,shares,entryPrice:price});
  if(SEED_PRICES[sym]&&!state.prices[sym]){
    state.prices[sym]={price:SEED_PRICES[sym],source:'Cached'};
    state.srcStatus[sym]='cached';
  }
  save();                         // ← save immediately
  closeModal('modal-add-holding');
  renderAll();
  showToast(`✅ ${sym} added & saved!`,'green');
});

// ─── ADD ACCOUNT ──────────────────────────────────────────────────────────────
document.getElementById('btn-add-account').addEventListener('click',()=>{
  document.getElementById('new-acc-name').value='';
  openModal('modal-add-account');
});
document.getElementById('cancel-add-account').addEventListener('click',()=>closeModal('modal-add-account'));
document.getElementById('confirm-add-account').addEventListener('click',()=>{
  const name=document.getElementById('new-acc-name').value.trim();
  if(!name) return;
  state.accounts.push({id:Date.now(),name,color:ACC_COLORS[state.accounts.length%ACC_COLORS.length]});
  save();                         // ← save immediately
  closeModal('modal-add-account');
  renderAll();
  showToast(`✅ Account "${name}" saved!`,'green');
});
document.getElementById('new-acc-name').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('confirm-add-account').click();});

// ─── ACCOUNT TAB ALL ──────────────────────────────────────────────────────────
document.querySelector('[data-acc="all"]').addEventListener('click',()=>{state.activeAccount='all';renderAll();});

// ─── FEATURE TABS ─────────────────────────────────────────────────────────────
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.getAttribute('data-tab'))));

// ─── REFRESH ──────────────────────────────────────────────────────────────────
document.getElementById('btn-refresh').addEventListener('click',refreshPrices);

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
document.getElementById('btn-settings').addEventListener('click',()=>{
  document.getElementById('alpha-key-input').value=state.alphaKey;
  renderSymbolStatus();
  openModal('modal-settings');
});
document.getElementById('close-settings').addEventListener('click',()=>{
  state.alphaKey=document.getElementById('alpha-key-input').value.trim();
  closeModal('modal-settings');
});
document.getElementById('settings-refresh').addEventListener('click',()=>{
  state.alphaKey=document.getElementById('alpha-key-input').value.trim();
  closeModal('modal-settings');
  refreshPrices();
});

// ─── EXPORT / IMPORT ──────────────────────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click',exportData);
document.getElementById('btn-import').addEventListener('click',()=>document.getElementById('import-file-input').click());
document.getElementById('import-file-input').addEventListener('change',e=>{
  const file=e.target.files[0]; if(file) importData(file); e.target.value='';
});

// ─── CLEAR DATA ───────────────────────────────────────────────────────────────
document.getElementById('btn-clear-data').addEventListener('click',()=>{
  if(confirm('⚠️ Delete ALL holdings and accounts?')){
    state.accounts=JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
    state.holdings=JSON.parse(JSON.stringify(DEFAULT_HOLDINGS));
    state.alphaKey=''; state.prices={}; state.srcStatus={};
    clearSaved(); renderAll(); refreshPrices();
    showToast('🗑 Data cleared','red');
  }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
// THIS RUNS LAST — after all event listeners are attached
function init() {
  console.log('[DhanTrack] Starting...');

  // Load from localStorage FIRST
  const saved = load();

  if (saved && saved.holdings && saved.holdings.length > 0) {
    // Use saved data
    state.accounts = saved.accounts;
    state.holdings = saved.holdings;
    state.alphaKey = saved.alphaKey || '';
    console.log('[DhanTrack] ✅ Restored:', state.holdings.length, 'holdings:', state.holdings.map(h=>h.symbol).join(', '));
    setTimeout(()=>showToast('💾 Portfolio restored!','green'), 500);
  } else {
    // First run — use defaults and save them
    state.accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
    state.holdings = JSON.parse(JSON.stringify(DEFAULT_HOLDINGS));
    state.alphaKey = '';
    console.log('[DhanTrack] First run — saving defaults...');
    save(); // save defaults so next run restores them
  }

  // Seed cached prices
  state.holdings.forEach(h=>{
    if(SEED_PRICES[h.symbol]){
      state.prices[h.symbol]={price:SEED_PRICES[h.symbol],source:'Cached'};
      state.srcStatus[h.symbol]='cached';
    }
  });

  renderAll();
  refreshPrices();
  setInterval(refreshPrices, 60000);
  console.log('[DhanTrack] Ready ✅');
}

document.addEventListener('DOMContentLoaded', init);
