/* ==========================================================================
   settings.js — الإعدادات (بتابات): الشركاء، الغرف، الإيجار والمصروفات، تصفير النظام
   ========================================================================== */

Pages.settings = function (container) {
    container.innerHTML = `
    <ul class="nav nav-pills tab-pill gap-2 mb-3 flex-wrap" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#set-partners" type="button"><i class="bi bi-people me-1"></i>الشركاء</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#set-rooms" type="button"><i class="bi bi-door-closed me-1"></i>الغرف والأسرة</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#set-financial" type="button"><i class="bi bi-cash-coin me-1"></i>الإيجار والمصروفات</button></li>
        <li class="nav-item"><button class="nav-link" id="set-tab-recurring" data-bs-toggle="pill" data-bs-target="#set-recurring" type="button"><i class="bi bi-arrow-repeat me-1"></i>الدخل والمصروفات الدورية</button></li>
        <li class="nav-item"><button class="nav-link text-danger" data-bs-toggle="pill" data-bs-target="#set-danger" type="button"><i class="bi bi-exclamation-triangle me-1"></i>تصفير النظام</button></li>
    </ul>
    <div class="tab-content">
        <div class="tab-pane fade show active" id="set-partners">
            <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>هنا تحدد <b>مين هم شركاء المشروع</b> وكم نسبة كل واحد منهم من الملكية (لازم المجموع يساوي 100%).</span></div>
            <div id="set-partners-content"></div>
        </div>
        <div class="tab-pane fade" id="set-rooms">
            <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>هيكل الداخلية: كم غرفة عندك، وكم سرير في كل غرفة، وسعر السرير الشهري الافتراضي.</span></div>
            <div id="set-rooms-content"></div>
        </div>
        <div class="tab-pane fade" id="set-financial">
            <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>قيمة الإيجار الشهري ونسبة زيادته سنوياً، والحد الأدنى للمصروف اللي يحتاج موافقة قبل اعتماده.</span></div>
            <div id="set-financial-content"></div>
        </div>
        <div class="tab-pane fade" id="set-recurring">
            <div class="alert alert-light border mb-3 d-flex align-items-start gap-2" style="font-size:13px;"><i class="bi bi-info-circle text-teal mt-1"></i><span>مصروفات ودخل ثابت بيتكرر تلقائياً (زي الإيجار الشهري أو اشتراك إنترنت) بدل ما تسجله يدوياً كل مرة.</span></div>
            <div id="set-recurring-content"></div>
        </div>
        <div class="tab-pane fade" id="set-danger"></div>
    </div>`;

    renderPartnersTabContent(container);
    renderRoomsTabContent(container);
    renderFinancialTabContent(container);
    renderDangerTabContent(container);

    document.getElementById('set-tab-recurring').addEventListener('shown.bs.tab', () => {
        Pages.recurringExpenses(document.getElementById('set-recurring-content'));
    }, { once: true });
};

