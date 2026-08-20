/* ==========================================================================
   recurring.js — العمليات الدورية: مصروفات ثابتة دورية + مصادر دخل دورية
   (يومي/أسبوعي/شهري/سنوي/مرة واحدة)
   ========================================================================== */

const RECURRING_FREQUENCIES = ['يومي', 'أسبوعي', 'شهري', 'سنوي', 'مرة واحدة'];
const INCOME_CATEGORIES = ['اشتراك مكتبة', 'اشتراك إنترنت', 'إيراد كافتيريا', 'إيراد مغسلة', 'إيراد إعلانات', 'إيراد سكن وإعاشة', 'إيراد آخر'];

Pages.recurringExpenses = function (container) {
    container.innerHTML = `
    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
        <li class="nav-item"><button class="nav-link active" id="rec-tab-exp" data-bs-toggle="pill" data-bs-target="#rec-pane-exp" type="button"><i class="bi bi-arrow-repeat me-1"></i>مصروفات دورية</button></li>
        <li class="nav-item"><button class="nav-link" id="rec-tab-inc" data-bs-toggle="pill" data-bs-target="#rec-pane-inc" type="button"><i class="bi bi-cash-coin me-1"></i>مصادر دخل دورية</button></li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="rec-pane-exp"></div>
        <div class="tab-pane fade" id="rec-pane-inc"></div>
    </div>`;

    renderRecurringExpensesSection(document.getElementById('rec-pane-exp'));
    document.getElementById('rec-tab-inc').addEventListener('shown.bs.tab', () => {
        renderRecurringIncomesSection(document.getElementById('rec-pane-inc'));
    }, { once: true });
};

/* ==========================================================================
   قسم المصروفات الدورية
   ========================================================================== */
