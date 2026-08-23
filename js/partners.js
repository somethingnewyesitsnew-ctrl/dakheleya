/* ==========================================================================
   partners.js — صفحة الشركاء وكشف الحساب
   ========================================================================== */

Pages.partners = function (container) {
    const partners = DataService.getPartners();

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-header">
            <h2><i class="bi bi-piggy-bank me-1 text-teal"></i>مساهمات رأس المال — المطلوب مقابل المسدد</h2>
        </div>
        <div class="app-card-body">
            <p class="text-muted mb-3" style="font-size:12.5px;"><i class="bi bi-info-circle text-teal me-1"></i>
                <b>المساهمة المطلوبة</b> = المبلغ المتفق إن الشريك يدفعه كرأس مال. لو سدّد أكتر من المطلوب،
                الزيادة بتتحول تلقائياً <b>لسلفة / دين على الداخلية</b> لصالحه (زي أي شريك — أو أي شخص تاني —
                دفع فوق نصيبه المطلوب ولازم المشروع يرجّعه له لاحقاً).
            </p>
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الشريك</th><th>المطلوب</th><th>المسدد</th><th>المتبقي</th><th>الحالة</th><th></th></tr></thead>
                    <tbody id="contrib-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="app-card">
        <div class="app-card-header">
            <h2><i class="bi bi-people me-1 text-teal"></i>الشركاء</h2>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0" id="partners-table">
                    <thead><tr>
                        <th>الشريك</th><th>الملكية</th><th>رأس المال</th><th>السلف</th><th>المسدد</th><th>الأرباح المستحقة</th><th>الرصيد</th><th></th>
                    </tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="row g-3 mt-1">
        ${partners.map(p => `
        <div class="col-md-6">
            <div class="app-card">
                <div class="app-card-header"><h2>${p.name}</h2><span class="badge-soft bg-soft-teal">${p.role || 'شريك'}</span></div>
                <div class="app-card-body" id="partner-mini-${p.id}"></div>
            </div>
        </div>`).join('')}
    </div>
    `;

    const currentMonth = Utils.monthKey(Utils.todayISO());
    const settings = DataService.getSettings();
    const calc = DataService.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });

    const contribTbody = document.getElementById('contrib-tbody');
    contribTbody.innerHTML = partners.length ? partners.map(p => {
        const st = DataService.getContributionStatus(p);
        let statusHtml;
        if (st.surplus > 0) {
            statusHtml = `<span class="badge-soft bg-soft-info" title="سدّد أكتر من المطلوب — الفرق ${Utils.formatMoney(st.surplus)} بيُعتبر سلفة/ديناً على الداخلية له">سلفة/دين على الداخلية: ${Utils.formatMoney(st.surplus)}</span>`;
        } else if (st.required === 0) {
            statusHtml = `<span class="badge-soft bg-soft-navy">لم تُحدَّد مساهمة مطلوبة</span>`;
        } else if (st.complete) {
            statusHtml = `<span class="badge-soft bg-soft-success">مكتملة</span>`;
        } else {
            statusHtml = `<span class="badge-soft bg-soft-warning">متبقي عليه</span>`;
        }
        return `
        <tr>
            <td class="fw-bold">${p.name}</td>
            <td class="money">${Utils.formatMoney(st.required)}</td>
            <td class="money text-success">${Utils.formatMoney(st.paid)}</td>
            <td class="money ${st.remaining>0?'text-danger':''}">${Utils.formatMoney(st.remaining)}</td>
            <td>${statusHtml}</td>
            <td><button class="btn btn-sm btn-light border edit-required-btn" data-id="${p.id}" data-name="${p.name}" data-required="${st.required}" title="تعديل قيمة المساهمة المطلوبة"><i class="bi bi-pencil"></i></button></td>
        </tr>`;
    }).join('') : `<tr><td colspan="6">${emptyState('bi-people','لا يوجد شركاء بعد')}</td></tr>`;

    contribTbody.querySelectorAll('.edit-required-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditRequiredContributionModal(btn.dataset.id, btn.dataset.name, btn.dataset.required));
    });

    const tbody = document.querySelector('#partners-table tbody');
    tbody.innerHTML = partners.map(p => {
        const capital = DataService.getContributionsByPartner(p.name);
        const advances = DataService.getAdvancesByPartner(p.name);
        const repaid = DataService.getRepaymentsByPartner(p.name);
        const earnedProfit = calc.shares[p.name] || 0;
        const st = DataService.getContributionStatus(p);
        // الرصيد الكلي المستحق للشريك على الداخلية = صافي السلف الرسمية + أي زيادة سددها فوق مساهمته المطلوبة
        const balance = (advances - repaid) + st.surplus;
        return `
        <tr>
            <td class="fw-bold">${p.name}</td>
            <td>${p.ownership}%</td>
            <td class="money">${Utils.formatMoney(capital)}</td>
            <td class="money">${Utils.formatMoney(advances)}</td>
            <td class="money">${Utils.formatMoney(repaid)}</td>
            <td class="money text-success">${Utils.formatMoney(earnedProfit)}</td>
            <td class="money text-danger" title="صافي السلف الرسمية + أي زيادة مساهمة سددها فوق المطلوب منه">${Utils.formatMoney(balance)}</td>
            <td><button class="btn btn-sm btn-light border statement-btn" data-name="${p.name}">عرض كشف الحساب</button></td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.statement-btn').forEach(btn => {
        btn.addEventListener('click', () => openStatementModal(btn.dataset.name));
    });

    partners.forEach(p => {
        const capital = DataService.getContributionsByPartner(p.name);
        const advances = DataService.getAdvancesByPartner(p.name);
        const repaid = DataService.getRepaymentsByPartner(p.name);
        const st = DataService.getContributionStatus(p);
        const balance = (advances - repaid) + st.surplus;
        const earnedProfit = calc.shares[p.name] || 0;
        const received = DataService.getDistributionsPaidByPartner(p.name);
        document.getElementById(`partner-mini-${p.id}`).innerHTML = `
            <div class="row g-3">
                <div class="col-6"><div class="text-muted" style="font-size:12px;">المساهمة المطلوبة</div><div class="fw-bold money">${Utils.formatMoney(st.required)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">رأس المال المسدد</div><div class="fw-bold money">${Utils.formatMoney(capital)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">متبقي من المساهمة</div><div class="fw-bold money ${st.remaining>0?'text-danger':''}">${Utils.formatMoney(st.remaining)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">السلف</div><div class="fw-bold money">${Utils.formatMoney(advances)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">المسدد من السلف</div><div class="fw-bold money">${Utils.formatMoney(repaid)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;" title="صافي السلف الرسمية + أي زيادة سددها فوق مساهمته المطلوبة">الرصيد المستحق (سلف + فائض مساهمة)</div><div class="fw-bold money text-danger">${Utils.formatMoney(balance)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستحقة</div><div class="fw-bold money text-success">${Utils.formatMoney(earnedProfit)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستلمة</div><div class="fw-bold money">${Utils.formatMoney(received)}</div></div>
            </div>
            <button class="btn btn-brand btn-sm w-100 mt-3 statement-btn" data-name="${p.name}">عرض كشف الحساب</button>
        `;
        document.querySelectorAll(`#partner-mini-${p.id} .statement-btn`).forEach(btn => btn.addEventListener('click', () => openStatementModal(p.name)));
    });
};

