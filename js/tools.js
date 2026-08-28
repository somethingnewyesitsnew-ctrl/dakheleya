/* ==========================================================================
   tools.js — محاكاة الأرباح، عقد الإيجار، إغلاق الشهر
   ========================================================================== */

// عدد الأسرة الفعلي المعتمد للداخلية (بعد المراجعة) — يُستخدم كقيمة مقترحة افتراضية في المحاكي
// فقط، ولا يُقيّد به أي مكان آخر في النظام (عدد الأسرة الفعلي دائماً مُشتق من هيكل الداخلية
// الحقيقي المُدخل من صفحة "هيكل الداخلية").
const SIMULATOR_SUGGESTED_BEDS = 59;

function simServiceIcon(type) {
    return { 'الطعام': 'bi-cup-hot', 'الإنترنت': 'bi-wifi', 'المكتبة': 'bi-book', 'الترحيل': 'bi-truck' }[type] || 'bi-stars';
}

Pages.simulator = function (container) {
    const settings = DataService.getSettings();
    const partners = DataService.getPartners();
    const occ = DataService.occupancyStats();
    const services = DataService.getServices().filter(s => s.status === 'نشطة');
    const suggestedTotal = occ.total > 0 ? occ.total : SIMULATOR_SUGGESTED_BEDS;

    container.innerHTML = `
    <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;">
        <i class="bi bi-info-circle text-teal mt-1"></i>
        <span>أدخل عدد الأسرة اللي متوقّع تكون مشغولة وسعر السرير، وفعّل أي خدمة مدفوعة (طعام، إنترنت...) مع عدد المشتركين المتوقع وسعرها لكل مشترك — والنظام يحسب لك الإيراد الكلي، صافي الربح، والأرباح القابلة للتوزيع، ونصيب كل شريك منها.</span>
    </div>

    <div class="row g-3">
        <div class="col-lg-6">
            <div class="app-card h-100">
                <div class="app-card-header"><h2><i class="bi bi-door-open me-1 text-teal"></i>إيراد الأسرة</h2></div>
                <div class="app-card-body">
                    <label class="form-label fw-bold">عدد الأسرة المشغولة (المقترح)</label>
                    <input type="number" class="form-control" id="sim-beds-input" min="0" max="500" value="${SIMULATOR_SUGGESTED_BEDS}">
                    <div class="form-text" style="font-size:11px;">إجمالي عدد الأسرة الفعلي المسجّل حالياً في هيكل الداخلية: ${occ.total || 0} سريراً</div>
                    <div class="d-flex gap-1 flex-wrap mt-2 mb-3">
                        ${[50,60,70,80,90,100].map(p => `<button class="btn btn-outline-secondary btn-sm sim-preset-btn" data-pct="${p}">${p}%</button>`).join('')}
                    </div>
                    <label class="form-label fw-bold">سعر السرير الشهري</label>
                    <input type="number" class="form-control" id="sim-price" value="${settings.bedPrice||0}">
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="app-card h-100">
                <div class="app-card-header"><h2><i class="bi bi-cash-coin me-1 text-teal"></i>المصاريف والإعدادات المالية</h2></div>
                <div class="app-card-body">
                    <div class="row g-3">
                        <div class="col-6">
                            <label class="form-label fw-bold">المصاريف الشهرية</label>
                            <input type="number" class="form-control" id="sim-expenses" value="${DataService.getRecurringMonthlyBurden()}">
                            <div class="form-text" style="font-size:10.5px;">بدون الإيجار — مبدئياً من العبء الدوري النشط</div>
                        </div>
                        <div class="col-6"><label class="form-label fw-bold">الإيجار الشهري</label><input type="number" class="form-control" id="sim-rent" value="${settings.rent}"></div>
                        <div class="col-6"><label class="form-label fw-bold">احتياطي التشغيل</label><input type="number" class="form-control" id="sim-reserve" value="${settings.operatingReserveDefault || 1000000}"></div>
                        <div class="col-6"><label class="form-label fw-bold">إعادة الاستثمار</label><input type="number" class="form-control" id="sim-reinvest" value="0"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section-title"><i class="bi bi-stars text-teal"></i>الخدمات المدفوعة</div>
    <p class="text-muted mt-n2 mb-3" style="font-size:12.5px;">فعّل مفتاح أي خدمة وحدد عدد المشتركين المتوقع وسعرها لكل مشترك — إيرادها بيُضاف تلقائياً لإجمالي إيرادات المحاكاة.</p>
    ${services.length ? `
    <div class="row g-3" id="sim-services-list">
        ${services.map(s => `
        <div class="col-md-4 col-sm-6">
            <div class="app-card sim-service-card h-100" data-id="${s.id}">
                <div class="app-card-body">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="kpi-icon bg-soft-teal" style="width:34px;height:34px;font-size:15px;"><i class="bi ${simServiceIcon(s.type)}"></i></div>
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input sim-service-check" type="checkbox" id="sim-svc-${s.id}" role="switch">
                        </div>
                    </div>
                    <label class="fw-bold d-block mb-2 sim-service-name" for="sim-svc-${s.id}" style="font-size:13.5px;">${Utils.escapeHtml(s.name)}</label>
                    <div class="row g-2">
                        <div class="col-6"><label class="form-label" style="font-size:10.5px;">عدد المشتركين</label><input type="number" class="form-control form-control-sm sim-service-count" min="0" value="0"></div>
                        <div class="col-6"><label class="form-label" style="font-size:10.5px;">السعر/مشترك</label><input type="number" class="form-control form-control-sm sim-service-price" min="0" value="${s.price}"></div>
                    </div>
                </div>
            </div>
        </div>`).join('')}
    </div>` : `<div class="app-card"><div class="app-card-body">${emptyState('bi-stars','لا توجد خدمات معرّفة بعد — أضفها من "الداخلية ← الخدمات" حتى تظهر هنا وتقدر تحاكي إيرادها')}</div></div>`}

    <div class="section-title"><i class="bi bi-calculator text-teal"></i>نتائج المحاكاة</div>
    <div class="app-card">
        <div class="app-card-body" id="sim-results"></div>
    </div>`;

    function getSelectedServices() {
        return [...document.querySelectorAll('.sim-service-card')].map(card => {
            const checked = card.querySelector('.sim-service-check').checked;
            const count = Number(card.querySelector('.sim-service-count').value) || 0;
            const price = Number(card.querySelector('.sim-service-price').value) || 0;
            const name = card.querySelector('.sim-service-name').textContent;
            card.classList.toggle('sim-service-active', checked);
            return { checked, count, price, name, revenue: checked ? count * price : 0 };
        });
    }

    function calc() {
        const occupiedBeds = Number(document.getElementById('sim-beds-input').value) || 0;
        const bedPrice = Number(document.getElementById('sim-price').value) || 0;
        const monthlyExpenses = Number(document.getElementById('sim-expenses').value) || 0;
        const rent = Number(document.getElementById('sim-rent').value) || 0;
        const reserve = Number(document.getElementById('sim-reserve').value) || 0;
        const reinvestment = Number(document.getElementById('sim-reinvest').value) || 0;
        const servicesSel = getSelectedServices();
        const servicesRevenue = servicesSel.reduce((s, sv) => s + sv.revenue, 0);
        const activeServices = servicesSel.filter(s => s.checked);

        const result = DataService.simulateProfit({ occupiedBeds, bedPrice, monthlyExpenses, rent, reserve, reinvestment, servicesRevenue });

        document.getElementById('sim-results').innerHTML = `
            <div class="row g-3">
                ${kpiCard({ icon:'bi-door-open', label:'إيراد الأسرة', value: Utils.formatMoney(result.bedsRevenue), colorClass:'bg-soft-teal', sub:`${Utils.formatNumber(occupiedBeds)} سرير × ${Utils.formatMoney(bedPrice)}` })}
                ${kpiCard({ icon:'bi-stars', label:'إيراد الخدمات', value: Utils.formatMoney(result.servicesRevenue), colorClass:'bg-soft-info', sub: activeServices.length ? `${activeServices.length} خدمة مفعّلة` : 'لا خدمات مفعّلة' })}
                ${kpiCard({ icon:'bi-graph-up', label:'إجمالي الإيرادات', value: Utils.formatMoney(result.revenue), colorClass:'bg-soft-success' })}
                ${kpiCard({ icon:'bi-graph-down', label:'إجمالي المصاريف', value: Utils.formatMoney(result.totalExpenses), colorClass:'bg-soft-danger', sub:'المصاريف الشهرية + الإيجار' })}
            </div>
            <div class="row g-3 mt-1">
                ${kpiCard({ icon:'bi-cash-coin', label:'صافي الربح', value: Utils.formatMoney(result.netProfit), colorClass:'bg-soft-teal' })}
                ${kpiCard({ icon:'bi-coin', label:'الأرباح القابلة للتوزيع', value: Utils.formatMoney(result.distributable), colorClass:'bg-soft-gold', sub:'بعد خصم الاحتياطي وإعادة الاستثمار — هذا الرقم هو اللي بيتوزّع فعلياً' })}
            </div>
            <div class="row g-3 mt-1">
                ${partners.length ? partners.map(p => kpiCard({ icon:'bi-person', label:`نصيب ${p.name}`, value: Utils.formatMoney(result.shares[p.name]||0), colorClass:'bg-soft-navy' })).join('') : `<div class="col-12">${emptyState('bi-people','لا يوجد شركاء مسجلون بعد لعرض نصيب كل واحد')}</div>`}
            </div>
            ${activeServices.length ? `
            <div class="section-title" style="font-size:14px;"><i class="bi bi-stars text-teal"></i>تفصيل إيراد الخدمات المفعّلة</div>
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الخدمة</th><th>عدد المشتركين</th><th>السعر لكل مشترك</th><th>الإيراد</th></tr></thead>
                    <tbody>${activeServices.map(s => `<tr><td>${Utils.escapeHtml(s.name)}</td><td>${Utils.formatNumber(s.count)}</td><td class="money">${Utils.formatMoney(s.price)}</td><td class="money">${Utils.formatMoney(s.revenue)}</td></tr>`).join('')}</tbody>
                </table>
            </div>` : ''}
            <div class="alert alert-light border mt-3 mb-0" style="font-size:13.5px;">
                <i class="bi bi-info-circle text-teal me-1"></i>
                نقطة التعادل التقريبية (من إيراد الأسرة وحده، بدون احتساب إيراد الخدمات): <b>${Utils.formatNumber(result.breakEvenBeds)}</b> سريراً مشغولاً لتغطية كل المصاريف والإيجار.
            </div>`;
    }

    document.getElementById('sim-beds-input').addEventListener('input', calc);
    ['sim-price','sim-expenses','sim-rent','sim-reserve','sim-reinvest'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    document.querySelectorAll('.sim-service-check, .sim-service-count, .sim-service-price').forEach(el => {
        el.addEventListener('input', calc);
        el.addEventListener('change', calc);
    });
    document.querySelectorAll('.sim-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pct = Number(btn.dataset.pct);
            document.getElementById('sim-beds-input').value = Math.round(suggestedTotal * pct / 100);
            calc();
        });
    });
    calc();
};

