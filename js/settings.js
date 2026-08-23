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
                    <div class="row g-2 mb-3">
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">طوابق</div><div class="kpi-value" style="font-size:18px;">${floors.length}</div></div></div>
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">غرف</div><div class="kpi-value" style="font-size:18px;">${rooms.length}</div></div></div>
                        <div class="col-4"><div class="kpi-card p-2"><div class="kpi-label">أسرّة</div><div class="kpi-value" style="font-size:18px;">${DataService.getBeds().length}</div></div></div>
                    </div>
                    <p class="text-muted" style="font-size:12.5px;">إدارة الطوابق والشقق والغرف والأسرة بالتفصيل تتم من صفحة <b>"الداخلية ← هيكل الداخلية"</b> — هناك تقدر تبني الهرم كاملاً وتضيف/تحذف أي مستوى.</p>
                    <a href="#/dormitory" class="btn btn-brand btn-sm">فتح هيكل الداخلية</a>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="app-card">
                <div class="app-card-header"><h2><i class="bi bi-cash-coin me-1 text-teal"></i>سعر السرير الافتراضي</h2></div>
                <div class="app-card-body">
                    <p class="text-muted" style="font-size:12px;">يُستخدم كقيمة مبدئية عند إنشاء غرفة جديدة — يمكن تغيير سعر كل غرفة بشكل مستقل.</p>
                    <label class="form-label fw-bold">سعر السرير الشهري</label>
                    <input type="number" class="form-control" id="set-bedprice" value="${s.bedPrice||0}">
                    <button class="btn btn-brand btn-sm mt-2" id="save-dorm-btn">حفظ</button>
                </div>
            </div>
        </div>
    </div>

    <div class="app-card mt-3" style="border-color:#f2dfb0;">
        <div class="app-card-header"><h2><i class="bi bi-shuffle me-1 text-teal"></i>بيانات تجريبية للداخلية</h2></div>
        <div class="app-card-body">
            <p class="text-muted mb-3" style="font-size:13px;">
                <i class="bi bi-info-circle text-teal me-1"></i>
                لتجربة النظام بسرعة: <b>"تعبئة عشوائية"</b> بتولّد لك طوابق وشقق وغرف وأسرة عشوائية،
                وتسكّن <b>100% منها</b> (كل الأسرة بدون استثناء) بطالبات وهميات (بأسماء ومدفوعات
                وخدمات وضيفات عشوائية)، مع <b>مصروفات تشغيلية واقعية</b> (إيجار، مرتبات، كهرباء، مياه...) بنسبة
                من الإيراد المحصَّل — عشان لوحة التحكم والتقارير والرسوم البيانية (الأرباح،
                الإشغال، اتجاه الإيرادات والمصروفات...) كلها تشتغل وتوريك وضعاً مالياً منطقياً
                ومترابطاً، من غير ما تلمس الشركاء أو إعدادات المالية العامة. و<b>"إعادة تهيئة
                الداخلية"</b> بتمسح كل ده (بما فيها المصروفات التجريبية فقط) وترجّع الداخلية فاضية
                تماماً عشان تجرّب من جديد.
            </p>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-brand btn-sm" id="seed-random-dorm-btn"><i class="bi bi-shuffle me-1"></i>تعبئة عشوائية للتجربة (إشغال 100%)</button>
                <button class="btn btn-outline-danger btn-sm" id="reset-dorm-only-btn"><i class="bi bi-arrow-counterclockwise me-1"></i>إعادة تهيئة الداخلية من الصفر</button>
            </div>
        </div>
    </div>`;

    document.getElementById('save-dorm-btn').addEventListener('click', () => {
        DataService.saveSettings({ bedPrice: Number(document.getElementById('set-bedprice').value) || 0 });
        showToast('تم حفظ إعدادات الداخلية', 'success');
    });

    document.getElementById('seed-random-dorm-btn').addEventListener('click', () => {
        confirmAction('سيتم توليد طوابق وشقق وغرف وأسرة عشوائية وتسكينها بالكامل (100%) بطالبات وهميات، بالإضافة لمصروفات تشغيلية تجريبية واقعية (فوق أي بيانات موجودة حالياً في الداخلية). هل تريد المتابعة؟', () => {
            const summary = DataService.seedRandomDormitoryData();
            showToast(`تم توليد ${summary.floors} طابق و${summary.rooms} غرفة و${summary.residents} طالبة (إشغال 100%) و${summary.expenses} بند مصروف تجريبياً`, 'success');
            Pages.settings(container);
        }, false);
    });

    document.getElementById('reset-dorm-only-btn').addEventListener('click', () => {
        confirmAction('سيتم حذف كل شيء في الداخلية نهائياً (الطوابق، الشقق، الغرف، الأسرة، الطالبات، الضيفات، الخدمات، الإجازات) وأي إيرادات ومصروفات تجريبية ناتجة عنها. الشركاء وإعدادات المالية العامة والمصروفات الحقيقية لن يتأثروا. هذا الإجراء لا يمكن التراجع عنه. هل تريد المتابعة؟', () => {
            DataService.resetDormitoryOnly();
            showToast('تم إعادة تهيئة الداخلية من الصفر', 'warning');
            Pages.settings(container);
        });
    });
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
