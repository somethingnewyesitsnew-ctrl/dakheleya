/* ==========================================================================
   app.js — الهيكل العام للتطبيق: التوجيه، الشريط الجانبي، الرأس، النوافذ المشتركة
   ========================================================================== */

const Pages = {}; // كل صفحة تسجل نفسها هنا: Pages.dashboard = function(container) {...}

// الشريط الجانبي مبسّط: 9 عناصر فقط، كل واحد صفحة "مجمّعة" بتابات داخلية
const ROUTES = [
    { hash: '#/dashboard', title: 'لوحة التحكم', eyebrow: 'نظرة عامة', icon: 'bi-grid-1x2', page: 'dashboard' },
    { hash: '#/partnership', title: 'الشراكة', eyebrow: 'الشركاء والأرباح', icon: 'bi-people', page: 'partnership' },
    { hash: '#/dormitory', title: 'الداخلية', eyebrow: 'الغرف والطالبات', icon: 'bi-building', page: 'dormitory' },
    { hash: '#/finance', title: 'المالية', eyebrow: 'الإيرادات والمصروفات', icon: 'bi-cash-coin', page: 'finance' },
    { hash: '#/setup', title: 'التأسيس والتجهيز', eyebrow: 'الميزانية والأصول', icon: 'bi-bar-chart-steps', page: 'setup' },
    { hash: '#/review', title: 'المراجعة', eyebrow: 'الإغلاق والسجلات', icon: 'bi-clipboard-check', page: 'review' },
    { hash: '#/tools', title: 'الأدوات', eyebrow: 'محاكاة وعقود', icon: 'bi-tools', page: 'tools' },
    { hash: '#/reports', title: 'التقارير', eyebrow: 'تحليلات', icon: 'bi-file-earmark-bar-graph', page: 'reports' },
    { hash: '#/settings', title: 'الإعدادات', eyebrow: 'ضبط النظام', icon: 'bi-gear', page: 'settings' }
];

// روابط قديمة/فرعية تُحوَّل تلقائياً للصفحة المجمّعة المناسبة، حتى لا ينكسر أي رابط داخلي
const LEGACY_ALIASES = {
    '#/partners': '#/partnership', '#/capital': '#/partnership', '#/advances': '#/partnership',
    '#/settlements': '#/partnership', '#/distributions': '#/partnership',
    '#/dorm-overview': '#/dormitory', '#/rooms': '#/dormitory', '#/beds': '#/dormitory',
    '#/residents': '#/dormitory', '#/housing': '#/dormitory', '#/collection': '#/dormitory',
    '#/revenue': '#/finance', '#/expenses': '#/finance', '#/recurring-expenses': '#/finance',
    '#/treasury': '#/finance', '#/assets': '#/finance',
    '#/setup-budget': '#/setup', '#/purchases': '#/setup', '#/setup-assets': '#/setup',
    '#/setup-progress': '#/setup', '#/reinvestment': '#/setup',
    '#/month-close': '#/review', '#/activity-log': '#/review', '#/approvals': '#/review', '#/disputes': '#/review',
    '#/simulator': '#/tools', '#/rent-contract': '#/tools'
};

function flattenRoutes() {
    const flat = [];
    ROUTES.forEach(r => {
        if (r.section) flat.push(...r.items);
        else flat.push(r);
    });
    return flat;
}

function findRoute(hash) {
    return flattenRoutes().find(r => r.hash === hash);
}

/* ---------------- بناء الشريط الجانبي (مجموعات قابلة للطي) ---------------- */
function sectionSlug(name) {
    return 'sec-' + name.replace(/\s+/g, '-');
}
function getSidebarState() {
    return StorageService.get(STORAGE_KEYS.uiState) || {};
}
function setSidebarSectionOpen(name, open) {
    const state = getSidebarState();
    state[name] = open;
    StorageService.set(STORAGE_KEYS.uiState, state);
}
function isSidebarSectionOpen(name) {
    const state = getSidebarState();
    return state[name] !== false; // مفتوحة افتراضياً
}

