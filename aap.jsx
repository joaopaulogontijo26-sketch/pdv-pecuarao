import { useState, useMemo, useRef } from "react";
const fmt=(v)=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
// Polyfill para AbortSignal.timeout (iOS Safari < 16 não tem)
const _timeoutSignal=(ms)=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;};
const LOGO_SRC="https://joaopaulogontijo26-sketch.github.io/pdv-pecuarao/logo.jpg";
const LOJA={nome:"Pecuarão Gontijo",sub:"Depósito & Agropecuária",tel:"(37) 99922-1020",whatsapp:"5537999221020",endereco:"Rua Guarani, 461 - Jardim Candidés",cidade:"Divinópolis/MG"};
const todayStr=()=>new Date().toISOString().slice(0,10);
const nowTime=()=>new Date().toTimeString().slice(0,5);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

// ── BANCO DE DADOS: SERVIDOR É A FONTE ÚNICA DE VERDADE ───────────────────────
// ── SUPABASE DIRETO ──────────────────────────────────────────────────────────
const SUPABASE_URL="https://jyrugkklsacswgysjser.supabase.co";
const _SB_KEY=()=>localStorage.getItem('_sb_key')||sessionStorage.getItem('_sb_key')||"";
const _SB_H=()=>({
  'Content-Type':'application/json',
  'apikey':_SB_KEY(),
  'Authorization':'Bearer '+_SB_KEY(),
  'Prefer':'return=representation'
});

// ── CACHE DE FOTOS (IndexedDB) ────────────────────────────────────────────────
// Armazena fotos localmente — não vai pro servidor, fica no aparelho
const _photoDB={
  _db:null,
  async open(){
    if(this._db) return this._db;
    if(typeof indexedDB==='undefined'||!indexedDB||!window.indexedDB) throw new Error('no idb');
    return new Promise((res,rej)=>{
      try{
        const req=indexedDB.open('pdv_fotos',1);
        req.onupgradeneeded=e=>{try{e.target.result.createObjectStore('fotos',{keyPath:'id'});}catch(_){}};
        req.onsuccess=e=>{this._db=e.target.result;res(this._db);};
        req.onerror=()=>rej(new Error('IndexedDB erro'));
        req.onblocked=()=>rej(new Error('IndexedDB bloqueado'));
      }catch(e){rej(e);}
    });
  },
  async get(id){
    try{
      const db=await this.open();
      return new Promise((res,rej)=>{
        const tx=db.transaction('fotos','readonly');
        const req=tx.objectStore('fotos').get(id);
        req.onsuccess=e=>res(e.target.result?.photo||null);
        req.onerror=rej;
      });
    }catch(_){return null;}
  },
  async set(id,photo){
    try{
      const db=await this.open();
      return new Promise((res,rej)=>{
        const tx=db.transaction('fotos','readwrite');
        tx.objectStore('fotos').put({id,photo,ts:Date.now()});
        tx.oncomplete=res;tx.onerror=rej;
      });
    }catch(_){}
  },
  async getAll(){
    try{
      const db=await this.open();
      return new Promise((res,rej)=>{
        const tx=db.transaction('fotos','readonly');
        const req=tx.objectStore('fotos').getAll();
        req.onsuccess=e=>res(e.target.result||[]);
        req.onerror=rej;
      });
    }catch(_){return[];}
  },
  async clear(){
    try{
      const db=await this.open();
      return new Promise((res,rej)=>{
        const tx=db.transaction('fotos','readwrite');
        tx.objectStore('fotos').clear();
        tx.oncomplete=res;tx.onerror=rej;
      });
    }catch(_){}
  }
};

// Baixa fotos do Supabase Storage e guarda no IndexedDB
const downloadPhotos=async(products,onProgress)=>{
  const toDownload=products.filter(p=>p.photo&&p.photo.startsWith('http'));
  if(toDownload.length===0) return 0;
  let done=0;
  for(const p of toDownload){
    // Verifica se já tem no cache
    const cached=await _photoDB.get(p.id);
    if(cached){done++;if(onProgress)onProgress(done,toDownload.length);continue;}
    // Baixa do servidor
    try{
      const r=await fetch(p.photo);
      if(r.ok){
        const blob=await r.blob();
        const reader=new FileReader();
        const b64=await new Promise(res=>{reader.onload=e=>res(e.target.result);reader.readAsDataURL(blob);});
        await _photoDB.set(p.id,b64);
      }
    }catch(_){}
    done++;
    if(onProgress)onProgress(done,toDownload.length);
  }
  return done;
};

// Aplica fotos do cache nos produtos
const applyPhotoCache=async(products)=>{
  const cached=await _photoDB.getAll();
  if(cached.length===0) return products;
  const map=Object.fromEntries(cached.map(c=>[c.id,c.photo]));
  return products.map(p=>({...p,photo:map[p.id]||p.photo||''}));
};
const _toRow={
  products:(p)=>({id:p.id,name:p.name,category:p.category||'Outros',
    price:+(p.price||0),price_atacado:+(p.priceAtacado||0),
    cost_price:+(p.costPrice||0),comissao_prod:+(p.comissaoProd||0),
    atacado_habilitado:p.atacadoHabilitado||false,
    stock:+(p.stock||0),min_stock:+(p.minStock||5),
    unit:p.unit||'unid',barcode:p.barcode||'',
    photo:p.photo||'',description:p.description||'',
    created_at:p.createdAt||Date.now()}),
  customers:(c)=>({id:c.id,name:c.name,phone:c.phone||'',email:c.email||'',
    cpf:c.cpf||'',rua:c.rua||'',numero:c.numero||'',bairro:c.bairro||'',
    cidade:c.cidade||'',uf:c.uf||'',cep:c.cep||'',obs:c.obs||'',
    purchases:c.purchases||0,total_spent:+(c.totalSpent||0),
    created_at:c.createdAt||Date.now()}),
  sales:(s)=>({id:s.id,date:s.date,time:s.time||'',customer:s.customer||'',
    customer_id:s.customerId||null,payment:s.payment||'',tipo:s.tipo||'pdv',
    total:+(s.total||0),desconto:+(s.desconto||0),items:s.items||[],
    vendedor:s.vendedor||'',comissao_valor:+(s.comissaoValor||0),
    comissao_paga:s.comissaoPaga||false,obs:s.obs||''}),
  entregas:(e)=>({id:e.id,numero:e.numero||'',cliente:e.cliente||'',
    telefone:e.telefone||'',endereco:e.endereco||'',itens:e.itens||[],
    total:+(e.total||0),status:e.status||'pedido',pagamento:e.pagamento||'pago',
    is_prazo:e.isPrazo||false,obs:e.obs||'',venda_id:e.vendaId||null,
    criado_em:e.criadoEm||Date.now(),criado_data:e.criadoData||'',
    criado_hora:e.criadoHora||''}),
  fornecedores:(f)=>({id:f.id,nome:f.nome,cnpj:f.cnpj||'',
    telefone:f.telefone||'',email:f.email||'',contato:f.contato||'',
    rua:f.rua||'',numero:f.numero||'',bairro:f.bairro||'',
    cidade:f.cidade||'',uf:f.uf||'',cep:f.cep||'',obs:f.obs||'',
    created_at:f.createdAt||Date.now()})
};

async function syncSave(col,val){
  const key=_SB_KEY();
  if(!key)return;
  try{
    if(col==='categorias'){
      const rows=(Array.isArray(val)?val:[]).map((nome,i)=>({nome,ordem:i}));
      if(rows.length)await fetch(SUPABASE_URL+'/rest/v1/categorias?on_conflict=nome',{
        method:'POST',headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},body:JSON.stringify(rows)});
      return;
    }
    if(col==='settings'){
      const rows=Object.entries(val||{}).map(([k,v])=>({key:k,value:v}));
      if(rows.length)await fetch(SUPABASE_URL+'/rest/v1/settings?on_conflict=key',{
        method:'POST',headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},body:JSON.stringify(rows)});
      return;
    }
    const transform=_toRow[col];
    if(!transform||!Array.isArray(val))return;
    const rows=val.map(transform);
    if(rows.length>0){
      for(let i=0;i<rows.length;i+=200){
        const batch=rows.slice(i,i+200);
        await fetch(SUPABASE_URL+'/rest/v1/'+col+'?on_conflict=id',{
          method:'POST',
          headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},
          body:JSON.stringify(batch)
        });
      }
      // Deleta do Supabase registros que foram removidos localmente
      const ids=rows.map(r=>r.id).filter(Boolean);
      if(ids.length>0){
        await fetch(SUPABASE_URL+'/rest/v1/'+col+'?id=not.in.('+ids.join(',')+')',{
          method:'DELETE',
          headers:{..._SB_H(),'Content-Type':'application/json'}
        });
      }
    } else {
      // Array vazio — deleta todos da tabela
      await fetch(SUPABASE_URL+'/rest/v1/'+col+'?id=neq._vazio_',{
        method:'DELETE',headers:_SB_H()
      });
    }
  }catch(e){console.warn('[PDV] syncSave falhou:',col,e.message);}
}

async function syncLoad(){
  const key=_SB_KEY();
  if(!key){console.warn('[PDV] Configure a chave Supabase');return null;}
  try{
    const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/get_all_data',{
      method:'POST',headers:_SB_H(),body:'{}',
      signal:_timeoutSignal(10000)
    });
    if(!r.ok)throw new Error(await r.text());
    const data=await r.json();
    return data;
  }catch(e){console.warn('[PDV] syncLoad falhou:',e.message);return null;}
}

const PATHS={
  home:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  cart:"M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  box:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
  users:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  receipt:"M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z M8 12h8 M8 16h6",
  list:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2 M9 12h6 M9 16h4",
  import:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  plus:"M12 5v14 M5 12h14", x:"M18 6L6 18 M6 6l12 12",
  search:"M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z M16 16l3.5 3.5",
  alert:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  check:"M20 6L9 17l-5-5",
  edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:"M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  menu:"M3 12h18 M3 6h18 M3 18h18",
  clock:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  pdf:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h3",
  truck:"M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  printer:"M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  mapPin:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  phone:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  camera:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  barcode:"M3 5v14 M7 5v14 M11 5v14 M15 5v14 M19 5v14 M1 9h2 M1 15h2 M21 9h2 M21 15h2",
  sliders:"M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  image:"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z",
  trending:"M23 6l-9.5 9.5-5-5L1 18",
  logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
};
const Icon=({name,size=16,color})=>(<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",flexShrink:0}}>{PATHS[name]?.split(" M").map((d,i)=><path key={i} d={i===0?d:"M"+d}/>)}</svg>);

// Categorias padronizadas usadas em todo o sistema
const DEFAULT_CATS=["Bebidas","Lanches","Doces","Eletrônicos","Vestuário","Limpeza","Higiene","Ferramentas","Ferragens","Construção","Hidráulica","Elétrico","Pesca","Utilidades","Outros"];
const loadCats=()=>{const saved=load("pdv_categorias",null);return saved&&saved.length>0?saved:DEFAULT_CATS;};
const saveCats=(v)=>save("pdv_categorias",v);
const UNITS=["unid","cx","kg","g","l","ml","m","pç","par","dz","pt","sc"];

function Toast({toast}){if(!toast)return null;const clr={success:"#4ade80",error:"#ff3b3b",warn:"#F07030",info:"#4A5BC4"};return(<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:9999,padding:"11px 20px",borderRadius:24,fontWeight:600,fontSize:13,fontFamily:"'Sora',sans-serif",whiteSpace:"nowrap",maxWidth:"calc(100vw - 32px)",animation:"popIn .25s ease",background:toast.type==="error"?"#ff3b3b":"#0F1220",border:"1px solid "+(clr[toast.type]||clr.success),color:toast.type==="error"?"#fff":(clr[toast.type]||clr.success),boxShadow:"0 8px 32px rgba(0,0,0,.7)"}}>{toast.msg}</div>);}

function EmptyState({icon,title,desc,action}){return(<div style={{textAlign:"center",padding:"52px 20px 32px"}}><div style={{fontSize:52,marginBottom:10}}>{icon}</div><div style={{fontSize:15,fontWeight:700,color:"#888",marginBottom:6}}>{title}</div><div style={{fontSize:13,color:"#555",lineHeight:1.6,marginBottom:24}}>{desc}</div>{action}</div>);}

function Sheet({onClose,children}){return(<div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.72)"}} onClick={onClose}/><div style={{position:"relative",background:"#0F1220",borderRadius:"20px 20px 0 0",border:"1px solid #1e2232",borderBottom:"none",maxHeight:"92dvh",overflowY:"auto",padding:"0 18px 36px"}}><div style={{width:36,height:4,background:"#252845",borderRadius:2,margin:"13px auto 20px"}}/>{children}</div></div>);}

function DeleteSheet({label,onConfirm,onClose,S}){return(<Sheet onClose={onClose}><div style={{textAlign:"center",paddingBottom:6}}><div style={{fontSize:44,marginBottom:12}}>🗑️</div><div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Remover item?</div><div style={{fontSize:13,color:"#6a6d80",marginBottom:26,lineHeight:1.5}}>Deseja remover <strong style={{color:"#e8e9f0"}}>"{label}"</strong>?</div><div style={{display:"flex",gap:10}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={onClose}>Cancelar</button><button style={{...S.btn(),flex:1,justifyContent:"center",background:"#ff3b3b",color:"#fff"}} onClick={onConfirm}>Remover</button></div></div></Sheet>);}

// ── SCANNERS ───────────────────────────────────────────────────────────────────
function ScannerBase({S,onClose,onCode,title,subtitle}){
  const [status,setStatus]=useState("idle");const [manual,setManual]=useState("");
  const videoRef=useRef(null);const streamRef=useRef(null);const detRef=useRef(null);const rafRef=useRef(null);const activeRef=useRef(false);const scannerDivRef=useRef(null);
  const stopAll=()=>{activeRef.current=false;if(rafRef.current)cancelAnimationFrame(rafRef.current);if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}if(detRef.current?._quagga){try{detRef.current._quagga.stop();}catch(_){}}};
  const startScan=async()=>{
    if(activeRef.current)return;
    activeRef.current=true;
    setStatus("scanning");
    const beep=()=>{try{const ac=new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator();const g=ac.createGain();o.connect(g);g.connect(ac.destination);o.frequency.value=1800;o.type="square";g.gain.setValueAtTime(0.3,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.12);o.start(ac.currentTime);o.stop(ac.currentTime+0.12);}catch(_){}};
    // Carrega Quagga2 — funciona em iOS Safari, Android, Chrome
    const loadQuagga=()=>new Promise((res,rej)=>{
      if(window.Quagga){res(window.Quagga);return;}
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.7.4/dist/quagga.min.js";
      s.onload=()=>res(window.Quagga);
      s.onerror=rej;
      document.head.appendChild(s);
    });
    try{
      const Quagga=await loadQuagga();
      // Garante que o elemento de vídeo existe
      await new Promise(r=>setTimeout(r,300));
      if(!scannerDivRef.current){setStatus("error");return;}
      Quagga.init({
        inputStream:{
          name:"Live",
          type:"LiveStream",
          target:scannerDivRef.current,
          constraints:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}},
        },
        locator:{patchSize:"medium",halfSample:true},
        numOfWorkers:0,
        frequency:10,
        decoder:{readers:["ean_reader","ean_8_reader","code_128_reader","code_39_reader","upc_reader","upc_e_reader"]},
        locate:true,
      },(err)=>{
        if(err){console.error("Quagga init:",err);setStatus("error");return;}
        if(!activeRef.current){Quagga.stop();return;}
        Quagga.start();
        detRef.current={_quagga:Quagga};
      });
      Quagga.onDetected((result)=>{
        const code=result?.codeResult?.code;
        if(code&&activeRef.current){
          Quagga.stop();
          stopAll();
          beep();
          onCode(code);
        }
      });
    }catch(e){
      console.error("Scanner error:",e);
      setStatus("error");
      activeRef.current=false;
    }
  };
  const handleClose=()=>{stopAll();onClose();};
  return(<div style={{position:"fixed",inset:0,zIndex:3000,background:"#000",display:"flex",flexDirection:"column"}}><div style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,.85)",flexShrink:0}}><div><div style={{fontSize:15,fontWeight:700,color:"#fff"}}>📷 {title}</div><div style={{fontSize:11,color:"#4A5BC4",marginTop:2}}>{subtitle}</div></div><button onClick={handleClose} style={{background:"#ffffff20",border:"none",color:"#fff",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13}}>Fechar</button></div><div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>{status==="idle"&&<div style={{textAlign:"center",padding:24}}><div style={{fontSize:48,marginBottom:12}}>📷</div><button onClick={startScan} style={{...S.btn("primary"),padding:"12px 28px",justifyContent:"center"}}><Icon name="camera" size={16}/> Ativar Câmera</button></div>}{status==="scanning"&&<div style={{width:"100%",flex:1,position:"relative"}}><video ref={videoRef} style={{display:"none"}} playsInline muted autoPlay/><div ref={scannerDivRef} id="scanner-container" style={{width:"100%",height:"100%",position:"absolute",inset:0}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{width:260,height:110,border:"2px solid #22d3ee",borderRadius:8,boxShadow:"0 0 0 2000px rgba(0,0,0,.5)",position:"relative"}}><div style={{position:"absolute",left:0,right:0,height:2,top:"40%",background:"linear-gradient(90deg,transparent,#22d3ee,transparent)",animation:"scanline 1.5s ease-in-out infinite"}}/></div></div></div>}{status==="error"&&<div style={{textAlign:"center",padding:24}}><div style={{fontSize:40,marginBottom:10}}>⚠️</div><div style={{color:"#F07030",fontSize:12}}>Câmera indisponível. Use o campo abaixo.</div></div>}</div><div style={{padding:"14px 18px 32px",background:"rgba(0,0,0,.92)",borderTop:"1px solid #1a1c2e",flexShrink:0}}><div style={{fontSize:12,color:"#6a6d80",marginBottom:8,fontWeight:600}}>Leitor USB ou digitar manualmente:</div><div style={{display:"flex",gap:8}}><input autoFocus style={{...S.input,flex:1,background:"#111318",fontSize:16,letterSpacing:2}} placeholder="0000000000000" value={manual} onChange={e=>setManual(e.target.value)} onKeyDown={e=>e.key==="Enter"&&manual.trim()&&(stopAll(),onCode(manual.trim()))} inputMode="numeric"/><button onClick={()=>manual.trim()&&(stopAll(),onCode(manual.trim()))} disabled={!manual.trim()} style={{...S.btn("primary"),padding:"10px 18px",flexShrink:0,opacity:manual.trim()?1:0.4}}><Icon name="check" size={16}/></button></div></div><style dangerouslySetInnerHTML={{__html:"@keyframes scanline{0%,100%{top:10%}50%{top:80%}}"}}/></div>);}

