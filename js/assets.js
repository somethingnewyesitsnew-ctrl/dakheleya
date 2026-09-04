/* ==========================================================================
   assets.js — الأصول، ميزانية التأسيس، المشتريات، نسبة الإنجاز، إعادة الاستثمار
   ========================================================================== */

const ASSET_CATEGORIES = ['الأسرة','المراتب','الدواليب','المكيفات','المراوح','معدات المطبخ','الأثاث','معدات الأمن','معدات المياه','أخرى'];

Pages.assets = function (container) {
    const assets = DataService.getAssets();
    const totalValue = assets.reduce((s,a) => s + (Number(a.purchaseCost)||0), 0);
    const totalQty = assets.reduce((s,a) => s + (Number(a.quantity)||0), 0);

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-body">
            <p class="text-muted mb-0" style="font-size:13px;"><i class="bi bi-info-circle text-teal me-1"></i>الأصول هي أي شيء اشتراه المشروع ويبقى ملكاً له (أسرة، أثاث، معدات...)، بخلاف المصروفات التي تُستهلك وتنتهي.</p>
        </div>
    </div>
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-box-seam', label:'عدد أنواع الأصول', value: assets.length, colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-stack', label:'إجمالي الكميات', value: Utils.formatNumber(totalQty), colorClass:'bg-soft-info' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'قيمة الأصول الإجمالية', value: Utils.formatMoney(totalValue), colorClass:'bg-soft-gold' })}
    </div>
    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-box-seam me-1 text-teal"></i>الأصول</h2>
            <div class="d-flex gap-2 flex-wrap">
                <input type="text" class="form-control form-control-sm" id="asset-search" placeholder="بحث بالاسم أو الفئة..." style="max-width:200px;">
                <button class="btn btn-brand btn-sm" id="add-asset-btn"><i class="bi bi-plus-lg me-1"></i>أصل جديد</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الاسم</th><th>الفئة</th><th>الكمية</th><th>تكلفة الشراء</th><th>تاريخ الشراء</th><th>دفع بواسطة</th><th>الحالة</th><th>الموقع</th><th></th></tr></thead>
                    <tbody id="assets-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const q = document.getElementById('asset-search').value.trim().toLowerCase();
        const current = DataService.getAssets();
        let list = current;
        if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
        document.getElementById('assets-tbody').innerHTML = list.map(a => `<tr>
            <td class="fw-bold">${a.name}</td><td>${a.category}</td><td>${Utils.formatNumber(a.quantity)}</td>
            <td class="money">${Utils.formatMoney(a.purchaseCost)}</td><td>${a.purchaseDate}</td>
            <td>${a.paidBy}</td><td><span class="badge-soft bg-soft-success">${a.condition}</span></td><td>${a.location}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-light border edit-asset-btn" data-id="${a.id}" title="تعديل"><i class="bi bi-pencil-square text-teal"></i></button>
                <button class="btn btn-sm btn-light border delete-asset-btn" data-id="${a.id}" title="حذف"><i class="bi bi-trash text-danger"></i></button>
            </td>
        </tr>`).join('') || `<tr><td colspan="9">${emptyState('bi-box','لا توجد أصول مطابقة')}</td></tr>`;

        document.querySelectorAll('.edit-asset-btn').forEach(btn => btn.addEventListener('click', () => openAddAssetModal(btn.dataset.id)));
        document.querySelectorAll('.delete-asset-btn').forEach(btn => btn.addEventListener('click', () => {
            confirmAction('سيتم حذف هذا الأصل نهائياً من السجل. هل تريد المتابعة؟', () => {
                DataService.deleteAsset(btn.dataset.id);
                showToast('تم حذف الأصل', 'warning');
                router();
            });
        }));
    }
    document.getElementById('asset-search').addEventListener('input', render);
    render();

    document.getElementById('add-asset-btn').addEventListener('click', () => openAddAssetModal());
};

