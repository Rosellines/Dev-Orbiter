import fs from "node:fs/promises";
import path from "node:path";

export async function loadSchema(root){
  return JSON.parse(await fs.readFile(path.join(root,"profiles.schema.json"),"utf8"));
}

function fail(file, at, message){ throw new Error(`${file}${at?` ${at}`:""}: ${message}`); }
function checkType(file, at, value, type){
  const ok = type==='object' ? value && typeof value==='object' && !Array.isArray(value)
    : type==='array' ? Array.isArray(value)
    : type==='string' ? typeof value==='string'
    : type==='boolean' ? typeof value==='boolean'
    : type==='number' ? typeof value==='number' && Number.isFinite(value)
    : true;
  if(!ok) fail(file, at, `must be ${type}`);
}
function checkString(file, at, value, rules){
  if(rules.minLength!=null && value.length<rules.minLength) fail(file,at,`must be at least ${rules.minLength} characters`);
  if(rules.maxLength!=null && value.length>rules.maxLength) fail(file,at,`must be at most ${rules.maxLength} characters`);
  if(rules.pattern && !(new RegExp(rules.pattern)).test(value)) fail(file,at,'has invalid format');
  if(rules.format==='uri'){
    let u; try{u=new URL(value)}catch{fail(file,at,'must be a valid URL')}
    const allowed=rules['x-allowedSchemes'];
    if(Array.isArray(allowed) && !allowed.includes(u.protocol.replace(':',''))) fail(file,at,`URL scheme must be one of: ${allowed.join(', ')}`);
  }
}
export function validateAgainstSchema(value,schema,file='profile'){
  const at=''; checkType(file,at,value,schema.type);
  if(schema.required) for(const k of schema.required) if(!(k in value)) fail(file,`.${k}`,'is required');
  if(schema.properties){
    for(const [k,v] of Object.entries(value)){
      if(!schema.properties[k] && schema.additionalProperties===false) fail(file,`.${k}`,'is not allowed');
      if(!schema.properties[k]) continue;
      const r=schema.properties[k]; checkType(file,`.${k}`,v,r.type);
      if(r.type==='string') checkString(file,`.${k}`,v,r);
      if(r.type==='array'){
        if(r.minItems!=null && v.length<r.minItems) fail(file,`.${k}`,'has too few items');
        if(r.maxItems!=null && v.length>r.maxItems) fail(file,`.${k}`,'has too many items');
        if(r.items) v.forEach((item,i)=>{ checkType(file,`.${k}[${i}]`,item,r.items.type); if(r.items.type==='string') checkString(file,`.${k}[${i}]`,item,r.items); if(r.items.type==='object') validateAgainstSchema(item,r.items,file+`.${k}[${i}]`); });
      }
      if(r.type==='object'){
        if(r.required) for(const req of r.required) if(!(req in v)) fail(file,`.${k}.${req}`,'is required');
        for(const [ik,iv] of Object.entries(v)){
          if(r.properties?.[ik]){const ir=r.properties[ik];checkType(file,`.${k}.${ik}`,iv,ir.type);if(ir.type==='string')checkString(file,`.${k}.${ik}`,iv,ir);}
          else if(r.additionalProperties===false) fail(file,`.${k}.${ik}`,'is not allowed');
          else if(r.additionalProperties?.type){const ar=r.additionalProperties;checkType(file,`.${k}.${ik}`,iv,ar.type);if(ar.type==='string')checkString(file,`.${k}.${ik}`,iv,ar);}
        }
      }
    }
  }
  return true;
}