function buildSidebarHTML(activeHash, idSuffix) {
    let html = '';
    ROUTES.forEach(r => {
        if (r.section) {
            const open = isSidebarSectionOpen(r.section);
            const slug = sectionSlug(r.section) + (idSuffix || '');
            const activeInSection = r.items.some(it => it.hash === activeHash);
            html += `
            <div class="nav-section">
                <button class="nav-section-toggle" type="button" data-section="${r.section}" aria-expanded="${open}">
                    <span>${r.section}</span>
                    <i class="bi bi-chevron-down toggle-icon"></i>
                </button>
                <div class="nav-section-items ${open ? 'show' : ''}" id="${slug}">
                    ${r.items.map(item => navItemHTML(item, activeHash)).join('')}
                </div>
            </div>`;
        } else {
            html += navItemHTML(r, activeHash, true);
        }
    });
    return html;
}

function attachSidebarToggleListeners(root) {
    root.querySelectorAll('.nav-section-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemsDiv = btn.nextElementSibling;
            const willOpen = !itemsDiv.classList.contains('show');
            itemsDiv.classList.toggle('show', willOpen);
            btn.setAttribute('aria-expanded', String(willOpen));
            setSidebarSectionOpen(btn.dataset.section, willOpen);
        });
    });
}

function navItemHTML(item, activeHash, topLevel = false) {
    const active = item.hash === activeHash ? 'active' : '';
    const icon = item.icon || 'bi-dot';
    return `<a href="${item.hash}" class="nav-link-item ${topLevel ? 'top-level' : ''} ${active}" data-hash="${item.hash}">
        <i class="bi ${icon}"></i><span>${item.title}</span>
    </a>`;
}

