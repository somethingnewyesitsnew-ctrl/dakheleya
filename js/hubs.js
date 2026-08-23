/* ==========================================================================
   hubs.js — صفحات مجمّعة بتابات (تبسيط الشريط الجانبي)
   كل صفحة هنا تعيد استخدام دوال Pages.xxx الموجودة فعلاً، فقط تضعها داخل تابات
   مع شرح مبسّط تحت كل تاب — عشان أي مستخدم غير خبير مالي يفهم بسهولة
   ========================================================================== */

function tabsShell(tabs) {
    // tabs: [{ id, title, icon, desc, count }] — count (رقم اختياري) يظهر كـ badge بجانب اسم التاب
    return `
    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
        ${tabs.map((t, i) => `<li class="nav-item"><button class="nav-link ${i===0?'active':''}" id="${t.id}-tab-btn" data-bs-toggle="pill" data-bs-target="#${t.id}" type="button"><i class="bi ${t.icon} me-1"></i>${t.title}${t.count !== undefined ? ` <span class="badge-soft bg-soft-navy ms-1" style="font-size:10.5px;">${t.count}</span>` : ''}</button></li>`).join('')}
    </ul>
    <div class="tab-content">
        ${tabs.map((t, i) => `<div class="tab-pane fade ${i===0?'show active':''}" id="${t.id}">
            ${t.desc ? `<div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>${t.desc}</span></div>` : ''}
            <div id="${t.id}-content"></div>
        </div>`).join('')}
    </div>`;
}

function wireTabs(tabs, renderers) {
    // renderers[0] يُنفَّذ فوراً (التاب الافتراضي)، والباقي عند أول فتح للتاب (lazy)
    renderers[0](document.getElementById(`${tabs[0].id}-content`));
    for (let i = 1; i < tabs.length; i++) {
        document.getElementById(`${tabs[i].id}-tab-btn`).addEventListener('shown.bs.tab', () => {
            renderers[i](document.getElementById(`${tabs[i].id}-content`));
        }, { once: true });
    }
}

