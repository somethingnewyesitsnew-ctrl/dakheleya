/* ==========================================================================
   dormitory.js — هيكل الداخلية الهرمي: طابق ← شقة ← غرفة ← سرير
   كل شيء مترابط: لا سرير بدون غرفة، لا غرفة بدون شقة، لا شقة بدون طابق
   ========================================================================== */

/* ---------------- صفحة هيكل الداخلية (المحور الرئيسي) ---------------- */
Pages.dormStructure = function (container) {
    const floors = DataService.getFloors();
    const occ = DataService.occupancyStats();

    container.innerHTML = `
    <div class="row g-3 mb-1">
        ${kpiCard({ icon:'bi-layers', label:'عدد الطوابق', value: floors.length, colorClass:'bg-soft-navy' })}
        ${kpiCard({ icon:'bi-door-closed', label:'عدد الغرف', value: DataService.getRooms().length, colorClass:'bg-soft-teal' })}
        ${kpiCard({ icon:'bi-grid-3x3-gap', label:'عدد الأسرة', value: occ.total, colorClass:'bg-soft-info' })}
        ${kpiCard({ icon:'bi-speedometer2', label:'نسبة الإشغال', value: occ.rate+'%', colorClass:'bg-soft-gold' })}
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <p class="text-muted mb-0" style="font-size:13px;"><i class="bi bi-info-circle text-teal me-1"></i>الداخلية مبنية بشكل هرمي: طابق ← شقة ← غرفة ← سرير. اضغط على أي عنصر لعرض تفاصيله.</p>
        <button class="btn btn-brand btn-sm" id="add-floor-btn"><i class="bi bi-plus-lg me-1"></i>إضافة طابق</button>
    </div>

    <div id="floors-area"></div>
    `;

    document.getElementById('add-floor-btn').addEventListener('click', () => openAddFloorModal(() => Pages.dormStructure(container)));
    renderFloorsArea(container);
};

function renderFloorsArea(container) {
    const floors = DataService.getFloors();
    const area = document.getElementById('floors-area');
    if (!floors.length) {
        area.innerHTML = `<div class="app-card"><div class="app-card-body">${emptyState('bi-layers', 'لا توجد طوابق بعد — أضف أول طابق للبدء ببناء هيكل الداخلية')}</div></div>`;
        return;
    }

    area.innerHTML = `
    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
        ${floors.map((f, i) => {
            const stats = DataService.getFloorStats(f.id);
            return `<li class="nav-item">
                <button class="nav-link ${i===0?'active':''}" data-bs-toggle="pill" data-bs-target="#floor-${f.id}" type="button">
                    <i class="bi bi-layers me-1"></i>${f.name}
                    <span class="badge-soft ${stats.available>0?'bg-soft-success':'bg-soft-navy'} ms-1">${stats.available} متاح</span>
                </button>
            </li>`;
        }).join('')}
    </ul>
    <div class="tab-content">
        ${floors.map((f, i) => `<div class="tab-pane fade ${i===0?'show active':''}" id="floor-${f.id}"></div>`).join('')}
    </div>`;

    floors.forEach(f => renderFloorTab(f.id, container));
}

