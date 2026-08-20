/* ==========================================================================
   vacations.js — إدارة إجازات الطالبات
   ========================================================================== */

Pages.vacations = function (container) {
    const vacations = DataService.getVacations();
    const active = DataService.getActiveVacations();
    const today = new Date();
    const endingSoon = active.filter(v => {
        const days = Math.ceil((new Date(v.expectedReturn) - today) / (1000*60*60*24));
        return days >= 0 && days <= 3;
    });
    const overdue = active.filter(v => new Date(v.expectedReturn) < today);
    const unpaidFees = vacations.filter(v => v.keepBed && v.paymentStatus !== 'مسدد' && (v.status === 'في إجازة' || v.status === 'معتمدة' || v.status === 'تم تمديدها'));

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-body">
            <p class="text-muted mb-0" style="font-size:13px;"><i class="bi bi-info-circle text-teal me-1"></i>لو الطالبة احتفظت بسريرها أثناء الإجازة، بتدفع نسبة من الإيجار الشهري (25%-100% حسب الاتفاق) بدل السعر الكامل.</p>
        </div>
    </div>

    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-airplane', label:'طالبات في إجازة الآن', value: active.length, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-hourglass-split', label:'إجازات تنتهي خلال 3 أيام', value: endingSoon.length, colorClass:'bg-soft-warning' })}
        ${kpiCard({ icon:'bi-exclamation-triangle', label:'إجازات متأخرة عن العودة', value: overdue.length, colorClass:'bg-soft-danger' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'رسوم إجازة غير مسددة', value: unpaidFees.length, colorClass:'bg-soft-navy' })}
    </div>

    ${(endingSoon.length || overdue.length) ? `
    <div class="app-card mb-3">
        <div class="app-card-header"><h2><i class="bi bi-bell me-1 text-teal"></i>تنبيهات الإجازات</h2></div>
        <div class="app-card-body">
            ${overdue.map(v => `<div class="d-flex align-items-center gap-3 py-2 border-bottom">
                <span class="kpi-icon bg-soft-danger" style="width:32px;height:32px;font-size:14px;"><i class="bi bi-exclamation-triangle"></i></span>
                <div class="flex-grow-1" style="font-size:13px;"><b>${v.residentName}</b> — تجاوزت موعد العودة المتوقع (${v.expectedReturn}) ولم تُسجَّل عودتها</div>
            </div>`).join('')}
            ${endingSoon.map(v => `<div class="d-flex align-items-center gap-3 py-2 border-bottom">
                <span class="kpi-icon bg-soft-warning" style="width:32px;height:32px;font-size:14px;"><i class="bi bi-hourglass-split"></i></span>
                <div class="flex-grow-1" style="font-size:13px;"><b>${v.residentName}</b> — إجازتها تنتهي قريباً (${v.expectedReturn})</div>
            </div>`).join('')}
        </div>
    </div>` : ''}

    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-airplane me-1 text-teal"></i>سجل الإجازات</h2>
            <select class="form-select form-select-sm" id="vac-status-filter" style="max-width:150px;">
                <option value="">كل الحالات</option>
                ${VACATION_STATUSES.map(s => `<option>${s}</option>`).join('')}
            </select>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الطالبة</th><th>البداية</th><th>العودة المتوقعة</th><th>احتفاظ بالسرير</th><th>الرسوم</th><th>الحالة</th><th></th></tr></thead>
                    <tbody id="vacations-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const status = document.getElementById('vac-status-filter').value;
        let list = DataService.getVacations();
        if (status) list = list.filter(v => v.status === status);

        document.getElementById('vacations-tbody').innerHTML = list.map(v => `
            <tr>
                <td class="fw-bold text-teal clickable resident-link" data-id="${v.residentId}">${v.residentName}</td>
                <td>${v.startDate}</td><td>${v.expectedReturn}</td>
                <td>${v.keepBed ? `نعم (${v.percentage}%)` : 'لا'}</td>
                <td class="money">${Utils.formatMoney(v.fee)}</td>
                <td>${statusBadge(v.status)}</td>
                <td class="text-nowrap">
                    ${['في إجازة','معتمدة','تم تمديدها'].includes(v.status) ? `<button class="btn btn-sm btn-light border return-btn" data-id="${v.id}">تسجيل العودة</button>` : ''}
                    ${v.keepBed && v.paymentStatus !== 'مسدد' ? `<button class="btn btn-sm btn-light border pay-btn" data-id="${v.id}">دفع الرسوم</button>` : ''}
                </td>
            </tr>`).join('') || `<tr><td colspan="7">${emptyState('bi-airplane','لا توجد إجازات مسجلة بعد')}</td></tr>`;

        document.querySelectorAll('.resident-link').forEach(el => el.addEventListener('click', () => openResidentProfileModal(el.dataset.id)));
        document.querySelectorAll('.return-btn').forEach(btn => btn.addEventListener('click', () => {
            DataService.returnFromVacation(btn.dataset.id);
            showToast('تم تسجيل العودة من الإجازة', 'success');
            Pages.vacations(container);
        }));
        document.querySelectorAll('.pay-btn').forEach(btn => btn.addEventListener('click', () => {
            DataService.markVacationPaid(btn.dataset.id);
            showToast('تم تسجيل دفعة رسوم الإجازة', 'success');
            Pages.vacations(container);
        }));
    }
    document.getElementById('vac-status-filter').addEventListener('change', render);
    render();
};
