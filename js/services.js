/* ==========================================================================
   services.js — خدمات الداخلية (طعام، إنترنت، مكتبة، ترحيل...)
   ========================================================================== */

Pages.services = function (container) {
    const services = DataService.getServices();
    const allAssignments = DataService.getAllResidentServices().filter(rs => rs.status === 'نشطة');

    container.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-body">
            <p class="text-muted mb-0" style="font-size:13px;"><i class="bi bi-info-circle text-teal me-1"></i>الخدمات (الطعام، الإنترنت، المكتبة، الترحيل...) مستقلة مالياً عن السكن. عرّف الخدمة هنا أولاً، ثم فعّلها لكل طالبة من ملفها الشخصي.</p>
        </div>
    </div>

    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-stars', label:'عدد الخدمات المعرّفة', value: services.length, colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-people', label:'اشتراكات نشطة', value: allAssignments.length, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-cash-coin', label:'الدخل الشهري من الخدمات', value: Utils.formatMoney(allAssignments.reduce((s,a)=>s+(Number(a.price)||0),0)), colorClass:'bg-soft-success' })}
    </div>

    <div class="app-card mb-3">
        <div class="app-card-header">
            <h2><i class="bi bi-stars me-1 text-teal"></i>كتالوج الخدمات</h2>
            <button class="btn btn-brand btn-sm" id="add-service-btn"><i class="bi bi-plus-lg me-1"></i>خدمة جديدة</button>
        </div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الاسم</th><th>النوع</th><th>دورة الفوترة</th><th>السعر الافتراضي</th><th>الحالة</th><th></th></tr></thead>
                    <tbody>
                        ${services.map(s => `<tr>
                            <td class="fw-bold">${s.name}</td><td>${s.type}</td><td>${s.billingCycle}</td>
                            <td class="money">${Utils.formatMoney(s.price)}</td><td>${statusBadge(s.status)}</td>
                            <td><button class="btn btn-sm btn-light border remove-service-btn" data-id="${s.id}"><i class="bi bi-trash text-danger"></i></button></td>
                        </tr>`).join('') || `<tr><td colspan="6">${emptyState('bi-stars','لا توجد خدمات معرّفة بعد')}</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="app-card">
        <div class="app-card-header"><h2><i class="bi bi-people me-1 text-teal"></i>الاشتراكات النشطة</h2></div>
        <div class="app-card-body">
            <div class="table-responsive">
                <table class="table table-app mb-0">
                    <thead><tr><th>الطالبة</th><th>الخدمة</th><th>السعر</th><th>البداية</th></tr></thead>
                    <tbody>
                        ${allAssignments.map(a => {
                            const r = DataService.getResident(a.residentId);
                            return `<tr>
                                <td class="fw-bold text-teal clickable resident-link" data-id="${a.residentId}">${r ? r.name : '—'}</td>
                                <td>${a.serviceName}</td><td class="money">${Utils.formatMoney(a.price)}</td><td>${a.startDate}</td>
                            </tr>`;
                        }).join('') || `<tr><td colspan="4">${emptyState('bi-people','لا توجد اشتراكات نشطة بعد')}</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;

    document.getElementById('add-service-btn').addEventListener('click', () => openAddServiceModal(() => Pages.services(container)));
    container.querySelectorAll('.remove-service-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmAction('سيتم حذف هذه الخدمة من الكتالوج. الاشتراكات الحالية للطالبات تبقى كما هي. هل تريد المتابعة؟', () => {
                DataService.removeService(btn.dataset.id);
                showToast('تم حذف الخدمة', 'warning');
                Pages.services(container);
            });
        });
    });
    container.querySelectorAll('.resident-link').forEach(el => el.addEventListener('click', () => openResidentProfileModal(el.dataset.id)));
};

function openAddServiceModal(onSaved) {
    const id = 'addServiceModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-stars me-2 text-teal"></i>خدمة جديدة</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="service-form">
                <div class="mb-3"><label class="form-label fw-bold">اسم الخدمة</label><input class="form-control" name="name" placeholder="مثال: اشتراك الإنترنت الشهري" required></div>
                <div class="mb-3"><label class="form-label fw-bold">النوع</label>
                    <select class="form-select" name="type">${SERVICE_TYPE_DEFS.map(t => `<option>${t}</option>`).join('')}</select>
                </div>
                <div class="mb-3"><label class="form-label fw-bold">دورة الفوترة</label>
                    <select class="form-select" name="billingCycle"><option value="شهري">شهري</option><option value="يومي">يومي</option></select>
                </div>
                <div class="mb-1"><label class="form-label fw-bold">السعر الافتراضي</label><input type="number" class="form-control" name="price" min="0" required></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-service-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-service-btn').addEventListener('click', () => {
        const form = document.getElementById('service-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        DataService.addService(fd);
        modal.hide();
        showToast('تم إضافة الخدمة بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
