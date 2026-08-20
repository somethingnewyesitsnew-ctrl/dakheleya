/* ==========================================================================
   reports.js — التقارير (مجمّعة في تابات + كشوف حساب ديناميكية حسب الشركاء الحاليين)
   ========================================================================== */

function getReportGroups() {
    const partnerReports = DataService.getPartners().map(p => ({ key: `statement-${p.id}`, title: `كشف حساب ${p.name}`, icon: 'bi-person-lines-fill', partnerName: p.name }));
    return [
        {
            group: 'المالية', icon: 'bi-bar-chart-line',
            desc: 'أرقام المشروع العامة: كم دخل، كم خرج، وكم صافي الربح.',
            items: [
                { key: 'financial', title: 'التقرير المالي', icon: 'bi-bar-chart-line' },
                { key: 'revenue', title: 'تقرير الإيرادات', icon: 'bi-graph-up-arrow' },
                { key: 'expenses', title: 'تقرير المصروفات', icon: 'bi-receipt' },
                { key: 'profit', title: 'تقرير الأرباح', icon: 'bi-cash-coin' }
            ]
        },
        {
            group: 'الشراكة', icon: 'bi-people',
            desc: '<b>كشف الحساب</b> = سجل تفصيلي لكل حركة مالية خاصة بشريك معيّن (مساهماته، سلفه، أرباحه).',
            items: partnerReports.length ? partnerReports : [{ key: 'no-partners', title: 'لا يوجد شركاء بعد', icon: 'bi-people', disabled: true }]
        },
        {
            group: 'الداخلية', icon: 'bi-building',
            desc: 'حالة الطوابق والغرف والأسرة، والأصول اللي المشروع اشتراها، وتقدّم التجهيز.',
            items: [
                { key: 'floors', title: 'تقرير الطوابق', icon: 'bi-layers' },
                { key: 'rooms', title: 'تقرير الغرف', icon: 'bi-door-closed' },
                { key: 'occupancy', title: 'تقرير الإشغال', icon: 'bi-door-open' },
                { key: 'assets', title: 'تقرير الأصول', icon: 'bi-box-seam' },
                { key: 'setup', title: 'تقرير التجهيز', icon: 'bi-bar-chart-steps' }
            ]
        },
        {
            group: 'الطالبات', icon: 'bi-person-badge',
            desc: 'بيانات التسكين، تغييراته، والمتأخرات في الدفع.',
            items: [
                { key: 'residents', title: 'تقرير الطالبات', icon: 'bi-person-badge' },
                { key: 'housing', title: 'تقرير التسكين', icon: 'bi-house-check' },
                { key: 'transfers', title: 'تقرير تغيير التسكين', icon: 'bi-arrow-left-right' },
                { key: 'overdue', title: 'تقرير المتأخرات', icon: 'bi-exclamation-circle' },
                { key: 'collection', title: 'تقرير التحصيل', icon: 'bi-cash-stack' }
            ]
        },
        {
            group: 'الضيفات والخدمات', icon: 'bi-stars',
            desc: 'إيرادات الاستضافة والخدمات الإضافية، والإجازات.',
            items: [
                { key: 'guests', title: 'تقرير الضيفات', icon: 'bi-person-heart' },
                { key: 'services', title: 'تقرير الخدمات', icon: 'bi-stars' },
                { key: 'vacations', title: 'تقرير الإجازات', icon: 'bi-airplane' },
                { key: 'revenue-by-service', title: 'الإيرادات حسب الخدمة', icon: 'bi-pie-chart' }
            ]
        },
        {
            group: 'العمليات', icon: 'bi-clock-history',
            desc: 'من عمل ماذا ومتى — سجل كامل لكل حركة تمت في النظام.',
            items: [
                { key: 'activity', title: 'سجل النشاط', icon: 'bi-clock-history' }
            ]
        }
    ];
}

