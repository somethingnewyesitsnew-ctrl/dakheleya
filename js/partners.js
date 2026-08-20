/* ==========================================================================
   partners.js — صفحة الشركاء وكشف الحساب
   ========================================================================== */

Pages.partners = function (container) {
    const partners = DataService.getPartners();

    container.innerHTML = `
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

    const tbody = document.querySelector('#partners-table tbody');
    tbody.innerHTML = partners.map(p => {
        const capital = DataService.getContributionsByPartner(p.name);
        const advances = DataService.getAdvancesByPartner(p.name);
        const repaid = DataService.getRepaymentsByPartner(p.name);
        const earnedProfit = calc.shares[p.name] || 0;
        const balance = (advances - repaid);
        return `
        <tr>
            <td class="fw-bold">${p.name}</td>
            <td>${p.ownership}%</td>
            <td class="money">${Utils.formatMoney(capital)}</td>
            <td class="money">${Utils.formatMoney(advances)}</td>
            <td class="money">${Utils.formatMoney(repaid)}</td>
            <td class="money text-success">${Utils.formatMoney(earnedProfit)}</td>
            <td class="money text-danger">${Utils.formatMoney(balance)}</td>
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
        const balance = advances - repaid;
        const earnedProfit = calc.shares[p.name] || 0;
        const received = DataService.getDistributionsPaidByPartner(p.name);
        document.getElementById(`partner-mini-${p.id}`).innerHTML = `
            <div class="row g-3">
                <div class="col-6"><div class="text-muted" style="font-size:12px;">رأس المال</div><div class="fw-bold money">${Utils.formatMoney(capital)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">السلف</div><div class="fw-bold money">${Utils.formatMoney(advances)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">المسدد</div><div class="fw-bold money">${Utils.formatMoney(repaid)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">الرصيد المستحق</div><div class="fw-bold money text-danger">${Utils.formatMoney(balance)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستحقة</div><div class="fw-bold money text-success">${Utils.formatMoney(earnedProfit)}</div></div>
                <div class="col-6"><div class="text-muted" style="font-size:12px;">الأرباح المستلمة</div><div class="fw-bold money">${Utils.formatMoney(received)}</div></div>
            </div>
            <button class="btn btn-brand btn-sm w-100 mt-3 statement-btn" data-name="${p.name}">عرض كشف الحساب</button>
        `;
        document.querySelectorAll(`#partner-mini-${p.id} .statement-btn`).forEach(btn => btn.addEventListener('click', () => openStatementModal(p.name)));
    });
};

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
