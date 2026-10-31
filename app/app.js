(() => {
  const DATA = window.POLICY_DATA || [];
  const REL = ['Canada–China','Canada–USA','USA–China'];
  const FIELDS = [
    ['Trade, Tariffs & Market Access','#2563eb'],['Defence & Security','#dc2626'],['AI, Technology & Cybersecurity','#7c3aed'],
    ['Vehicles, EVs & Batteries','#0891b2'],['Agriculture & Agri-food','#65a30d'],['Financial Services & Investment','#d97706'],['Energy Exports & Investment','#eab308']
  ];
  const state = { tab:'Executive Summary', field:FIELDS[0][0], mode:'Ask', query:'', results:[], answer:'', selected:null, busy:false, error:'' };
  const root = document.getElementById('app');
  const esc = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const text = x => `${x.r} ${x.f} ${x.n} ${x.y} ${x.t} ${x.s} ${x.d}`.toLowerCase();
  function localSearch(q){
    const phrase=q.trim().toLowerCase(); if(!phrase)return[];
    const terms=phrase.split(/\s+/).filter(Boolean);
    return DATA.map(x=>{let body=text(x),score=body.includes(phrase)?30:0;for(const t of terms) if(body.includes(t)) score+=1;return {...x,score};})
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.y-b.y);
  }
  async function runQuery(){
    const q=document.getElementById('query').value.trim(); state.query=q; state.error='';
    if(!q){state.results=[];state.answer='';render();return;}
    state.busy=true;render();
    try{
      const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,mode:state.mode})});
      if(!r.ok) throw new Error(`API ${r.status}`);
      const payload=await r.json(); state.results=payload.results||[]; state.answer=payload.answer||'';
    }catch(e){
      state.results=localSearch(q);
      state.answer=state.results.length?`I found ${state.results.length} matching indexed policy records. Strongest matches: ${state.results.slice(0,4).map(x=>x.n).join(', ')}.`:'No indexed evidence matched this query.';
      state.error='Backend API unavailable. Showing verified local-index results.';
    }finally{state.busy=false;render();}
  }
  function nav(){return ['Executive Summary',...REL,'Policy Product Map'].map(x=>`<button class="tab ${state.tab===x?'active':''}" data-tab="${esc(x)}">${esc(x)}</button>`).join('')}
  function search(){return `<div class="searchbox"><div class="modes"><button class="pill ${state.mode==='Ask'?'active':''}" data-mode="Ask">Ask agent</button><button class="pill ${state.mode==='Search'?'active':''}" data-mode="Search">Search</button></div><div class="searchrow"><textarea id="query" placeholder="${state.mode==='Ask'?'Ask a question or phrase: How did Canada–China EV policy change after 2024?':'Search exact phrases, words, acronyms, years or policy titles…'}">${esc(state.query)}</textarea><button class="primary" id="go">${state.busy?'Searching…':state.mode}</button></div>${state.query?`<div class="answer"><b>${state.mode==='Ask'?'Agent response':'Search results'}</b>${state.answer?`<p>${esc(state.answer)}</p>`:''}${state.error?`<p class="error">${esc(state.error)}</p>`:''}<div class="results">${state.results.slice(0,20).map((x,i)=>`<button class="result" data-result="${i}"><b>${esc(x.n)}</b><span class="small"> · ${esc(x.r)} · ${esc(x.f)}</span></button>`).join('')}</div></div>`:''}</div>`}
  function executive(){return `<h2>Executive Summary</h2><p>Compare three bilateral relationships through seven common policy fields. Each record includes year, instrument type, status, evidence summary and an external primary-source link.</p><div class="hero-grid">${REL.map(r=>`<button class="card click" data-tab="${esc(r)}"><h3>${esc(r)}</h3><p class="meta">${DATA.filter(x=>x.r===r).length} indexed policy instruments</p><b style="color:#1d4ed8">Explore relationship →</b></button>`).join('')}</div>`}
  function relationship(){const rows=DATA.filter(x=>x.r===state.tab&&x.f===state.field).sort((a,b)=>a.y-b.y);return `<h2>${esc(state.tab)}</h2><div class="field-grid">${FIELDS.map(([f,c])=>`<button class="field ${state.field===f?'active':''}" style="background:${c}" data-field="${esc(f)}">${esc(f)}</button>`).join('')}</div><h2>${esc(state.field)}</h2>${rows.length?`<div class="cards">${rows.map(x=>`<button class="card click" data-id="${DATA.indexOf(x)}"><div class="meta">${x.y} · ${esc(x.t)} · ${esc(x.s)}</div><h3>${esc(x.n)}</h3><p>${esc(x.d)}</p><b style="color:#1d4ed8">Evidence & source →</b></button>`).join('')}</div>`:'<div class="empty">No record is loaded for this cell yet.</div>'}`}
  function productMap(){return `<h2>Structured Policy Product Map</h2><p>Relationship columns × policy-field rows. Records are ordered chronologically within each cell.</p><div class="mapwrap"><div class="matrix"><div></div>${REL.map(r=>`<div class="matrix-head">${esc(r)}</div>`).join('')}${FIELDS.map(([f,c])=>`<div class="matrix-label" style="background:${c}">${esc(f)}</div>${REL.map(r=>`<div class="cell">${DATA.filter(x=>x.r===r&&x.f===f).sort((a,b)=>a.y-b.y).map(x=>`<button class="node" data-id="${DATA.indexOf(x)}"><span class="meta">${x.y}</span><br><b>${esc(x.n)}</b></button>`).join('')}</div>`).join('')}`).join('')}</div></div>`}
  function drawer(){const x=state.selected;if(!x)return'';return `<div class="drawerback" id="back"><aside class="drawer"><button class="close" id="close">← Close</button><h2>${esc(x.n)}</h2><p><span class="badge">${esc(x.r)}</span><span class="badge">${esc(x.f)}</span></p><p><b>Year:</b> ${x.y}</p><p><b>Instrument:</b> ${esc(x.t)}</p><p><b>Status:</b> ${esc(x.s)}</p><h3>Evidence summary</h3><p>${esc(x.d)}</p><a class="source" href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">Open primary source ↗</a><div class="source-list"><small>Direct source link:</small><a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">${esc(x.u)}</a></div></aside></div>`}
  function render(){root.innerHTML=`<header><div class="wrap"><h1 class="title">Canada · U.S. · China Policy Intelligence</h1><p class="sub">Azure Static Web Apps deployment package · 2018–October 30, 2026</p>${search()}</div></header><nav>${nav()}</nav><main>${state.tab==='Executive Summary'?executive():state.tab==='Policy Product Map'?productMap():relationship()}</main>${drawer()}`;bind()}
  function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;state.selected=null;render()});document.querySelectorAll('[data-field]').forEach(b=>b.onclick=()=>{state.field=b.dataset.field;render()});document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;render()});document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{state.selected=DATA[Number(b.dataset.id)];render()});document.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{state.selected=state.results[Number(b.dataset.result)];render()});const go=document.getElementById('go');if(go)go.onclick=runQuery;const q=document.getElementById('query');if(q)q.onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')runQuery()};const close=document.getElementById('close');if(close)close.onclick=()=>{state.selected=null;render()};const back=document.getElementById('back');if(back)back.onclick=e=>{if(e.target===back){state.selected=null;render()}}}
  render();
})();
