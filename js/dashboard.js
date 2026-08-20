/* ==========================================================================
   dashboard.js — لوحة تحكم بتابات ورسوم بيانية (Chart.js)
   ========================================================================== */

const CHART_COLORS = {
    teal: '#0e7c7b', tealLight: '#12a3a1', navy: '#0f2a3d', gold: '#c9973f',
    success: '#17864f', danger: '#c8372a', warning: '#a9761c', info: '#1971a8',
    grid: '#eef1f3', text: '#6b7a85'
};
let dashboardCharts = {};

function destroyChart(key) {
    if (dashboardCharts[key]) { dashboardCharts[key].destroy(); delete dashboardCharts[key]; }
}

if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Cairo', sans-serif";
    Chart.defaults.color = CHART_COLORS.text;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.rtl = true;
}

Pages.dashboard = function (container) {
    dashboardCharts = {};
    const settings = DataService.getSettings();
    const currentMonth = Utils.monthKey(Utils.todayISO());
    const occ = DataService.occupancyStats();
    const cash = DataService.getCashBalance();
    const revenueMonth = DataService.getRevenueForMonth(currentMonth);
    const expensesMonth = DataService.getOperatingExpensesForMonth(currentMonth);
    const netProfit = revenueMonth - expensesMonth;
    const profitCalc = DataService.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });
    const totalAdvances = DataService.getTotalAdvancesAllPartners();

    container.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-end mb-3">
        <div>
            <p class="text-muted mb-0" style="font-size:14px;">نظرة عامة على الوضع المالي والتشغيلي للداخلية — ${Utils.monthLabel(currentMonth)}</p>
        </div>
        <div class="d-flex gap-2 mt-2 mt-md-0 flex-wrap" id="quick-actions"></div>
    </div>

    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" id="dashboard-tabs" role="tablist">
        <li class="nav-item"><button class="nav-link active" id="tab-btn-overview" data-bs-toggle="pill" data-bs-target="#tab-overview" type="button"><i class="bi bi-grid-1x2 me-1"></i>نظرة عامة</button></li>
        <li class="nav-item"><button class="nav-link" id="tab-btn-financial" data-bs-toggle="pill" data-bs-target="#tab-financial" type="button"><i class="bi bi-bar-chart-line me-1"></i>المالية</button></li>
        <li class="nav-item"><button class="nav-link" id="tab-btn-occupancy" data-bs-toggle="pill" data-bs-target="#tab-occupancy" type="button"><i class="bi bi-grid-3x3-gap me-1"></i>الإشغال والداخلية</button></li>
        <li class="nav-item"><button class="nav-link" id="tab-btn-partners" data-bs-toggle="pill" data-bs-target="#tab-partners" type="button"><i class="bi bi-people me-1"></i>الشركاء</button></li>
    </ul>

    <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-overview"></div>
        <div class="tab-pane fade" id="tab-financial"></div>
        <div class="tab-pane fade" id="tab-occupancy"></div>
        <div class="tab-pane fade" id="tab-partners"></div>
    </div>
    `;

    renderQuickActions();
    renderOverviewTab({ cash, revenueMonth, expensesMonth, netProfit, profitCalc, occ, totalAdvances, settings, currentMonth });

    document.getElementById('tab-btn-financial').addEventListener('shown.bs.tab', () => renderFinancialTab(currentMonth), { once: true });
    document.getElementById('tab-btn-occupancy').addEventListener('shown.bs.tab', () => renderOccupancyTab(occ), { once: true });
    document.getElementById('tab-btn-partners').addEventListener('shown.bs.tab', () => renderPartnersTab(currentMonth, settings), { once: true });

    // إعادة رسم الرسوم عند تغيير حجم النافذة أو طي/فتح السايدبار (لتفادي مشاكل قياس Chart.js)
    window.addEventListener('resize', () => Object.values(dashboardCharts).forEach(c => c && c.resize()));
};

function renderQuickActions() {
    document.getElementById('quick-actions').innerHTML = `
        <a href="#/residents" class="btn btn-light border btn-sm"><i class="bi bi-person-badge me-1"></i>الطالبات</a>
        <a href="#/expenses" class="btn btn-light border btn-sm"><i class="bi bi-receipt me-1"></i>المصروفات</a>
        <a href="#/simulator" class="btn btn-light border btn-sm"><i class="bi bi-calculator me-1"></i>محاكاة الأرباح</a>
        <a href="#/month-close" class="btn btn-light border btn-sm"><i class="bi bi-calendar-check me-1"></i>إغلاق الشهر</a>
    `;
}

/* ==========================================================================
   تبويب: نظرة عامة
   ========================================================================== */
function renderOverviewTab({ cash, revenueMonth, expensesMonth, netProfit, profitCalc, occ, totalAdvances, settings, currentMonth }) {
    const box = document.getElementById('tab-overview');
    box.innerHTML = `
    <div class="row g-3">
        ${kpiCard({ icon:'bi-wallet2', label:'الرصيد النقدي', value: Utils.formatMoney(cash), colorClass:'bg-soft-navy', link:'#/finance' })}
        ${kpiCard({ icon:'bi-graph-up-arrow', label:'إيرادات الشهر', value: Utils.formatMoney(revenueMonth), colorClass:'bg-soft-success', link:'#/finance' })}
        ${kpiCard({ icon:'bi-graph-down-arrow', label:'مصروفات الشهر', value: Utils.formatMoney(expensesMonth), colorClass:'bg-soft-danger', link:'#/finance' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'صافي الربح', value: Utils.formatMoney(netProfit), colorClass:'bg-soft-teal', link:'#/finance' })}
    </div>
    <div class="row g-3 mt-1">
        ${kpiCard({ icon:'bi-coin', label:'الأرباح القابلة للتوزيع', value: Utils.formatMoney(profitCalc.distributable), colorClass:'bg-soft-gold', sub:'بعد الاحتياطي وإعادة الاستثمار', link:'#/partnership' })}
        ${kpiCard({ icon:'bi-speedometer2', label:'نسبة الإشغال', value: occ.rate + '%', colorClass:'bg-soft-info', link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-door-open', label:'الأسرة المشغولة', value: Utils.formatNumber(occ.occupied), colorClass:'bg-soft-teal', sub:`من أصل ${occ.total} سريراً`, link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-door-closed', label:'الأسرة المتاحة', value: Utils.formatNumber(occ.available), colorClass:'bg-soft-warning', link:'#/dormitory' })}
    </div>
    <div class="row g-3 mt-1">
        ${kpiCard({ icon:'bi-arrow-left-right', label:'إجمالي سلف الشركاء', value: Utils.formatMoney(totalAdvances), colorClass:'bg-soft-navy', sub:'صافي بعد السداد', link:'#/partnership' })}
        ${kpiCard({ icon:'bi-people', label:'عدد الطالبات', value: DataService.getResidents().filter(r=>!r.checkOut).length, colorClass:'bg-soft-info', link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-house-door', label:'عدد الغرف', value: DataService.getRooms().length, colorClass:'bg-soft-teal', link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-file-earmark-text', label:'الإيجار الشهري الحالي', value: Utils.formatMoney(settings.rent||0), colorClass:'bg-soft-gold', link:'#/tools' })}
    </div>

    <div class="section-title"><i class="bi bi-graph-up text-teal"></i>اتجاه الإيرادات والمصروفات (آخر 6 أشهر)</div>
    <div class="app-card"><div class="app-card-body"><div style="height:260px;"><canvas id="chart-overview-trend"></canvas></div></div></div>

    <div class="row g-3 mt-1">
        <div class="col-lg-8">
            <div class="section-title"><i class="bi bi-exclamation-diamond text-teal"></i>يحتاج انتباهك</div>
            <div class="app-card"><div class="app-card-body" id="attention-box"></div></div>
        </div>
        <div class="col-lg-4">
            <div class="section-title"><i class="bi bi-bar-chart-steps text-teal"></i>تقدم التجهيز</div>
            <div class="app-card"><div class="app-card-body" id="setup-progress-box"></div></div>
        </div>
    </div>

    <div class="row g-3 mt-1">
        <div class="col-lg-6">
            <div class="section-title"><i class="bi bi-receipt-cutoff text-teal"></i>آخر المعاملات</div>
            <div class="app-card"><div class="app-card-body" id="recent-transactions"></div></div>
        </div>
        <div class="col-lg-6">
            <div class="section-title"><i class="bi bi-clock-history text-teal"></i>آخر النشاطات</div>
            <div class="app-card"><div class="app-card-body" id="recent-activity"></div></div>
        </div>
    </div>`;

    renderAttentionBox(currentMonth, settings);
    renderSetupProgressBox();
    renderRecentTransactions();
    renderRecentActivity();
    renderOverviewTrendChart();
}

function renderOverviewTrendChart() {
    const canvas = document.getElementById('chart-overview-trend');
    if (!canvas || typeof Chart === 'undefined') return;
    const data = DataService.getMonthlyFinancials(6);
    destroyChart('overviewTrend');
    dashboardCharts.overviewTrend = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                { label: 'الإيرادات', data: data.map(d => d.revenue), borderColor: CHART_COLORS.teal, backgroundColor: 'rgba(14,124,123,.12)', fill: true, tension: .35, pointRadius: 3 },
                { label: 'المصروفات', data: data.map(d => d.expenses), borderColor: CHART_COLORS.danger, backgroundColor: 'rgba(200,55,42,.08)', fill: true, tension: .35, pointRadius: 3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { callback: v => Utils.formatNumber(v) } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { position: 'top', align: 'end' } }
        }
    });
}

/* ==========================================================================
   تبويب: المالية
   ========================================================================== */
function renderFinancialTab(currentMonth) {
    const box = document.getElementById('tab-financial');
    box.innerHTML = `
    <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span><b>الرصيد النقدي</b> = الفلوس المتوفرة فعلياً الآن (وممكن يكون فيها سلف لازم ترجع). <b>العبء الدوري الشهري</b> = مصروفات ثابتة بتتكرر كل شهر (زي الإيجار).</span></div>
    <div class="section-title" style="margin-top:0;"><i class="bi bi-bar-chart-line text-teal"></i>الوضع المالي</div>
    <div class="app-card"><div class="app-card-body"><div class="row g-3" id="financial-summary-grid"></div></div></div>

    <div class="row g-3 mt-1">
        <div class="col-lg-7">
            <div class="section-title"><i class="bi bi-pie-chart text-teal"></i>أعلى فئات المصروفات هذا الشهر</div>
            <div class="app-card"><div class="app-card-body"><div style="height:280px;"><canvas id="chart-expense-category"></canvas></div></div></div>
        </div>
        <div class="col-lg-5">
            <div class="section-title"><i class="bi bi-diagram-3 text-teal"></i>مكوّنات الحركة النقدية</div>
            <div class="app-card"><div class="app-card-body"><div style="height:280px;"><canvas id="chart-cash-composition"></canvas></div></div></div>
        </div>
    </div>`;

    renderFinancialSummary();
    renderExpenseCategoryChart(currentMonth);
    renderCashCompositionChart();
}

function renderFinancialSummary() {
    const revenue = DataService.getRevenueTotalAllTime();
    const expenses = DataService.getExpensesTotalAllTime();
    const capital = DataService.getPartners().reduce((s,p) => s + DataService.getContributionsByPartner(p.name), 0);
    const advances = DataService.getTotalAdvancesAllPartners();
    const distributions = DataService.getPartners().reduce((s,p) => s + DataService.getDistributionsPaidByPartner(p.name), 0);
    const cash = DataService.getCashBalance();
    const capex = DataService.getAssets().reduce((s,a)=>s+(Number(a.purchaseCost)||0),0);
    const recurringBurden = DataService.getRecurringMonthlyBurden();
    const recurringIncome = DataService.getRecurringMonthlyIncome();

    const rows = [
        ['الإيرادات', revenue, 'bg-soft-success', '#/finance'],
        ['المصروفات التشغيلية', expenses, 'bg-soft-danger', '#/finance'],
        ['المصروفات الرأسمالية', capex, 'bg-soft-warning', '#/finance'],
        ['العبء الدوري الشهري', recurringBurden, 'bg-soft-danger', '#/finance'],
        ['الدخل الدوري الشهري', recurringIncome, 'bg-soft-success', '#/finance'],
        ['سلف الشركاء', advances, 'bg-soft-info', '#/partnership'],
        ['مساهمات رأس المال', capital, 'bg-soft-teal', '#/partnership'],
        ['التوزيعات', distributions, 'bg-soft-gold', '#/partnership'],
        ['الرصيد النقدي', cash, 'bg-soft-navy', '#/finance']
    ];
    document.getElementById('financial-summary-grid').innerHTML = rows.map(([label, val, cls, link]) => `
        <div class="col-6 col-md-4 col-lg-3">
            <a href="${link}" class="d-block p-3 rounded-4 ${cls} text-decoration-none text-reset kpi-card-link">
                <div style="font-size:12px;font-weight:700;opacity:.85;">${label}</div>
                <div class="fw-bold money" style="font-size:17px;">${Utils.formatMoney(val)}</div>
            </a>
        </div>
    `).join('');
}

function renderExpenseCategoryChart(currentMonth) {
    const canvas = document.getElementById('chart-expense-category');
    if (!canvas || typeof Chart === 'undefined') return;
    const exps = DataService.getExpenses().filter(e => !e.reversed && e.nature === 'تجاري' && Utils.monthKey(e.date) === currentMonth);
    const byCategory = {};
    exps.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.chargedAmount) || 0); });
    const sorted = Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0, 8);

    destroyChart('expenseCategory');
    if (!sorted.length) {
        canvas.parentElement.innerHTML = emptyState('bi-receipt', 'لا توجد مصروفات مسجلة هذا الشهر');
        return;
    }
    const palette = [CHART_COLORS.teal, CHART_COLORS.gold, CHART_COLORS.info, CHART_COLORS.danger, CHART_COLORS.navy, CHART_COLORS.warning, CHART_COLORS.success, CHART_COLORS.tealLight];
    dashboardCharts.expenseCategory = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sorted.map(([cat]) => cat),
            datasets: [{ label: 'المصروفات', data: sorted.map(([,amt]) => amt), backgroundColor: sorted.map((_,i) => palette[i % palette.length]), borderRadius: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { callback: v => Utils.formatNumber(v) } },
                y: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderCashCompositionChart() {
    const canvas = document.getElementById('chart-cash-composition');
    if (!canvas || typeof Chart === 'undefined') return;
    const revenue = DataService.getRevenueTotalAllTime();
    const capital = DataService.getPartners().reduce((s,p) => s + DataService.getContributionsByPartner(p.name), 0);
    const advances = DataService.getTotalAdvancesAllPartners();
    const expenses = DataService.getExpensesTotalAllTime();
    const distributions = DataService.getPartners().reduce((s,p) => s + DataService.getDistributionsPaidByPartner(p.name), 0);

    const labels = ['الإيرادات', 'مساهمات رأس المال', 'سلف الشركاء', 'المصروفات', 'التوزيعات'];
    const values = [revenue, capital, advances, expenses, distributions];
    destroyChart('cashComposition');
    if (!values.some(v => v > 0)) {
        canvas.parentElement.innerHTML = emptyState('bi-wallet2', 'لا توجد حركة نقدية مسجلة بعد');
        return;
    }
    dashboardCharts.cashComposition = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: [CHART_COLORS.success, CHART_COLORS.teal, CHART_COLORS.info, CHART_COLORS.danger, CHART_COLORS.gold], borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

/* ==========================================================================
   تبويب: الإشغال والداخلية
   ========================================================================== */
function renderOccupancyTab(occ) {
    const box = document.getElementById('tab-occupancy');
    const r = DataService.getReinvestmentSummary();
    const rooms = DataService.getRooms();
    const roomsAvailable = rooms.filter(rm => DataService.getRoomOccupancyState(rm.id) === 'شاغرة بالكامل').length;
    const roomsFull = rooms.filter(rm => DataService.getRoomOccupancyState(rm.id) === 'مشغولة بالكامل').length;
    const roomsPartial = rooms.filter(rm => DataService.getRoomOccupancyState(rm.id) === 'شاغرة جزئياً').length;
    const activeResidents = DataService.getResidents().filter(res => !res.checkOut);
    const onVacation = DataService.getActiveVacations().length;
    const guestsToday = DataService.getGuestsToday().length;
    const overdue = activeResidents.filter(res => res.paymentStatus === 'مستحق' || res.paymentStatus === 'متأخر').length;

    box.innerHTML = `
    <div class="row g-3">
        ${kpiCard({ icon:'bi-grid-3x3-gap', label:'إجمالي الأسرة', value: occ.total, colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-person-fill', label:'مشغول', value: occ.occupied, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-check2-circle', label:'متاح', value: occ.available, colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-speedometer2', label:'نسبة الإشغال', value: occ.rate+'%', colorClass:'bg-soft-info' })}
    </div>
    <div class="row g-3 mt-1">
        ${kpiCard({ icon:'bi-airplane', label:'محجوز للإجازة', value: occ.vacationHold, colorClass:'bg-soft-gold' })}
        ${kpiCard({ icon:'bi-tools', label:'صيانة', value: occ.maintenance, colorClass:'bg-soft-danger' })}
        ${kpiCard({ icon:'bi-door-closed', label:'إجمالي الغرف', value: rooms.length, colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-door-open', label:'غرف شاغرة بالكامل', value: roomsAvailable, colorClass:'bg-soft-success', sub:`${roomsFull} مشغولة بالكامل — ${roomsPartial} شاغرة جزئياً` })}
    </div>
    <div class="row g-3 mt-1">
        ${kpiCard({ icon:'bi-person-badge', label:'الطالبات', value: activeResidents.length, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-airplane', label:'طالبات في إجازة', value: onVacation, colorClass:'bg-soft-gold', link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-person-heart', label:'الضيفات اليوم', value: guestsToday, colorClass:'bg-soft-info', link:'#/dormitory' })}
        ${kpiCard({ icon:'bi-exclamation-circle', label:'المتأخرات بالدفع', value: overdue, colorClass:'bg-soft-danger', link:'#/dormitory' })}
    </div>

    <div class="row g-3 mt-1">
        <div class="col-lg-6">
            <div class="section-title"><i class="bi bi-grid-3x3-gap text-teal"></i>حالة الأسرة</div>
            <div class="app-card"><div class="app-card-body"><div style="height:270px;"><canvas id="chart-occupancy"></canvas></div></div></div>
        </div>
        <div class="col-lg-6">
            <div class="section-title"><i class="bi bi-bar-chart-steps text-teal"></i>تقدم التجهيز</div>
            <div class="app-card">
                <div class="app-card-body">
                    <div style="height:220px;"><canvas id="chart-setup-progress"></canvas></div>
                    <div class="row text-center g-2 mt-2">
                        <div class="col-6"><div class="text-muted" style="font-size:11px;">المصروف</div><div class="fw-bold money">${Utils.formatMoney(r.assetsValue)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:11px;">الميزانية</div><div class="fw-bold money">${Utils.formatMoney(r.setupBudget)}</div></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="section-title"><i class="bi bi-list-check text-teal"></i>تفصيل الأسرة</div>
    <div class="app-card">
        <div class="app-card-body">
            <div class="row text-center g-2">
                <a href="#/dormitory" class="col-3 text-decoration-none text-reset"><div class="fw-bold money" style="font-size:20px;">${occ.occupied}</div><div class="text-muted" style="font-size:12px;">مشغول</div></a>
                <a href="#/dormitory" class="col-3 text-decoration-none text-reset"><div class="fw-bold money" style="font-size:20px;">${occ.reserved}</div><div class="text-muted" style="font-size:12px;">محجوز</div></a>
                <a href="#/dormitory" class="col-3 text-decoration-none text-reset"><div class="fw-bold money" style="font-size:20px;">${occ.maintenance}</div><div class="text-muted" style="font-size:12px;">صيانة</div></a>
                <a href="#/dormitory" class="col-3 text-decoration-none text-reset"><div class="fw-bold money" style="font-size:20px;">${occ.available}</div><div class="text-muted" style="font-size:12px;">متاح</div></a>
            </div>
            <a href="#/dormitory" class="btn btn-light border btn-sm w-100 mt-3">عرض هيكل الداخلية <i class="bi bi-arrow-left-short"></i></a>
        </div>
    </div>`;

    renderOccupancyChart(occ);
    renderSetupProgressChart(r);
}

function renderOccupancyChart(occ) {
    const canvas = document.getElementById('chart-occupancy');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('occupancy');
    if (!occ.total) {
        canvas.parentElement.innerHTML = emptyState('bi-grid-3x3-gap', 'لا توجد أسرة مسجلة بعد');
        return;
    }
    dashboardCharts.occupancy = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['مشغول', 'محجوز', 'صيانة', 'محجوز للإجازة', 'متاح'],
            datasets: [{ data: [occ.occupied, occ.reserved, occ.maintenance, occ.vacationHold||0, occ.available], backgroundColor: [CHART_COLORS.teal, CHART_COLORS.gold, CHART_COLORS.danger, CHART_COLORS.info, '#cfece2'], borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderSetupProgressChart(r) {
    const canvas = document.getElementById('chart-setup-progress');
    if (!canvas || typeof Chart === 'undefined') return;
    destroyChart('setupProgress');
    const pct = r.setupBudget ? Math.min(100, Math.round(r.assetsValue / r.setupBudget * 100)) : 0;
    if (!r.setupBudget) {
        canvas.parentElement.innerHTML = emptyState('bi-bar-chart-steps', 'لم تُحدَّد ميزانية تأسيس بعد');
        return;
    }
    dashboardCharts.setupProgress = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['مكتمل', 'متبقٍ'],
            datasets: [{ data: [pct, 100 - pct], backgroundColor: [CHART_COLORS.teal, CHART_COLORS.grid], borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        },
        plugins: [{
            id: 'centerText',
            afterDraw(chart) {
                const { ctx, chartArea: { left, right, top, bottom } } = chart;
                ctx.save();
                ctx.font = "800 22px Cairo, sans-serif";
                ctx.fillStyle = CHART_COLORS.navy;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pct + '%', (left+right)/2, (top+bottom)/2);
                ctx.restore();
            }
        }]
    });
}

/* ==========================================================================
   تبويب: الشركاء
   ========================================================================== */
function renderPartnersTab(currentMonth, settings) {
    const box = document.getElementById('tab-partners');
    const partners = DataService.getPartners();

    box.innerHTML = `
    <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span><b>الرصيد المستحق</b> = مبلغ السلفة اللي لسه ما اترجعش للشريك. <b>الأرباح المستحقة</b> = نصيب الشريك من الربح لهذا الشهر (لسه ما اتدفعش). <b>الأرباح المستلمة</b> = اللي اتدفع له فعلياً من قبل.</span></div>
    <div class="section-title" style="margin-top:0;"><i class="bi bi-people text-teal"></i>ملخص الشركاء</div>
    <div class="row g-3" id="partner-cards"></div>

    ${partners.length ? `
    <div class="section-title"><i class="bi bi-bar-chart text-teal"></i>مقارنة الشركاء</div>
    <div class="app-card"><div class="app-card-body"><div style="height:300px;"><canvas id="chart-partners-comparison"></canvas></div></div></div>
    ` : ''}`;

    renderPartnerCards(currentMonth, settings);
    if (partners.length) renderPartnersComparisonChart(currentMonth, settings);
}

function renderPartnerCards(currentMonth, settings) {
    const partners = DataService.getPartners();
    const box = document.getElementById('partner-cards');
    if (!partners.length) {
        box.innerHTML = `<div class="col-12">${emptyState('bi-people', 'لا يوجد شركاء مسجلون بعد')}<div class="text-center"><a href="#/settings" class="btn btn-brand btn-sm">إضافة شريك من الإعدادات</a></div></div>`;
        return;
    }
    const profitCalc = DataService.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });

    box.innerHTML = partners.map(p => {
        const contrib = DataService.getContributionsByPartner(p.name);
        const advances = DataService.getAdvancesByPartner(p.name);
        const repaid = DataService.getRepaymentsByPartner(p.name);
        const balance = advances - repaid;
        const earnedProfit = profitCalc.shares[p.name] || 0;
        const receivedProfit = DataService.getDistributionsPaidByPartner(p.name);

        return `
        <div class="col-md-6">
            <div class="app-card h-100">
                <div class="app-card-header">
                    <h2><i class="bi bi-person-circle text-teal me-1"></i> ${p.name}</h2>
                    <span class="badge-soft bg-soft-teal">الملكية ${p.ownership}%</span>
                </div>
                <div class="app-card-body">
                    <div class="row g-3">
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">إجمالي المساهمات</div><div class="fw-bold money">${Utils.formatMoney(contrib)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">إجمالي السلف</div><div class="fw-bold money">${Utils.formatMoney(advances)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">المبالغ المسددة</div><div class="fw-bold money">${Utils.formatMoney(repaid)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">الرصيد المستحق (سلف)</div><div class="fw-bold money text-danger">${Utils.formatMoney(balance)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستحقة (هذا الشهر)</div><div class="fw-bold money text-success">${Utils.formatMoney(earnedProfit)}</div></div>
                        <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستلمة</div><div class="fw-bold money">${Utils.formatMoney(receivedProfit)}</div></div>
                    </div>
                    <a href="#/partners" class="btn btn-light border btn-sm w-100 mt-3">عرض كشف الحساب <i class="bi bi-arrow-left-short"></i></a>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderPartnersComparisonChart(currentMonth, settings) {
    const canvas = document.getElementById('chart-partners-comparison');
    if (!canvas || typeof Chart === 'undefined') return;
    const partners = DataService.getPartners();
    const profitCalc = DataService.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });

    destroyChart('partnersComparison');
    dashboardCharts.partnersComparison = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: partners.map(p => p.name),
            datasets: [
                { label: 'مساهمات رأس المال', data: partners.map(p => DataService.getContributionsByPartner(p.name)), backgroundColor: CHART_COLORS.teal, borderRadius: 6 },
                { label: 'صافي السلف', data: partners.map(p => DataService.getAdvancesByPartner(p.name) - DataService.getRepaymentsByPartner(p.name)), backgroundColor: CHART_COLORS.info, borderRadius: 6 },
                { label: 'الأرباح المستحقة', data: partners.map(p => profitCalc.shares[p.name] || 0), backgroundColor: CHART_COLORS.gold, borderRadius: 6 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: CHART_COLORS.grid }, ticks: { callback: v => Utils.formatNumber(v) } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { position: 'top', align: 'end' } }
        }
    });
}

/* ==========================================================================
   عناصر مشتركة (تُستخدم داخل تبويب النظرة العامة)
   ========================================================================== */
function renderAttentionBox(currentMonth, settings) {
    const box = document.getElementById('attention-box');
    const items = DataService.getAttentionItems();

    box.innerHTML = items.length ? items.map(i => `
        <div class="d-flex align-items-center gap-3 py-2 border-bottom">
            <div class="kpi-icon ${i.color}" style="width:34px;height:34px;font-size:15px;flex-shrink:0;"><i class="bi ${i.icon}"></i></div>
            <div class="flex-grow-1" style="font-size:13.5px;">${i.text}</div>
            <a href="${i.link}" class="btn btn-sm btn-light border text-nowrap">${i.linkText}</a>
        </div>
    `).join('') : emptyState('bi-check2-circle', 'لا يوجد ما يحتاج انتباهك حالياً — كل شيء على ما يرام');
}

function renderSetupProgressBox() {
    const r = DataService.getReinvestmentSummary();
    const pct = r.setupBudget ? Math.min(100, Math.round(r.assetsValue / r.setupBudget * 100)) : 0;
    document.getElementById('setup-progress-box').innerHTML = `
        <div class="d-flex justify-content-between mb-2" style="font-size:13px;">
            <span class="fw-bold">${pct}%</span>
            <span class="text-muted">${Utils.formatMoney(r.assetsValue)} / ${Utils.formatMoney(r.setupBudget)}</span>
        </div>
        <div class="progress mb-3" style="height:10px;"><div class="progress-bar bg-brand-teal" style="width:${pct}%"></div></div>
        <a href="#/setup-budget" class="btn btn-light border btn-sm w-100">تفاصيل التجهيز</a>
    `;
}

function renderRecentTransactions() {
    const txs = DataService.getTransactions().slice(0, 6);
    const box = document.getElementById('recent-transactions');
    if (!txs.length) { box.innerHTML = emptyState('bi-receipt', 'لا توجد معاملات بعد'); return; }
    box.innerHTML = `
    <div class="table-responsive">
        <table class="table table-app mb-0">
            <thead><tr><th>التاريخ</th><th>البيان</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead>
            <tbody>
                ${txs.map(t => `<tr>
                    <td class="text-nowrap">${t.date}</td>
                    <td>${Utils.escapeHtml(t.description)}</td>
                    <td><span class="badge-soft bg-soft-navy">${t.type}</span></td>
                    <td class="money ${t.amount<0?'text-danger':''}">${Utils.formatMoney(t.amount)}</td>
                    <td>${statusBadge(t.status)}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>
    <a href="#/treasury" class="btn btn-light border btn-sm w-100 mt-2">عرض كل المعاملات</a>`;
}

function renderRecentActivity() {
    const activities = DataService.getActivities().slice(0, 6);
    const box = document.getElementById('recent-activity');
    if (!activities.length) { box.innerHTML = emptyState('bi-clock-history', 'لا توجد نشاطات بعد'); return; }
    box.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-avatar">${a.user.charAt(0)}</div>
            <div class="flex-grow-1">
                <div style="font-size:13.5px;"><b>${a.user}</b> ${a.action}</div>
                <div class="text-muted" style="font-size:12px;">${a.entity || ''} ${a.amount ? '· ' + Utils.formatMoney(a.amount) : ''}</div>
            </div>
            <div class="text-muted" style="font-size:11px; white-space:nowrap;">${new Date(a.timestamp).toLocaleString('ar-SD', { day:'numeric', month:'short', hour:'numeric', minute:'numeric' })}</div>
        </div>
    `).join('') + `<a href="#/activity-log" class="btn btn-light border btn-sm w-100 mt-2">عرض كل النشاطات</a>`;
}