/* ---------------- تبويب الشركاء ---------------- */
function renderPartnersTabContent(container) {
    const partners = DataService.getPartners();
    const ownershipSum = partners.reduce((sum,p) => sum + (Number(p.ownership)||0), 0);
    const box = document.getElementById('set-partners-content');

    box.innerHTML = `
    <div class="app-card">
        <div class="app-card-header">
            <h2><i class="bi bi-people me-1 text-teal"></i>الشركاء</h2>
            <button class="btn btn-brand btn-sm" id="add-partner-btn"><i class="bi bi-plus-lg me-1"></i>إضافة شريك</button>
        </div>
        <div class="app-card-body">
            <div id="partners-list">
                ${partners.length ? partners.map(p => `
                <div class="d-flex align-items-center gap-2 border rounded-3 p-2 mb-2">
                    <div class="flex-grow-1">
                        <div class="fw-bold" style="font-size:13.5px;">${p.name}</div>
                        <div class="text-muted" style="font-size:11.5px;">${p.role||'شريك'}</div>
                    </div>
                    <input type="number" class="form-control form-control-sm ownership-input" data-id="${p.id}" value="${p.ownership}" style="width:80px;">
                    <span class="text-muted" style="font-size:12px;">%</span>
                    <button class="btn btn-sm btn-light border remove-partner-btn" data-id="${p.id}" data-name="${p.name}"><i class="bi bi-trash text-danger"></i></button>
                </div>`).join('') : emptyState('bi-people', 'لا يوجد شركاء بعد — أضف شريكاً للبدء')}
            </div>
            ${partners.length ? `
            <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="text-muted" style="font-size:12px;">مجموع نسب الملكية</span>
                <span class="fw-bold ${ownershipSum===100?'text-success':'text-danger'}">${ownershipSum}%</span>
            </div>
            <button class="btn btn-brand btn-sm mt-2" id="save-ownership-btn">حفظ نسب الملكية</button>` : ''}
        </div>
    </div>`;

    document.getElementById('add-partner-btn').addEventListener('click', openAddPartnerModal);
    box.querySelectorAll('.remove-partner-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmAction(`سيتم حذف الشريك "${btn.dataset.name}" نهائياً. المعاملات المرتبطة به ستبقى في السجل لكن دون رابط بشريك. هل تريد المتابعة؟`, () => {
                DataService.removePartner(btn.dataset.id);
                showToast('تم حذف الشريك', 'warning');
                Pages.settings(container);
            });
        });
    });
    const saveOwnershipBtn = document.getElementById('save-ownership-btn');
    if (saveOwnershipBtn) {
        saveOwnershipBtn.addEventListener('click', () => {
            const inputs = [...box.querySelectorAll('.ownership-input')];
            const sum = inputs.reduce((s, inp) => s + (Number(inp.value) || 0), 0);
            if (sum !== 100) {
                showToast(`مجموع نسب الملكية لازم يساوي 100% بالظبط (حالياً ${sum}%). صحّح النسب وحاول تاني`, 'danger');
                return;
            }
            inputs.forEach(inp => {
                DataService.updatePartner(inp.dataset.id, { ownership: Number(inp.value) || 0 });
            });
            showToast('تم تحديث نسب الملكية', 'success');
            Pages.settings(container);
        });
    }
}

