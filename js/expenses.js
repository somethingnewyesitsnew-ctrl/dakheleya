/* ==========================================================================
   expenses.js — المصروفات (تجاري/شخصي، تحديد التوزيع) + الإيرادات
   ========================================================================== */

const EXPENSE_CATEGORIES = ['الإيجار','المرتبات','الطعام','الكهرباء','المياه','الإنترنت','النظافة','الأمن','الصيانة','التسويق','النقل','المشتريات','القانونية','الأثاث','المعدات','أخرى'];

Pages.expenses = function (container) {
    const expenses = DataService.getExpenses();
    const businessTotal = DataService.getExpensesTotalAllTime();
    const personalTotal = expenses.filter(e => !e.reversed && e.nature === 'شخصي').reduce((s,e) => s + e.amount, 0);
    const needsAllocation = expenses.filter(e => !e.reversed && e.needsAllocation && !e.chargedAmount).length;

    container.innerHTML = `
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-receipt', label:'إجمالي المصروفات التجارية', value: Utils.formatMoney(businessTotal), colorClass:'bg-soft-danger' })}
        ${kpiCard({ icon:'bi-person', label:'مصروفات شخصية (خارج الحسابات)', value: Utils.formatMoney(personalTotal), colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-exclamation-triangle', label:'بنود تحتاج تحديد توزيع', value: needsAllocation, colorClass:'bg-soft-warning' })}
    </div>

    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-receipt me-1 text-teal"></i>المصروفات</h2>
            <div class="d-flex gap-2 flex-wrap">
                <select class="form-select form-select-sm" id="exp-cat-filter" style="max-width:150px;">
                    <option value="">كل الفئات</option>
                    ${EXPENSE_CATEGORIES.map(c => `<option>${c}</option>`).join('')}
                </select>
                <select class="form-select form-select-sm" id="exp-nature-filter" style="max-width:130px;">
                    <option value="">تجاري وشخصي</option>
                    <option value="تجاري">تجاري فقط</option>
                    <option value="شخصي">شخصي فقط</option>
                </select>
                <button class="btn btn-brand btn-sm" id="add-expense-btn"><i class="bi bi-plus-lg me-1"></i>مصروف جديد</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr>
                        <th>التاريخ</th><th>الفئة</th><th>البيان</th><th>المبلغ الكلي</th><th>المحمّل على الداخلية</th>
                        <th>النوع</th><th>دفع بواسطة</th><th>الحالة</th><th></th>
                    </tr></thead>
                    <tbody id="expenses-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const cat = document.getElementById('exp-cat-filter').value;
        const nature = document.getElementById('exp-nature-filter').value;
        let list = DataService.getExpenses();
        if (cat) list = list.filter(e => e.category === cat);
        if (nature) list = list.filter(e => e.nature === nature);

        document.getElementById('expenses-tbody').innerHTML = list.map(e => `
            <tr>
                <td class="text-nowrap">${e.date}</td>
                <td>${e.category}</td>
                <td>${Utils.escapeHtml(e.description)}</td>
                <td class="money">${Utils.formatMoney(e.amount)}</td>
                <td class="money ${e.needsAllocation ? 'text-warning' : ''}">${Utils.formatMoney(e.chargedAmount)}</td>
                <td><span class="badge-soft ${e.nature === 'شخصي' ? 'bg-soft-navy' : 'bg-soft-teal'}">${e.nature}</span></td>
                <td>${e.paidBy || '—'}</td>
                <td>${statusBadge(e.status)}</td>
                <td class="text-nowrap">
                    ${e.needsAllocation ? `<button class="btn btn-sm btn-brand allocate-btn" data-id="${e.id}">تحديد التوزيع</button>` : ''}
                    ${e.status !== 'ملغى' ? `<button class="btn btn-sm btn-light border cancel-exp-btn" data-id="${e.id}" data-date="${e.date}" title="إلغاء"><i class="bi bi-x-circle text-danger"></i></button>` : ''}
                </td>
            </tr>`).join('') || `<tr><td colspan="9">${emptyState('bi-receipt','لا توجد مصروفات مطابقة')}</td></tr>`;

        document.querySelectorAll('.allocate-btn').forEach(btn => btn.addEventListener('click', () => openAllocateModal(btn.dataset.id, render)));
        document.querySelectorAll('.cancel-exp-btn').forEach(btn => btn.addEventListener('click', () => {
            if (blockIfMonthClosed(btn.dataset.date)) return;
            confirmAction('لن يتم حذف المصروف نهائياً، سيتم فقط تعليمه كملغى مع الاحتفاظ بالسجل. هل تريد المتابعة؟', () => {
                DataService.cancelExpense(btn.dataset.id, Utils.currentUserName());
                showToast('تم إلغاء المصروف', 'warning');
                render();
            });
        }));
    }
    document.getElementById('exp-cat-filter').addEventListener('change', render);
    document.getElementById('exp-nature-filter').addEventListener('change', render);
    document.getElementById('add-expense-btn').addEventListener('click', () => openAddExpenseModal(render));
    render();
};

function openAddExpenseModal(onSaved) {
    const id = 'addExpenseModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-receipt me-2 text-teal"></i>مصروف جديد</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="expense-form">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-bold">التاريخ</label><input type="date" class="form-control" name="date" value="${Utils.todayISO()}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الفئة</label>
                        <select class="form-select" name="category">${EXPENSE_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">المبلغ الكلي (ج.س)</label><input type="number" class="form-control" name="amount" min="0" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">دفع بواسطة</label>
                        <select class="form-select" name="paidBy">${DataService.getPartners().map(p=>`<option>${p.name}</option>`).join('')}</select>
                    </div>
                    <div class="col-12"><label class="form-label fw-bold">البيان</label><input type="text" class="form-control" name="description" required></div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">نوع المصروف</label>
                        <select class="form-select" name="nature" id="exp-nature-select">
                            <option value="تجاري">تجاري (يدخل في مصروفات الداخلية)</option>
                            <option value="شخصي">شخصي (لا يؤثر على أرباح الداخلية)</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">طريقة الدفع</label>
                        <select class="form-select" name="paymentSource"><option>نقدي</option><option>تحويل بنكي</option><option>الخزينة</option></select>
                    </div>
                    <div class="col-12">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="needs-allocation-check" name="needsAllocation">
                            <label class="form-check-label" for="needs-allocation-check">هذا المصروف مشترك ويحتاج تحديد المبلغ المحمَّل على الداخلية لاحقاً</label>
                        </div>
                    </div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-expense-btn">حفظ المصروف</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-expense-btn').addEventListener('click', () => {
        const form = document.getElementById('expense-form');
        if (!form.reportValidity()) return;
        const fd = new FormData(form);
        const exp = Object.fromEntries(fd.entries());
        if (blockIfMonthClosed(exp.date)) return;
        exp.needsAllocation = !!document.getElementById('needs-allocation-check').checked;
        if (exp.needsAllocation) exp.chargedAmount = 0;
        if (exp.nature === 'شخصي') exp.chargedAmount = 0;
        DataService.addExpense(exp);
        modal.hide();
        showToast('تم حفظ المصروف بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

function openAllocateModal(expenseId, onSaved) {
    const id = 'allocateModal';
    document.getElementById(id)?.remove();
    const exp = DataService.getExpenses().find(e => e.id === expenseId);
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">تحديد توزيع المصروف</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p style="font-size:13.5px;">${Utils.escapeHtml(exp.description)}<br><span class="text-muted">المبلغ الكلي: <b class="money">${Utils.formatMoney(exp.amount)}</b></span></p>
            <label class="form-label fw-bold">كم من هذا المبلغ يخص المشروع؟</label>
            <input type="number" class="form-control mb-2" id="charged-input" min="0" max="${exp.amount}" value="${exp.chargedAmount || ''}">
            <div class="text-muted" style="font-size:12px;">الباقي (${Utils.formatMoney(exp.amount)} − المبلغ الذي تكتبه) يُعتبر تلقائياً مصروفاً شخصياً لصاحبه ولا يُحتسب على المشروع.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-allocate-btn">حفظ التوزيع</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-allocate-btn').addEventListener('click', () => {
        if (blockIfMonthClosed(exp.date)) return;
        const val = Number(document.getElementById('charged-input').value) || 0;
        DataService.updateExpense(expenseId, { chargedAmount: val, needsAllocation: false, status: 'مسجل' });
        modal.hide();
        showToast('تم تحديد توزيع المصروف', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- الإيرادات ---------------- */
Pages.revenue = function (container) {
    const currentMonth = Utils.monthKey(Utils.todayISO());
    const revMonth = DataService.getRevenueForMonth(currentMonth);
    const revAll = DataService.getRevenueTotalAllTime();
    const summary = `<div class="row g-3 mb-3">
        ${kpiCard({ icon:'bi-graph-up-arrow', label:'إيرادات الشهر الحالي', value: Utils.formatMoney(revMonth), colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-cash-stack', label:'إجمالي الإيرادات (كل الفترات)', value: Utils.formatMoney(revAll), colorClass:'bg-soft-teal' })}
    </div>`;
    renderTransactionsPage(container, {
        title: 'الإيرادات', icon: 'bi-graph-up-arrow', typeFilter: 'إيراد',
        emptyIcon: 'bi-graph-up', emptyText: 'لا توجد إيرادات مسجلة بعد',
        extraTop: summary
    });
};