function openEditRequiredContributionModal(partnerId, partnerName, currentRequired) {
    const id = 'editRequiredModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-piggy-bank me-2 text-teal"></i>المساهمة المطلوبة — ${partnerName}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <label class="form-label fw-bold">المبلغ الكلي المطلوب من هذا الشريك كرأس مال</label>
            <input type="number" class="form-control" id="required-contribution-input" min="0" value="${currentRequired}">
            <div class="text-muted mt-2" style="font-size:12px;">أي مبلغ يدفعه الشريك أكتر من هذا الرقم سيُعتبر تلقائياً سلفة/ديناً على الداخلية له.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-required-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-required-btn').addEventListener('click', () => {
        const val = Number(document.getElementById('required-contribution-input').value) || 0;
        DataService.updatePartner(partnerId, { requiredContribution: val });
        modal.hide();
        showToast('تم تحديث المساهمة المطلوبة', 'success');
        router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

function openStatementModal(partnerName) {
    const id = 'statementModal';
    document.getElementById(id)?.remove();
    const txs = DataService.getTransactions().filter(t => t.partner === partnerName);
    const total = txs.reduce((s,t) => s + (t.reversed ? 0 : t.amount), 0);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-journal-text me-2 text-teal"></i>كشف حساب — ${partnerName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${txs.length ? `
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>التاريخ</th><th>البيان</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                    <tbody>
                        ${txs.map(t => `<tr>
                            <td>${t.date}</td><td>${Utils.escapeHtml(t.description)}</td>
                            <td><span class="badge-soft bg-soft-navy">${t.type}</span></td>
                            <td class="money ${t.amount<0?'text-danger':''}">${Utils.formatMoney(t.amount)}</td>
                            <td>${statusBadge(t.status)}</td>
                        </tr>`).join('')}
                    </tbody>
                    <tfoot><tr><th colspan="3">الصافي</th><th class="money">${Utils.formatMoney(total)}</th><th></th></tr></tfoot>
                </table>
            </div>` : emptyState('bi-journal-x', 'لا توجد معاملات لهذا الشريك بعد')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" id="statement-print-btn"><i class="bi bi-printer me-1"></i>طباعة</button>
            <button class="btn btn-brand" data-bs-dismiss="modal">إغلاق</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('statement-print-btn').addEventListener('click', () => window.print());
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
