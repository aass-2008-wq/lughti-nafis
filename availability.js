'use strict';
let examAvailability=null,availabilityLoadedAt=0,availabilityPending=null,availabilityAdminSequence=0;
function examIsClosed(id){return examAvailability?.mode==='selected'&&!examAvailability.enabledExamIds.includes(id);}
function availabilityPaint(){
 document.querySelectorAll('[data-start]').forEach(b=>{
  const id=b.dataset.start,closed=examIsClosed(id),saved=savedAttempt(id);
  if(closed&&!saved){b.disabled=true;b.textContent='غير متاح حاليًا';b.dataset.closed='true';}
  else if(saved){b.disabled=false;b.textContent='استكمل المحاولة';delete b.dataset.closed;}
  else if(b.dataset.closed){delete b.dataset.closed;b.disabled=false;b.textContent='ابدأ الاختبار';}
 });
 document.querySelectorAll('[data-availability-exam]').forEach(card=>{
  const closed=examIsClosed(card.dataset.availabilityExam);
  card.classList.toggle('exam-closed',closed);
  const label=card.querySelector('.availability-label');if(label){label.hidden=!closed;label.textContent='غير متاح حاليًا';}
 });
}
async function refreshAvailability(force=false){
 if(!force&&examAvailability&&Date.now()-availabilityLoadedAt<15000){availabilityPaint();return;}
 if(availabilityPending)return availabilityPending;
 availabilityPending=(async()=>{try{const r=await rpc({action:'availabilityPublic'});examAvailability=r;availabilityLoadedAt=Date.now();}catch(e){/* يبقى قرار بدء المحاولة لدى الخادم؛ يدعم هذا التدرج في نشر التحديث. */}finally{availabilityPaint();availabilityPending=null;}})();return availabilityPending;
}
function availabilityPage(){
 if(!teacherSession)return teacher();
 return title('لوحة المعلم','إدارة إتاحة الاختبارات','')+'<a href="#teacher">العودة إلى النتائج</a><section class="report-tools"><div id="availability-editor" aria-live="polite">جارٍ تحميل الاختبارات…</div></section>';
}
async function loadAvailabilityEditor(){
 const host=$('#availability-editor');if(!host)return;const seq=++availabilityAdminSequence,session=teacherSession;
 try{
  const r=await rpc({action:'availabilityAdmin',session});if(!host.isConnected||seq!==availabilityAdminSequence||session!==teacherSession)return;
  let mode=r.state.mode;
  const exams=r.exams.slice().sort((a,b)=>Number(!a.id.startsWith('READ-'))-Number(!b.id.startsWith('READ-'))||a.title.localeCompare(b.title,'ar'));
  host.innerHTML='<h2>الاختبارات المتاحة للطلاب</h2><p>الإغلاق يمنع بدء محاولة جديدة. يمكن إكمال المحاولات التي بدأت مسبقًا.</p><p class="hint">تسري الإتاحة على اختبارات المحاكي المطور. روابط الاختبارات السابقة مستقلة عنه.</p><div class="actions">'+btn('فتح جميع الاختبارات','id="availability-all"','light')+btn('إغلاق الجميع واختيار اختبار','id="availability-none"','light')+'</div><p id="availability-count" role="status"></p><div class="availability-list">'+exams.map(e=>'<label class="availability-item"><input type="checkbox" value="'+esc(e.id)+'" '+(mode==='all'||r.state.enabledExamIds.includes(e.id)?'checked':'')+'><span>'+esc(e.title)+'</span></label>').join('')+'</div><p id="availability-error" class="error" role="alert"></p>'+btn('حفظ الإتاحة','id="availability-save"');
  const boxes=[...host.querySelectorAll('.availability-item input')],count=()=>$('#availability-count').textContent='المتاح: '+ar(boxes.filter(b=>b.checked).length)+' من '+ar(boxes.length);
  boxes.forEach(b=>b.onchange=()=>{mode='selected';count();});count();
  $('#availability-all').onclick=()=>{mode='all';boxes.forEach(b=>b.checked=true);count();};
  $('#availability-none').onclick=()=>{mode='selected';boxes.forEach(b=>b.checked=false);count();};
  $('#availability-save').onclick=async()=>{
   const ids=boxes.filter(b=>b.checked).map(b=>b.value),controls=[...host.querySelectorAll('button,input')];controls.forEach(c=>c.disabled=true);$('#availability-error').textContent='';
   try{const result=await rpc({action:'availabilitySave',session,revision:r.state.revision,mode,enabledExamIds:ids});if(session!==teacherSession)return;examAvailability=result.state;availabilityLoadedAt=Date.now();notify('تم حفظ إتاحة الاختبارات.');await loadAvailabilityEditor();}
   catch(e){if(host.isConnected){$('#availability-error').textContent=e.code==='AVAILABILITY_CONFLICT'?e.message:e.message;controls.forEach(c=>c.disabled=false);if(e.code==='AVAILABILITY_CONFLICT'){const retry=document.createElement('button');retry.className='btn light';retry.textContent='إعادة تحميل الإتاحة';retry.onclick=loadAvailabilityEditor;host.append(retry);$('#availability-save').disabled=true;}}}
  };
 }catch(e){if(host.isConnected&&session===teacherSession)host.innerHTML='<p class="error">'+esc(e.code==='BAD_ACTION'?'يلزم تحديث خدمة الموقع لتفعيل إدارة الإتاحة.':e.message)+'</p>'+btn('إعادة المحاولة','id="availability-retry"');if($('#availability-retry'))$('#availability-retry').onclick=loadAvailabilityEditor;}
}
function availabilityWire(){
 if($('#availability-editor'))loadAvailabilityEditor();
 else if(['exams','readings','skills','read','home'].includes((location.hash||'#home').slice(1).split('/')[0]))refreshAvailability();
}