function renderFloorTab(floorId, rootContainer) {
    const floor = DataService.getFloor(floorId);
    const stats = DataService.getFloorStats(floorId);
    const apartments = DataService.getApartmentsByFloor(floorId);
    const pane = document.getElementById(`floor-${floorId}`);
    if (!pane) return;

    pane.innerHTML = `
    <div class="app-card mb-3">
        <div class="app-card-body">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                    <div class="fw-bold" style="font-size:15px;">${floor.name}</div>
                    <div class="text-muted" style="font-size:12px;">${floor.description || 'بدون وصف'}</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-light border edit-floor-btn" data-id="${floor.id}"><i class="bi bi-pencil me-1"></i>تعديل الطابق</button>
                    <button class="btn btn-sm btn-brand add-apartment-btn" data-floor="${floor.id}"><i class="bi bi-plus-lg me-1"></i>إضافة شقة</button>
                </div>
            </div>
            <div class="row text-center g-2">
                <div class="col-4 col-md-2"><div class="fw-bold money">${stats.apartmentsCount}</div><div class="text-muted" style="font-size:11px;">شقق</div></div>
                <div class="col-4 col-md-2"><div class="fw-bold money">${stats.roomsCount}</div><div class="text-muted" style="font-size:11px;">غرف</div></div>
                <div class="col-4 col-md-2"><div class="fw-bold money text-success">${stats.roomsAvailable}</div><div class="text-muted" style="font-size:11px;">غرف شاغرة</div></div>
                <div class="col-4 col-md-2"><div class="fw-bold money">${stats.bedsCount}</div><div class="text-muted" style="font-size:11px;">أسرّة</div></div>
                <div class="col-4 col-md-2"><div class="fw-bold money text-success">${stats.available}</div><div class="text-muted" style="font-size:11px;">أسرّة متاحة</div></div>
                <div class="col-4 col-md-2"><div class="fw-bold money text-warning">${stats.maintenance}</div><div class="text-muted" style="font-size:11px;">صيانة</div></div>
            </div>
        </div>
    </div>
    <div class="room-grid" id="apartments-grid-${floorId}" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));"></div>
    `;

    document.querySelectorAll(`.add-apartment-btn[data-floor="${floorId}"]`).forEach(btn => {
        btn.addEventListener('click', () => openAddApartmentModal(floorId, () => renderFloorTab(floorId, rootContainer)));
    });
    pane.querySelector('.edit-floor-btn').addEventListener('click', () => openAddFloorModal(() => renderFloorsArea(rootContainer), floor.id));

    const grid = document.getElementById(`apartments-grid-${floorId}`);
    if (!apartments.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;">${emptyState('bi-door-open', 'لا توجد شقق في هذا الطابق بعد')}</div>`;
        return;
    }
    grid.innerHTML = apartments.map(a => apartmentCardHTML(a)).join('');
    grid.querySelectorAll('.apartment-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.apt-action-btn')) return;
            openApartmentDetailModal(card.dataset.apt, () => renderFloorTab(floorId, rootContainer));
        });
    });
    grid.querySelectorAll('.apt-add-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); openAddRoomModalHierarchy(btn.dataset.apt, () => renderFloorTab(floorId, rootContainer)); });
    });
    grid.querySelectorAll('.apt-add-bath-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); openAddBathroomModal(btn.dataset.apt, () => renderFloorTab(floorId, rootContainer)); });
    });
}

function apartmentCardHTML(apartment) {
    const stats = DataService.getApartmentStats(apartment.id);
    return `
    <div class="room-tile clickable apartment-card" data-apt="${apartment.id}">
        <div class="room-num">شقة ${apartment.number} ${apartment.name ? `— ${apartment.name}` : ''}</div>
        <div class="room-beds">${stats.roomsCount} غرف · ${stats.bathroomsCount} حمام · ${stats.bedsCount} سرير</div>
        <div class="mb-2">${stats.occupied} مشغولة — ${stats.available} متاحة (${stats.rate}%)</div>
        <div class="d-flex gap-1 flex-wrap">
            <button class="btn btn-xs btn-light border apt-action-btn apt-add-room-btn" data-apt="${apartment.id}" style="font-size:11px;padding:3px 8px;">+ غرفة</button>
            <button class="btn btn-xs btn-light border apt-action-btn apt-add-bath-btn" data-apt="${apartment.id}" style="font-size:11px;padding:3px 8px;">+ حمام</button>
        </div>
    </div>`;
}