/* ---------------- تبويب الغرف والأسرة ---------------- */
function renderRoomsTabContent(container) {
    const floors = DataService.getFloors();
    const rooms = DataService.getRooms();
    const s = DataService.getSettings();
    const box = document.getElementById('set-rooms-content');

    box.innerHTML = `
    <div class="row g-3">
        <div class="col-lg-6">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-layers me-1 text-teal"></i>هيكل الداخلية</h2></div>
                <div class="app-card-body">
                    <div class="row g-2 mb-2">
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">طوابق</div><div class="kpi-value" style="font-size:18px;">${floors.length}</div></div></div>
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">غرف</div><div class="kpi-value" style="font-size:18px;">${rooms.length}</div></div></div>
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">أسرّة</div><div class="kpi-value" style="font-size:18px;">${DataService.getBeds().length}</div></div></div>
                    </div>
                    <a href="#/dormitory" class="btn btn-brand btn-sm">إدارة الطوابق/الشقق/الغرف بالتفصيل</a>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-cash-coin me-1 text-teal"></i>سعر السرير الافتراضي</h2></div>
                <div class="app-card-body">
                    <label class="form-label fw-bold">سعر السرير الشهري</label>
                    <input type="number" class="form-control" id="set-bedprice" value="${s.bedPrice||0}">
                    <button class="btn btn-brand btn-sm mt-2" id="save-dorm-btn">حفظ</button>
                </div>
            </div>
        </div>
    </div>

    <div class="app-card mt-3">
        <div class="app-card-header">
            <h2><i class="bi bi-building me-1 text-teal"></i>الهيكل الفعلي للداخلية</h2>
            <span class="text-muted" style="font-size:11.5px;" title="طابقان، كل طابق 3 شقق، توزيع رباعية/ثلاثية/سنجل محدد لكل شقة — بدون طالبات أو مصروفات">2 طابق · 6 شقق · 26 غرفة · 70 سرير <i class="bi bi-info-circle"></i></span>
        </div>
        <div class="app-card-body">
            <button class="btn btn-brand btn-sm" id="setup-real-building-btn"><i class="bi bi-building me-1"></i>إنشاء الهيكل الحقيقي للداخلية</button>
        </div>
    </div>

    <div class="app-card mt-3" style="border-color:#f2dfb0;">
        <div class="app-card-header">
            <h2><i class="bi bi-shuffle me-1 text-teal"></i>بيانات تجريبية للنظام كامل</h2>
            <button class="btn btn-light border btn-sm" data-bs-toggle="collapse" data-bs-target="#demo-data-collapse">إظهار/إخفاء</button>
        </div>
        <div class="collapse" id="demo-data-collapse">
        <div class="app-card-body">
            <p class="text-muted mb-3" style="font-size:12.5px;">
                <i class="bi bi-info-circle text-teal me-1"></i>
                لتجربة النظام: "تحكم وتعبئة عشوائية" يفتح نافذة تحدد فيها التفاصيل (عدد
                الطوابق/الشقق/الغرف، نسبة الإشغال والدفع، وهل تريد ضيفات/خدمات/مصروفات/نشاط شهر كامل
                عبر كل الصفحات). "إعادة تهيئة الداخلية" يمسح كل ده فقط، دون التأثير على الشركاء أو
                البيانات الحقيقية.
            </p>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-brand btn-sm" id="seed-random-dorm-btn"><i class="bi bi-sliders me-1"></i>تحكم وتعبئة عشوائية للتجربة</button>
                <button class="btn btn-outline-danger btn-sm" id="reset-dorm-only-btn"><i class="bi bi-arrow-counterclockwise me-1"></i>إعادة تهيئة الداخلية من الصفر</button>
            </div>
        </div>
        </div>
    </div>`;

    document.getElementById('save-dorm-btn').addEventListener('click', () => {
        DataService.saveSettings({ bedPrice: Number(document.getElementById('set-bedprice').value) || 0 });
        showToast('تم حفظ إعدادات الداخلية', 'success');
    });

    document.getElementById('setup-real-building-btn').addEventListener('click', () => {
        confirmAction('سيتم إنشاء الهيكل الفعلي للداخلية بالكامل (طابقين، 6 شقق، 26 غرفة، 70 سريراً) بناءً على التوزيع الحقيقي المتفق عليه. لن يتم إنشاء أي طالبات أو مصروفات — الهيكل فقط. يعمل فقط إذا كانت الداخلية فارغة حالياً. هل تريد المتابعة؟', () => {
            const result = DataService.setupRealBuildingStructure();
            if (result.error) { showToast(result.error, 'danger'); return; }
            showToast(`تم إنشاء ${result.floors} طابق و${result.apartments} شقة و${result.rooms} غرفة و${result.beds} سريراً`, 'success');
            Pages.settings(container);
        }, false);
    });

    document.getElementById('seed-random-dorm-btn').addEventListener('click', () => {
        openSeedOptionsModal(container);
    });

    document.getElementById('reset-dorm-only-btn').addEventListener('click', () => {
        confirmAction('سيتم حذف كل شيء في الداخلية نهائياً (الطوابق، الشقق، الغرف، الأسرة، الطالبات، الضيفات، الخدمات، الإجازات)، وأي إيرادات ومصروفات تجريبية ناتجة عنها، وأي مساهمات رأس مال أو سلف شركاء أو أصول أو توزيعات أرباح تجريبية أضافها "نشاط الشهر الكامل". الشركاء أنفسهم وإعدادات المالية العامة وأي بيانات حقيقية أدخلتها بنفسك لن تتأثر. هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟', () => {
            DataService.resetDormitoryOnly();
            showToast('تم إعادة تهيئة الداخلية والبيانات التجريبية المرتبطة بها من الصفر', 'warning');
            if (typeof updateDevBadge === 'function') updateDevBadge();
            Pages.settings(container);
        });
    });
}