function renderShell() {
    const shell = document.getElementById('app-shell');
    shell.innerHTML = `
        <aside id="sidebar">
            <div class="sidebar-brand">
                <div class="brand-icon"><i class="bi bi-building"></i></div>
                <div>
                    <div class="brand-title">داخلية الطالبات</div>
                    <div class="brand-sub">نظام إدارة الشراكة والداخلية</div>
                </div>
            </div>
            <div class="dev-badge"><i class="bi bi-info-circle me-1"></i> نسخة تجريبية — البيانات محفوظة محلياً على هذا الجهاز</div>
            <nav class="sidebar-nav" id="sidebar-nav"></nav>
        </aside>

        <div id="main-area">
            <header id="top-header">
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-light border d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar">
                        <i class="bi bi-list"></i>
                    </button>
                    <button class="btn btn-light border" id="btn-nav-back" title="رجوع">
                        <i class="bi bi-arrow-right"></i>
                    </button>
                    <div>
                        <div class="page-eyebrow" id="page-eyebrow">نظرة عامة</div>
                        <h1 class="page-title" id="page-title">لوحة التحكم</h1>
                    </div>
                </div>

                <div class="global-search-wrap d-none d-lg-block">
                    <input type="text" class="form-control form-control-sm" id="global-search-input" placeholder="ابحث عن طالبة، غرفة، شريك، معاملة...">
                    <div class="global-search-results d-none" id="global-search-results"></div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <div class="dropdown">
                        <button class="btn btn-light border position-relative" data-bs-toggle="dropdown" title="التنبيهات">
                            <i class="bi bi-bell"></i>
                            <span class="notif-badge d-none" id="notif-badge">0</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end p-2" style="min-width:300px;" id="notif-dropdown"></ul>
                    </div>

                    <div class="dropdown d-none d-md-block">
                        <button class="btn btn-light border dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <span class="activity-avatar" style="width:26px;height:26px;font-size:11px;" id="user-avatar">أ</span>
                            <span id="user-name-label" class="fw-bold" style="font-size:13px;">أيمن</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item switch-user" href="#" data-user="أيمن">تسجيل الدخول كـ أيمن</a></li>
                            <li><a class="dropdown-item switch-user" href="#" data-user="الفاضل">تسجيل الدخول كـ الفاضل</a></li>
                        </ul>
                    </div>

                    <div class="dropdown">
                        <button class="btn btn-brand btn-sm dropdown-toggle d-flex align-items-center gap-1" data-bs-toggle="dropdown">
                            <i class="bi bi-plus-lg"></i><span class="d-none d-sm-inline">إضافة سريعة</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#" id="qa-transaction"><i class="bi bi-receipt me-2"></i>معاملة جديدة</a></li>
                            <li><a class="dropdown-item" href="#" id="qa-resident"><i class="bi bi-person-plus me-2"></i>طالبة جديدة</a></li>
                            <li><a class="dropdown-item" href="#" id="qa-expense"><i class="bi bi-cash-stack me-2"></i>مصروف جديد</a></li>
                            <li><a class="dropdown-item" href="#" id="qa-asset"><i class="bi bi-box-seam me-2"></i>أصل جديد</a></li>
                        </ul>
                    </div>
                </div>
            </header>
            <main id="main-content"></main>
        </div>

        <!-- Mobile offcanvas sidebar -->
        <div class="offcanvas offcanvas-start" tabindex="-1" id="mobileSidebar">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title">القائمة</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body p-0">
                <div class="dev-badge mx-2 mt-2"><i class="bi bi-info-circle me-1"></i> نسخة تجريبية — بيانات محلية فقط</div>
                <nav class="sidebar-nav" id="sidebar-nav-mobile"></nav>
            </div>
        </div>

        <div id="toast-container" class="toast-container position-fixed bottom-0 start-0 p-3" style="z-index: 1200;"></div>
        <div id="modal-root"></div>
    `;

    document.getElementById('btn-nav-back').addEventListener('click', () => window.history.back());

    document.getElementById('qa-transaction').addEventListener('click', (e) => { e.preventDefault(); openAddTransactionModal(); });
    document.getElementById('qa-resident').addEventListener('click', (e) => { e.preventDefault(); openAddResidentModal(() => router()); });
    document.getElementById('qa-expense').addEventListener('click', (e) => { e.preventDefault(); openAddExpenseModal(() => router()); });
    document.getElementById('qa-asset').addEventListener('click', (e) => { e.preventDefault(); openAddAssetModal(); });

    document.querySelectorAll('.switch-user').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const user = e.currentTarget.dataset.user;
            DataService.saveSettings({ currentUser: user });
            updateUserBadge();
            showToast(`تم تسجيل الدخول كـ ${user}`, 'success');
        });
    });

    setupGlobalSearch();
    updateUserBadge();
}

/* ==========================================================================
   البحث الشامل — يربط كل الوحدات ببعضها (طالبة، غرفة، شريك، معاملة)
   ========================================================================== */