function renderRecurringExpensesSection(container) {
    const templates = DataService.getRecurringExpenses();
    const burden = DataService.getRecurringMonthlyBurden();
    const activeCount = templates.filter(t => t.status === 'نشط').length;
    const pausedCount = templates.filter(t => t.status === 'متوقف').length;
    const currentMonth = Utils.monthKey(Utils.todayISO());
    const revenueMonth = DataService.getRevenueForMonth(currentMonth);
    const burdenPct = revenueMonth ? Math.round(burden / revenueMonth * 100) : 0;
    const annualBurden = burden * 12;

    container.innerHTML = `
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-arrow-repeat', label:'القوالب النشطة', value: activeCount, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-pause-circle', label:'المتوقفة', value: pausedCount, colorClass:'bg-soft-warning' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'العبء الشهري المقدَّر', value: Utils.formatMoney(burden), colorClass:'bg-soft-danger', sub: revenueMonth ? `${burdenPct}% من إيرادات الشهر الحالي` : 'لا توجد إيرادات مسجلة للمقارنة' })}
        ${kpiCard({ icon:'bi-calendar-range', label:'العبء السنوي المقدَّر', value: Utils.formatMoney(annualBurden), colorClass:'bg-soft-navy' })}
    </div>

    <div class="app-card mb-3">
        <div class="app-card-header"><h2><i class="bi bi-graph-down text-teal me-1"></i>أثر المصروفات الدورية على العمل</h2></div>
        <div class="app-card-body">
            <p class="text-muted mb-2" style="font-size:13.5px;">
                القوالب النشطة حالياً تمثّل التزاماً شهرياً متكرراً قدره <b class="money">${Utils.formatMoney(burden)}</b>
                ${revenueMonth ? ` — أي ما يعادل <b>${burdenPct}%</b> من إيرادات الشهر الحالي (${Utils.formatMoney(revenueMonth)}).` : '، ولا توجد إيرادات مسجلة هذا الشهر بعد للمقارنة.'}
            </p>
            <div class="progress" style="height:10px;">
                <div class="progress-bar ${burdenPct>80?'bg-danger':'bg-brand-teal'}" style="width:${Math.min(100,burdenPct)}%"></div>
            </div>
        </div>
    </div>

    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-arrow-repeat me-1 text-teal"></i>القوالب الدورية</h2>
            <div class="d-flex gap-2 flex-wrap">
                <select class="form-select form-select-sm" id="rec-freq-filter" style="max-width:140px;">
                    <option value="">كل الترددات</option>
                    ${RECURRING_FREQUENCIES.map(f => `<option>${f}</option>`).join('')}
                </select>
                <select class="form-select form-select-sm" id="rec-status-filter" style="max-width:130px;">
                    <option value="">كل الحالات</option>
                    <option>نشط</option><option>متوقف</option><option>مكتمل</option>
                </select>
                <select class="form-select form-select-sm" id="rec-nature-filter" style="max-width:120px;">
                    <option value="">تجاري وشخصي</option>
                    <option value="تجاري">تجاري فقط</option>
                    <option value="شخصي">شخصي فقط</option>
                </select>
                <button class="btn btn-brand btn-sm" id="add-recurring-btn"><i class="bi bi-plus-lg me-1"></i>مصروف دوري جديد</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr>
                        <th>البيان</th><th>الفئة</th><th>المبلغ</th><th>التردد</th><th>النوع</th>
                        <th>البداية</th><th>آخر توليد</th><th>الحالة</th><th></th>
                    </tr></thead>
                    <tbody id="recurring-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const freq = document.getElementById('rec-freq-filter').value;
        const status = document.getElementById('rec-status-filter').value;
        const nature = document.getElementById('rec-nature-filter').value;
        let list = DataService.getRecurringExpenses();
        if (freq) list = list.filter(t => t.frequency === freq);
        if (status) list = list.filter(t => t.status === status);
        if (nature) list = list.filter(t => t.nature === nature);

        document.getElementById('recurring-tbody').innerHTML = list.map(t => `
            <tr>
                <td class="fw-bold">${Utils.escapeHtml(t.description)}</td>
                <td>${t.category}</td>
                <td class="money">${Utils.formatMoney(t.amount)}</td>
                <td><span class="badge-soft bg-soft-info">${t.frequency}</span></td>
                <td><span class="badge-soft ${t.nature==='شخصي'?'bg-soft-navy':'bg-soft-teal'}">${t.nature}</span></td>
                <td>${t.startDate}</td>
                <td>${t.lastGeneratedDate || '—'}</td>
                <td>${statusBadge(t.status)}</td>
                <td class="text-nowrap">
                    ${t.status !== 'مكتمل' ? `<button class="btn btn-sm btn-light border toggle-recurring-btn" data-id="${t.id}">${t.status==='نشط'?'إيقاف':'تفعيل'}</button>` : ''}
                    <button class="btn btn-sm btn-light border edit-recurring-btn" data-id="${t.id}" title="تعديل"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-light border delete-recurring-btn" data-id="${t.id}"><i class="bi bi-trash text-danger"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="9">${emptyState('bi-arrow-repeat', 'لا توجد مصروفات دورية بعد — أضف أول قالب')}</td></tr>`;

        document.querySelectorAll('.toggle-recurring-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                DataService.toggleRecurringExpenseStatus(btn.dataset.id);
                showToast('تم تحديث حالة القالب', 'success');
                renderRecurringExpensesSection(container);
            });
        });
        document.querySelectorAll('.edit-recurring-btn').forEach(btn => {
            btn.addEventListener('click', () => openAddRecurringModal(() => renderRecurringExpensesSection(container), btn.dataset.id));
        });
        document.querySelectorAll('.delete-recurring-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('سيتم حذف هذا القالب الدوري. المصروفات التي سبق توليدها ستبقى في السجل المالي. هل تريد المتابعة؟', () => {
                    DataService.removeRecurringExpense(btn.dataset.id);
                    showToast('تم حذف القالب', 'warning');
                    renderRecurringExpensesSection(container);
                });
            });
        });
    }

    document.getElementById('rec-freq-filter').addEventListener('change', render);
    document.getElementById('rec-status-filter').addEventListener('change', render);
    document.getElementById('rec-nature-filter').addEventListener('change', render);
    document.getElementById('add-recurring-btn').addEventListener('click', () => openAddRecurringModal(() => renderRecurringExpensesSection(container)));
    render();
}