function openAddAssetModal(editId = null) {
    const id = 'addAssetModal';
    document.getElementById(id)?.remove();
    const existing = editId ? DataService.getAssets().find(a => a.id === editId) : null;
    const v = existing || {};
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi ${editId ? 'bi-pencil-square' : 'bi-box-seam'} me-2 text-teal"></i>${editId ? 'تعديل الأصل' : 'أصل جديد'}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="asset-form">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-bold">اسم الأصل</label><input class="form-control" name="name" value="${v.name||''}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الفئة</label><select class="form-select" name="category">${ASSET_CATEGORIES.map(c=>`<option ${v.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الكمية</label><input type="number" class="form-control" name="quantity" min="1" value="${v.quantity||1}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">تكلفة الشراء الإجمالية</label><input type="number" class="form-control" name="purchaseCost" min="0" value="${v.purchaseCost||''}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ الشراء</label><input type="date" class="form-control" name="purchaseDate" value="${v.purchaseDate || Utils.todayISO()}"></div>
                    <div class="col-md-6"><label class="form-label fw-bold">دفع بواسطة</label><select class="form-select" name="paidBy">${DataService.getPartners().map(p=>`<option ${v.paidBy===p.name?'selected':''}>${p.name}</option>`).join('')}</select></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الحالة</label><select class="form-select" name="condition">${['جيدة','ممتازة','تحتاج صيانة'].map(c=>`<option ${v.condition===c?'selected':''}>${c}</option>`).join('')}</select></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الموقع</label><input class="form-control" name="location" value="${v.location||''}"></div>
                    <div class="col-12"><label class="form-label fw-bold">رقم الإيصال (اختياري)</label><input class="form-control" name="receipt" value="${v.receipt||''}"></div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-asset-btn">${editId ? 'حفظ التعديلات' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-asset-btn').addEventListener('click', () => {
        const form = document.getElementById('asset-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        if (editId) {
            DataService.updateAsset(editId, fd);
            showToast('تم حفظ تعديل الأصل', 'success');
        } else {
            DataService.addAsset(fd);
            showToast('تم إضافة الأصل بنجاح', 'success');
        }
        modal.hide();
        router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- ميزانية التأسيس ---------------- */
Pages.setupBudget = function (container) {
    const r = DataService.getReinvestmentSummary();
    const spent = r.assetsValue;
    const remaining = Math.max(r.setupBudget - spent, 0);
    const pct = r.setupBudget ? Math.min(100, Math.round(spent / r.setupBudget * 100)) : 0;

    container.innerHTML = `
    <div class="row g-3">
        ${kpiCard({ icon:'bi-bar-chart-steps', label:'ميزانية التأسيس', value: Utils.formatMoney(r.setupBudget), colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'المصروف حتى الآن', value: Utils.formatMoney(spent), colorClass:'bg-soft-danger' })}
        ${kpiCard({ icon:'bi-piggy-bank', label:'المتبقي', value: Utils.formatMoney(remaining), colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-box-seam', label:'عدد الأصول', value: DataService.getAssets().length, colorClass:'bg-soft-teal' })}
    </div>
    <div class="app-card mt-3">
        <div class="app-card-header"><h2><i class="bi bi-speedometer2 me-1 text-teal"></i>نسبة الإنجاز</h2></div>
        <div class="app-card-body">
            <div class="d-flex justify-content-between mb-2" style="font-size:13.5px;"><span class="fw-bold">${pct}%</span><span class="text-muted">قيمة الأصول: ${Utils.formatMoney(r.assetsValue)}</span></div>
            <div class="progress" style="height:14px;"><div class="progress-bar bg-brand-teal" style="width:${pct}%"></div></div>
        </div>
    </div>`;
};

Pages.purchases = function (container) {
    const purchaseExpenses = DataService.getExpenses().filter(e => ['المشتريات','الأثاث','المعدات'].includes(e.category));
    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-cart-check me-1 text-teal"></i>المشتريات</h2>
            <button class="btn btn-brand btn-sm" id="add-purchase-btn"><i class="bi bi-plus-lg me-1"></i>مصروف مشتريات جديد</button>
        </div>
        <div class="app-card-body">
            <div class="table-responsive"><table class="table table-app mb-0">
                <thead><tr><th>التاريخ</th><th>الفئة</th><th>البيان</th><th>المبلغ</th><th>دفع بواسطة</th><th>الحالة</th></tr></thead>
                <tbody>
                    ${purchaseExpenses.map(e => `<tr>
                        <td>${e.date}</td><td>${e.category}</td><td>${Utils.escapeHtml(e.description)}</td>
                        <td class="money">${Utils.formatMoney(e.amount)}</td><td>${e.paidBy}</td><td>${statusBadge(e.status)}</td>
                    </tr>`).join('') || `<tr><td colspan="6">${emptyState('bi-cart','لا توجد مشتريات مسجلة بعد')}</td></tr>`}
                </tbody>
            </table></div>
        </div>
    </div>`;
    document.getElementById('add-purchase-btn').addEventListener('click', () => openAddExpenseModal(() => router()));
};

Pages.setupProgress = function (container) {
    Pages.setupBudget(container);
};

/* ---------------- إعادة استثمار الإيرادات ---------------- */
Pages.reinvestment = function (container) {
    const r = DataService.getReinvestmentSummary();
    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-arrow-repeat me-1 text-teal"></i>الأموال المعاد استثمارها في التجهيز</h2></div>
        <div class="app-card-body">
            <p class="text-muted" style="font-size:13.5px;">اتفق الشركاء على أن جزءاً من إيرادات الطالبات الأولى يُستخدم لاستكمال تجهيز الداخلية. هذا المبلغ لا يُحتسب ضمن توزيعات الأرباح.</p>
            <div class="row g-3 mt-2">
                ${kpiCard({ icon:'bi-cash-stack', label:'إيرادات محصلة', value: Utils.formatMoney(r.revenueCollected), colorClass:'bg-soft-success' })}
                ${kpiCard({ icon:'bi-receipt', label:'مصروفات تشغيلية', value: Utils.formatMoney(r.operatingExpenses), colorClass:'bg-soft-danger' })}
                ${kpiCard({ icon:'bi-arrow-repeat', label:'مبلغ معاد استثماره', value: Utils.formatMoney(r.reinvested), colorClass:'bg-soft-teal' })}
                ${kpiCard({ icon:'bi-piggy-bank', label:'المتبقي من ميزانية التأسيس', value: Utils.formatMoney(r.remaining), colorClass:'bg-soft-gold' })}
            </div>
        </div>
    </div>`;
};
