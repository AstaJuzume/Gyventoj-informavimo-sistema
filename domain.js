export const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const clean = v => String(v ?? '').trim();
export const phoneKey = v => clean(v).replace(/[^\d+]/g,'');
export function validateContact(r) {
  if (!r.name || r.name.length>120) return 'Įrašykite gyventojo vardą ir pavardę (iki 120 simbolių).';
  if (!r.apt || r.apt.length>20) return 'Įrašykite buto numerį (iki 20 simbolių).';
  if (!r.phone && !r.email) return 'Reikalingas telefono numeris arba el. pašto adresas.';
  if (r.phone && !/^\+?\d{7,15}$/.test(phoneKey(r.phone))) return 'Netinkamas telefono numeris.';
  if (r.email && (r.email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))) return 'Netinkamas el. pašto adresas.';
  return '';
}
export const houseKey = h => [h.city,h.street,h.number].map(norm).join('|');
export const personKey = r => [r.apt,r.name].map(norm).join('|');
export function planImport(rows, houses) {
  if (!Array.isArray(rows) || rows.length>5001) throw new Error('Vienu kartu importuokite ne daugiau kaip 5 000 eilučių.');
  if (rows.length<2) throw new Error('Faile nėra duomenų eilučių.');
  const aliases={street:['gatve','gatvespavadinimas'],number:['namonumeris','namonr','namas'],city:['miestas'],apt:['butas','butonumeris','butonr'],name:['gyventojas','vardaspavarde','vardasir pavarde','vardasir pavardė'],phone:['telefonas','telefononumeris','tel'],email:['elpastas','elektroninispastas','email'],apartments:['butuskaicius']};
  const headers=rows[0].map(norm), map={};
  for(const [k,options] of Object.entries(aliases)) map[k]=headers.findIndex(h=>options.map(norm).includes(h));
  const missing=['street','number','city','apt','name'].filter(k=>map[k]<0);
  if (missing.length || (map.phone<0&&map.email<0)) throw new Error('Trūksta stulpelių. Naudokite šabloną: Gatvė, Namo numeris, Miestas, Butas, Gyventojas, Telefonas, El. paštas.');
  const working=structuredClone(houses), result={houses:working,errors:[],preview:[],newHouses:0,newContacts:0,skipped:0,rows:0};
  const index=new Map(working.map(h=>[houseKey(h),h]));
  const read=(row,k)=>map[k]<0?'':clean(row[map[k]]);
  for(let i=1;i<rows.length;i++) {
    const row=rows[i];
    if(!Array.isArray(row)||!row.some(v=>clean(v))) continue;
    result.rows++;
    const h={street:read(row,'street'),number:read(row,'number'),city:read(row,'city')};
    const r={apt:read(row,'apt'),name:read(row,'name'),phone:read(row,'phone'),email:read(row,'email').toLowerCase()};
    let error=!h.street||!h.number||!h.city?'Trūksta gatvės, namo numerio arba miesto.':Object.values(h).some(v=>v.length>120)?'Objekto laukas per ilgas.':validateContact(r);
    const count=read(row,'apartments');
    if(count&&(!/^\d+$/.test(count)||+count<1||+count>10000)) error='Netinkamas butų skaičius.';
    let target=index.get(houseKey(h));
    if(target&&!target.active) error='Objektas pažymėtas kaip neadministruojamas.';
    const existing=target?.residents.find(x=>personKey(x)===personKey(r));
    if(existing) {
      if(phoneKey(existing.phone)===phoneKey(r.phone)&&existing.email.toLowerCase()===r.email) {if(!error){result.skipped++;continue}}
      else error='Šis gyventojas jau yra registre, tačiau kontaktai skiriasi. Pirmiausia patikslinkite kontaktą registre arba faile.';
    }
    if(error){result.errors.push({row:i+1,message:error});continue;}
    if(!target){target={id:crypto.randomUUID(),...h,apartments:+count||Math.max(parseInt(r.apt)||1,1),active:true,residents:[]};working.push(target);index.set(houseKey(h),target);result.newHouses++;}
    target.residents.push({id:crypto.randomUUID(),...r});result.newContacts++;
    result.preview.push({row:i+1,address:`${h.street} ${h.number}, ${h.city}`,...r});
  }
  if(!result.rows) throw new Error('Faile nėra užpildytų duomenų eilučių.');
  return result;
}
