'use strict';
function resultManagement(){
 if(!teacherSession)return;
 const host=$('#report-body'),section=document.createElement('section');section.className='report-tools';
 const students=[...new Map(report.map(r=>[r.studentId,r])).values()].sort((a,b)=>a.name.localeCompare(b.name,'ar'));
 section.innerHTML='<h2>إدارة النتائج</h2><div class="field"><label for="delete-student">اختر الطالب لمسح جميع نتائجه</label><select id="delete-student"><option value="">اختر الطالب</option>'+students.map(r=>'<option value="'+esc(r.studentId)+'">'+esc(r.name)+' — '+esc(r.classroom)+' ('+esc(r.studentId)+')</option>').join('')+'</select></div><div class="actions">'+btn('مسح نتائج الطالب','id="delete-student-results" disabled','danger')+btn('مسح جميع النتائج','id="delete-all-results" '+(!report.length?'disabled':''),'danger')+'</div>';
 host.append(section);
 $('#delete-student').onchange=()=>$('#delete-student-results').disabled=!$('#delete-student').value;
 $('#delete-student-results').onclick=()=>{const id=$('#delete-student').value,r=report.find(r=>r.studentId===id);if(r)confirmResultDelete('student',id,'جميع نتائج الطالب: '+r.name+' ('+id+')');};
 $('#delete-all-results').onclick=()=>confirmResultDelete('all','','جميع نتائج الطلاب في جميع الفصول والاختبارات، وليس الاختيار المعروض فقط');
 host.querySelectorAll('[data-detail]').forEach(b=>{const r=report.find(r=>r.result.attemptId===b.dataset.detail);if(!r)return;const d=document.createElement('button');d.className='btn light';d.type='button';d.textContent='مسح الإجابة';d.onclick=()=>confirmResultDelete('attempt',r.result.attemptId,'إجابة '+r.name+' — '+(C.exams.find(e=>e.id===r.result.examId)?.title||r.result.examId)+' — المحاولة '+ar(r.result.attemptNumber));b.parentElement.append(d);});
}
let deleteDialogSeq=0;
async function confirmResultDelete(scope,target,label){
 if(!teacherSession)return;const seq=++deleteDialogSeq,session=teacherSession;
 openDialog('<h2>تأكيد مسح النتائج</h2><p>'+esc(label)+'</p><p id="delete-summary">جارٍ التحقق من النتائج…</p><p>تُزال النتائج من التقارير والترشيح، وتُخفى لوحة التميز حتى إعادة نشرها. تبقى السجلات مؤرشفة في جدول قوقل. المحاولات الجارية لا تُمسح، والنسخ المحفوظة سابقًا على أجهزة الطلاب لا تُحذف.</p><p>عند مسح محاولة فقط، قد تُحتسب المحاولة التالية بدلًا منها.</p><div class="field"><label for="delete-confirm-text">اكتب «مسح» للتأكيد</label><input id="delete-confirm-text" autocomplete="off"></div><p id="delete-error" class="error" role="alert"></p><div class="actions">'+btn('تأكيد المسح','id="delete-confirm" disabled','danger')+btn('إلغاء','id="delete-cancel"','light')+'</div>');
 $('#delete-cancel').onclick=()=>{deleteDialogSeq++;dialog.close();};
 try{
  const preview=await rpc({action:'teacherDeletePreview',session,scope,target});
  if(seq!==deleteDialogSeq||session!==teacherSession||!$('#delete-summary')||!dialog.open)return;
  $('#delete-summary').textContent='عدد المحاولات: '+ar(preview.count)+' · عدد الطلاب: '+ar(preview.students);
  const input=$('#delete-confirm-text'),button=$('#delete-confirm');input.oninput=()=>button.disabled=!preview.count||input.value.trim()!=='مسح';
  button.onclick=async()=>{
   button.disabled=true;input.disabled=true;$('#delete-cancel').disabled=true;
   try{
    const r=await rpc({action:'teacherDelete',session,scope,target,fingerprint:preview.fingerprint,confirm:input.value.trim()});
    if(session!==teacherSession)return;
    dialog.close();honorReset();$('#print-report-root')?.remove();document.body.classList.remove('printing-report');
    await loadReport();notify('تم مسح '+ar(r.deleted)+' محاولة من التقارير مع الاحتفاظ بأرشيفها.'+(r.reportsUpdated===false?' يلزم تحديث تقارير جدول قوقل.':''));
   }catch(e){if($('#delete-error'))$('#delete-error').textContent=e.code==='BAD_ACTION'?'حدّث كود قوقل ونشره لتفعيل إدارة النتائج.':e.message;}
   finally{if(button.isConnected){input.disabled=false;$('#delete-cancel').disabled=false;input.value='';}}
  };
 }catch(e){if(seq===deleteDialogSeq&&$('#delete-error'))$('#delete-error').textContent=e.code==='BAD_ACTION'?'حدّث كود قوقل ونشره لتفعيل إدارة النتائج.':e.message;}
}