// ── PRODUCT SHEET ──────────────────────────────────────────────────────────────
function ProductSheet({initial,onSave,onClose,S,prefillName,cats}){
  const [form,setForm]=useState({
    name:initial?.name||prefillName||"", category:initial?.category||"Outros",
    price:initial?.price||"",           priceAtacado:initial?.priceAtacado||"",
    atacadoHabilitado:initial?.atacadoHabilitado||false,
    costPrice:initial?.costPrice||"",   comissaoProd:initial?.comissaoProd||"",
    stock:initial?.stock??"",           minStock:initial?.minStock||"",
    unit:initial?.unit||"unid",         barcode:initial?.barcode||"",
    photo:initial?.photo||"",           description:initial?.description||""
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const photoRef=useRef(null);
  const photoGalRef=useRef(null);const [scanBC,setScanBC]=useState(false);
  const handlePhoto=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const key=localStorage.getItem('_sb_key')||"";
    // Tenta upload para Supabase Storage
    if(key&&SUPABASE_URL){
      try{
        // Comprime a imagem antes de enviar
        const compressed=await new Promise((res)=>{
          const img=new Image();
          const url=URL.createObjectURL(file);
          img.onload=()=>{
            const MAX=800;
            let w=img.width,h=img.height;
            if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
            if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
            const canvas=document.createElement('canvas');
            canvas.width=w;canvas.height=h;
            canvas.getContext('2d').drawImage(img,0,0,w,h);
            canvas.toBlob(blob=>res(blob),'image/jpeg',0.75);
            URL.revokeObjectURL(url);
          };
          img.src=url;
        });
        const filename=`prod_${Date.now()}.jpg`;
        const r=await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${filename}`,{
          method:'POST',
          headers:{
            'apikey':key,
            'Authorization':'Bearer '+key,
            'Content-Type':'image/jpeg',
            'x-upsert':'true'
          },
          body:compressed
        });
        if(r.ok){
          const url=`${SUPABASE_URL}/storage/v1/object/public/fotos/${filename}`;
          set("photo",url);
          return;
        }
      }catch(err){console.warn('[PDV] Storage falhou, usando base64:',err.message);}
    }
    // Fallback: base64 (comprimido)
    const r=new FileReader();
    r.onload=async(ev)=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=600;
        let w=img.width,h=img.height;
        if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
        if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
        const canvas=document.createElement('canvas');
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        set("photo",canvas.toDataURL('image/jpeg',0.7));
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(file);
  };
  const margemPDV   = form.price&&form.costPrice&&+form.costPrice>0 ? (((+form.price - +form.costPrice)/+form.costPrice)*100).toFixed(1) : null;
  const margemAtac  = form.priceAtacado&&form.costPrice&&+form.costPrice>0 ? (((+form.priceAtacado - +form.costPrice)/+form.costPrice)*100).toFixed(1) : null;
  return(<Sheet onClose={onClose}>
    <div style={{fontSize:17,fontWeight:700,marginBottom:18}}>{initial?"✏️ Editar Produto":"📦 Novo Produto"}</div>
    {/* Foto */}
    <div style={{marginBottom:14}}><div style={{...S.lbl,marginBottom:6}}>Foto</div><div style={{display:"flex",gap:12,alignItems:"center"}}><div style={{width:68,height:68,borderRadius:10,border:"2px dashed #1a1c2e",overflow:"hidden",flexShrink:0,background:"#0A0C1E",display:"flex",alignItems:"center",justifyContent:"center"}}>{form.photo?<img src={form.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<Icon name="image" size={22} color="#252845"/>}</div><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><input ref={photoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhoto}/>
<input ref={photoGalRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
<div style={{display:"flex",gap:4}}>
  <button onClick={()=>photoRef.current?.click()} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"8px",fontSize:11}}><Icon name="camera" size={13}/> Câmera</button>
  <button onClick={()=>photoGalRef.current?.click()} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"8px",fontSize:11}}>🖼️ Galeria</button>
</div>{form.photo&&<button onClick={()=>set("photo","")} style={{...S.btn("danger"),justifyContent:"center",padding:"6px",fontSize:11}}>Remover</button>}</div></div></div>
    {/* Nome */}
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Nome *</div><input style={S.input} placeholder="Ex: Cadeado 50mm" value={form.name} onChange={e=>set("name",e.target.value)} autoFocus/></div>
    {/* Descrição */}
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Descrição</div><textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Detalhes, marca, modelo..." style={{...S.input,height:48,resize:"none",verticalAlign:"top",fontSize:12,lineHeight:1.4}}/></div>
    {/* Categoria + Unidade */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,marginBottom:10}}>
      <div><div style={{...S.lbl,marginBottom:5}}>Categoria</div><select style={S.input} value={form.category} onChange={e=>set("category",e.target.value)}>{(cats||loadCats()).map(c=><option key={c}>{c}</option>)}</select></div>
      <div><div style={{...S.lbl,marginBottom:5}}>Unidade</div><select style={S.input} value={form.unit} onChange={e=>set("unit",e.target.value)}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
    </div>
    {/* Preço Custo */}
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Preço de Custo (R$)</div><input style={{...S.input,border:"1px solid #22d3ee30"}} type="number" step="0.01" min="0" placeholder="0,00" value={form.costPrice} onChange={e=>set("costPrice",e.target.value)}/></div>
    {/* Preço PDV + Atacado lado a lado */}
    {/* Toggle Atacado */}
    <div style={{marginBottom:12}}>
      <button onClick={()=>set("atacadoHabilitado",!form.atacadoHabilitado)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 14px",borderRadius:10,border:"1px solid "+(form.atacadoHabilitado?"#f59e0b60":"#1E2245"),background:form.atacadoHabilitado?"#f59e0b12":"#0A0C1E",cursor:"pointer",fontFamily:"'Sora',sans-serif",textAlign:"left"}}>
        <div style={{width:20,height:20,borderRadius:10,border:"2px solid "+(form.atacadoHabilitado?"#f59e0b":"#252845"),background:form.atacadoHabilitado?"#f59e0b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
          {form.atacadoHabilitado&&<div style={{width:8,height:8,borderRadius:4,background:"#000"}}/>}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:form.atacadoHabilitado?"#f59e0b":"#6a6d80"}}>📦 Habilitar Venda Atacado</div>
          <div style={{fontSize:11,color:"#5A6080",marginTop:1}}>{form.atacadoHabilitado?"Produto aparece na aba Venda Atacado":"Produto não aparece na Venda Atacado"}</div>
        </div>
      </button>
    </div>
    <div style={{fontSize:11,fontWeight:700,color:"#E8682A",textTransform:"uppercase",letterSpacing:1,marginBottom:8,marginTop:4}}>Preços de Venda</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:6}}>
      <div>
        <div style={{...S.lbl,marginBottom:5,color:"#E8682A"}}>🏪 PDV / Varejo *</div>
        <input style={{...S.input,border:"1px solid #E8682A40"}} type="number" step="0.01" min="0" placeholder="0,00" value={form.price} onChange={e=>set("price",e.target.value)}/>
        {margemPDV&&<div style={{fontSize:10,color:"#4ade80",marginTop:3}}>Margem: {margemPDV}%</div>}
      </div>
      <div>
        <div style={{...S.lbl,marginBottom:5,color:"#f59e0b"}}>📦 Atacado</div>
        <input style={{...S.input,border:"1px solid #f59e0b40"}} type="number" step="0.01" min="0" placeholder="0,00" value={form.priceAtacado} onChange={e=>set("priceAtacado",e.target.value)}/>
        {margemAtac&&<div style={{fontSize:10,color:"#f59e0b",marginTop:3}}>Margem: {margemAtac}%</div>}
      </div>
    </div>
    {/* Comissão do produto */}
    <div style={{marginBottom:10}}>
      <div style={{...S.lbl,marginBottom:5,color:"#4A5BC4"}}>💰 Comissão do Produto (%)</div>
      <input style={{...S.input,border:"1px solid #22d3ee30"}} type="number" step="0.1" min="0" max="100" placeholder="Ex: 5 (para 5%)" value={form.comissaoProd} onChange={e=>set("comissaoProd",e.target.value)}/>
      {form.comissaoProd&&+form.comissaoProd>0&&form.priceAtacado&&+form.priceAtacado>0&&(
        <div style={{fontSize:11,color:"#4A5BC4",marginTop:3}}>= {fmt(+form.priceAtacado * +form.comissaoProd/100)} por unidade vendida no atacado</div>
      )}
    </div>
    {/* Estoque */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={{...S.lbl,marginBottom:5}}>Estoque *</div><input style={S.input} type="number" min="0" placeholder="0" value={form.stock} onChange={e=>set("stock",e.target.value)}/></div>
      <div><div style={{...S.lbl,marginBottom:5}}>Estoque Mín.</div><input style={S.input} type="number" min="0" placeholder="0" value={form.minStock} onChange={e=>set("minStock",e.target.value)}/></div>
    </div>
    {/* Código de barras */}
    <div style={{marginBottom:20}}><div style={{...S.lbl,marginBottom:5}}>Código de Barras / SKU</div><div style={{display:"flex",gap:8}}><div style={{position:"relative",flex:1}}><input style={{...S.input,paddingLeft:34}} placeholder="Ex: 7891234567890" value={form.barcode} onChange={e=>set("barcode",e.target.value)}/><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="barcode" size={15}/></div></div><button onClick={()=>setScanBC(true)} style={{...S.btn("ghost"),padding:"10px 13px",border:"1px solid #22d3ee40",color:"#4A5BC4",background:"#22d3ee10",flexShrink:0}}><Icon name="camera" size={17} color="#4A5BC4"/></button></div>{form.barcode&&<div style={{marginTop:4,fontSize:11,color:"#4ade80"}}>✓ Código: {form.barcode}</div>}{scanBC&&<ScannerBase S={S} title="Bipar Código" subtitle="Aponte para o código do produto" onCode={(code)=>{set("barcode",code);setScanBC(false);}} onClose={()=>setScanBC(false)}/>}</div>
    <div style={{display:"flex",gap:10}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={onClose}>Cancelar</button><button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={()=>onSave(form)}><Icon name="check" size={14}/> {initial?"Salvar":"Cadastrar"}</button></div>
  </Sheet>);}

// ── CUSTOMER SHEET ─────────────────────────────────────────────────────────────
function CustomerSheet({initial,onSave,onClose,S}){
  const UFS=["","AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const [form,setForm]=useState({name:initial?.name||"",phone:initial?.phone||"",email:initial?.email||"",cpf:initial?.cpf||"",cep:initial?.cep||"",rua:initial?.rua||"",numero:initial?.numero||"",complemento:initial?.complemento||"",bairro:initial?.bairro||"",cidade:initial?.cidade||"",uf:initial?.uf||""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const buscaCep=async()=>{const c=form.cep.replace(/\D/g,"");if(c.length!==8)return;try{const r=await fetch("https://viacep.com.br/ws/"+c+"/json/");const d=await r.json();if(!d.erro)setForm(f=>({...f,rua:d.logradouro||f.rua,bairro:d.bairro||f.bairro,cidade:d.localidade||f.cidade,uf:d.uf||f.uf}));}catch{}};
  return(<Sheet onClose={onClose}>
    <div style={{fontSize:17,fontWeight:700,marginBottom:18}}>{initial?"✏️ Editar Cliente":"👤 Novo Cliente"}</div>
    <div style={{fontSize:11,fontWeight:700,color:"#E8682A",textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:"1px solid #1a1c2e"}}>Dados Pessoais</div>
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Nome *</div><input style={S.input} placeholder="Ana Silva" value={form.name} onChange={e=>set("name",e.target.value)} autoFocus/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><div style={{...S.lbl,marginBottom:5}}>Telefone</div><input style={S.input} type="tel" placeholder="(00) 90000-0000" value={form.phone} onChange={e=>set("phone",e.target.value)}/></div>
      <div><div style={{...S.lbl,marginBottom:5}}>CPF / CNPJ</div><input style={S.input} placeholder="000.000.000-00" value={form.cpf} onChange={e=>set("cpf",e.target.value)}/></div>
    </div>
    <div style={{marginBottom:18}}><div style={{...S.lbl,marginBottom:5}}>E-mail</div><input style={S.input} type="email" placeholder="email@exemplo.com" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
    <div style={{fontSize:11,fontWeight:700,color:"#4A5BC4",textTransform:"uppercase",letterSpacing:1,marginBottom:10,paddingBottom:6,borderBottom:"1px solid #1a1c2e"}}>Endereço</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,marginBottom:10,alignItems:"flex-end"}}><div><div style={{...S.lbl,marginBottom:5}}>CEP</div><input style={S.input} placeholder="00000-000" value={form.cep} onChange={e=>set("cep",e.target.value)} onBlur={buscaCep}/></div><button onClick={buscaCep} style={{...S.btn("ghost"),padding:"11px 12px",fontSize:12}}>🔍</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,marginBottom:10}}><div><div style={{...S.lbl,marginBottom:5}}>Rua / Av.</div><input style={S.input} placeholder="Rua das Flores" value={form.rua} onChange={e=>set("rua",e.target.value)}/></div><div><div style={{...S.lbl,marginBottom:5}}>Nº</div><input style={S.input} placeholder="471" value={form.numero} onChange={e=>set("numero",e.target.value)}/></div></div>
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Complemento</div><input style={S.input} placeholder="Apto 12" value={form.complemento} onChange={e=>set("complemento",e.target.value)}/></div>
    <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Bairro</div><input style={S.input} placeholder="Jardim Candides" value={form.bairro} onChange={e=>set("bairro",e.target.value)}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:10,marginBottom:24}}><div><div style={{...S.lbl,marginBottom:5}}>Cidade</div><input style={S.input} placeholder="Divinópolis" value={form.cidade} onChange={e=>set("cidade",e.target.value)}/></div><div><div style={{...S.lbl,marginBottom:5}}>UF</div><select style={S.input} value={form.uf} onChange={e=>set("uf",e.target.value)}>{UFS.map(u=><option key={u} value={u}>{u||"--"}</option>)}</select></div></div>
    <div style={{display:"flex",gap:10}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={onClose}>Cancelar</button><button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={()=>onSave(form)}><Icon name="check" size={14}/> {initial?"Salvar":"Cadastrar"}</button></div>
  </Sheet>);}


// ── SISTEMA DE LOGIN ───────────────────────────────────────────────────────────
const ADMIN_PERMS={pdv:true,atacado:true,estoque:true,clientes:true,historico:true,importar:true,entregas:true,lista:true,editarProdutos:true,excluirVendas:true,fornecedores:true};
const DEFAULT_USERS=[{id:"admin",name:"Administrador",pin:"1234",role:"admin",permissions:ADMIN_PERMS,comissao:0}];
const loadUsers=()=>{
  const u=load("pdv_users",null);
  if(!u||u.length===0) return DEFAULT_USERS;
  // Garante que admin sempre tem todas as permissões
  return u.map(x=>x.role==="admin"?{...x,permissions:{...ADMIN_PERMS,...(x.permissions||{})},role:"admin"}:x);
};
const saveUsers=(v)=>{
  save("pdv_users",v);
  // Sincroniza com Supabase
  const key=localStorage.getItem('_sb_key')||"";
  if(!key) return;
  const rows=v.map(u=>({
    id:u.id,name:u.name,pin:u.pin,role:u.role||"vendedor",
    permissions:u.permissions||{},active:u.active!==false,
    created_at:u.createdAt||Date.now()
  }));
  fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/users?on_conflict=id",{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+key,"Prefer":"resolution=merge-duplicates"},
    body:JSON.stringify(rows)
  }).catch(e=>console.warn("[PDV] saveUsers falhou:",e.message));
};
const loadUsersFromSupabase=async()=>{
  const key=localStorage.getItem('_sb_key')||"";
  if(!key) return null;
  try{
    const r=await fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/users?select=*&active=eq.true",{
      headers:{"apikey":key,"Authorization":"Bearer "+key}
    });
    if(!r.ok) return null;
    const rows=await r.json();
    if(!rows||rows.length===0) return null;
    const users=rows.map(u=>({
      id:u.id,name:u.name,pin:u.pin,role:u.role||"vendedor",
      permissions:u.permissions||{},active:u.active!==false,
      createdAt:u.created_at
    }));
    save("pdv_users",users);
    return users;
  }catch(e){console.warn("[PDV] loadUsersFromSupabase falhou:",e.message);return null;}
};

function KeySetupScreen({onDone}){
  const [key,setKey]=useState(localStorage.getItem('_sb_key')||"");
  const [testing,setTesting]=useState(false);
  const [msg,setMsg]=useState("");
  const testar=async()=>{
    if(!key.trim()){setMsg("Cole a chave acima");return;}
    setTesting(true);setMsg("Testando conexão...");
    try{
      const r=await fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/rpc/get_all_data",{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':key.trim(),'Authorization':'Bearer '+key.trim()},
        body:'{}',signal:_timeoutSignal(8000)
      });
      if(r.ok){
        localStorage.setItem('_sb_key',key.trim());sessionStorage.setItem('_sb_key',key.trim());
        setMsg("✅ Conectado!");
        setTimeout(()=>onDone(),1000);
      } else {
        const e=await r.text();
        setMsg("❌ Erro: "+e.slice(0,80));
      }
    }catch(e){setMsg("❌ "+e.message);}
    setTesting(false);
  };
  return(
    <div style={{minHeight:"100vh",background:"#0A0C1E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Sora',sans-serif"}}>
      <img src={LOGO_SRC} alt="Pecuarão Gontijo" style={{height:70,objectFit:"contain",marginBottom:16}}/>
      <div style={{fontSize:18,fontWeight:800,color:"#E8682A",marginBottom:4}}>Configurar Supabase</div>
      <div style={{fontSize:12,color:"#5A6080",marginBottom:24,textAlign:"center"}}>
        Cole a chave <b style={{color:"#e8e9f0"}}>JWT anon key</b><br/>
        Supabase → Settings → <b style={{color:"#e8e9f0"}}>Chaves JWT</b> → anon key<br/>
        <span style={{fontSize:10,color:"#E8682A"}}>(começa com eyJhbGci...)</span>
      </div>
      <div style={{width:"100%",maxWidth:420}}>
        <textarea
          value={key}
          onChange={e=>setKey(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6..."
          style={{width:"100%",height:100,background:"#0F1220",border:"1px solid #1E2245",borderRadius:10,color:"#e8e9f0",padding:12,fontSize:11,fontFamily:"monospace",resize:"none",boxSizing:"border-box"}}
        />
        <button onClick={testar} disabled={testing} style={{width:"100%",marginTop:12,padding:14,background:"linear-gradient(135deg,#E8682A,#F07030)",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          {testing?"Testando...":"🔗 Conectar ao Supabase"}
        </button>
        {msg&&<div style={{marginTop:12,padding:10,background:"#0F1220",borderRadius:8,fontSize:13,color:msg.startsWith("✅")?"#22c55e":"#ff6b6b",textAlign:"center"}}>{msg}</div>}
        <div style={{marginTop:16,padding:12,background:"#0F1220",borderRadius:8,fontSize:11,color:"#5A6080",lineHeight:1.6}}>
          <b style={{color:"#e8e9f0"}}>Onde encontrar a chave:</b><br/>
          Supabase → Configurações → Chaves de API →<br/>
          aba "Legadas" → copie a chave <b style={{color:"#E8682A"}}>anon</b>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({onLogin,S}){
  const [pin,setPin]=useState("");const [erro,setErro]=useState("");const [sel,setSel]=useState(null);
  const users=loadUsers();
  const tentar=(u)=>{
    const target=sel||u;
    if(!target)return;
    if(target.pin===pin||(pin===""&&target.pin==="")){onLogin(target);setErro("");}
    else{setErro("PIN incorreto");setPin("");}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"#0A0C1E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"'Sora',sans-serif"}}>
      <div style={{fontSize:48,marginBottom:8}}>⚡</div>
      <div style={{fontSize:24,fontWeight:800,background:"linear-gradient(135deg,#E8682A,#F07030)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>PDV Pro</div>
      <div style={{fontSize:12,color:"#3a3d50",marginBottom:32,textTransform:"uppercase",letterSpacing:2}}>Sistema de Vendas</div>
      {!sel?(
        <div style={{width:"100%",maxWidth:320,padding:"0 20px"}}>
          <div style={{fontSize:12,color:"#5A6080",textAlign:"center",marginBottom:16,textTransform:"uppercase",letterSpacing:1}}>Selecione o usuário</div>
          {users.map(u=>(
            <button key={u.id} onClick={()=>{if(u.pin==="")onLogin(u);else setSel(u);}} style={{display:"flex",alignItems:"center",gap:14,width:"100%",background:"#0F1220",border:"1px solid #1a1c2e",borderRadius:12,padding:"14px 16px",marginBottom:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
              <div style={{width:40,height:40,borderRadius:20,background:u.role==="admin"?"linear-gradient(135deg,#E8682A,#F07030)":"linear-gradient(135deg,#3b82f6,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{u.role==="admin"?"👑":"👤"}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#e8e9f0"}}>{u.name}</div><div style={{fontSize:11,color:"#5A6080"}}>{u.role==="admin"?"Administrador":u.role==="atacado"?"Vendas Atacado":"Vendedor"}</div></div>
            </button>
          ))}
        </div>
      ):(
        <div style={{width:"100%",maxWidth:300,padding:"0 20px",textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:600,color:"#e8e9f0",marginBottom:20}}>👤 {sel.name}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {[1,2,3,4,5,6,7,8,9,"←",0,"✓"].map((k,i)=>(
              <button key={i} onClick={()=>{
                if(k==="←")setPin(p=>p.slice(0,-1));
                else if(k==="✓")tentar(sel);
                else setPin(p=>p.length<6?p+k:p);
              }} style={{padding:"16px",borderRadius:10,border:"none",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"inherit",background:k==="✓"?"linear-gradient(135deg,#E8682A,#F07030)":k==="←"?"#1E2245":"#0F1220",color:k==="✓"?"#fff":"#e8e9f0"}}>
                {k}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:12}}>
            {[0,1,2,3,4,5].map(i=><div key={i} style={{width:10,height:10,borderRadius:5,background:i<pin.length?"#E8682A":"#1E2245"}}/>)}
          </div>
          {erro&&<div style={{color:"#ff3b3b",fontSize:13,marginBottom:8}}>{erro}</div>}
          <button onClick={()=>{setSel(null);setPin("");setErro("");}} style={{fontSize:12,color:"#5A6080",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>← Voltar</button>
          {sel?.id==="admin"&&pin.length===0&&<button onClick={()=>{
            // Reseta permissões do admin no localStorage
            const users=loadUsers();
            const fixed=users.map(u=>u.role==="admin"?{...u,permissions:ADMIN_PERMS}:u);
            saveUsers(fixed);
            setErro("Permissões do admin restauradas!");
          }} style={{fontSize:11,color:"#E8682A",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>🔧 Restaurar permissões admin</button>}
        </div>
      )}
    </div>
  );
}

// ── GESTÃO DE USUÁRIOS (Admin) ────────────────────────────────────────────────
function UsersPage({S,notify,currentUser,sales,persistS}){
  const [users,setUsers]=useState(()=>loadUsers());
  const [sheet,setSheet]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [detailUser,setDetailUser]=useState(null); // usuário com painel aberto
  const [detailTab,setDetailTab]=useState("historico"); // historico | comissao
  const [periodo,setPeriodo]=useState("mes");
  const [relDe,setRelDe]=useState("");
  const [relAte,setRelAte]=useState("");
  const persistU=(v)=>{setUsers(v);saveUsers(v);};

  const PERMS=[
    {k:"pdv",l:"PDV / Vendas"},{k:"atacado",l:"Venda Atacado"},{k:"estoque",l:"Estoque"},
    {k:"clientes",l:"Clientes"},{k:"historico",l:"Histórico"},{k:"importar",l:"Importar NF-e"},
    {k:"entregas",l:"Entregas"},{k:"lista",l:"Lista de Compras"},
    {k:"editarProdutos",l:"Editar Produtos"},{k:"excluirVendas",l:"Excluir Vendas"},
  ];
  const [form,setForm]=useState({name:"",pin:"",role:"vendedor",comissao:0,permissions:{pdv:true,atacado:false,estoque:false,clientes:false,historico:false,importar:false,entregas:true,lista:true,editarProdutos:false,excluirVendas:false}});
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setPerm=(k,v)=>setForm(f=>({...f,permissions:{...f.permissions,[k]:v}}));
  const openNew=()=>{setEditUser(null);setForm({name:"",pin:"",role:"vendedor",comissao:0,permissions:{pdv:true,atacado:false,estoque:false,clientes:false,historico:false,importar:false,entregas:true,lista:true,editarProdutos:false,excluirVendas:false}});setSheet(true);};
  const openEdit=(u)=>{setEditUser(u);setForm({...u});setSheet(true);};
  const saveUser=()=>{if(!form.name.trim()){notify("Informe o nome!","error");return;}if(editUser){persistU(users.map(u=>u.id===editUser.id?{...u,...form}:u));notify("Usuário atualizado ✓");}else{persistU([...users,{id:uid(),...form}]);notify("Usuário criado ✓");}setSheet(false);};

  // Período selecionado
  const getPeriodRange=()=>{
    const hoje=new Date();
    if(periodo==="semana"){const d=new Date(hoje);d.setDate(d.getDate()-7);return{de:d.toISOString().slice(0,10),ate:hoje.toISOString().slice(0,10)};}
    if(periodo==="mes"){return{de:hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0")+"-01",ate:hoje.toISOString().slice(0,10)};}
    if(periodo==="mesant"){const d=new Date(hoje.getFullYear(),hoje.getMonth()-1,1);const d2=new Date(hoje.getFullYear(),hoje.getMonth(),0);return{de:d.toISOString().slice(0,10),ate:d2.toISOString().slice(0,10)};}
    return{de:relDe,ate:relAte};
  };

  // Todas as vendas de um usuário
  const vendasDoUsuario=(u)=>(sales||[]).filter(s=>s.vendedor===u.name||s.customer===u.name).sort((a,b)=>b.date.localeCompare(a.date));
  // Vendas atacado com comissão no período
  const vendasComComissao=(u)=>{
    const {de,ate}=getPeriodRange();
    return(sales||[]).filter(s=>s.tipo==="atacado"&&s.vendedor===u.name&&s.date>=de&&s.date<=(ate||"9999"));
  };

  // Marcar comissão como paga
  const marcarPaga=(saleId,paga)=>{
    if(persistS)persistS((sales||[]).map(s=>s.id===saleId?{...s,comissaoPaga:paga,comissaoPagaEm:paga?todayStr():null}:s));
    notify(paga?"Comissão marcada como paga ✓":"Marcada como pendente","success");
  };

  // Imprimir relatório de comissão
  const imprimirRelComissao=(u)=>{
    const {de,ate}=getPeriodRange();
    const vendas=vendasComComissao(u);
    const pagas=vendas.filter(s=>s.comissaoPaga);
    const pendentes=vendas.filter(s=>!s.comissaoPaga);
    const totalPago=pagas.reduce((s,v)=>s+(v.comissaoValor||0),0);
    const totalPendente=pendentes.reduce((s,v)=>s+(v.comissaoValor||0),0);
    const totalVendido=vendas.reduce((s,v)=>s+v.total,0);
    const mkRow=(s,isPaga)=>"<tr style='background:"+(isPaga?"#f0fdf4":"#fffbeb")+"'>"+
      "<td>"+s.date+" "+s.time+"</td>"+
      "<td>"+s.customer+"</td>"+
      "<td>"+s.items.map(i=>i.qty+"× "+i.name).join(", ")+"</td>"+
      "<td style='text-align:right'>"+fmt(s.total)+"</td>"+
      "<td style='text-align:right;font-weight:700;color:"+(isPaga?"#16a34a":"#ca8a04")+"'>"+fmt(s.comissaoValor||0)+"</td>"+
      "<td style='text-align:center'>"+(isPaga?"✅ Pago em "+(s.comissaoPagaEm||""):"⏳ Pendente")+"</td>"+
      "</tr>";
    const rows=[...pagas,...pendentes].map(s=>mkRow(s,!!s.comissaoPaga)).join("");
    const html="<!DOCTYPE html><html><head><meta charset='utf-8'><title>Comissão "+u.name+"</title>"+
      "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}"+
      "table{width:100%;border-collapse:collapse;font-size:11px;}"+
      "th{background:#1a1a2e;color:#fff;padding:7px;text-align:left;font-size:10px;}"+
      "td{padding:6px 7px;border-bottom:1px solid #eee;}</style></head><body>"+
      "<div style='background:#1a1a2e;color:#fff;padding:16px;border-radius:8px;margin-bottom:16px'>"+
      "<div style='font-size:20px;font-weight:800'>💰 Relatório de Comissão — "+u.name+"</div>"+
      "<div style='font-size:12px;margin-top:4px;opacity:.8'>Período: "+de+" a "+(ate||todayStr())+"</div></div>"+
      "<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px'>"+
      "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>Total Vendido</div><div style='font-size:16px;font-weight:800;color:#16a34a'>"+fmt(totalVendido)+"</div></div>"+
      "<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>Nº Vendas</div><div style='font-size:16px;font-weight:800;color:#2563eb'>"+vendas.length+"</div></div>"+
      "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>✅ Comissão Paga</div><div style='font-size:16px;font-weight:800;color:#16a34a'>"+fmt(totalPago)+"</div></div>"+
      "<div style='background:#fefce8;border:1px solid #fef08a;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>⏳ A Pagar</div><div style='font-size:16px;font-weight:800;color:#ca8a04'>"+fmt(totalPendente)+"</div></div>"+
      "</div>"+
      "<table><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Venda</th><th>Comissão</th><th>Status</th></tr></thead><tbody>"+rows+"</tbody>"+
      "<tfoot><tr style='background:#1a1a2e;color:#fff;font-weight:700'><td colspan='3'>TOTAL</td><td>"+fmt(totalVendido)+"</td><td>"+fmt(totalPago+totalPendente)+"</td><td></td></tr></tfoot>"+
      "</table>"+
      "<div style='margin-top:16px;font-size:10px;color:#aaa;text-align:center'>Gerado em "+new Date().toLocaleString("pt-BR")+"</div>"+
      "</body></html>";
    const w=window.open("","_blank","width=820,height=650");
    if(w){w.document.write(html);w.document.close();setTimeout(()=>{try{w.print();}catch(_){}},600);}
    else notify("Permita pop-ups.","warn");
  };

  // Painel de detalhe do usuário
  const UserDetail=({u})=>{
    const todas=vendasDoUsuario(u);
    const comissao=vendasComComissao(u);
    const pagas=comissao.filter(s=>s.comissaoPaga);
    const pendentes=comissao.filter(s=>!s.comissaoPaga);
    const totalPago=pagas.reduce((s,v)=>s+(v.comissaoValor||0),0);
    const totalPendente=pendentes.reduce((s,v)=>s+(v.comissaoValor||0),0);
    return(
      <div style={{marginTop:12,borderTop:"1px solid #1a1c2e",paddingTop:12}}>
        {/* Tabs */}
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["historico","📋 Histórico"],["comissao","💰 Comissões"]].map(([t,l])=>(
            <button key={t} onClick={()=>setDetailTab(t)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(detailTab===t?"#E8682A":"#1E2245"),background:detailTab===t?"#E8682A20":"transparent",color:detailTab===t?"#E8682A":"#6a6d80",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>{l}</button>
          ))}
        </div>

        {detailTab==="historico"&&(
          <div>
            <div style={{fontSize:11,color:"#5A6080",marginBottom:8}}>{todas.length} venda(s) no total</div>
            {todas.length===0?(
              <div style={{fontSize:12,color:"#3a3d50",textAlign:"center",padding:"16px 0"}}>Nenhuma venda registrada.</div>
            ):(
              <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {todas.slice(0,50).map(s=>(
                  <div key={s.id} style={{background:"#0A0C1E",border:"1px solid "+(s.tipo==="atacado"?"#f59e0b30":"#1E2245"),borderRadius:8,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{fontSize:12,fontWeight:700}}>{s.customer}</div>
                      <div style={{fontSize:13,fontWeight:800,color:"#4ade80"}}>{fmt(s.total)}</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:10,color:"#5A6080"}}>{s.date} {s.time}</span>
                      <span style={{...S.badge(s.payment==="A Prazo"?"#ef4444":"#4ade80"),fontSize:10}}>{s.payment}</span>
                      {s.tipo==="atacado"&&<span style={{...S.badge("#f59e0b"),fontSize:10}}>📦 Atacado</span>}
                      {s.comissaoValor>0&&<span style={{...S.badge("#4A5BC4"),fontSize:10}}>+{fmt(s.comissaoValor)}</span>}
                    </div>
                    <div style={{fontSize:10,color:"#3a3d50",marginTop:3}}>{s.items?.map(i=>i.qty+"× "+i.name).join(", ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {detailTab==="comissao"&&(
          <div>
            {/* Filtro período */}
            <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
              {[["semana","7 dias"],["mes","Este mês"],["mesant","Mês ant."],["custom","Período"]].map(([p,l])=>(
                <button key={p} onClick={()=>setPeriodo(p)} style={{padding:"5px 10px",borderRadius:20,border:"1px solid "+(periodo===p?"#4A5BC4":"#1E2245"),background:periodo===p?"#22d3ee18":"transparent",color:periodo===p?"#4A5BC4":"#6a6d80",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600}}>{l}</button>
              ))}
            </div>
            {periodo==="custom"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div><div style={{...S.lbl,marginBottom:3,fontSize:9}}>De</div><input type="date" style={{...S.input,padding:"7px 10px",fontSize:12}} value={relDe} onChange={e=>setRelDe(e.target.value)}/></div>
                <div><div style={{...S.lbl,marginBottom:3,fontSize:9}}>Até</div><input type="date" style={{...S.input,padding:"7px 10px",fontSize:12}} value={relAte} onChange={e=>setRelAte(e.target.value)}/></div>
              </div>
            )}
            {/* Cards totais */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{...S.card,padding:10,border:"1px solid #4ade8030"}}>
                <div style={{...S.lbl,fontSize:9,marginBottom:3}}>✅ Comissão Paga</div>
                <div style={{fontSize:17,fontWeight:800,color:"#4ade80"}}>{fmt(totalPago)}</div>
                <div style={{fontSize:10,color:"#5A6080"}}>{pagas.length} venda(s)</div>
              </div>
              <div style={{...S.card,padding:10,border:"1px solid #f59e0b40"}}>
                <div style={{...S.lbl,fontSize:9,marginBottom:3}}>⏳ A Pagar</div>
                <div style={{fontSize:17,fontWeight:800,color:"#f59e0b"}}>{fmt(totalPendente)}</div>
                <div style={{fontSize:10,color:"#5A6080"}}>{pendentes.length} venda(s)</div>
              </div>
            </div>
            {/* Botão pagar todas pendentes */}
            {pendentes.length>0&&(
              <button onClick={()=>{pendentes.forEach(s=>marcarPaga(s.id,true));}} style={{...S.btn("primary"),width:"100%",justifyContent:"center",padding:"9px",fontSize:12,marginBottom:10,background:"linear-gradient(135deg,#22c55e,#16a34a)"}}>
                ✅ Marcar todas como pagas ({fmt(totalPendente)})
              </button>
            )}
            {/* Lista detalhada */}
            {comissao.length===0?(
              <div style={{fontSize:12,color:"#3a3d50",textAlign:"center",padding:"12px 0"}}>Nenhuma venda atacado neste período.</div>
            ):(
              <div style={{maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {comissao.map(s=>(
                  <div key={s.id} style={{background:"#0A0C1E",border:"1px solid "+(s.comissaoPaga?"#4ade8030":"#f59e0b30"),borderRadius:8,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#e8e9f0"}}>{s.customer}</div>
                        <div style={{fontSize:10,color:"#5A6080"}}>{s.date} {s.time}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:12,color:"#5A6080"}}>{fmt(s.total)}</div>
                        <div style={{fontSize:14,fontWeight:800,color:s.comissaoPaga?"#4ade80":"#f59e0b"}}>+{fmt(s.comissaoValor||0)}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:s.comissaoPaga?"#4ade80":"#f59e0b",fontWeight:600}}>
                        {s.comissaoPaga?"✅ Pago em "+s.comissaoPagaEm:"⏳ Pendente"}
                      </span>
                      <button onClick={()=>marcarPaga(s.id,!s.comissaoPaga)} style={{padding:"4px 10px",borderRadius:20,border:"1px solid "+(s.comissaoPaga?"#ef444450":"#4ade8050"),background:s.comissaoPaga?"#ef444410":"#4ade8010",color:s.comissaoPaga?"#ef4444":"#4ade80",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:700}}>
                        {s.comissaoPaga?"↩️ Desfazer":"✅ Pagar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>imprimirRelComissao(u)} style={{...S.btn("ghost"),width:"100%",justifyContent:"center",marginTop:10,padding:"9px",fontSize:12}}>
              🖨️ Imprimir Relatório
            </button>
          </div>
        )}
      </div>
    );
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:"#5A6080"}}>{users.length} usuário(s)</div>
        <button style={S.btn("primary")} onClick={openNew}><Icon name="plus" size={14}/> Novo Usuário</button>
      </div>
      {users.map(u=>{
        const isOpen=detailUser===u.id;
        const todasVendas=vendasDoUsuario(u);
        const comissaoPendente=(sales||[]).filter(s=>s.tipo==="atacado"&&s.vendedor===u.name&&!s.comissaoPaga).reduce((s,v)=>s+(v.comissaoValor||0),0);
        return(
          <div key={u.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid "+(u.role==="admin"?"#E8682A":"#3b82f6")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                <div style={{fontSize:22,flexShrink:0}}>{u.role==="admin"?"👑":"👤"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700}}>{u.name}</div>
                  <div style={{fontSize:11,color:"#5A6080"}}>{u.role==="admin"?"Administrador":u.role==="atacado"?"Atacado":"Vendedor"} · PIN: {"•".repeat(u.pin.length||1)}{u.comissao>0?" · "+u.comissao+"% base":""}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}}>
                <button style={{...S.btn("ghost"),padding:"6px 9px",color:"#4A5BC4"}} title="Histórico e Comissões" onClick={()=>{setDetailUser(isOpen?null:u.id);setDetailTab("historico");}}>
                  {isOpen?"▲":"📊"}
                </button>
                <button style={{...S.btn("ghost"),padding:"6px 9px"}} onClick={()=>openEdit(u)}><Icon name="edit" size={13}/></button>
                {u.id!=="admin"&&<button style={{...S.btn("danger"),padding:"6px 9px"}} onClick={()=>persistU(users.filter(x=>x.id!==u.id))}><Icon name="trash" size={13}/></button>}
              </div>
            </div>
            {/* Badges resumo */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:isOpen?0:4}}>
              {PERMS.filter(p=>u.permissions?.[p.k]).map(p=><span key={p.k} style={S.badge("#4ade80")}>{p.l}</span>)}
              {todasVendas.length>0&&<span style={S.badge("#3b82f6")}>{todasVendas.length} vendas</span>}
              {comissaoPendente>0&&<span style={S.badge("#f59e0b")}>⏳ {fmt(comissaoPendente)}</span>}
            </div>
            {isOpen&&<UserDetail u={u}/>}
          </div>
        );
      })}
      {sheet&&(
        <Sheet onClose={()=>setSheet(false)}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>{editUser?"✏️ Editar Usuário":"👤 Novo Usuário"}</div>
          <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Nome *</div><input style={S.input} value={form.name} onChange={e=>setF("name",e.target.value)} placeholder="Nome do usuário"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><div style={{...S.lbl,marginBottom:5}}>PIN (4-6 dígitos)</div><input style={S.input} type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={e=>setF("pin",e.target.value)} placeholder="1234"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>Tipo</div><select style={S.input} value={form.role} onChange={e=>setF("role",e.target.value)}><option value="vendedor">Vendedor</option><option value="atacado">Atacado</option><option value="admin">Administrador</option></select></div>
          </div>
          <div style={{marginBottom:14}}><div style={{...S.lbl,marginBottom:5}}>Comissão base (%)</div><input style={S.input} type="number" min="0" max="100" step="0.5" value={form.comissao||0} onChange={e=>setF("comissao",+e.target.value)} placeholder="0"/><div style={{fontSize:11,color:"#5A6080",marginTop:3}}>Usada quando o produto não tem comissão própria definida.</div></div>
          <div style={{fontSize:11,fontWeight:700,color:"#E8682A",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Permissões</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
            {PERMS.map(p=>(
              <button key={p.k} onClick={()=>setPerm(p.k,!form.permissions?.[p.k])} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,border:"1px solid "+(form.permissions?.[p.k]?"#4ade8050":"#1E2245"),background:form.permissions?.[p.k]?"#4ade8012":"#0A0C1E",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,color:form.permissions?.[p.k]?"#4ade80":"#6a6d80",textAlign:"left"}}>
                <div style={{width:14,height:14,borderRadius:3,border:"2px solid "+(form.permissions?.[p.k]?"#4ade80":"#252845"),background:form.permissions?.[p.k]?"#4ade80":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{form.permissions?.[p.k]&&<span style={{color:"#0A0C1E",fontSize:10,fontWeight:900}}>✓</span>}</div>
                {p.l}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={()=>setSheet(false)}>Cancelar</button>
            <button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={saveUser}><Icon name="check" size={14}/> Salvar</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ── CART DRAWER ────────────────────────────────────────────────────────────────
function CustomerSearch({customers,value,onChange,S}){
  const [q,setQ]=useState('');
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const filtered=q.trim()
    ?customers.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())||
       (c.phone||'').includes(q)||(c.cpf||'').includes(q))
    :customers;
  const selected=value==='Avulso'?null:customers.find(c=>c.name===value);
  useEffect(()=>{
    const handler=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[]);
  return(
    <div ref={ref} style={{position:'relative',marginBottom:12}}>
      <div
        onClick={()=>{setOpen(!open);setQ('');}}
        style={{...S.input,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',userSelect:'none'}}
      >
        <span style={{color:selected?'#e8e9f0':'#5A6080'}}>
          {selected?selected.name:'— Cliente Avulso —'}
        </span>
        <span style={{fontSize:10,color:'#5A6080'}}>▼</span>
      </div>
      {open&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:999,background:'#0F1220',border:'1px solid #1E2245',borderRadius:10,maxHeight:260,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          <input
            autoFocus
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="🔍 Buscar cliente..."
            style={{width:'100%',padding:'10px 14px',background:'#151830',border:'none',borderBottom:'1px solid #1E2245',color:'#e8e9f0',fontSize:13,outline:'none',boxSizing:'border-box'}}
          />
          <div style={{overflowY:'auto',maxHeight:200}}>
            <div
              onClick={()=>{onChange('Avulso');setOpen(false);}}
              style={{padding:'10px 14px',cursor:'pointer',fontSize:13,color:'#5A6080',borderBottom:'1px solid #1E2245',background:value==='Avulso'?'#1E2245':'transparent'}}
            >— Cliente Avulso —</div>
            {filtered.slice(0,50).map(c=>(
              <div
                key={c.id}
                onClick={()=>{onChange(c.name);setOpen(false);setQ('');}}
                style={{padding:'10px 14px',cursor:'pointer',fontSize:13,color:'#e8e9f0',borderBottom:'1px solid #1E2245',background:value===c.name?'#1E2245':'transparent'}}
              >
                <div style={{fontWeight:600}}>{c.name}</div>
                {c.phone&&<div style={{fontSize:11,color:'#5A6080'}}>{c.phone}</div>}
              </div>
            ))}
            {filtered.length===0&&<div style={{padding:'12px 14px',color:'#5A6080',fontSize:13}}>Nenhum cliente encontrado</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function CartDrawer({S,cart,customers,products,saleCustomer,setSaleCustomer,salePayment,setSalePayment,chgQty,rmCart,cartTotal,onFinalize,onFinalizeEntrega,onClose,onUpdateProduct}){
  const [isEntrega,setIsEntrega]=useState(false);
  const [avNome,setAvNome]=useState("");const [avRua,setAvRua]=useState("");const [avNum,setAvNum]=useState("");
  const [avBairro,setAvBairro]=useState("");const [avCidade,setAvCidade]=useState("");const [avObs,setAvObs]=useState("");
  const [editItem,setEditItem]=useState(null);
  const [editNome,setEditNome]=useState("");const [editPreco,setEditPreco]=useState("");const [editQty,setEditQty]=useState("");const [editTotal,setEditTotal]=useState("");const [modoTotal,setModoTotal]=useState(false);
  const [infoItem,setInfoItem]=useState(null);const [editPV,setEditPV]=useState("");const [editandoPV,setEditandoPV]=useState(false);const [editInfoName,setEditInfoName]=useState(false);const [infoNameVal,setInfoNameVal]=useState("");
  const isAvulso=saleCustomer==="Avulso";
  const cliObj=customers.find(c=>c.name===saleCustomer);
  const endFmt=cliObj?[cliObj.rua&&(cliObj.rua+(cliObj.numero?", "+cliObj.numero:"")),cliObj.bairro,cliObj.cidade&&(cliObj.cidade+(cliObj.uf?" - "+cliObj.uf:"")),cliObj.cep&&("CEP: "+cliObj.cep)].filter(Boolean).join(" · "):"";
  const openEdit=(item)=>{setEditItem(item.id);setEditNome(item.name);setEditPreco(String(item.price));setEditQty(String(item.qty));setEditTotal(String(+(item.price*item.qty).toFixed(2)));setModoTotal(false);};
  const closeEdit=()=>setEditItem(null);
  const confirmEdit=()=>{
    const p=parseFloat(editPreco)||0;let q;if(modoTotal){const t=parseFloat(editTotal)||0;q=p>0?+(t/p).toFixed(3):1;}else{q=parseFloat(editQty)||1;}
    if(p<=0||q<=0){closeEdit();return;}
    const novoNome=editNome.trim();const orig=cart.find(i=>i.id===editItem);
    chgQty(editItem,0,{name:novoNome||undefined,price:p,qty:q});
    if(orig&&onUpdateProduct){const changed=(novoNome&&novoNome!==orig.name)||p!==orig.price;if(changed)onUpdateProduct(editItem,{name:novoNome||orig.name,price:p});}
    closeEdit();
  };
  const handleEntrega=()=>{if(isAvulso&&!avNome.trim()){document.getElementById("avNomeInput")?.focus();return;}const parts=[];if(isAvulso){if(avRua)parts.push(avRua+(avNum?", "+avNum:""));if(avBairro)parts.push(avBairro);if(avCidade)parts.push(avCidade);}onFinalizeEntrega(isAvulso?parts.join(" · "):endFmt,isAvulso?avNome.trim():saleCustomer,avObs.trim());};
  const getProd=(item)=>products?products.find(p=>p.id===item.id):null;
  return(<Sheet onClose={onClose}>
    <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>🛒 Carrinho</div>
    <div style={{marginBottom:14}}>
      <div style={{...S.lbl,marginBottom:6}}>Cliente</div>
      <CustomerSearch customers={customers} value={saleCustomer} onChange={setSaleCustomer} S={S}/>
      <div style={{...S.lbl,marginBottom:6}}>Pagamento</div>
      <select style={S.input} value={salePayment} onChange={e=>setSalePayment(e.target.value)}>{["Dinheiro","Cartão Débito","Cartão Crédito","Pix","Vale Refeição","A Prazo"].map(m=><option key={m}>{m}</option>)}</select>
    </div>
    <div style={{maxHeight:"30dvh",overflowY:"auto",marginBottom:6}}>
      {cart.length===0?<div style={{color:"#3a3d50",textAlign:"center",padding:"20px 0",fontSize:13}}>Carrinho vazio</div>
        :cart.map(item=>(<div key={item.id}>
          {editItem===item.id?(
            <div style={{padding:"12px 0",borderBottom:"1px solid #1a1c26"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#E8682A",marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>✏️ Editando item</div>
              <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Nome</div><input style={{...S.input,fontSize:13}} value={editNome} onChange={e=>setEditNome(e.target.value)}/></div>
              <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Preço Unitário (R$)</div><input style={{...S.input,fontSize:13}} type="number" step="0.01" min="0" value={editPreco} onChange={e=>{setEditPreco(e.target.value);const p=parseFloat(e.target.value)||0;const q=parseFloat(editQty)||1;setEditTotal(String(+(p*q).toFixed(2)));}}/></div>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <button onClick={()=>setModoTotal(false)} style={{flex:1,padding:"7px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:!modoTotal?"#E8682A":"#1E2245",color:!modoTotal?"#fff":"#6a6d80"}}>Por Quantidade</button>
                <button onClick={()=>setModoTotal(true)} style={{flex:1,padding:"7px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,background:modoTotal?"#4ade80":"#1E2245",color:modoTotal?"#0A0C1E":"#6a6d80"}}>Por Valor Total</button>
              </div>
              {modoTotal?(
                <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Valor Total (R$)</div><input style={{...S.input,fontSize:15,fontWeight:700,border:"1px solid #4ade8060"}} type="number" step="0.01" min="0" value={editTotal} onChange={e=>setEditTotal(e.target.value)}/>{parseFloat(editPreco)>0&&parseFloat(editTotal)>0&&<div style={{fontSize:12,color:"#4ade80",marginTop:4}}>Qtd calculada: {+(parseFloat(editTotal)/parseFloat(editPreco)).toFixed(3)} unid.</div>}</div>
              ):(
                <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Quantidade (aceita decimal: 1,5 kg)</div><input style={{...S.input,fontSize:15,fontWeight:700,border:"1px solid #E8682A60"}} type="number" step="0.001" min="0.001" value={editQty} onChange={e=>{setEditQty(e.target.value);const p=parseFloat(editPreco)||0;const q=parseFloat(e.target.value)||0;setEditTotal(String(+(p*q).toFixed(2)));}} />{parseFloat(editPreco)>0&&parseFloat(editQty)>0&&<div style={{fontSize:12,color:"#E8682A",marginTop:4}}>Total: {fmt(parseFloat(editPreco)*parseFloat(editQty))}</div>}</div>
              )}
              <div style={{display:"flex",gap:8}}><button onClick={closeEdit} style={{...S.btn("ghost"),flex:1,justifyContent:"center",fontSize:13}}>Cancelar</button><button onClick={confirmEdit} style={{...S.btn("primary"),flex:1,justifyContent:"center",fontSize:13}}><Icon name="check" size={13}/> Confirmar</button></div>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 0",borderBottom:"1px solid #1a1c26"}}>
              <button onClick={()=>{setInfoItem(item);setEditPV(String(item.price));setEditandoPV(false);}} style={{width:24,height:24,borderRadius:12,background:"#1E2245",border:"1px solid #2a2d3a",color:"#5A6080",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>
              <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>openEdit(item)}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div style={{fontSize:12,color:"#E8682A"}}>{fmt(item.price)} × {item.qty%1!==0?item.qty.toFixed(3).replace(/\.?0+$/,""):item.qty} = {fmt(item.price*item.qty)}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                <button onClick={()=>chgQty(item.id,-1)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:17}}>−</button>
                <span onClick={()=>openEdit(item)} style={{minWidth:28,textAlign:"center",fontWeight:700,fontSize:14,cursor:"pointer"}}>{item.qty%1!==0?item.qty.toFixed(2).replace(/\.?0+$/,""):item.qty}</span>
                <button onClick={()=>chgQty(item.id,+1)} style={{...S.btn("ghost"),padding:"4px 9px",fontSize:17}}>+</button>
              </div>
              <button onClick={()=>rmCart(item.id)} style={{...S.btn("danger"),padding:"6px 8px",flexShrink:0}}><Icon name="x" size={13}/></button>
            </div>
          )}
        </div>))}
    </div>
    {/* Toggle entrega */}
    <div style={{borderTop:"1px solid #1e2232",paddingTop:14,marginTop:4}}>
      <button onClick={()=>setIsEntrega(e=>!e)} style={{width:"100%",padding:"12px 14px",borderRadius:12,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"space-between",background:isEntrega?"linear-gradient(135deg,#0f2744,#0f1e3d)":"#1E2245",border:"1px solid "+(isEntrega?"#3b82f660":"#1E2245"),transition:"all .2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Icon name="truck" size={17} color={isEntrega?"#3b82f6":"#6a6d80"}/><div style={{textAlign:"left"}}><div style={{color:isEntrega?"#60a5fa":"#8a8da0",fontSize:13,fontWeight:700}}>Criar Pedido de Entrega</div><div style={{color:isEntrega?"#3b82f690":"#5A6080",fontSize:11,fontWeight:400}}>{isEntrega?"✓ Ativo":"Toque para ativar"}</div></div></div>
        <div style={{width:42,height:24,borderRadius:12,position:"relative",flexShrink:0,background:isEntrega?"#3b82f6":"#252845",transition:"background .2s"}}><div style={{width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:3,left:isEntrega?21:3,transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.4)"}}/></div>
      </button>
      {isEntrega&&isAvulso&&(<div style={{marginTop:12,padding:14,background:"#0A0C1E",border:"1px solid #3b82f630",borderRadius:12}}>
        <div style={{fontSize:11,fontWeight:700,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📋 Dados do Destinatário</div>
        <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5,color:"#60a5fa"}}>Nome *</div><input id="avNomeInput" style={{...S.input,border:"1px solid "+(avNome.trim()?"#3b82f650":"#1E2245")}} placeholder="Nome completo" value={avNome} onChange={e=>setAvNome(e.target.value)}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:10}}><div><div style={{...S.lbl,marginBottom:5}}>Rua / Av.</div><input style={S.input} placeholder="Rua das Flores" value={avRua} onChange={e=>setAvRua(e.target.value)}/></div><div><div style={{...S.lbl,marginBottom:5}}>Nº</div><input style={S.input} placeholder="471" value={avNum} onChange={e=>setAvNum(e.target.value)}/></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><div><div style={{...S.lbl,marginBottom:5}}>Bairro</div><input style={S.input} placeholder="Centro" value={avBairro} onChange={e=>setAvBairro(e.target.value)}/></div><div><div style={{...S.lbl,marginBottom:5}}>Cidade</div><input style={S.input} placeholder="Divinópolis" value={avCidade} onChange={e=>setAvCidade(e.target.value)}/></div></div>
        <div><div style={{...S.lbl,marginBottom:5}}>Observação</div><textarea style={{...S.input,height:60,resize:"none",verticalAlign:"top",fontSize:13,lineHeight:1.4}} placeholder="Ex: Ligar antes, portão azul..." value={avObs} onChange={e=>setAvObs(e.target.value)}/></div>
      </div>)}
      {isEntrega&&!isAvulso&&(<div style={{marginTop:12,padding:14,background:"#0A0C1E",border:"1px solid #3b82f630",borderRadius:12}}>
        <div style={{fontSize:11,fontWeight:700,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📋 Dados da Entrega</div>
        {endFmt?<div style={{display:"flex",gap:7,marginBottom:12,padding:"8px 10px",background:"#0F1220",border:"1px solid #1a1c2e",borderRadius:8}}><Icon name="mapPin" size={13} color="#3b82f6"/><span style={{fontSize:12,color:"#6a6d80",lineHeight:1.5}}>{endFmt}</span></div>:<div style={{marginBottom:12,padding:"8px 10px",background:"#0F1220",border:"1px solid #f59e0b30",borderRadius:8,fontSize:12,color:"#f59e0b"}}>⚠️ Sem endereço cadastrado.</div>}
        <div><div style={{fontSize:11,color:"#5A6080",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Observação <span style={{color:"#252845",fontWeight:400}}>(opcional)</span></div><textarea style={{...S.input,height:60,resize:"none",verticalAlign:"top",fontSize:13,lineHeight:1.4}} placeholder="Ex: Ligar antes, portão azul..." value={avObs} onChange={e=>setAvObs(e.target.value)}/></div>
      </div>)}
    </div>
    {/* Total + botões */}
    <div style={{paddingTop:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{color:"#7a7d8e"}}>Total</span><span style={{fontSize:26,fontWeight:800,color:"#4ade80"}}>{fmt(cartTotal)}</span></div>
      {isEntrega?(
        <button onClick={handleEntrega} disabled={isAvulso&&!avNome.trim()} style={{...S.btn("primary"),width:"100%",padding:"15px",fontSize:15,justifyContent:"center",borderRadius:14,background:(isAvulso&&!avNome.trim())?"#1E2245":"linear-gradient(135deg,#3b82f6,#2563eb)",color:(isAvulso&&!avNome.trim())?"#5A6080":"#fff",boxShadow:(isAvulso&&!avNome.trim())?"none":"0 6px 24px rgba(59,130,246,.4)",cursor:(isAvulso&&!avNome.trim())?"not-allowed":"pointer"}}>
          <Icon name="truck" size={16}/>{isAvulso&&!avNome.trim()?"Informe o nome para continuar":"Finalizar + Criar Entrega"}
        </button>
      ):(
        <button onClick={onFinalize} style={{...S.btn("primary"),width:"100%",padding:"15px",fontSize:15,justifyContent:"center",borderRadius:14,boxShadow:"0 6px 24px rgba(255,107,53,.35)"}}><Icon name="check" size={16}/> Finalizar Venda</button>
      )}
      {cart.length>0&&<button onClick={()=>rmCart("__all__")} style={{...S.btn("danger"),width:"100%",padding:"10px",fontSize:12,justifyContent:"center",marginTop:8,borderRadius:10}}>Limpar Carrinho</button>}
    </div>
    {/* Modal "?" */}
    {infoItem&&(
      <div style={{position:"fixed",inset:0,zIndex:4000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)"}} onClick={()=>{setInfoItem(null);setEditandoPV(false);}}/>
        <div style={{position:"relative",background:"#0F1220",borderRadius:"20px 20px 0 0",border:"1px solid #1e2232",width:"100%",maxWidth:480,padding:"20px 20px 36px",maxHeight:"85dvh",overflowY:"auto"}}>
          <div style={{width:36,height:4,background:"#252845",borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            {editInfoName?(
              <input autoFocus style={{...S.input,fontSize:15,fontWeight:800,flex:1}} value={infoNameVal} onChange={e=>setInfoNameVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&infoNameVal.trim()){onUpdateProduct(infoItem.id,{name:infoNameVal.trim()});setInfoItem(i=>({...i,name:infoNameVal.trim()}));setEditInfoName(false);}}}/>
            ):(
              <div style={{fontSize:15,fontWeight:800,flex:1}}>ℹ️ {infoItem.name}</div>
            )}
            <button onClick={()=>{if(editInfoName&&infoNameVal.trim()){onUpdateProduct(infoItem.id,{name:infoNameVal.trim()});setInfoItem(i=>({...i,name:infoNameVal.trim()}));}setEditInfoName(!editInfoName);setInfoNameVal(infoItem.name);}} style={{...S.btn(editInfoName?"primary":"ghost"),padding:"5px 9px",flexShrink:0,fontSize:11}}>{editInfoName?"✓ Ok":"✏️"}</button>
          </div>
          {(()=>{
            const p=getProd(infoItem);const precoAtual=parseFloat(editPV)||infoItem.price;
            const margem=p?.costPrice>0?(((precoAtual-p.costPrice)/p.costPrice)*100).toFixed(1):null;
            return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {/* Preço de venda editável */}
              <div style={{...S.card,padding:12,gridColumn:"1/-1",border:"1px solid #E8682A40"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{...S.lbl,fontSize:10}}>Preço de Venda</div>
                  <button onClick={()=>{setEditandoPV(!editandoPV);setEditPV(String(infoItem.price));}} style={{...S.btn(editandoPV?"danger":"ghost"),padding:"4px 10px",fontSize:11}}>{editandoPV?"✕ Cancelar":"✏️ Editar"}</button>
                </div>
                {editandoPV?(
                  <div>
                    <input autoFocus type="number" step="0.01" min="0" style={{...S.input,fontSize:20,fontWeight:800,color:"#E8682A",border:"1px solid #E8682A60",marginBottom:6}} value={editPV} onChange={e=>setEditPV(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){const np=parseFloat(editPV);if(np>0&&onUpdateProduct){onUpdateProduct(infoItem.id,{price:np});chgQty(infoItem.id,0,{price:np});setInfoItem(i=>({...i,price:np}));setEditandoPV(false);}}}}/>
                    {p?.costPrice>0&&parseFloat(editPV)>0&&<div style={{fontSize:12,color:"#4A5BC4",marginBottom:6}}>Nova margem: {(((parseFloat(editPV)-p.costPrice)/p.costPrice)*100).toFixed(1)}%</div>}
                    <button onClick={()=>{const np=parseFloat(editPV);if(np>0&&onUpdateProduct){onUpdateProduct(infoItem.id,{price:np});chgQty(infoItem.id,0,{price:np});setInfoItem(i=>({...i,price:np}));setEditandoPV(false);}}} style={{...S.btn("primary"),width:"100%",justifyContent:"center",padding:"10px"}}><Icon name="check" size={14}/> Salvar novo preço</button>
                  </div>
                ):(
                  <div style={{fontSize:22,fontWeight:800,color:"#E8682A"}}>{fmt(infoItem.price)}</div>
                )}
              </div>
              <div style={{...S.card,padding:12}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Preço de Custo</div><div style={{fontSize:18,fontWeight:800,color:p?.costPrice>0?"#4ade80":"#3a3d50"}}>{p?.costPrice>0?fmt(p.costPrice):"—"}</div></div>
              <div style={{...S.card,padding:12}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Margem de Lucro</div><div style={{fontSize:18,fontWeight:800,color:margem?"#4A5BC4":"#3a3d50"}}>{margem?margem+"%":"—"}</div></div>
              <div style={{...S.card,padding:12}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Estoque Atual</div><div style={{fontSize:16,fontWeight:800,color:p?.stock>0?"#a78bfa":"#ff3b3b"}}>{p?p.stock+" "+(p.unit||"unid"):"—"}</div></div>
              <div style={{...S.card,padding:12}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Entrada no Estoque</div><div style={{fontSize:12,fontWeight:600,color:"#6a6d80"}}>{p?.createdAt?new Date(p.createdAt).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}):"—"}</div></div>
              {p?.description&&<div style={{...S.card,padding:12,gridColumn:"1/-1"}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Descrição</div><div style={{fontSize:12,color:"#6a6d80"}}>{p.description}</div></div>}
              {p?.barcode&&<div style={{...S.card,padding:12,gridColumn:"1/-1"}}><div style={{...S.lbl,fontSize:10,marginBottom:4}}>Código de Barras</div><div style={{fontSize:13,fontFamily:"monospace",color:"#4A5BC4"}}>{p.barcode}</div></div>}
            </div>);
          })()}
          <button onClick={()=>{setInfoItem(null);setEditandoPV(false);}} style={{...S.btn("ghost"),width:"100%",justifyContent:"center",marginTop:16,padding:"12px"}}>Fechar</button>
        </div>
      </div>
    )}
  </Sheet>);}


// ── VENDA ATACADO ─────────────────────────────────────────────────────────────
function AtacadoPage({S,products,customers,persistP,persistS,persistC,persistE,sales,notify,currentUser}){
  const [items,setItems]=useState([]);
  const [photoModal,setPhotoModal]=useState(null);
  const [search,setSearch]=useState("");
  const [filterCat,setFilterCat]=useState("Todos");
  const [step,setStep]=useState("grid"); // grid | edit | finalizar
  const [editingId,setEditingId]=useState(null);
  // Finalizar form
  const [cliente,setCliente]=useState("Avulso");
  const [payment,setPayment]=useState("Dinheiro");
  const [desconto,setDesconto]=useState(0);
  const [obs,setObs]=useState("");
  const [pagamento,setPagamento]=useState("pago");
  // Entrega
  const [avNome,setAvNome]=useState("");const [avRua,setAvRua]=useState("");const [avNum,setAvNum]=useState("");
  const [avBairro,setAvBairro]=useState("");const [avCidade,setAvCidade]=useState("");const [avObs,setAvObs]=useState("");

  const comissao=currentUser?.comissao||0;
  // Calcula comissão total: usa comissaoProd do produto se definida, senão comissão do usuário
  const calcComissaoItem=(item)=>{
    const rate=item.comissaoProd>0?item.comissaoProd:comissao;
    return item.precoUnit*(1-(item.descItem||0)/100)*item.qty*rate/100;
  };
  const cats=["Todos",...Array.from(new Set(products.map(p=>p.category)))];
  const filtered=products.filter(p=>p.stock>0
    &&p.atacadoHabilitado===true // só produtos habilitados para atacado
    &&(filterCat==="Todos"||p.category===filterCat)
    &&p.name.toLowerCase().includes(search.toLowerCase()));
  const addItem=(p)=>{
    setItems(prev=>{const ex=prev.find(i=>i.id===p.id);if(ex)return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1,precoUnit:p.priceAtacado||p.price,descItem:0,comissaoProd:p.comissaoProd||0}];});
    notify(p.name+" ✓","info");
  };
  const updateItem=(id,k,v)=>setItems(prev=>prev.map(i=>i.id===id?{...i,[k]:v}:i));
  const removeItem=(id)=>setItems(prev=>prev.filter(i=>i.id!==id));
  const subtotal=items.reduce((s,i)=>s+(i.precoUnit*(1-(i.descItem||0)/100))*i.qty,0);
  const total=subtotal*(1-desconto/100);
  const comissaoValor=items.reduce((s,i)=>s+calcComissaoItem(i),0)*(1-desconto/100);

  const isAvulso=cliente==="Avulso";
  const cliObj=customers.find(c=>c.name===cliente);
  const endCli=cliObj?[cliObj.rua&&(cliObj.rua+(cliObj.numero?", "+cliObj.numero:"")),cliObj.bairro,cliObj.cidade&&(cliObj.cidade+(cliObj.uf?" - "+cliObj.uf:""))].filter(Boolean).join(" · "):"";

  const finalizar=()=>{
    if(items.length===0){notify("Adicione produtos!","error");return;}
    if(isAvulso&&!avNome.trim()){notify("Informe o nome do destinatário!","error");return;}
    const saleId=uid();
    const saleItems=items.map(i=>({name:i.name,qty:i.qty,price:i.precoUnit*(1-(i.descItem||0)/100),comissaoProd:i.comissaoProd||0,comissaoItem:calcComissaoItem(i)}));
    const newSale={id:saleId,customer:isAvulso?avNome.trim():cliente,items:saleItems,total,payment,date:todayStr(),time:nowTime(),createdAt:Date.now(),tipo:"atacado",desconto,comissao,comissaoValor,vendedor:currentUser?.name||"",obs};
    persistS([newSale,...sales]);
    persistP(products.map(p=>{const ci=items.find(i=>i.id===p.id);return ci?{...p,stock:Math.max(0,p.stock-ci.qty)}:p;}));
    if(!isAvulso)persistC(customers.map(c=>c.name===cliente?{...c,purchases:c.purchases+1,totalSpent:c.totalSpent+total,lastVisit:todayStr()}:c));
    // Cria pedido de entrega automaticamente
    const pedidosAtuais=pedidos||[];
    const enderecoEntrega=isAvulso?[avRua&&(avRua+(avNum?", "+avNum:"")),avBairro,avCidade].filter(Boolean).join(" · "):endCli;
    const novoPedido={id:uid(),numero:"PED-"+String(pedidosAtuais.length+1).padStart(4,"0"),cliente:isAvulso?avNome.trim():cliente,telefone:cliObj?.phone||"",endereco:enderecoEntrega,itens:saleItems,total,obs:avObs||obs,pagamento,status:"pedido",isPrazo:payment==="A Prazo",tipo:"atacado",criadoEm:Date.now(),criadoData:todayStr(),criadoHora:nowTime(),vendaId:saleId};
    persistE([novoPedido,...pedidosAtuais]);
    notify("Venda atacado finalizada! Entrega criada: "+novoPedido.numero+(comissao>0?" · Comissão: "+fmt(comissaoValor):"")+" ✓");
    setItems([]);setCliente("Avulso");setDesconto(0);setObs("");setPagamento("pago");
    setAvNome("");setAvRua("");setAvNum("");setAvBairro("");setAvCidade("");setAvObs("");
    setStep("grid");
  };

  // ── STEP: GRID (igual PDV) ──────────────────────────────────────────────────
  if(step==="grid") return(
    <div>
      <div style={{...S.card,marginBottom:12,padding:"10px 14px",borderColor:"#f59e0b30",background:"linear-gradient(135deg,#1a1200,#0f1117)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#f59e0b"}}>📦 Venda Atacado</div>
          <div style={{fontSize:11,color:"#6a6d80",marginTop:2}}>Comissão: <b style={{color:"#4ade80"}}>{comissao}%</b></div>
        </div>
        {items.length>0&&(
          <button onClick={()=>setStep("edit")} style={{...S.btn("primary"),padding:"9px 14px",fontSize:13,borderRadius:20}}>
            <Icon name="cart" size={14}/> {items.length} · {fmt(total)}
          </button>
        )}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <div style={{position:"relative",flex:1}}>
          <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div>
          <input style={{...S.input,paddingLeft:34}} placeholder="Buscar produto..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5A6080",cursor:"pointer",fontSize:18}}>×</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:2,scrollbarWidth:"none"}}>
        {cats.map(cat=><button key={cat} onClick={()=>setFilterCat(cat)} style={{...S.btn(filterCat===cat?"primary":"ghost"),padding:"7px 13px",fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>{cat}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {filtered.map(prod=>{const inCart=items.find(i=>i.id===prod.id);return(
          <div key={prod.id} onClick={()=>addItem(prod)} style={{background:"#0F1220",border:"1px solid "+(inCart?"#f59e0b":"#1E2245"),borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"border-color .15s",position:"relative",userSelect:"none",WebkitTapHighlightColor:"transparent"}} onTouchStart={e=>e.currentTarget.style.transform="scale(.96)"} onTouchEnd={e=>e.currentTarget.style.transform="none"}>
            {prod.photo
  ?<div style={{width:"100%",height:80,overflow:"hidden",background:"#0a0c14",cursor:"zoom-in",position:"relative"}} onClick={e=>{e.stopPropagation();setPhotoModal(prod);}}>
    <img src={prod.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
    <div style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,.55)",borderRadius:6,padding:"2px 6px",fontSize:10,color:"#fff"}}>🔍</div>
  </div>
  :<div style={{width:"100%",height:6,background:"#0a0c14"}}/>
}
            <div style={{padding:10}}>
              {inCart&&<div style={{position:"absolute",top:6,right:6,background:"#f59e0b",color:"#000",borderRadius:20,fontSize:11,fontWeight:800,padding:"1px 7px",zIndex:1}}>{inCart.qty}</div>}
              <div style={{fontSize:10,color:"#5A6080",marginBottom:2}}>{prod.category}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4,lineHeight:1.3}}>{prod.name}</div>
              <div style={{fontSize:15,fontWeight:800,color:"#f59e0b"}}>{fmt(prod.priceAtacado||prod.price)}</div>
              <div style={{fontSize:11,marginTop:2,color:prod.stock<10?"#F07030":"#5A6080"}}>{prod.stock} {prod.unit||"unid"}</div>
            </div>
          </div>
        );})}
      </div>
      {items.length>0&&(
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:100,width:"calc(100% - 32px)",maxWidth:440}}>
          <button onClick={()=>setStep("edit")} style={{...S.btn("primary"),width:"100%",padding:"15px",fontSize:15,justifyContent:"center",borderRadius:16,background:"linear-gradient(135deg,#f59e0b,#d97706)",boxShadow:"0 6px 28px rgba(245,158,11,.4)"}}>
            <Icon name="cart" size={18}/> {items.length} ite{items.length>1?"ns":"m"} · {fmt(total)}
          </button>
        </div>
      )}
      {photoModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setPhotoModal(null)}>
          <img src={photoModal.photo} style={{maxWidth:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:14,boxShadow:"0 8px 48px rgba(0,0,0,.8)"}} alt=""/>
          <div style={{marginTop:16,color:"#e8e9f0",fontSize:16,fontWeight:700,textAlign:"center"}}>{photoModal.name}</div>
          <div style={{color:"#f59e0b",fontSize:20,fontWeight:800,marginTop:4}}>{fmt(photoModal.priceAtacado||photoModal.price)}</div>
          <div style={{fontSize:12,color:"#5A6080",marginTop:8}}>Toque para fechar</div>
        </div>
      )}
    </div>
  );

  // ── STEP: EDIT ITEMS ───────────────────────────────────────────────────────
  if(step==="edit") return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setStep("grid")} style={{...S.btn("ghost"),padding:"8px 12px"}}>← Produtos</button>
        <div style={{fontSize:15,fontWeight:700,flex:1}}>Revisar Pedido</div>
        <button onClick={()=>setStep("finalizar")} style={{...S.btn("primary"),padding:"9px 14px",fontSize:13}}>Finalizar →</button>
      </div>
      {items.map(item=>(
        <div key={item.id} style={{...S.card,marginBottom:8,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,flex:1,marginRight:8}}>{item.name}</div>
            <button onClick={()=>removeItem(item.id)} style={{...S.btn("danger"),padding:"4px 7px"}}><Icon name="x" size={12}/></button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 72px",gap:8}}>
            <div><div style={{...S.lbl,marginBottom:3,fontSize:9}}>Qtd</div><input style={{...S.input,padding:"7px 10px",fontSize:13}} type="number" min="0.1" step="0.1" value={item.qty} onChange={e=>updateItem(item.id,"qty",+e.target.value)}/></div>
            <div><div style={{...S.lbl,marginBottom:3,fontSize:9}}>Preço Unit. R$</div><input style={{...S.input,padding:"7px 10px",fontSize:13}} type="number" step="0.01" min="0" value={item.precoUnit} onChange={e=>updateItem(item.id,"precoUnit",+e.target.value)}/></div>
            <div><div style={{...S.lbl,marginBottom:3,fontSize:9}}>Desc. %</div><input style={{...S.input,padding:"7px 10px",fontSize:13}} type="number" min="0" max="100" value={item.descItem||0} onChange={e=>updateItem(item.id,"descItem",+e.target.value)}/></div>
          </div>
          <div style={{fontSize:11,color:"#4ade80",marginTop:5,textAlign:"right",fontWeight:700}}>= {fmt(item.precoUnit*(1-(item.descItem||0)/100)*item.qty)}</div>
        </div>
      ))}
      <div style={{...S.card,padding:14,marginTop:4}}>
        <div style={{...S.lbl,marginBottom:6}}>Desconto Geral (%)</div>
        <input style={{...S.input,marginBottom:10}} type="number" min="0" max="100" value={desconto} onChange={e=>setDesconto(+e.target.value)} placeholder="0"/>
        {desconto>0&&<div style={{fontSize:12,color:"#f59e0b",marginBottom:8}}>Desconto: -{fmt(subtotal*desconto/100)}</div>}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:800,color:"#4ade80"}}><span>TOTAL</span><span>{fmt(total)}</span></div>
        {comissao>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#4A5BC4",marginTop:6}}><span>Sua comissão ({comissao}%)</span><span style={{fontWeight:700}}>{fmt(comissaoValor)}</span></div>}
      </div>
      <button onClick={()=>setStep("finalizar")} style={{...S.btn("primary"),width:"100%",justifyContent:"center",padding:"14px",fontSize:15,marginTop:12,borderRadius:14,background:"linear-gradient(135deg,#f59e0b,#d97706)",boxShadow:"0 6px 24px rgba(245,158,11,.35)"}}>
        Finalizar Pedido → {fmt(total)}
      </button>
    </div>
  );

  // ── STEP: FINALIZAR (entrega obrigatória) ───────────────────────────────────
  return(
    <div>
      <button onClick={()=>setStep("edit")} style={{...S.btn("ghost"),marginBottom:14}}>← Voltar</button>
      <div style={{...S.card,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:"#f59e0b",marginBottom:12}}>📋 Dados do Pedido</div>
        <div style={{...S.lbl,marginBottom:5}}>Cliente</div>
        <CustomerSearch customers={customers} value={cliente} onChange={setCliente} S={S}/>
        <div style={{...S.lbl,marginBottom:5}}>Pagamento</div>
        <select style={{...S.input,marginBottom:10}} value={payment} onChange={e=>setPayment(e.target.value)}>
          {["Dinheiro","Cartão Débito","Cartão Crédito","Pix","Boleto","A Prazo"].map(m=><option key={m}>{m}</option>)}
        </select>
        <div style={{...S.lbl,marginBottom:5}}>Situação do Pagamento</div>
        <select style={{...S.input,marginBottom:10}} value={pagamento} onChange={e=>setPagamento(e.target.value)}>
          <option value="pago">✅ Pago</option>
          <option value="troco">💵 Levar Troco</option>
          <option value="maquina">📲 Levar Máquina</option>
          <option value="troco_maquina">💵📲 Levar Troco + Máquina</option>
        </select>
        <div style={{...S.lbl,marginBottom:5}}>Observação</div>
        <textarea style={{...S.input,height:52,resize:"none",verticalAlign:"top",fontSize:13}} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Obs do pedido..."/>
      </div>
      {/* Dados de entrega — obrigatório */}
      <div style={{...S.card,marginBottom:12,border:"1px solid #3b82f650",background:"linear-gradient(135deg,#0f2744,#0f1117)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#60a5fa",marginBottom:12}}>🚚 Endereço de Entrega</div>
        {isAvulso?(
          <>
            <div style={{...S.lbl,marginBottom:5,color:"#60a5fa"}}>Nome do Destinatário *</div>
            <input style={{...S.input,marginBottom:10,border:"1px solid "+(avNome.trim()?"#3b82f650":"#1E2245")}} placeholder="Nome completo" value={avNome} onChange={e=>setAvNome(e.target.value)}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:8,marginBottom:10}}>
              <div><div style={{...S.lbl,marginBottom:4}}>Rua / Av.</div><input style={S.input} placeholder="Rua das Flores" value={avRua} onChange={e=>setAvRua(e.target.value)}/></div>
              <div><div style={{...S.lbl,marginBottom:4}}>Nº</div><input style={S.input} placeholder="100" value={avNum} onChange={e=>setAvNum(e.target.value)}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div><div style={{...S.lbl,marginBottom:4}}>Bairro</div><input style={S.input} placeholder="Centro" value={avBairro} onChange={e=>setAvBairro(e.target.value)}/></div>
              <div><div style={{...S.lbl,marginBottom:4}}>Cidade</div><input style={S.input} placeholder="Divinópolis" value={avCidade} onChange={e=>setAvCidade(e.target.value)}/></div>
            </div>
          </>
        ):(
          <div style={{padding:"10px 12px",background:"#0A0C1E",border:"1px solid #1a1c2e",borderRadius:8,fontSize:12,color:"#6a6d80",marginBottom:10}}>
            {endCli?<><Icon name="mapPin" size={12} color="#3b82f6"/> {endCli}</>:<span style={{color:"#f59e0b"}}>⚠️ Sem endereço cadastrado para este cliente.</span>}
          </div>
        )}
        <div><div style={{...S.lbl,marginBottom:4}}>Observação da Entrega</div><textarea style={{...S.input,height:52,resize:"none",verticalAlign:"top",fontSize:13}} placeholder="Ex: Ligar antes, portão azul..." value={avObs} onChange={e=>setAvObs(e.target.value)}/></div>
      </div>
      {/* Resumo */}
      <div style={{...S.card,marginBottom:14,padding:12}}>
        {items.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #14161e",fontSize:12}}><span>{i.qty}× {i.name}{i.descItem>0?" (-"+i.descItem+"%)":""}</span><span style={{fontWeight:700}}>{fmt(i.precoUnit*(1-(i.descItem||0)/100)*i.qty)}</span></div>)}
        {desconto>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,color:"#f59e0b"}}><span>Desconto ({desconto}%)</span><span>-{fmt(subtotal*desconto/100)}</span></div>}
        <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,fontSize:16,fontWeight:800,color:"#4ade80"}}><span>TOTAL</span><span>{fmt(total)}</span></div>
        {comissao>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#4A5BC4",marginTop:4}}><span>Comissão ({comissao}%)</span><span style={{fontWeight:700}}>{fmt(comissaoValor)}</span></div>}
      </div>
      <button onClick={finalizar} disabled={isAvulso&&!avNome.trim()} style={{...S.btn("primary"),width:"100%",justifyContent:"center",padding:"15px",fontSize:15,borderRadius:14,background:(isAvulso&&!avNome.trim())?"#1E2245":"linear-gradient(135deg,#f59e0b,#d97706)",color:(isAvulso&&!avNome.trim())?"#5A6080":"#000",fontWeight:800,boxShadow:(isAvulso&&!avNome.trim())?"none":"0 6px 24px rgba(245,158,11,.4)",cursor:(isAvulso&&!avNome.trim())?"not-allowed":"pointer"}}>
        <Icon name="check" size={16}/> {isAvulso&&!avNome.trim()?"Informe o destinatário":"Confirmar + Criar Entrega"}
      </button>
    </div>
  );
}

// ── LISTA DE COMPRAS ────────────────────────────────────────────────────────────
const FASES=[
  {id:"pendente",label:"Pendente",emoji:"🕐",color:"#94a3b8",bg:"#94a3b815",border:"#94a3b840"},
  {id:"procurando",label:"Procurando",emoji:"🔍",color:"#f59e0b",bg:"#f59e0b15",border:"#f59e0b50"},
  {id:"carrinho",label:"No Carrinho",emoji:"🛒",color:"#3b82f6",bg:"#3b82f615",border:"#3b82f650"},
  {id:"comprado",label:"Comprado",emoji:"✅",color:"#22c55e",bg:"#22c55e15",border:"#22c55e50"},
  {id:"faltou",label:"Não tinha",emoji:"❌",color:"#ef4444",bg:"#ef444415",border:"#ef444450"},
];
const FASE_MAP=Object.fromEntries(FASES.map(f=>[f.id,f]));

function ListaComprasPage({S,notify}){
  const [items,setItems]=useState(()=>load("pdv_lista_compras",[]));
  const [input,setInput]=useState("");const [qty,setQty]=useState("");
  const [filterFase,setFilterFase]=useState("todas");const [search,setSearch]=useState("");
  const [editId,setEditId]=useState(null);const [editText,setEditText]=useState("");
  const [faseMenu,setFaseMenu]=useState(null);
  const inputRef=useRef(null);
  const persist=(v)=>{setItems(v);syncSave("lista_compras",v);};
  const addItem=()=>{const name=input.trim();if(!name){inputRef.current?.focus();return;}persist([{id:uid(),name,qty:qty.trim()||"",fase:"pendente",createdAt:Date.now()},...items]);setInput("");setQty("");inputRef.current?.focus();notify('"'+name+'" adicionado ✓');};
  const setFase=(id,fase)=>{persist(items.map(i=>i.id===id?{...i,fase}:i));setFaseMenu(null);};
  const removeItem=(id)=>persist(items.filter(i=>i.id!==id));
  const saveEdit=(id)=>{if(!editText.trim())return;persist(items.map(i=>i.id===id?{...i,name:editText.trim()}:i));setEditId(null);};
  const filtered=items.filter(i=>(filterFase==="todas"||i.fase===filterFase)&&i.name.toLowerCase().includes(search.toLowerCase()));
  const counts=Object.fromEntries(FASES.map(f=>[f.id,items.filter(i=>i.fase===f.id).length]));
  const totalOk=counts["comprado"]||0;
  return(<div>
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontSize:13,color:"#5A6080"}}>{totalOk}/{items.length} concluídos</div>{totalOk>0&&<button onClick={()=>{persist(items.filter(i=>i.fase!=="comprado"));notify("Comprados removidos.","warn");}} style={{...S.btn("danger"),padding:"6px 12px",fontSize:12}}>Limpar ✅</button>}</div>
      {items.length>0&&<div style={{height:5,background:"#1E2245",borderRadius:10,overflow:"hidden"}}><div style={{height:"100%",width:((totalOk/items.length)*100)+"%",background:"linear-gradient(90deg,#4ade80,#22c55e)",borderRadius:10,transition:"width .4s"}}/></div>}
    </div>
    <div style={{...S.card,marginBottom:12,padding:14}}>
      <div style={{display:"flex",gap:8,marginBottom:8}}><input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Nome do produto..." style={{...S.input,flex:1}}/><input value={qty} onChange={e=>setQty(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Qtd." style={{...S.input,width:70,textAlign:"center"}}/></div>
      <button onClick={addItem} style={{...S.btn("primary"),width:"100%",justifyContent:"center",padding:"11px"}}><Icon name="plus" size={15}/> Adicionar</button>
    </div>
    <div style={{position:"relative",marginBottom:10}}><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar..." style={{...S.input,paddingLeft:32}}/>{search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5A6080",cursor:"pointer",fontSize:18}}>×</button>}</div>
    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2,scrollbarWidth:"none"}}>
      <button onClick={()=>setFilterFase("todas")} style={{flexShrink:0,padding:"7px 13px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:11,background:filterFase==="todas"?"linear-gradient(135deg,#E8682A,#F07030)":"#1E2245",color:filterFase==="todas"?"#fff":"#6a6d80"}}>Todas ({items.length})</button>
      {FASES.map(f=><button key={f.id} onClick={()=>setFilterFase(f.id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:20,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:11,background:filterFase===f.id?f.bg:"#1E2245",border:"1px solid "+(filterFase===f.id?f.border:"#1E2245"),color:filterFase===f.id?f.color:"#6a6d80"}}>{f.emoji} {f.label}{counts[f.id]>0?" ("+counts[f.id]+")":""}</button>)}
    </div>
    {filtered.length===0?<EmptyState icon="🛍️" title={items.length===0?"Lista vazia":"Nenhum item"} desc={items.length===0?"Adicione produtos acima":"Tente outro filtro"}/>
      :(<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(item=>{const fase=FASE_MAP[item.fase];return(
          <div key={item.id} style={{...S.card,borderLeft:"4px solid "+fase.color,border:"1px solid "+fase.border,borderLeft:"4px solid "+fase.color,padding:"12px 14px",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setFaseMenu(faseMenu===item.id?null:item.id)} style={{flexShrink:0,background:fase.bg,border:"1px solid "+fase.border,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700,color:fase.color,fontFamily:"inherit"}}>{fase.emoji} {fase.label}</button>
              <div style={{flex:1,minWidth:0}}>
                {editId===item.id?(
                  <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(item.id);if(e.key==="Escape")setEditId(null);}} onBlur={()=>saveEdit(item.id)} style={{...S.input,padding:"5px 10px",fontSize:14,fontWeight:700,border:"1px solid #E8682A"}}/>
                ):(
                  <div onDoubleClick={()=>{setEditId(item.id);setEditText(item.name);}} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:item.fase==="comprado"?"line-through":"none",color:item.fase==="comprado"?"#5A6080":"#e8e9f0"}}>{item.name}</span>
                    {item.qty&&<span style={{...S.badge("#94a3b8"),fontSize:11,flexShrink:0}}>{item.qty}</span>}
                  </div>
                )}
              </div>
              <button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",color:"#252845",cursor:"pointer",padding:"4px 6px",fontSize:20,lineHeight:1,flexShrink:0}}>×</button>
            </div>
            {faseMenu===item.id&&(
              <><div style={{position:"fixed",inset:0,zIndex:300}} onClick={()=>setFaseMenu(null)}/><div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:301,background:"#0A0C1E",border:"1px solid #1a1c2e",borderRadius:14,padding:8,boxShadow:"0 16px 48px rgba(0,0,0,.7)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#5A6080",textTransform:"uppercase",letterSpacing:1,padding:"4px 10px 8px"}}>Alterar fase:</div>
                {FASES.map(f=>(<button key={f.id} onClick={()=>setFase(item.id,f.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",width:"100%",background:item.fase===f.id?f.bg:"transparent",border:"1px solid "+(item.fase===f.id?f.border:"transparent"),borderRadius:10,cursor:"pointer",fontFamily:"'Sora',sans-serif",color:item.fase===f.id?f.color:"#8a8da0",fontWeight:item.fase===f.id?700:500,fontSize:13,textAlign:"left"}}><span style={{fontSize:17}}>{f.emoji}</span><span style={{flex:1}}>{f.label}</span>{item.fase===f.id&&<span>✓</span>}</button>))}
              </div></>
            )}
          </div>
        );})}
      </div>)}
  </div>);}

// ── IMPORTAR ────────────────────────────────────────────────────────────────────
function ImportarPage({S,products,persistP,notify}){
  const [parsed,setParsed]=useState([]);const [step,setStep]=useState("input");
  const [editingIdx,setEditingIdx]=useState(null);const [editForm,setEditForm]=useState({});
  const [loading,setLoading]=useState(false);const [statusMsg,setStatusMsg]=useState("");
  const fileRef=useRef(null);

  const getCategoria=(nome)=>{const d=nome.toLowerCase();if(/torneira|valvula|reparo|sifao|tubo|hidro|ducha|chuveiro|registro/.test(d))return"Hidráulica";if(/interruptor|tomada|fio|cabo|disjuntor|lampada|led/.test(d))return"Elétrico";if(/broca|martelo|serra|chave|alicate|parafuso|prego|porca|marreta/.test(d))return"Ferramentas";if(/cadeado|fechadura|gancho|pitao|suporte/.test(d))return"Ferragens";if(/soda|cola|varal|trincha|rolo|pincel|tinta/.test(d))return"Limpeza";if(/linha|pesca|anzol/.test(d))return"Pesca";if(/macarico|botijao/.test(d))return"Construção";if(/suporte.*tv|rack|antena/.test(d))return"Eletrônicos";return"Outros";};

  const makeProduto=(desc,unidade,qtd,precoNF,barcode)=>{
    const CX=/\bC(\d{1,4})\b/i;const DZ={DZ:12};let unitsPerBox=DZ[unidade.toUpperCase()]||1;const cxM=desc.match(CX);if(cxM)unitsPerBox=parseInt(cxM[1]);
    const precoUnitario=unitsPerBox>1?+(precoNF/unitsPerBox).toFixed(2):precoNF;const estoque=Math.round(qtd*unitsPerBox);
    const nome=desc.replace(/^\d{3,8}\s*/,"").replace(/\bC\d{1,4}\b/i,"").replace(/\s{2,}/g," ").trim().slice(0,40);
    return{id:uid(),nomeOriginal:desc,nome,categoria:getCategoria(nome),quantidade:qtd,unidade:unidade.toUpperCase(),unitsPerBox,precoUnitario,estoque,barcode:barcode||"",observacao:unitsPerBox>1?(unitsPerBox+" un/emb → "+fmt(precoUnitario)+"/un"):"",selected:true};
  };

  const parseXML=(xmlText)=>{const doc=new DOMParser().parseFromString(xmlText,"text/xml");const dets=doc.querySelectorAll("det");if(dets.length===0)throw new Error("XML sem itens <det>.");const produtos=[];const seen=new Set();dets.forEach(det=>{const prod=det.querySelector("prod");if(!prod)return;const xProd=prod.querySelector("xProd");const qCom=prod.querySelector("qCom");const vUnCom=prod.querySelector("vUnCom");const uCom=prod.querySelector("uCom");const cEAN=prod.querySelector("cEAN");if(!xProd)return;const desc=xProd.textContent.trim();const unid=(uCom?uCom.textContent.trim():"UN").toUpperCase();const qtd=parseFloat((qCom?qCom.textContent:"1").replace(",","."))||1;const preco=parseFloat((vUnCom?vUnCom.textContent:"0").replace(",","."))||0;if(preco<=0)return;const key=desc.toLowerCase().replace(/\s+/g,"").slice(0,20);if(seen.has(key))return;seen.add(key);const barcode=(cEAN&&cEAN.textContent!=="SEM GTIN")?cEAN.textContent:"";produtos.push(makeProduto(desc,unid,qtd,preco,barcode));});if(produtos.length===0)throw new Error("Nenhum produto no XML.");return produtos;};

  const parseCSV=(text)=>{const sep=text.split("\n")[0]?.includes(";")?";":text.split("\n")[0]?.includes("\t")?"\t":",";const linhas=text.split("\n").map(l=>l.trim()).filter(Boolean);if(linhas.length<2)throw new Error("CSV vazio.");const header=linhas[0].toLowerCase().split(sep).map(h=>h.replace(/"/g,"").trim());const iN=header.findIndex(h=>/nome|descri|produto/.test(h));const iP=header.findIndex(h=>/preco|valor|vunit|price/.test(h));const iQ=header.findIndex(h=>/qtd|quant|estoque|qty/.test(h));const iU=header.findIndex(h=>/unid|unit/.test(h));const produtos=[];const seen=new Set();for(let i=iN>=0?1:0;i<linhas.length;i++){const cols=linhas[i].split(sep).map(p=>p.replace(/"/g,"").trim());const clean=(idx)=>idx>=0&&cols[idx]?cols[idx]:"";const num=(idx)=>parseFloat(clean(idx).replace(",","."))||0;let desc,preco,qtd,unid;if(iN>=0&&iP>=0){desc=clean(iN);preco=num(iP);qtd=iQ>=0?(num(iQ)||1):1;unid=iU>=0?(clean(iU)||"UN"):"UN";}else{desc=cols.find(p=>isNaN(parseFloat(p.replace(",",".")))&&p.length>3)||"";const nums=cols.map(p=>parseFloat(p.replace(",","."))||0).filter(n=>n>0);preco=nums.length>0?Math.min(...nums):0;qtd=1;unid="UN";}if(!desc||desc.length<2||preco<=0)continue;const key=desc.toLowerCase().replace(/\s+/g,"").slice(0,20);if(seen.has(key))continue;seen.add(key);produtos.push(makeProduto(desc,unid,qtd,preco,""));}if(produtos.length===0)throw new Error("Nenhum produto no CSV.");return produtos;};

  // ── PARSER DE ORÇAMENTO PDF (formato Grupo Bartolomeu / atacadista) ──────────
  // Formato: COD-X DESCRICAO / MARCA: X COD NCM: X / COD.BARRAS: X / I/S UN QTD DESC% LIQUIDO UNIT. TOTAL
  const parseOrcamentoPDF=(text)=>{
    const produtos=[];
    const linhas=text.split("\n").map(l=>l.trim()).filter(Boolean);
    let i=0;

    // Padrão de linha de dados: S/I? UNIDADE QTD PERC% LIQUIDO UNIT TOTAL
    // Ex: "S DZ 1 1,00 % 87,16 7,26 87,16" ou "UN 25 1,00 % 4,73 4,73 118,18"
    const reData=/^(S\s+I?\s*|I\s+)?(DZ|PT|CX|UN|KG|MC|RL|PC|MT|LT|MR|GL)\s+(\d+)\s+([\d,]+)\s*%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/i;

    // Padrão de código: "120607-0 DESCRICAO..."
    const reCod=/^(\d{3,6}-\d)\s+(.+)$/;

    const pNum=v=>parseFloat((v||"0").replace(/\./g,"").replace(",","."));

    const UN_MULT={DZ:12,PT:1,CX:1,UN:1,KG:1,MC:1,RL:1,PC:1,MT:1,LT:1,MR:1,GL:1};

    while(i<linhas.length){
      const linha=linhas[i];
      const mCod=linha.match(reCod);

      if(mCod){
        const cod=mCod[1];
        const desc=mCod[2].trim();
        let marca="",barcode="",un="UN",qtd=1,unitPrice=0,liquido=0;
        i++;

        // Lê linhas seguintes até encontrar linha de dados
        while(i<linhas.length){
          const l=linhas[i];
          // Linha de MARCA
          if(l.startsWith("MARCA:")){marca=l.replace(/^MARCA:\s*/,"").split(/\s+COD\s+NCM:/)[0].trim();i++;continue;}
          // Linha de COD.BARRAS — pega o menor código (EAN-13 sem leading digit)
          if(l.startsWith("COD.BARRAS:")){
            const bcs=l.replace("COD.BARRAS:","").trim().split(/\s+/);
            // Prefere o código de 13 dígitos
            const bc13=bcs.find(b=>/^\d{13}$/.test(b));
            const bc=bc13||bcs.find(b=>/^\d{8,}$/.test(b))||"";
            barcode=bc;
            i++;
            // Linha seguinte pode ser segundo barcode (começa com número, sem label)
            if(i<linhas.length&&/^\d{8,13}$/.test(linhas[i])){i++;}
            continue;
          }
          // Linha de dados: UN QTD DESC% LIQUIDO UNIT TOTAL
          const mD=l.match(reData);
          if(mD){
            un=(mD[2]||"UN").toUpperCase();
            qtd=parseInt(mD[3])||1;
            liquido=pNum(mD[5]);
            unitPrice=pNum(mD[6]);
            i++;
            break;
          }
          // Se linha parece ser próximo produto ou rodapé, para
          if(reCod.test(l)||l.startsWith("Qtd.")||l.startsWith("ORCA")||l.startsWith("PRECO")){break;}
          i++;
        }

        if(unitPrice<=0&&liquido>0) unitPrice=liquido;
        if(unitPrice<=0) continue;

        // Calcula unidades por embalagem e estoque
        const multEmb=UN_MULT[un]||1;
        const estoqueTotal=qtd*multEmb;
        const unPDV=un==="DZ"?"unid":un==="KG"?"kg":un==="MT"?"m":"unid";

        // Nome limpo: remove códigos do final (C6, C24, C100, etc.)
        const nome=desc
          .replace(/\s+C\d+$/,"")
          .replace(/COD NCM:.*/,"")
          .trim()
          .slice(0,60);

        produtos.push({
          id:uid(),
          nomeOriginal:desc,
          nome,
          marca,
          categoria:getCategoria(nome),
          quantidade:qtd,
          unidade:un,
          unitsPerBox:multEmb,
          precoUnitario:unitPrice,
          estoque:estoqueTotal,
          barcode,
          codigoProduto:cod,
          observacao:multEmb>1?(multEmb+"un/emb → R$"+unitPrice.toFixed(2)+"/un"):"",
          selected:true
        });
      } else {
        i++;
      }
    }

    if(produtos.length===0) throw new Error("Nenhum produto encontrado. Verifique se é um orçamento no formato correto.");
    return produtos;
  };

  const parseTXT=(text)=>{
    const LIXO=/^[-=*.]{4,}$|^[A-Z]{30,}$|DANFE|CHAVE DE ACESSO|CNPJ|FONE|PROTOCOLO|TRANSPORTADOR|COMPROVANTE|BOLETO|VENCIMENTO|ASSINATURA|DECLARO|EVITE|PAGAVEL|INSCRICAO|RESERVADO|IMPRESSO|BASE DE|DADOS DO PRODUTO|DESCRICAO DOS|PESO BRUTO/i;
    const rawLines=text.split("\n").map(l=>l.trim()).filter(l=>l.length>1&&!LIXO.test(l));
    const SOLO_PRICE=/^\d{1,6}[,.]\d{2}$/;const STARTS_PROD=/^\d{4,8}\s+[A-Z]/;const HAS_COMP=/\b(UN|CX|DZ|PT|SC|KG|%)\s+[\d,.]+\s+[\d,.]+/i;
    const lines=[];rawLines.forEach(cur=>{if(SOLO_PRICE.test(cur)&&lines.length>0){lines[lines.length-1]+=" "+cur;}else if(!STARTS_PROD.test(cur)&&lines.length>0&&!HAS_COMP.test(lines[lines.length-1])&&cur.length<60&&!/^\d{4,}/.test(cur)){lines[lines.length-1]+=" "+cur;}else{lines.push(cur);}});
    const RE=/^(?:\d{3,8}\s+)?(.+?)\s+(UN|CX|DZ|PT|SC|KG|LT|MT|PC|PR|GR|ML|%)\s+([\d]+[,.]?[\d]*)\s+([\d]+[,.]\d{2})\s*$/i;
    const produtos=[];const seen=new Set();
    lines.forEach(line=>{if(line.length<8)return;const m=line.match(RE);if(!m)return;const[,desc,unid,qtdStr,precoStr]=m;if(!desc||desc.length<3)return;const key=desc.toLowerCase().replace(/\s+/g,"").slice(0,20);if(seen.has(key))return;seen.add(key);const qtd=parseFloat(qtdStr.replace(",","."))||1;const preco=parseFloat(precoStr.replace(",","."))||0;if(preco<=0)return;produtos.push(makeProduto(desc.trim(),unid,qtd,preco,""));});
    if(produtos.length===0)throw new Error("Nenhum produto reconhecido. Formato:\nDESCRIÇÃO UNIDADE QTD PREÇO\nEx: CADEADO 50MM UN 5,00 193,70");return produtos;
  };

  const parsePDF=async(file)=>{
    setStatusMsg("Carregando PDF.js...");if(!window.pdfjsLib){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=res;s.onerror=()=>rej(new Error("Falha ao carregar PDF.js"));document.head.appendChild(s);});window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
    setStatusMsg("Extraindo texto...");const buf=await file.arrayBuffer();const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;const np=Math.min(pdf.numPages,10);
    const pageTexts=[];for(let p=1;p<=np;p++){setStatusMsg("Lendo pág. "+p+"/"+np+"...");const page=await pdf.getPage(p);const tc=await page.getTextContent();const byY={};tc.items.forEach(item=>{const y=Math.round(item.transform[5]);if(!byY[y])byY[y]=[];byY[y].push(item.str);});const sortedY=Object.keys(byY).map(Number).sort((a,b)=>b-a);pageTexts.push(...sortedY.map(y=>byY[y].join(" ").trim()).filter(Boolean));}
        const fullText = pageTexts.join("\n");
    // Detecta orçamento pelo conteúdo (tem COD NCM: ou COD.BARRAS:)
    if(fullText.includes("COD NCM:")||fullText.includes("COD.BARRAS:")||fullText.includes("ORCAMENTO Nº")||fullText.includes("ORÇAMENTO")){
      return parseOrcamentoPDF(fullText);
    }
    return parseTXT(fullText);
  };

  const handleFile=async(e)=>{const file=e.target.files?.[0];if(!file)return;e.target.value="";const name=file.name.toLowerCase();setLoading(true);setStatusMsg("Lendo arquivo...");
    try{let produtos=[];
      if(name.endsWith(".xml")){const text=await file.text();produtos=parseXML(text);notify(produtos.length+" item(ns) do XML ✓");}
      else if(name.endsWith(".csv")){const text=await file.text();produtos=parseCSV(text);notify(produtos.length+" item(ns) do CSV ✓");}
      else if(name.endsWith(".pdf")){produtos=await parsePDF(file);notify(produtos.length+" item(ns) do PDF ✓");}
      else if(name.endsWith(".txt")){const text=await file.text();produtos=parseTXT(text);notify(produtos.length+" item(ns) do TXT ✓");}
      else throw new Error("Use XML, CSV, PDF ou TXT.");
      setParsed(produtos);setStep("review");
    }catch(err){notify(err.message,"error");}finally{setLoading(false);setStatusMsg("");}
  };

  const importarSelecionados=()=>{
    const sel=parsed.filter(p=>p.selected);
    if(sel.length===0){notify("Selecione ao menos um.","warn");return;}
    let novos=0,atualizados=0,ignorados=0;
    const np=[...products];
    sel.forEach(p=>{
      // Busca por código de barras primeiro (mais preciso), depois por nome
      let idx=-1;
      if(p.barcode) idx=np.findIndex(x=>x.barcode&&x.barcode.trim()===p.barcode.trim());
      if(idx<0)      idx=np.findIndex(x=>x.name.toLowerCase().trim()===p.nome.toLowerCase().trim());
      // Busca parcial: nome do produto contém o nome da NF ou vice-versa
      if(idx<0){
        const nNorm=p.nome.toLowerCase().replace(/\s+/g," ").trim();
        idx=np.findIndex(x=>{
          const xNorm=x.name.toLowerCase().replace(/\s+/g," ").trim();
          return xNorm.includes(nNorm)||nNorm.includes(xNorm);
        });
      }
      if(idx>=0){
        // Produto existe — atualiza estoque e preço custo
        np[idx]={...np[idx],
          costPrice:p.precoUnitario, // preço NF é o custo
          stock:np[idx].stock+p.estoque,
          barcode:p.barcode||np[idx].barcode
        };
        atualizados++;
      } else {
        // Produto novo
        np.unshift({id:uid(),name:p.nome,category:p.categoria,
          price:0,              // varejo p/ preencher depois
          priceAtacado:0,       // atacado p/ preencher depois
          costPrice:p.precoUnitario, // custo = preço NF
          stock:p.estoque,unit:"unid",barcode:p.barcode||"",
          minStock:0,photo:"",description:"",createdAt:Date.now()
        });
        novos++;
      }
    });
    persistP(np);
    notify(novos+" novo(s), "+atualizados+" atualizado(s) ✓");
    setStep("done");setParsed([]);
  };

  const saveEdit=(idx)=>{setParsed(parsed.map((x,i)=>i===idx?{...editForm,id:x.id,selected:x.selected}:x));setEditingIdx(null);};

  if(step==="done")return(<div style={{textAlign:"center",padding:"48px 20px"}}><div style={{fontSize:64,marginBottom:16}}>✅</div><div style={{fontSize:18,fontWeight:800,color:"#4ade80",marginBottom:8}}>Importação concluída!</div><div style={{fontSize:13,color:"#5A6080",marginBottom:28}}>Produtos adicionados ao estoque.</div><button style={S.btn("primary")} onClick={()=>setStep("input")}><Icon name="import" size={14}/> Nova Importação</button></div>);

  if(step==="review")return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div><div style={{fontSize:15,fontWeight:700}}>Revisar Produtos</div><div style={{fontSize:12,color:"#5A6080",marginTop:2}}>{parsed.filter(p=>p.selected).length}/{parsed.length} selecionados</div></div>
      <div style={{display:"flex",gap:8}}><button style={{...S.btn("ghost"),padding:"7px 12px",fontSize:12}} onClick={()=>setStep("input")}>← Voltar</button><button style={{...S.btn("primary"),padding:"9px 14px"}} onClick={importarSelecionados}><Icon name="import" size={14}/> Importar</button></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:12}}><button onClick={()=>setParsed(p=>p.map(x=>({...x,selected:true})))} style={{...S.btn("ghost"),padding:"6px 12px",fontSize:12}}>Sel. todos</button><button onClick={()=>setParsed(p=>p.map(x=>({...x,selected:false})))} style={{...S.btn("ghost"),padding:"6px 12px",fontSize:12}}>Desmarcar</button></div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {parsed.map((prod,idx)=>(<div key={prod.id} style={{...S.card,borderLeft:"3px solid "+(prod.selected?"#4ade80":"#252845"),opacity:prod.selected?1:0.5}}>
        {editingIdx===idx?(
          <div>
            <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Nome</div><input style={{...S.input,fontSize:13}} value={editForm.nome} onChange={e=>setEditForm(f=>({...f,nome:e.target.value}))}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <div><div style={{...S.lbl,marginBottom:4}}>Preço Unit.</div><input style={{...S.input,fontSize:13}} type="number" step="0.01" value={editForm.precoUnitario} onChange={e=>setEditForm(f=>({...f,precoUnitario:+e.target.value}))}/></div>
              <div><div style={{...S.lbl,marginBottom:4}}>Estoque</div><input style={{...S.input,fontSize:13}} type="number" value={editForm.estoque} onChange={e=>setEditForm(f=>({...f,estoque:+e.target.value}))}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div><div style={{...S.lbl,marginBottom:4}}>Un./Emb.</div><input style={{...S.input,fontSize:13}} type="number" min="1" value={editForm.unitsPerBox||1} onChange={e=>setEditForm(f=>({...f,unitsPerBox:+e.target.value}))}/></div>
              <div><div style={{...S.lbl,marginBottom:4}}>Categoria</div><select style={{...S.input,fontSize:13}} value={editForm.categoria} onChange={e=>setEditForm(f=>({...f,categoria:e.target.value}))}>{loadCats().map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
            <div style={{display:"flex",gap:8}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center",fontSize:13}} onClick={()=>setEditingIdx(null)}>Cancelar</button><button style={{...S.btn("primary"),flex:1,justifyContent:"center",fontSize:13}} onClick={()=>saveEdit(idx)}><Icon name="check" size={13}/> Salvar</button></div>
          </div>
        ):(
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <button onClick={()=>setParsed(p=>p.map(x=>x.id===prod.id?{...x,selected:!x.selected}:x))} style={{width:22,height:22,borderRadius:6,border:"2px solid "+(prod.selected?"#4ade80":"#252845"),background:prod.selected?"#4ade80":"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}>{prod.selected&&<span style={{color:"#0A0C1E",fontSize:12,fontWeight:900}}>✓</span>}</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{prod.nome}</div>
              <div style={{fontSize:11,color:"#5A6080",marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{prod.nomeOriginal}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                <span style={S.badge("#E8682A")}>{fmt(prod.precoUnitario)}/un</span>
                <span style={S.badge("#4A5BC4")}>{prod.estoque} unid.</span>
                <span style={S.badge("#a78bfa")}>{prod.categoria}</span>
                {prod.unitsPerBox>1&&<span style={S.badge("#f59e0b")}>{prod.unitsPerBox} un/emb</span>}
                {prod.barcode&&<span style={S.badge("#4ade80")}>EAN: {prod.barcode}</span>}
              </div>
              {prod.observacao?<div style={{fontSize:11,color:"#5A6080",marginTop:4}}>{prod.observacao}</div>:null}
            </div>
            <button onClick={()=>{setEditingIdx(idx);setEditForm({...prod});}} style={{...S.btn("ghost"),padding:"6px 9px",flexShrink:0}}><Icon name="edit" size={14}/></button>
          </div>
        )}
      </div>))}
    </div>
    <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1a1c2e",display:"flex",gap:10}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={()=>setStep("input")}>← Voltar</button><button style={{...S.btn("primary"),flex:1,justifyContent:"center",padding:"12px"}} onClick={importarSelecionados}><Icon name="import" size={15}/> Importar {parsed.filter(p=>p.selected).length}</button></div>
  </div>);

  return(<div>
    <div style={{...S.card,marginBottom:14,padding:16,borderColor:"#22d3ee30",background:"linear-gradient(135deg,#0a1520,#0f1117)"}}>
      <div style={{fontSize:14,fontWeight:700,color:"#4A5BC4",marginBottom:10}}>📥 Importar NF-e / Orçamento</div>
      {[["🗂️","XML NF-e (SEFAZ) — lê campos estruturados da nota"],["📊","CSV — detecta separador e colunas automaticamente"],["📄","PDF — extrai texto via PDF.js (DANFE ou Orçamento atacadista)"],["📝","TXT — DESCRIÇÃO UNIDADE QTD PREÇO por linha"],["📦","Detecta C24, C200... e divide preço por unidade"]].map(([ic,tx])=>(<div key={tx} style={{display:"flex",gap:8,marginBottom:5}}><span style={{fontSize:13,flexShrink:0}}>{ic}</span><span style={{fontSize:12,color:"#6a6d80",lineHeight:1.4}}>{tx}</span></div>))}
    </div>
    <input ref={fileRef} type="file" accept=".xml,.csv,.pdf,.txt,text/xml,text/csv,application/pdf,text/plain" style={{display:"none"}} onChange={handleFile}/>
    {loading?(
      <div style={{...S.card,padding:24,textAlign:"center",borderColor:"#22d3ee30"}}><div style={{fontSize:32,marginBottom:8,animation:"spin 1.2s linear infinite"}}>⚙️</div><div style={{fontSize:14,fontWeight:600,color:"#4A5BC4",marginBottom:4}}>{statusMsg||"Processando..."}</div></div>
    ):(
      <><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{label:"XML NF-e",ext:".xml",emoji:"🗂️",color:"#4A5BC4",desc:"Nota fiscal SEFAZ"},{label:"CSV",ext:".csv",emoji:"📊",color:"#4ade80",desc:"Planilha de produtos"},{label:"PDF",ext:".pdf",emoji:"📄",color:"#f59e0b",desc:"DANFE ou orçamento"},{label:"TXT",ext:".txt",emoji:"📝",color:"#a78bfa",desc:"Texto livre"}].map(ft=>(
          <button key={ft.ext} onClick={()=>{fileRef.current.accept=ft.ext;fileRef.current.click();}} style={{...S.card,padding:"14px 10px",border:"1px solid "+ft.color+"30",cursor:"pointer",background:"#0F1220",display:"flex",flexDirection:"column",alignItems:"center",gap:6,borderRadius:12}}>
            <span style={{fontSize:28}}>{ft.emoji}</span><span style={{fontSize:13,fontWeight:700,color:ft.color}}>{ft.label}</span><span style={{fontSize:11,color:"#5A6080",textAlign:"center"}}>{ft.desc}</span>
          </button>
        ))}</div>
        <div style={{...S.lbl,marginBottom:6}}>Ou cole o texto manualmente:</div>
        <textarea placeholder={"Formato NF-e:\n029554 SODA CAUSTICA 500G C24 CX 1,00 371,07\n004073 CADEADO 50MM UN 5,00 193,70"} style={{...S.input,height:160,resize:"vertical",verticalAlign:"top",fontFamily:"monospace",fontSize:12,lineHeight:1.5}}
          onPaste={e=>{const txt=e.clipboardData.getData("text");if(txt.trim().length>0){e.preventDefault();try{const prods=txt.includes("<det")?parseXML(txt):txt.includes(",")&&txt.split("\n")[0]?.split(",").length>2?parseCSV(txt):parseTXT(txt);setParsed(prods);setStep("review");notify(prods.length+" produto(s) ✓");}catch(err){notify(err.message,"error");}}}}
        />
      </>
    )}
  </div>);}

// ── ENTREGAS ────────────────────────────────────────────────────────────────────
function EntregasPage({S,sales,customers,notify,pedidos:pedidosProp,persistE:persistEProp,onReload}){
  const [pedidos,setPedidos]=useState(()=>pedidosProp||load("pdv_entregas",[]));
  useEffect(()=>{if(pedidosProp)setPedidos(pedidosProp);},[pedidosProp]);
  const persistE=(v)=>{setPedidos(v);if(persistEProp)persistEProp(v);else{save("pdv_entregas",v);syncSave("entregas",v);}};
  const [tab,setTab]=useState("pedido");const [newPedido,setNewPedido]=useState(false);
  const [obsEdit,setObsEdit]=useState({});
  const [nForm,setNForm]=useState({cliente:"",telefone:"",endereco:"",obs:"",vendaId:"",pagamento:"pago"});
  const setNF=(k,v)=>setNForm(f=>({...f,[k]:v}));
  const STATUS=[
    {id:"pedido",label:"Pedido",emoji:"📋",color:"#94a3b8",bg:"#94a3b815",border:"#94a3b840"},
    {id:"separando",label:"Separando",emoji:"📦",color:"#f59e0b",bg:"#f59e0b15",border:"#f59e0b50"},
    {id:"rota",label:"Em Rota",emoji:"🚚",color:"#3b82f6",bg:"#3b82f615",border:"#3b82f650"},
    {id:"concluido",label:"Concluído",emoji:"✅",color:"#22c55e",bg:"#22c55e15",border:"#22c55e50"},
  ];
  const ST=Object.fromEntries(STATUS.map(s=>[s.id,s]));
  const counts=Object.fromEntries(STATUS.map(s=>[s.id,pedidos.filter(p=>p.status===s.id).length]));
  const filtered=pedidos.filter(p=>p.status===tab);
  const criarPedido=(form)=>{const vendaSel=sales.find(s=>s.id===form.vendaId);const vendaSelecionadaEntrega=sales.find(s=>s.id===form.vendaId);const novo={id:uid(),numero:"PED-"+String(pedidos.length+1).padStart(4,"0"),cliente:form.cliente||"Avulso",telefone:form.telefone||"",endereco:form.endereco||"",itens:vendaSel?.items||[],total:vendaSel?.total||0,obs:form.obs||"",pagamento:form.pagamento||"pago",status:"pedido",isPrazo:vendaSelecionadaEntrega?.payment==="A Prazo"||false,criadoEm:Date.now(),criadoData:todayStr(),criadoHora:nowTime(),vendaId:form.vendaId||null};persistE([novo,...pedidos]);setNewPedido(false);notify("Pedido "+novo.numero+" criado! ✓");};
  const moverStatus=(id,novoStatus)=>{persistE(pedidos.map(p=>p.id===id?{...p,status:novoStatus,atualizadoEm:Date.now()}:p));notify("Status: "+ST[novoStatus]?.label+" ✓");};
  const salvarObs=(id)=>{persistE(pedidos.map(p=>p.id===id?{...p,obs:obsEdit[id]??p.obs}:p));setObsEdit(o=>{const n={...o};delete n[id];return n;});notify("Observação salva ✓");};
  const excluirPedido=(id)=>{persistE(pedidos.filter(p=>p.id!==id));notify("Pedido removido.","warn");};
  const imprimirBrowser=(ped)=>{
    const st=ST[ped.status];
    const itemRows=(ped.itens||[]).map(i=>"<tr><td>"+i.name+"</td><td style='text-align:center'>"+i.qty+"x</td><td style='text-align:right;font-weight:600'>"+fmt(i.price*i.qty)+"</td></tr>").join("");
    const css="body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#f3f4f6;padding:6px;text-align:left;font-size:10px;text-transform:uppercase;}td{padding:6px;border-bottom:1px solid #f3f4f6;}.total{font-size:16px;font-weight:800;text-align:right;margin-top:10px;color:#2D3A8C;}@media print{body{max-width:100%;padding:8px}}";
    const pgStatus=ped.pagamento||"";
    const pgLabel=pgStatus==="pago"?"✅ PAGO":pgStatus==="troco"?"💵 LEVAR TROCO":pgStatus==="maquina"?"📲 LEVAR MÁQUINA":pgStatus==="troco_maquina"?"💵📲 LEVAR TROCO + MÁQUINA":"";
    const pgColor=pgStatus==="pago"?"#27ae60":"#e74c3c";
    const html="<!DOCTYPE html><html><head><meta charset='utf-8'><title>"+ped.numero+"</title><style>"+css+"</style></head><body>"+
      "<div style='background:#2D3A8C;color:#fff;padding:14px;text-align:center;border-radius:8px;margin-bottom:16px'>"+
      "<img src='"+LOGO_SRC+"' alt='logo' style='height:44px;display:block;margin:0 auto 6px'/>"+
      "<div style='font-size:15px;font-weight:800;letter-spacing:1px'>PEDIDO DE ENTREGA</div>"+
      "<div style='font-size:11px;margin-top:3px;opacity:.85'>"+ped.numero+" · "+ped.criadoData+" "+ped.criadoHora+"</div>"+
      "</div>"+
      "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:12px;font-size:12px'>"+
      "<div style='display:flex;justify-content:space-between;margin-bottom:4px'>"+
      "<span><b>Status:</b> "+st.emoji+" "+st.label+"</span>"+
      "<span><b>Total:</b> <span style='color:#2D3A8C;font-weight:800'>"+fmt(ped.total)+"</span></span></div>"+
      "<b>Cliente:</b> "+ped.cliente+(ped.telefone?" · 📞"+ped.telefone:"")+"<br>"+
      (ped.endereco?"<b>Endereço:</b> 📍"+ped.endereco+"<br>":"")+
      "</div>"+
      "<table><thead><tr><th>Produto</th><th style='text-align:center'>Qtd</th><th style='text-align:right'>Valor</th></tr></thead><tbody>"+itemRows+"</tbody></table>"+
      "<div class='total'>TOTAL: "+fmt(ped.total)+"</div>"+
      (pgLabel?"<div style='margin-top:10px;padding:10px;border-radius:6px;border:2px solid "+pgColor+";font-size:13px;font-weight:800;text-align:center;color:"+pgColor+"'>"+pgLabel+"</div>":"")+
      (ped.obs?"<div style='background:#fffbeb;border:1px solid #fef08a;padding:8px;border-radius:6px;font-size:12px;margin-top:8px'><b>Obs:</b> "+ped.obs+"</div>":"")+
      "<div style='border-top:2px solid #2D3A8C;margin-top:20px;padding-top:14px;font-size:11px;color:#888;text-align:center'>"+
      "Assinatura do recebedor: _______________________________<br><br>Data: _____ / _____ / _______<br><br>"+
      "<b style='color:#2D3A8C'>Pecuarão Gontijo</b> · Rua Guarani, 461 · (37) 99922-1020"+
      "</div>"+
      "</body></html>";
    // Usa iframe para evitar bloqueio de popup
    const iframe=document.createElement("iframe");
    iframe.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(()=>{
      try{iframe.contentWindow.focus();iframe.contentWindow.print();}catch(e){
        // Fallback: window.open
        const w=window.open("","_blank","width=520,height=750");
        if(w){w.document.write(html);w.document.close();setTimeout(()=>{try{w.print();}catch(_){}},400);}
        else notify("Permita pop-ups para imprimir.","warn");
      }
      setTimeout(()=>{try{document.body.removeChild(iframe);}catch(_){}},3000);
    },500);
  };
  const vendaSelecionada=sales.find(s=>s.id===nForm.vendaId);
  const clienteSel=customers.find(c=>c.name===(vendaSelecionada?.customer||nForm.cliente));
  const enderecoDoCliente=clienteSel?[clienteSel.rua&&(clienteSel.rua+(clienteSel.numero?", "+clienteSel.numero:"")),clienteSel.bairro,clienteSel.cidade&&(clienteSel.cidade+(clienteSel.uf?" - "+clienteSel.uf:"")),clienteSel.cep&&("CEP: "+clienteSel.cep)].filter(Boolean).join(" · "):"";
  return(<div>
    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:2,scrollbarWidth:"none"}}>
      {STATUS.map(st=><button key={st.id} onClick={()=>setTab(st.id)} style={{flexShrink:0,padding:"8px 13px",borderRadius:20,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:700,fontSize:12,background:tab===st.id?st.bg:"#1E2245",border:"1px solid "+(tab===st.id?st.border:"#1E2245"),color:tab===st.id?st.color:"#6a6d80"}}>{st.emoji} {st.label} {counts[st.id]>0?"("+counts[st.id]+")":""}</button>)}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <button onClick={()=>setNewPedido(true)} style={{...S.btn("primary"),flex:1,justifyContent:"center",padding:"11px"}}><Icon name="plus" size={15}/> Novo Pedido de Entrega</button>
      {onReload&&<button onClick={async()=>{notify("Atualizando...");const ok=await onReload();if(ok)notify("Entregas atualizadas! ✓");}} style={{...S.btn("ghost"),padding:"11px 14px",fontSize:13}}>🔄</button>}
    </div>
    {filtered.length===0?<EmptyState icon={ST[tab].emoji} title={"Nenhum pedido "+ST[tab].label.toLowerCase()} desc={tab==="pedido"?"Crie um novo pedido acima.":"Mova pedidos para esta fase."}/>
      :(<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(ped=>{const st=ST[ped.status];return(
          <div key={ped.id} style={{...S.card,borderLeft:"4px solid "+st.color,border:"1px solid "+st.border,borderLeft:"4px solid "+st.color}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><span style={{fontSize:12,fontWeight:800,color:st.color}}>{ped.numero}</span><span style={{...S.badge(st.color),fontSize:10}}>{st.emoji} {st.label}</span>{ped.tipo==="atacado"&&<span style={{...S.badge("#f59e0b"),fontSize:10}}>📦 Atacado</span>}</div><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{ped.cliente}</div>{ped.telefone&&<div style={{fontSize:12,color:"#6a6d80",display:"flex",alignItems:"center",gap:5}}><Icon name="phone" size={11} color="#6a6d80"/>{ped.telefone}</div>}</div>
              <div style={{fontSize:16,fontWeight:800,color:"#4ade80",flexShrink:0,marginLeft:8}}>{fmt(ped.total)}</div>
            </div>
            {ped.endereco&&<div style={{background:"#0A0C1E",border:"1px solid #1a1c2e",borderRadius:8,padding:"7px 10px",marginBottom:8,fontSize:12,color:"#6a6d80",display:"flex",gap:6}}><Icon name="mapPin" size={12} color="#3b82f6"/><span style={{lineHeight:1.4}}>{ped.endereco}</span></div>}
            {ped.itens&&ped.itens.length>0&&<div style={{fontSize:12,color:"#5A6080",marginBottom:8,lineHeight:1.4}}>{ped.itens.map(i=>i.qty+"× "+i.name).join(", ")}</div>}
            {obsEdit[ped.id]!==undefined?(
              <div style={{marginBottom:8}}><textarea value={obsEdit[ped.id]} onChange={e=>setObsEdit(o=>({...o,[ped.id]:e.target.value}))} placeholder="Observações..." style={{...S.input,height:60,resize:"none",verticalAlign:"top",fontSize:13,lineHeight:1.4}}/><div style={{display:"flex",gap:6,marginTop:5}}><button onClick={()=>setObsEdit(o=>{const n={...o};delete n[ped.id];return n;})} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"7px",fontSize:12}}>Cancelar</button><button onClick={()=>salvarObs(ped.id)} style={{...S.btn("primary"),flex:1,justifyContent:"center",padding:"7px",fontSize:12}}><Icon name="check" size={13}/> Salvar</button></div></div>
            ):(ped.obs&&<div style={{background:"#0a0c14",border:"1px solid #f59e0b30",borderRadius:8,padding:"7px 10px",marginBottom:8,fontSize:12,color:"#f59e0b",lineHeight:1.4}}>💬 {ped.obs}</div>)}
            {/* Badge pagamento */}
            {(()=>{
              const PG={pago:{l:"✅ Pago",c:"#27ae60"},troco:{l:"💵 Levar Troco",c:"#f39c12"},maquina:{l:"📲 Levar Máquina",c:"#3b82f6"},troco_maquina:{l:"💵📲 Troco + Máq.",c:"#e67e22"}};
              const pg=PG[ped.pagamento||"pago"]||PG.pago;
              return(
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:"#5A6080",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Situação do Pagamento</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {Object.entries(PG).map(([k,v])=>(
                      <button key={k} onClick={()=>persistE(pedidos.map(p=>p.id===ped.id?{...p,pagamento:k}:p))}
                        style={{padding:"5px 10px",borderRadius:20,border:"1px solid "+(ped.pagamento===k?v.c+"80":v.c+"25"),background:ped.pagamento===k?v.c+"18":"transparent",color:ped.pagamento===k?v.c:"#6a6d80",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:ped.pagamento===k?700:500}}>
                        {v.l}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div style={{fontSize:11,color:"#3a3d50",marginBottom:10}}>Criado: {ped.criadoData} {ped.criadoHora}</div>
            <div style={{borderTop:"1px solid #14161e",paddingTop:10}}>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>{STATUS.filter(s=>s.id!==ped.status).map(s=><button key={s.id} onClick={()=>moverStatus(ped.id,s.id)} style={{flexGrow:1,padding:"7px 8px",borderRadius:8,border:"1px solid "+s.border,background:s.bg,color:s.color,cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{s.emoji} {s.label}</button>)}</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setObsEdit(o=>({...o,[ped.id]:ped.obs||""}))} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"7px",fontSize:12}}>💬 Obs</button>
                <button onClick={()=>imprimirBrowser(ped)} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"7px",fontSize:12}}><Icon name="printer" size={13}/> Imprimir Pedido</button>
                <button onClick={()=>excluirPedido(ped.id)} style={{...S.btn("danger"),padding:"7px 9px"}}><Icon name="trash" size={13}/></button>
              </div>
            </div>
          </div>
        );})}
      </div>)}
    {newPedido&&(<Sheet onClose={()=>setNewPedido(false)}>
      <div style={{fontSize:17,fontWeight:700,marginBottom:18}}>🚚 Novo Pedido de Entrega</div>
      <div style={{marginBottom:12}}><div style={{...S.lbl,marginBottom:6}}>Importar de uma Venda (opcional)</div><select style={S.input} value={nForm.vendaId} onChange={e=>{const v=sales.find(s=>s.id===e.target.value);if(v){const cli=customers.find(c=>c.name===v.customer);const end=cli?[cli.rua&&(cli.rua+(cli.numero?", "+cli.numero:"")),cli.bairro,cli.cidade&&(cli.cidade+(cli.uf?" - "+cli.uf:"")),cli.cep&&("CEP: "+cli.cep)].filter(Boolean).join(" · "):"";setNForm(f=>({...f,vendaId:e.target.value,cliente:v.customer,telefone:cli?.phone||"",endereco:end}));}else setNF("vendaId","");}}><option value="">— Selecionar venda —</option>{sales.slice(0,50).map(s=><option key={s.id} value={s.id}>{s.date} · {s.customer} · {fmt(s.total)}</option>)}</select></div>
      <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Cliente *</div><input style={S.input} placeholder="Nome do cliente" value={nForm.cliente} onChange={e=>setNF("cliente",e.target.value)}/></div>
      <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Telefone</div><input style={S.input} type="tel" placeholder="(00) 90000-0000" value={nForm.telefone} onChange={e=>setNF("telefone",e.target.value)}/></div>
      <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Endereço</div><textarea value={nForm.endereco} onChange={e=>setNF("endereco",e.target.value)} placeholder="Rua, número, bairro, cidade..." style={{...S.input,height:68,resize:"none",verticalAlign:"top",fontSize:13,lineHeight:1.4}}/>{enderecoDoCliente&&!nForm.endereco&&<button onClick={()=>setNF("endereco",enderecoDoCliente)} style={{...S.btn("ghost"),width:"100%",justifyContent:"center",marginTop:5,fontSize:12,padding:"7px"}}>📍 Usar endereço do cadastro</button>}</div>
      <div style={{marginBottom:20}}><div style={{...S.lbl,marginBottom:5}}>Observações</div><textarea value={nForm.obs} onChange={e=>setNF("obs",e.target.value)} placeholder="Ex: Ligar antes, portão azul..." style={{...S.input,height:60,resize:"none",verticalAlign:"top",fontSize:13,lineHeight:1.4}}/></div>
      <div style={{display:"flex",gap:10}}><button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={()=>{setNewPedido(false);setNForm({cliente:"",telefone:"",endereco:"",obs:"",vendaId:""});}}>Cancelar</button><button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={()=>{if(!nForm.cliente.trim()){notify("Informe o cliente!","error");return;}criarPedido({...nForm});setNForm({cliente:"",telefone:"",endereco:"",obs:"",vendaId:""});}}><Icon name="truck" size={14}/> Criar Pedido</button></div>
    </Sheet>)}
  </div>);}



// ── BACKUP LIST ────────────────────────────────────────────────────────────────
function BackupList({S,notify}){
  const [backups,setBackups]=useState([]);
  useEffect(()=>{
    // Backups agora ficam no Supabase, não em servidor local
    const key=localStorage.getItem('_sb_key')||"";
    if(!key) return;
    fetch(SUPABASE_URL+'/rest/v1/backups?select=id,tag,size_bytes,created_at&order=created_at.desc&limit=30',{
      headers:{'apikey':key,'Authorization':'Bearer '+key}
    }).then(r=>r.ok?r.json():[]).then(d=>setBackups(d||[])).catch(()=>setBackups([]));
  },[]);
  const restore=(id)=>{
    notify('Restauração de backup via Supabase ainda não implementada','warn');
  };
  const download=(id)=>{
    notify('Use o SQL Editor do Supabase para exportar backups','warn');
  };
  if(backups.length===0)return(<div style={{fontSize:12,color:"#3a3d50",padding:"8px 0"}}>Nenhum backup encontrado no Supabase.</div>);
  return(
    <div style={{maxHeight:180,overflowY:"auto"}}>
      {backups.map(b=>(
        <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #14161e"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#e8e9f0"}}>{b.tag}</div>
            <div style={{fontSize:10,color:"#5A6080"}}>{new Date(b.created_at).toLocaleString("pt-BR")} · {Math.round((b.size_bytes||0)/1024)}KB</div>
          </div>
          <button onClick={()=>download(b.id)} title="Baixar" style={{...S.btn("ghost"),padding:"4px 8px",fontSize:11}}>⬇️</button>
          <button onClick={()=>restore(b.id)} title="Restaurar" style={{...S.btn("ghost"),padding:"4px 8px",fontSize:11,color:"#f59e0b"}}>↩️</button>
        </div>
      ))}
    </div>
  );
}


// ── FORNECEDORES ──────────────────────────────────────────────────────────────
const loadFornecedores=()=>load("pdv_fornecedores",[]);
const saveFornecedores=v=>save("pdv_fornecedores",v);

function FornecedoresPage({S,notify}){
  const [lista,setLista]=useState(()=>loadFornecedores());
  const [sheet,setSheet]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [busca,setBusca]=useState("");
  const [form,setForm]=useState({nome:"",cnpj:"",telefone:"",email:"",contato:"",rua:"",numero:"",bairro:"",cidade:"",uf:"",cep:"",obs:""});
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  const persist=(v)=>{setLista(v);saveFornecedores(v);syncSave("fornecedores",v);};

  const openNew=()=>{setEditItem(null);setForm({nome:"",cnpj:"",telefone:"",email:"",contato:"",rua:"",numero:"",bairro:"",cidade:"",uf:"MG",cep:"",obs:""});setSheet(true);};
  const openEdit=(f)=>{setEditItem(f);setForm({...f});setSheet(true);};
  const saveF=()=>{
    if(!form.nome.trim()){notify("Informe o nome!","error");return;}
    if(editItem){persist(lista.map(x=>x.id===editItem.id?{...x,...form}:x));notify("Fornecedor atualizado ✓");}
    else{
      if(lista.find(x=>x.nome.toLowerCase()===form.nome.toLowerCase().trim())){notify("Fornecedor já cadastrado!","warn");return;}
      persist([{id:uid(),createdAt:Date.now(),...form},...lista]);
      notify("Fornecedor cadastrado ✓");
    }
    setSheet(false);
  };
  const buscarCEP=async()=>{
    const cep=form.cep.replace(/\D/g,"");
    if(cep.length!==8){notify("CEP inválido","warn");return;}
    try{
      const r=await fetch("https://viacep.com.br/ws/"+cep+"/json/");
      const d=await r.json();
      if(d.erro){notify("CEP não encontrado","warn");return;}
      setForm(f=>({...f,rua:d.logradouro||"",bairro:d.bairro||"",cidade:d.localidade||"",uf:d.uf||""}));
    }catch(e){notify("Erro ao buscar CEP","error");}
  };

  const filtrados=lista.filter(f=>
    !busca||f.nome.toLowerCase().includes(busca.toLowerCase())||
    (f.cnpj||"").includes(busca)||(f.cidade||"").toLowerCase().includes(busca.toLowerCase())
  );

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:"#5A6080"}}>{lista.length} fornecedor(es)</div>
        <button style={S.btn("primary")} onClick={openNew}><Icon name="plus" size={14}/> Novo Fornecedor</button>
      </div>
      <div style={{position:"relative",marginBottom:14}}>
        <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div>
        <input style={{...S.input,paddingLeft:34}} placeholder="Buscar por nome, CNPJ ou cidade..." value={busca} onChange={e=>setBusca(e.target.value)}/>
      </div>
      {filtrados.length===0&&<div style={{textAlign:"center",color:"#3a3d50",fontSize:13,padding:"40px 0"}}>Nenhum fornecedor cadastrado.</div>}
      {filtrados.map(f=>(
        <div key={f.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #3b82f6"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{f.nome}</div>
              <div style={{fontSize:11,color:"#5A6080",display:"flex",flexWrap:"wrap",gap:8}}>
                {f.cnpj&&<span>CNPJ: {f.cnpj}</span>}
                {f.telefone&&<span>📞 {f.telefone}</span>}
                {f.contato&&<span>👤 {f.contato}</span>}
              </div>
              {(f.rua||f.cidade)&&<div style={{fontSize:11,color:"#5A6080",marginTop:3}}>
                📍 {[f.rua&&(f.rua+(f.numero?", "+f.numero:"")),f.bairro,f.cidade&&(f.cidade+(f.uf?" - "+f.uf:""))].filter(Boolean).join(" · ")}
              </div>}
              {f.email&&<div style={{fontSize:11,color:"#3b82f6",marginTop:2}}>✉️ {f.email}</div>}
              {f.obs&&<div style={{fontSize:11,color:"#5A6080",marginTop:4,fontStyle:"italic"}}>{f.obs}</div>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:8}}>
              {f.telefone&&<a href={"https://wa.me/55"+f.telefone.replace(/\D/g,"")} target="_blank" style={{...S.btn("ghost"),padding:"6px 9px",color:"#25d366",textDecoration:"none"}}>💬</a>}
              <button style={{...S.btn("ghost"),padding:"6px 9px"}} onClick={()=>openEdit(f)}><Icon name="edit" size={13}/></button>
              <button style={{...S.btn("danger"),padding:"6px 9px"}} onClick={()=>persist(lista.filter(x=>x.id!==f.id))}><Icon name="trash" size={13}/></button>
            </div>
          </div>
        </div>
      ))}
      {sheet&&(
        <Sheet onClose={()=>setSheet(false)}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>{editItem?"✏️ Editar Fornecedor":"🏭 Novo Fornecedor"}</div>
          <div style={{marginBottom:10}}><div style={{...S.lbl,marginBottom:5}}>Nome / Razão Social *</div><input style={S.input} value={form.nome} onChange={e=>setF("nome",e.target.value)} placeholder="Ex: Distribuidora ABC Ltda"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><div style={{...S.lbl,marginBottom:5}}>CNPJ</div><input style={S.input} value={form.cnpj} onChange={e=>setF("cnpj",e.target.value)} placeholder="00.000.000/0001-00"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>Telefone / WhatsApp</div><input style={S.input} value={form.telefone} onChange={e=>setF("telefone",e.target.value)} placeholder="(37) 99999-9999"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><div style={{...S.lbl,marginBottom:5}}>E-mail</div><input style={S.input} value={form.email} onChange={e=>setF("email",e.target.value)} placeholder="contato@empresa.com"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>Contato / Vendedor</div><input style={S.input} value={form.contato} onChange={e=>setF("contato",e.target.value)} placeholder="Nome do responsável"/></div>
          </div>
          <div style={{...S.lbl,marginBottom:8,marginTop:4,color:"#3b82f6"}}>Endereço</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><div style={{...S.lbl,marginBottom:5}}>CEP</div>
              <div style={{display:"flex",gap:6}}>
                <input style={{...S.input}} value={form.cep} onChange={e=>setF("cep",e.target.value)} placeholder="35500-000" maxLength={9}/>
                <button onClick={buscarCEP} style={{...S.btn("ghost"),padding:"10px 12px",flexShrink:0,fontSize:12}}>🔍</button>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:10,marginBottom:10}}>
            <div><div style={{...S.lbl,marginBottom:5}}>Rua / Av.</div><input style={S.input} value={form.rua} onChange={e=>setF("rua",e.target.value)} placeholder="Rua das Flores"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>Nº</div><input style={S.input} value={form.numero} onChange={e=>setF("numero",e.target.value)} placeholder="100"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 60px",gap:10,marginBottom:10}}>
            <div><div style={{...S.lbl,marginBottom:5}}>Bairro</div><input style={S.input} value={form.bairro} onChange={e=>setF("bairro",e.target.value)} placeholder="Centro"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>Cidade</div><input style={S.input} value={form.cidade} onChange={e=>setF("cidade",e.target.value)} placeholder="Divinópolis"/></div>
            <div><div style={{...S.lbl,marginBottom:5}}>UF</div><input style={S.input} value={form.uf} onChange={e=>setF("uf",e.target.value)} placeholder="MG" maxLength={2}/></div>
          </div>
          <div style={{marginBottom:18}}><div style={{...S.lbl,marginBottom:5}}>Observações</div><textarea style={{...S.input,height:56,resize:"none",verticalAlign:"top",fontSize:13}} value={form.obs} onChange={e=>setF("obs",e.target.value)} placeholder="Prazo de pagamento, condições, etc."/></div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={()=>setSheet(false)}>Cancelar</button>
            <button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={saveF}><Icon name="check" size={14}/> Salvar</button>
          </div>
        </Sheet>
      )}
      {photoModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setPhotoModal(null)}>
          <img src={photoModal.photo} style={{maxWidth:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:14}} alt=""/>
          <div style={{marginTop:16,color:"#e8e9f0",fontSize:16,fontWeight:700,textAlign:"center"}}>{photoModal.name}</div>
          <div style={{color:"#f59e0b",fontSize:20,fontWeight:800,marginTop:4}}>{fmt(photoModal.priceAtacado||photoModal.price)}</div>
          <div style={{fontSize:12,color:"#5A6080",marginTop:8}}>Toque para fechar</div>
        </div>
      )}
    </div>
  );
}

// ── CATEGORY SHEET ─────────────────────────────────────────────────────────────
function CatSheet({S,cats,onSave,onClose}){
  // Cada item: { id, name }
  const toItems=(arr)=>arr.map((name,i)=>({id:i+"_"+name,name}));
  const [list,setList]=useState(()=>toItems(cats));
  const [newCat,setNewCat]=useState("");
  const inputRef=useRef(null);

  const updateName=(id,name)=>setList(l=>l.map(x=>x.id===id?{...x,name}:x));
  const addCat=()=>{
    const v=newCat.trim();
    if(!v||list.some(x=>x.name.toLowerCase()===v.toLowerCase()))return;
    setList(l=>[...l,{id:Date.now()+"",name:v}]);
    setNewCat("");inputRef.current?.focus();
  };
  const removeCat=(id)=>{if(list.length<=1)return;setList(l=>l.filter(x=>x.id!==id));};
  const moveUp=(idx)=>{if(idx===0)return;const l=[...list];[l[idx-1],l[idx]]=[l[idx],l[idx-1]];setList(l);};
  const moveDown=(idx)=>{if(idx===list.length-1)return;const l=[...list];[l[idx],l[idx+1]]=[l[idx+1],l[idx]];setList(l);};
  const resetDefault=()=>setList(toItems(DEFAULT_CATS));
  const handleSave=()=>{
    const names=list.map(x=>x.name.trim()).filter(Boolean);
    onSave(names);onClose();
  };

  return(<Sheet onClose={onClose}>
    <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>🏷️ Categorias</div>
    <div style={{fontSize:12,color:"#5A6080",marginBottom:16}}>Edite o nome direto no campo. Toque + para adicionar.</div>

    {/* Campo nova categoria */}
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      <input ref={inputRef} style={{...S.input,flex:1}} placeholder="Nome da nova categoria..." value={newCat}
        onChange={e=>setNewCat(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&addCat()}
      />
      <button onClick={addCat} disabled={!newCat.trim()} style={{...S.btn("primary"),padding:"10px 14px",flexShrink:0,opacity:newCat.trim()?1:0.4}}>
        <Icon name="plus" size={15}/>
      </button>
    </div>

    {/* Lista editável */}
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16,maxHeight:"50dvh",overflowY:"auto"}}>
      {list.map((item,idx)=>(
        <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,background:"#0F1220",border:"1px solid #1a1c2e",borderRadius:10,padding:"8px 10px"}}>
          {/* Reordenar */}
          <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0}}>
            <button onMouseDown={e=>{e.preventDefault();moveUp(idx);}} disabled={idx===0}
              style={{background:"none",border:"none",color:idx===0?"#252845":"#6a6d80",cursor:idx===0?"default":"pointer",padding:"2px 5px",fontSize:11,lineHeight:1}}>▲</button>
            <button onMouseDown={e=>{e.preventDefault();moveDown(idx);}} disabled={idx===list.length-1}
              style={{background:"none",border:"none",color:idx===list.length-1?"#252845":"#6a6d80",cursor:idx===list.length-1?"default":"pointer",padding:"2px 5px",fontSize:11,lineHeight:1}}>▼</button>
          </div>

          {/* Input sempre visível — edição direta */}
          <input
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e8e9f0",fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:14,padding:"2px 0"}}
            value={item.name}
            onChange={e=>updateName(item.id,e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")e.target.blur();}}
          />

          {/* Deletar */}
          <button onMouseDown={e=>{e.preventDefault();removeCat(item.id);}} disabled={list.length<=1}
            style={{...S.btn("danger"),padding:"5px 7px",flexShrink:0,opacity:list.length<=1?0.3:1}}>
            <Icon name="trash" size={13}/>
          </button>
        </div>
      ))}
    </div>

    <button onClick={resetDefault} style={{...S.btn("ghost"),width:"100%",justifyContent:"center",marginBottom:12,fontSize:12,padding:"9px"}}>
      🔄 Restaurar categorias padrão ({DEFAULT_CATS.length})
    </button>

    <div style={{display:"flex",gap:10}}>
      <button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={onClose}>Cancelar</button>
      <button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={handleSave}>
        <Icon name="check" size={14}/> Salvar {list.length} categorias
      </button>
    </div>
  </Sheet>);}

// ── MAIN APP ────────────────────────────────────────────────────────────────────
export default function PDVApp(){
  const [keyReady,setKeyReady]=useState(!!localStorage.getItem('_sb_key'));
  // Re-verifica a chave a cada vez que o app carrega
  useEffect(()=>{
    const k=localStorage.getItem('_sb_key');
    if(!k) setKeyReady(false);
  },[]);
  const [currentUser,setCurrentUser]=useState(()=>{
    const u=load("pdv_session",null);
    // Sempre atualiza permissões do admin ao carregar sessão
    if(u&&u.role==="admin") return {...u,permissions:ADMIN_PERMS};
    return u;
  });
  const [page,setPage]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(false);
  const [products,setProducts]=useState(()=>load("pdv_products",[]));
  const [customers,setCustomers]=useState(()=>load("pdv_customers",[]));
  const [sales,setSales]=useState(()=>load("pdv_sales",[]));
  const [pedidos,setPedidos]=useState(()=>load("pdv_entregas",[]));
  const [fornecedores,setFornecedores]=useState(()=>load("pdv_fornecedores",[]));
  const [appReady,setAppReady]=useState(false);
  // Todos os hooks acima — return condicional só depois
  if(!keyReady) return <KeySetupScreen onDone={()=>setKeyReady(true)}/>;
  const [serverOk,setServerOk]=useState(null);
  const persistP=(v)=>{setProducts(v);syncSave("products",v);};
  const persistC=(v)=>{setCustomers(v);syncSave("customers",v);};
  const persistS=(v)=>{setSales(v);syncSave("sales",v);};
  const persistE=(v)=>{setPedidos(v);syncSave("entregas",v);};
  const persistForn=(v)=>{setFornecedores(v);syncSave("fornecedores",v);};
  const [cart,setCart]=useState([]);const [saleCustomer,setSaleCustomer]=useState("Avulso");const [salePayment,setSalePayment]=useState("Dinheiro");
  const [cartOpen,setCartOpen]=useState(false);const [toast,setToast]=useState(null);
  const [searchProd,setSearchProd]=useState("");const [searchCust,setSearchCust]=useState("");const [filterCat,setFilterCat]=useState("Todos");
  const [prodSheet,setProdSheet]=useState(false);const [custSheet,setCustSheet]=useState(false);const [editProd,setEditProd]=useState(null);const [editCust,setEditCust]=useState(null);
  const [deleteTarget,setDeleteTarget]=useState(null);const [prodSheetPrefill,setProdSheetPrefill]=useState("");
  const [showFilters,setShowFilters]=useState(false);const [sortBy,setSortBy]=useState("name");const [filterAvail,setFilterAvail]=useState("all");const [priceMin,setPriceMin]=useState("");const [priceMax,setPriceMax]=useState("");
  const [scannerOpen,setScannerOpen]=useState(false);
  const [photoModal,setPhotoModal]=useState(null);
  const [editSale,setEditSale]=useState(null); // venda sendo editada no histórico
  const [editSaleForm,setEditSaleForm]=useState({customer:"",payment:"",date:"",items:[]}); // product with photo
  const [cats,setCats]=useState(()=>loadCats());
  const [catSheet,setCatSheet]=useState(false);
  const persistCats=(v)=>{setCats(v);saveCats(v);syncSave("categorias",v);};

  const notify=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2600);};

  // ── SYNC: carrega do servidor e polling 8s ───────────────────────────────
  const _syncRef=useRef(false);
  // Carrega dados do Supabase uma vez ao iniciar (sem polling)
  if(!_syncRef.current){
    _syncRef.current=true;
    syncLoad().then(async data=>{
      if(data){
        if(Array.isArray(data.products))    setProducts(data.products);
        if(Array.isArray(data.customers))   setCustomers(data.customers);
        if(Array.isArray(data.sales))       setSales(data.sales);
        if(Array.isArray(data.entregas))    setPedidos(data.entregas);
        if(Array.isArray(data.fornecedores))setFornecedores(data.fornecedores);
        if(Array.isArray(data.categorias)&&data.categorias.length) setCats(data.categorias);
        setServerOk(true);
      } else { setServerOk(false); }
      const sbUsers=await loadUsersFromSupabase();
      if(sbUsers&&sbUsers.length>0) setUsers(sbUsers);
      setAppReady(true);
    }).catch(()=>{ setServerOk(false); setAppReady(true); });
  }
  // Recarrega dados manualmente (botão Atualizar)
  const reloadFromSupabase=async(showNotify=true)=>{
    try{
      const data=await syncLoad();
      if(data){
        if(Array.isArray(data.products))    setProducts(data.products);
        if(Array.isArray(data.customers))   setCustomers(data.customers);
        if(Array.isArray(data.sales))       setSales(data.sales);
        if(Array.isArray(data.entregas))    setPedidos(data.entregas);
        if(Array.isArray(data.fornecedores))setFornecedores(data.fornecedores);
        if(Array.isArray(data.categorias)&&data.categorias.length) setCats(data.categorias);
        setServerOk(true);
        if(showNotify) notify('Dados atualizados! ✓');
        return true;
      }
    }catch(e){console.warn('reload error',e);}
    return false;
  };

  const saveProduct=(form)=>{
    if(!form.name||!form.price||form.stock===""){notify("Preencha todos os campos!","error");return;}
    const item={name:form.name.trim(),category:form.category,price:+form.price,priceAtacado:form.priceAtacado?+form.priceAtacado:0,costPrice:form.costPrice?+form.costPrice:0,comissaoProd:form.comissaoProd?+form.comissaoProd:0,atacadoHabilitado:form.atacadoHabilitado||false,stock:+form.stock,minStock:form.minStock?+form.minStock:0,unit:form.unit||"unid",barcode:form.barcode||"",photo:form.photo||"",description:form.description||""};
    if(editProd){persistP(products.map(x=>x.id===editProd.id?{...x,...item}:x));notify("Produto atualizado! ✓");}
    else{if(products.find(p=>p.name.toLowerCase()===item.name.toLowerCase())){notify('"'+item.name+'" já existe!',"warn");return;}persistP([{id:uid(),...item,createdAt:Date.now()},...products]);notify("Produto cadastrado! ✓");}
    setEditProd(null);setProdSheetPrefill("");setProdSheet(false);
  };

  const saveCustomer=(form)=>{
    if(!form.name){notify("Informe o nome!","error");return;}
    const base={name:form.name,email:form.email||"",phone:form.phone||"",cpf:form.cpf||"",rua:form.rua||"",numero:form.numero||"",complemento:form.complemento||"",bairro:form.bairro||"",cidade:form.cidade||"",uf:form.uf||"",cep:form.cep||""};
    if(editCust){persistC(customers.map(x=>x.id===editCust.id?{...x,...base}:x));notify("Cliente atualizado! ✓");}
    else{persistC([{id:uid(),...base,purchases:0,totalSpent:0,lastVisit:todayStr(),createdAt:Date.now()},...customers]);notify("Cliente cadastrado! ✓");}
    setEditCust(null);setCustSheet(false);
  };

  const updateProduct=(prodId,changes)=>persistP(products.map(p=>p.id===prodId?{...p,...changes}:p));

  const addToCart=(p)=>{if(p.stock<=0){notify("Produto sem estoque!","error");return;}setCart(c=>{const ex=c.find(i=>i.id===p.id);if(ex){if(ex.qty>=p.stock){notify("Estoque insuficiente!","error");return c;}return c.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i);}return[...c,{...p,qty:1}];});notify(p.name+" ✓","info");};
  const rmCart=(id)=>{if(id==="__all__")setCart([]);else setCart(c=>c.filter(i=>i.id!==id));};
  const chgQty=(id,d,override)=>setCart(c=>c.map(i=>{if(i.id!==id)return i;if(override)return{...i,name:override.name||i.name,price:override.price!=null?override.price:i.price,qty:Math.max(0.001,override.qty!=null?override.qty:i.qty+d)};return{...i,qty:Math.max(1,i.qty+d)};}));
  const cartTotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);

  const doFinalizeSale=(criarEntrega=false,enderecoEntrega="",nomeEntrega="",obsEntrega="")=>{
    if(cart.length===0){notify("Carrinho vazio!","error");return;}
    const saleId=uid();const nomeCliente=nomeEntrega||saleCustomer;
    const newSale={id:saleId,customer:nomeCliente,items:cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),total:cartTotal,payment:salePayment,date:todayStr(),time:nowTime(),createdAt:Date.now()};
    persistS([newSale,...sales]);
    persistP(products.map(prod=>{const ci=cart.find(i=>i.id===prod.id);return ci?{...prod,stock:Math.max(0,prod.stock-ci.qty)}:prod;}));
    if(saleCustomer!=="Avulso")persistC(customers.map(c=>c.name===saleCustomer?{...c,purchases:c.purchases+1,totalSpent:c.totalSpent+cartTotal,lastVisit:todayStr()}:c));
    if(criarEntrega){const cliObj=customers.find(c=>c.name===saleCustomer);const peds=load("pdv_entregas",[]);const novoPedido={id:uid(),numero:"PED-"+String(peds.length+1).padStart(4,"0"),cliente:nomeEntrega||saleCustomer,telefone:cliObj?.phone||"",endereco:enderecoEntrega||"",itens:cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),total:cartTotal,obs:obsEntrega||"",status:"pedido",isPrazo:salePayment==="A Prazo",criadoEm:Date.now(),criadoData:todayStr(),criadoHora:nowTime(),vendaId:saleId};save("pdv_entregas",[novoPedido,...peds]);notify("Venda finalizada + Entrega criada! 🚚");}
    else notify("Venda de "+fmt(cartTotal)+" finalizada! ✓");
    setCart([]);setSaleCustomer("Avulso");setCartOpen(false);
  };
  const finalizeSale=()=>doFinalizeSale(false);
  const finalizeSaleComEntrega=(endereco,nome,obs)=>doFinalizeSale(true,endereco,nome,obs);

  // Gera HTML do recibo de venda

  // Converte número para extenso em PT-BR
  const numExtenso=(n)=>{
    if(n===0)return"zero";
    const u=["","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
    const d=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
    const c=["","cem","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
    const partes=[];
    let v=Math.round(n*100);
    const cents=v%100;v=Math.floor(v/100);
    const milhar=Math.floor(v/1000);const resto=v%1000;
    const centenas=Math.floor(resto/100);const dezenas=Math.floor((resto%100)/10);const unidades=resto%100;
    if(milhar>0)partes.push(milhar===1?"mil":numExtenso(milhar)+" mil");
    if(centenas>0){if(unidades===0&&dezenas===0&&centenas===1)partes.push("cem");else partes.push(c[centenas]);}
    if(unidades<20&&unidades>0)partes.push(u[unidades]);
    else{if(dezenas>0)partes.push(d[dezenas]);if(unidades%10>0)partes.push(u[unidades%10]);}
    let reais=partes.join(" e ")||"zero";
    reais+= v===1?" real":" reais";
    if(cents>0)reais+=" e "+(cents<20?u[cents]:d[Math.floor(cents/10)]+(cents%10>0?" e "+u[cents%10]:""))+(cents===1?" centavo":" centavos");
    return reais;
  };

  const gerarNotaPromissoria=(nome,cpf,endereco,telefone,total,dataEmissao,numRef)=>{
    const meses=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    const dt=new Date(dataEmissao+"T12:00");
    const dia=dt.getDate();const mes=meses[dt.getMonth()];const ano=dt.getFullYear();
    const ext=numExtenso(total);
    return [
      "<div style='font-family:Arial,sans-serif;max-width:620px;margin:32px auto;border:2px solid #2D3A8C;border-radius:4px;padding:0;page-break-before:always'>",
      // Cabeçalho
      "<div style='background:#2D3A8C;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center'>",
      "  <div style='display:flex;align-items:center;gap:12px'><img src='"+LOGO_SRC+"' alt='logo' style='height:40px'/>"+"<div><div style='font-size:16px;font-weight:900;letter-spacing:2px'>NOTA PROMISSÓRIA</div>"+"<div style='font-size:10px;opacity:.8'>Pecuarão Gontijo - Depósito & Agropecuária</div></div></div>",
      "  <div style='text-align:right;font-size:11px'>Nº: "+(numRef||"_______")+"<br>Emissão: "+new Date().toLocaleDateString("pt-BR")+"</div>",
      "</div>",
      // Valor e vencimento
      "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #ddd'>",
      "  <div style='padding:14px 20px;border-right:1px solid #ddd'>",
      "    <div style='font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px'>Valor</div>",
      "    <div style='font-size:22px;font-weight:900;color:#c0392b'>"+fmt(total)+"</div>",
      "  </div>",
      "  <div style='padding:14px 20px'>",
      "    <div style='font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px'>Vencimento</div>",
      "    <div style='font-size:16px;font-weight:700'>_____ / _____ / __________</div>",
      "  </div>",
      "</div>",
      // Texto legal
      "<div style='padding:18px 20px;font-size:13px;line-height:2;border-bottom:1px solid #ddd'>",
      "  Aos <u>&nbsp;&nbsp;<b>"+dia+"</b>&nbsp;&nbsp;</u> dias do mês de <u>&nbsp;&nbsp;<b>"+mes+"</b>&nbsp;&nbsp;</u> de <u>&nbsp;&nbsp;<b>"+ano+"</b>&nbsp;&nbsp;</u>,",
      "  pagarei por esta única via de <strong>NOTA PROMISSÓRIA</strong> a",
      "  <u><b> PECUARÃO GONTIJO - DEPÓSITO & AGROPECUÁRIA </b></u>, ou à sua ordem,",
      "  a quantia de:<br>",
      "  <div style='border:1px dashed #999;border-radius:4px;padding:8px 12px;margin:8px 0;font-style:italic;color:#333;background:#fafafa'><b>"+ext.charAt(0).toUpperCase()+ext.slice(1)+"</b></div>",
      "  em moeda corrente nacional, com vencimento em _____ / _____ / __________, no endereço:<br>",
      "  <b>Rua Guarani, 461 - Jardim Candidés - Divinópolis/MG | Tel: (37) 99922-1020</b>",
      "</div>",
      // Devedor
      "<div style='padding:14px 20px;border-bottom:1px solid #ddd;font-size:12px'>",
      "  <b>Devedor:</b> "+(nome||"_".repeat(40))+(cpf?" &nbsp;|&nbsp; <b>CPF/CNPJ:</b> "+cpf:"")+(telefone?" &nbsp;|&nbsp; <b>Tel:</b> "+telefone:"")+"<br>",
      "  <b>Endereço:</b> "+(endereco||"_".repeat(60)),
      "</div>",
      // Assinaturas
      "<div style='display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px 20px'>",
      "  <div>",
      "    <div style='border-top:2px solid #333;padding-top:8px;text-align:center;font-size:11px'>",
      "      Assinatura do Devedor<br><span style='color:#888;font-size:10px'>"+(nome||"")+"</span>",
      "    </div>",
      "  </div>",
      "  <div>",
      "    <div style='border-top:2px solid #333;padding-top:8px;text-align:center;font-size:11px'>",
      "      Assinatura do Credor<br><span style='color:#888;font-size:10px'>Pecuarão Gontijo</span>",
      "    </div>",
      "  </div>",
      "</div>",
      "<div style='background:#f8f8f8;border-top:1px solid #ddd;padding:8px 20px;font-size:9px;color:#aaa;text-align:center'>",
      "Este título é regido pela Lei nº 7.357/85 e legislação cambial vigente.",
      "</div>",
      "</div>"
    ].join("");
  };

  const htmlRecibo=(s,cliente)=>{
    const isPrazo=s.payment==="A Prazo";
    const dataStr=s.date||todayStr();
    const itemRows=s.items.map(i=>"<tr><td>"+i.name+"</td><td style='text-align:center'>"+i.qty+"</td><td style='text-align:right;font-weight:600'>"+fmt(i.price*i.qty)+"</td></tr>").join("");
    const endCli=cliente?[cliente.rua&&(cliente.rua+(cliente.numero?", "+cliente.numero:"")),cliente.bairro,cliente.cidade&&(cliente.cidade+(cliente.uf?" - "+cliente.uf:""))].filter(Boolean).join(", "):"";
    const promissoria=isPrazo?gerarNotaPromissoria(
      cliente?.name||s.customer, cliente?.cpf||"", endCli, cliente?.phone||"",
      s.total, dataStr, s.id.slice(-6).toUpperCase()
    ):"";
    const css="body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#111;}table{width:100%;border-collapse:collapse;font-size:13px;}th{background:#f3f4f6;padding:7px 8px;text-align:left;font-size:11px;text-transform:uppercase;}td{padding:7px 8px;border-bottom:1px solid #f3f4f6;}.total{font-size:17px;font-weight:700;text-align:right;margin-top:8px;color:#e74c3c;}@media print{body{max-width:100%;padding:10px}}";
    return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Recibo</title><style>"+css+"</style></head><body>"+
      "<div style='background:#2D3A8C;color:#fff;padding:14px;text-align:center;border-radius:8px;margin-bottom:16px'>"+
      "<img src='"+LOGO_SRC+"' alt='logo' style='height:48px;display:block;margin:0 auto 8px'/>"+
      "<div style='font-size:16px;font-weight:800;letter-spacing:1px'>RECIBO DE VENDA</div>"+
      "<div style='font-size:11px;margin-top:4px'>"+s.date+" "+s.time+" · Nº "+s.id.slice(-8).toUpperCase()+"</div></div>"+
      "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:14px'>"+
      "<div style='font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px'>Cliente</div>"+
      "<div style='font-weight:700;font-size:14px'>"+(cliente?.name||s.customer)+"</div>"+
      (cliente?.cpf?"<div style='font-size:12px;color:#666'>CPF/CNPJ: "+cliente.cpf+"</div>":"")+
      (cliente?.phone?"<div style='font-size:12px;color:#666'>Tel: "+cliente.phone+"</div>":"")+
      (endCli?"<div style='font-size:12px;color:#666'>"+endCli+"</div>":"")+
      "</div>"+
      "<table><thead><tr><th>Produto</th><th>Qtd</th><th>Total</th></tr></thead><tbody>"+itemRows+"</tbody></table>"+
      "<div class='total'>TOTAL: "+fmt(s.total)+"</div>"+
      "<div style='display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#666'>"+
      "<span>Pagamento: <b>"+s.payment+"</b></span>"+
      (isPrazo?"<span style='color:#c0392b;font-weight:700'>⚠️ A PRAZO</span>":"")+
      "</div>"+
      "<div style='margin-top:20px;border-top:2px solid #2D3A8C;padding-top:14px;text-align:center'>"+"<div style='font-size:13px;font-weight:700;color:#2D3A8C'>Pecuarão Gontijo</div>"+"<div style='font-size:11px;color:#666'>Rua Guarani, 461 - Jardim Candidés - Divinópolis/MG</div>"+"<div style='font-size:11px;color:#666'>📞 (37) 99922-1020 · CNPJ: 62.321.434/0001-40</div>"+"<div style='font-size:12px;margin-top:8px;color:#E8682A;font-style:italic'>Obrigado pela preferência! 🐾</div>"+"</div>"+
      promissoria+
      "</body></html>";
  };

  const imprimirRecibo=(s)=>{
    const cliente=customers.find(c=>c.name===s.customer);
    const html=htmlRecibo(s,cliente);
    const w=window.open("","_blank","width=500,height=750");
    if(w){w.document.write(html);w.document.close();setTimeout(()=>{try{w.print();}catch(_){}},600);}
    else notify("Permita pop-ups para imprimir.","warn");
  };

  const compartilharRecibo=(s)=>{
    const cliente=customers.find(c=>c.name===s.customer);
    const isPrazo=s.payment==="A Prazo";
    const linhas=[
      "🧾 *RECIBO DE VENDA*",
      "📅 "+s.date+" "+s.time,
      "",
      "👤 *Cliente:* "+(cliente?.name||s.customer),
      cliente?.cpf?"📋 CPF/CNPJ: "+cliente.cpf:"",
      "",
      "*Itens:*",
      ...s.items.map(i=>"• "+i.qty+"× "+i.name+" — "+fmt(i.price*i.qty)),
      "",
      "💰 *TOTAL: "+fmt(s.total)+"*",
      "💳 Pagamento: "+s.payment,
      isPrazo?"⚠️ *Venda a prazo — aguardando pagamento*":"",
      "",
      "Obrigado pela preferência! 🙏",
    ].filter(v=>v!==null&&v!==undefined&&v!=="");
    const texto=linhas.join("\n");
    if(navigator.share){
      navigator.share({title:"Recibo de Venda",text:texto}).catch(()=>{});
    } else {
      // Tenta abrir WhatsApp
      const tel=cliente?.phone?cliente.phone.replace(/\D/g,""):"";
      if(tel){window.open("https://wa.me/55"+tel+"?text="+encodeURIComponent(texto),"_blank");}
      else{navigator.clipboard?.writeText(texto).then(()=>notify("Texto copiado!")).catch(()=>notify("Copie o texto manualmente","warn"));}
    }
  };

  const exportPDF=async()=>{if(sales.length===0){notify("Nenhuma venda.","warn");return;}notify("Gerando PDF...","info");try{for(const src of["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js","https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"]){if(!document.querySelector('script[src="'+src+'"]'))await new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}const {jsPDF}=window.jspdf;const d=new jsPDF();d.setFontSize(18);d.setTextColor(255,107,53);d.text("PDV Pro — Relatório de Vendas",14,22);d.setFontSize(10);d.setTextColor(120);d.text("Gerado: "+new Date().toLocaleString("pt-BR")+" · Total: "+fmt(sales.reduce((s,v)=>s+v.total,0)),14,30);d.autoTable({startY:36,head:[["Cliente","Itens","Total","Pagamento","Data"]],body:sales.map(s=>[s.customer,s.items.map(i=>i.qty+"× "+i.name).join(", "),fmt(s.total),s.payment,s.date+" "+s.time]),theme:"striped",headStyles:{fillColor:[255,107,53]},styles:{fontSize:9}});d.save("pdv-vendas.pdf");notify("PDF exportado! ✓");}catch{notify("Erro ao gerar PDF.","error");}};

  const categories=useMemo(()=>["Todos",...Array.from(new Set(products.map(p=>p.category)))],(products));
  const filtProd=useMemo(()=>products.filter(p=>(filterCat==="Todos"||p.category===filterCat)&&p.name.toLowerCase().includes(searchProd.toLowerCase())),[products,filterCat,searchProd]);
  const filtProdSorted=useMemo(()=>{
    let list=filtProd.filter(p=>{if(filterAvail==="instock")return p.stock>0;if(filterAvail==="low")return p.stock>0&&p.stock<10;if(filterAvail==="out")return p.stock===0;return true;});
    if(priceMin!=="")list=list.filter(p=>p.price>=+priceMin);if(priceMax!=="")list=list.filter(p=>p.price<=+priceMax);
    if(searchProd&&searchProd.match(/^[0-9]{6,}/)){const byBarcode=products.filter(p=>p.barcode&&p.barcode.includes(searchProd));if(byBarcode.length>0)list=[...new Map([...byBarcode,...list].map(p=>[p.id,p])).values()];}
    return[...list].sort((a,b)=>{if(sortBy==="name")return a.name.localeCompare(b.name);if(sortBy==="nameZ")return b.name.localeCompare(a.name);if(sortBy==="priceAsc")return a.price-b.price;if(sortBy==="priceDesc")return b.price-a.price;if(sortBy==="stock")return b.stock-a.stock;if(sortBy==="stockAsc")return a.stock-b.stock;return 0;});
  },[filtProd,filterAvail,priceMin,priceMax,sortBy,searchProd,products]);

  const todaySales=sales.filter(s=>s.date===todayStr());const todayRev=todaySales.reduce((s,v)=>s+v.total,0);const totalRev=sales.reduce((s,v)=>s+v.total,0);
  const lowStock=products.filter(p=>p.stock>0&&p.stock<(p.minStock||10));const outStock=products.filter(p=>p.stock===0);
  const listaItems=load("pdv_lista_compras",[]);const listaPendentes=listaItems.filter(i=>i.fase!=="comprado"&&i.fase!=="faltou").length;
  const entregasData=load("pdv_entregas",[]);const entregasAtivas=entregasData.filter(e=>e.status!=="concluido").length;

  const perm=(k)=>currentUser?.role==="admin"||(currentUser?.permissions?.[k]===true);
  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"home",perm:true},
    {id:"pdv",label:"PDV / Vendas",icon:"cart",perm:perm("pdv")},
    {id:"atacado",label:"Venda Atacado",icon:"trending",perm:perm("atacado")},
    {id:"entregas",label:"Entregas",icon:"truck",perm:perm("entregas")},
    {id:"lista",label:"Lista de Compras",icon:"list",perm:perm("lista")},
    {id:"importar",label:"Importar NF-e",icon:"import",perm:perm("importar")},
    {id:"estoque",label:"Estoque",icon:"box",perm:perm("estoque")},
    {id:"clientes",label:"Clientes",icon:"users",perm:perm("clientes")},
    {id:"historico",label:"Histórico",icon:"receipt",perm:perm("historico")},
    {id:"usuarios",label:"Usuários",icon:"users",perm:currentUser?.role==="admin"},
    {id:"fornecedores",label:"Fornecedores",icon:"users",perm:perm("fornecedores")||currentUser?.role==="admin"},
  ].filter(n=>n.perm);

  const goTo=(id)=>{setPage(id);setSideOpen(false);};
  const endFmtC=(c)=>{const parts=[];if(c.rua)parts.push(c.rua+(c.numero?", "+c.numero:""));if(c.complemento)parts.push(c.complemento);if(c.bairro)parts.push(c.bairro);if(c.cidade)parts.push(c.cidade+(c.uf?" - "+c.uf:""));if(c.cep)parts.push("CEP: "+c.cep);return parts.join(" · ");};

  const S={
    app:{display:"flex",height:"100dvh",fontFamily:"'Sora',sans-serif",background:"#0A0C1E",color:"#e8e9f0",overflow:"hidden"},
    main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0},
    topbar:{background:"#0D1024",borderBottom:"1px solid #1a1c2e",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexShrink:0},
    content:{flex:1,overflowY:"auto",overflowX:"hidden",padding:"16px 16px 100px"},
    card:{background:"#0F1220",border:"1px solid #1a1c2e",borderRadius:12,padding:16},
    statCard:(a)=>({background:"#0F1220",border:"1px solid "+a+"22",borderRadius:12,padding:14}),
    lbl:{fontSize:11,color:"#5A6080",textTransform:"uppercase",letterSpacing:1},
    badge:(c)=>({display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:c+"22",color:c}),
    btn:(v="primary")=>({display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontWeight:600,fontSize:13,transition:"opacity .15s",...(v==="primary"?{background:"linear-gradient(135deg,#E8682A,#F07030)",color:"#fff"}:v==="danger"?{background:"#ff3b3b18",color:"#ff3b3b"}:{background:"#1E2245",color:"#8a8da0"})}),
    input:{background:"#0A0C1E",border:"1px solid #1a1c2e",borderRadius:8,padding:"11px 13px",color:"#e8e9f0",fontFamily:"'Sora',sans-serif",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"},
  };

  if(!currentUser) return <LoginScreen S={S} onLogin={u=>{setCurrentUser(u);save("pdv_session",u);}}/>;

  if(!appReady) return(
    <div style={{position:"fixed",inset:0,background:"#0A0C1E",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif"}}>
      <img src={LOGO_SRC} alt="Pecuarão Gontijo" style={{height:80,objectFit:"contain",marginBottom:16}}/>
      <div style={{fontSize:13,color:"#5A6080",marginBottom:28}}>Sincronizando dados do servidor...</div>
      <div style={{width:200,height:3,background:"#1E2245",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:"45%",background:"linear-gradient(90deg,#E8682A,#F07030)",borderRadius:2,animation:"slide 1.2s ease infinite"}}/>
      </div>
      <style dangerouslySetInnerHTML={{__html:"@keyframes slide{0%{transform:translateX(-200%)}100%{transform:translateX(600%)}}"}}/>
    </div>
  );



  return(<>
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
    <div style={S.app}>
      {sideOpen&&(<div style={{position:"fixed",inset:0,zIndex:1000,display:"flex"}}>
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.70)"}} onClick={()=>setSideOpen(false)}/>
        <div style={{position:"relative",width:255,background:"#0D1024",borderRight:"1px solid #1a1c2e",display:"flex",flexDirection:"column",padding:"24px 0",zIndex:1}}>
          <div style={{padding:"0 18px 20px",borderBottom:"1px solid #1a1c2e",marginBottom:10}}><img src={LOGO_SRC} alt="Pecuarão" style={{height:30,objectFit:"contain",maxWidth:120}}/><div style={{fontSize:10,color:"#3a3d50",textTransform:"uppercase",letterSpacing:2,marginTop:3}}>Sistema de Vendas</div></div>
          {NAV.map(n=>(<button key={n.id} onClick={()=>goTo(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 18px",cursor:"pointer",border:"none",background:page===n.id?"linear-gradient(90deg,rgba(255,107,53,.18),transparent)":"transparent",color:page===n.id?"#E8682A":"#6a6d80",fontSize:13,fontWeight:page===n.id?600:400,borderLeft:"3px solid "+(page===n.id?"#E8682A":"transparent"),width:"100%",textAlign:"left"}}>
            <Icon name={n.icon} size={15}/>{n.label}
            {n.id==="pdv"&&cartCount>0&&<span style={{...S.badge("#E8682A"),marginLeft:"auto",fontSize:11}}>{cartCount}</span>}
            {n.id==="lista"&&listaPendentes>0&&<span style={{...S.badge("#f59e0b"),marginLeft:"auto",fontSize:11}}>{listaPendentes}</span>}
            {n.id==="entregas"&&entregasAtivas>0&&<span style={{...S.badge("#3b82f6"),marginLeft:"auto",fontSize:11}}>{entregasAtivas}</span>}
          </button>))}
          <div style={{marginTop:"auto",padding:"14px 18px",borderTop:"1px solid #1a1c2e",fontSize:11,color:"#252845",lineHeight:1.7}}>{products.length} produtos · {customers.length} clientes<br/>{sales.length} vendas</div>
        </div>
      </div>)}

      <div style={S.main}>
        <div style={S.topbar}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={()=>setSideOpen(true)} style={{background:"none",border:"none",color:"#e8e9f0",cursor:"pointer",padding:4,display:"flex"}}><Icon name="menu" size={22}/></button><div style={{fontSize:15,fontWeight:700}}>{NAV.find(n=>n.id===page)?.label}</div></div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            {(lowStock.length+outStock.length)>0&&<span style={{...S.badge("#F07030"),cursor:"pointer",fontSize:11,gap:4}} onClick={()=>goTo("estoque")}><Icon name="alert" size={10} color="#F07030"/>{lowStock.length+outStock.length}</span>}
            {page==="pdv"&&<button onClick={()=>setCartOpen(true)} style={{...S.btn("primary"),padding:"7px 13px",borderRadius:20,fontSize:12}}><Icon name="cart" size={13}/>{cartCount>0?cartCount+" · "+fmt(cartTotal):"Carrinho"}</button>}
            {page!=="pdv"&&<div style={{...S.badge("#4A5BC4"),fontSize:11}}>{new Date().toLocaleDateString("pt-BR")}</div>}
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"3px 9px",borderRadius:20,background:serverOk===true?"#4ade8018":serverOk===false?"#ff3b3b18":"#f59e0b18",border:"1px solid "+(serverOk===true?"#4ade8040":serverOk===false?"#ff3b3b40":"#f59e0b40"),color:serverOk===true?"#4ade80":serverOk===false?"#ff3b3b":"#f59e0b"}}>
                <div style={{width:6,height:6,borderRadius:3,background:serverOk===true?"#4ade80":serverOk===false?"#ff3b3b":"#f59e0b"}}/>
                {serverOk===true?"Sync":serverOk===false?"Offline":"..."}
              </div>
              <button onClick={()=>{setCurrentUser(null);save("pdv_session",null);}} style={{...S.btn("ghost"),padding:"5px 8px",fontSize:11}} title="Sair"><Icon name="logout" size={14}/></button>
          </div>
        </div>

        <div style={S.content}>
          {/* DASHBOARD */}
          {page==="dashboard"&&(products.length===0&&sales.length===0?
            <EmptyState icon="🏪" title="Bem-vindo ao PDV Pro!" desc="Importe uma NF-e ou cadastre produtos para começar." action={<div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><button style={S.btn("primary")} onClick={()=>goTo("importar")}><Icon name="import" size={14}/> Importar NF-e</button><button style={S.btn()} onClick={()=>{goTo("estoque");setTimeout(()=>setProdSheet(true),80);}}><Icon name="plus" size={14}/> Novo Produto</button></div>}/>
          :(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[{label:"Vendas Hoje",value:todaySales.length,sub:"transações",accent:"#E8682A"},{label:"Receita Hoje",value:fmt(todayRev),sub:"faturamento",accent:"#4A5BC4"},{label:"Receita Total",value:fmt(totalRev),sub:"acumulado",accent:"#a78bfa"},{label:"Produtos",value:products.length,sub:"cadastrados",accent:"#4ade80"}].map((st,i)=>(<div key={i} style={S.statCard(st.accent)}><div style={{...S.lbl,marginBottom:4}}>{st.label}</div><div style={{fontSize:20,fontWeight:800,color:st.accent}}>{st.value}</div><div style={{fontSize:10,color:"#252845",marginTop:1}}>{st.sub}</div></div>))}
            </div>

          {/* BACKUP CARD — admin + servidor */}
          {page==="dashboard"&&currentUser?.role==="admin"&&(
            <div style={{...S.card,marginBottom:12,borderColor:"#a78bfa30"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700}}>💾 Backup de Dados</div>
                <button onClick={async()=>{
                  try{
                    const key=localStorage.getItem('_sb_key')||"";
                    if(!key) throw new Error('sem chave');
                    const tag=todayStr()+'_'+Date.now();
                    const data={products,customers,sales};
                    const sizeBytes=JSON.stringify(data).length;
                    const r=await fetch(SUPABASE_URL+'/rest/v1/backups',{
                      method:'POST',
                      headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key,'Prefer':'return=representation'},
                      body:JSON.stringify([{tag,data,size_bytes:sizeBytes}])
                    });
                    if(r.ok)notify('Backup criado: '+tag+' ✓');
                    else throw new Error('falha supabase');
                  }catch(e){
                    // offline — exporta localStorage
                    const data={products,customers,sales};
                    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
                    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
                    a.download='pdv-backup-'+todayStr()+'.json';a.click();
                    notify('Backup exportado localmente ✓');
                  }
                }} style={{...S.btn("primary"),padding:"7px 12px",fontSize:12}}><Icon name="import" size={13}/> Fazer Backup</button>
              </div>
              <BackupList S={S} notify={notify}/>
            </div>
          )}
            <div style={{...S.card,marginBottom:12,cursor:"pointer",padding:"12px 14px"}} onClick={()=>goTo("importar")}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>📥 Importar NF-e / Orçamento</div><div style={{fontSize:12,color:"#5A6080"}}>PDF, XML, CSV, TXT → cadastro automático</div></div><Icon name="import" size={15} color="#4A5BC4"/></div></div>
            {listaPendentes>0&&<div style={{...S.card,marginBottom:12,cursor:"pointer",borderLeft:"3px solid #f59e0b"}} onClick={()=>goTo("lista")}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:700,marginBottom:2}}>🛍️ Lista de Compras</div><div style={{fontSize:12,color:"#5A6080"}}>{listaPendentes} item(ns) pendente(s)</div></div><span style={S.badge("#f59e0b")}>{listaPendentes}</span></div></div>}
            <div style={{...S.card,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:14,fontWeight:700}}>Últimas Vendas</div>{sales.length>0&&<button onClick={exportPDF} style={{...S.btn("ghost"),padding:"6px 10px",fontSize:12}}><Icon name="pdf" size={13}/> PDF</button>}</div>
              {sales.length===0?<div style={{color:"#3a3d50",fontSize:13}}>Nenhuma venda ainda.</div>:sales.slice(0,5).map(s=>(<div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #14161e",alignItems:"center"}}><div><div style={{fontSize:13,fontWeight:600}}>{s.customer}</div><div style={{fontSize:11,color:"#5A6080"}}>{s.time} · {s.payment}</div></div><div style={{fontWeight:700,color:"#4ade80",fontSize:14}}>{fmt(s.total)}</div></div>))}
            </div>
            {(lowStock.length+outStock.length)>0&&<div style={S.card}><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>⚠️ Alertas de Estoque</div>{[...outStock,...lowStock].map(p=>(<div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #14161e"}}><span style={{fontSize:13}}>{p.name}</span><span style={S.badge(p.stock===0?"#ff3b3b":"#F07030")}>{p.stock===0?"Esgotado":p.stock+" unid."}</span></div>))}</div>}
          </>))}

          {/* PDV */}
          {page==="pdv"&&(products.length===0?
            <EmptyState icon="📦" title="Nenhum produto" desc="Importe uma NF-e ou cadastre produtos." action={<div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><button style={S.btn("primary")} onClick={()=>goTo("importar")}><Icon name="import" size={14}/> Importar</button><button style={S.btn()} onClick={()=>goTo("estoque")}><Icon name="plus" size={14}/> Estoque</button></div>}/>
          :(<div>
            <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
              <div style={{position:"relative",flex:1}}><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div><input style={{...S.input,paddingLeft:34,paddingRight:36}} placeholder="Buscar ou bipar código..." value={searchProd} onChange={e=>setSearchProd(e.target.value)}/>{searchProd?<button onClick={()=>setSearchProd("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#5A6080",cursor:"pointer",fontSize:18}}>×</button>:<div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="barcode" size={15}/></div>}</div>
              <button onClick={()=>setScannerOpen(true)} style={{...S.btn("ghost"),padding:"10px 12px",flexShrink:0,borderRadius:10}}><Icon name="camera" size={17} color="#4A5BC4"/></button>
              <button onClick={()=>setShowFilters(f=>!f)} style={{...S.btn(showFilters?"primary":"ghost"),padding:"10px 12px",flexShrink:0,borderRadius:10}}><Icon name="sliders" size={17}/></button>
            </div>
            {showFilters&&(<div style={{...S.card,marginBottom:10,padding:14,border:"1px solid #E8682A30"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#E8682A",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>🔍 Filtros</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><div style={{...S.lbl,marginBottom:4}}>Ordenar por</div><select style={{...S.input,fontSize:12,padding:"8px 10px"}} value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="name">Nome A-Z</option><option value="nameZ">Nome Z-A</option><option value="priceAsc">Menor preço</option><option value="priceDesc">Maior preço</option><option value="stock">Mais estoque</option><option value="stockAsc">Menos estoque</option></select></div>
                <div><div style={{...S.lbl,marginBottom:4}}>Disponibilidade</div><select style={{...S.input,fontSize:12,padding:"8px 10px"}} value={filterAvail} onChange={e=>setFilterAvail(e.target.value)}><option value="all">Todos</option><option value="instock">Com estoque</option><option value="low">Estoque baixo</option><option value="out">Esgotados</option></select></div>
              </div>
              <div style={{marginBottom:8}}><div style={{...S.lbl,marginBottom:4}}>Faixa de Preço</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><input style={{...S.input,fontSize:12,padding:"8px 10px"}} type="number" placeholder="R$ mín" value={priceMin} onChange={e=>setPriceMin(e.target.value)}/><input style={{...S.input,fontSize:12,padding:"8px 10px"}} type="number" placeholder="R$ máx" value={priceMax} onChange={e=>setPriceMax(e.target.value)}/></div></div>
              <button onClick={()=>{setSortBy("name");setFilterAvail("all");setPriceMin("");setPriceMax("");}} style={{...S.btn("danger"),width:"100%",justifyContent:"center",padding:"7px",fontSize:12}}>Limpar filtros</button>
            </div>)}
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:2,scrollbarWidth:"none"}}>{categories.map(cat=><button key={cat} onClick={()=>setFilterCat(cat)} style={{...S.btn(filterCat===cat?"primary":"ghost"),padding:"7px 13px",fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>{cat}</button>)}</div>
            {filtProdSorted.length===0?(
              <div style={{textAlign:"center",padding:"36px 20px"}}><div style={{fontSize:40,marginBottom:10}}>🔍</div><div style={{fontSize:14,fontWeight:700,color:"#666",marginBottom:6}}>Nenhum produto encontrado</div><div style={{fontSize:13,color:"#444",marginBottom:20}}>{searchProd?(searchProd+" não está no catálogo."):"Tente outro filtro."}</div>{searchProd&&<button style={S.btn("primary")} onClick={()=>{setEditProd(null);setProdSheetPrefill(searchProd);setProdSheet(true);}}><Icon name="plus" size={14}/> Cadastrar [{searchProd}]</button>}</div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {filtProdSorted.map(prod=>{const inCart=cart.find(i=>i.id===prod.id);return(
                  <div key={prod.id} onClick={()=>addToCart(prod)} style={{background:"#0F1220",border:"1px solid "+(inCart?"#E8682A":"#1E2245"),borderRadius:12,overflow:"hidden",cursor:prod.stock>0?"pointer":"not-allowed",opacity:prod.stock>0?1:.45,transition:"border-color .15s",position:"relative",userSelect:"none",WebkitTapHighlightColor:"transparent"}} onTouchStart={e=>{if(prod.stock>0)e.currentTarget.style.transform="scale(.96)";}} onTouchEnd={e=>{e.currentTarget.style.transform="none";}}>
                    {prod.photo
  ?<div style={{width:"100%",height:90,overflow:"hidden",background:"#0a0c14",cursor:"zoom-in",position:"relative"}} onClick={e=>{e.stopPropagation();setPhotoModal(prod);}}>
    <img src={prod.photo} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
    <div style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,.55)",borderRadius:6,padding:"2px 6px",fontSize:10,color:"#fff"}}>🔍 Zoom</div>
  </div>
  :<div style={{width:"100%",height:6,background:"#0a0c14"}}/>
}
                    <div style={{padding:12}}>
                      {inCart&&<div style={{position:"absolute",top:8,right:8,background:"#E8682A",color:"#fff",borderRadius:20,fontSize:11,fontWeight:800,padding:"1px 7px",zIndex:1}}>{inCart.qty}</div>}
                      <div style={{fontSize:10,color:"#5A6080",marginBottom:3}}>{prod.category}</div>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.3,paddingRight:inCart?28:0}}>{prod.name}</div>
                      <div style={{fontSize:16,fontWeight:800,color:"#E8682A"}}>{fmt(prod.price)}</div>
                      <div style={{fontSize:11,marginTop:3,color:prod.stock===0?"#ff3b3b":prod.stock<10?"#F07030":"#5A6080"}}>{prod.stock===0?"Esgotado":prod.stock+" "+(prod.unit||"unid")}</div>
                    </div>
                  </div>
                );})}
              </div>
            )}
            <div style={{height:80}}/>
            <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:100,width:"calc(100% - 32px)",maxWidth:440}}>
              <button onClick={()=>setCartOpen(true)} style={{...S.btn("primary"),width:"100%",padding:"15px",fontSize:15,justifyContent:"center",borderRadius:16,boxShadow:"0 6px 28px rgba(255,107,53,.4)"}}><Icon name="cart" size={18}/>{cartCount===0?"Ver Carrinho":cartCount+" ite"+(cartCount>1?"ns":"m")+" · "+fmt(cartTotal)}</button>
            </div>
            {photoModal&&(
              <div onClick={()=>setPhotoModal(null)} style={{position:"fixed",inset:0,zIndex:4000,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
                <img src={photoModal.photo} style={{maxWidth:"100%",maxHeight:"70vh",objectFit:"contain",borderRadius:14,boxShadow:"0 8px 48px rgba(0,0,0,.8)"}} alt=""/>
                <div style={{marginTop:16,color:"#e8e9f0",fontSize:16,fontWeight:700,textAlign:"center"}}>{photoModal.name}</div>
                <div style={{color:"#E8682A",fontSize:20,fontWeight:800,marginTop:4}}>{fmt(photoModal.price)}</div>
                {photoModal.priceAtacado>0&&<div style={{color:"#f59e0b",fontSize:14,fontWeight:700,marginTop:2}}>📦 Atacado: {fmt(photoModal.priceAtacado)}</div>}
                <div style={{fontSize:12,color:"#5A6080",marginTop:2}}>{photoModal.stock} {photoModal.unit||"unid"} em estoque</div>
                <button onClick={()=>setPhotoModal(null)} style={{marginTop:22,padding:"10px 32px",borderRadius:20,border:"none",background:"#1E2245",color:"#e8e9f0",cursor:"pointer",fontFamily:"'Sora',sans-serif",fontSize:13,fontWeight:600}}>✕ Fechar</button>
              </div>
            )}
            {scannerOpen&&<ScannerBase S={S} title="Leitor de Código" subtitle="Aponte para o código de barras do produto" onCode={(code)=>{const p=products.find(x=>x.barcode&&x.barcode.trim()===code.trim());if(p){addToCart(p);notify(p.name+" ✓","info");}else notify("Código não encontrado: "+code,"warn");setScannerOpen(false);}} onClose={()=>setScannerOpen(false)}/>}
          </div>))}

          {/* ATACADO */}
          {page==="atacado"&&<AtacadoPage S={S} products={products} customers={customers} persistP={persistP} persistS={persistS} persistC={persistC} persistE={(v)=>{syncSave("entregas",v);}} sales={sales} notify={notify} currentUser={currentUser}/>}

          {/* ENTREGAS */}
          {page==="entregas"&&<EntregasPage S={S} sales={sales} customers={customers} notify={notify} pedidos={pedidos} persistE={persistE} onReload={reloadFromSupabase}/>}

          {/* USUARIOS */}
          {page==="usuarios"&&<UsersPage S={S} notify={notify} currentUser={currentUser} sales={sales} persistS={persistS}/>}
          {page==="fornecedores"&&<FornecedoresPage S={S} notify={notify}/>}

          {/* LISTA */}
          {page==="lista"&&<ListaComprasPage S={S} notify={notify}/>}

          {/* IMPORTAR */}
          {page==="importar"&&<ImportarPage S={S} products={products} persistP={persistP} notify={notify}/>}

          {/* ESTOQUE */}
          {page==="estoque"&&(<div>
            <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>
              <div style={{position:"relative",flex:1}}><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div><input style={{...S.input,paddingLeft:34}} placeholder="Buscar..." value={searchProd} onChange={e=>setSearchProd(e.target.value)}/></div>
              <button style={{...S.btn("ghost"),flexShrink:0,fontSize:12,padding:"9px 12px"}} onClick={async()=>{
                notify("Baixando fotos...");
                const n=await downloadPhotos(products,(done,total)=>{
                  if(done===total) notify(`${done} fotos baixadas! ✓`);
                });
                // Aplica ao estado atual
                const updated=await applyPhotoCache(products);
                persistP(updated);
              }}>📷 Fotos</button>
              <button style={{...S.btn("ghost"),flexShrink:0,fontSize:12,padding:"9px 12px"}} onClick={()=>goTo("importar")}><Icon name="import" size={13}/> Importar</button>
              <button style={{...S.btn("primary"),flexShrink:0}} onClick={()=>{setEditProd(null);setProdSheet(true);}}><Icon name="plus" size={14}/> Novo</button>
              <button style={{...S.btn("ghost"),flexShrink:0,fontSize:12,padding:"9px 11px"}} title="Gerenciar Categorias" onClick={()=>setCatSheet(true)}>🏷️</button>
            </div>
            {products.length===0?<EmptyState icon="📦" title="Nenhum produto" desc="Importe NF-e ou cadastre manualmente." action={<div style={{display:"flex",gap:10,justifyContent:"center"}}><button style={S.btn("primary")} onClick={()=>goTo("importar")}><Icon name="import" size={14}/> Importar</button><button style={S.btn()} onClick={()=>{setEditProd(null);setProdSheet(true);}}><Icon name="plus" size={14}/> Cadastrar</button></div>}/>
              :products.filter(p=>p.name.toLowerCase().includes(searchProd.toLowerCase())).map(prod=>(<div key={prod.id} style={{...S.card,display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"12px 14px"}}>
                {prod.photo&&<img src={prod.photo} style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}} alt=""/>}
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{prod.name}</div><div style={{fontSize:11,color:"#5A6080"}}>{prod.category}{prod.barcode?" · "+prod.barcode:""}</div></div>
                <div style={{textAlign:"right",flexShrink:0,marginRight:8}}><div style={{fontSize:14,fontWeight:800,color:"#E8682A",marginBottom:3}}>{fmt(prod.price)}</div><span style={S.badge(prod.stock===0?"#ff3b3b":prod.stock<(prod.minStock||10)?"#F07030":"#4ade80")}>{prod.stock===0?"Esgotado":prod.stock+" "+(prod.stock<(prod.minStock||10)?"⚠️":"ok")}</span></div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <button style={{...S.btn("ghost"),padding:"7px 9px"}} onClick={()=>{setEditProd(prod);setProdSheet(true);}}><Icon name="edit" size={13}/></button>
                  <button style={{...S.btn("danger"),padding:"7px 9px"}} onClick={()=>setDeleteTarget({label:prod.name,onConfirm:()=>{persistP(products.filter(x=>x.id!==prod.id));notify("Produto removido.","warn");setDeleteTarget(null);}})}><Icon name="trash" size={13}/></button>
                </div>
              </div>))}
          </div>)}

          {/* CLIENTES */}
          {page==="clientes"&&(<div>
            <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>
              <div style={{position:"relative",flex:1}}><div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#5A6080"}}><Icon name="search" size={14}/></div><input style={{...S.input,paddingLeft:34}} placeholder="Buscar cliente..." value={searchCust} onChange={e=>setSearchCust(e.target.value)}/></div>
              <button style={{...S.btn("primary"),flexShrink:0}} onClick={()=>{setEditCust(null);setCustSheet(true);}}><Icon name="plus" size={14}/> Novo</button>
            </div>
            {customers.length===0?<EmptyState icon="👥" title="Nenhum cliente" desc="Cadastre clientes para identificar vendas." action={<button style={S.btn("primary")} onClick={()=>{setEditCust(null);setCustSheet(true);}}><Icon name="plus" size={14}/> Cadastrar</button>}/>
              :customers.filter(c=>c.name.toLowerCase().includes(searchCust.toLowerCase())).map(c=>(<div key={c.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #E8682A"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,marginBottom:1}}>{c.name}</div>{c.cpf&&<div style={{fontSize:11,color:"#5A6080"}}>CPF/CNPJ: {c.cpf}</div>}</div>
                  <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0,marginLeft:8}}>
                    <span style={S.badge(c.purchases>15?"#4ade80":c.purchases>5?"#4A5BC4":"#a78bfa")}>{c.purchases>15?"VIP":c.purchases>5?"Frequente":"Novo"}</span>
                    <button style={{...S.btn("ghost"),padding:"5px 7px"}} onClick={()=>{setEditCust(c);setCustSheet(true);}}><Icon name="edit" size={13}/></button>
                    <button style={{...S.btn("danger"),padding:"5px 7px"}} onClick={()=>setDeleteTarget({label:c.name,onConfirm:()=>{persistC(customers.filter(x=>x.id!==c.id));notify("Cliente removido.","warn");setDeleteTarget(null);}})}><Icon name="trash" size={13}/></button>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"2px 16px",marginBottom:8}}>{c.phone&&<div style={{fontSize:12,color:"#6a6d80"}}>📞 {c.phone}</div>}{c.email&&<div style={{fontSize:12,color:"#6a6d80"}}>✉️ {c.email}</div>}</div>
                {endFmtC(c)&&<div style={{background:"#0A0C1E",border:"1px solid #1a1c2e",borderRadius:8,padding:"7px 10px",marginBottom:10,fontSize:12,color:"#6a6d80",lineHeight:1.5,display:"flex",gap:6}}><span style={{flexShrink:0}}>📍</span><span>{endFmtC(c)}</span></div>}
                <div style={{display:"flex",gap:16,flexWrap:"wrap",paddingTop:8,borderTop:"1px solid #14161e"}}>
                  <div><div style={{...S.lbl,fontSize:10}}>Compras</div><div style={{fontWeight:700,color:"#E8682A"}}>{c.purchases}</div></div>
                  <div><div style={{...S.lbl,fontSize:10}}>Total Gasto</div><div style={{fontWeight:700,color:"#4ade80",fontSize:13}}>{fmt(c.totalSpent)}</div></div>
                  <div><div style={{...S.lbl,fontSize:10}}>Última Visita</div><div style={{fontSize:12,fontWeight:600}}>{new Date(c.lastVisit+"T12:00").toLocaleDateString("pt-BR")}</div></div>
                </div>
              </div>))}
          </div>)}

          {/* HISTÓRICO */}
          {page==="historico"&&(sales.length===0?<EmptyState icon="🧾" title="Nenhuma venda" desc="O histórico aparece após a primeira venda."/>:(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:13,color:"#5A6080"}}>{sales.length} venda{sales.length!==1?"s":""} · {fmt(totalRev)}</div><button onClick={exportPDF} style={{...S.btn("ghost"),padding:"7px 12px",fontSize:12}}><Icon name="pdf" size={14}/> PDF</button></div>
            {sales.map(s=>(<div key={s.id} style={{...S.card,marginBottom:8,borderLeft:"3px solid "+(s.payment==="A Prazo"?"#ef4444":s.payment.includes("Pix")?"#4A5BC4":s.payment.includes("Cartão")?"#a78bfa":"#4ade80")}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontSize:13,fontWeight:700}}>{s.customer}</div><div style={{fontSize:15,fontWeight:800,color:"#4ade80"}}>{fmt(s.total)}</div></div>
              <div style={{fontSize:12,color:"#6a6d80",marginBottom:6,lineHeight:1.4}}>{s.items.map(i=>i.qty+"× "+i.name).join(", ")}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                <span style={S.badge(s.payment==="A Prazo"?"#ef4444":s.payment.includes("Pix")?"#4A5BC4":s.payment.includes("Cartão")?"#a78bfa":"#4ade80")}>{s.payment==="A Prazo"?"⚠️ A Prazo":s.payment}</span>{s.tipo==="atacado"&&<span style={S.badge("#f59e0b")}>📦 Atacado</span>}
                <span style={{fontSize:11,color:"#3a3d50",display:"flex",alignItems:"center",gap:4}}><Icon name="clock" size={10}/>{new Date(s.date+"T12:00").toLocaleDateString("pt-BR")} {s.time}</span>
              </div>
              <div style={{display:"flex",gap:6,borderTop:"1px solid #14161e",paddingTop:8}}>
                <button onClick={()=>imprimirRecibo(s)} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"7px",fontSize:11}}><Icon name="printer" size={12}/> {s.payment==="A Prazo"?"Recibo + Promissória":"Recibo"}</button>
                <button onClick={()=>compartilharRecibo(s)} style={{...S.btn("ghost"),flex:1,justifyContent:"center",padding:"7px",fontSize:11}}>📤 Enviar</button>
                <button onClick={()=>{setEditSale(s);setEditSaleForm({customer:s.customer,payment:s.payment,date:s.date,items:s.items.map(i=>({...i}))});}} style={{...S.btn("ghost"),padding:"7px 9px"}} title="Editar venda"><Icon name="edit" size={13}/></button>
                {perm("excluirVendas")&&<button onClick={()=>setDeleteTarget({label:"Venda "+s.customer,onConfirm:()=>{persistS(sales.filter(x=>x.id!==s.id));setDeleteTarget(null);notify("Venda removida.","warn");}})} style={{...S.btn("danger"),padding:"7px 9px"}}><Icon name="trash" size={12}/></button>}
              </div>
            </div>))}
          </div>))}
        </div>
      </div>

      {/* Sheet de edição de venda */}
      {editSale&&(
        <Sheet onClose={()=>setEditSale(null)}>
          <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>✏️ Editar Venda</div>
          <div style={{marginBottom:10}}>
            <div style={{...S.lbl,marginBottom:5}}>Cliente</div>
            <select style={S.input} value={editSaleForm.customer} onChange={e=>setEditSaleForm(f=>({...f,customer:e.target.value}))}>
              <option value="Avulso">— Cliente Avulso —</option>
              {customers.map(c=><option key={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{...S.lbl,marginBottom:5}}>Forma de Pagamento</div>
            <select style={S.input} value={editSaleForm.payment} onChange={e=>setEditSaleForm(f=>({...f,payment:e.target.value}))}>
              {["Dinheiro","Cartão Débito","Cartão Crédito","Pix","Vale Refeição","A Prazo"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{...S.lbl,marginBottom:5}}>Data</div>
            <input style={S.input} type="date" value={editSaleForm.date} onChange={e=>setEditSaleForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"#E8682A",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Itens</div>
          {editSaleForm.items.map((item,idx)=>(
            <div key={idx} style={{...S.card,padding:10,marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{item.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,alignItems:"flex-end"}}>
                <div>
                  <div style={{...S.lbl,marginBottom:3,fontSize:9}}>Qtd</div>
                  <input style={{...S.input,padding:"7px 10px",fontSize:13}} type="number" step="0.001" min="0" value={item.qty}
                    onChange={e=>setEditSaleForm(f=>({...f,items:f.items.map((x,i)=>i===idx?{...x,qty:+e.target.value}:x)}))}/>
                </div>
                <div>
                  <div style={{...S.lbl,marginBottom:3,fontSize:9}}>Preço Unit.</div>
                  <input style={{...S.input,padding:"7px 10px",fontSize:13}} type="number" step="0.01" min="0" value={item.price}
                    onChange={e=>setEditSaleForm(f=>({...f,items:f.items.map((x,i)=>i===idx?{...x,price:+e.target.value}:x)}))}/>
                </div>
                <button onClick={()=>setEditSaleForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))}
                  style={{...S.btn("danger"),padding:"8px 10px"}}><Icon name="trash" size={12}/></button>
              </div>
              <div style={{fontSize:11,color:"#E8682A",marginTop:4,textAlign:"right"}}>
                Total: {fmt(item.qty*item.price)}
              </div>
            </div>
          ))}
          <div style={{fontSize:14,fontWeight:800,color:"#4ade80",textAlign:"right",marginBottom:16}}>
            Total: {fmt(editSaleForm.items.reduce((s,i)=>s+i.qty*i.price,0))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...S.btn("ghost"),flex:1,justifyContent:"center"}} onClick={()=>setEditSale(null)}>Cancelar</button>
            <button style={{...S.btn("primary"),flex:1,justifyContent:"center"}} onClick={()=>{
              const newTotal=editSaleForm.items.reduce((s,i)=>s+i.qty*i.price,0);
              persistS(sales.map(x=>x.id===editSale.id?{...x,customer:editSaleForm.customer,payment:editSaleForm.payment,date:editSaleForm.date,items:editSaleForm.items,total:newTotal}:x));
              notify("Venda atualizada ✓");setEditSale(null);
            }}><Icon name="check" size={14}/> Salvar</button>
          </div>
        </Sheet>
      )}
      {prodSheet&&<ProductSheet S={S} initial={editProd} prefillName={prodSheetPrefill} cats={cats} onSave={saveProduct} onClose={()=>{setProdSheet(false);setEditProd(null);setProdSheetPrefill("");}}/>}
      {custSheet&&<CustomerSheet S={S} initial={editCust} onSave={saveCustomer} onClose={()=>{setCustSheet(false);setEditCust(null);}}/>}
      {cartOpen&&<CartDrawer S={S} cart={cart} customers={customers} products={products} onUpdateProduct={updateProduct} saleCustomer={saleCustomer} setSaleCustomer={setSaleCustomer} salePayment={salePayment} setSalePayment={setSalePayment} chgQty={chgQty} rmCart={rmCart} cartTotal={cartTotal} onFinalize={finalizeSale} onFinalizeEntrega={finalizeSaleComEntrega} onClose={()=>setCartOpen(false)}/>}
      {deleteTarget&&<DeleteSheet S={S} label={deleteTarget.label} onConfirm={deleteTarget.onConfirm} onClose={()=>setDeleteTarget(null)}/>}
      {catSheet&&<CatSheet S={S} cats={cats} onSave={persistCats} onClose={()=>setCatSheet(false)}/>}
      <Toast toast={toast}/>
      <style dangerouslySetInnerHTML={{__html:"*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#080a10;}::-webkit-scrollbar-thumb{background:#1a1c2e;border-radius:4px;}@keyframes popIn{from{transform:translateX(-50%) translateY(10px);opacity:0;}to{transform:translateX(-50%) translateY(0);opacity:1;}}@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}select{appearance:none;}input:focus,select:focus,textarea:focus{border-color:#E8682A!important;box-shadow:0 0 0 3px rgba(255,107,53,.1);}input::placeholder,textarea::placeholder{color:#2a2d3a;}button:active{opacity:.75;}"}}/>
    </div>
  </>);}