function openAddRecurringModal(onSaved, editId) {
    const id = 'addRecurringModal';
    document.getElementById(id)?.remove();
    const categories = (typeof EXPENSE_CATEGORIES !== 'undefined') ? EXPENSE_CATEGORIES : ['الإيجار','المرتبات','الطعام','الكهرباء','المياه','الإنترنت','النظافة','الأمن','الصيانة','التسويق','النقل','المشتريات','القانونية','الأثاث','المعدات','أخرى'];
    const editing = editId ? DataService.getRecurringExpense(editId) : null;

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-arrow-repeat me-2 text-teal"></i>${editing ? 'تعديل مصروف دوري' : 'مصروف دوري جديد'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="recurring-form">
                <div class="row g-3">
                    <div class="col-12"><label class="form-label fw-bold">البيان</label><input class="form-control" name="description" placeholder="مثال: إيجار العقار الشهري" value="${editing ? Utils.escapeHtml(editing.description) : ''}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الفئة</label>
                        <select class="form-select" name="category">${categories.map(c => `<option ${editing && editing.category===c ? 'selected':''}>${c}</option>`).join('')}</select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">المبلغ (لكل مرة)</label><input type="number" class="form-control" name="amount" min="0" value="${editing ? editing.amount : ''}" required></div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">التردد</label>
                        <select class="form-select" name="frequency">
                            ${RECURRING_FREQUENCIES.map(f => `<option ${editing && editing.frequency===f ? 'selected':''}>${f}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">نوع المصروف</label>
                        <select class="form-select" name="nature">
                            <option value="تجاري" ${editing && editing.nature==='تجاري' ? 'selected':''}>تجاري (يدخل في مصروفات الداخلية)</option>
                            <option value="شخصي" ${editing && editing.nature==='شخصي' ? 'selected':''}>شخصي (لا يؤثر على أرباح الداخلية)</option>
                        </select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ البداية</label><input type="date" class="form-control" name="startDate" value="${editing ? editing.startDate : Utils.todayISO()}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ الانتهاء (اختياري)</label><input type="date" class="form-control" name="endDate" value="${editing ? (editing.endDate||'') : ''}"></div>
                    <div class="col-md-6"><label class="form-label fw-bold">دفع/يُدفع بواسطة</label>
                        <select class="form-select" name="paidBy">${DataService.getPartners().map(p => `<option ${editing && editing.paidBy===p.name ? 'selected':''}>${p.name}</option>`).join('')}</select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">طريقة الدفع</label>
                        <select class="form-select" name="paymentSource">
                            ${['نقدي','تحويل بنكي','الخزينة'].map(p => `<option ${editing && editing.paymentSource===p ? 'selected':''}>${p}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="alert alert-light border mt-3 mb-0" style="font-size:12.5px;">
                    <i class="bi bi-info-circle text-teal me-1"></i>
                    سيتم توليد مصروف فعلي تلقائياً في كل مرة يستحق فيها القالب (عند فتح النظام)، ويظهر في سجل المصروفات وتُحتسب أثره على صافي الربح مباشرة.
                    ${editing ? '<br>تعديل القالب لا يغيّر المصروفات التي سبق توليدها، فقط المرات القادمة.' : ''}
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-recurring-btn">${editing ? 'حفظ التعديلات' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-recurring-btn').addEventListener('click', () => {
        const form = document.getElementById('recurring-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        if (editing) {
            DataService.updateRecurringExpense(editId, fd);
            showToast('تم حفظ تعديلات القالب', 'success');
        } else {
            DataService.addRecurringExpense(fd);
            DataService.generateDueExpenses();
            showToast('تم إضافة المصروف الدوري بنجاح', 'success');
        }
        modal.hide();
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ==========================================================================
   قسم مصادر الدخل الدورية (اشتراكات: مكتبة، إنترنت، إلخ)
   ========================================================================== */
function renderRecurringIncomesSection(container) {
    const templates = DataService.getRecurringIncomes();
    const monthlyIncome = DataService.getRecurringMonthlyIncome();
    const activeCount = templates.filter(t => t.status === 'نشط').length;
    const pausedCount = templates.filter(t => t.status === 'متوقف').length;
    const currentMonth = Utils.monthKey(Utils.todayISO());
    const revenueMonth = DataService.getRevenueForMonth(currentMonth);
    const incomePct = revenueMonth ? Math.round(monthlyIncome / revenueMonth * 100) : 0;
    const annualIncome = monthlyIncome * 12;

    container.innerHTML = `
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-arrow-repeat', label:'المصادر النشطة', value: activeCount, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-pause-circle', label:'المتوقفة', value: pausedCount, colorClass:'bg-soft-warning' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'الدخل الشهري المقدَّر', value: Utils.formatMoney(monthlyIncome), colorClass:'bg-soft-success', sub: revenueMonth ? `${incomePct}% من إيرادات الشهر الحالي` : '' })}
        ${kpiCard({ icon:'bi-calendar-range', label:'الدخل السنوي المقدَّر', value: Utils.formatMoney(annualIncome), colorClass:'bg-soft-navy' })}
    </div>

    <div class="app-card mb-3">
        <div class="app-card-header"><h2><i class="bi bi-graph-up text-teal me-1"></i>أثر مصادر الدخل الدورية على العمل</h2></div>
        <div class="app-card-body">
            <p class="text-muted mb-0" style="font-size:13.5px;">
                مصادر الدخل النشطة (مثل اشتراكات المكتبة أو الإنترنت أو أي خدمة إضافية) تضيف دخلاً شهرياً متكرراً قدره
                <b class="money">${Utils.formatMoney(monthlyIncome)}</b> بعيداً عن إيراد إيجار الأسرة الأساسي.
            </p>
        </div>
    </div>

    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-cash-coin me-1 text-teal"></i>مصادر الدخل الدورية</h2>
            <div class="d-flex gap-2 flex-wrap">
                <select class="form-select form-select-sm" id="inc-freq-filter" style="max-width:140px;">
                    <option value="">كل الترددات</option>
                    ${RECURRING_FREQUENCIES.map(f => `<option>${f}</option>`).join('')}
                </select>
                <select class="form-select form-select-sm" id="inc-status-filter" style="max-width:130px;">
                    <option value="">كل الحالات</option>
                    <option>نشط</option><option>متوقف</option><option>مكتمل</option>
                </select>
                <button class="btn btn-brand btn-sm" id="add-income-btn"><i class="bi bi-plus-lg me-1"></i>مصدر دخل جديد</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr>
                        <th>البيان</th><th>الفئة</th><th>المبلغ</th><th>التردد</th>
                        <th>البداية</th><th>آخر توليد</th><th>الحالة</th><th></th>
                    </tr></thead>
                    <tbody id="income-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const freq = document.getElementById('inc-freq-filter').value;
        const status = document.getElementById('inc-status-filter').value;
        let list = DataService.getRecurringIncomes();
        if (freq) list = list.filter(t => t.frequency === freq);
        if (status) list = list.filter(t => t.status === status);

        document.getElementById('income-tbody').innerHTML = list.map(t => `
            <tr>
                <td class="fw-bold">${Utils.escapeHtml(t.description)}</td>
                <td>${t.category}</td>
                <td class="money">${Utils.formatMoney(t.amount)}</td>
                <td><span class="badge-soft bg-soft-info">${t.frequency}</span></td>
                <td>${t.startDate}</td>
                <td>${t.lastGeneratedDate || '—'}</td>
                <td>${statusBadge(t.status)}</td>
                <td class="text-nowrap">
                    ${t.status !== 'مكتمل' ? `<button class="btn btn-sm btn-light border toggle-income-btn" data-id="${t.id}">${t.status==='نشط'?'إيقاف':'تفعيل'}</button>` : ''}
                    <button class="btn btn-sm btn-light border edit-income-btn" data-id="${t.id}" title="تعديل"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-light border delete-income-btn" data-id="${t.id}"><i class="bi bi-trash text-danger"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="8">${emptyState('bi-cash-coin', 'لا توجد مصادر دخل دورية بعد — أضف أول مصدر')}</td></tr>`;

        document.querySelectorAll('.toggle-income-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                DataService.toggleRecurringIncomeStatus(btn.dataset.id);
                showToast('تم تحديث حالة المصدر', 'success');
                renderRecurringIncomesSection(container);
            });
        });
        document.querySelectorAll('.edit-income-btn').forEach(btn => {
            btn.addEventListener('click', () => openAddRecurringIncomeModal(() => renderRecurringIncomesSection(container), btn.dataset.id));
        });
        document.querySelectorAll('.delete-income-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmAction('سيتم حذف مصدر الدخل الدوري هذا. الإيرادات التي سبق توليدها ستبقى في السجل المالي. هل تريد المتابعة؟', () => {
                    DataService.removeRecurringIncome(btn.dataset.id);
                    showToast('تم حذف المصدر', 'warning');
                    renderRecurringIncomesSection(container);
                });
            });
        });
    }

    document.getElementById('inc-freq-filter').addEventListener('change', render);
    document.getElementById('inc-status-filter').addEventListener('change', render);
    document.getElementById('add-income-btn').addEventListener('click', () => openAddRecurringIncomeModal(() => renderRecurringIncomesSection(container)));
    render();
}