/* ---------------- نافذة إضافة/تعديل طابق ---------------- */
function openAddFloorModal(onSaved, editId) {
    const id = 'addFloorModal';
    document.getElementById(id)?.remove();
    const editing = editId ? DataService.getFloor(editId) : null;
    const floors = DataService.getFloors();

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-layers me-2 text-teal"></i>${editing ? 'تعديل الطابق' : 'إضافة طابق'}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="floor-form">
                <div class="mb-3"><label class="form-label fw-bold">اسم الطابق</label><input class="form-control" name="name" placeholder="مثال: الطابق الأول، طابق الطالبات..." value="${editing ? Utils.escapeHtml(editing.name) : ''}" required></div>
                <div class="mb-3"><label class="form-label fw-bold">الترتيب</label><input type="number" class="form-control" name="order" value="${editing ? editing.order : floors.length + 1}"></div>
                <div class="mb-3"><label class="form-label fw-bold">وصف (اختياري)</label><input class="form-control" name="description" value="${editing ? Utils.escapeHtml(editing.description||'') : ''}"></div>
                <div class="mb-1"><label class="form-label fw-bold">ملاحظات</label><textarea class="form-control" name="notes" rows="2">${editing ? Utils.escapeHtml(editing.notes||'') : ''}</textarea></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-floor-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-floor-btn').addEventListener('click', () => {
        const form = document.getElementById('floor-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        if (editing) DataService.updateFloor(editId, fd);
        else DataService.addFloor(fd);
        modal.hide();
        showToast(editing ? 'تم حفظ تعديلات الطابق' : 'تم إضافة الطابق بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- نافذة إضافة شقة ---------------- */
function openAddApartmentModal(floorId, onSaved) {
    const id = 'addApartmentModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-door-open me-2 text-teal"></i>إضافة شقة</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="apartment-form">
                <div class="mb-3"><label class="form-label fw-bold">رقم الشقة (فريد)</label><input class="form-control" name="number" placeholder="مثال: 101" required></div>
                <div class="mb-3"><label class="form-label fw-bold">اسم الشقة (اختياري)</label><input class="form-control" name="name"></div>
                <div class="mb-1"><label class="form-label fw-bold">ملاحظات</label><textarea class="form-control" name="notes" rows="2"></textarea></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-apartment-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-apartment-btn').addEventListener('click', () => {
        const form = document.getElementById('apartment-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        const result = DataService.addApartment({ ...fd, floorId });
        if (result.error) { showToast(result.error, 'danger'); return; }
        modal.hide();
        showToast('تم إضافة الشقة بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- نافذة إضافة حمام ---------------- */
function openAddBathroomModal(apartmentId, onSaved) {
    const id = 'addBathroomModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-droplet me-2 text-teal"></i>إضافة حمام</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="bathroom-form">
                <div class="mb-3"><label class="form-label fw-bold">اسم/رقم الحمام</label><input class="form-control" name="name" placeholder="مثال: حمام 1"></div>
                <div class="mb-1"><label class="form-label fw-bold">النوع</label>
                    <select class="form-select" name="type">${BATHROOM_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-bathroom-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-bathroom-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('bathroom-form')).entries());
        DataService.addBathroom({ ...fd, apartmentId });
        modal.hide();
        showToast('تم إضافة الحمام', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- تفاصيل الشقة ---------------- */
function openApartmentDetailModal(apartmentId, onClose) {
    const id = 'apartmentDetailModal';
    document.getElementById(id)?.remove();
    const apartment = DataService.getApartment(apartmentId);
    const floor = DataService.getFloor(apartment.floorId);
    const rooms = DataService.getRoomsByApartment(apartmentId);
    const bathrooms = DataService.getBathroomsByApartment(apartmentId);
    const stats = DataService.getApartmentStats(apartmentId);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-door-open me-2 text-teal"></i>شقة ${apartment.number} ${apartment.name ? `— ${apartment.name}` : ''} <span class="text-muted" style="font-size:13px;">(${floor?.name || ''})</span></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2 text-center mb-3">
                <div class="col-3"><div class="fw-bold money">${stats.roomsCount}</div><div class="text-muted" style="font-size:11px;">غرف</div></div>
                <div class="col-3"><div class="fw-bold money">${stats.bathroomsCount}</div><div class="text-muted" style="font-size:11px;">حمام</div></div>
                <div class="col-3"><div class="fw-bold money text-success">${stats.available}</div><div class="text-muted" style="font-size:11px;">أسرّة متاحة</div></div>
                <div class="col-3"><div class="fw-bold money">${stats.rate}%</div><div class="text-muted" style="font-size:11px;">إشغال</div></div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold" style="font-size:14px;">الغرف</div>
                <button class="btn btn-sm btn-brand" id="apt-add-room-btn"><i class="bi bi-plus-lg me-1"></i>إضافة غرفة</button>
            </div>
            <div class="room-grid mb-3" id="apt-rooms-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                ${rooms.length ? rooms.map(r => roomCardHTML(r)).join('') : `<div style="grid-column:1/-1;">${emptyState('bi-door-closed','لا توجد غرف بعد')}</div>`}
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold" style="font-size:14px;">الحمامات</div>
                <button class="btn btn-sm btn-light border" id="apt-add-bath-btn"><i class="bi bi-plus-lg me-1"></i>إضافة حمام</button>
            </div>
            <div class="row g-2">
                ${bathrooms.length ? bathrooms.map(b => `<div class="col-6 col-md-3"><div class="border rounded-3 p-2 text-center" style="font-size:12.5px;"><i class="bi bi-droplet text-teal"></i> ${b.name} <div class="text-muted">${b.type}</div></div></div>`).join('') : `<div class="col-12">${emptyState('bi-droplet','لا توجد حمامات مسجلة')}</div>`}
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

    document.getElementById('apt-add-room-btn').addEventListener('click', () => {
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => openAddRoomModalHierarchy(apartmentId, () => openApartmentDetailModal(apartmentId, onClose)), { once: true });
    });
    document.getElementById('apt-add-bath-btn').addEventListener('click', () => {
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => openAddBathroomModal(apartmentId, () => openApartmentDetailModal(apartmentId, onClose)), { once: true });
    });
    el.querySelectorAll('.room-card-open-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openRoomModal(btn.dataset.room, () => openApartmentDetailModal(apartmentId, onClose)), { once: true });
        });
    });
    el.querySelectorAll('.room-card-add-bed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openAddBedModal(btn.dataset.room, () => openApartmentDetailModal(apartmentId, onClose)), { once: true });
        });
    });

    el.addEventListener('hidden.bs.modal', () => { el.remove(); if (onClose) onClose(); });
    modal.show();
}

