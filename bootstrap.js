import {clean, validateContact, houseKey, personKey, planImport} from './domain.js';

const STORAGE_KEY='gyventoju-informavimo-demo-v1';
const same=(a,b)=>String(a)===String(b);
const clone=value=>JSON.parse(JSON.stringify(value));
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
class AppError extends Error{constructor(message,status=400){super(message);this.status=status}}
const fail=(message,status=400)=>{throw new AppError(message,status)};

function readStore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(saved?.state&&Number.isInteger(saved.revision))return saved;
  }catch{}
  const initial={revision:0,state:clone(window.GI_SEED)};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(initial));
  return initial;
}
function writeStore(store){localStorage.setItem(STORAGE_KEY,JSON.stringify(store))}
const canSee=(user,id)=>user.role==='admin'||user.houseIds.some(x=>same(x,id));
function currentUser(state,headers){
  const preview=headers.get('X-Demo-User');
  return state.users.find(u=>same(u.id,preview))||state.users[0];
}
function scope(state,user,revision){
  const houses=state.houses.filter(h=>canSee(user,h.id));
  const history=state.history.map(h=>({...h,recipients:h.recipients.filter(r=>canSee(user,r.houseId))})).filter(h=>h.recipients.length).map(h=>({...h,houseIds:[...new Set(h.recipients.map(r=>r.houseId))],count:h.recipients.length}));
  return {revision,houses,history,users:user.role==='admin'?state.users:[],currentUser:user,canPreview:true,previewUsers:state.users.map(({id,name,role})=>({id,name,role})),personalDemo:true};
}
const admin=user=>{if(user.role!=='admin')fail('Šį veiksmą gali atlikti tik administratorius.',403)};
function getHouse(state,id,user){const house=state.houses.find(h=>same(h.id,id));if(!house||!canSee(user,id))fail('Objektas nepasiekiamas.',403);return house}
function contactFrom(payload){
  const resident={apt:clean(payload.apt),name:clean(payload.name),phone:clean(payload.phone),email:clean(payload.email).toLowerCase()};
  const error=validateContact(resident);if(error)fail(error);return resident;
}
function mutate(state,user,body){
  const p=body.payload||{};
  switch(body.action){
    case 'house.save':{
      admin(user);const item={street:clean(p.street),number:clean(p.number),city:clean(p.city),apartments:Number(p.apartments)};
      if(!item.street||!item.number||!item.city||!Number.isInteger(item.apartments)||item.apartments<1)fail('Patikrinkite adresą ir butų skaičių.');
      if(state.houses.some(h=>houseKey(h)===houseKey(item)&&!same(h.id,p.id)))fail('Toks objektas jau yra registre.');
      if(p.id)Object.assign(getHouse(state,p.id,user),item);else state.houses.unshift({id:crypto.randomUUID(),...item,active:true,residents:[]});break;
    }
    case 'house.delete':{
      admin(user);getHouse(state,p.id,user);state.houses=state.houses.filter(h=>!same(h.id,p.id));state.users.forEach(u=>u.houseIds=u.houseIds.filter(id=>!same(id,p.id)));break;
    }
    case 'contact.save':{
      admin(user);const house=getHouse(state,p.houseId,user),resident=contactFrom(p);
      if(house.residents.some(r=>personKey(r)===personKey(resident)&&!same(r.id,p.id)))fail('Šis gyventojas jau yra šiame bute.');
      if(p.id){const existing=house.residents.find(r=>same(r.id,p.id));if(!existing)fail('Kontaktas neberastas.',409);Object.assign(existing,resident)}else house.residents.push({id:crypto.randomUUID(),...resident});break;
    }
    case 'contact.delete':{
      admin(user);const house=getHouse(state,p.houseId,user);house.residents=house.residents.filter(r=>!same(r.id,p.id));break;
    }
    case 'user.save':{
      admin(user);const name=clean(p.name),email=clean(p.email).toLowerCase(),role=p.role;
      if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['admin','employee'].includes(role))fail('Patikrinkite naudotojo vardą, el. paštą ir rolę.');
      if(state.users.some(u=>u.email.toLowerCase()===email&&!same(u.id,p.id)))fail('Naudotojas tokiu el. paštu jau yra.');
      const houseIds=Array.isArray(p.houseIds)?[...new Set(p.houseIds.map(String))]:[];
      const item={name,email,role,houseIds:role==='admin'?[]:houseIds};
      if(p.id){const existing=state.users.find(u=>same(u.id,p.id));if(!existing)fail('Naudotojas neberastas.',409);Object.assign(existing,item)}else state.users.push({id:crypto.randomUUID(),...item});break;
    }
    case 'import':{
      admin(user);const plan=planImport(p.rows,state.houses);if(plan.errors.length)fail(`Importas neatliktas. Eilutė ${plan.errors[0].row}: ${plan.errors[0].message}`);
      if(!plan.newContacts)fail('Naujų kontaktų nėra. Visi įrašai jau egzistuoja.');state.houses=plan.houses;return {newHouses:plan.newHouses,newContacts:plan.newContacts,skipped:plan.skipped};
    }
    case 'message.demo':{
      const channel=p.channel;if(!['sms','email','both'].includes(channel))fail('Pasirinkite siuntimo kanalą.');
      const sms=clean(p.sms),emailText=clean(p.emailText),subject=clean(p.subject);if(channel!=='email'&&!sms)fail('Įrašykite SMS tekstą.');if(channel!=='sms'&&(!subject||!emailText))fail('Įrašykite el. laiško temą ir tekstą.');
      const requested=new Set((p.recipientIds||[]).map(String));if(!requested.size)fail('Pasirinkite gavėjus.');
      const recipients=state.houses.filter(h=>h.active&&canSee(user,h.id)).flatMap(h=>h.residents.filter(r=>requested.has(String(r.id))).map(r=>({...r,houseId:h.id,address:`${h.street} ${h.number}, ${h.city}`,channels:[...(channel!=='email'&&r.phone?['sms']:[]),...(channel!=='sms'&&r.email?['email']:[])]})));
      if(recipients.length!==requested.size)fail('Dalis gavėjų nepasiekiama. Patikrinkite pasirinkimą.',403);
      state.history.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),subject:channel==='sms'?'SMS pranešimas':subject,sms:channel==='email'?'':sms,emailText:channel==='sms'?'':emailText,text:channel==='email'?emailText:sms,channel,mode:'demo',sender:user.name,houseIds:[...new Set(recipients.map(r=>r.houseId))],recipients,count:recipients.length});break;
    }
    default:fail('Nežinomas veiksmas.');
  }
  return {};
}

const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(!['/api/state','/api/action'].includes(url.pathname))return nativeFetch(input,init);
  try{
    const headers=new Headers(init.headers||{}),store=readStore(),user=currentUser(store.state,headers);
    if(url.pathname==='/api/state')return json(scope(store.state,user,store.revision));
    const body=JSON.parse(init.body||'{}');if(body.revision!==store.revision)fail('Duomenys pasikeitė kitame lange. Atnaujinkite ir bandykite dar kartą.',409);
    const result=mutate(store.state,user,body);store.revision+=1;writeStore(store);
    return json({...scope(store.state,currentUser(store.state,headers),store.revision),result});
  }catch(error){return json({error:error instanceof AppError?error.message:'Nepavyko įkelti arba išsaugoti duomenų.'},error.status||500)}
};

await import('./app.js');
