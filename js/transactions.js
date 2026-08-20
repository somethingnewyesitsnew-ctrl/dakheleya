/* ==========================================================================
   transactions.js — دفتر المعاملات المركزي والصفحات المشتقة منه
   (مساهمات رأس المال، سلف الشركاء، التسويات، الأرباح والتوزيعات، الخزينة،
    سجل العمليات، الموافقات، النزاعات)
   ========================================================================== */

/* ---------------- جدول معاملات عام قابل لإعادة الاستخدام ---------------- */
function renderTransactionsPage(container, { title, icon, typeFilter, emptyIcon, emptyText, extraTop }) {
    const partners = DataService.getPartners();

    container.innerHTML = `
    ${extraTop || ''}
    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi ${icon} me-1 text-teal"></i>${title}</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-brand btn-sm" id="tx-page-add-btn"><i class="bi bi-plus-lg me-1"></i>معاملة جديدة</button>
                <button class="btn btn-light border btn-sm" id="tx-page-export-btn"><i class="bi bi-download me-1"></i>تصدير CSV</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="row g-2 mb-3">
                <div class="col-md-4">
                    <input type="text" class="form-control form-control-sm" id="tx-search" placeholder="بحث في البيان...">
                </div>
                <div class="col-6 col-md-2">
                    <input type="date" class="form-control form-control-sm" id="tx-filter-date">
                </div>
                <div class="col-6 col-md-2">
                    <select class="form-select form-select-sm" id="tx-filter-partner">
                        <option value="">كل الشركاء</option>
                        ${partners.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-6 col-md-2">
                    <select class="form-select form-select-sm" id="tx-filter-status">
                        <option value="">كل الحالات</option>
                        <option value="مسجلة">مسجلة</option>
                        <option value="ملغاة">ملغاة</option>
                    </select>
                </div>
                <div class="col-6 col-md-2">
                    <select class="form-select form-select-sm" id="tx-sort">
                        <option value="date-desc">الأحدث أولاً</option>
                        <option value="date-asc">الأقدم أولاً</option>
                        <option value="amount-desc">الأعلى مبلغاً</option>
                        <option value="amount-asc">الأقل مبلغاً</option>
                    </select>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr>
                        <th>التاريخ</th><th>البيان</th><th>النوع / التصنيف</th><th>الشريك</th>
                        <th>المبلغ</th><th>طريقة الدفع</th><th>الحالة</th><th>بواسطة</th><th></th>
                    </tr></thead>
                    <tbody id="tx-tbody"></tbody>
                </table>
            </div>
            <div id="tx-empty"></div>
        </div>
    </div>`;

    document.getElementById('tx-page-add-btn').addEventListener('click', () => openAddTransactionModal(typeFilter ? { type: Array.isArray(typeFilter) ? typeFilter[0] : typeFilter } : {}));

    function getFiltered() {
        let list = DataService.getTransactions();
        if (typeFilter) {
            const types = Array.isArray(typeFilter) ? typeFilter : [typeFilter];
            list = list.filter(t => types.includes(t.type));
        }
        const search = document.getElementById('tx-search').value.trim().toLowerCase();
        const date = document.getElementById('tx-filter-date').value;
        const partner = document.getElementById('tx-filter-partner').value;
        const status = document.getElementById('tx-filter-status').value;
        const sort = document.getElementById('tx-sort').value;

        if (search) list = list.filter(t => t.description.toLowerCase().includes(search));
        if (date) list = list.filter(t => t.date === date);
        if (partner) list = list.filter(t => t.partner === partner);
        if (status) list = list.filter(t => t.status === status);

        list = [...list].sort((a, b) => {
            if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sort === 'amount-desc') return b.amount - a.amount;
            if (sort === 'amount-asc') return a.amount - b.amount;
            return 0;
        });
        return list;
    }

    function renderTable() {
        const list = getFiltered();
        const tbody = document.getElementById('tx-tbody');
        const emptyBox = document.getElementById('tx-empty');
        if (!list.length) {
            tbody.innerHTML = '';
            emptyBox.innerHTML = emptyState(emptyIcon || 'bi-inbox', emptyText || 'لا توجد معاملات مطابقة');
            return;
        }
        emptyBox.innerHTML = '';
        tbody.innerHTML = list.map(t => `
            <tr>
                <td class="text-nowrap">${t.date}</td>
                <td>${Utils.escapeHtml(t.description)}${t.notes ? `<div class="text-muted" style="font-size:11px;">${Utils.escapeHtml(t.notes)}</div>` : ''}</td>
                <td><span class="badge-soft bg-soft-navy">${t.type}</span><div class="text-muted mt-1" style="font-size:11px;">${t.category||''}</div></td>
                <td>${t.partner || '—'}</td>
                <td class="money ${t.amount < 0 ? 'text-danger' : ''}">${Utils.formatMoney(t.amount)}</td>
                <td>${t.paymentSource || '—'}</td>
                <td>${statusBadge(t.status)}</td>
                <td class="text-muted" style="font-size:12px;">${t.createdBy}</td>
                <td class="text-nowrap">
                    ${t.status !== 'ملغاة' ? `<button class="btn btn-sm btn-light border cancel-tx-btn" data-id="${t.id}" data-date="${t.date}" title="إلغاء المعاملة"><i class="bi bi-x-circle text-danger"></i></button>` : ''}
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.cancel-tx-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (blockIfMonthClosed(btn.dataset.date)) return;
                confirmAction('سيتم الإبقاء على المعاملة الأصلية وإنشاء قيد عكسي بدلاً من حذفها نهائياً. هل تريد المتابعة؟', () => {
                    DataService.cancelTransaction(btn.dataset.id, Utils.currentUserName());
                    showToast('تم إلغاء المعاملة وإنشاء قيد عكسي', 'warning');
                    renderTable();
                });
            });
        });
    }

    ['tx-search','tx-filter-date','tx-filter-partner','tx-filter-status','tx-sort'].forEach(id => {
        document.getElementById(id).addEventListener('input', renderTable);
        document.getElementById(id).addEventListener('change', renderTable);
    });

    document.getElementById('tx-page-export-btn').addEventListener('click', () => {
        const list = getFiltered();
        const rows = [['التاريخ','البيان','النوع','التصنيف','الشريك','المبلغ','طريقة الدفع','الحالة','بواسطة']];
        list.forEach(t => rows.push([t.date, t.description, t.type, t.category, t.partner, t.amount, t.paymentSource, t.status, t.createdBy]));
        Utils.csvDownload(`${title}.csv`, rows);
        showToast('تم تصدير الملف', 'success');
    });

    renderTable();
}

/* ---------------- الصفحات المشتقة ---------------- */
Pages.capital = function (container) {
    renderTransactionsPage(container, {
        title: 'مساهمات رأس المال', icon: 'bi-piggy-bank', typeFilter: 'مساهمة رأس مال',
        emptyIcon: 'bi-piggy-bank', emptyText: 'لا توجد مساهمات رأس مال مسجلة بعد'
    });
};

Pages.advances = function (container) {
    renderTransactionsPage(container, {
        title: 'سلف الشركاء', icon: 'bi-arrow-left-right', typeFilter: ['سلفة شريك','سداد سلفة'],
        emptyIcon: 'bi-arrow-left-right', emptyText: 'لا توجد سلف مسجلة بعد',
        extraTop: renderAdvancesSummary()
    });
};

function renderAdvancesSummary() {
    const partners = DataService.getPartners();
    const cards = partners.map(p => {
        const adv = DataService.getAdvancesByPartner(p.name);
        const repaid = DataService.getRepaymentsByPartner(p.name);
        const balance = adv - repaid;
        return `
        <div class="col-md-6">
            <div class="kpi-card">
                <div class="kpi-icon bg-soft-info"><i class="bi bi-person"></i></div>
                <div class="kpi-label">رصيد سلفة ${p.name}</div>
                <div class="kpi-value money">${Utils.formatMoney(balance)}</div>
                <div class="kpi-sub">إجمالي السلفة ${Utils.formatMoney(adv)} — مسدد ${Utils.formatMoney(repaid)}</div>
            </div>
        </div>`;
    }).join('');
    return `<div class="row g-3 mb-3">${cards}</div>`;
}

Pages.settlements = function (container) {
    renderTransactionsPage(container, {
        title: 'التسويات', icon: 'bi-shuffle', typeFilter: 'تسوية',
        emptyIcon: 'bi-shuffle', emptyText: 'لا توجد تسويات مسجلة بعد'
    });
};

Pages.distributions = function (container) {
    const currentMonth = Utils.monthKey(Utils.todayISO());
    const settings = DataService.getSettings();
    const calc = DataService.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });
    const partners = DataService.getPartners();

    const summaryHtml = `
    <div class="app-card mb-3">
        <div class="app-card-header"><h2><i class="bi bi-cash-coin me-1 text-teal"></i>توزيع أرباح ${Utils.monthLabel(currentMonth)}</h2></div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الشهر</th><th>الأرباح القابلة للتوزيع</th>${partners.map(p=>`<th>نصيب ${p.name}</th>`).join('')}<th>المدفوع</th><th>المتبقي</th><th>الحالة</th></tr></thead>
                    <tbody>
                        <tr>
                            <td>${Utils.monthLabel(currentMonth)}</td>
                            <td class="money">${Utils.formatMoney(calc.distributable)}</td>
                            ${partners.map(p => `<td class="money">${Utils.formatMoney(calc.shares[p.name]||0)}</td>`).join('')}
                            <td class="money">${Utils.formatMoney(partners.reduce((s,p)=>s+DataService.getDistributionsPaidByPartner(p.name),0))}</td>
                            <td class="money">${Utils.formatMoney(calc.distributable - partners.reduce((s,p)=>s+DataService.getDistributionsPaidByPartner(p.name),0))}</td>
                            <td>${statusBadge(DataService.isMonthClosed(currentMonth) ? 'مغلق' : 'قيد المراجعة')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    renderTransactionsPage(container, {
        title: 'سجل التوزيعات', icon: 'bi-cash-coin', typeFilter: 'توزيع أرباح',
        emptyIcon: 'bi-cash-coin', emptyText: 'لم تُدفع أي توزيعات بعد',
        extraTop: summaryHtml
    });
};

Pages.treasury = function (container) {
    const cash = DataService.getCashBalance();
    const inflow = DataService.getTransactions().filter(t=>!t.reversed && ['إيراد','مساهمة رأس مال','سلفة شريك','سداد سلفة'].includes(t.type)).reduce((s,t)=>s+t.amount,0);
    const outflow = DataService.getExpensesTotalAllTime() + DataService.getPartners().reduce((s,p)=>s+DataService.getDistributionsPaidByPartner(p.name),0);

    const summaryHtml = `
    <div class="row g-3 mb-3">
        ${kpiCard({ icon:'bi-wallet2', label:'الرصيد النقدي الحالي', value: Utils.formatMoney(cash), colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-arrow-down-circle', label:'إجمالي الداخل', value: Utils.formatMoney(inflow), colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-arrow-up-circle', label:'إجمالي الخارج', value: Utils.formatMoney(outflow), colorClass:'bg-soft-danger' })}
    </div>`;

    renderTransactionsPage(container, {
        title: 'حركة الخزينة', icon: 'bi-wallet2', typeFilter: null,
        emptyIcon: 'bi-wallet2', emptyText: 'لا توجد حركات مسجلة',
        extraTop: summaryHtml
    });
};

/* ---------------- سجل العمليات (Activity Log) ---------------- */
Pages.activityLog = function (container) {
    const activities = DataService.getActivities();
    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header">
            <h2><i class="bi bi-clock-history me-1 text-teal"></i>سجل النشاط</h2>
            <input type="text" class="form-control form-control-sm" style="max-width:220px;" id="act-search" placeholder="بحث...">
        </div>
        <div class="app-card-body" id="activity-body"></div>
    </div>`;

    function render() {
        const search = document.getElementById('act-search').value.trim().toLowerCase();
        let list = activities;
        if (search) list = list.filter(a => (a.action + a.entity + a.user).toLowerCase().includes(search));
        const box = document.getElementById('activity-body');
        if (!list.length) { box.innerHTML = emptyState('bi-clock-history', 'لا توجد نشاطات مطابقة'); return; }
        box.innerHTML = list.map(a => `
            <div class="activity-item">
                <div class="activity-avatar">${a.user.charAt(0)}</div>
                <div class="flex-grow-1">
                    <div style="font-size:13.5px;"><b>${a.user}</b> ${a.action}</div>
                    <div class="text-muted" style="font-size:12px;">${a.entity||''} ${a.amount ? '· '+Utils.formatMoney(a.amount) : ''}</div>
                </div>
                <div class="text-muted" style="font-size:11px; white-space:nowrap;">${new Date(a.timestamp).toLocaleString('ar-SD',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'numeric'})}</div>
            </div>
        `).join('');
    }
    document.getElementById('act-search').addEventListener('input', render);
    render();
};

/* ---------------- الموافقات ---------------- */
Pages.approvals = function (container) {
    const settings = DataService.getSettings();
    const limit = Number(settings.approvalLimit) || 1000000;

    function render() {
        // البنود التي تتجاوز حد الموافقة ولم تُعتمد أو تُرفض أو تُحدد توزيعها بعد
        const pending = DataService.getExpenses().filter(e =>
            !e.reversed && e.status !== 'مرفوض' && !e.approved &&
            (e.amount >= limit || e.needsAllocation)
        );

        container.innerHTML = `
        <div class="app-card mb-3">
            <div class="app-card-body">
                <p class="text-muted mb-0" style="font-size:13px;">
                    <i class="bi bi-info-circle text-teal me-1"></i>
                    أي مصروف يتجاوز <b>${Utils.formatMoney(limit)}</b> (يمكن تغيير هذا الحد من الإعدادات)، أو يحتاج تحديد كم منه للمشروع وكم شخصي، يظهر هنا لمراجعته قبل اعتماده نهائياً.
                </p>
            </div>
        </div>
        <div class="app-card">
            <div class="app-card-header">
                <h2><i class="bi bi-patch-check me-1 text-teal"></i>بحاجة لمراجعتك</h2>
                <span class="badge-soft bg-soft-warning">${pending.length} بند</span>
            </div>
            <div class="app-card-body">
                ${pending.length ? `
                <div class="table-responsive"><table class="table table-app mb-0">
                    <thead><tr><th>التاريخ</th><th>البيان</th><th>الفئة</th><th>المبلغ</th><th>السبب</th><th></th></tr></thead>
                    <tbody>${pending.map(e => `
                        <tr>
                            <td>${e.date}</td><td>${Utils.escapeHtml(e.description)}</td><td>${e.category}</td>
                            <td class="money">${Utils.formatMoney(e.amount)}</td>
                            <td>${e.needsAllocation ? 'يحتاج تحديد كم منه للمشروع وكم شخصي' : `أكبر من حد الموافقة (${Utils.formatMoney(limit)})`}</td>
                            <td class="text-nowrap">
                                ${e.needsAllocation ? `<a href="#/finance" class="btn btn-sm btn-light border">تحديد التوزيع أولاً</a>` : `
                                <button class="btn btn-sm btn-brand approve-exp-btn" data-id="${e.id}">اعتماد</button>
                                <button class="btn btn-sm btn-light border reject-exp-btn" data-id="${e.id}">رفض</button>`}
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table></div>` : emptyState('bi-patch-check', 'لا توجد بنود بانتظار الموافقة حالياً')}
            </div>
        </div>`;

        container.querySelectorAll('.approve-exp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                DataService.approveExpense(btn.dataset.id);
                showToast('تم اعتماد المصروف', 'success');
                render();
            });
        });
        container.querySelectorAll('.reject-exp-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('سيتم رفض هذا المصروف ولن يُحتسب ضمن مصروفات المشروع، لكنه يبقى محفوظاً في السجل. هل تريد المتابعة؟', () => {
                    DataService.rejectExpense(btn.dataset.id);
                    showToast('تم رفض المصروف', 'warning');
                    render();
                });
            });
        });
    }
    render();
};

/* ---------------- النزاعات ---------------- */
Pages.disputes = function (container) {
    const disputed = DataService.getExpenses().filter(e => !e.reversed && e.needsAllocation && !e.chargedAmount);
    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-exclamation-diamond me-1 text-teal"></i>النزاعات وبنود التوزيع غير المحسومة</h2></div>
        <div class="app-card-body">
            ${disputed.length ? `
            <div class="table-responsive"><table class="table table-app mb-0">
                <thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ الكلي</th><th>الملاحظة</th><th></th></tr></thead>
                <tbody>${disputed.map(e => `
                    <tr>
                        <td>${e.date}</td><td>${Utils.escapeHtml(e.description)}</td>
                        <td class="money">${Utils.formatMoney(e.amount)}</td>
                        <td class="text-muted" style="font-size:12.5px;">هذا البند لم يُحدَّد بعد ما هو المبلغ المحمَّل على الداخلية مقابل الجزء الشخصي</td>
                        <td><a href="#/expenses" class="btn btn-sm btn-brand">تحديد التوزيع</a></td>
                    </tr>`).join('')}
                </tbody>
            </table></div>` : emptyState('bi-check2-circle', 'لا توجد نزاعات أو بنود توزيع معلقة')}
        </div>
    </div>`;
};
