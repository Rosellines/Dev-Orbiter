import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {validateAgainstSchema,loadSchema} from "./validator.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const profilesDir=path.join(root,"data","profiles");
const profilesOut=path.join(root,"data","profiles.json");
const siteOut=path.join(root,"data","site.json");
const communityOut=path.join(root,"data","community.json");
const checkOnly=process.argv.includes('--check');
const schema=await loadSchema(root);
const files=(await fs.readdir(profilesDir)).filter(f=>f.endsWith('.json')&&!f.startsWith('_')).sort();
const profiles=[];
const seen=new Set();

function gitDate(file){
  try{
    const rel=path.relative(root,path.join('data','profiles',file));
    const out=execFileSync('git',['log','-1','--format=%cI','--',rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    if(out) return out.slice(0,10);
  }catch{}
  return new Date().toISOString().slice(0,10);
}
function safeDefaultAvatar(handle){return `https://github.com/${encodeURIComponent(handle)}.png?size=160`}
for(const file of files){
  const raw=JSON.parse(await fs.readFile(path.join(profilesDir,file),'utf8'));
  validateAgainstSchema(raw,schema,file);
  const key=raw.github.toLowerCase();
  if(seen.has(key)) throw new Error(`${file}: duplicate GitHub handle (case-insensitive): ${raw.github}`);
  seen.add(key);
  const joinedAt=raw.joinedAt||gitDate(file);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(joinedAt)||Number.isNaN(Date.parse(`${joinedAt}T00:00:00Z`))) throw new Error(`${file}: joinedAt must be a real YYYY-MM-DD date`);
  const normalized={
    name:raw.name||raw.github,
    github:raw.github,
    role:raw.role||'Developer',
    avatar:raw.avatar||safeDefaultAvatar(raw.github),
    bio:raw.bio,
    skills:[...new Set(raw.skills)],
    building:raw.building||'something useful',
    links:{GitHub:`https://github.com/${raw.github}`,...(raw.links||{})},
    projects:raw.projects||[],
    joinedAt,
    isDemo:Boolean(raw.isDemo)
  };
  profiles.push(normalized);
}
profiles.sort((a,b)=>new Date(b.joinedAt)-new Date(a.joinedAt)||a.name.localeCompare(b.name));
if(checkOnly){
  console.log(`Validated ${profiles.length} profiles.`);
}else{
await fs.writeFile(profilesOut,JSON.stringify(profiles,null,2)+'\n');

let repoUrl='';
try{
  const remote=execFileSync('git',['remote','get-url','origin'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  if(remote){
    const ssh=remote.match(/^git@github\.com:(.+?)(?:\.git)?$/);
    const https=remote.match(/^https?:\/\/github\.com\/(.+?)(?:\.git)?$/);
    if(ssh) repoUrl=`https://github.com/${ssh[1]}`;
    else if(https) repoUrl=`https://github.com/${https[1]}`;
    else repoUrl=remote.replace(/\.git$/,'');
  }
}catch{}
if(process.env.GITHUB_REPOSITORY) repoUrl=`https://github.com/${process.env.GITHUB_REPOSITORY}`;
const site={
  brand:'ORBITER EMBER',
  repositoryUrl:repoUrl||null,
  contributionGuideUrl:'CONTRIBUTING.md',
  generatedAt:new Date().toISOString(),
  enrichment:{enabled:Boolean(process.env.GITHUB_ACTIONS||process.env.GITHUB_TOKEN),source:'GitHub REST public API; public activity only'}
};
await fs.writeFile(siteOut,JSON.stringify(site,null,2)+'\n');
const fallbackMerges=profiles.slice(0,5).map(p=>({number:null,title:`${p.name} joined the board`,url:`contributors.html?profile=${encodeURIComponent(p.github)}`,mergedAt:`${p.joinedAt}T00:00:00Z`,author:p.github,kind:'PROFILE MERGE'}));
let community={generatedAt:site.generatedAt,merges:fallbackMerges,lastMerged:null};
await fs.writeFile(communityOut,JSON.stringify(community,null,2)+'\n');
console.log(`Built ${profiles.length} profiles -> ${path.relative(root,profilesOut)}`);
}
