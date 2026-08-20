/* ==========================================================================
   guests.js — الضيفات / الاستضافة المؤقتة
   ========================================================================== */

Pages.guests = function (container) {
    const guests = DataService.getGuests();
    const today = Utils.todayISO();
    const todayGuests = DataService.getGuestsToday();
    const revenueTotal = DataService.getGuestRevenueTotal();
    const pendingCount = guests.filter(g => g.paymentStatus !== 'مدفوع').length;

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-body">
            <p class="text-muted mb-0" style="font-size:13px;"><i class="bi bi-info-circle text-teal me-1"></i>الضيفة زائرة مؤقتة تستضيفها إحدى الطالبات — إقامتها لا تغيّر إشغال سرير الطالبة المضيفة، ودخلها يُحتسب منفصلاً عن إيراد السكن.</p>
        </div>
    </div>
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-person-heart', label:'ضيفات اليوم', value: todayGuests.length, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-hourglass-split', label:'دفعات معلّقة', value: pendingCount, colorClass:'bg-soft-warning' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'إجمالي إيرادات الاستضافة', value: Utils.formatMoney(revenueTotal), colorClass:'bg-soft-success' })}
    </div>

    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-person-heart me-1 text-teal"></i>سجل الضيفات</h2>
            <div class="d-flex gap-2 flex-wrap">
                <input type="text" class="form-control form-control-sm" id="guest-search" placeholder="بحث بالاسم..." style="max-width:180px;">
                <select class="form-select form-select-sm" id="guest-status-filter" style="max-width:140px;">
                    <option value="">كل الحالات</option>
                    <option value="مستحق">مستحق</option>
                    <option value="مدفوع">مدفوع</option>
                </select>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>اسم الضيفة</th><th>مستضيفتها</th><th>من</th><th>إلى</th><th>الليالي</th><th>الإجمالي</th><th>الحالة</th><th></th></tr></thead>
                    <tbody id="guests-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const search = document.getElementById('guest-search').value.trim().toLowerCase();
        const status = document.getElementById('guest-status-filter').value;
        let list = DataService.getGuests();
        if (search) list = list.filter(g => g.name.toLowerCase().includes(search) || g.hostName.toLowerCase().includes(search));
        if (status) list = list.filter(g => g.paymentStatus === status);

        document.getElementById('guests-tbody').innerHTML = list.map(g => `
            <tr>
                <td class="fw-bold">${g.name}</td>
                <td class="clickable text-teal resident-link" data-id="${g.hostResidentId}">${g.hostName}</td>
                <td>${g.checkIn}</td><td>${g.checkOut}</td><td>${g.nights}</td>
                <td class="money">${Utils.formatMoney(g.total)}</td>
                <td>${statusBadge(g.paymentStatus)}</td>
                <td>${g.paymentStatus !== 'مدفوع' ? `<button class="btn btn-sm btn-light border mark-guest-paid-btn" data-id="${g.id}">تسجيل الدفع</button>` : ''}</td>
            </tr>`).join('') || `<tr><td colspan="8">${emptyState('bi-person-heart','لا توجد ضيفات مسجلة بعد')}</td></tr>`;

        document.querySelectorAll('.resident-link').forEach(el => el.addEventListener('click', () => openResidentProfileModal(el.dataset.id)));
        document.querySelectorAll('.mark-guest-paid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                DataService.markGuestPaid(btn.dataset.id);
                showToast('تم تسجيل دفعة الاستضافة', 'success');
                render();
            });
        });
    }
    document.getElementById('guest-search').addEventListener('input', render);
    document.getElementById('guest-status-filter').addEventListener('change', render);
    render();
};
