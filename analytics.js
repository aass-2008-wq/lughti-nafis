'use strict';
let visitorAnalyticsSnapshot = null;
let visitorAnalyticsPending = false;
function visitorAnalyticsPanel() {
  return '<section class="visitor-analytics" aria-labelledby="visitors-heading"><div class="analytics-heading"><div><h2 id="visitors-heading">إحصاءات زوار الموقع</h2><p>متابعة الزيارات منذ ٨ أكتوبر ٢٠٢٦</p></div><button type="button" class="btn light" id="load-visitors">عرض الإحصاءات</button></div><div id="visitors-content" aria-live="polite"><p>تُعرض إحصاءات الزيارات هنا عند طلبها.</p></div><p class="analytics-note">الزيارات وفق احتساب خدمة الإحصاءات، وقد تتكرر للشخص نفسه. عدد الطلاب الذين أنهوا اختبارًا يظهر في تقارير الطلاب.</p></section>';
}
function visitorAnalyticsDraw() {
  const box = document.querySelector('#visitors-content');
  if (!box || !teacherSession || !visitorAnalyticsSnapshot || visitorAnalyticsSnapshot.session !== teacherSession) return;
  const data = visitorAnalyticsSnapshot.data;
  const printButton = document.querySelector('#print-visitors');
  if (printButton) printButton.disabled = false;
  const fields = [['today','زيارات اليوم'],['week','زيارات هذا الأسبوع'],['month','زيارات هذا الشهر'],['total','إجمالي الزيارات']];
  const daily = data.daily;
  const peak = Math.max(1,...daily.map(d=>d.count));
  box.innerHTML = '<div class="analytics-cards">' + fields.map(([key,label])=>'<div class="analytics-card"><span>'+label+'</span><strong>'+ar(data[key])+'</strong></div>').join('') + '</div><details class="analytics-chart"><summary>الزيارات اليومية للشهر الحالي</summary>' + (daily.length?'<div class="analytics-bars">'+daily.map(d=>'<div class="analytics-row"><span>'+esc(new Date(d.day+'T12:00:00+03:00').toLocaleDateString('ar-SA',{calendar:'gregory',month:'short',day:'numeric'}))+'</span><div class="analytics-track"><i style="width:'+Math.round(d.count/peak*100)+'%"></i></div><b>'+ar(d.count)+'</b></div>').join('')+'</div>':'<p>لا توجد زيارات مسجلة لهذا الشهر.</p>')+'</details><p class="analytics-note">آخر تحديث: '+esc(when(data.updatedAt))+' · التوقيت: الرياض · يبدأ الأسبوع يوم الأحد.</p>';
}
function visitorAnalyticsWire() {
  const button = document.querySelector('#load-visitors');
  if (!button) return;
  const printButton = document.createElement('button');
  printButton.type = 'button'; printButton.id = 'print-visitors'; printButton.className = 'btn light';
  printButton.textContent = 'طباعة تقرير الزيارات'; printButton.disabled = true;
  button.after(printButton);
  printButton.onclick = ()=>{
    if (teacherSession && visitorAnalyticsSnapshot?.session === teacherSession) printReportMarkup(visitorAnalyticsReport(visitorAnalyticsSnapshot.data));
  };
  visitorAnalyticsDraw();
  button.disabled = visitorAnalyticsPending;
  button.onclick = async function () {
    if (!teacherSession || visitorAnalyticsPending) return;
    const session = teacherSession;
    const box = document.querySelector('#visitors-content');
    visitorAnalyticsPending = true; button.disabled = true;
    box.textContent = 'جارٍ تحميل إحصاءات الزيارات…';
    try {
      const data = await rpc({action:'teacherAnalytics',session});
      if (session !== teacherSession) return;
      if (!['today','week','month','total'].every(k=>Number.isSafeInteger(data[k])&&data[k]>=0) || !Array.isArray(data.daily) || data.daily.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||!Number.isSafeInteger(d.count)||d.count<0) || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('بيانات الإحصاءات غير مكتملة.');
      visitorAnalyticsSnapshot = {session,data};
      visitorAnalyticsDraw();
    } catch (err) {
      if (session !== teacherSession || !box.isConnected) return;
      box.textContent = err.code === 'BAD_ACTION' ? 'لم يكتمل تفعيل إحصاءات الزيارات داخل اللوحة بعد. يمكنك متابعة الأرقام من زر إحصاءات زوار الموقع بالأعلى.' : err.code === 'AUTH_EXPIRED' ? 'انتهت جلسة المعلم. سجّل الخروج ثم ادخل مجددًا.' : 'تعذر تحميل إحصاءات الزيارات. '+err.message;
    } finally {
      visitorAnalyticsPending = false;
      const current = document.querySelector('#load-visitors');
      if (current) {current.disabled=false;current.textContent='تحديث الإحصاءات';}
    }
  };
}
function visitorAnalyticsReport(data) {
  const fields = [['today','زيارات اليوم'],['week','زيارات هذا الأسبوع'],['month','زيارات هذا الشهر'],['total','إجمالي الزيارات']];
  const daily = data.daily;
  const peak = Math.max(1,...daily.map(d=>d.count));
  const chart = daily.map((d,i)=>{
    const height = Math.round(d.count/peak*95);
    const x = 570-i*(550/Math.max(1,daily.length));
    return '<rect x="'+x+'" y="'+(115-height)+'" width="'+Math.min(14,400/Math.max(1,daily.length))+'" height="'+height+'" fill="#087f83"/><text x="'+(x+4)+'" y="'+(109-height)+'" text-anchor="middle" font-size="9">'+ar(d.count)+'</text><text x="'+(x+4)+'" y="132" text-anchor="middle" font-size="9">'+ar(Number(d.day.slice(8)))+'</text>';
  }).join('');
  return '<div class="report-pages"><section class="school-report"><header class="report-letterhead"><img src="'+new URL('assets/moe.svg',document.baseURI).href+'" alt="شعار وزارة التعليم"><div><p>المملكة العربية السعودية · وزارة التعليم<br>الإدارة العامة للتعليم بالقصيم<br>مدرسة الإمام الشوكاني الابتدائية بالمذنب</p><h1>تقرير زيارات الموقع</h1><p>محاكي نافس المطور · النسخة الثانية</p></div><img src="'+new URL('assets/school.webp',document.baseURI).href+'" alt="شعار المدرسة"></header><p>آخر تحديث للبيانات: '+esc(when(data.updatedAt))+' · توقيت الرياض</p><table><thead><tr><th>الفترة</th><th>الزيارات المسجلة</th></tr></thead><tbody>'+fields.map(([key,label])=>'<tr><td>'+label+'</td><td>'+ar(data[key])+'</td></tr>').join('')+'</tbody></table><h2>الزيارات اليومية للشهر الحالي</h2><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 145" style="width:100%;height:auto;direction:ltr" role="img" aria-label="رسم الزيارات اليومية"><line x1="10" y1="115" x2="595" y2="115" stroke="#aac1bf"/>'+chart+'</svg><p>الأرقام أسفل الأعمدة تمثل أيام الشهر. يبدأ الأسبوع يوم الأحد، والإجمالي منذ ٨ أكتوبر ٢٠٢٦.</p><p>الزيارات وفق احتساب خدمة الإحصاءات، وقد تتكرر للشخص نفسه؛ ولا تمثل عدد الطلاب الذين أنهوا الاختبارات.</p><div class="report-signature">إعداد الأستاذ مقرن المطيري</div></section></div>';
}