Pages.reports = function (container) {
    const groups = getReportGroups();

    container.innerHTML = `
    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
        ${groups.map((g, i) => `<li class="nav-item"><button class="nav-link ${i===0?'active':''}" data-bs-toggle="pill" data-bs-target="#rep-${i}" type="button"><i class="bi ${g.icon} me-1"></i>${g.group}</button></li>`).join('')}
    </ul>
    <div class="tab-content">
        ${groups.map((g, i) => `<div class="tab-pane fade ${i===0?'show active':''}" id="rep-${i}">
            ${g.desc ? `<div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>${g.desc}</span></div>` : ''}
            <div class="row g-3" id="reports-grid-${i}"></div>
        </div>`).join('')}
    </div>
    <div class="mt-4" id="report-detail"></div>`;

    groups.forEach((g, i) => {
        document.getElementById(`reports-grid-${i}`).innerHTML = g.items.map(r => `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="app-card h-100 ${r.disabled ? '' : 'clickable'} report-tile" data-key="${r.key}" data-partner="${r.partnerName||''}" style="${r.disabled?'opacity:.5;':''}">
                    <div class="app-card-body text-center py-4">
                        <i class="bi ${r.icon} text-teal" style="font-size:26px;"></i>
                        <div class="fw-bold mt-2" style="font-size:13.5px;">${r.title}</div>
                    </div>
                </div>
            </div>
        `).join('');
    });

    document.querySelectorAll('.report-tile').forEach(tile => {
        if (tile.dataset.key === 'no-partners') return;
        tile.addEventListener('click', () => renderReportDetail(tile.dataset.key, tile.dataset.partner));
    });

    // افتح أول تقرير متاح تلقائياً
    const firstTile = document.querySelector('.report-tile:not([data-key="no-partners"])');
    if (firstTile) renderReportDetail(firstTile.dataset.key, firstTile.dataset.partner);
};