function setupGlobalSearch() {
    const input = document.getElementById('global-search-input');
    const results = document.getElementById('global-search-results');
    if (!input) return;

    function runSearch(q) {
        q = q.trim().toLowerCase();
        if (!q) { results.classList.add('d-none'); results.innerHTML = ''; return; }
        const items = [];

        DataService.getResidents().filter(r => !r.checkOut).forEach(r => {
            if (r.name.toLowerCase().includes(q) || (r.phone||'').includes(q)) {
                items.push({ icon: 'bi-person-badge', label: r.name, sub: `طالبة — ${r.bedId ? DataService.bedLocationLabel(r.bedId) : 'بدون تسكين'}`, action: () => openResidentProfileModal(r.id) });
            }
        });
        DataService.getFloors().forEach(f => {
            if (f.name.toLowerCase().includes(q)) {
                items.push({ icon: 'bi-layers', label: f.name, sub: 'طابق', action: () => { window.location.hash = '#/dormitory'; } });
            }
        });
        DataService.getApartments().forEach(a => {
            if ((a.number||'').toLowerCase().includes(q) || (a.name||'').toLowerCase().includes(q)) {
                items.push({ icon: 'bi-door-open', label: `شقة ${a.number}`, sub: a.name || 'شقة', action: () => openApartmentDetailModal(a.id) });
            }
        });
        DataService.getRooms().forEach(rm => {
            if (rm.number.toLowerCase().includes(q)) {
                const loc = DataService.getRoomLocation(rm.id);
                items.push({ icon: 'bi-door-closed', label: `غرفة ${rm.number}`, sub: `${loc.floor?.name||''} ← شقة ${loc.apartment?.number||''}`, action: () => openRoomModal(rm.id) });
            }
        });
        DataService.getGuests().forEach(g => {
            if (g.name.toLowerCase().includes(q)) {
                items.push({ icon: 'bi-person-heart', label: g.name, sub: `ضيفة عند ${g.hostName}`, action: () => openResidentProfileModal(g.hostResidentId) });
            }
        });
        DataService.getPartners().forEach(p => {
            if (p.name.toLowerCase().includes(q)) {
                items.push({ icon: 'bi-people', label: p.name, sub: `شريك — الملكية ${p.ownership}%`, action: () => openStatementModal(p.name) });
            }
        });
        DataService.getTransactions().slice(0, 300).forEach(t => {
            if (t.description.toLowerCase().includes(q)) {
                items.push({ icon: 'bi-receipt', label: t.description, sub: `معاملة — ${Utils.formatMoney(t.amount)}`, action: () => { window.location.hash = '#/treasury'; } });
            }
        });
        DataService.getExpenses().slice(0, 300).forEach(e => {
            if (e.description.toLowerCase().includes(q)) {
                items.push({ icon: 'bi-cash-stack', label: e.description, sub: `مصروف — ${Utils.formatMoney(e.amount)}`, action: () => { window.location.hash = '#/expenses'; } });
            }
        });

        const top = items.slice(0, 8);
        if (!top.length) {
            results.innerHTML = `<div class="p-3 text-center text-muted" style="font-size:13px;">لا توجد نتائج مطابقة</div>`;
        } else {
            results.innerHTML = top.map((it, idx) => `
                <div class="global-search-item" data-idx="${idx}">
                    <div class="gsi-icon"><i class="bi ${it.icon}"></i></div>
                    <div class="flex-grow-1" style="min-width:0;">
                        <div class="fw-bold text-truncate" style="font-size:13px;">${Utils.escapeHtml(it.label)}</div>
                        <div class="text-muted text-truncate" style="font-size:11.5px;">${it.sub}</div>
                    </div>
                </div>`).join('');
            results.querySelectorAll('.global-search-item').forEach(el => {
                el.addEventListener('click', () => {
                    top[Number(el.dataset.idx)].action();
                    input.value = '';
                    results.classList.add('d-none');
                });
            });
        }
        results.classList.remove('d-none');
    }

    input.addEventListener('input', () => runSearch(input.value));
    input.addEventListener('focus', () => { if (input.value.trim()) runSearch(input.value); });
    document.addEventListener('click', (e) => {
        if (!results.contains(e.target) && e.target !== input) results.classList.add('d-none');
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { results.classList.add('d-none'); input.blur(); } });
}

/* ==========================================================================
   جرس التنبيهات — يعرض عناصر "يحتاج انتباهك" من أي صفحة
   ========================================================================== */