function roomCardHTML(room) {
    const beds = DataService.getBedsByRoom(room.id);
    const occupied = beds.filter(b => b.status === 'مشغول').length;
    const available = beds.filter(b => b.status === 'متاح').length;
    const state = DataService.getRoomOccupancyState(room.id);
    const stateColor = state === 'شاغرة بالكامل' ? 'bg-soft-success' : state === 'مشغولة بالكامل' ? 'bg-soft-danger' : 'bg-soft-warning';
    return `
    <div class="room-tile clickable room-card-open-btn" data-room="${room.id}" title="اضغط لعرض تفاصيل الغرفة">
        <div class="room-num">غرفة ${room.number}</div>
        <div class="room-beds">${room.roomType || ''} — ${beds.length} سرير</div>
        <div class="mb-1"><span class="badge-soft ${stateColor}" style="font-size:10.5px;">${state}</span></div>
        <div class="text-muted mb-2" style="font-size:11.5px;">${occupied} مشغول · ${available} متاح · ${Utils.formatMoney(room.price||0)}</div>
        <div class="d-flex gap-1">
            <button class="btn btn-xs btn-light border room-card-add-bed-btn" data-room="${room.id}" style="font-size:11px;padding:3px 8px;">+ سرير</button>
        </div>
    </div>`;
}