/* ---------------- عقد الإيجار ---------------- */
Pages.rentContract = function (container) {
    const settings = DataService.getSettings();
    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-file-earmark-text me-1 text-teal"></i>عقد الإيجار</h2></div>
        <div class="app-card-body">
            <div class="row g-3 mb-3">
                <div class="col-md-4"><label class="form-label fw-bold">الإيجار الأساسي</label><input type="number" class="form-control" id="rc-base" value="${settings.rent}"></div>
                <div class="col-md-4"><label class="form-label fw-bold">نسبة الزيادة السنوية (%)</label><input type="number" class="form-control" id="rc-increase" value="${settings.rentIncrease}"></div>
                <div class="col-md-4"><label class="form-label fw-bold">عدد السنوات المعروضة</label><input type="number" class="form-control" id="rc-years" value="5" min="1" max="15"></div>
            </div>
            <div class="table-responsive"><table class="table table-app mb-0">
                <thead><tr><th>السنة</th><th>الإيجار السنوي</th><th>الإيجار الشهري</th></tr></thead>
                <tbody id="rc-tbody"></tbody>
            </table></div>
            <p class="text-muted mt-2 mb-0" style="font-size:12px;">المالك: سيد — يُحتسب الإيجار تلقائياً باستخدام نسبة الزيادة السنوية دون تثبيت أي قيمة يدوياً.</p>
        </div>
    </div>`;

    function render() {
        const base = Number(document.getElementById('rc-base').value) || 0;
        const increase = Number(document.getElementById('rc-increase').value) || 0;
        const years = Number(document.getElementById('rc-years').value) || 1;
        const baseYear = settings.rentBaseYear || 2025;
        let rows = '';
        for (let i = 0; i < years; i++) {
            const y = baseYear + 1 + i;
            const annual = DataService.calculateRent(base, increase, baseYear, y);
            rows += `<tr><td>${y}</td><td class="money">${Utils.formatMoney(annual)}</td><td class="money">${Utils.formatMoney(Math.round(annual/12))}</td></tr>`;
        }
        document.getElementById('rc-tbody').innerHTML = `<tr><td>${baseYear}</td><td class="money">${Utils.formatMoney(base)}</td><td class="money">${Utils.formatMoney(Math.round(base/12))}</td></tr>` + rows;
    }
    ['rc-base','rc-increase','rc-years'].forEach(id => document.getElementById(id).addEventListener('input', render));
    render();
};

/* ---------------- إغلاق الشهر ---------------- */
Pages.monthClose = function (container) {
    const settings = DataService.getSettings();
    const partners = DataService.getPartners();
    const closings = DataService.getClosings();

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-header"><h2><i class="bi bi-calendar-check me-1 text-teal"></i>إغلاق الشهر</h2></div>
        <div class="app-card-body">
            <p class="text-muted mb-3" style="font-size:13px;">
                <i class="bi bi-info-circle text-teal me-1"></i>
                بعد ما تتأكد إن كل أرقام الشهر صح، اقفله عشان محدّش (بالغلط) يقدر يعدّل معاملة قديمة فيه بعدين.
            </p>
            <div class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label class="form-label fw-bold">الشهر</label>
                    <input type="month" class="form-control" id="close-month" value="${Utils.monthKey(Utils.todayISO())}">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">الاحتياطي التشغيلي</label>
                    <div class="form-text mt-0 mb-1" style="font-size:11.5px;">مبلغ تجنّبه من الربح كمخزون أمان لمواجهة أي طارئ، قبل ما توزّع الباقي على الشركاء</div>
                    <input type="number" class="form-control" id="close-reserve" value="${settings.operatingReserveDefault || 1000000}">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">إعادة الاستثمار المعتمدة</label>
                    <div class="form-text mt-0 mb-1" style="font-size:11.5px;">مبلغ من ربح هذا الشهر تحجزه لاستكمال تجهيز الداخلية بدل توزيعه</div>
                    <input type="number" class="form-control" id="close-reinvest" value="0">
                </div>
            </div>
            <div id="close-summary" class="mt-4"></div>
        </div>
    </div>
    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-lock me-1 text-teal"></i>الأشهر المغلقة سابقاً</h2></div>
        <div class="app-card-body">
            ${closings.length ? `<div class="table-responsive"><table class="table table-app mb-0">
                <thead><tr><th>الشهر</th><th>الأرباح القابلة للتوزيع</th>${partners.map(p=>`<th>نصيب ${p.name}</th>`).join('')}<th>أُغلق بواسطة</th></tr></thead>
                <tbody>${closings.map(c => `<tr><td>${Utils.monthLabel(c.month)}</td><td class="money">${Utils.formatMoney(c.distributable)}</td>${partners.map(p=>`<td class="money">${Utils.formatMoney(c.shares?.[p.name]||0)}</td>`).join('')}<td>${c.closedBy}</td></tr>`).join('')}</tbody>
            </table></div>` : emptyState('bi-calendar-x', 'لا توجد أشهر مغلقة بعد')}
        </div>
    </div>`;

    function renderSummary() {
        const monthInput = document.getElementById('close-month').value;
        const monthKey = monthInput; // YYYY-MM
        const reserve = Number(document.getElementById('close-reserve').value) || 0;
        const reinvestment = Number(document.getElementById('close-reinvest').value) || 0;
        const closed = DataService.isMonthClosed(monthKey);
        const calc = DataService.calculateProfit(monthKey, { reserve, reinvestment });

        document.getElementById('close-summary').innerHTML = `
            <div class="row g-3">
                ${kpiCard({ icon:'bi-graph-up', label:'إجمالي الإيرادات', value: Utils.formatMoney(calc.revenue), colorClass:'bg-soft-success' })}
                ${kpiCard({ icon:'bi-graph-down', label:'إجمالي المصروفات', value: Utils.formatMoney(calc.operatingExpenses), colorClass:'bg-soft-danger' })}
                ${kpiCard({ icon:'bi-cash-coin', label:'صافي الربح', value: Utils.formatMoney(calc.netOperatingProfit), colorClass:'bg-soft-teal', sub:'الإيرادات ناقص المصروفات، قبل الاحتياطي وإعادة الاستثمار' })}
                ${kpiCard({ icon:'bi-coin', label:'الأرباح القابلة للتوزيع', value: Utils.formatMoney(calc.distributable), colorClass:'bg-soft-gold', sub:'الجاهز فعلياً للتوزيع على الشركاء' })}
            </div>
            <div class="row g-3 mt-1">
                ${partners.map(p => kpiCard({ icon:'bi-person', label:`نصيب ${p.name}`, value: Utils.formatMoney(calc.shares[p.name]||0), colorClass:'bg-soft-navy' })).join('')}
            </div>
            <div class="mt-3">
                ${closed ? `<div class="alert alert-secondary mb-0"><i class="bi bi-lock me-1"></i> هذا الشهر مغلق بالفعل ولا يمكن تعديل معاملاته.</div>` :
                `<button class="btn btn-brand" id="close-month-btn"><i class="bi bi-check2-circle me-1"></i>مراجعة وإغلاق الشهر</button>`}
            </div>`;

        if (!closed) {
            document.getElementById('close-month-btn').addEventListener('click', () => {
                confirmAction(`سيتم إغلاق شهر ${Utils.monthLabel(monthKey)} ومنع تعديل معاملاته لاحقاً. هل تريد المتابعة؟`, () => {
                    DataService.closeMonth(monthKey, calc, Utils.currentUserName());
                    showToast('تم إغلاق الشهر بنجاح', 'success');
                    Pages.monthClose(container);
                }, false);
            });
        }
    }
    document.getElementById('close-month').addEventListener('change', renderSummary);
    document.getElementById('close-reserve').addEventListener('input', renderSummary);
    document.getElementById('close-reinvest').addEventListener('input', renderSummary);
    renderSummary();
};