function updateNotifications() {
    const badge = document.getElementById('notif-badge');
    const dropdown = document.getElementById('notif-dropdown');
    if (!badge || !dropdown) return;
    const items = DataService.getAttentionItems();
    if (items.length) {
        badge.textContent = items.length;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
    dropdown.innerHTML = items.length ? items.map(i => `
        <li>
            <a class="dropdown-item d-flex align-items-center gap-2 py-2" href="${i.link}">
                <span class="kpi-icon ${i.color}" style="width:28px;height:28px;font-size:13px;flex-shrink:0;"><i class="bi ${i.icon}"></i></span>
                <span style="font-size:12.5px;white-space:normal;">${i.text}</span>
            </a>
        </li>`).join('') : `<li><div class="p-3 text-center text-muted" style="font-size:13px;">لا توجد تنبيهات حالياً</div></li>`;
}

function updateUserBadge() {
    const user = DataService.getSettings().currentUser || 'أيمن';
    const el = document.getElementById('user-name-label');
    const avatar = document.getElementById('user-avatar');
    if (el) el.textContent = user;
    if (avatar) avatar.textContent = user.charAt(0);
}

/* ---------------- التوجيه (Router) ---------------- */
function router() {
    let hash = window.location.hash || '#/dashboard';
    if (LEGACY_ALIASES[hash]) hash = LEGACY_ALIASES[hash];
    let route = findRoute(hash);
    if (!route) { hash = '#/dashboard'; route = findRoute(hash); }

    // تحديث العنوان
    document.getElementById('page-eyebrow').textContent = route.eyebrow || '';
    document.getElementById('page-title').textContent = route.title;
    document.title = `${route.title} — نظام الداخلية`;

    // تحديث حالة الروابط النشطة
    const navHtml = buildSidebarHTML(hash);
    document.getElementById('sidebar-nav').innerHTML = navHtml;
    document.getElementById('sidebar-nav-mobile').innerHTML = navHtml;

    attachSidebarToggleListeners(document.getElementById('sidebar-nav'));
    attachSidebarToggleListeners(document.getElementById('sidebar-nav-mobile'));

    document.querySelectorAll('#sidebar-nav-mobile a').forEach(a => {
        a.addEventListener('click', () => {
            const oc = bootstrap.Offcanvas.getInstance(document.getElementById('mobileSidebar'));
            if (oc) oc.hide();
        });
    });

    const container = document.getElementById('main-content');
    container.innerHTML = '';

    const renderFn = Pages[route.page];
    if (typeof renderFn === 'function') {
        renderFn(container, route);
    } else {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-tools"></i><div>هذه الصفحة قيد الإنشاء</div></div>`;
    }
    updateNotifications();
    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    DataService.generateDueExpenses();
    DataService.generateDueIncomes();
    renderShell();
    router();
});

/* ==========================================================================
   Toast helper
   ========================================================================== */
