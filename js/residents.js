/* ==========================================================================
   residents.js — الطالبات: تسكين هرمي، ملف كامل، نقل، خدمات، إجازات، ضيفات
   ========================================================================== */

Pages.residents = function (container) {
    const residents = DataService.getResidents().filter(r => !r.checkOut);

    container.innerHTML = `
    <div class="app-card">
        <div class="app-card-header flex-wrap gap-2">
            <h2><i class="bi bi-person-badge me-1 text-teal"></i>الطالبات (${residents.length})</h2>
            <div class="d-flex gap-2 flex-wrap">
                <input type="text" class="form-control form-control-sm" id="res-search" placeholder="بحث بالاسم..." style="max-width:180px;">
                <select class="form-select form-select-sm" id="res-status-filter" style="max-width:150px;">
                    <option value="">كل الحالات</option>
                    <option value="مسدد">مسدد</option>
                    <option value="مستحق">مستحق</option>
                    <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                </select>
                <button class="btn btn-brand btn-sm" id="add-resident-btn"><i class="bi bi-plus-lg me-1"></i>تسكين طالبة</button>
            </div>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr>
                        <th>اسم الطالبة</th><th>الهاتف</th><th>الموقع</th><th>الحالة</th>
                        <th>المستحق الشهري</th><th>حالة الدفع</th>
                    </tr></thead>
                    <tbody id="residents-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        const search = document.getElementById('res-search').value.trim().toLowerCase();
        const status = document.getElementById('res-status-filter').value;
        let list = DataService.getResidents().filter(r => !r.checkOut);
        if (search) list = list.filter(r => r.name.toLowerCase().includes(search));
        if (status) list = list.filter(r => r.paymentStatus === status);

        document.getElementById('residents-tbody').innerHTML = list.map(r => `
            <tr class="clickable resident-row" data-id="${r.id}">
                <td class="fw-bold text-teal">${r.name}</td>
                <td>${r.phone}</td>
                <td style="font-size:12px;">${r.bedId ? DataService.bedLocationLabel(r.bedId) : '—'}</td>
                <td>${statusBadge(r.status || 'مقيمة')}</td>
                <td class="money">${Utils.formatMoney(DataService.getResidentMonthlyDue(r.id))}</td>
                <td>${statusBadge(r.paymentStatus)}</td>
            </tr>`).join('') || `<tr><td colspan="6">${emptyState('bi-person-x','لا توجد طالبات مطابقة')}</td></tr>`;

        document.querySelectorAll('.resident-row').forEach(row => {
            row.addEventListener('click', () => openResidentProfileModal(row.dataset.id));
        });
    }
    document.getElementById('res-search').addEventListener('input', render);
    document.getElementById('res-status-filter').addEventListener('change', render);
    document.getElementById('add-resident-btn').addEventListener('click', () => openAddResidentModal(render));
    render();
};

/* ---------------- تسكين طالبة جديدة (اختيار هرمي: طابق ← شقة ← غرفة ← سرير) ---------------- */
function openAddResidentModal(onSaved, presetBedId) {
    const id = 'addResidentModal';
    document.getElementById(id)?.remove();
    const settings = DataService.getSettings();

    if (!DataService.getFloors().length) {
        showToast('لا يوجد أي طابق مسجل بعد. أضف طابقاً وشقة وغرفة وسريراً أولاً من "هيكل الداخلية"', 'warning');
        return;
    }

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-person-plus me-2 text-teal"></i>تسكين طالبة جديدة</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="resident-form">
                <div class="section-title" style="margin-top:0;font-size:14px;"><i class="bi bi-person text-teal"></i>البيانات الأساسية</div>
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-bold">اسم الطالبة</label><input class="form-control" name="name" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">رقم هاتف الطالبة</label><input class="form-control" name="phone" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الجامعة</label><input class="form-control" name="university"></div>
                    <div class="col-md-6"><label class="form-label fw-bold">المنطقة الأصلية</label><input class="form-control" name="homeRegion" placeholder="مثال: مدني، الأبيض..."></div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-people text-teal"></i>بيانات ولي الأمر</div>
                <div class="row g-3">
                    <div class="col-md-4"><label class="form-label fw-bold">اسم الأب</label><input class="form-control" name="fatherName"></div>
                    <div class="col-md-4"><label class="form-label fw-bold">هاتف الأب</label><input class="form-control" name="fatherPhone"></div>
                    <div class="col-md-4"><label class="form-label fw-bold">وظيفة الأب</label><input class="form-control" name="fatherJob"></div>
                    <div class="col-md-4"><label class="form-label fw-bold">اسم الأم</label><input class="form-control" name="motherName"></div>
                    <div class="col-md-4"><label class="form-label fw-bold">هاتف الأم</label><input class="form-control" name="motherPhone"></div>
                    <div class="col-md-4"><label class="form-label fw-bold">وظيفة الأم</label><input class="form-control" name="motherJob"></div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-door-closed text-teal"></i>اختيار السرير</div>
                ${cascadeSelectsHTML('checkin')}

                <div class="row g-3 mt-1">
                    <div class="col-md-6"><label class="form-label fw-bold">تاريخ الدخول</label><input type="date" class="form-control" name="checkIn" value="${Utils.todayISO()}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">الإيجار الشهري</label><input type="number" class="form-control" name="monthlyRent" id="checkin-rent-input" value="${settings.bedPrice||0}" required></div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-journal-text text-teal"></i>ملاحظات</div>
                <textarea class="form-control" name="notes" rows="2" placeholder="أي ملاحظات إضافية عن الطالبة..."></textarea>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-resident-btn" disabled>اختر سريراً أولاً</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    let selectedBedId = null;
    wireCascadeSelects('checkin', (bedId) => {
        selectedBedId = bedId;
        const saveBtn = document.getElementById('save-resident-btn');
        saveBtn.disabled = !bedId;
        saveBtn.textContent = bedId ? 'تسكين الطالبة' : 'اختر سريراً أولاً';
        if (bedId) {
            const room = DataService.getRoomLocation ? DataService.getRoom(document.getElementById('checkin-room').value) : null;
            if (room && room.price) document.getElementById('checkin-rent-input').value = room.price;
        }
    }, presetBedId);

    document.getElementById('save-resident-btn').addEventListener('click', () => {
        const form = document.getElementById('resident-form');
        if (!form.reportValidity()) return;
        if (!selectedBedId) { showToast('لازم تختار سريراً للتسكين', 'danger'); return; }
        const bed = DataService.getBed(selectedBedId);
        const room = DataService.getRoom(bed.roomId);
        const fd = Object.fromEntries(new FormData(form).entries());
        DataService.addResident({
            ...fd,
            roomId: room.id, roomNumber: room.number, bedId: selectedBedId, bedNumber: bed.number,
            monthlyRent: Number(fd.monthlyRent), paymentStatus: 'مستحق'
        });
        modal.hide();
        showToast('تم تسكين الطالبة بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- ملف الطالبة الكامل ---------------- */
function openResidentProfileModal(residentId) {
    const id = 'residentProfileModal';
    document.getElementById(id)?.remove();
    const r = DataService.getResident(residentId);
    if (!r) return;
    const totalPaid = DataService.getResidentTotalPaid(residentId);
    const monthlyDue = DataService.getResidentMonthlyDue(residentId);
    const locationLabel = r.bedId ? DataService.bedLocationLabel(r.bedId) : 'بدون تسكين حالي';
    const services = DataService.getResidentServices(residentId);
    const guests = DataService.getGuests().filter(g => g.hostResidentId === residentId);
    const vacations = DataService.getVacations().filter(v => v.residentId === residentId);
    const transfers = DataService.getTransfersByResident(residentId);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <div>
                <h5 class="modal-title fw-bold mb-1"><i class="bi bi-person-badge me-2 text-teal"></i>${r.name} <span class="badge-soft bg-soft-teal">${r.status||'مقيمة'}</span></h5>
                <div class="text-muted" style="font-size:12px;">${r.phone} — ${locationLabel}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
                <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#rp-info">البيانات</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-family">بيانات الأهل</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-payments">المدفوعات</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-services">الخدمات</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-guests">الضيفات</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-vacations">الإجازات</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#rp-timeline">الخط الزمني</button></li>
            </ul>
            <div class="tab-content">
                <div class="tab-pane fade show active" id="rp-info">
                    <form id="rp-info-form">
                        <div class="row g-3">
                            <div class="col-md-6"><label class="form-label fw-bold">اسم الطالبة</label><input class="form-control" name="name" value="${Utils.escapeHtml(r.name)}"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">رقم الهاتف</label><input class="form-control" name="phone" value="${Utils.escapeHtml(r.phone)}"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">الجامعة</label><input class="form-control" name="university" value="${Utils.escapeHtml(r.university||'')}"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">المنطقة الأصلية</label><input class="form-control" name="homeRegion" value="${Utils.escapeHtml(r.homeRegion||'')}"></div>
                            <div class="col-md-8">
                                <label class="form-label fw-bold">الموقع الحالي</label>
                                <div class="d-flex gap-2">
                                    <input class="form-control" value="${locationLabel}" disabled>
                                    ${r.roomId ? `<button type="button" class="btn btn-light border text-nowrap" id="rp-view-room-btn">عرض الغرفة</button>` : ''}
                                </div>
                            </div>
                            <div class="col-md-4"><button type="button" class="btn btn-brand w-100" id="rp-transfer-btn"><i class="bi bi-arrow-left-right me-1"></i>تغيير التسكين</button></div>
                            <div class="col-md-6"><label class="form-label fw-bold">تاريخ الدخول</label><input type="date" class="form-control" name="checkIn" value="${r.checkIn||''}"></div>
                            <div class="col-md-6"><label class="form-label fw-bold">الإيجار الشهري</label><input type="number" class="form-control" name="monthlyRent" value="${r.monthlyRent}"></div>
                            <div class="col-12"><label class="form-label fw-bold">ملاحظات</label><textarea class="form-control" name="notes" rows="3">${Utils.escapeHtml(r.notes||'')}</textarea></div>
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button type="button" class="btn btn-brand btn-sm" id="rp-save-info-btn"><i class="bi bi-check-lg me-1"></i>حفظ التعديلات</button>
                            ${!r.checkOut ? `<button type="button" class="btn btn-outline-danger btn-sm" id="rp-checkout-btn"><i class="bi bi-box-arrow-right me-1"></i>إخلاء السرير (خروج)</button>` : ''}
                        </div>
                    </form>
                </div>

                <div class="tab-pane fade" id="rp-family">
                    <form id="rp-family-form">
                        <div class="row g-3">
                            <div class="col-md-4"><label class="form-label fw-bold">اسم الأب</label><input class="form-control" name="fatherName" value="${Utils.escapeHtml(r.fatherName||'')}"></div>
                            <div class="col-md-4"><label class="form-label fw-bold">هاتف الأب</label><input class="form-control" name="fatherPhone" value="${Utils.escapeHtml(r.fatherPhone||'')}"></div>
                            <div class="col-md-4"><label class="form-label fw-bold">وظيفة الأب</label><input class="form-control" name="fatherJob" value="${Utils.escapeHtml(r.fatherJob||'')}"></div>
                            <div class="col-md-4"><label class="form-label fw-bold">اسم الأم</label><input class="form-control" name="motherName" value="${Utils.escapeHtml(r.motherName||'')}"></div>
                            <div class="col-md-4"><label class="form-label fw-bold">هاتف الأم</label><input class="form-control" name="motherPhone" value="${Utils.escapeHtml(r.motherPhone||'')}"></div>
                            <div class="col-md-4"><label class="form-label fw-bold">وظيفة الأم</label><input class="form-control" name="motherJob" value="${Utils.escapeHtml(r.motherJob||'')}"></div>
                        </div>
                        <button type="button" class="btn btn-brand btn-sm mt-3" id="rp-save-family-btn"><i class="bi bi-check-lg me-1"></i>حفظ التعديلات</button>
                    </form>
                </div>

                <div class="tab-pane fade" id="rp-payments">
                    <div class="row g-3 mb-3">
                        ${kpiCard({ icon:'bi-cash-coin', label:'إجمالي المدفوع', value: Utils.formatMoney(totalPaid), colorClass:'bg-soft-success' })}
                        ${kpiCard({ icon:'bi-receipt', label:'المستحق الشهري (سكن + خدمات)', value: Utils.formatMoney(monthlyDue), colorClass:'bg-soft-info' })}
                        ${kpiCard({ icon:'bi-flag', label:'حالة الدفع الحالية', value: r.paymentStatus, colorClass:'bg-soft-warning' })}
                    </div>
                    <button class="btn btn-brand btn-sm mb-3" id="rp-add-payment-btn"><i class="bi bi-plus-lg me-1"></i>تسجيل دفعة جديدة (موزّعة)</button>
                    <div class="table-responsive">
                        <table class="table table-app mb-0">
                            <thead><tr><th>التاريخ</th><th>المبلغ</th><th>التوزيع</th><th>طريقة الدفع</th><th>بواسطة</th></tr></thead>
                            <tbody>
                                ${(r.payments||[]).slice().reverse().map(p => `<tr>
                                    <td>${p.date}</td><td class="money">${Utils.formatMoney(p.amount)}</td>
                                    <td style="font-size:11.5px;">${p.allocation ? Object.entries(p.allocation).filter(([,v])=>Number(v)>0).map(([k,v])=>`${allocationLabel(k)}: ${Utils.formatMoney(v)}`).join('، ') : 'سكن (كامل المبلغ)'}</td>
                                    <td>${p.method}</td><td>${p.by}</td>
                                </tr>`).join('') || `<tr><td colspan="5">${emptyState('bi-cash','لا توجد دفعات مسجلة بعد')}</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tab-pane fade" id="rp-services">
                    <button class="btn btn-brand btn-sm mb-3" id="rp-add-service-btn"><i class="bi bi-plus-lg me-1"></i>تفعيل خدمة جديدة</button>
                    <div class="table-responsive">
                        <table class="table table-app mb-0">
                            <thead><tr><th>الخدمة</th><th>النوع</th><th>السعر</th><th>البداية</th><th>الحالة</th><th></th></tr></thead>
                            <tbody>
                                ${services.length ? services.map(s => `<tr>
                                    <td class="fw-bold">${s.serviceName}</td><td>${s.serviceType}</td>
                                    <td class="money">${Utils.formatMoney(s.price)}</td><td>${s.startDate}</td>
                                    <td>${statusBadge(s.status)}</td>
                                    <td>${s.status==='نشطة' ? `<button class="btn btn-sm btn-light border cancel-rservice-btn" data-id="${s.id}">إلغاء</button>` : ''}</td>
                                </tr>`).join('') : `<tr><td colspan="6">${emptyState('bi-stars','لا توجد خدمات مفعّلة')}</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tab-pane fade" id="rp-guests">
                    <button class="btn btn-brand btn-sm mb-3" id="rp-add-guest-btn"><i class="bi bi-plus-lg me-1"></i>تسجيل ضيفة</button>
                    <div class="table-responsive">
                        <table class="table table-app mb-0">
                            <thead><tr><th>اسم الضيفة</th><th>من</th><th>إلى</th><th>الليالي</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
                            <tbody>
                                ${guests.length ? guests.map(g => `<tr>
                                    <td class="fw-bold">${g.name}</td><td>${g.checkIn}</td><td>${g.checkOut}</td>
                                    <td>${g.nights}</td><td class="money">${Utils.formatMoney(g.total)}</td>
                                    <td>${statusBadge(g.paymentStatus)}</td>
                                </tr>`).join('') : `<tr><td colspan="6">${emptyState('bi-person-heart','لا توجد ضيفات مسجلة')}</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tab-pane fade" id="rp-vacations">
                    <button class="btn btn-brand btn-sm mb-3" id="rp-add-vacation-btn"><i class="bi bi-plus-lg me-1"></i>تسجيل إجازة</button>
                    <div class="table-responsive">
                        <table class="table table-app mb-0">
                            <thead><tr><th>البداية</th><th>العودة المتوقعة</th><th>الاحتفاظ بالسرير</th><th>الرسوم</th><th>الحالة</th><th></th></tr></thead>
                            <tbody>
                                ${vacations.length ? vacations.map(v => `<tr>
                                    <td>${v.startDate}</td><td>${v.expectedReturn}</td>
                                    <td>${v.keepBed ? `نعم (${v.percentage}%)` : 'لا'}</td>
                                    <td class="money">${Utils.formatMoney(v.fee)}</td>
                                    <td>${statusBadge(v.status)}</td>
                                    <td class="text-nowrap">
                                        ${v.status==='في إجازة' || v.status==='معتمدة' || v.status==='تم تمديدها' ? `<button class="btn btn-sm btn-light border return-vacation-btn" data-id="${v.id}">تسجيل العودة</button>` : ''}
                                        ${v.keepBed && v.paymentStatus!=='مسدد' ? `<button class="btn btn-sm btn-light border pay-vacation-btn" data-id="${v.id}">دفع الرسوم</button>` : ''}
                                    </td>
                                </tr>`).join('') : `<tr><td colspan="6">${emptyState('bi-airplane','لا توجد إجازات مسجلة')}</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tab-pane fade" id="rp-timeline">
                    ${renderResidentTimeline(r, transfers)}
                </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-brand" data-bs-dismiss="modal">إغلاق</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    document.getElementById('rp-save-info-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('rp-info-form')).entries());
        fd.monthlyRent = Number(fd.monthlyRent) || 0;
        DataService.updateResidentProfile(r.id, fd, 'تم تحديث البيانات الأساسية للطالبة');
        showToast('تم حفظ التعديلات', 'success');
        el.addEventListener('hidden.bs.modal', () => router(), { once: true });
        modal.hide();
    });

    document.getElementById('rp-save-family-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('rp-family-form')).entries());
        DataService.updateResidentProfile(r.id, fd, 'تم تحديث بيانات ولي الأمر');
        showToast('تم حفظ بيانات الأهل', 'success');
        el.addEventListener('hidden.bs.modal', () => router(), { once: true });
        modal.hide();
    });

    if (r.roomId) {
        document.getElementById('rp-view-room-btn').addEventListener('click', () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openRoomModal(r.roomId), { once: true });
        });
    }

    document.getElementById('rp-transfer-btn').addEventListener('click', () => {
        openTransferResidentModal(r.id, () => { modal.hide(); el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true }); });
    });

    const checkoutBtn = document.getElementById('rp-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openCheckoutModal(r.id, () => router()), { once: true });
        });
    }

    document.getElementById('rp-add-payment-btn').addEventListener('click', () => {
        openAddPaymentModal(r.id, () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });

    document.getElementById('rp-add-service-btn').addEventListener('click', () => {
        openAssignServiceModal(r.id, () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });
    el.querySelectorAll('.cancel-rservice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            DataService.cancelResidentService(btn.dataset.id);
            showToast('تم إلغاء الخدمة', 'warning');
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });

    document.getElementById('rp-add-guest-btn').addEventListener('click', () => {
        openAddGuestModal(r.id, () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });

    document.getElementById('rp-add-vacation-btn').addEventListener('click', () => {
        openAddVacationModal(r.id, () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });
    el.querySelectorAll('.return-vacation-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            DataService.returnFromVacation(btn.dataset.id);
            showToast('تم تسجيل العودة من الإجازة', 'success');
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });
    el.querySelectorAll('.pay-vacation-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            DataService.markVacationPaid(btn.dataset.id);
            showToast('تم تسجيل دفعة رسوم الإجازة', 'success');
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(r.id), { once: true });
        });
    });

    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

function allocationLabel(key) {
    return { accommodation: 'سكن', food: 'طعام', internet: 'إنترنت', library: 'مكتبة', transport: 'ترحيل', guest: 'استضافة' }[key] || key;
}

function renderResidentTimeline(resident, transfers) {
    const events = [];
    events.push({ date: resident.checkIn, label: 'تسكين', desc: 'تم تسكين الطالبة' });
    (resident.updates || []).forEach(u => events.push({ date: u.date, label: 'تحديث', desc: u.description }));
    transfers.forEach(t => events.push({ date: t.date, label: 'نقل تسكين', desc: `من ${t.oldLocationLabel} إلى ${t.newLocationLabel} (${t.reason})` }));
    (resident.payments || []).forEach(p => events.push({ date: p.date, label: 'دفعة', desc: `دفعت ${Utils.formatMoney(p.amount)}` }));
    if (resident.checkOut) events.push({ date: resident.checkOut, label: 'خروج', desc: 'أخلت السرير' });

    events.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (!events.length) return emptyState('bi-clock-history', 'لا يوجد نشاط مسجل بعد');
    return events.map(e => `
        <div class="activity-item">
            <div class="activity-avatar">${e.label.charAt(0)}</div>
            <div class="flex-grow-1"><div style="font-size:13.5px;"><b>${e.label}</b> — ${Utils.escapeHtml(e.desc)}</div></div>
            <div class="text-muted" style="font-size:11px;">${e.date}</div>
        </div>`).join('');
}

/* ---------------- تسجيل دفعة موزّعة ---------------- */
function openAddPaymentModal(residentId, onSaved) {
    const id = 'addPaymentModal';
    document.getElementById(id)?.remove();
    const resident = DataService.getResident(residentId);
    const due = DataService.getResidentMonthlyDue(residentId);
    const services = DataService.getResidentServices(residentId).filter(s => s.status === 'نشطة');

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold">تسجيل دفعة — ${resident.name}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p class="text-muted" style="font-size:12.5px;"><i class="bi bi-info-circle text-teal me-1"></i>المستحق الشهري الحالي: <b class="money">${Utils.formatMoney(due)}</b>. وزّع المبلغ المدفوع على البنود المناسبة (السكن والخدمات).</p>
            <form id="payment-form">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-bold">التاريخ</label><input type="date" class="form-control" name="date" value="${Utils.todayISO()}" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">طريقة الدفع</label>
                        <select class="form-select" name="method"><option>نقدي</option><option>تحويل بنكي</option><option>محفظة إلكترونية</option></select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">مبلغ السكن</label><input type="number" class="form-control alloc-input" name="accommodation" value="${resident.monthlyRent}"></div>
                    ${services.map(s => `<div class="col-md-6"><label class="form-label fw-bold">${s.serviceName}</label><input type="number" class="form-control alloc-input" name="${serviceAllocKey(s.serviceType)}" value="${s.price}"></div>`).join('')}
                    <div class="col-12"><label class="form-label fw-bold">إجمالي الدفعة</label><input type="number" class="form-control" id="payment-total-display" readonly></div>
                    <div class="col-12"><label class="form-label fw-bold">ملاحظة</label><input class="form-control" name="note"></div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-payment-btn">حفظ الدفعة</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    function recalcTotal() {
        const total = [...el.querySelectorAll('.alloc-input')].reduce((s, inp) => s + (Number(inp.value) || 0), 0);
        document.getElementById('payment-total-display').value = total;
    }
    el.querySelectorAll('.alloc-input').forEach(inp => inp.addEventListener('input', recalcTotal));
    recalcTotal();

    document.getElementById('save-payment-btn').addEventListener('click', () => {
        const form = document.getElementById('payment-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        const allocation = {};
        el.querySelectorAll('.alloc-input').forEach(inp => { allocation[inp.name] = Number(inp.value) || 0; });
        DataService.addAllocatedPayment(residentId, { date: fd.date, method: fd.method, note: fd.note, allocation });
        showToast('تم تسجيل الدفعة بنجاح', 'success');
        modal.hide();
        if (onSaved) onSaved();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
function serviceAllocKey(type) {
    return { 'الطعام': 'food', 'الإنترنت': 'internet', 'المكتبة': 'library', 'الترحيل': 'transport' }[type] || 'other';
}

/* ---------------- تغيير التسكين (نقل طالبة) ---------------- */
function openTransferResidentModal(residentId, onSaved) {
    const id = 'transferModal';
    document.getElementById(id)?.remove();
    const resident = DataService.getResident(residentId);
    const currentLoc = resident.bedId ? DataService.bedLocationLabel(resident.bedId) : 'بدون تسكين حالي';

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-arrow-left-right me-2 text-teal"></i>تغيير تسكين — ${resident.name}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p class="text-muted" style="font-size:13px;">الموقع الحالي: <b>${currentLoc}</b></p>
            <div class="fw-bold mb-2" style="font-size:13.5px;">الموقع الجديد</div>
            ${cascadeSelectsHTML('transfer')}
            <div class="row g-3 mt-1">
                <div class="col-md-6">
                    <label class="form-label fw-bold">سبب النقل</label>
                    <select class="form-select" id="transfer-reason">${TRANSFER_REASONS.map(r => `<option>${r}</option>`).join('')}</select>
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-bold">ملاحظات</label>
                    <input class="form-control" id="transfer-notes">
                </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-transfer-btn" disabled>اختر السرير الجديد أولاً</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    let newBedId = null;
    wireCascadeSelects('transfer', (bedId) => {
        newBedId = bedId;
        const btn = document.getElementById('save-transfer-btn');
        btn.disabled = !bedId;
        btn.textContent = bedId ? 'تأكيد النقل' : 'اختر السرير الجديد أولاً';
    });

    document.getElementById('save-transfer-btn').addEventListener('click', () => {
        if (!newBedId) return;
        const reason = document.getElementById('transfer-reason').value;
        const notes = document.getElementById('transfer-notes').value;
        const result = DataService.transferResident(residentId, newBedId, reason, notes);
        if (result.error) { showToast(result.error, 'danger'); return; }
        showToast('تم نقل التسكين بنجاح', 'success');
        modal.hide();
        if (onSaved) onSaved();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- إخلاء السرير (خروج) ---------------- */
function openCheckoutModal(residentId, onSaved) {
    const id = 'checkoutModal';
    document.getElementById(id)?.remove();
    const resident = DataService.getResident(residentId);
    const balance = DataService.getResidentMonthlyDue(residentId) - DataService.getResidentTotalPaid(residentId);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-box-arrow-right me-2 text-danger"></i>إخلاء السرير — ${resident.name}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p class="text-muted" style="font-size:13px;">الرصيد الحالي: <b class="money ${balance>0?'text-danger':'text-success'}">${Utils.formatMoney(balance)}</b> ${balance>0?'(مستحق على الطالبة)':'(لا يوجد مستحق)'}</p>
            <form id="checkout-form">
                <div class="mb-3"><label class="form-label fw-bold">تاريخ الخروج</label><input type="date" class="form-control" name="checkOut" value="${Utils.todayISO()}" required></div>
                <div class="mb-3"><label class="form-label fw-bold">السبب</label><input class="form-control" name="reason" placeholder="مثال: تخرجت، انتقلت..."></div>
                <div class="mb-1"><label class="form-label fw-bold">ملاحظات</label><textarea class="form-control" name="notes" rows="2"></textarea></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-danger" id="save-checkout-btn">تأكيد إخلاء السرير</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-checkout-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('checkout-form')).entries());
        DataService.updateResidentProfile(residentId, { checkOut: fd.checkOut, status: 'غادرت', checkoutReason: fd.reason }, `أخلت السرير — السبب: ${fd.reason || 'غير محدد'}`);
        modal.hide();
        showToast('تم تسجيل إخلاء السرير', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- تفعيل خدمة لطالبة ---------------- */
function openAssignServiceModal(residentId, onSaved) {
    const id = 'assignServiceModal';
    document.getElementById(id)?.remove();
    const services = DataService.getServices().filter(s => s.status === 'نشطة');
    if (!services.length) {
        showToast('لا توجد خدمات معرّفة بعد. أضف خدمة أولاً من صفحة "الخدمات"', 'warning');
        return;
    }
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold">تفعيل خدمة</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="assign-service-form">
                <div class="mb-3"><label class="form-label fw-bold">الخدمة</label>
                    <select class="form-select" name="serviceId" id="assign-service-select">
                        ${services.map(s => `<option value="${s.id}" data-price="${s.price}">${s.name} — ${Utils.formatMoney(s.price)}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3"><label class="form-label fw-bold">السعر لهذه الطالبة</label><input type="number" class="form-control" name="price" id="assign-service-price" value="${services[0].price}"></div>
                <div class="mb-1"><label class="form-label fw-bold">تاريخ البداية</label><input type="date" class="form-control" name="startDate" value="${Utils.todayISO()}"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-assign-service-btn">تفعيل</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('assign-service-select').addEventListener('change', (e) => {
        document.getElementById('assign-service-price').value = e.target.selectedOptions[0].dataset.price;
    });
    document.getElementById('save-assign-service-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('assign-service-form')).entries());
        DataService.assignResidentService(residentId, fd.serviceId, { price: fd.price, startDate: fd.startDate });
        modal.hide();
        showToast('تم تفعيل الخدمة', 'success');
        if (onSaved) onSaved();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- تسجيل ضيفة ---------------- */
function openAddGuestModal(hostResidentId, onSaved) {
    const id = 'addGuestModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-person-heart me-2 text-teal"></i>تسجيل ضيفة</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="guest-form">
                <div class="mb-3"><label class="form-label fw-bold">اسم الضيفة</label><input class="form-control" name="name" required></div>
                <div class="mb-3"><label class="form-label fw-bold">رقم الهاتف</label><input class="form-control" name="phone"></div>
                <div class="row g-2">
                    <div class="col-6"><label class="form-label fw-bold">تاريخ الوصول</label><input type="date" class="form-control" name="checkIn" value="${Utils.todayISO()}" required></div>
                    <div class="col-6"><label class="form-label fw-bold">تاريخ المغادرة</label><input type="date" class="form-control" name="checkOut" required></div>
                </div>
                <label class="form-label fw-bold mt-2">السعر اليومي</label><input type="number" class="form-control" name="dailyRate" value="50000" required>
                <div class="mb-1 mt-2"><label class="form-label fw-bold">ملاحظات</label><input class="form-control" name="notes"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-guest-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-guest-btn').addEventListener('click', () => {
        const form = document.getElementById('guest-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        DataService.addGuest({ ...fd, hostResidentId });
        modal.hide();
        showToast('تم تسجيل الضيفة بنجاح', 'success');
        if (onSaved) onSaved();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- تسجيل إجازة ---------------- */
function openAddVacationModal(residentId, onSaved) {
    const id = 'addVacationModal';
    document.getElementById(id)?.remove();
    const resident = DataService.getResident(residentId);
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-airplane me-2 text-teal"></i>تسجيل إجازة — ${resident.name}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="vacation-form">
                <div class="row g-2">
                    <div class="col-6"><label class="form-label fw-bold">تاريخ البداية</label><input type="date" class="form-control" name="startDate" value="${Utils.todayISO()}" required></div>
                    <div class="col-6"><label class="form-label fw-bold">العودة المتوقعة</label><input type="date" class="form-control" name="expectedReturn" required></div>
                </div>
                <div class="form-check mt-3">
                    <input class="form-check-input" type="checkbox" id="keep-bed-check" name="keepBed">
                    <label class="form-check-label fw-bold" for="keep-bed-check">الاحتفاظ بالسرير أثناء الإجازة</label>
                </div>
                <div id="percentage-wrap" class="mt-2" style="display:none;">
                    <label class="form-label fw-bold">نسبة رسوم الاحتفاظ بالسرير</label>
                    <select class="form-select" name="percentage" id="vacation-percentage">
                        <option value="25">25%</option>
                        <option value="50" selected>50%</option>
                        <option value="75">75%</option>
                        <option value="100">100%</option>
                    </select>
                    <div class="text-muted mt-1" style="font-size:12px;">الرسوم = الإيجار الشهري × النسبة = <span id="vacation-fee-preview" class="fw-bold">${Utils.formatMoney(DataService.calcVacationFee(residentId, 50))}</span></div>
                </div>
                <div class="mb-1 mt-2"><label class="form-label fw-bold">ملاحظات</label><input class="form-control" name="notes"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-vacation-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    document.getElementById('keep-bed-check').addEventListener('change', (e) => {
        document.getElementById('percentage-wrap').style.display = e.target.checked ? 'block' : 'none';
    });
    document.getElementById('vacation-percentage').addEventListener('change', (e) => {
        document.getElementById('vacation-fee-preview').textContent = Utils.formatMoney(DataService.calcVacationFee(residentId, e.target.value));
    });

    document.getElementById('save-vacation-btn').addEventListener('click', () => {
        const form = document.getElementById('vacation-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        fd.keepBed = document.getElementById('keep-bed-check').checked;
        DataService.addVacation({ ...fd, residentId });
        modal.hide();
        showToast('تم تسجيل الإجازة بنجاح', 'success');
        if (onSaved) onSaved();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- التسكين والتحصيل ---------------- */
Pages.housing = function (container) {
    const floors = DataService.getFloors();
    const availableBeds = DataService.getBeds().filter(b => b.status === 'متاح');

    container.innerHTML = `
    <div class="row g-3">
        ${kpiCard({ icon:'bi-house-check', label:'أسرة متاحة للتسكين', value: availableBeds.length, colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-layers', label:'عدد الطوابق', value: floors.length, colorClass:'bg-soft-navy' })}
    </div>
    <div class="app-card mt-3">
        <div class="app-card-header">
            <h2><i class="bi bi-house-check me-1 text-teal"></i>تسكين طالبة جديدة</h2>
            <button class="btn btn-brand btn-sm" id="housing-add-btn"><i class="bi bi-plus-lg me-1"></i>تسكين طالبة</button>
        </div>
        <div class="app-card-body">
            ${!floors.length ? emptyState('bi-layers', 'لا يوجد هيكل داخلية بعد — ابدأ من صفحة "هيكل الداخلية"')
              : availableBeds.length ? `<p class="text-muted" style="font-size:13px;">اضغط "تسكين طالبة" واختر الطابق ثم الشقة ثم الغرفة ثم السرير.</p>`
              : emptyState('bi-house-x', 'لا توجد أسرة متاحة حالياً — الداخلية ممتلئة')}
        </div>
    </div>`;

    document.getElementById('housing-add-btn').addEventListener('click', () => openAddResidentModal(() => router()));
};

Pages.collection = function (container) {
    const settings = DataService.getSettings();
    const residents = DataService.getResidents().filter(r => !r.checkOut);
    const expected = residents.reduce((s,r) => s + DataService.getResidentMonthlyDue(r.id), 0);
    const collected = residents.filter(r => r.paymentStatus === 'مسدد').reduce((s,r) => s + DataService.getResidentMonthlyDue(r.id), 0);
    const outstanding = expected - collected;
    const rate = expected ? Math.round(collected/expected*100) : 0;

    container.innerHTML = `
    <div class="row g-3">
        ${kpiCard({ icon:'bi-graph-up', label:'المستحق (الإشغال الحالي)', value: Utils.formatMoney(expected), colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-check2-circle', label:'المحصَّل', value: Utils.formatMoney(collected), colorClass:'bg-soft-success' })}
        ${kpiCard({ icon:'bi-exclamation-circle', label:'المتأخر / المستحق', value: Utils.formatMoney(outstanding), colorClass:'bg-soft-danger' })}
        ${kpiCard({ icon:'bi-percent', label:'نسبة التحصيل', value: rate+'%', colorClass:'bg-soft-teal' })}
    </div>

    <div class="app-card mt-3">
        <div class="app-card-header"><h2><i class="bi bi-list-check me-1 text-teal"></i>حالة الدفع لكل طالبة</h2></div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الطالبة</th><th>الموقع</th><th>المستحق</th><th>الحالة</th><th></th></tr></thead>
                    <tbody id="collection-tbody"></tbody>
                </table>
            </div>
        </div>
    </div>`;

    function render() {
        document.getElementById('collection-tbody').innerHTML = DataService.getResidents().filter(r => !r.checkOut).map(r => `
            <tr>
                <td class="fw-bold text-teal clickable resident-link" data-id="${r.id}">${r.name}</td>
                <td style="font-size:12px;">${r.bedId ? DataService.bedLocationLabel(r.bedId) : '—'}</td>
                <td class="money">${Utils.formatMoney(DataService.getResidentMonthlyDue(r.id))}</td>
                <td>${statusBadge(r.paymentStatus)}</td>
                <td><button class="btn btn-sm btn-light border add-payment-inline-btn" data-id="${r.id}">تسجيل دفعة</button></td>
            </tr>`).join('') || `<tr><td colspan="5">${emptyState('bi-person-x','لا توجد طالبات مسجلة بعد')}</td></tr>`;

        document.querySelectorAll('.resident-link').forEach(el => el.addEventListener('click', () => openResidentProfileModal(el.dataset.id)));
        document.querySelectorAll('.add-payment-inline-btn').forEach(btn => {
            btn.addEventListener('click', () => openAddPaymentModal(btn.dataset.id, () => Pages.collection(container)));
        });
    }
    render();
};
