import { planImport, validateContact } from './domain.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eq=(a,b)=>String(a)===String(b),address=h=>`${h.street} ${h.number}`;
const channelName=c=>({sms:'SMS',email:'El. paštas',both:'SMS ir el. paštas'}[c]);
let data=null,selectedHouse=null,selectedChannel='sms',previewUser='',view='objects',busy=false,loadGeneration=0,focusBeforeModal;
let selectedHouses=new Set(),excludedRecipients=new Set();
let importRows=null,importPlan=null,importWorkbook=null;
const isAdmin=()=>data?.currentUser.role==='admin';
const residents=()=>data.houses.filter(h=>h.active&&selectedHouses.has(String(h.id))).flatMap(h=>h.residents.map(r=>({...r,houseId:h.id,address:address(h)+', '+h.city})));
function eligible(r){return (selectedChannel!=='email'&&r.phone)||(selectedChannel!=='sms'&&r.email)}
function filteredRecipients(){const filter=$('#contactFilter').value;return residents().filter(r=>filter==='all'||filter==='sms'&&r.phone||filter==='email'&&r.email||filter==='both'&&r.phone&&r.email)}
const chosenRecipients=()=>filteredRecipients().filter(r=>eligible(r)&&!excludedRecipients.has(String(r.id)));
const deliveryChannels=r=>[...(selectedChannel!=='email'&&r.phone?['SMS']:[]),...(selectedChannel!=='sms'&&r.email?['El. paštas']:[])].join(', ');
async function api(path,body){
 const response=await fetch(path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(previewUser?{'X-Demo-User':previewUser}:{})},...(body?{body:JSON.stringify(body)}:{})});
 let result;try{result=await response.json()}catch{throw new Error('Nepavyko susisiekti su duomenų saugykla.')}
 if(!response.ok)throw Object.assign(new Error(result.error||'Operacija nepavyko.'),{status:response.status});return result;
}
function applyState(next){
 data=next;$('.demo-banner strong').textContent=data.personalDemo?'Jūsų demonstracinė aplinka':'Demonstracinė aplinka';$('.demo-banner span').textContent=data.personalDemo?'Pakeitimai išsaugomi jūsų demonstracijoje ir matomi grįžus ta pačia naršykle. SMS ir el. laiškai realiai nesiunčiami.':'Duomenys išsaugomi. SMS ir el. laiškai realiai nesiunčiami. Microsoft prisijungimas dar neprijungtas.';$('#loadError').hidden=true;$('#workspace').hidden=false;
 if(!data.houses.some(h=>eq(h.id,selectedHouse)))selectedHouse=data.houses[0]?.id??null;
 selectedHouses=new Set([...selectedHouses].filter(id=>data.houses.some(h=>eq(h.id,id)&&h.active)));
 renderAll();$('#saveStatus').textContent='Duomenys išsaugomi';
}
async function loadState(){
 if(busy)return;const generation=++loadGeneration;$('#saveStatus').textContent='Įkeliama…';$('#workspace').inert=true;$('#roleSwitch').disabled=true;
 try{const result=await api('/api/state');if(generation!==loadGeneration)return;applyState(result)}catch(e){if(generation!==loadGeneration)return;$('#loadError').hidden=false;$('#loadError').textContent=e.message+' Paspauskite „Atnaujinti“. ';$('#workspace').hidden=true;$('#saveStatus').textContent='Nepavyko įkelti'}finally{if(generation===loadGeneration){$('#workspace').inert=false;$('#roleSwitch').disabled=false}}
}
async function action(name,payload,onSuccess){
 if(busy)return;busy=true;$('#saveStatus').textContent='Išsaugoma…';$('#roleSwitch').disabled=true;$$('#modalFoot button').forEach(b=>b.disabled=true);
 const error=$('#modalError');if(error)error.hidden=true;
 try{const result=await api('/api/action',{action:name,payload,revision:data.revision});applyState(result);busy=false;closeModal();onSuccess?.(result.result);return true}
 catch(e){if(error){error.hidden=false;error.textContent=e.message;if(e.status===409){const refresh=document.createElement('button');refresh.className='btn small';refresh.textContent='Atnaujinti duomenis';refresh.onclick=async()=>{await loadState();if(!$('#workspace').hidden){error.hidden=true;if(name==='import'&&importWorkbook)inspectSheet()}};error.append(document.createElement('br'),refresh)}}else toast(e.message);$('#saveStatus').textContent='Pakeitimai neišsaugoti';return false}
 finally{busy=false;$('#roleSwitch').disabled=false;$$('#modalFoot button').forEach(b=>b.disabled=false)}
}
function setView(next){if(!isAdmin()&&next==='users')next='objects';view=next;$$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+view));$$('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$('#pageTitle').textContent={objects:'Objektai ir gyventojai',compose:'Naujas pranešimas',history:'Pranešimų istorija',users:'Naudotojai ir prieigos'}[view];$('#sidebar').classList.remove('open')}
function renderAll(){
 $('#roleSwitch').hidden=!data.canPreview;
 $('#roleSwitch').innerHTML=data.previewUsers.map(u=>`<option value="${esc(u.id)}" ${eq(u.id,data.currentUser.id)?'selected':''}>${esc(u.name)} · ${u.role==='admin'?'administratorius':'darbuotojas'}</option>`).join('');
 const u=data.currentUser;$('#topName').textContent=u.name;$('#topRole').textContent='Demonstracinė peržiūra';$('#topAvatar').textContent=u.name.split(' ').map(x=>x[0]).slice(0,2).join('');
 $$('.admin-only').forEach(x=>x.classList.toggle('hidden',!isAdmin()));$$('.admin-controls').forEach(x=>x.hidden=!isAdmin());
 const city=$('#cityFilter').value;$('#cityFilter').innerHTML='<option value="all">Visi miestai</option>'+[...new Set(data.houses.map(h=>h.city))].sort().map(c=>`<option>${esc(c)}</option>`).join('');if([...$('#cityFilter').options].some(o=>o.value===city))$('#cityFilter').value=city;
 renderHouses();renderHouseDetail();renderChecks();updateCompose();renderHistory();renderUsers();setView(view);
}
function renderHouses(){
 const q=$('#houseSearch').value.toLowerCase(),city=$('#cityFilter').value;const list=data.houses.filter(h=>address(h).toLowerCase().includes(q)&&(city==='all'||h.city===city));
 $('#objectCount').textContent=list.length+' objektai';
 $('#housesBody').innerHTML=list.map(h=>`<tr data-id="${esc(h.id)}" tabindex="0" class="${eq(h.id,selectedHouse)?'selected':''}"><td class="main-cell"><strong>${esc(address(h))}</strong><span class="sub">${esc(h.city)}</span></td><td>${esc(h.city)}</td><td>${h.apartments}</td><td>${h.residents.length}</td><td><span class="badge ${h.active?'':'gray'}">${h.active?'Administruojamas':'Neadministruojamas'}</span></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Objektų nerasta</td></tr>';
 $$('#housesBody tr[data-id]').forEach(tr=>{const select=()=>{selectedHouse=tr.dataset.id;renderHouses();renderHouseDetail();$('#objectsCard').classList.add('mobile-hidden');$('#houseDetail').classList.add('mobile-active')};tr.onclick=select;tr.onkeydown=e=>{if(e.key==='Enter')select()}});
}
function renderHouseDetail(){
 const h=data.houses.find(x=>eq(x.id,selectedHouse));if(!h){$('#houseDetail').innerHTML='<div class="blank-detail">Nėra priskirtų objektų.</div>';return}
 $('#houseDetail').innerHTML=`<div class="detail-head"><button class="btn ghost small back" id="backObjects">← Atgal</button><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><div class="sub">Objekto kortelė</div><h3>${esc(address(h))}</h3><span class="sub">${esc(h.city)}</span><br><span class="badge ${h.active?'':'gray'}">${h.active?'Administruojamas':'Neadministruojamas'}</span></div>${isAdmin()?'<div class="actions"><button class="btn small" id="editHouse">Koreguoti</button><button class="btn danger small" id="removeHouse">Pašalinti</button></div>':''}</div><div class="metrics"><div class="metric"><strong>${h.apartments}</strong><span>butai</span></div><div class="metric"><strong>${h.residents.length}</strong><span>kontaktai</span></div></div></div><div class="tabs"><button class="tab active">Gyventojai ir kontaktai</button></div><div class="resident-list"><div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0"><strong>Susieti kontaktai</strong>${isAdmin()?'<button class="btn small" id="addResident">+ Pridėti kontaktą</button>':''}</div>${h.residents.map(r=>`<div class="resident"><div><strong>${esc(r.name)}</strong><div class="resident-meta"><span>Butas ${esc(r.apt)}</span>${r.phone?`<span>${esc(r.phone)}</span>`:''}${r.email?`<span>${esc(r.email)}</span>`:''}</div></div>${isAdmin()?`<div class="icon-actions"><button class="btn ghost small edit-resident" data-id="${esc(r.id)}" aria-label="Koreguoti ${esc(r.name)}">✎</button><button class="btn ghost small delete-resident" data-id="${esc(r.id)}" aria-label="Pašalinti ${esc(r.name)}">×</button></div>`:''}</div>`).join('')||'<div class="empty">Kontaktų nėra</div>'}</div>`;
 $('#backObjects').onclick=()=>{$('#objectsCard').classList.remove('mobile-hidden');$('#houseDetail').classList.remove('mobile-active')};
 $('#editHouse')?.addEventListener('click',()=>openHouse(h));
 $('#removeHouse')?.addEventListener('click',()=>confirmDelete('Pašalinti objektą?',`${address(h)} ir visi ${h.residents.length} jo kontaktai bus pašalinti iš registro. Ankstesnių pranešimų istorija išliks.`,()=>action('house.delete',{id:h.id},()=>toast('Objektas ir jo kontaktai pašalinti.'))));
 $('#addResident')?.addEventListener('click',()=>openContact(h));
 $$('.edit-resident').forEach(b=>b.onclick=()=>openContact(h,h.residents.find(r=>eq(r.id,b.dataset.id))));
 $$('.delete-resident').forEach(b=>b.onclick=()=>confirmDelete('Pašalinti kontaktą?','Kontaktas bus pašalintas iš registro. Ankstesnių pranešimų istorija išliks.',()=>action('contact.delete',{houseId:h.id,id:b.dataset.id},()=>toast('Kontaktas pašalintas.'))));
}
function renderChecks(){
 const q=$('#recipientSearch').value.toLowerCase();
 $('#houseChecks').innerHTML=data.houses.filter(h=>h.active&&address(h).toLowerCase().includes(q)).map(h=>`<label class="check-row"><input type="checkbox" class="house-check" value="${esc(h.id)}" ${selectedHouses.has(String(h.id))?'checked':''}><span><strong>${esc(address(h))}</strong><span class="sub">${esc(h.city)} · ${h.residents.length} kontaktai</span></span></label>`).join('')||'<span class="sub">Objektų nerasta.</span>';
 $$('.house-check').forEach(c=>c.onchange=()=>{if(c.checked)selectedHouses.add(c.value);else selectedHouses.delete(c.value);updateCompose()});
}
function updateCompose(){
 if(!data)return;const all=filteredRecipients(),selected=chosenRecipients();
 $$('.sms-field').forEach(x=>x.hidden=selectedChannel==='email');$$('.email-field').forEach(x=>x.hidden=selectedChannel==='sms');
 $('#smsCount').textContent=$('#messageText').value.length+'/500 simbolių';
 $('#recipientCount').textContent=selected.length;
 $('#recipientActions').hidden=!selectedHouses.size;
 $('#selectAllRecipients').disabled=!all.some(r=>eligible(r)&&excludedRecipients.has(String(r.id)));
 $('#deselectAllRecipients').disabled=!selected.length;
 const groups=[...all.reduce((map,r)=>{if(!map.has(r.address))map.set(r.address,[]);map.get(r.address).push(r);return map},new Map())];
 $('#recipientList').innerHTML=groups.map(([place,list])=>{const count=list.filter(r=>eligible(r)&&!excludedRecipients.has(String(r.id))).length;return `<section class="recipient-group"><div class="recipient-group-head"><strong>${esc(place)}</strong><span>Pasirinkta ${count} iš ${list.length}</span></div>${list.map(r=>`<label class="recipient-item ${eligible(r)?'':'unavailable'}"><input class="recipient-check" type="checkbox" value="${esc(r.id)}" ${eligible(r)&&!excludedRecipients.has(String(r.id))?'checked':''} ${eligible(r)?'':'disabled'}><span><strong>${esc(r.name)} · butas ${esc(r.apt)}</strong><small>${esc(r.phone||'Telefono nėra')} · ${esc(r.email||'El. pašto nėra')}</small>${eligible(r)?`<small>Bus siunčiama: ${deliveryChannels(r)}</small>`:'<small>Praleidžiama: nėra kontaktų pasirinktam kanalui.</small>'}</span></label>`).join('')}</section>`}).join('')||(selectedHouses.size?'<p class="sub">Pagal filtrą gavėjų nėra.</p>':'<p class="sub">Pasirinkite namus, kad matytumėte konkrečius gavėjus.</p>');
 $$('.recipient-check').forEach(c=>c.onchange=()=>{if(c.checked)excludedRecipients.delete(c.value);else excludedRecipients.add(c.value);updateCompose()});
 const smsCount=selected.filter(r=>selectedChannel!=='email'&&r.phone).length,emailCount=selected.filter(r=>selectedChannel!=='sms'&&r.email).length;
 const alerts=[];if(selectedChannel!=='email'){const n=all.filter(r=>!r.phone).length;if(n)alerts.push(`${n} ${n===1?'gyventojas negaus':'gyventojai negaus'} SMS, nes nėra telefono numerio.`)}if(selectedChannel!=='sms'){const n=all.filter(r=>!r.email).length;if(n)alerts.push(`${n} ${n===1?'gyventojas negaus':'gyventojai negaus'} el. laiško, nes nėra el. pašto adreso.`)}
 $('#contactAlerts').hidden=!alerts.length;$('#contactAlerts').innerHTML=alerts.map(t=>`<div class="contact-alert">${esc(t)}</div>`).join('');
 $('#sendSummary').textContent=selected.length?`${selected.length} gavėjai · ${smsCount} SMS · ${emailCount} el. laiškai`:'Pasirinkite gavėjus su tinkamais kontaktais';
 const validSms=selectedChannel==='email'||$('#messageText').value.trim();const validEmail=selectedChannel==='sms'||($('#subject').value.trim()&&$('#emailText').value.trim());
 $('#messageTextField').classList.toggle('invalid',selectedChannel!=='email'&&!$('#messageText').value.trim());$('#subjectField').classList.toggle('invalid',selectedChannel!=='sms'&&!$('#subject').value.trim());$('#emailTextField').classList.toggle('invalid',selectedChannel!=='sms'&&!$('#emailText').value.trim());
 $('#composeHint').textContent=!selectedHouses.size?'Pasirinkite bent vieną objektą.':!selected.length?'Pasirinkite bent vieną gavėją su tinkamais kontaktais.':!validSms?'Įrašykite SMS tekstą.':!validEmail?'Užpildykite el. laiško temą ir tekstą.':'';$('#composeHint').hidden=!!selected.length&&!!validSms&&!!validEmail;
 $('#reviewBtn').disabled=!selected.length||!validSms||!validEmail;
}
function recipientTable(list,review=false){return `<div class="table-wrap"><table class="table"><thead><tr><th>Gyventojas / objektas</th><th>Telefonas</th><th>El. paštas</th><th>Kanalai</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${esc(r.name)}</strong><div class="sub">${esc(r.address)} · butas ${esc(r.apt)}</div></td><td>${esc(r.phone||'—')}</td><td>${esc(r.email||'—')}</td><td>${review?deliveryChannels(r):esc((r.channels||[]).map(channelName).join(', '))}</td></tr>`).join('')}</tbody></table></div>`}
function openReview(){
 const rs=chosenRecipients();if(!rs.length)return;
 const houses=[...new Set(rs.map(r=>r.address))],smsCount=rs.filter(r=>selectedChannel!=='email'&&r.phone).length,emailCount=rs.filter(r=>selectedChannel!=='sms'&&r.email).length;
 openModal('Pranešimo peržiūra',`<div class="info-box"><strong>Demonstracinis veiksmas.</strong> Pranešimas bus išsaugotas istorijoje. SMS ir el. laiškai gavėjams nebus siunčiami.</div><div class="review-summary"><div class="review-stat"><span>Objektai</span><strong>${houses.length}</strong></div><div class="review-stat"><span>Gavėjai</span><strong>${rs.length}</strong></div><div class="review-stat"><span>Kanalai</span><strong>${smsCount} SMS · ${emailCount} el. laiškai</strong></div></div>${selectedChannel!=='email'?`<div class="field"><label>SMS tekstas</label><div class="preview-box"><p>${esc($('#messageText').value)}</p></div></div>`:''}${selectedChannel!=='sms'?`<div class="field"><label>El. laiškas: ${esc($('#subject').value)}</label><div class="preview-box"><p>${esc($('#emailText').value)}</p></div></div>`:''}<details class="recipient-details"><summary>Peržiūrėti ${rs.length} gavėjus</summary>${recipientTable(rs,true)}</details>`,`<button class="btn" data-close>Grįžti</button><button class="btn primary" id="sendNow">Imituoti siuntimą ir išsaugoti</button>`,true);
 $('#sendNow').onclick=()=>action('message.demo',{channel:selectedChannel,recipientIds:rs.map(r=>r.id),sms:$('#messageText').value,emailText:$('#emailText').value,subject:$('#subject').value},()=>{toast('Demonstracinis pranešimas išsaugotas. Tikras siuntimas neatliktas.');setView('history')});
}
function dateLabel(value){const d=new Date(value.includes('T')?value:value.replace(' ','T'));return isNaN(d)?value:d.toLocaleString('lt-LT',{dateStyle:'short',timeStyle:'short'})}
function renderHistory(){
 const q=$('#historySearch').value.toLowerCase(),ch=$('#historyChannel').value;const channel={all:'all',SMS:'sms','El. paštas':'email','SMS + el. paštas':'both'}[ch];
 const list=data.history.filter(h=>(channel==='all'||h.channel===channel)&&[h.subject,h.text,h.emailText,h.sender,...h.recipients.flatMap(r=>[r.name,r.address,r.phone,r.email])].join(' ').toLowerCase().includes(q));
 $('#historyBody').innerHTML=list.map(h=>{const places=[...new Set(h.recipients.map(r=>r.address))];return `<tr class="history-row" data-id="${esc(h.id)}" tabindex="0"><td>${esc(dateLabel(h.date))}<span class="demo-label">Demonstracinis · nesiųsta</span></td><td><span class="history-subject">${esc(h.subject)}</span><span class="history-preview">${esc(h.text||h.emailText||'')}</span></td><td>${places.map(p=>`<span class="history-object">${esc(p)}</span>`).join('')}<div class="sub">${h.recipients.length} gavėjai</div></td><td><span class="badge ${h.channel==='sms'?'sms':h.channel==='email'?'email':'amber'}">${channelName(h.channel)}</span></td><td>${esc(h.sender)}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">Pranešimų nerasta</td></tr>';
 $$('.history-row').forEach(r=>{r.onclick=()=>openHistory(r.dataset.id);r.onkeydown=e=>{if(e.key==='Enter')openHistory(r.dataset.id)}});
}
function openHistory(id){
 const h=data.history.find(x=>eq(x.id,id));if(!h)return;
 const places=[...new Set(h.recipients.map(r=>r.address))];openModal('Pranešimo informacija',`<div class="info-box">Demonstracinis įrašas. Tikras siuntimas neatliktas.</div><div class="review-summary"><div class="review-stat"><span>Data ir laikas</span><strong>${esc(dateLabel(h.date))}</strong></div><div class="review-stat"><span>Paruošė</span><strong>${esc(h.sender)}</strong></div><div class="review-stat"><span>Objektai ir gavėjai</span><strong>${places.length} · ${h.recipients.length} gav.</strong></div></div>${h.channel!=='email'?`<div class="field"><label>SMS tekstas</label><div class="preview-box"><p>${esc(h.sms||h.text)}</p></div></div>`:''}${h.channel!=='sms'?`<div class="field"><label>El. laiškas: ${esc(h.subject)}</label><div class="preview-box"><p>${esc(h.emailText||h.text)}</p></div></div>`:''}<details class="recipient-details"><summary>Peržiūrėti ${h.recipients.length} gavėjus</summary>${recipientTable(h.recipients)}</details>`,`<button class="btn primary" data-close>Uždaryti</button>`,true);
}
function renderUsers(){if(!isAdmin()){$('#usersGrid').innerHTML='';return}
 $('#usersGrid').innerHTML=data.users.map(u=>`<article class="card user-card"><div class="user-card-top"><div class="user-identity"><div class="avatar">${esc(u.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</div><div><h3>${esc(u.name)}</h3><span class="sub">${esc(u.email)}</span></div></div><button class="btn ghost small edit-user" data-id="${esc(u.id)}" aria-label="Koreguoti ${esc(u.name)}">✎</button></div><div class="access"><strong>${u.role==='admin'?'Administratorius':'Darbuotojas'}</strong><p>${u.role==='admin'?'Visi objektai':esc(data.houses.filter(h=>u.houseIds.some(id=>eq(id,h.id))).map(address).join(', '))||'Objektų nepriskirta'}</p></div></article>`).join('');
 $$('.edit-user').forEach(b=>b.onclick=()=>openUser(data.users.find(u=>eq(u.id,b.dataset.id))));
}
function openModal(title,body,foot,wide=false){focusBeforeModal=document.activeElement;$('#modalTitle').textContent=title;$('#modalBody').innerHTML='<div id="modalError" class="error-box" role="alert" hidden></div>'+body;$('#modalFoot').innerHTML=foot;$('#modal').classList.add('open');$('.modal').classList.toggle('wide',wide);$('.modal').setAttribute('role','dialog');$('.modal').setAttribute('aria-modal','true');$('.modal').setAttribute('aria-labelledby','modalTitle');$$('#modal [data-close]').forEach(b=>b.onclick=closeModal);setTimeout(()=>$('#modalBody input:not([type=checkbox]), #modalBody select, #modalFoot button')?.focus(),0)}
function closeModal(){if(busy)return;$('#modal').classList.remove('open');focusBeforeModal?.focus?.()}
function showModalError(message){$('#modalError').hidden=false;$('#modalError').textContent=message}
function confirmDelete(title,text,fn){openModal(title,`<div class="confirm-icon">!</div><p>${esc(text)}</p>`,`<button class="btn" data-close>Atšaukti</button><button class="btn danger" id="confirmDelete">Pašalinti</button>`);$('#confirmDelete').onclick=fn}
function field(id,label,value='',type='text',extra='',required=false){return `<div class="field" id="${id}Field"><label for="${id}">${label}${required?'<span class="required"> *</span>':''}</label><input id="${id}" type="${type}" value="${esc(value)}" ${required?'required ':''}${extra} aria-describedby="${id}Error"><span class="field-error" id="${id}Error"></span></div>`}
function clearFieldErrors(){ $$('.field.invalid').forEach(x=>x.classList.remove('invalid'));$$('.field-error').forEach(x=>x.textContent='') }
function fieldError(id,message){const box=$('#'+id+'Field'),error=$('#'+id+'Error');if(box&&error){box.classList.add('invalid');error.textContent=message}return false}
function openHouse(h){
 openModal(h?'Koreguoti objektą':'Naujas objektas',`<div class="form-grid">${field('fStreet','Gatvė',h?.street,'text','maxlength="120"',true)}${field('fNumber','Namo numeris',h?.number,'text','maxlength="30"',true)}${field('fCity','Miestas',h?.city,'text','maxlength="120"',true)}${field('fApartments','Butų skaičius',h?.apartments||1,'number','min="1" max="10000"',true)}</div>`,`<button class="btn" data-close>Atšaukti</button><button class="btn primary" id="saveHouse">Išsaugoti</button>`);
 $('#saveHouse').onclick=()=>{clearFieldErrors();const payload={id:h?.id,street:$('#fStreet').value.trim(),number:$('#fNumber').value.trim(),city:$('#fCity').value.trim(),apartments:$('#fApartments').value};if(!payload.street)return fieldError('fStreet','Įrašykite gatvę.');if(!payload.number)return fieldError('fNumber','Įrašykite namo numerį.');if(!payload.city)return fieldError('fCity','Įrašykite miestą.');if(!payload.apartments||Number(payload.apartments)<1)return fieldError('fApartments','Įrašykite tinkamą butų skaičių.');action('house.save',payload,()=>toast('Objektas išsaugotas.'))};
}
function openContact(h,r){
 openModal(r?'Koreguoti kontaktą':'Naujas gyventojo kontaktas',`${field('rName','Vardas ir pavardė',r?.name,'text','maxlength="120"',true)}<div class="form-grid">${field('rApt','Butas',r?.apt,'text','maxlength="20"',true)}${field('rPhone','Telefono numeris',r?.phone,'tel','maxlength="25"')}</div>${field('rEmail','El. paštas',r?.email,'email','maxlength="254"')}<p class="sub">Įrašykite bent vieną kontaktą: telefoną arba el. paštą.</p>`,`<button class="btn" data-close>Atšaukti</button><button class="btn primary" id="saveResident">Išsaugoti</button>`);
 $('#saveResident').onclick=()=>{clearFieldErrors();const payload={id:r?.id,houseId:h.id,name:$('#rName').value.trim(),apt:$('#rApt').value.trim(),phone:$('#rPhone').value.trim(),email:$('#rEmail').value.trim()};if(!payload.name)return fieldError('rName','Įrašykite vardą ir pavardę.');if(!payload.apt)return fieldError('rApt','Įrašykite buto numerį.');if(!payload.phone&&!payload.email)return fieldError('rPhone','Įrašykite telefono numerį arba el. pašto adresą.');const error=validateContact(payload);if(error)return showModalError(error);action('contact.save',payload,()=>toast('Kontaktas išsaugotas.'))};
}
function openUser(u){
 openModal(u?'Koreguoti naudotojo prieigą':'Naujas naudotojas',`${field('uName','Vardas ir pavardė',u?.name,'text','maxlength="120"',true)}${field('uEmail','El. paštas',u?.email,'email','maxlength="254"',true)}<div class="field"><label for="uRole">Rolė <span class="required">*</span></label><select id="uRole" ${eq(u?.id,1)?'disabled':''}><option value="admin" ${u?.role==='admin'?'selected':''}>Administratorius</option><option value="employee" ${u?.role!=='admin'?'selected':''}>Darbuotojas</option></select></div><div id="userAccess"><p><strong>Priskirti objektai</strong></p><div class="check-list">${data.houses.map(h=>`<label class="check-row"><input class="user-house" type="checkbox" value="${esc(h.id)}" ${u?.houseIds.some(id=>eq(id,h.id))?'checked':''}><span>${esc(address(h))}<span class="sub"> · ${esc(h.city)}</span></span></label>`).join('')||'<span class="sub">Objektų nėra.</span>'}</div></div><p class="sub">Administratorius mato visus objektus. Darbuotojas mato tik priskirtų objektų kontaktus ir pranešimus. Kvietimai iš šio prototipo nesiunčiami.</p>`,`<button class="btn" data-close>Atšaukti</button><button class="btn primary" id="saveUser">Išsaugoti</button>`);
 const update=()=>$('#userAccess').hidden=$('#uRole').value==='admin';$('#uRole').onchange=update;update();
 $('#saveUser').onclick=()=>{clearFieldErrors();const payload={id:u?.id,name:$('#uName').value.trim(),email:$('#uEmail').value.trim(),role:$('#uRole').value,houseIds:$$('.user-house:checked').map(c=>c.value)};if(!payload.name)return fieldError('uName','Įrašykite vardą ir pavardę.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))return fieldError('uEmail','Įrašykite tinkamą el. pašto adresą.');action('user.save',payload,()=>toast('Prieigos išsaugotos. Patikrinkite naudotojo peržiūroje.'))};
}
function downloadTemplate(){const ws=XLSX.utils.aoa_to_sheet([['Gatvė','Namo numeris','Miestas','Butų skaičius','Butas','Gyventojas','Telefonas','El. paštas'],['Parko g.','10','Klaipėda',24,'5','Ona Pavyzdienė','+37060000000','ona@example.lt']]);ws['!cols']=[{wch:22},{wch:15},{wch:18},{wch:15},{wch:10},{wch:26},{wch:20},{wch:28}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Gyventojai');XLSX.writeFile(wb,'Gyventoju_importo_sablonas.xlsx')}
function openImport(){
 importRows=null;importPlan=null;importWorkbook=null;
 openModal('Pradinis importas iš Excel',`<p class="sub">Viena eilutė – vienas gyventojo kontaktas. Pirmoje eilutėje turi būti stulpelių pavadinimai. Iki 5 000 eilučių ir 5 MB.</p><button class="btn small" id="downloadTemplate">Atsisiųsti Excel šabloną</button><div class="import-drop" style="margin-top:15px"><label for="excelFile"><strong>Pasirinkite .xlsx arba .xls failą</strong></label><input type="file" id="excelFile" accept=".xlsx,.xls"></div><div class="field" id="sheetField" hidden><label for="sheetSelect">Darbalapis</label><select id="sheetSelect"></select></div><div id="importPreview"></div>`,`<button class="btn" data-close>Atšaukti</button><button class="btn primary" id="doImport" disabled>Importuoti</button>`,true);
 $('#downloadTemplate').onclick=downloadTemplate;
 $('#excelFile').onchange=async e=>{
  $('#doImport').disabled=true;$('#importPreview').innerHTML='';$('#modalError').hidden=true;$('#sheetField').hidden=true;importRows=null;importWorkbook=null;
  const file=e.target.files[0];if(!file)return;
  if(!/\.(xlsx|xls)$/i.test(file.name))return showModalError('Pasirinkite Excel failą (.xlsx arba .xls).');
  if(file.size>5*1024*1024)return showModalError('Failas viršija 5 MB. Padalykite duomenis į mažesnius failus.');
  $('#importPreview').textContent='Tikrinamas failas…';
  try{importWorkbook=XLSX.read(await file.arrayBuffer(),{type:'array',cellFormula:false,cellHTML:false,sheetRows:5002});if(!$('#modal').classList.contains('open'))return;$('#sheetSelect').innerHTML=importWorkbook.SheetNames.map(n=>`<option>${esc(n)}</option>`).join('');$('#sheetField').hidden=importWorkbook.SheetNames.length<=1;inspectSheet()}catch(e){$('#importPreview').textContent='';showModalError('Nepavyko perskaityti Excel failo. Patikrinkite, ar jis nėra sugadintas arba apsaugotas slaptažodžiu.')}
 };
 $('#sheetSelect').onchange=inspectSheet;
 $('#doImport').onclick=()=>{if(!importRows||!importPlan||importPlan.errors.length)return;action('import',{rows:importRows},r=>toast(`Importuota: ${r.newHouses} nauji objektai, ${r.newContacts} nauji kontaktai. Praleista dublikatų: ${r.skipped}.`))};
}
function inspectSheet(){
 $('#doImport').disabled=true;$('#modalError').hidden=true;
 try{importRows=XLSX.utils.sheet_to_json(importWorkbook.Sheets[$('#sheetSelect').value],{header:1,raw:false,defval:'',blankrows:true});importPlan=planImport(importRows,data.houses);
 $('#importPreview').innerHTML=`<div class="import-metrics"><div><strong>${importPlan.rows}</strong><span class="sub">duomenų eilučių</span></div><div><strong>${importPlan.newHouses}</strong><span class="sub">nauji objektai</span></div><div><strong>${importPlan.newContacts}</strong><span class="sub">nauji kontaktai</span></div><div><strong>${importPlan.skipped}</strong><span class="sub">dublikatai praleidžiami</span></div></div>${importPlan.errors.length?`<div class="error-box"><strong>${importPlan.errors.length} klaidingos eilutės. Importas neatliekamas, kol jos nepataisytos.</strong><ul class="import-errors">${importPlan.errors.slice(0,50).map(e=>`<li>Eilutė ${e.row}: ${esc(e.message)}</li>`).join('')}</ul>${importPlan.errors.length>50?'Rodomos pirmos 50 klaidų.':''}</div>`:`<div class="info-box">${importPlan.newContacts?'Struktūra patikrinta. Nauji įrašai bus pridėti; esami nebus perrašyti.':'Naujų įrašų nėra. Visi kontaktai jau egzistuoja.'}</div>`}${importPlan.preview.length?`<h4>Pirmų ${Math.min(10,importPlan.preview.length)} naujų kontaktų peržiūra</h4>${recipientTable(importPlan.preview.slice(0,10))}`:''}`;
 $('#doImport').disabled=!!importPlan.errors.length||!importPlan.newContacts;
 }catch(e){$('#importPreview').textContent='';showModalError(e.message)}
}
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5500)}
$$('.nav-btn').forEach(b=>b.onclick=()=>{if(data)setView(b.dataset.view)});$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$('#roleSwitch').onchange=async e=>{if(busy)return;previewUser=e.target.value;selectedHouses.clear();excludedRecipients.clear();selectedHouse=null;$('#houseSearch').value='';$('#recipientSearch').value='';$('#historySearch').value='';await loadState()};
$('#refreshBtn').onclick=()=>loadState();$('#houseSearch').oninput=()=>data&&renderHouses();$('#cityFilter').onchange=()=>data&&renderHouses();$('#recipientSearch').oninput=()=>data&&renderChecks();$('#contactFilter').onchange=updateCompose;
$('#deselectAllRecipients').onclick=()=>{if(!data)return;filteredRecipients().filter(eligible).forEach(r=>excludedRecipients.add(String(r.id)));updateCompose()};
$('#selectAllRecipients').onclick=()=>{if(!data)return;filteredRecipients().filter(eligible).forEach(r=>excludedRecipients.delete(String(r.id)));updateCompose()};
$('#channels').onclick=e=>{const b=e.target.closest('.channel');if(!b)return;selectedChannel=b.dataset.channel;$$('.channel').forEach(x=>x.classList.toggle('active',x===b));updateCompose()};
for(const id of ['messageText','emailText','subject'])$('#'+id).oninput=updateCompose;
$('#reviewBtn').onclick=openReview;$('#historySearch').oninput=()=>data&&renderHistory();$('#historyChannel').onchange=()=>data&&renderHistory();$('#addHouseBtn').onclick=()=>openHouse();$('#importBtn').onclick=openImport;$('#addUserBtn').onclick=()=>openUser();
$('#modal').onclick=e=>{if(e.target===$('#modal'))closeModal()};$$('#modal .close').forEach(b=>b.onclick=closeModal);
// The dialog keeps focus within its controls until closed.
document.addEventListener('keydown',e=>{if(!$('#modal').classList.contains('open'))return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const nodes=$$('#modal button:not(:disabled), #modal input:not(:disabled), #modal select:not(:disabled), #modal textarea:not(:disabled)').filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}});
loadState();

if(document.modelContext?.registerTool){
 document.modelContext.registerTool({name:'prepare_resident_message',title:'Paruošti pranešimą',description:'Atidaro pranešimo ruošimą ir užpildo SMS tekstą. Nesiunčia pranešimų.',inputSchema:{type:'object',properties:{message:{type:'string'}},required:['message'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute({message}){if(!data)throw new Error('Duomenys dar neįkelti.');if(typeof message!=='string'||!message.trim())throw new Error('Pranešimo tekstas privalomas');setView('compose');selectedChannel='sms';$$('.channel').forEach(x=>x.classList.toggle('active',x.dataset.channel==='sms'));$('#messageText').value=message.slice(0,500);updateCompose();return {status:'prepared',characters:$('#messageText').value.length}}})?.catch?.(()=>{});
 document.modelContext.registerTool({name:'search_managed_objects',title:'Ieškoti objektų',description:'Ieško naudotojui prieinamų objektų pagal gatvę arba namo numerį.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute({query}){if(!data)throw new Error('Duomenys dar neįkelti.');if(typeof query!=='string')throw new Error('Paieškos tekstas privalomas');return data.houses.filter(h=>address(h).toLowerCase().includes(query.toLowerCase())).map(h=>({id:h.id,address:address(h),city:h.city,contacts:h.residents.length}))}})?.catch?.(()=>{});
}