/* ---------------- الشراكة ---------------- */
Pages.partnership = function (container) {
    const tabs = [
        { id: 'ph-partners', title: 'الشركاء', icon: 'bi-people',
          desc: 'الأشخاص الشركاء في المشروع، ونسبة ملكية كل واحد منهم (لازم مجموعها يساوي 100%).' },
        { id: 'ph-capital', title: 'رأس المال', icon: 'bi-piggy-bank',
          desc: '<b>مساهمة رأس المال</b> = مبلغ يدفعه الشريك كاستثمار أساسي في المشروع، ولا يُسترد إلا لو اتقفلت الشراكة نهائياً (بخلاف السلفة، اللي بترجع للشريك).' },
        { id: 'ph-advances', title: 'السلف', icon: 'bi-arrow-left-right',
          desc: '<b>سلفة الشريك</b> = الشريك بيقرض المشروع مبلغاً مؤقتاً وله الحق يسترجعه لاحقاً. <b>سداد السلفة</b> = المشروع بيرجّع للشريك جزءاً أو كل المبلغ اللي كان قد سلّفه.' },
        { id: 'ph-distributions', title: 'الأرباح والتوزيعات', icon: 'bi-cash-coin',
          desc: '<b>الأرباح القابلة للتوزيع</b> = اللي فاضل من الربح بعد ما يتخصم منه الاحتياطي وأي مبلغ اتحجز لإعادة الاستثمار في التجهيز. <b>التوزيع</b> = المبلغ الفعلي اللي بيتدفع لكل شريك من نصيبه.' },
        { id: 'ph-settlements', title: 'التسويات', icon: 'bi-shuffle',
          desc: '<b>التسوية</b> = تصحيح أو موازنة حساب بين طرفين (مش دخل حقيقي ولا مصروف حقيقي)، زي تعديل خطأ حصل في تسجيل سابق.' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [Pages.partners, Pages.capital, Pages.advances, Pages.distributions, Pages.settlements]);
};

/* ---------------- الداخلية ---------------- */
Pages.dormitory = function (container) {
    const activeResidentsCount = DataService.getResidents().filter(r => !r.checkOut).length;
    const availableBedsCount = DataService.getBeds().filter(b => b.status === 'متاح').length;
    const guestsTodayCount = DataService.getGuestsToday().length;
    const activeServicesCount = DataService.getAllResidentServices().filter(rs => rs.status === 'نشطة').length;
    const activeVacationsCount = DataService.getActiveVacations().length;
    const floorsCount = DataService.getFloors().length;

    const tabs = [
        { id: 'dh-structure', title: 'هيكل الداخلية', icon: 'bi-diagram-3', count: floorsCount,
          desc: 'الهيكل الكامل: طابق ← شقة ← غرفة ← سرير. أضف الطوابق والشقق والغرف والأسرة من هنا، واضغط على أي عنصر لعرض تفاصيله.' },
        { id: 'dh-residents', title: 'الطالبات', icon: 'bi-person-badge', count: activeResidentsCount,
          desc: 'بيانات كل طالبة ساكنة، بما فيها بيانات أهلها، ومدفوعاتها، وخدماتها، وسجل أي تعديل حصل على ملفها.' },
        { id: 'dh-housing', title: 'التسكين والتحصيل', icon: 'bi-house-check', count: availableBedsCount,
          desc: '<b>التسكين</b> = تسجيل طالبة جديدة في سرير فاضي. <b>التحصيل</b> = متابعة مين دفعت إيجارها الشهري ومين لسه ما دفعتش.' },
        { id: 'dh-guests', title: 'الضيفات', icon: 'bi-person-heart', count: guestsTodayCount,
          desc: 'زائرات مؤقتات تستضيفهن إحدى الطالبات — دخلهن منفصل عن إيراد السكن ولا يؤثر على إشغال سرير المضيفة.' },
        { id: 'dh-services', title: 'الخدمات', icon: 'bi-stars', count: activeServicesCount,
          desc: 'خدمات إضافية (طعام، إنترنت، مكتبة، ترحيل...) تُفعَّل لكل طالبة بشكل مستقل عن سعر السكن.' },
        { id: 'dh-vacations', title: 'الإجازات', icon: 'bi-airplane', count: activeVacationsCount,
          desc: 'إجازات الطالبات، مع خيار الاحتفاظ بالسرير مقابل نسبة من الإيجار الشهري.' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [
        Pages.dormStructure, Pages.residents,
        (el) => {
            el.innerHTML = `<div id="dh-housing-sub"></div><div class="section-title"><i class="bi bi-cash-stack text-teal"></i>التحصيل</div><div id="dh-collection-sub"></div>`;
            Pages.housing(document.getElementById('dh-housing-sub'));
            Pages.collection(document.getElementById('dh-collection-sub'));
        },
        Pages.guests, Pages.services, Pages.vacations
    ]);
};

/* ---------------- المالية ---------------- */
Pages.finance = function (container) {
    const tabs = [
        { id: 'fh-revenue', title: 'الإيرادات', icon: 'bi-graph-up-arrow',
          desc: 'كل الفلوس اللي دخلت فعلاً للمشروع (إيجار الطالبات وأي دخل آخر).' },
        { id: 'fh-expenses', title: 'المصروفات', icon: 'bi-receipt',
          desc: 'كل الفلوس اللي خرجت لتغطية تكاليف التشغيل. كل مصروف لازم يتحدد هل هو <b>تجاري</b> (يدخل في حسابات المشروع) أو <b>شخصي</b> (ما يأثرش على أرباح المشروع).' },
        { id: 'fh-recurring', title: 'المصروفات الدورية', icon: 'bi-arrow-repeat',
          desc: 'مصروفات ودخل ثابت بيتكرر تلقائياً (زي الإيجار الشهري أو اشتراك إنترنت) — بدل ما تسجله يدوياً كل مرة، النظام يسجله وحده في موعده.' },
        { id: 'fh-treasury', title: 'الخزينة', icon: 'bi-wallet2',
          desc: '<b>الرصيد النقدي الفعلي</b> المتوفر الآن = كل الفلوس الداخلة ناقص كل الفلوس الخارجة. هذا غير الربح — ممكن يكون الرصيد كبير بس فيه سلف لازم ترجع لأصحابها.' },
        { id: 'fh-assets', title: 'الأصول', icon: 'bi-box-seam',
          desc: '<b>الأصل</b> = أي حاجة اشتراها المشروع وتبقى ملكه (سرير، أثاث، معدات)، بخلاف المصروف اللي بينصرف وينتهي (زي فاتورة كهرباء).' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [Pages.revenue, Pages.expenses, Pages.recurringExpenses, Pages.treasury, Pages.assets]);
};

/* ---------------- التأسيس والتجهيز ---------------- */
Pages.setup = function (container) {
    const tabs = [
        { id: 'sh-budget', title: 'ميزانية التأسيس', icon: 'bi-bar-chart-steps',
          desc: 'المبلغ الكلي المخصص لتجهيز الداخلية بالكامل (أسرة، أثاث، معدات...)، وكم اتصرف منه لحد الآن.' },
        { id: 'sh-purchases', title: 'المشتريات', icon: 'bi-cart-check',
          desc: 'المصروفات الخاصة تحديداً بشراء أثاث ومعدات التجهيز.' },
        { id: 'sh-assets', title: 'الأصول', icon: 'bi-box-seam',
          desc: 'قائمة كل الأصول (الممتلكات الثابتة) اللي اشتراها المشروع لحد الآن.' },
        { id: 'sh-reinvest', title: 'إعادة الاستثمار', icon: 'bi-arrow-repeat',
          desc: '<b>إعادة الاستثمار</b> = جزء من إيراد الطالبات بيتصرف على استكمال التجهيز بدل ما يتوزع كربح على الشركاء.' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [Pages.setupBudget, Pages.purchases, Pages.assets, Pages.reinvestment]);
};

/* ---------------- المراجعة ---------------- */
Pages.review = function (container) {
    const tabs = [
        { id: 'rv-close', title: 'إغلاق الشهر', icon: 'bi-calendar-check',
          desc: '<b>قفل الشهر</b> = بعد ما تتأكد إن كل أرقام الشهر صح، تقفله عشان محدّش (بالغلط) يعدّل معاملة قديمة فيه بعدين. الشهر المقفول ما يتعدلش إلا لو فتحته يدوياً.' },
        { id: 'rv-activity', title: 'سجل العمليات', icon: 'bi-clock-history',
          desc: 'كل حركة تمت في النظام، مين عملها ومتى — كسجل تدقيق كامل لأي تصرف.' },
        { id: 'rv-approvals', title: 'الموافقات', icon: 'bi-patch-check',
          desc: 'مصروفات كبيرة (فوق حد معيّن) أو محتاجة قرار، بتظهر هنا عشان تراجعها وتعتمدها أو ترفضها قبل ما تتحسب نهائياً.' },
        { id: 'rv-disputes', title: 'النزاعات', icon: 'bi-exclamation-diamond',
          desc: 'بنود مالية مشتركة (زي فاتورة فيها جزء شخصي وجزء للمشروع) لسه ما اتحددش نصيب كل جزء منها.' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [Pages.monthClose, Pages.activityLog, Pages.approvals, Pages.disputes]);
};

/* ---------------- الأدوات ---------------- */
Pages.tools = function (container) {
    const tabs = [
        { id: 'tl-sim', title: 'محاكاة الأرباح', icon: 'bi-calculator',
          desc: 'جرّب أرقام مختلفة (عدد طالبات، مصروفات، إيجار...) وشوف تأثيرها على الربح المتوقع، قبل ما تصير حقيقة على أرض الواقع.' },
        { id: 'tl-rent', title: 'عقد الإيجار', icon: 'bi-file-earmark-text',
          desc: 'حساب الإيجار المتوقع للسنوات القادمة تلقائياً حسب نسبة الزيادة السنوية المتفق عليها في العقد.' }
    ];
    container.innerHTML = tabsShell(tabs);
    wireTabs(tabs, [Pages.simulator, Pages.rentContract]);
};