function openAddRecurringIncomeModal(onSaved, editId) {
    const id = 'addRecurringIncomeModal';
    document.getElementById(id)?.remove();
    const editing = editId ? DataService.getRecurringIncome(editId) : null;

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-cash-coin me-2 text-teal"></i>${editing ? 'تعديل مصدر دخل دوري' : 'مصدر دخل دوري جديد'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="income-form">
                <div class="row g-3">
                    <div class="col-12"><label class="form-label fw-bold">البيان</label><input class="form-control" name="description" placeholder="مثال: اشتراك مكتبة شهري" value="${editing ? Utils.escapeHtml(editing.description) : ''}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الفئة</label>
                        <select class="form-select" name="category">${INCOME_CATEGORIES.map(c => `<option ${editing && editing.category===c ? 'selected':''}>${c}</option>`).join('')}</select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">المبلغ (لكل مرة)</label><input type="number" class="form-control" name="amount" min="0" value="${editing ? editing.amount : ''}" required></div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">التردد</label>
                        <select class="form-select" name="frequency">
                            ${RECURRING_FREQUENCIES.map(f => `<option ${editing && editing.frequency===f ? 'selected':''}>${f}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">طريقة القبض</label>
                        <select class="form-select" name="paymentSource">
                            ${['نقدي','تحويل بنكي','الخزينة'].map(p => `<option ${editing && editing.paymentSource===p ? 'selected':''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ البداية</label><input type="date" class="form-control" name="startDate" value="${editing ? editing.startDate : Utils.todayISO()}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ الانتهاء (اختياري)</label><input type="date" class="form-control" name="endDate" value="${editing ? (editing.endDate||'') : ''}"></div>
                </div>
                <div class="alert alert-light border mt-3 mb-0" style="font-size:12.5px;">
                    <i class="bi bi-info-circle text-teal me-1"></i>
                    سيتم توليد إيراد فعلي تلقائياً في كل مرة يستحق فيها المصدر (عند فتح النظام)، ويظهر في سجل الإيرادات ويُحتسب في صافي الربح مباشرة.
                    ${editing ? '<br>تعديل المصدر لا يغيّر الإيرادات التي سبق توليدها، فقط المرات القادمة.' : ''}
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-income-btn">${editing ? 'حفظ التعديلات' : 'حفظ'}</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-income-btn').addEventListener('click', () => {
        const form = document.getElementById('income-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        if (editing) {
            DataService.updateRecurringIncome(editId, fd);
            showToast('تم حفظ تعديلات المصدر', 'success');
        } else {
            DataService.addRecurringIncome(fd);
            DataService.generateDueIncomes();
            showToast('تم إضافة مصدر الدخل الدوري بنجاح', 'success');
        }
        modal.hide();
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
