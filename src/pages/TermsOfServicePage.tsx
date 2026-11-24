import React from 'react';
import { Shield, BookOpen, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">شروط الاستخدام والخدمة التعليمية</h1>
              <p className="text-xs text-slate-500">English Crescent & Engyup Platform</p>
            </div>
          </div>
          <a
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
          >
            <span>العودة للمنصة</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            تاريخ السريان: نوفمبر 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">اتفاقية استخدام منصة English Crescent التعليمية</h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto">
            تحكم هذه الشروط استخدامك لتطبيق ومنصة English Crescent المخصصة لتدريس وممارسة منهج اللغة الإنجليزية لطلاب المرحلة الإعدادية والثانوية.
          </p>
        </div>
      </section>

      {/* Main Terms */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-sm text-slate-700 leading-relaxed">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">1. الغرض التعليمي والاستخدام المقبول</h3>
            <p>
              تم تصميم المنصة حصرياً للأغراض التعليمية ودعم تعلم اللغة الإنجليزية. يلتزم المستخدم باستخدام المنصة بما يتفق مع القوانين السارية والآداب العامة، ويُحظر أي محاولة للتلاعب بنتائج التمارين أو استخراج المحتوى بطرق غير مشروعة أو تعطيل الخوادم.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">2. الملكية الفكرية للمحتوى</h3>
            <p>
              جميع التمارين التفاعلية، والشروحات الصوتية، والقواميس، ومحركات الأنشطة، والرموز البرمجية هي حقوق ملكية فكرية محفوظة لمنصة English Crescent ومبادرة Engyup. لا يجوز نسخ أو إعادة توزيع أي جزء من المنظومة لأغراض تجارية دون إذن كتابي مسبق.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">3. حسابات الطلاب وأمان كلمة المرور</h3>
            <p>
              يتحمل المستخدم أو ولي أمره مسؤولية الحفاظ على سرية كلمة المرور. في حال الاشتباه في اختراق الحساب، يجب إبلاغ الدعم الفني فوراً. يحق للمنصة تجميد أي حساب يخالف قواعد الأمان أو النزاهة الأكاديمية.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">4. مجانية الخدمة والالتزام تجاه الطلاب</h3>
            <p>
              تلتزم المنصة بتقديم المحتوى التفاعلي الأساسي لطلاب اليمن مجاناً دون فرض رسوم على أنشطة المنهج المدرسي الأساسي، مع ضمان تجربة تعليمية نقية وخالية تماماً من الإعلانات التجارية المزعجة.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">5. إخلاء المسؤولية وحدود الضمانات</h3>
            <p>
              نبذل قصارى جهدنا لضمان دقة المحتوى واستمرارية الخدمة وتوافرها بدون انقطاع، إلا أن الخدمة تُقدم "كما هي" دون ضمانات صريحة أو ضمنية ضد الانقطاعات الطارئة أو الأعطال الشبكية الخارجة عن الإرادة.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">6. الاتصال والدعم</h3>
            <p>
              لأي استفسارات بخصوص شروط الاستخدام أو الإبلاغ عن مشكلات، يرجى التواصل عبر البريد الإلكتروني: <span className="font-mono text-emerald-700">support@crescent.app</span>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        © 2026 English Crescent & Engyup. All rights reserved.
      </footer>
    </div>
  );
}
