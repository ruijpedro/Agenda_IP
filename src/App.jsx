import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckSquare, Users, ClipboardList, Settings, LogIn, LogOut, RefreshCw, Plus, CloudUpload } from 'lucide-react'
import { loadSettings, saveSettings, loadActivities, saveActivities } from './services/storage.js'
import { signIn, signOut, getAccount, fetchEvents, fetchTodoTasks, fetchContacts, createEvent, createTodoTask } from './services/google.js'
import './styles.css'

const tabs = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'contactos', label: 'Contactos', icon: Users },
  { id: 'atividades', label: 'Atividades', icon: ClipboardList },
  { id: 'definicoes', label: 'Definições', icon: Settings }
]

function todayISO() { return new Date().toISOString().slice(0,10) }
function monthBounds() {
  const d = new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}

function Header({ account, settings, onLogin, onLogout }) {
  return <header className="hero">
    <img src="/logo.png" alt="IP_RJP" />
    <div className="heroText">
      <h1>IP_RJP</h1>
      <p>Gmail • Agenda Google • Tarefas • Contactos • Atividades</p>
      <small>{account ? `Ligado: ${account.email || account.name}` : 'Google/Gmail não ligado'}</small>
    </div>
    <button className="pill white" onClick={account ? onLogout : onLogin}>{account ? <LogOut/> : <LogIn/>}{account ? 'Sair' : 'Ligar'}</button>
  </header>
}

function Toolbar({ active, setActive }) {
  return <nav className="tabs">{tabs.map(t => {
    const Icon = t.icon
    return <button key={t.id} className={active===t.id?'active':''} onClick={()=>setActive(t.id)}><Icon/> {t.label}</button>
  })}</nav>
}

