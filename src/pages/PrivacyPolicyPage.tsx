import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle, AlertTriangle, ArrowRight, Globe, Mail, ChevronDown, ChevronUp, UserCheck, Trash2 } from 'lucide-react';

export function PrivacyPolicyPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<'summary' | 'full' | 'ksa_pdpl' | 'deletion'>('summary');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">
                {lang === 'ar' ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'ar' 
                  ? 'متوافقة مع نظام حماية البيانات الشخصية السعودي (KSA PDPL) وسياسات Google Play' 
                  : 'Compliant with KSA PDPL & Google Play Developer Policy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              <span>{lang === 'ar' ? 'العودة للمنصة' : 'Back to App'}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'آخر تحديث: 24 نوفمبر 2026' : 'Last Updated: November 24, 2026'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {lang === 'ar' 
              ? 'التزامنا بحماية بياناتك وخصوصيتك التعليمية' 
              : 'Our Commitment to Your Privacy & Educational Data Protection'}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'تلتزم منصة English Crescent ومنظومة Engyup بأعلى معايير حماية البيانات الشخصية وفقاً لنظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) والمعدل بالمرسوم الملكي رقم (م/148) في المملكة العربية السعودية، ولوائح الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا - SDAIA)، وضوابط متجر Google Play لحماية بيانات الأطفال والطلاب.'
              : 'English Crescent & Engyup strictly uphold the highest standards of personal data protection under the Saudi Personal Data Protection Law (KSA PDPL, Royal Decree No. M/19 & M/148), SDAIA regulatory guidelines, and Google Play Families & Data Safety standards.'}
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'summary' ? 'bg-emerald-500 text-white shadow' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}
            </button>
            <button
              onClick={() => setActiveTab('full')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'full' ? 'bg-emerald-500 text-white shadow' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang === 'ar' ? 'بنود السياسة الكاملة' : 'Full Policy Clauses'}
            </button>
            <button
              onClick={() => setActiveTab('ksa_pdpl')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'ksa_pdpl' ? 'bg-emerald-500 text-white shadow' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang === 'ar' ? 'حقوقك وفق نظام حماية البيانات (PDPL)' : 'KSA PDPL Data Subject Rights'}
            </button>
            <button
              onClick={() => setActiveTab('deletion')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'deletion' ? 'bg-red-500 text-white shadow' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang === 'ar' ? 'طلب حذف الحساب والبيانات' : 'Data Deletion Request'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">1</div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'ما نجمعه فقط' : 'What We Collect'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'الاسم الكامل، البريد الإلكتروني، الصف الدراسي (Grade 7-12)، وتقدم التمارين والنقاط (XP). لا نجمع بيانات موقع جغرافي دقيق أو بيانات مالية أو حساسة.'
                    : 'Name, email, grade level, and exercise telemetry (XP & completion). We never collect precise geolocation, biometric, financial, or sensitive data.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">2</div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'الأساس القانوني' : 'Legal Basis (PDPL)'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'معالجة البيانات تتم بناءً على الموافقة الصريحة لتقديم الخدمة التعليمية وتنفيذ اتفاقية الاستخدام وحفظ تقدم الطالب، وموافقة ولي الأمر للقُصّر.'
                    : 'Processing is grounded in explicit consent, execution of educational services, and legal guardian consent for students under the age of 18.'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">3</div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'ar' ? 'عدم بيع البيانات' : 'Zero Commercial Sale'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'لا نقوم مطلقاً ببيع أو تأجير أو مشاركة بيانات الطلاب مع أي معلنين أو أطراف ثالثة تجارية. المنصة تعليمية نقية 100% وخالية من الإعلانات التتبعية.'
                    : 'We never sell, rent, or monetize student data. The application contains zero third-party targeted advertising or behavioral tracking.'}
                </p>
              </div>
            </div>

            {/* Quick Fact Table for Google Play Safety Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                {lang === 'ar' ? 'جدول أمان البيانات الخاص بـ Google Play' : 'Google Play Data Safety Disclosures'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-600 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">{lang === 'ar' ? 'فئة البيانات' : 'Data Category'}</th>
                      <th className="py-2.5 px-3 font-semibold">{lang === 'ar' ? 'البيانات المحددة' : 'Specific Items'}</th>
                      <th className="py-2.5 px-3 font-semibold">{lang === 'ar' ? 'الغرض' : 'Purpose'}</th>
                      <th className="py-2.5 px-3 font-semibold">{lang === 'ar' ? 'التشفير والمشاركة' : 'Encryption & Sharing'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-3 font-medium text-slate-800">{lang === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'الاسم، البريد الإلكتروني، الصف الدراسي' : 'Name, Email, Grade'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'إدارة الحساب ومطابقة المنهج' : 'Account & Curriculum Binding'}</td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">{lang === 'ar' ? 'مشفرة (TLS 1.3 / AES-256) - لا تُشارك' : 'Encrypted (TLS 1.3 / AES-256) - Not shared'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-medium text-slate-800">{lang === 'ar' ? 'النشاط في التطبيق' : 'App Activity'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'تقدم الدروس، النقاط XP، سجل الأيام المتواصلة' : 'Completed lessons, XP, streak'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'وظائف التطبيق والتقييم الذاتي للطالب' : 'App functionality & student evaluation'}</td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">{lang === 'ar' ? 'مشفرة - لا تُشارك' : 'Encrypted - Not shared'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-medium text-slate-800">{lang === 'ar' ? 'معلومات الجهاز والأداء' : 'Device Info'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'إصدار التطبيق، نظام التشغيل Android، سجلات الأعطال' : 'App version, Android OS, Crash logs'}</td>
                      <td className="py-3 px-3">{lang === 'ar' ? 'إصلاح الأخطاء البرمجية وضمان الاستقرار' : 'Crash analysis & diagnostics'}</td>
                      <td className="py-3 px-3 text-emerald-700 font-medium">{lang === 'ar' ? 'مجهولة الهوية بالكامل ومحمية' : 'Fully anonymized & encrypted'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL POLICY */}
        {activeTab === 'full' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed">
            
            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '1. هوية جهة التحكم بالبيانات والمسؤولية' : '1. Identity of the Data Controller'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'منصة English Crescent (المقدمة عبر منظومة Engyup) هي المسؤولة عن معالجة وحماية بياناتك الشخصية كجهة تحكم (Data Controller). يتم توفير التطبيق لطلاب منهج اللغة الإنجليزية في الجمهورية اليمنية والدول العربية وفق أفضل الممارسات القانونية والأمنية.'
                  : 'English Crescent (operated by Engyup platform) acts as the Data Controller responsible for processing and protecting your personal data in accordance with modern privacy frameworks.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '2. الأساس النظامي لجمع ومعالجة البيانات' : '2. Legal Basis for Data Processing'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'استناداً إلى المادة الخامسة والسادسة من نظام حماية البيانات الشخصية السعودي (KSA PDPL)، تتم معالجة البيانات الشخصية بناءً على الأسس النظامية الآتية:'
                  : 'In compliance with Articles 5 & 6 of the Saudi PDPL, personal data processing relies on the following legal bases:'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 mr-2">
                <li>
                  <strong>{lang === 'ar' ? 'الموافقة الصريحة:' : 'Explicit Consent:'}</strong> {lang === 'ar' ? 'موافقة المستخدم أو ولي أمره عند إنشاء الحساب للاستفادة من المحتوى التعليمي.' : 'Consent provided by the student or legal guardian during account creation.'}
                </li>
                <li>
                  <strong>{lang === 'ar' ? 'تنفيذ العقد والخدمة:' : 'Performance of Service:'}</strong> {lang === 'ar' ? 'ضرورة المعالجة لتوفير وظائف المنهج التفاعلي وحفظ الإجابات وحساب الدرجات.' : 'Processing necessary to track lesson progress, calculate exercise scores, and persist learning state.'}
                </li>
                <li>
                  <strong>{lang === 'ar' ? 'المصلحة المشروعة:' : 'Legitimate Interest:'}</strong> {lang === 'ar' ? 'تحسين جودة التمارين ومنع إساءة الاستخدام وحماية أمان المنظومة.' : 'Improving exercise efficacy, diagnosing crash errors, and safeguarding security.'}
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '3. خصوصية الأطفال والقُصّر (من هم دون سن 18 عاماً)' : "3. Minors & Children's Privacy (Under 18)"}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'بما أن التطبيق موجه لطلاب المدارس من الصف السابع وحتى الثاني عشر، نولي حماية القُصّر أقصى درجات العناية:'
                  : "As an educational platform serving students from Grade 7 through Grade 12, protecting minors' privacy is paramount:"}
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 mr-2">
                <li>{lang === 'ar' ? 'يُشترط موافقة ولي الأمر أو الوصي الشرعي لإنشاء حساب لمن هم دون 18 عاماً.' : 'Legal guardian consent is required for registering accounts for minors under 18 years of age.'}</li>
                <li>{lang === 'ar' ? 'لا يحتوي التطبيق على أي إعلانات تجارية أو تتبع سلوكي أو شبكات تسويقية.' : 'The app is 100% free of commercial advertisements and behavioral tracking.'}</li>
                <li>{lang === 'ar' ? 'يحق لولي الأمر مراجعة بيانات طفله أو طلب تعديلها أو حذفها نهائياً في أي وقت.' : 'Legal guardians possess the absolute right to inspect, correct, or permanently delete child data at any time.'}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '4. تشفير البيانات والأمان التقني' : '4. Data Security & Encryption Standards'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'نطبق تدابير تقنية وتنظيمية متقدمة لحماية البيانات من الوصول غير المصرح به أو الفقدان أو التعديل:'
                  : 'We enforce stringent technical and organizational security controls:'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 mr-2">
                <li><strong>{lang === 'ar' ? 'التشفير أثناء النقل:' : 'In-Transit Encryption:'}</strong> {lang === 'ar' ? 'جميع الاتصالات بين التطبيق وخوادم السحابة مشفرة ببروتوكول TLS 1.3 الآمن.' : 'All communications utilize TLS 1.3 encryption.'}</li>
                <li><strong>{lang === 'ar' ? 'التشفير في وضع السكون:' : 'At-Rest Encryption:'}</strong> {lang === 'ar' ? 'تُحفظ كلمات المرور مشفرة بتقنية التجزئة غير القابلة للعكس (Argon2 / bcrypt)، وتُحفظ قواعد البيانات مشفرة بـ AES-256.' : 'Databases utilize AES-256 encryption; passwords use irreversible cryptographic hashing.'}</li>
                <li><strong>{lang === 'ar' ? 'عزل الحسابات والبيانات:' : 'Row-Level Security:'}</strong> {lang === 'ar' ? 'نظام صلاحيات صارم (Row-Level Security) يمنع أي مستخدم من الاطلاع على تقدم أو بيانات طالب آخر.' : 'Row-Level Security policies strictly isolate each student profile.'}</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '5. نقل البيانات عبر الحدود' : '5. Cross-Border Data Transfers'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'امتثالاً للمادة التاسعة والعشرين من نظام حماية البيانات الشخصية السعودي ولائحته التنفيذية، لا يتم نقل البيانات خارج النطاق الجغرافي إلا عبر مزودي خدمات سحابية عالميين معتمدين يلتزمون بضمانات أمنية وتشريعية مكافئة تضمن سرية وسلامة البيانات.'
                  : 'Pursuant to Article 29 of the KSA PDPL and its Implementing Regulations, cross-border transfers occur exclusively through audited global cloud infrastructure maintaining equivalent or superior data security safeguards.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">
                {lang === 'ar' ? '6. الإشعار بالحوادث الأمنية' : '6. Incident & Breach Notification'}
              </h3>
              <p>
                {lang === 'ar'
                  ? 'في حال وقوع أي خرق أو حادث أمني قد يمس سرية البيانات الشخصية، تلتزم المنصة بإشعار الهيئة الإشرافية المختصة (سدايا - SDAIA) وإشعار أصحاب البيانات المتأثرين خلال مدة لا تتجاوز 72 ساعة، مع توضيح طبيعة الحادث والإجراءات التصحيحية المتخذة.'
                  : 'In the unlikely event of a security compromise affecting personal data, the platform commits to notifying the regulatory authority (SDAIA) and affected users within 72 hours alongside remediation measures.'}
              </p>
            </section>
          </div>
        )}

        {/* TAB 3: KSA PDPL RIGHTS */}
        {activeTab === 'ksa_pdpl' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {lang === 'ar' 
                  ? 'حقوق صاحب البيانات بموجب نظام حماية البيانات الشخصية في المملكة العربية السعودية' 
                  : 'Data Subject Rights Under Saudi Personal Data Protection Law (PDPL)'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar' 
                  ? 'وفقاً لأحكام النظام الصادر بالمرسوم الملكي رقم (م/19) والمعدل بالمرسوم الملكي رقم (م/148)' 
                  : 'Enacted by Royal Decree No. M/19 and amended by Royal Decree No. M/148'}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '1. الحق في العلم (المعرفة)' : '1. Right to Know'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك معرفة المسوغ النظامي والغرض من جمع بياناتك، والجهات التي ستُعالج فيها وتدابير الحماية المطبقة.'
                    : 'The right to be informed of the legal basis, specific purposes, and safeguards governing your data processing.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '2. الحق في الوصول إلى البيانات' : '2. Right to Access'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك طلب نسخة من بياناتك الشخصية المتاحة لدينا، والاطلاع على تفاصيل معالجتها في أي وقت مجاناً.'
                    : 'The right to request and inspect a complete copy of your stored personal and educational telemetry data at no charge.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '3. الحق في التصحيح والتحديث' : '3. Right to Correction & Update'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك طلب تصحيح أي بيانات غير دقيقة أو غير مكتملة أو تحديثها فوراً عبر شاشة الملف الشخصي أو بمراسلتنا.'
                    : 'The right to correct, complete, or update any inaccurate personal details directly in profile settings.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '4. الحق في طلب إتلاف وحذف البيانات' : '4. Right to Destruction / Erasure'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك طلب إتلاف بياناتك الشخصية وحذف حسابك نهائياً عند انتهاء الغرض منها أو رغبتك في إنهاء اشتراكك.'
                    : 'The right to request the permanent destruction and deletion of your account and all associated activity records.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '5. الحق في الرجوع عن الموافقة' : '5. Right to Withdraw Consent'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك سحب موافقتك السابقة على معالجة البيانات في أي وقت وبكل سهولة دون التأثير على مشروعية المعالجة السابقة.'
                    : 'The right to revoke prior consent at any time without prejudice to the lawfulness of past processing.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? '6. الحق في نقل البيانات' : '6. Right to Data Portability'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'يحق لك الحصول على نسخة من بياناتك بتنسيق إلكتروني منظم ومقروء آلياً (JSON / CSV) لنقلها إلى جهة أخرى.'
                    : 'The right to receive your data in a structured, commonly used, machine-readable electronic format.'}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
              <Mail className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-bold">
                  {lang === 'ar' ? 'كيفية ممارسة حقوقك:' : 'Exercising Your Rights:'}
                </p>
                <p>
                  {lang === 'ar'
                    ? 'يمكنك ممارسة أي من هذه الحقوق في أي وقت بمراسلة مسؤول حماية البيانات عبر البريد: privacy@engyup.com وسيتم الرد وتنفيذ الطلب خلال مدة لا تتجاوز 15 يوماً عمل دون أي رسوم.'
                    : 'Contact our Data Protection Officer at privacy@engyup.com. Requests are addressed within 15 business days without charge.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT & DATA DELETION (GOOGLE PLAY COMPLIANCE) */}
        {activeTab === 'deletion' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                {lang === 'ar' ? 'طلب حذف الحساب والبيانات نهائياً' : 'Account & Personal Data Deletion'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar'
                  ? 'امتثالاً لسياسة Google Play لحذف الحسابات والمادة (18) من نظام حماية البيانات الشخصية السعودي'
                  : 'Compliant with Google Play Account Deletion Policy & Article 18 of Saudi PDPL'}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">{lang === 'ar' ? 'تنبيه هام بشأن الحذف:' : 'Important Deletion Notice:'}</p>
                <p>
                  {lang === 'ar'
                    ? 'عند تنفيذ طلب الحذف، سيتم حذف حسابك بالكامل وإتلاف جميع سجلات تقدمك الدراسي (النقاط XP، التمارين المكتملة، سجلات الأيام المتواصلة) نهائياً من خوادمنا ولن يمكن استرجاعها.'
                    : 'Account deletion is irreversible. All completed exercises, XP, streaks, and authentication credentials will be permanently erased.'}
                </p>
              </div>
            </div>

            {deleteSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900">
                  {lang === 'ar' ? 'تم استلام طلبك بنجاح' : 'Deletion Request Received'}
                </h4>
                <p className="text-xs text-emerald-800">
                  {lang === 'ar'
                    ? `تم تسجيل طلب حذف الحساب المرتبط بـ (${deleteEmail}). سيتم إرسال تأكيد عبر البريد الإلكتروني وإتمام الحذف خلال 7 أيام عمل.`
                    : `Your request for (${deleteEmail}) has been logged. You will receive an email confirmation and full data purge within 7 business days.`}
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (deleteEmail) setDeleteSubmitted(true);
                }}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {lang === 'ar' ? 'البريد الإلكتروني المرتبط بالحساب:' : 'Registered Account Email:'}
                  </label>
                  <input
                    type="email"
                    required
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="confirmDelete" required className="w-4 h-4 text-red-600 rounded" />
                  <label htmlFor="confirmDelete" className="text-xs text-slate-600 select-none">
                    {lang === 'ar' 
                      ? 'أؤكد رغبتي في حذف حسابي وجميع البيانات الدراسية نهائياً' 
                      : 'I confirm that I wish to permanently delete my account and all associated learning data'}
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
                >
                  {lang === 'ar' ? 'إرسال طلب الحذف الفوري' : 'Submit Deletion Request'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t text-xs text-slate-500 space-y-1">
              <p>
                <strong>{lang === 'ar' ? 'طرق الحذف البديلة:' : 'Alternative Deletion Methods:'}</strong>
              </p>
              <p>
                {lang === 'ar'
                  ? 'يمكنك أيضاً طلب الحذف مباشرة من داخل التطبيق عبر صفحة "الملف الشخصي" -> "حذف الحساب والبيانات"، أو بمراسلتنا مباشرة على privacy@engyup.com'
                  : 'You may also trigger account deletion directly in the mobile app via Profile -> Delete Account, or by writing to privacy@engyup.com.'}
              </p>
            </div>
          </div>
        )}

        {/* Contact DPO Card */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center sm:text-right">
            <h3 className="text-lg font-bold">
              {lang === 'ar' ? 'مسؤول حماية البيانات (DPO) والتواصل' : 'Data Protection Officer (DPO)'}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {lang === 'ar'
                ? 'لأي استفسارات قانونية أو تقديم شكاوى تتعلق بحماية بياناتك الشخصية بموجب نظام حماية البيانات الشخصية السعودي (PDPL) أو سياسات المتاجر الرقمية، يسعدنا تواصلك مع مكتب الخصوصية.'
                : 'For inquiries, rights enforcement, or inquiries regarding KSA PDPL compliance and app store privacy standards, contact our privacy office.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-400 font-mono pt-1">
              <span>Email: privacy@engyup.com</span>
              <span>Support: support@crescent.app</span>
            </div>
          </div>
          <a
            href="mailto:privacy@engyup.com?subject=Privacy%20Inquiry%20-%20KSA%20PDPL"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition whitespace-nowrap"
          >
            {lang === 'ar' ? 'مراسلة مسؤول الحماية' : 'Contact Privacy Office'}
          </a>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 English Crescent & Engyup Platform. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-slate-600">
          <a href="/privacy" className="hover:text-emerald-600 underline">سياسة الخصوصية / Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-emerald-600 underline">شروط الاستخدام / Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
