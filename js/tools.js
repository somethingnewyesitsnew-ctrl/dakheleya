/* ==========================================================================
   tools.js — محاكاة الأرباح، عقد الإيجار، إغلاق الشهر
   ========================================================================== */

Pages.simulator = function (container) {
    const settings = DataService.getSettings();
    const partners = DataService.getPartners();
    const occ = DataService.occupancyStats();

    container.innerHTML = `
    <div class="row g-3">
        <div class="col-lg-5">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-sliders me-1 text-teal"></i>مدخلات المحاكاة</h2></div>
                <div class="app-card-body">
                    <div class="mb-3">
                        <label class="form-label fw-bold d-flex justify-content-between">عدد الأسرة المشغولة <span id="beds-val" class="text-teal">${occ.occupied}</span></label>
                        <input type="range" class="form-range" id="sim-beds" min="0" max="${occ.total}" value="${occ.occupied}">
                        <div class="d-flex gap-1 flex-wrap mt-2">
                            ${[50,60,70,80,90,100].map(p => `<button class="btn btn-outline-secondary btn-sm sim-preset-btn" data-pct="${p}">${p}%</button>`).join('')}
                        </div>
                    </div>
                    <div class="mb-3"><label class="form-label fw-bold">سعر السرير</label><input type="number" class="form-control" id="sim-price" value="${settings.bedPrice}"></div>
                    <div class="mb-3"><label class="form-label fw-bold">المصاريف الشهرية (بدون الإيجار)</label><input type="number" class="form-control" id="sim-expenses" value="${DataService.getRecurringMonthlyBurden()}"><div class="form-text" style="font-size:11px;">مبدئياً محسوبة من عبء المصروفات الدورية النشطة — يمكنك تعديلها</div></div>
                    <div class="mb-3"><label class="form-label fw-bold">الإيجار الشهري</label><input type="number" class="form-control" id="sim-rent" value="${settings.rent}"></div>
                    <div class="mb-3"><label class="form-label fw-bold">احتياطي التشغيل</label><input type="number" class="form-control" id="sim-reserve" value="${settings.operatingReserveDefault || 1000000}"></div>
                    <div class="mb-1"><label class="form-label fw-bold">إعادة الاستثمار</label><input type="number" class="form-control" id="sim-reinvest" value="0"></div>
                </div>
            </div>
        </div>
        <div class="col-lg-7">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-calculator me-1 text-teal"></i>نتائج المحاكاة</h2></div>
                <div class="app-card-body" id="sim-results"></div>
            </div>
        </div>
    </div>`;

    function calc() {
        const occupiedBeds = Number(document.getElementById('sim-beds').value);
        document.getElementById('beds-val').textContent = occupiedBeds;
        const bedPrice = Number(document.getElementById('sim-price').value) || 0;
        const monthlyExpenses = Number(document.getElementById('sim-expenses').value) || 0;
        const rent = Number(document.getElementById('sim-rent').value) || 0;
        const reserve = Number(document.getElementById('sim-reserve').value) || 0;
        const reinvestment = Number(document.getElementById('sim-reinvest').value) || 0;

        const result = DataService.simulateProfit({ occupiedBeds, bedPrice, monthlyExpenses, rent, reserve, reinvestment });

        document.getElementById('sim-results').innerHTML = `
            <div class="row g-3">
                ${kpiCard({ icon:'bi-graph-up', label:'الإيرادات', value: Utils.formatMoney(result.revenue), colorClass:'bg-soft-success' })}
                ${kpiCard({ icon:'bi-graph-down', label:'المصاريف', value: Utils.formatMoney(result.totalExpenses), colorClass:'bg-soft-danger' })}
                ${kpiCard({ icon:'bi-cash-coin', label:'صافي الربح', value: Utils.formatMoney(result.netProfit), colorClass:'bg-soft-teal' })}
                ${kpiCard({ icon:'bi-coin', label:'الأرباح القابلة للتوزيع', value: Utils.formatMoney(result.distributable), colorClass:'bg-soft-gold', sub:'بعد خصم الاحتياطي وإعادة الاستثمار' })}
            </div>
            <div class="row g-3 mt-1">
                ${partners.map(p => kpiCard({ icon:'bi-person', label:`نصيب ${p.name}`, value: Utils.formatMoney(result.shares[p.name]||0), colorClass:'bg-soft-navy' })).join('')}
            </div>
            <div class="alert alert-light border mt-3 mb-0" style="font-size:13.5px;">
                <i class="bi bi-info-circle text-teal me-1"></i>
                نقطة التعادل التقريبية: <b>${Utils.formatNumber(result.breakEvenBeds)}</b> سريراً مشغولاً لتغطية كل المصاريف والإيجار.
            </div>`;
    }

    document.getElementById('sim-beds').addEventListener('input', calc);
    ['sim-price','sim-expenses','sim-rent','sim-reserve','sim-reinvest'].forEach(id => document.getElementById(id).addEventListener('input', calc));
    document.querySelectorAll('.sim-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pct = Number(btn.dataset.pct);
            document.getElementById('sim-beds').value = Math.round(occ.total * pct / 100);
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
