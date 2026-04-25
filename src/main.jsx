import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { garminData } from './garminData.js';
import './styles.css';

const tabs = ['Dashboard', 'Analyse 7 jours', 'Sommeil', 'Sport', 'Stress', 'Activités', 'Nutrition', 'Coach Hyrox'];
const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

function App() {
  const [tab, setTab] = useState('Dashboard');
  const data = garminData;
  const t = data.totals;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">H</div><div><b>Hyrox Coach</b><span>Garmin réel · V18</span></div></div>
        <nav>{tabs.map(x => <button key={x} onClick={() => setTab(x)} className={tab === x ? 'active' : ''}>{x}</button>)}</nav>
        <div className="source">
          <b>Données utilisées</b>
          <p>Export Garmin reçu, dernier jour disponible : <b>{dateFr(t.latestDate)}</b>.</p>
          <p>Cette version utilise des données Garmin pré-calculées dans le projet, pas des valeurs fictives.</p>
        </div>
      </aside>
      <main className="main">
        <Header />
        {tab === 'Dashboard' && <Dashboard data={data} />}
        {tab === 'Analyse 7 jours' && <Analysis data={data} />}
        {tab === 'Sommeil' && <Sleep data={data} />}
        {tab === 'Sport' && <Sport data={data} />}
        {tab === 'Stress' && <Stress data={data} />}
        {tab === 'Activités' && <Activities data={data} />}
        {tab === 'Nutrition' && <Nutrition />}
        {tab === 'Coach Hyrox' && <Coach data={data} />}
      </main>
    </div>
  );
}

function Header() {
  return <div className="header"><div><h1>Tableau de bord santé & Hyrox</h1><p>Sommeil, sport, stress, yoga et recommandations sur les 7 derniers jours Garmin disponibles.</p></div><div className="pill">Mise à jour Garmin · 24/04/2026</div></div>;
}

function Dashboard({ data }) {
  const t = data.totals;
  return <>
    <section className="kpis">
      <Kpi label="Sommeil moyen" value={`${fmt.format(t.avgSleep)} h`} hint="7 derniers jours" tone="purple" />
      <Kpi label="Stress moyen" value={t.avgStress ?? 'n/a'} hint="Garmin all-day stress" tone="orange" />
      <Kpi label="Sport total" value={`${t.totalSportMinutes} min`} hint={`${t.totalActivities} activités`} tone="green" />
      <Kpi label="Course + vélo" value={`${fmt.format(t.totalRunKm + t.totalBikeKm)} km`} hint={`${fmt.format(t.totalRunKm)} km run · ${fmt.format(t.totalBikeKm)} km vélo`} tone="blue" />
      <Kpi label="Readiness" value={`${t.avgReadiness}/100`} hint="score calculé" tone="dark" />
    </section>
    <section className="grid two">
      <Card title="Vue 7 jours"><BarChart rows={data.sevenDays} keys={[{key:'sleepHours', label:'Sommeil h', color:'#7c3aed'}, {key:'sportMinutes', label:'Sport min', color:'#16a34a'}]} /></Card>
      <Card title="Charge & récupération"><ReadinessMatrix rows={data.sevenDays} /></Card>
    </section>
    <section className="grid two">
      <Card title="Résumé sport"><TypeSummary types={data.activityTypes} /></Card>
      <Card title="Recommandation rapide"><Recommendation data={data} /></Card>
    </section>
  </>;
}

function Analysis({ data }) {
  const best = [...data.sevenDays].sort((a,b)=>b.readiness-a.readiness)[0];
  const worst = [...data.sevenDays].sort((a,b)=>a.readiness-b.readiness)[0];
  return <section className="grid two">
    <Card title="Tendances 7 jours">
      <LineChart rows={data.sevenDays} series={[{key:'readiness', label:'Readiness', color:'#0f172a'}, {key:'stress', label:'Stress', color:'#f97316'}, {key:'sportMinutes', label:'Sport min', color:'#22c55e'}]} />
    </Card>
    <Card title="Meilleur / pire jour">
      <div className="compare">
        <div className="good"><span>Meilleur jour</span><b>{dateFr(best.date)}</b><p>Readiness {best.readiness}/100 · sommeil {best.sleepHours ?? 'n/a'} h · stress {best.stress ?? 'n/a'}</p></div>
        <div className="bad"><span>Jour à surveiller</span><b>{dateFr(worst.date)}</b><p>Readiness {worst.readiness}/100 · sport {worst.sportMinutes} min · stress {worst.stress ?? 'n/a'}</p></div>
      </div>
    </Card>
    <Card title="Stats calculées"><StatsTable rows={data.sevenDays} /></Card>
    <Card title="Alertes fatigue"><FatigueAlerts rows={data.sevenDays} /></Card>
  </section>;
}