/* ---------------- إضافة غرفة (بمعرفة الشقة مسبقاً) ---------------- */
function openAddRoomModalHierarchy(apartmentId, onSaved) {
    const id = 'addRoomHierModal';
    document.getElementById(id)?.remove();
    const apartment = DataService.getApartment(apartmentId);
    const floor = DataService.getFloor(apartment.floorId);
    const roomTypes = DataService.getAllRoomTypes();

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-door-closed me-2 text-teal"></i>إضافة غرفة</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p class="text-muted mb-3" style="font-size:12.5px;">${floor?.name || ''} ← شقة ${apartment.number}</p>
            <form id="room-hier-form">
                <div class="row g-3">
                    <div class="col-md-6"><label class="form-label fw-bold">رقم/اسم الغرفة</label><input class="form-control" name="number" required></div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold">نوع الغرفة</label>
                        <select class="form-select" name="roomType" id="room-type-select">
                            ${roomTypes.map(t => `<option value="${t.key}" data-capacity="${t.capacity}" data-price="${t.price||0}">${t.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-6"><label class="form-label fw-bold">عدد الأسرة</label><input type="number" class="form-control" name="capacity" id="room-capacity-input" min="1" value="2" required></div>
                    <div class="col-md-6"><label class="form-label fw-bold">السعر الشهري</label><input type="number" class="form-control" name="price" id="room-price-input" min="0" value="0" required></div>
                    <div class="col-12"><label class="form-label fw-bold">ملاحظات</label><textarea class="form-control" name="notes" rows="2"></textarea></div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-room-hier-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    document.getElementById('room-type-select').addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        document.getElementById('room-capacity-input').value = opt.dataset.capacity || 2;
        if (Number(opt.dataset.price)) document.getElementById('room-price-input').value = opt.dataset.price;
    });

    document.getElementById('save-room-hier-btn').addEventListener('click', () => {
        const form = document.getElementById('room-hier-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        DataService.addRoom({ ...fd, apartmentId });
        modal.hide();
        showToast('تم إضافة الغرفة بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- إضافة سرير ---------------- */
function openAddBedModal(roomId, onSaved) {
    const id = 'addBedHierModal';
    document.getElementById(id)?.remove();
    const { room, apartment, floor } = DataService.getRoomLocation(roomId);
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-grid-3x3-gap me-2 text-teal"></i>إضافة سرير</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <p class="text-muted mb-3" style="font-size:12.5px;">${floor?.name||''} ← شقة ${apartment?.number||''} ← غرفة ${room?.number||''}</p>
            <form id="bed-hier-form">
                <div class="mb-3"><label class="form-label fw-bold">رقم السرير</label><input class="form-control" name="number" placeholder="مثال: 01"></div>
                <div class="mb-1"><label class="form-label fw-bold">نوع السرير</label>
                    <select class="form-select" name="bedType">${BED_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-bed-hier-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-bed-hier-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('bed-hier-form')).entries());
        DataService.addBed({ ...fd, roomId });
        modal.hide();
        showToast('تم إضافة السرير بنجاح', 'success');
        if (onSaved) onSaved(); else router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- نافذة تفاصيل الغرفة (كل الأسرة داخلها) ---------------- */
function openRoomModal(roomId, onClose) {
    const id = 'roomModal';
    document.getElementById(id)?.remove();
    const room = DataService.getRoom(roomId);
    const { apartment, floor } = DataService.getRoomLocation(roomId);
    const beds = DataService.getBedsByRoom(roomId);
    const residents = DataService.getResidents().filter(r => r.roomId === roomId && !r.checkOut);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-door-closed me-2 text-teal"></i>غرفة ${room.number}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3" style="font-size:12.5px;">${floor?.name||''} ← شقة ${apartment?.number||''} — النوع: ${room.roomType||''} — السعر: ${Utils.formatMoney(room.price||0)}</p>

            ${beds.map(b => {
                const resident = residents.find(r => r.bedId === b.id);
                return `<div class="d-flex justify-content-between align-items-center border rounded-3 p-2 mb-2">
                    <div>
                        <div class="fw-bold" style="font-size:13.5px;">سرير ${b.number} <span class="text-muted" style="font-size:11px;">(${b.bedType||'سرير عادي'})</span></div>
                        ${resident
                            ? `<a href="#" class="resident-link-in-room text-teal fw-bold" data-id="${resident.id}" style="font-size:12.5px;">${resident.name}</a>`
                            : `<span class="text-muted" style="font-size:12px;">لا يوجد تسكين</span>`}
                    </div>
                    <div class="d-flex gap-1">
                        <select class="form-select form-select-sm bed-status-select" data-bed="${b.id}" style="width:130px;">
                            ${BED_STATUSES.map(s => `<option ${s===b.status?'selected':''}>${s}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-light border bed-detail-btn" data-bed="${b.id}" title="تفاصيل السرير"><i class="bi bi-three-dots"></i></button>
                    </div>
                </div>`;
            }).join('') || emptyState('bi-grid-3x3-gap', 'لا توجد أسرة في هذه الغرفة بعد')}

            <button class="btn btn-light border btn-sm w-100 mt-2" id="room-add-bed-btn"><i class="bi bi-plus-lg me-1"></i>إضافة سرير</button>

            <div class="section-title" style="font-size:14px;"><i class="bi bi-journal-text text-teal"></i>ملاحظات الغرفة</div>
            <textarea class="form-control" id="room-notes-input" rows="2">${Utils.escapeHtml(room.notes||'')}</textarea>
            <button class="btn btn-brand btn-sm mt-2" id="save-room-notes-btn">حفظ الملاحظات</button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-brand" data-bs-dismiss="modal">تم</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    el.querySelectorAll('.bed-status-select').forEach(sel => {
        sel.addEventListener('change', () => {
            DataService.updateBedStatus(sel.dataset.bed, sel.value);
            showToast('تم تحديث حالة السرير', 'success');
        });
    });
    el.querySelectorAll('.bed-detail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openBedModal(btn.dataset.bed, () => openRoomModal(roomId, onClose)), { once: true });
        });
    });
    el.querySelectorAll('.resident-link-in-room').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(a.dataset.id), { once: true });
        });
    });
    document.getElementById('room-add-bed-btn').addEventListener('click', () => {
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => openAddBedModal(roomId, () => openRoomModal(roomId, onClose)), { once: true });
    });
    document.getElementById('save-room-notes-btn').addEventListener('click', () => {
        const notes = document.getElementById('room-notes-input').value;
        DataService.updateRoomNotes(roomId, notes, 'تم تحديث ملاحظات الغرفة');
        showToast('تم حفظ الملاحظات', 'success');
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => openRoomModal(roomId, onClose), { once: true });
    });

    el.addEventListener('hidden.bs.modal', () => { el.remove(); if (onClose) onClose(); });
    modal.show();
}