function Agenda({ settings, connected }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setError(''); setLoading(true)
    try { const { start, end } = monthBounds(); const data = await fetchEvents(settings, start, end); setEvents(data.items || []) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(()=>{ if(connected) load() }, [connected])
  return <section className="card">
    <div className="sectionTitle"><h2>Agenda Google</h2><button onClick={load} disabled={!connected || loading}><RefreshCw/> Atualizar</button></div>
    {!connected && <p className="hint">Liga a conta Google/Gmail para importar a agenda.</p>}
    {error && <p className="error">{error}</p>}
    {events.length===0 && connected && !loading && <p className="hint">Sem eventos carregados para este mês.</p>}
    <div className="list">{events.map(ev => <div className="item" key={ev.id}>
      <b>{ev.summary || 'Sem título'}</b>
      <span>{new Date(ev.start.dateTime || ev.start.date).toLocaleString('pt-PT')} → {new Date(ev.end.dateTime || ev.end.date).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}</span>
      <small>{ev.location || 'Sem local'}</small>
    </div>)}</div>
  </section>
}

function Tarefas({ settings, connected }) {
  const [tasks, setTasks] = useState([]); const [title, setTitle] = useState(''); const [due, setDue] = useState(todayISO()); const [error,setError]=useState('')
  async function load(){ setError(''); try{ const data=await fetchTodoTasks(settings); setTasks(data.items||[]) }catch(e){setError(e.message)} }
  async function add(){ if(!title.trim()) return; setError(''); try{ await createTodoTask(settings,title,due); setTitle(''); await load() }catch(e){setError(e.message)} }
  useEffect(()=>{ if(connected) load() },[connected])
  return <section className="card"><div className="sectionTitle"><h2>Tarefas Google</h2><button onClick={load} disabled={!connected}><RefreshCw/> Atualizar</button></div>
    {error && <p className="error">{error}</p>}
    <div className="formLine"><input placeholder="Nova tarefa" value={title} onChange={e=>setTitle(e.target.value)}/><input type="date" value={due} onChange={e=>setDue(e.target.value)}/><button onClick={add} disabled={!connected}><Plus/> Criar</button></div>
    <div className="list">{tasks.map(t=><div className="item" key={t.id}><b>{t.title}</b><span>{t.status==='completed'?'Concluída':'Pendente'}</span></div>)}</div>
  </section>
}

function Contactos({ settings, connected }) {
  const [contacts,setContacts]=useState([]); const [q,setQ]=useState(''); const [error,setError]=useState('')
  async function load(){ setError(''); try{ const data=await fetchContacts(settings); setContacts(data.connections||[]) }catch(e){setError(e.message)} }
  useEffect(()=>{ if(connected) load() },[connected])
  const filtered = contacts.filter(c => (c.names?.[0]?.displayName||'').toLowerCase().includes(q.toLowerCase()))
  return <section className="card"><div className="sectionTitle"><h2>Contactos Google</h2><button onClick={load} disabled={!connected}><RefreshCw/> Atualizar</button></div>
    {error && <p className="error">{error}</p>}
    <input placeholder="Pesquisar contacto" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="list">{filtered.map(c=><div className="item" key={c.id}><b>{c.names?.[0]?.displayName || 'Sem nome'}</b><span>{c.emailAddresses?.[0]?.value || 'Sem email'}</span><small>{c.phoneNumbers?.[0]?.value || ''}</small></div>)}</div>
  </section>
}

function Atividades({ settings, connected }) {
  const [items,setItems]=useState(loadActivities())
  const [form,setForm]=useState({ date: todayISO(), start:'09:00', end:'10:00', type:'Deslocação', title:'', location:'', notes:'' })
  const [msg,setMsg]=useState('')
  function update(k,v){ setForm(f=>({...f,[k]:v})) }
  function save(){ const item={...form,id:crypto.randomUUID(), createdAt:new Date().toISOString()}; const next=[item,...items]; setItems(next); saveActivities(next); setMsg('Atividade guardada localmente.') }
  async function exportOne(item){ setMsg(''); try{ await createEvent(settings,item); setMsg('Atividade exportada para o Google Calendar.') }catch(e){setMsg(e.message)} }
  return <section className="card"><h2>Atividades IP_RJP</h2>
    <div className="gridForm">
      <label>Data<input type="date" value={form.date} onChange={e=>update('date',e.target.value)}/></label>
      <label>Início<input type="time" value={form.start} onChange={e=>update('start',e.target.value)}/></label>
      <label>Fim<input type="time" value={form.end} onChange={e=>update('end',e.target.value)}/></label>
      <label>Tipo<select value={form.type} onChange={e=>update('type',e.target.value)}><option>Deslocação</option><option>Prevenção BT</option><option>Prevenção CC</option><option>Reunião</option><option>Inspeção</option><option>Formação</option><option>Outra</option></select></label>
      <label>Título<input value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Ex.: Leiria → Caldas da Rainha"/></label>
      <label>Local<input value={form.location} onChange={e=>update('location',e.target.value)} placeholder="Local"/></label>
      <label className="wide">Observações<textarea value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Matrícula, origem/destino, notas..."/></label>
    </div>
    <button onClick={save}><Plus/> Guardar atividade</button>{msg && <p className="hint">{msg}</p>}
    <div className="list">{items.map(item=><div className="item" key={item.id}><b>{item.type}: {item.title || 'Sem título'}</b><span>{item.date} {item.start}–{item.end} · {item.location}</span><small>{item.notes}</small><button onClick={()=>exportOne(item)} disabled={!connected}><CloudUpload/> Exportar para Google</button></div>)}</div>
  </section>
}

function Definicoes({ settings, setSettings }) {
  const [local,setLocal]=useState(settings)
  function save(){ saveSettings(local); setSettings(local); alert('Definições guardadas.') }
  return <section className="card"><h2>Definições Google / Gmail</h2>
    <p className="hint">Preenche os dados da app criada na Google Cloud. Usa o Client ID OAuth 2.0 e, se quiseres, o URL do Apps Script para Drive/Sheets.</p>
    <div className="gridForm">
      <label>Google Client ID<input value={local.googleClientId} onChange={e=>setLocal({...local,googleClientId:e.target.value})} placeholder="xxxxx.apps.googleusercontent.com"/></label>
      <label>Google API Key<input value={local.googleApiKey} onChange={e=>setLocal({...local,googleApiKey:e.target.value})} placeholder="opcional"/></label>
      <label className="wide">Apps Script URL<input value={local.appsScriptUrl} onChange={e=>setLocal({...local,appsScriptUrl:e.target.value})} placeholder="https://script.google.com/macros/s/.../exec"/></label>
      <label>Autor<input value={local.userName} onChange={e=>setLocal({...local,userName:e.target.value})}/></label>
      <label>Organização<input value={local.organization} onChange={e=>setLocal({...local,organization:e.target.value})}/></label>
    </div>
    <button onClick={save}>Guardar definições</button>
    <div className="about"><b>IP_RJP</b><br/>Autor<br/>Rui Jorge Pedro<br/><br/>Infraestruturas de Portugal<br/><br/>© 2026</div>
  </section>
}

export default function App(){
  const [active,setActive]=useState('agenda')
  const [settings,setSettings]=useState(loadSettings())
  const [account,setAccount]=useState(null)
  const connected = !!account
  useEffect(()=>{ getAccount(settings).then(setAccount).catch(()=>{}) }, [settings.googleClientId])
  async function onLogin(){ try{ const acc=await signIn(settings); setAccount(acc) }catch(e){ alert(e.message) } }
  async function onLogout(){ try{ await signOut(settings); setAccount(null) }catch(e){ alert(e.message) } }
  const page = useMemo(()=>({
    agenda:<Agenda settings={settings} connected={connected}/>,
    tarefas:<Tarefas settings={settings} connected={connected}/>,
    contactos:<Contactos settings={settings} connected={connected}/>,
    atividades:<Atividades settings={settings} connected={connected}/>,
    definicoes:<Definicoes settings={settings} setSettings={setSettings}/>
  }[active]),[active,settings,connected])
  return <main><Header account={account} settings={settings} onLogin={onLogin} onLogout={onLogout}/><Toolbar active={active} setActive={setActive}/>{page}</main>
}