function Sleep({ data }) {
  return <section className="grid two">
    <Card title="Sommeil — 7 jours"><BarChart rows={data.sevenDays} keys={[{key:'timeInBedHours', label:'Temps au lit', color:'#93c5fd'}, {key:'sleepHours', label:'Sommeil estimé', color:'#7c3aed'}]} /></Card>
    <Card title="Stades disponibles Garmin">
      <SleepStages rows={data.sevenDays} />
    </Card>
    <Card title="Détail sommeil"><DailyTable rows={data.sevenDays} fields={[['sleepHours','Sommeil h'],['timeInBedHours','Temps au lit h'],['deepMin','Profond min'],['lightMin','Léger min'],['remMin','REM min'],['awakeMin','Éveil min']]} /></Card>
    <Card title="Note importante"><p className="note">Dans ton export, les stades détaillés ne sont présents que pour certaines nuits récentes. Quand Garmin ne fournit que la fenêtre de sommeil, le site affiche le temps au lit comme estimation du sommeil.</p></Card>
  </section>;
}

function Sport({ data }) {
  return <section className="grid two">
    <Card title="Sport — durée par jour"><BarChart rows={data.sevenDays} keys={[{key:'sportMinutes', label:'Sport min', color:'#16a34a'}, {key:'yogaMin', label:'Yoga min', color:'#a855f7'}]} /></Card>
    <Card title="Distance course / vélo"><BarChart rows={data.sevenDays} keys={[{key:'runKm', label:'Course km', color:'#0ea5e9'}, {key:'bikeKm', label:'Vélo km', color:'#22c55e'}]} /></Card>
    <Card title="Calories sport"><BarChart rows={data.sevenDays} keys={[{key:'sportCalories', label:'kcal sport', color:'#f97316'}]} /></Card>
    <Card title="Résumé par type"><TypeSummary types={data.activityTypes} /></Card>
  </section>;
}

function Stress({ data }) {
  return <section className="grid two">
    <Card title="Stress Garmin — 7 jours"><LineChart rows={data.sevenDays} series={[{key:'stress', label:'Stress', color:'#f97316'}]} /></Card>
    <Card title="Stress vs sommeil"><ScatterLike rows={data.sevenDays} /></Card>
    <Card title="Détail stress"><DailyTable rows={data.sevenDays} fields={[['stress','Stress'],['readiness','Readiness'],['minHr','FC min'],['maxHr','FC max'],['steps','Pas']]} /></Card>
    <Card title="Lecture"><p className="note">Ton stress moyen disponible est plutôt bas/modéré sur la période. Attention : certains jours Garmin retourne une valeur absente ou partielle, le site les ignore dans les moyennes.</p></Card>
  </section>;
}

function Activities({ data }) {
  return <Card title="Activités Garmin détectées sur la période">
    <div className="activityList">
      {data.activities7.map((a,i)=><div className="activity" key={i}><div><b>{a.name}</b><span>{dateFr(a.date)} · {activityLabel(a.type)}</span></div><div className="activityMetrics"><span>{a.durationMin} min</span><span>{fmt.format(a.distanceKm)} km</span><span>{a.calories} kcal</span><span>FC {a.avgHr || 'n/a'}</span></div></div>)}
    </div>
  </Card>;
}