/* ---------------- نافذة التحكم في التعبئة العشوائية للداخلية ---------------- */
function openSeedOptionsModal(container) {
    const id = 'seedOptionsModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold"><i class="bi bi-sliders me-2 text-teal"></i>تحكم في التعبئة العشوائية</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="seed-options-form">
                <div class="section-title" style="margin-top:0;font-size:14px;"><i class="bi bi-layers text-teal"></i>هيكل الداخلية</div>
                <div class="row g-3">
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أقل عدد طوابق</label><input type="number" class="form-control" name="floorsMin" min="1" value="2"></div>
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أكبر عدد طوابق</label><input type="number" class="form-control" name="floorsMax" min="1" value="3"></div>
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أقل شقق/طابق</label><input type="number" class="form-control" name="aptsPerFloorMin" min="1" value="2"></div>
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أكبر شقق/طابق</label><input type="number" class="form-control" name="aptsPerFloorMax" min="1" value="3"></div>
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أقل غرف/شقة</label><input type="number" class="form-control" name="roomsPerAptMin" min="1" value="3"></div>
                    <div class="col-6 col-md-3"><label class="form-label fw-bold">أكبر غرف/شقة</label><input type="number" class="form-control" name="roomsPerAptMax" min="1" value="5"></div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-person-badge text-teal"></i>التسكين والدفع</div>
                <div class="row g-3">
                    <div class="col-6 col-md-4">
                        <label class="form-label fw-bold d-flex justify-content-between">نسبة الإشغال <span id="occ-val" class="text-teal">100%</span></label>
                        <input type="range" class="form-range" id="seed-occupancy" name="occupancyPercent" min="0" max="100" value="100">
                    </div>
                    <div class="col-6 col-md-4">
                        <label class="form-label fw-bold">% الطالبات اللي دفعن حاجة</label>
                        <input type="number" class="form-control" name="paymentPercent" min="0" max="100" value="75">
                    </div>
                    <div class="col-6 col-md-4">
                        <label class="form-label fw-bold">% اللي دفعن كامل المبلغ (من ضمن اللي دفعن)</label>
                        <input type="number" class="form-control" name="fullPaymentPercent" min="0" max="100" value="70">
                    </div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-stars text-teal"></i>إضافات</div>
                <div class="row g-3 align-items-center">
                    <div class="col-6 col-md-4">
                        <div class="form-check"><input class="form-check-input" type="checkbox" name="generateServices" id="opt-services" checked><label class="form-check-label fw-bold" for="opt-services">توليد خدمات واشتراكات</label></div>
                    </div>
                    <div class="col-6 col-md-4">
                        <div class="form-check"><input class="form-check-input" type="checkbox" name="generateGuests" id="opt-guests" checked><label class="form-check-label fw-bold" for="opt-guests">توليد ضيفات</label></div>
                    </div>
                    <div class="col-6 col-md-4">
                        <div class="form-check"><input class="form-check-input" type="checkbox" name="generateExpenses" id="opt-expenses" checked><label class="form-check-label fw-bold" for="opt-expenses">توليد مصروفات تشغيلية</label></div>
                    </div>
                </div>
                <div class="row g-3 mt-1">
                    <div class="col-6"><label class="form-label fw-bold">نسبة اشتراك الطالبة في كل خدمة %</label><input type="number" class="form-control" name="serviceSubscribePercent" min="0" max="100" value="35"></div>
                    <div class="col-6"><label class="form-label fw-bold">مضاعف نسبة المصروفات (1 = افتراضي)</label><input type="number" step="0.1" class="form-control" name="expensePercentMultiplier" min="0" value="1"></div>
                </div>

                <div class="section-title" style="font-size:14px;"><i class="bi bi-calendar-range text-teal"></i>نشاط شهر كامل عبر كل صفحات النظام</div>
                <div class="row g-3 align-items-center">
                    <div class="col-12">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="opt-full-activity" checked>
                            <label class="form-check-label fw-bold" for="opt-full-activity">تفعيل نشاط شهر كامل (مساهمات رأس مال، سلف شركاء، شراء أصل، توزيع أرباح)</label>
                        </div>
                        <div class="form-text" style="font-size:11px;">لو مفعّل: التسكين والدفعات والمصروفات تتوزّع على مدار الفترة أدناه بدل ما تكون كلها اليوم، وتُضاف حركة في صفحات "الشراكة" و"التأسيس والتجهيز" و"الخزينة" أيضاً — مش بس الداخلية.</div>
                    </div>
                    <div class="col-6 col-md-4">
                        <label class="form-label fw-bold">عدد أيام الانتشار الزمني (شهر ≈ 30)</label>
                        <input type="number" class="form-control" id="opt-spread-days" min="0" max="365" value="30">
                    </div>
                </div>

                <div class="alert alert-light border mt-3 mb-0" style="font-size:12.5px;">
                    <i class="bi bi-info-circle text-teal me-1"></i>
                    هذه التعبئة تُضاف فوق أي بيانات موجودة حالياً، ولا تؤثر على الشركاء أنفسهم أو
                    إعدادات المالية العامة. يمكن حذفها لاحقاً بالكامل عبر "إعادة تهيئة الداخلية".
                    كل بيانات هذه الشاشة <b>تجريبية بالكامل</b> ولا تمثل بيانات حقيقية.
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="run-seed-btn"><i class="bi bi-shuffle me-1"></i>تنفيذ التعبئة</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);

    const occRange = document.getElementById('seed-occupancy');
    occRange.addEventListener('input', () => { document.getElementById('occ-val').textContent = occRange.value + '%'; });

    document.getElementById('run-seed-btn').addEventListener('click', () => {
        const fd = Object.fromEntries(new FormData(document.getElementById('seed-options-form')).entries());
        const fullSystemActivity = !!document.getElementById('opt-full-activity').checked;
        const options = {
            floorsMin: Number(fd.floorsMin) || 1,
            floorsMax: Number(fd.floorsMax) || 1,
            aptsPerFloorMin: Number(fd.aptsPerFloorMin) || 1,
            aptsPerFloorMax: Number(fd.aptsPerFloorMax) || 1,
            roomsPerAptMin: Number(fd.roomsPerAptMin) || 1,
            roomsPerAptMax: Number(fd.roomsPerAptMax) || 1,
            occupancyPercent: Number(fd.occupancyPercent) || 0,
            paymentPercent: Number(fd.paymentPercent) || 0,
            fullPaymentPercent: Number(fd.fullPaymentPercent) || 0,
            generateServices: !!document.getElementById('opt-services').checked,
            generateGuests: !!document.getElementById('opt-guests').checked,
            generateExpenses: !!document.getElementById('opt-expenses').checked,
            serviceSubscribePercent: Number(fd.serviceSubscribePercent) || 0,
            expensePercentMultiplier: Number(fd.expensePercentMultiplier) || 0,
            fullSystemActivity,
            spreadOverDays: Number(document.getElementById('opt-spread-days').value) || 0
        };
        modal.hide();
        el.addEventListener('hidden.bs.modal', () => {
            const spreadNote = options.spreadOverDays > 0 ? ` وتوزيعها على مدار آخر ${options.spreadOverDays} يوماً` : '';
            const activityNote = fullSystemActivity ? '، بالإضافة لمساهمات رأس مال وسلف شركاء وشراء أصل وتوزيع أرباح تجريبية في صفحات الشراكة والتأسيس والخزينة' : '';
            confirmAction(`سيتم توليد بيانات تجريبية بإشغال ${options.occupancyPercent}%${spreadNote}${activityNote} (فوق أي بيانات موجودة حالياً). تذكّر أن هذه بيانات تجريبية بالكامل ولا تمثل بيانات حقيقية. هل تريد المتابعة؟`, () => {
                const summary = DataService.seedRandomDormitoryData(options);
                const extra = summary.fullSystemActivity
                    ? `، ${summary.advancesCreated} سلفة، ${summary.assetsCreated} أصل، ${summary.distributionsCreated} توزيع أرباح`
                    : '';
                showToast(`تم توليد ${summary.floors} طابق و${summary.rooms} غرفة و${summary.residents} طالبة (إشغال ${summary.occupancyPercent}%) و${summary.expenses} بند مصروف${extra} — بيانات تجريبية بالكامل`, 'success');
                if (typeof updateDevBadge === 'function') updateDevBadge();
                Pages.settings(container);
            }, false);
        }, { once: true });
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}

/* ---------------- تبويب الإيجار والمصروفات ---------------- */
function renderFinancialTabContent(container) {
    const s = DataService.getSettings();
    const box = document.getElementById('set-financial-content');

    box.innerHTML = `
    <div class="row g-3">
        <div class="col-lg-6">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-file-earmark-text me-1 text-teal"></i>إعدادات الإيجار</h2></div>
                <div class="app-card-body">
                    <div class="row g-3">
                        <div class="col-6"><label class="form-label fw-bold">الإيجار الشهري الأساسي</label><input type="number" class="form-control" id="set-rent" value="${s.rent||0}"></div>
                        <div class="col-6"><label class="form-label fw-bold">زيادة التجديد (%)</label><input type="number" class="form-control" id="set-rent-increase" value="${s.rentIncrease||0}"></div>
                    </div>
                    <button class="btn btn-brand btn-sm mt-3" id="save-rent-btn">حفظ</button>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-receipt me-1 text-teal"></i>إعدادات المصروفات</h2></div>
                <div class="app-card-body">
                    <label class="form-label fw-bold">حد الموافقة</label>
                    <input type="number" class="form-control" id="set-approval-limit" value="${s.approvalLimit||0}">
                    <label class="form-label fw-bold mt-3">ميزانية التأسيس</label>
                    <input type="number" class="form-control" id="set-setup-budget" value="${s.setupBudget||0}">
                    <button class="btn btn-brand btn-sm mt-3" id="save-expense-settings-btn">حفظ</button>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('save-rent-btn').addEventListener('click', () => {
        DataService.saveSettings({
            rent: Number(document.getElementById('set-rent').value) || 0,
            rentIncrease: Number(document.getElementById('set-rent-increase').value) || 0
        });
        showToast('تم حفظ إعدادات الإيجار', 'success');
    });
    document.getElementById('save-expense-settings-btn').addEventListener('click', () => {
        DataService.saveSettings({
            approvalLimit: Number(document.getElementById('set-approval-limit').value) || 0,
            setupBudget: Number(document.getElementById('set-setup-budget').value) || 0
        });
        showToast('تم حفظ إعدادات المصروفات', 'success');
    });
}

/* ---------------- تبويب تصفير النظام ---------------- */
function renderDangerTabContent(container) {
    const box = document.getElementById('set-danger');
    box.innerHTML = `
    <div class="app-card" style="border-color:#f5c2c0;">
        <div class="app-card-header"><h2 class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i>تصفير النظام بالكامل</h2></div>
        <div class="app-card-body">
            <p class="text-muted" style="font-size:13.5px;">سيتم حذف <b>كل شيء</b> نهائياً: الشركاء، الطالبات، الغرف، الأسرة، المعاملات، المصروفات (بما فيها الدورية)، الأصول، وسجل النشاط — ويعود النظام إلى حالة فارغة تماماً كأنه مُنصَّب حديثاً.</p>
            <button class="btn btn-outline-danger" id="factory-reset-btn"><i class="bi bi-arrow-counterclockwise me-1"></i>تصفير النظام بالكامل</button>
        </div>
    </div>`;

    document.getElementById('factory-reset-btn').addEventListener('click', () => {
        confirmAction('سيتم حذف كل بيانات النظام نهائياً (الشركاء، الطالبات، الغرف، الأسرة، المعاملات، المصروفات، الأصول). هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟', () => {
            DataService.factoryReset();
            showToast('تم تصفير النظام بالكامل بنجاح', 'success');
            window.location.hash = '#/dashboard';
            router();
        });
    });
}

function openAddPartnerModal() {
    const id = 'addPartnerModal';
    document.getElementById(id)?.remove();
    const html = `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-person-plus me-2 text-teal"></i>إضافة شريك</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
          <div class="modal-body">
            <form id="partner-form">
                <div class="mb-3"><label class="form-label fw-bold">اسم الشريك</label><input class="form-control" name="name" required></div>
                <div class="mb-3"><label class="form-label fw-bold">نسبة الملكية (%)</label><input type="number" class="form-control" name="ownership" min="0" max="100" required></div>
                <div class="mb-3"><label class="form-label fw-bold">الصفة</label><input class="form-control" name="role" placeholder="شريك مؤسس" value="شريك مؤسس"></div>
                <div class="mb-1">
                    <label class="form-label fw-bold">المساهمة المطلوبة (رأس المال المتفق عليه)</label>
                    <input type="number" class="form-control" name="requiredContribution" min="0" value="0">
                    <div class="form-text" style="font-size:11px;">أي مبلغ يسدده الشريك أكتر من هذا الرقم يُعتبر تلقائياً سلفة/ديناً على الداخلية له — يمكن تعديله لاحقاً من صفحة الشركاء.</div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-light border" data-bs-dismiss="modal">إلغاء</button>
            <button class="btn btn-brand" id="save-partner-btn">حفظ</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-root').insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const modal = new bootstrap.Modal(el);
    document.getElementById('save-partner-btn').addEventListener('click', () => {
        const form = document.getElementById('partner-form');
        if (!form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form).entries());
        DataService.addPartner(fd);
        modal.hide();
        showToast('تم إضافة الشريك بنجاح', 'success');
        router();
    });
    el.addEventListener('hidden.bs.modal', () => el.remove());
    modal.show();
}