function showToast(message, type = 'success') {
    const map = {
        success: { icon: 'bi-check-circle-fill', bg: 'text-bg-success' },
        danger: { icon: 'bi-x-circle-fill', bg: 'text-bg-danger' },
        warning: { icon: 'bi-exclamation-triangle-fill', bg: 'text-bg-warning' },
        info: { icon: 'bi-info-circle-fill', bg: 'text-bg-info' }
    };
    const cfg = map[type] || map.success;
    const id = Utils.uid('toast');
    const el = document.createElement('div');
    el.className = `toast align-items-center ${cfg.bg} border-0`;
    el.id = id;
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body"><i class="bi ${cfg.icon} me-2"></i>${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    document.getElementById('toast-container').appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 3500 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

/* ==========================================================================
   نافذة إضافة معاملة (مشتركة عبر كل الصفحات)
   ========================================================================== */
/* شرح مبسّط لكل نوع معاملة — يظهر تحت القائمة عشان المستخدم غير المتخصص ماليّاً يفهم */
const TX_TYPE_EXPLANATIONS = {
    'إيراد': 'فلوس دخلت فعلاً للمشروع، زي إيجار طالبة أو أي دخل تاني',
    'مصروف': 'فلوس خرجت لتغطية تكلفة تشغيل، زي الكهرباء أو الأكل أو المرتبات',
    'مساهمة رأس مال': 'فلوس يدفعها شريك كاستثمار أساسي في المشروع — لا تُسترجع إلا عند إغلاق الشراكة',
    'سلفة شريك': 'الشريك يُقرض المشروع مبلغاً مؤقتاً، وله الحق في استرجاعه لاحقاً',
    'سداد سلفة': 'المشروع يُرجع للشريك مبلغاً كان قد سلَّفه له سابقاً',
    'توزيع أرباح': 'مبلغ فعلي يُدفع لشريك من نصيبه في صافي الربح',
    'شراء أصل': 'فلوس صُرفت على شراء شيء يبقى ملكاً للمشروع، زي سرير أو أثاث أو معدات',
    'تسوية': 'تصحيح أو توفيق حساب بين طرفين — ليست دخلاً ولا مصروفاً حقيقياً'
};

function openAddTransactionModal(defaults = {}) {
    const partners = DataService.getPartners();
    const modalRoot = document.getElementById('modal-root');
    const id = 'addTransactionModal';
    document.getElementById(id)?.remove();

    const typeOptions = ['إيراد','مصروف','مساهمة رأس مال','سلفة شريك','سداد سلفة','توزيع أرباح','شراء أصل','تسوية'];
    const categoryOptions = {
        'إيراد': ['إيراد سكن وإعاشة','إيراد أخرى'],
        'مصروف': ['الإيجار','المرتبات','الطعام','الكهرباء','المياه','الإنترنت','النظافة','الأمن','الصيانة','التسويق','النقل','المشتريات','القانونية','الأثاث','المعدات','أخرى'],
        'مساهمة رأس مال': ['رأس مال تأسيسي','رأس مال إضافي'],
        'سلفة شريك': ['سلفة للشراكة'],
        'سداد سلفة': ['سداد سلفة شريك'],
        'توزيع أرباح': ['توزيع أرباح شهري'],
        'شراء أصل': ['أصول ثابتة'],
        'تسوية': ['تسوية حسابات']
    };

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-plus-circle me-2 text-teal"></i>معاملة جديدة</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="tx-form">
              <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label fw-bold">التاريخ</label>
                    <input type="date" class="form-control" name="date" value="${defaults.date || Utils.todayISO()}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">نوع المعاملة</label>
                    <select class="form-select" name="type" id="tx-type" required>
                        ${typeOptions.map(t => `<option value="${t}" ${defaults.type===t?'selected':''}>${t}</option>`).join('')}
                    </select>
                    <div class="form-text text-muted" id="tx-type-hint" style="font-size:12px;"></div>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">التصنيف</label>
                    <select class="form-select" name="category" id="tx-category"></select>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">المبلغ (ج.س)</label>
                    <input type="number" class="form-control" name="amount" min="0" step="1000" value="${defaults.amount||''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">الشريك</label>
                    <select class="form-select" name="partner">
                        <option value="">— بدون شريك محدد —</option>
                        ${partners.map(p => `<option value="${p.name}" ${defaults.partner===p.name?'selected':''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">طريقة الدفع</label>
                    <select class="form-select" name="paymentSource">
                        <option>نقدي</option>
                        <option>تحويل بنكي</option>
                        <option>الخزينة</option>
                        <option>محفظة إلكترونية</option>
                    </select>
                </div>
                <div class="col-12">
                    <label class="form-label fw-bold">البيان</label>
                    <input type="text" class="form-control" name="description" placeholder="وصف مختصر للمعاملة" value="${defaults.description||''}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">مرفق (اسم الملف اختياري)</label>
                    <input type="text" class="form-control" name="attachment" placeholder="مثال: ايصال.pdf">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">ملاحظات</label>
                    <input type="text" class="form-control" name="notes" placeholder="ملاحظات إضافية">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-brand" id="tx-save-btn"><i class="bi bi-check-lg me-1"></i>حفظ المعاملة</button>
          </div>
        </div>
      </div>
    </div>`;
    modalRoot.insertAdjacentHTML('beforeend', html);

    const modalEl = document.getElementById(id);
    const modal = new bootstrap.Modal(modalEl);

    function refreshCategories() {
        const type = document.getElementById('tx-type').value;
        const catSelect = document.getElementById('tx-category');
        const cats = categoryOptions[type] || ['عام'];
        catSelect.innerHTML = cats.map(c => `<option ${defaults.category===c?'selected':''}>${c}</option>`).join('');
        document.getElementById('tx-type-hint').textContent = TX_TYPE_EXPLANATIONS[type] || '';
    }
    document.getElementById('tx-type').addEventListener('change', refreshCategories);
    refreshCategories();

    document.getElementById('tx-save-btn').addEventListener('click', () => {
        const form = document.getElementById('tx-form');
        if (!form.reportValidity()) return;
        const fd = new FormData(form);
        const tx = Object.fromEntries(fd.entries());
        if (blockIfMonthClosed(tx.date)) return;
        DataService.addTransaction(tx);
        modal.hide();
        showToast('تم حفظ المعاملة بنجاح', 'success');
        router(); // إعادة رسم الصفحة الحالية لتحديث الأرقام
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
    modal.show();
}

/* ==========================================================================
   أدوات UI مشتركة تُستخدم عبر كل الصفحات
   ========================================================================== */
function kpiCard({ icon, label, value, sub, colorClass, link }) {
    const inner = `
            <div class="kpi-icon ${colorClass || 'bg-soft-teal'}"><i class="bi ${icon}"></i></div>
            <div class="kpi-label">${label}</div>
            <div class="kpi-value money">${value}</div>
            ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}`;
    if (link) {
        return `
        <div class="col-6 col-lg-3">
            <a href="${link}" class="kpi-card kpi-card-link d-block text-decoration-none text-reset">${inner}</a>
        </div>`;
    }
    return `
    <div class="col-6 col-lg-3">
        <div class="kpi-card">${inner}</div>
    </div>`;
}

function statusBadge(status) {
    const map = {
        'مسجلة': 'bg-soft-info', 'مسجل': 'bg-soft-info',
        'مسدد': 'bg-soft-success', 'مدفوع': 'bg-soft-success', 'معتمد': 'bg-soft-success', 'مكتمل': 'bg-soft-success',
        'مستحق': 'bg-soft-warning', 'قيد المراجعة': 'bg-soft-warning', 'يحتاج تحديد التوزيع': 'bg-soft-warning',
        'متأخر': 'bg-soft-danger', 'مختلف عليه': 'bg-soft-danger', 'ملغاة': 'bg-soft-danger', 'ملغى': 'bg-soft-danger',
        'مغلق': 'bg-soft-navy', 'مفتوح': 'bg-soft-info'
    };
    const cls = map[status] || 'bg-soft-navy';
    return `<span class="badge-soft ${cls}">${status}</span>`;
}

function emptyState(icon, text) {
    return `<div class="empty-state"><i class="bi ${icon}"></i><div>${text}</div></div>`;
}

// يمنع أي إضافة أو تعديل على معاملة/مصروف تاريخه داخل شهر تم إغلاقه فعلاً
function blockIfMonthClosed(dateStr) {
    if (DataService.isDateInClosedMonth(dateStr)) {
        const label = Utils.monthLabel(Utils.monthKey(dateStr));
        showToast(`لا يمكن التعديل هنا لأن شهر ${label} مُغلق فعلياً (تمت مراجعته واعتماده). لإجراء أي تصحيح، افتح "المراجعة ← إغلاق الشهر"`, 'danger');
        return true;
    }
    return false;
}

function confirmAction(message, onConfirm, danger = true) {
    const id = 'confirmModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center p-4">
            <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size:38px;"></i>
            <p class="mt-3 mb-0 fw-bold">${message}</p>
          </div>
          <div class="modal-footer justify-content-center border-0 pt-0">
            <button type="button" class="btn btn-light border px-4" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-brand'} px-4" id="confirm-yes-btn">تأكيد</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('confirm-yes-btn').addEventListener('click', () => {
        modal.hide();
        onConfirm();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