function Nutrition(){
 const [meals,setMeals]=useState(()=>JSON.parse(localStorage.getItem('hyroxMeals')||'[]'));
 const [form,setForm]=useState({name:'Déjeuner',calories:600,protein:35,carbs:65,fat:18});
 const add=()=>{const next=[...meals,{...form,id:Date.now()}]; setMeals(next); localStorage.setItem('hyroxMeals',JSON.stringify(next));};
 const totals=meals.reduce((a,m)=>({calories:a.calories+Number(m.calories||0),protein:a.protein+Number(m.protein||0),carbs:a.carbs+Number(m.carbs||0),fat:a.fat+Number(m.fat||0)}),{calories:0,protein:0,carbs:0,fat:0});
 return <section className="grid two"><Card title="Ajouter un repas"><div className="form"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>{['calories','protein','carbs','fat'].map(k=><label key={k}>{labelMacro(k)}<input type="number" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<button onClick={add}>Ajouter le repas</button></div></Card><Card title="Total nutrition du jour"><div className="kpis compact"><Kpi label="Calories" value={totals.calories} /><Kpi label="Protéines" value={`${totals.protein} g`} /><Kpi label="Glucides" value={`${totals.carbs} g`} /><Kpi label="Lipides" value={`${totals.fat} g`} /></div></Card><Card title="Repas saisis"><div className="activityList">{meals.map(m=><div className="activity" key={m.id}><div><b>{m.name}</b><span>{m.calories} kcal</span></div><div className="activityMetrics"><span>P {m.protein}g</span><span>G {m.carbs}g</span><span>L {m.fat}g</span></div></div>)}</div></Card><Card title="Module photo"><p className="note">La reconnaissance photo réelle nécessite une API côté serveur. Pour l’instant, ce module garde une saisie fiable et modifiable manuellement.</p></Card></section>
}

function Coach({ data }) {
  return <section className="grid two">
    <Card title="Séance recommandée"><Recommendation data={data} detailed /></Card>
    <Card title="Pourquoi ?"><CoachWhy data={data} /></Card>
    <Card title="Séance Hyrox adaptée"><Workout data={data} /></Card>
    <Card title="Projection Hyrox"><p className="big">Objectif sub 1h</p><p className="note">Avec {data.totals.totalSportMinutes} min de sport sur la période et une readiness moyenne de {data.totals.avgReadiness}/100, la priorité est de consolider la régularité puis d’ajouter du spécifique Hyrox lorsque récupération OK.</p></Card>
  </section>;
}

function Recommendation({data,detailed=false}){
 const last=data.sevenDays[data.sevenDays.length-1];
 const low=last.readiness<55 || (last.stress??0)>45;
 return <div><p className="rec">{low?'Séance légère / mobilité':'Séance Hyrox modérée à intense possible'}</p><p className="note">Dernier jour Garmin : readiness {last.readiness}/100, stress {last.stress ?? 'n/a'}, sommeil {last.sleepHours ?? 'n/a'}h, sport {last.sportMinutes}min.</p>{detailed&&<ul><li>Si jambes lourdes : zone 2 + mobilité.</li><li>Si bonnes sensations : run intervals + stations Hyrox.</li><li>Priorité : rester régulier sans accumuler fatigue + stress.</li></ul>}</div>
}

function Workout({data}){const ok=data.totals.avgReadiness>=60; return <div className="workout"><h3>{ok?'Hyrox mix progressif':'Récupération active'}</h3><ol><li>Échauffement : 10 min footing léger + mobilité hanches/chevilles.</li><li>Bloc : {ok?'4 x 800 m run + 20 wall balls + farmer carry':'30 à 45 min zone 2 ou marche active'}.</li><li>Finisher : {ok?'8 min burpees contrôlés':'respiration + étirements 12 min'}.</li></ol></div>}
function CoachWhy({data}){return <ul className="why"><li>Sommeil moyen : {data.totals.avgSleep} h.</li><li>Stress moyen : {data.totals.avgStress}.</li><li>Charge sport : {data.totals.totalSportMinutes} min / 7 jours.</li><li>Yoga détecté : {data.totals.totalYogaMin} min.</li></ul>}

function Kpi({label,value,hint,tone=''}){return <div className={`kpi ${tone}`}><span>{label}</span><b>{value}</b>{hint&&<small>{hint}</small>}</div>}
function Card({title,children}){return <div className="card"><h2>{title}</h2>{children}</div>}

function BarChart({rows,keys}){const max=Math.max(1,...rows.flatMap(r=>keys.map(k=>Number(r[k.key]||0)))); return <div className="chart bars">{rows.map(r=><div className="barDay" key={r.date}><div className="barsWrap">{keys.map(k=><div key={k.key} className="bar" style={{height:`${Math.max(4,(Number(r[k.key]||0)/max)*120)}px`,background:k.color}} title={`${k.label}: ${r[k.key]??'n/a'}`}></div>)}</div><span>{r.label}</span></div>)}<Legend items={keys}/></div>}
function LineChart({rows,series}){const max=Math.max(1,...rows.flatMap(r=>series.map(s=>Number(r[s.key]||0)))); const w=720,h=220,p=30; return <div><svg viewBox={`0 0 ${w} ${h}`} className="svgChart"><g>{[0,1,2,3].map(i=><line key={i} x1={p} x2={w-p} y1={p+i*(h-2*p)/3} y2={p+i*(h-2*p)/3} stroke="#e2e8f0"/>)}</g>{series.map(s=>{const pts=rows.map((r,i)=>[p+i*((w-2*p)/(rows.length-1||1)), h-p-(Number(r[s.key]||0)/max)*(h-2*p)]);return <polyline key={s.key} points={pts.map(x=>x.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>})}{rows.map((r,i)=><text key={r.date} x={p+i*((w-2*p)/(rows.length-1||1))} y={h-5} textAnchor="middle" fontSize="12" fill="#64748b">{r.label}</text>)}</svg><Legend items={series}/></div>}
function Legend({items}){return <div className="legend">{items.map(i=><span key={i.key}><i style={{background:i.color}}></i>{i.label}</span>)}</div>}
function ReadinessMatrix({rows}){return <div className="matrix">{rows.map(r=><div key={r.date} className={`day ${r.readiness>=70?'ok':r.readiness>=55?'mid':'low'}`}><b>{r.label}</b><span>{r.readiness}/100</span><small>{r.sportMinutes}min sport</small></div>)}</div>}
function TypeSummary({types}){return <div className="typeGrid">{Object.entries(types).map(([k,v])=><div className="type" key={k}><b>{k}</b><span>{v.count} séance(s)</span><span>{v.minutes} min</span><span>{fmt.format(v.distanceKm)} km</span><span>{Math.round(v.calories)} kcal</span></div>)}</div>}
function SleepStages({rows}){return <div className="stageList">{rows.map(r=><div key={r.date} className="stage"><b>{r.label}</b><div className="stagebar"><i style={{width:`${r.deepMin||0}px`,background:'#1d4ed8'}}/><i style={{width:`${r.lightMin||0}px`,background:'#60a5fa'}}/><i style={{width:`${r.remMin||0}px`,background:'#a855f7'}}/><i style={{width:`${r.awakeMin||0}px`,background:'#f97316'}}/></div><span>Profond {r.deepMin||0} · Léger {r.lightMin||0} · REM {r.remMin||0} · Éveil {r.awakeMin||0} min</span></div>)}</div>}
function DailyTable({rows,fields}){return <div className="table"><table><thead><tr><th>Date</th>{fields.map(f=><th key={f[0]}>{f[1]}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.date}><td>{dateFr(r.date)}</td>{fields.map(f=><td key={f[0]}>{r[f[0]]??'—'}</td>)}</tr>)}</tbody></table></div>}
function StatsTable({rows}){return <DailyTable rows={rows} fields={[["readiness","Readiness"],["sleepHours","Sommeil"],["stress","Stress"],["sportMinutes","Sport min"],["steps","Pas"]]} />}
function FatigueAlerts({rows}){const alerts=rows.filter(r=>r.readiness<55||r.stress>45||r.sportMinutes>100); return <div>{alerts.length?alerts.map(r=><div className="alert" key={r.date}><b>{dateFr(r.date)}</b><span>Readiness {r.readiness}/100 · stress {r.stress??'n/a'} · sport {r.sportMinutes} min</span></div>):<p className="note">Aucune alerte fatigue majeure détectée.</p>}</div>}
function ScatterLike({rows}){return <div className="scatter">{rows.map(r=><div key={r.date} style={{left:`${((r.sleepHours||0)/12)*90}%`,bottom:`${((r.stress||0)/60)*85}%`}} title={`${r.date} sommeil ${r.sleepHours} stress ${r.stress}`}>{r.label.split(' ')[0]}</div>)}</div>}
function dateFr(s){return new Date(s+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});}
function activityLabel(t){return t==='running'?'Course':t==='cycling'?'Vélo':t==='yoga'?'Yoga':t||'Autre'}
function labelMacro(k){return {calories:'Calories',protein:'Protéines',carbs:'Glucides',fat:'Lipides'}[k]}

createRoot(document.getElementById('root')).render(<App/>);