/* ---------------- نافذة تفاصيل السرير ---------------- */
function openBedModal(bedId, onClose) {
    const id = 'bedModal';
    document.getElementById(id)?.remove();
    const bed = DataService.getBed(bedId);
    const resident = DataService.getResidents().find(r => r.bedId === bedId && !r.checkOut);

    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-grid-3x3-gap me-2 text-teal"></i>${DataService.bedLocationLabel(bedId)}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
                <label class="form-label fw-bold">الحالة</label>
                <select class="form-select" id="bed-modal-status">
                    ${BED_STATUSES.map(s => `<option ${s===bed.status?'selected':''}>${s}</option>`).join('')}
                </select>
            </div>
            ${resident ? `
            <div class="alert alert-light border d-flex justify-content-between align-items-center">
                <div><i class="bi bi-person-badge text-teal me-1"></i> مسكونة بواسطة <b>${resident.name}</b></div>
                <button class="btn btn-sm btn-brand" id="bed-modal-view-resident">عرض الملف</button>
            </div>` : ''}
            <label class="form-label fw-bold">ملاحظات السرير</label>
            <textarea class="form-control" id="bed-notes-input" rows="2">${Utils.escapeHtml(bed.notes||'')}</textarea>
            <button class="btn btn-brand btn-sm mt-2" id="save-bed-notes-btn">حفظ</button>

            ${(bed.updates && bed.updates.length) ? `
            <div class="section-title" style="font-size:14px;"><i class="bi bi-clock-history text-teal"></i>سجل التحديثات</div>
            <div style="max-height:160px;overflow:auto;">
                ${bed.updates.slice().reverse().map(u => `
                    <div class="activity-item">
                        <div class="activity-avatar">${(u.by||'?').charAt(0)}</div>
                        <div class="flex-grow-1"><div style="font-size:13px;">${Utils.escapeHtml(u.description)}</div><div class="text-muted" style="font-size:11px;">بواسطة ${u.by}</div></div>
                        <div class="text-muted" style="font-size:11px;">${u.date}</div>
                    </div>`).join('')}
            </div>` : ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-brand" data-bs-dismiss="modal">تم</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    document.getElementById('bed-modal-status').addEventListener('change', (e) => {
        DataService.updateBedStatus(bedId, e.target.value);
        showToast('تم تحديث حالة السرير', 'success');
    });
    document.getElementById('save-bed-notes-btn').addEventListener('click', () => {
        const notes = document.getElementById('bed-notes-input').value;
        const updates = [...(bed.updates||[]), { id: Utils.uid('upd'), date: Utils.todayISO(), description: 'تم تحديث ملاحظات السرير', by: Utils.currentUserName(), timestamp: new Date().toISOString() }];
        StorageService.update(STORAGE_KEYS.beds, bedId, { notes, updates });
        showToast('تم حفظ الملاحظات', 'success');
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => openBedModal(bedId, onClose), { once: true });
    });
    if (resident) {
        document.getElementById('bed-modal-view-resident').addEventListener('click', () => {
            modal.hide();
            el.addEventListener('hidden.bs.modal', () => openResidentProfileModal(resident.id), { once: true });
        });
    }

    el.addEventListener('hidden.bs.modal', () => { el.remove(); if (onClose) onClose(); else router(); });
    modal.show();
}

