import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const profilesPath=path.join(root,'data','profiles.json');
const sitePath=path.join(root,'data','site.json');
const communityPath=path.join(root,'data','community.json');
const token=process.env.GITHUB_TOKEN||'';
const repo=process.env.GITHUB_REPOSITORY||'';
const headers={accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10',...(token?{authorization:`Bearer ${token}`}:{})};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function gh(url,attempt=0){
  const r=await fetch(url,{headers});
  if(r.status===403||r.status===429){
    if(attempt<2){const retry=Math.min(5000,(Number(r.headers.get('retry-after'))||2)*1000);await sleep(retry);return gh(url,attempt+1)}
  }
  if(!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}
function daysAgo(iso){return Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/86400000));}
function isoDay(s){return s.slice(0,10)}
function activityStats(events){
  const counts=new Map();
  const now=new Date(); now.setUTCHours(0,0,0,0);
  const cutoff=new Date(now); cutoff.setUTCDate(cutoff.getUTCDate()-29);
  let recentEventCount=0;
  for(const e of events){
    if(!e.created_at)continue;
    const created=new Date(e.created_at);
    if(Number.isNaN(created.getTime())||created<cutoff)continue;
    const d=isoDay(e.created_at);counts.set(d,(counts.get(d)||0)+1);recentEventCount++;
  }
  const last14=Array.from({length:14},(_,i)=>{const d=new Date(now);d.setUTCDate(d.getUTCDate()-(13-i));const key=d.toISOString().slice(0,10);return counts.get(key)||0});
  let streak=0; const dates=[...counts.keys()].sort().reverse();
  if(dates.length){
    const latest=new Date(`${dates[0]}T00:00:00Z`);
    const age=Math.round((now-latest)/86400000);
    if(age<=1){let cur=latest;for(const d of dates){const dt=new Date(`${d}T00:00:00Z`);if((cur-dt)/86400000===0){streak++;cur=new Date(cur);cur.setUTCDate(cur.getUTCDate()-1)}else break;}}
  }
  const matrix=[];
  for(let row=3;row>=0;row--){for(let col=0;col<7;col++){const d=new Date(now);d.setUTCDate(d.getUTCDate()-(row*7+(6-col)));const key=d.toISOString().slice(0,10);matrix.push(counts.get(key)||0)}}
  const total30=[...counts.values()].reduce((a,b)=>a+b,0);
  const lastActive=dates[0]?`${dates[0]}T00:00:00Z`:null;
  return {last14,streakDays:streak,total30,lastActive,matrix,recentEventCount};
}
function auraScore(stats,activity){
  const followers=Math.min(25,Math.sqrt(stats.followers)*1.2);
  const stars=Math.min(25,Math.sqrt(stats.totalStars)*1.5);
  const repos=Math.min(15,Math.sqrt(stats.publicRepos)*1.5);
  const active=Math.min(20,(activity.total30||0)*0.7);
  const breadth=Math.min(15,(stats.languages||[]).length*3);
  return Math.max(0,Math.min(100,Math.round(followers+stars+repos+active+breadth)));
}
function rarity(score){return score>=75?'LEGENDARY':score>=50?'EPIC':score>=25?'RARE':'COMMON'}
async function enrichOne(p){
  if(p.isDemo)return p;
  try{
    const u=await gh(`https://api.github.com/users/${encodeURIComponent(p.github)}`);
    let repos=await gh(`https://api.github.com/users/${encodeURIComponent(p.github)}/repos?per_page=100&page=1&sort=updated&direction=desc`);
    const events=await gh(`https://api.github.com/users/${encodeURIComponent(p.github)}/events/public?per_page=100&page=1`);
    const languages=new Map(); let totalStars=0;
    const repoPages=Math.min(5,Math.max(1,Math.ceil(Number(u.public_repos||0)/100)));
    for(const r of repos){totalStars+=Number(r.stargazers_count||0); if(r.language)languages.set(r.language,(languages.get(r.language)||0)+1)}
    for(let page=2;page<=repoPages;page++){const more=await gh(`https://api.github.com/users/${encodeURIComponent(p.github)}/repos?per_page=100&page=${page}&sort=updated&direction=desc`); if(!more.length) break; repos=repos.concat(more); for(const r of more){totalStars+=Number(r.stargazers_count||0); if(r.language)languages.set(r.language,(languages.get(r.language)||0)+1)}}
    const topLanguages=[...languages.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name])=>name);
    const activity=activityStats(events);
    const stats={followers:Number(u.followers||0),publicRepos:Number(u.public_repos||0),totalStars, languages:topLanguages};
    const score=auraScore(stats,activity);
    return {...p,name:u.name||p.name||p.github,role:p.role||(u.bio?'Builder':'Developer'),avatar:u.avatar_url||p.avatar,links:{...p.links,GitHub:u.html_url||`https://github.com/${p.github}`},githubUrl:u.html_url||`https://github.com/${p.github}`,metadata:{followers:stats.followers,publicRepos:stats.publicRepos,totalStars:stats.totalStars,languages:topLanguages,githubCreatedAt:u.created_at,githubUpdatedAt:u.updated_at,lastActiveAt:activity.lastActive,repoSampled:Number(u.public_repos||0)>500},activity:{...activity,source:'public GitHub events; 30-day API window'},aura:{score,formula:'Illustrative public-metrics blend; not a popularity ranking'},rarity:rarity(score),isEnriched:true};
  }catch(err){return {...p,isEnriched:false,enrichmentError:String(err.message||err)}}
}
if(!process.env.GITHUB_ACTIONS && !token){console.log('GitHub enrichment skipped: set GITHUB_TOKEN or run in GitHub Actions.');process.exit(0)}
const profiles=JSON.parse(await fs.readFile(profilesPath,'utf8'));
const enriched=[]; const queue=[...profiles]; const concurrency=4;
async function worker(){while(queue.length){const p=queue.shift();enriched.push(await enrichOne(p))}}
await Promise.all(Array.from({length:Math.min(concurrency,profiles.length)},worker));
enriched.sort((a,b)=>new Date(b.joinedAt)-new Date(a.joinedAt)||a.name.localeCompare(b.name));
await fs.writeFile(profilesPath,JSON.stringify(enriched,null,2)+'\n');
let community=JSON.parse(await fs.readFile(communityPath,'utf8'));
if(repo){try{const [owner,name]=repo.split('/');const pulls=await gh(`https://api.github.com/repos/${owner}/${name}/pulls?state=closed&sort=updated&direction=desc&per_page=20`);const merges=pulls.filter(p=>p.merged_at).slice(0,8).map(p=>({number:p.number,title:p.title,url:p.html_url,mergedAt:p.merged_at,author:p.user?.login||'',kind:'MERGED PR'}));community={generatedAt:new Date().toISOString(),merges:merges.length?merges:community.merges,lastMerged:merges[0]||null};}catch{} }
await fs.writeFile(communityPath,JSON.stringify(community,null,2)+'\n');
const site=JSON.parse(await fs.readFile(sitePath,'utf8'));site.enrichment={enabled:Boolean(token),source:'GitHub REST public API; public activity only; generated in CI'};await fs.writeFile(sitePath,JSON.stringify(site,null,2)+'\n');
console.log(`Enriched ${enriched.length} profiles`);
