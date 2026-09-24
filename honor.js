/* Published honors are an approved snapshot, never the student report feed. */
let honorPublic=null,honorFetched=0,honorPending=false,honorDraft=null,honorCandidates=[],honorAdminSeq=0;
function honorMedal(){return '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="m13 3 11 16L35 3M7 3h12l5 8 5-8h12L28 23h-8Z" fill="#d9b96d"/><circle cx="24" cy="30" r="14" fill="#fff5d9" stroke="#b08c3f" stroke-width="2"/><path d="m24 20 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#b08c3f"/></svg>';}
function honorCards(board){return '<div class="honor-grid">'+board.entries.map(e=>'<article class="honor-card">'+honorMedal()+'<h3>'+esc(e.name)+'</h3><p>'+esc(e.classroom)+'</p><span class="badge gold">'+(board.mode==='participation'?'مثابرة وإنجاز':'تميز وإتقان')+'</span>'+(board.showMetric?'<strong class="honor-metric">'+ar(e.metric)+(board.mode==='participation'?' اختبارًا مكتملًا':'٪')+'</strong>':'')+'</article>').join('')+'</div>';}
function honorDisplay(board){return '<section class="honor-board"><div class="eyebrow">مدرسة الإمام الشوكاني الابتدائية بالمذنب</div><h2>'+esc(board.title)+'</h2><p>'+(board.mode==='participation'?'نحتفي بمثابرتكم وإكمالكم اختبارات متنوعة.':'نحتفي بتميزكم في الفهم والقراءة.')+'</p>'+(board.examTitle?'<p class="honor-exam">'+esc(board.examTitle)+'</p>':'')+honorCards(board)+'</section>';}
function honorPage(){return title('مثابرة · تعلم · تميز','لوحة التميز','نفخر بإنجازاتكم ونحتفي بتقدمكم.')+'<div id="honor-public" aria-live="polite"><p class="hint">جارٍ تحميل لوحة التميز…</p></div>';}
async function honorLoadPublic(force=false){
 const host=$('#honor-public');if(!host)return;
 const draw=()=>{const el=$('#honor-public');if(!el)return;el.innerHTML=honorPublic?.published?honorDisplay(honorPublic):(location.hash==='#honors'?'<div class="empty"><h2>لكل اجتهاد تقدير</h2><p>تُعلن أسماء المكرّمين هنا بعد اعتمادها.</p></div>':'');};
 if(!force&&honorFetched&&Date.now()-honorFetched<60000){draw();return;}if(honorPending)return;honorPending=true;
 try{honorPublic=await rpc({action:'honorPublic'});honorFetched=Date.now();draw();}catch(e){if(e.code==='BAD_ACTION'||e.code==='HONOR_SETUP'){honorPublic={published:false};honorFetched=Date.now();draw();return;}const el=$('#honor-public');if(el)el.innerHTML=location.hash==='#honors'?'<div class="empty"><p>تعذر عرض لوحة التميز الآن.</p>'+btn('إعادة المحاولة','id="honor-retry"')+'</div>':'';if($('#honor-retry'))$('#honor-retry').onclick=()=>honorLoadPublic(true);}finally{honorPending=false;}
}
function honorAdminPage(){if(!teacherSession)return title('لوحة المعلم','إدارة لوحة التميز','')+'<a class="btn" href="#teacher">دخول المعلم</a>';return '<a class="quiz-back" href="#teacher">→ العودة إلى التقارير</a>'+title('لوحة المعلم','إدارة لوحة التميز','تميز في الاختبارات · مثابرة في المشاركة')+'<div id="honor-admin" aria-live="polite"><p>جارٍ تحميل إعدادات اللوحة…</p></div>';}
function honorReset(){honorAdminSeq++;honorDraft=null;honorCandidates=[];}
async function honorLoadAdmin(){
 if(!$('#honor-admin')||!teacherSession)return;
 const seq=++honorAdminSeq;
 try{const r=await rpc({action:'honorAdmin',session:teacherSession});if(seq!==honorAdminSeq||!$('#honor-admin'))return;honorDraft=r.board;honorCandidates=[];honorAdminDraw();}
 catch(e){if(seq!==honorAdminSeq||!$('#honor-admin'))return;$('#honor-admin').innerHTML='<div class="notice">'+(e.code==='BAD_ACTION'||e.code==='HONOR_SETUP'?'إدارة لوحة التميز قيد التجهيز.':esc(e.message))+'</div><a class="btn light" href="#teacher">العودة إلى لوحة المعلم</a>';}
}
function honorAdminDraw(){
 const b=honorDraft,host=$('#honor-admin');if(!host)return;
 host.innerHTML='<div class="honor-status"><span class="badge '+(b.published?'':'gold')+'">'+(b.published?'اللوحة منشورة':'اللوحة مخفية')+'</span><a href="#honors">عرض لوحة التميز ←</a></div><form id="honor-form"><div class="filters"><div class="field"><label for="honor-mode">نوع التكريم</label><select id="honor-mode"><option value="excellence">المتميزون في الاختبارات</option><option value="participation">الأكثر مشاركة — عدد الاختبارات</option></select></div><div class="field"><label for="honor-class">الفصل</label><select id="honor-class"><option value="">جميع الفصول</option>'+[...new Set(report.map(r=>r.classroom).concat(b.classroom||[]))].filter(Boolean).sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('')+'</select></div><div class="field"><label for="honor-exam">الاختبار</label><select id="honor-exam"><option value="">جميع الاختبارات</option>'+C.exams.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.title)+'</option>').join('')+'</select></div><div class="field"><label id="honor-min-label" for="honor-min">الحد الأدنى للنسبة</label><input id="honor-min" type="number" min="0" max="100" required value="90"></div><div class="field"><label for="honor-title">عنوان اللوحة</label><input id="honor-title" maxlength="100" required value="'+esc(b.title||'نجوم نافس')+'"></div></div><p class="hint" id="honor-rule"></p><label class="honor-check"><input type="checkbox" id="honor-metric" '+(b.showMetric?'checked':'')+'> إظهار الدرجة أو عدد الاختبارات في البطاقات</label><div class="actions">'+btn('عرض الطلاب المرشحين','type="submit"')+'</div><p id="honor-error" class="error" role="alert"></p><div id="honor-candidates"></div></form><div id="honor-current">'+(b.published?'<h2>اللوحة المنشورة حاليًا</h2>'+honorDisplay(b):'')+'</div>'+(b.published?btn('إخفاء لوحة التميز','id="honor-hide"','light'):'');
 $('#honor-mode').value=b.mode||'excellence';$('#honor-class').value=b.classroom||'';$('#honor-exam').value=b.examId||'';$('#honor-min').value=b.min??90;
 const adjust=()=>{const participation=$('#honor-mode').value==='participation';$('#honor-min-label').textContent=participation?'الحد الأدنى للاختبارات المكتملة':'الحد الأدنى للنسبة';$('#honor-min').min=participation?1:0;$('#honor-min').max=participation?1000:100;$('#honor-rule').textContent=participation?'يحتسب كل اختبار مختلف مرة واحدة بعد تسليمه؛ لا تحتسب الزيارات أو إعادة الاختبار.':($('#honor-exam').value?'تحتسب نتيجة المحاولة الأولى المسلّمة لكل طالب في الاختبار المختار.':'يحتسب متوسط نسب المحاولات الأولى للاختبارات المختلفة المكتملة لكل طالب؛ لا تحتسب إعادة الاختبار.');};adjust();
 ['honor-mode','honor-class','honor-exam','honor-min'].forEach(id=>$('#'+id).onchange=()=>{honorAdminSeq++;honorCandidates=[];$('#honor-candidates').innerHTML='';if(id==='honor-mode'){$('#honor-min').value=$('#honor-mode').value==='participation'?1:90;$('#honor-exam').value='';}adjust();});
 $('#honor-form').onsubmit=honorFindCandidates;if($('#honor-hide'))$('#honor-hide').onclick=honorConfirmHide;
}
function honorSettings(){return {mode:$('#honor-mode').value,classroom:$('#honor-class').value,examId:$('#honor-exam').value,min:Number($('#honor-min').value)};}
async function honorFindCandidates(event){
 event.preventDefault();const seq=++honorAdminSeq,settings=honorSettings(),button=$('#honor-form button[type=submit]');$('#honor-error').textContent='';
 button.disabled=true;$('#honor-candidates').innerHTML='';honorCandidates=[];
 try{const r=await rpc({action:'honorCandidates',session:teacherSession,...settings});if(seq!==honorAdminSeq||!$('#honor-candidates'))return;honorCandidates=r.candidates;honorDrawCandidates(settings);}
 catch(e){if(seq===honorAdminSeq&&$('#honor-error'))$('#honor-error').textContent=e.message;}finally{button.disabled=false;}
}
function honorDrawCandidates(settings){
 const selected=new Map((honorDraft.entries||[]).map(e=>[String(e.studentId),e]));
 $('#honor-candidates').innerHTML=honorCandidates.length?'<div class="section-head"><h2>الطلاب المرشحون · '+ar(honorCandidates.length)+'</h2></div><p class="hint">الأسماء المحددة ستظهر لجميع زوار الموقع بعد النشر.</p><label class="honor-check"><input type="checkbox" id="honor-select-all"> تحديد الجميع (حتى ٦٠ طالبًا)</label><div class="honor-candidate-list">'+honorCandidates.map((s,i)=>'<div class="honor-candidate"><label class="honor-check"><input type="checkbox" data-honor-select="'+i+'" '+(selected.has(String(s.studentId))?'checked':'')+'><span><strong>'+esc(s.name)+'</strong><small>'+esc(s.classroom)+' · <bdi>'+esc(s.studentId)+'</bdi></small></span></label><div class="field"><label for="honor-name-'+i+'">الاسم المعروض</label><input id="honor-name-'+i+'" maxlength="120" value="'+esc(selected.get(String(s.studentId))?.name||s.name)+'"></div><span class="badge">'+ar(settings.mode==='participation'?s.count:s.percent)+(settings.mode==='participation'?' اختبارًا':'٪')+'</span></div>').join('')+'</div><div class="actions">'+btn('معاينة قبل النشر','id="honor-preview" type="button"')+'</div>':'<div class="empty">لا توجد نتائج تستوفي الشروط المختارة.</div>';
 if($('#honor-select-all'))$('#honor-select-all').onchange=e=>document.querySelectorAll('[data-honor-select]').forEach((c,i)=>c.checked=e.target.checked&&i<60);
 if($('#honor-preview'))$('#honor-preview').onclick=()=>honorPreview(settings);
}
function honorPreview(settings){
 const selected=[...document.querySelectorAll('[data-honor-select]:checked')].map(c=>{const i=Number(c.dataset.honorSelect),s=honorCandidates[i];return {...s,name:$('#honor-name-'+i).value.trim()};});
 const name=$('#honor-title').value.trim();if(!name||!selected.length||selected.length>60||selected.some(s=>!s.name)){$('#honor-error').textContent='أدخل عنوانًا وأسماء العرض، واختر من طالب واحد إلى ٦٠ طالبًا.';return;}
 const payload={action:'honorPublish',session:teacherSession,revision:honorDraft.revision,...settings,title:name,showMetric:$('#honor-metric').checked,selected:selected.map(s=>({studentId:String(s.studentId),name:s.name}))};
 const preview={...payload,examTitle:C.exams.find(e=>e.id===settings.examId)?.title||(settings.mode==='excellence'?'متوسط الاختبارات المكتملة':''),entries:selected.map(s=>({...s,metric:settings.mode==='participation'?s.count:s.percent}))};
 openDialog('<h2>معاينة لوحة التميز</h2>'+honorDisplay(preview)+'<p>ستظهر هذه الأسماء لجميع زوار الموقع.</p><p id="honor-publish-error" class="error" role="alert"></p><div class="actions">'+btn('اعتماد ونشر','id="honor-publish"')+btn('العودة للتعديل','id="honor-cancel"','light')+'</div>');
 $('#honor-cancel').onclick=()=>dialog.close();$('#honor-publish').onclick=()=>honorSave(payload,'honor-publish');
}
async function honorSave(payload,buttonId){
 const button=$('#'+buttonId);button.disabled=true;
 try{const r=await rpc(payload);honorDraft=r.board;honorFetched=0;honorPublic=null;dialog.close();if($('#honor-admin'))honorAdminDraw();notify(r.board.published?'تم نشر لوحة التميز.':'تم إخفاء لوحة التميز.');}
 catch(e){if($('#honor-publish-error'))$('#honor-publish-error').textContent=e.message;button.disabled=false;}
}
function honorConfirmHide(){openDialog('<h2>إخفاء لوحة التميز؟</h2><p>ستُخفى الأسماء عن الزوار دون حذف النتائج.</p><p id="honor-publish-error" class="error" role="alert"></p>'+btn('تأكيد الإخفاء','id="honor-hide-confirm"'));$('#honor-hide-confirm').onclick=()=>honorSave({action:'honorHide',session:teacherSession,revision:honorDraft.revision},'honor-hide-confirm');}
function honorWire(){if($('#honor-public'))honorLoadPublic();if($('#honor-admin'))honorLoadAdmin();}