/* ==========================================================================
   Selects متتالية: طابق ← شقة ← غرفة ← سرير (تُستخدم في التسكين والنقل)
   ========================================================================== */
function cascadeSelectsHTML(prefix) {
    return `
    <div class="row g-3">
        <div class="col-md-3">
            <label class="form-label fw-bold">الطابق</label>
            <select class="form-select" id="${prefix}-floor"><option value="">اختر الطابق</option></select>
        </div>
        <div class="col-md-3">
            <label class="form-label fw-bold">الشقة</label>
            <select class="form-select" id="${prefix}-apartment" disabled><option value="">اختر الشقة</option></select>
        </div>
        <div class="col-md-3">
            <label class="form-label fw-bold">الغرفة</label>
            <select class="form-select" id="${prefix}-room" disabled><option value="">اختر الغرفة</option></select>
        </div>
        <div class="col-md-3">
            <label class="form-label fw-bold">السرير</label>
            <select class="form-select" id="${prefix}-bed" disabled><option value="">اختر السرير</option></select>
        </div>
    </div>`;
}

// يربط الـ 4 selects ببعض؛ onBedChange(bedId|null) يُستدعى كل ما يتغيّر السرير المختار
function wireCascadeSelects(prefix, onBedChange, presetBedId) {
    const floorSel = document.getElementById(`${prefix}-floor`);
    const aptSel = document.getElementById(`${prefix}-apartment`);
    const roomSel = document.getElementById(`${prefix}-room`);
    const bedSel = document.getElementById(`${prefix}-bed`);

    floorSel.innerHTML = '<option value="">اختر الطابق</option>' + DataService.getFloors().map(f => `<option value="${f.id}">${f.name}</option>`).join('');

    floorSel.addEventListener('change', () => {
        const apts = DataService.getApartmentsByFloor(floorSel.value);
        aptSel.innerHTML = '<option value="">اختر الشقة</option>' + apts.map(a => `<option value="${a.id}">شقة ${a.number}</option>`).join('');
        aptSel.disabled = !floorSel.value;
        roomSel.innerHTML = '<option value="">اختر الغرفة</option>'; roomSel.disabled = true;
        bedSel.innerHTML = '<option value="">اختر السرير</option>'; bedSel.disabled = true;
        onBedChange(null);
    });
    aptSel.addEventListener('change', () => {
        const rooms = DataService.getRoomsByApartment(aptSel.value);
        roomSel.innerHTML = '<option value="">اختر الغرفة</option>' + rooms.map(r => `<option value="${r.id}">غرفة ${r.number}</option>`).join('');
        roomSel.disabled = !aptSel.value;
        bedSel.innerHTML = '<option value="">اختر السرير</option>'; bedSel.disabled = true;
        onBedChange(null);
    });
    roomSel.addEventListener('change', () => {
        const beds = DataService.getBedsByRoom(roomSel.value).filter(b => b.status === 'متاح');
        bedSel.innerHTML = '<option value="">اختر السرير</option>' + beds.map(b => `<option value="${b.id}">سرير ${b.number}</option>`).join('');
        bedSel.disabled = !roomSel.value;
        onBedChange(null);
    });
    bedSel.addEventListener('change', () => onBedChange(bedSel.value || null));

    // تعبئة مسبقة لو فيه سرير محدد سلفاً (مثلاً بالضغط على "تسكين" من سرير معيّن)
    if (presetBedId) {
        const { room, apartment, floor } = DataService.getBedLocation(presetBedId);
        if (floor && apartment && room) {
            floorSel.value = floor.id;
            floorSel.dispatchEvent(new Event('change'));
            aptSel.value = apartment.id;
            aptSel.dispatchEvent(new Event('change'));
            roomSel.value = room.id;
            roomSel.dispatchEvent(new Event('change'));
            if ([...bedSel.options].some(o => o.value === presetBedId)) {
                bedSel.value = presetBedId;
                onBedChange(presetBedId);
            }
        }
    }
}