function renderReportDetail(key, partnerName) {
    const allItems = getReportGroups().flatMap(g => g.items);
    const def = allItems.find(r => r.key === key) || { title: 'تقرير', icon: 'bi-file-earmark' };
    const box = document.getElementById('report-detail');
    let bodyHtml = '';
    let csvRows = [];

    if (key === 'financial') {
        const revenue = DataService.getRevenueTotalAllTime();
        const expenses = DataService.getExpensesTotalAllTime();
        const capital = DataService.getPartners().reduce((s,p)=>s+DataService.getContributionsByPartner(p.name),0);
        const advances = DataService.getTotalAdvancesAllPartners();
        const cash = DataService.getCashBalance();
        const recurring = DataService.getRecurringMonthlyBurden();
        bodyHtml = simpleKVTable([
            ['الإيرادات', Utils.formatMoney(revenue)],
            ['المصروفات', Utils.formatMoney(expenses)],
            ['العبء الدوري الشهري', Utils.formatMoney(recurring)],
            ['مساهمات رأس المال', Utils.formatMoney(capital)],
            ['سلف الشركاء (صافي)', Utils.formatMoney(advances)],
            ['الرصيد النقدي', Utils.formatMoney(cash)]
        ]);
        csvRows = [['البند','القيمة'], ['الإيرادات',revenue], ['المصروفات',expenses], ['العبء الدوري الشهري',recurring], ['مساهمات رأس المال',capital], ['سلف الشركاء',advances], ['الرصيد النقدي',cash]];
    } else if (key.startsWith('statement-')) {
        const txs = DataService.getTransactions().filter(t => t.partner === partnerName);
        bodyHtml = transactionsTable(txs);
        csvRows = [['التاريخ','البيان','النوع','المبلغ','الحالة'], ...txs.map(t => [t.date,t.description,t.type,t.amount,t.status])];
    } else if (key === 'revenue') {
        const txs = DataService.getTransactions().filter(t => t.type === 'إيراد');
        bodyHtml = transactionsTable(txs);
        csvRows = [['التاريخ','البيان','المبلغ'], ...txs.map(t => [t.date,t.description,t.amount])];
    } else if (key === 'expenses') {
        const exps = DataService.getExpenses();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>التاريخ</th><th>الفئة</th><th>البيان</th><th>المبلغ</th><th>النوع</th></tr></thead>
            <tbody>${exps.map(e=>`<tr><td>${e.date}</td><td>${e.category}</td><td>${Utils.escapeHtml(e.description)}</td><td class="money">${Utils.formatMoney(e.amount)}</td><td>${e.nature}</td></tr>`).join('')}</tbody>
        </table></div>`;
        csvRows = [['التاريخ','الفئة','البيان','المبلغ','النوع'], ...exps.map(e => [e.date,e.category,e.description,e.amount,e.nature])];
    } else if (key === 'occupancy') {
        const occ = DataService.occupancyStats();
        bodyHtml = simpleKVTable([
            ['إجمالي الأسرة', occ.total], ['مشغولة', occ.occupied], ['محجوزة', occ.reserved],
            ['صيانة', occ.maintenance], ['متاحة', occ.available], ['نسبة الإشغال', occ.rate + '%']
        ]);
        csvRows = [['البند','القيمة'], ['إجمالي الأسرة',occ.total], ['مشغولة',occ.occupied], ['محجوزة',occ.reserved], ['صيانة',occ.maintenance], ['متاحة',occ.available], ['نسبة الإشغال',occ.rate]];
    } else if (key === 'assets') {
        const assets = DataService.getAssets();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الاسم</th><th>الكمية</th><th>التكلفة</th><th>الموقع</th></tr></thead>
            <tbody>${assets.map(a=>`<tr><td>${a.name}</td><td>${a.quantity}</td><td class="money">${Utils.formatMoney(a.purchaseCost)}</td><td>${a.location}</td></tr>`).join('')}</tbody>
        </table></div>`;
        csvRows = [['الاسم','الكمية','التكلفة','الموقع'], ...assets.map(a => [a.name,a.quantity,a.purchaseCost,a.location])];
    } else if (key === 'setup') {
        const r = DataService.getReinvestmentSummary();
        bodyHtml = simpleKVTable([
            ['ميزانية التأسيس', Utils.formatMoney(r.setupBudget)],
            ['المصروف حتى الآن', Utils.formatMoney(r.assetsValue)],
            ['المتبقي', Utils.formatMoney(r.remaining)]
        ]);
        csvRows = [['البند','القيمة'], ['ميزانية التأسيس',r.setupBudget], ['المصروف حتى الآن',r.assetsValue], ['المتبقي',r.remaining]];
    } else if (key === 'profit') {
        const monthKey = Utils.monthKey(Utils.todayISO());
        const calc = DataService.calculateProfit(monthKey, { reserve: DataService.getSettings().operatingReserveDefault || 0 });
        const rows = [['الإيرادات', calc.revenue], ['المصروفات التشغيلية', calc.operatingExpenses], ['صافي الربح', calc.netOperatingProfit], ['الأرباح القابلة للتوزيع', calc.distributable]];
        DataService.getPartners().forEach(p => rows.push([`نصيب ${p.name}`, calc.shares[p.name]||0]));
        bodyHtml = simpleKVTable(rows.map(([k,v]) => [k, Utils.formatMoney(v)]));
        csvRows = [['البند','القيمة'], ...rows];
    } else if (key === 'floors') {
        const floors = DataService.getFloors();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الطابق</th><th>شقق</th><th>غرف</th><th>أسرّة</th><th>متاحة</th><th>الإشغال</th></tr></thead>
            <tbody>${floors.map(f => { const s = DataService.getFloorStats(f.id); return `<tr><td>${f.name}</td><td>${s.apartmentsCount}</td><td>${s.roomsCount}</td><td>${s.bedsCount}</td><td>${s.available}</td><td>${s.rate}%</td></tr>`; }).join('') || '<tr><td colspan="6">لا توجد طوابق</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الطابق','شقق','غرف','أسرّة','متاحة','الإشغال'], ...floors.map(f => { const s = DataService.getFloorStats(f.id); return [f.name, s.apartmentsCount, s.roomsCount, s.bedsCount, s.available, s.rate]; })];
    } else if (key === 'rooms') {
        const rooms = DataService.getRooms();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الغرفة</th><th>الموقع</th><th>النوع</th><th>السعر</th><th>الحالة</th></tr></thead>
            <tbody>${rooms.map(r => { const loc = DataService.getRoomLocation(r.id); return `<tr><td>غرفة ${r.number}</td><td>${loc.floor?.name||''} ← شقة ${loc.apartment?.number||''}</td><td>${r.roomType||''}</td><td class="money">${Utils.formatMoney(r.price||0)}</td><td>${DataService.getRoomOccupancyState(r.id)}</td></tr>`; }).join('') || '<tr><td colspan="5">لا توجد غرف</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الغرفة','النوع','السعر','الحالة'], ...rooms.map(r => [r.number, r.roomType, r.price, DataService.getRoomOccupancyState(r.id)])];
    } else if (key === 'residents') {
        const residents = DataService.getResidents().filter(r => !r.checkOut);
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>الموقع</th><th>المستحق الشهري</th><th>حالة الدفع</th></tr></thead>
            <tbody>${residents.map(r => `<tr><td>${r.name}</td><td>${r.phone}</td><td>${r.bedId?DataService.bedLocationLabel(r.bedId):'—'}</td><td class="money">${Utils.formatMoney(DataService.getResidentMonthlyDue(r.id))}</td><td>${r.paymentStatus}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد طالبات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الاسم','الهاتف','الموقع','المستحق الشهري','حالة الدفع'], ...residents.map(r => [r.name, r.phone, r.bedId?DataService.bedLocationLabel(r.bedId):'', DataService.getResidentMonthlyDue(r.id), r.paymentStatus])];
    } else if (key === 'housing') {
        const residents = DataService.getResidents();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الاسم</th><th>تاريخ الدخول</th><th>تاريخ الخروج</th><th>الحالة</th></tr></thead>
            <tbody>${residents.map(r => `<tr><td>${r.name}</td><td>${r.checkIn||''}</td><td>${r.checkOut||'—'}</td><td>${r.status||''}</td></tr>`).join('') || '<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الاسم','تاريخ الدخول','تاريخ الخروج','الحالة'], ...residents.map(r => [r.name, r.checkIn, r.checkOut, r.status])];
    } else if (key === 'transfers') {
        const transfers = DataService.getTransfers();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>التاريخ</th><th>الطالبة</th><th>من</th><th>إلى</th><th>السبب</th></tr></thead>
            <tbody>${transfers.map(t => { const r = DataService.getResident(t.residentId); return `<tr><td>${t.date}</td><td>${r?r.name:''}</td><td style="font-size:11px;">${t.oldLocationLabel}</td><td style="font-size:11px;">${t.newLocationLabel}</td><td>${t.reason}</td></tr>`; }).join('') || '<tr><td colspan="5">لا توجد تغييرات تسكين</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['التاريخ','من','إلى','السبب'], ...transfers.map(t => [t.date, t.oldLocationLabel, t.newLocationLabel, t.reason])];
    } else if (key === 'overdue') {
        const residents = DataService.getResidents().filter(r => !r.checkOut && r.paymentStatus !== 'مسدد');
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>المستحق</th><th>المدفوع</th><th>الحالة</th></tr></thead>
            <tbody>${residents.map(r => `<tr><td>${r.name}</td><td>${r.phone}</td><td class="money">${Utils.formatMoney(DataService.getResidentMonthlyDue(r.id))}</td><td class="money">${Utils.formatMoney(DataService.getResidentTotalPaid(r.id))}</td><td>${r.paymentStatus}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد متأخرات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الاسم','الهاتف','المستحق','المدفوع','الحالة'], ...residents.map(r => [r.name, r.phone, DataService.getResidentMonthlyDue(r.id), DataService.getResidentTotalPaid(r.id), r.paymentStatus])];
    } else if (key === 'collection') {
        const residents = DataService.getResidents().filter(r => !r.checkOut);
        const expected = residents.reduce((s,r) => s + DataService.getResidentMonthlyDue(r.id), 0);
        const collected = residents.filter(r => r.paymentStatus === 'مسدد').reduce((s,r) => s + DataService.getResidentMonthlyDue(r.id), 0);
        bodyHtml = simpleKVTable([['المستحق الكلي', Utils.formatMoney(expected)], ['المحصَّل', Utils.formatMoney(collected)], ['المتبقي', Utils.formatMoney(expected-collected)], ['نسبة التحصيل', (expected?Math.round(collected/expected*100):0)+'%']]);
        csvRows = [['البند','القيمة'], ['المستحق الكلي',expected], ['المحصَّل',collected], ['المتبقي',expected-collected]];
    } else if (key === 'guests') {
        const guests = DataService.getGuests();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الضيفة</th><th>المضيفة</th><th>من</th><th>إلى</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
            <tbody>${guests.map(g => `<tr><td>${g.name}</td><td>${g.hostName}</td><td>${g.checkIn}</td><td>${g.checkOut}</td><td class="money">${Utils.formatMoney(g.total)}</td><td>${g.paymentStatus}</td></tr>`).join('') || '<tr><td colspan="6">لا توجد ضيفات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الضيفة','المضيفة','من','إلى','الإجمالي','الحالة'], ...guests.map(g => [g.name, g.hostName, g.checkIn, g.checkOut, g.total, g.paymentStatus])];
    } else if (key === 'services') {
        const assignments = DataService.getAllResidentServices().filter(a => a.status === 'نشطة');
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الطالبة</th><th>الخدمة</th><th>السعر</th><th>البداية</th></tr></thead>
            <tbody>${assignments.map(a => { const r = DataService.getResident(a.residentId); return `<tr><td>${r?r.name:''}</td><td>${a.serviceName}</td><td class="money">${Utils.formatMoney(a.price)}</td><td>${a.startDate}</td></tr>`; }).join('') || '<tr><td colspan="4">لا توجد اشتراكات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الطالبة','الخدمة','السعر','البداية'], ...assignments.map(a => [DataService.getResident(a.residentId)?.name||'', a.serviceName, a.price, a.startDate])];
    } else if (key === 'vacations') {
        const vacations = DataService.getVacations();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>الطالبة</th><th>البداية</th><th>العودة المتوقعة</th><th>الرسوم</th><th>الحالة</th></tr></thead>
            <tbody>${vacations.map(v => `<tr><td>${v.residentName}</td><td>${v.startDate}</td><td>${v.expectedReturn}</td><td class="money">${Utils.formatMoney(v.fee)}</td><td>${v.status}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد إجازات</td></tr>'}</tbody>
        </table></div>`;
        csvRows = [['الطالبة','البداية','العودة المتوقعة','الرسوم','الحالة'], ...vacations.map(v => [v.residentName, v.startDate, v.expectedReturn, v.fee, v.status])];
    } else if (key === 'revenue-by-service') {
        const txs = DataService.getTransactions().filter(t => !t.reversed && t.type === 'إيراد');
        const byCategory = {};
        txs.forEach(t => { byCategory[t.category] = (byCategory[t.category]||0) + t.amount; });
        const rows = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
        bodyHtml = simpleKVTable(rows.map(([k,v]) => [k, Utils.formatMoney(v)]));
        csvRows = [['الفئة','الإجمالي'], ...rows];
    } else if (key === 'activity') {
        const activities = DataService.getActivities();
        bodyHtml = `<div class="table-responsive"><table class="table table-app mb-0">
            <thead><tr><th>المستخدم</th><th>الإجراء</th><th>البند</th><th>المبلغ</th><th>الوقت</th></tr></thead>
            <tbody>${activities.map(a=>`<tr><td>${a.user}</td><td>${a.action}</td><td>${a.entity}</td><td class="money">${a.amount?Utils.formatMoney(a.amount):'—'}</td><td>${new Date(a.timestamp).toLocaleString('ar-SD')}</td></tr>`).join('')}</tbody>
        </table></div>`;
        csvRows = [['المستخدم','الإجراء','البند','المبلغ','الوقت'], ...activities.map(a => [a.user,a.action,a.entity,a.amount,a.timestamp])];
    }

    box.innerHTML = `
    <div class="app-card">
        <div class="app-card-header">
            <h2><i class="bi ${def.icon} me-1 text-teal"></i>${def.title}</h2>
            <div class="d-flex gap-2">
                <button class="btn btn-light border btn-sm" id="report-print-btn"><i class="bi bi-printer me-1"></i>طباعة</button>
                <button class="btn btn-light border btn-sm" id="report-export-btn"><i class="bi bi-download me-1"></i>تصدير CSV</button>
            </div>
        </div>
        <div class="app-card-body">${bodyHtml || emptyState('bi-inbox','لا توجد بيانات لهذا التقرير')}</div>
    </div>`;

    document.getElementById('report-print-btn').addEventListener('click', () => window.print());
    document.getElementById('report-export-btn').addEventListener('click', () => {
        Utils.csvDownload(`${def.title}.csv`, csvRows);
        showToast('تم تصدير التقرير', 'success');
    });
}

function simpleKVTable(rows) {
    return `<div class="table-responsive"><table class="table table-app mb-0"><tbody>
        ${rows.map(([k,v]) => `<tr><td class="fw-bold" style="width:60%;">${k}</td><td class="money">${v}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function transactionsTable(txs) {
    if (!txs.length) return emptyState('bi-inbox', 'لا توجد بيانات');
    return `<div class="table-responsive"><table class="table table-app mb-0">
        <thead><tr><th>التاريخ</th><th>البيان</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead>
        <tbody>${txs.map(t=>`<tr><td>${t.date}</td><td>${Utils.escapeHtml(t.description)}</td><td>${t.type}</td><td class="money">${Utils.formatMoney(t.amount)}</td><td>${statusBadge(t.status)}</td></tr>`).join('')}</tbody>
    </table></div>`;
}
