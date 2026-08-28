/* ==========================================================================
   data.js
   طبقة تجريدية للتخزين (StorageService) + منطق الأعمال (DataService)
   مصممة بحيث يمكن استبدال localStorage لاحقاً بـ Supabase / PostgreSQL / API
   دون إعادة بناء واجهة المستخدم.
   ========================================================================== */

const STORAGE_KEYS = {
    partners: 'dorm_partners',
    transactions: 'dorm_transactions',
    expenses: 'dorm_expenses',
    residents: 'dorm_residents',
    rooms: 'dorm_rooms',
    beds: 'dorm_beds',
    assets: 'dorm_assets',
    activities: 'dorm_activities',
    settings: 'dorm_settings',
    closings: 'dorm_closings',
    meta: 'dorm_meta',
    uiState: 'dorm_ui_state',
    recurringExpenses: 'dorm_recurring_expenses',
    recurringIncomes: 'dorm_recurring_incomes',
    floors: 'dorm_floors',
    apartments: 'dorm_apartments',
    bathrooms: 'dorm_bathrooms',
    roomTypes: 'dorm_room_types',
    guests: 'dorm_guests',
    services: 'dorm_services',
    residentServices: 'dorm_resident_services',
    vacations: 'dorm_vacations',
    transfers: 'dorm_transfers'
};

/* ------------------------------------------------------------------------
   ثوابت هيكل الداخلية: أنواع الغرف، الأسرة، الحالات، الخدمات
   ------------------------------------------------------------------------ */
const DEFAULT_ROOM_TYPES = [
    { key: 'مفردة', label: 'مفردة (سرير واحد)', capacity: 1 },
    { key: 'مزدوجة', label: 'مزدوجة (سريرين)', capacity: 2 },
    { key: 'ثلاثية', label: 'ثلاثية (3 أسرة)', capacity: 3 },
    { key: 'رباعية', label: 'رباعية (4 أسرة)', capacity: 4 },
    { key: 'أسرّة بطابقين', label: 'غرفة أسرّة بطابقين (سعة حرة)', capacity: 4 }
];
const BED_TYPES = ['سرير عادي', 'سرير علوي', 'سرير سفلي', 'سرير بطابقين', 'سرير إضافي', 'مخصص'];
const BED_STATUSES = ['متاح', 'محجوز', 'مشغول', 'محجوز مؤقتاً', 'صيانة', 'خارج الخدمة', 'تنظيف', 'محجوز للإجازة'];
const BED_AVAILABLE_STATUS = 'متاح';
const BATHROOM_TYPES = ['حمام مشترك', 'حمام خاص', 'حمام خدمة', 'أخرى'];
const SERVICE_TYPE_DEFS = ['الطعام', 'الإنترنت', 'المكتبة', 'الترحيل', 'أخرى'];
const TRANSFER_REASONS = ['طلب الطالبة', 'صيانة', 'تغيير إداري', 'مشكلة في الغرفة', 'ترقية', 'أخرى'];
const VACATION_STATUSES = ['طلب جديد', 'معتمدة', 'في إجازة', 'تمت العودة', 'تم تمديدها', 'ملغاة'];

/* ------------------------------------------------------------------------
   StorageService — طبقة تجريدية عامة فوق localStorage
   get() set() add() update() remove() clear()
   يمكن لاحقاً استبدال جسم هذه الدوال بنداءات fetch() لواجهة API حقيقية
   دون تغيير أي كود آخر في التطبيق.
   ------------------------------------------------------------------------ */
const StorageService = {
    get(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('StorageService.get error', key, e);
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('StorageService.set error', key, e);
            return false;
        }
    },
    add(key, item) {
        const list = this.get(key) || [];
        list.push(item);
        this.set(key, list);
        return item;
    },
    update(key, id, patch) {
        const list = this.get(key) || [];
        const idx = list.findIndex(x => x.id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...patch };
        this.set(key, list);
        return list[idx];
    },
    remove(key, id) {
        const list = this.get(key) || [];
        const filtered = list.filter(x => x.id !== id);
        this.set(key, filtered);
        return filtered;
    },
    clear(key) {
        localStorage.removeItem(key);
    }
};

/* ------------------------------------------------------------------------
   أدوات مساعدة عامة
   ------------------------------------------------------------------------ */
const Utils = {
    uid(prefix = 'id') {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    },
    formatMoney(n) {
        n = Number(n) || 0;
        return n.toLocaleString('en-US') + ' ج.س';
    },
    formatNumber(n) {
        return (Number(n) || 0).toLocaleString('en-US');
    },
    todayISO() {
        return new Date().toISOString().slice(0, 10);
    },
    nowStamp() {
        const d = new Date();
        return d.toLocaleString('ar-SD', { hour: 'numeric', minute: 'numeric', hour12: true, day: 'numeric', month: 'long', year: 'numeric' });
    },
    monthKey(dateStr) {
        return (dateStr || Utils.todayISO()).slice(0, 7); // YYYY-MM
    },
    monthLabel(monthKey) {
        const [y, m] = monthKey.split('-');
        const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        return `${months[parseInt(m,10)-1]} ${y}`;
    },
    currentUserName() {
        return DataService.getSettings().currentUser || 'أيمن';
    },
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    },
    csvDownload(filename, rows) {
        const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
};

/* ==========================================================================
   DataService — منطق الأعمال المبني فوق StorageService
   ========================================================================== */
const DataService = {

    /* ---------------------- الإعدادات ---------------------- */
    getSettings() {
        return StorageService.get(STORAGE_KEYS.settings) || {};
    },
    saveSettings(patch) {
        const current = this.getSettings();
        const updated = { ...current, ...patch };
        StorageService.set(STORAGE_KEYS.settings, updated);
        return updated;
    },

    /* ---------------------- الشركاء ---------------------- */
    getPartners() {
        return StorageService.get(STORAGE_KEYS.partners) || [];
    },
    getPartner(name) {
        return this.getPartners().find(p => p.name === name);
    },
    addPartner(data) {
        const partners = this.getPartners();
        const record = {
            id: Utils.uid('partner'), name: (data.name||'').trim(), ownership: Number(data.ownership) || 0,
            role: data.role || 'شريك', requiredContribution: Number(data.requiredContribution) || 0
        };
        partners.push(record);
        StorageService.set(STORAGE_KEYS.partners, partners);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف شريكاً جديداً', entity: record.name });
        return record;
    },
    updatePartner(id, patch) {
        const partners = this.getPartners();
        const idx = partners.findIndex(p => p.id === id);
        if (idx === -1) return null;
        partners[idx] = {
            ...partners[idx], ...patch,
            ownership: patch.ownership !== undefined ? Number(patch.ownership) || 0 : partners[idx].ownership,
            requiredContribution: patch.requiredContribution !== undefined ? Number(patch.requiredContribution) || 0 : partners[idx].requiredContribution
        };
        StorageService.set(STORAGE_KEYS.partners, partners);
        return partners[idx];
    },
    removePartner(id) {
        const partner = this.getPartners().find(p => p.id === id);
        const partners = this.getPartners().filter(p => p.id !== id);
        StorageService.set(STORAGE_KEYS.partners, partners);
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف شريكاً', entity: partner ? partner.name : '' });
    },

    /* ---------------------- المعاملات ---------------------- */
    getTransactions() {
        return (StorageService.get(STORAGE_KEYS.transactions) || []).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    addTransaction(tx) {
        const settings = this.getSettings();
        const record = {
            id: Utils.uid('tx'),
            date: tx.date || Utils.todayISO(),
            description: tx.description || '',
            type: tx.type,
            category: tx.category || '',
            amount: Number(tx.amount) || 0,
            partner: tx.partner || '',
            paymentSource: tx.paymentSource || 'الخزينة',
            status: tx.status || 'مسجلة',
            attachment: tx.attachment || '',
            notes: tx.notes || '',
            createdBy: tx.createdBy || Utils.currentUserName(),
            createdAt: new Date().toISOString(),
            reversed: false
        };
        StorageService.add(STORAGE_KEYS.transactions, record);
        this.addActivity({
            user: record.createdBy,
            action: `أضاف معاملة (${record.type})`,
            entity: record.description,
            amount: record.amount
        });
        return record;
    },
    cancelTransaction(id, user) {
        const list = StorageService.get(STORAGE_KEYS.transactions) || [];
        const original = list.find(t => t.id === id);
        if (!original || original.reversed) return null;
        StorageService.update(STORAGE_KEYS.transactions, id, { status: 'ملغاة', reversed: true, cancelledBy: user, cancelledAt: new Date().toISOString() });
        const reversal = {
            id: Utils.uid('tx'),
            date: Utils.todayISO(),
            description: `إلغاء: ${original.description}`,
            type: 'تسوية',
            category: 'إلغاء معاملة',
            amount: -Math.abs(original.amount),
            partner: original.partner,
            paymentSource: original.paymentSource,
            status: 'مسجلة',
            attachment: '',
            notes: `عكس للمعاملة رقم ${original.id}`,
            createdBy: user || Utils.currentUserName(),
            createdAt: new Date().toISOString(),
            reversed: false,
            reversalOf: original.id
        };
        StorageService.add(STORAGE_KEYS.transactions, reversal);
        this.addActivity({ user: reversal.createdBy, action: 'ألغى معاملة وأنشأ قيد عكسي', entity: original.description, amount: original.amount });
        return reversal;
    },

    /* ---------------------- المصروفات ---------------------- */
    getExpenses() {
        return (StorageService.get(STORAGE_KEYS.expenses) || []).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    addExpense(exp) {
        const record = {
            id: Utils.uid('exp'),
            date: exp.date || Utils.todayISO(),
            category: exp.category || 'أخرى',
            amount: Number(exp.amount) || 0,
            chargedAmount: exp.chargedAmount !== undefined && exp.chargedAmount !== '' ? Number(exp.chargedAmount) : Number(exp.amount) || 0,
            description: exp.description || '',
            paidBy: exp.paidBy || '',
            paymentSource: exp.paymentSource || 'الخزينة',
            nature: exp.nature || 'تجاري', // تجاري / شخصي
            needsAllocation: !!exp.needsAllocation,
            attachment: exp.attachment || '',
            status: exp.status || 'مسجل',
            createdBy: exp.createdBy || Utils.currentUserName(),
            createdAt: new Date().toISOString(),
            reversed: false
        };
        StorageService.add(STORAGE_KEYS.expenses, record);
        this.addActivity({ user: record.createdBy, action: `سجل مصروفاً (${record.category})`, entity: record.description, amount: record.amount });
        return record;
    },
    updateExpense(id, patch) {
        const updated = StorageService.update(STORAGE_KEYS.expenses, id, patch);
        if (updated) this.addActivity({ user: Utils.currentUserName(), action: 'حدّث توزيع مصروف', entity: updated.description, amount: updated.chargedAmount });
        return updated;
    },
    cancelExpense(id, user) {
        const updated = StorageService.update(STORAGE_KEYS.expenses, id, { status: 'ملغى', reversed: true });
        if (updated) this.addActivity({ user: user || Utils.currentUserName(), action: 'ألغى مصروفاً', entity: updated.description, amount: updated.amount });
        return updated;
    },
    // اعتماد مصروف كبير يحتاج موافقة قبل احتسابه بشكل نهائي
    approveExpense(id) {
        const user = Utils.currentUserName();
        const updated = StorageService.update(STORAGE_KEYS.expenses, id, { approved: true, approvedBy: user, approvedAt: new Date().toISOString() });
        if (updated) this.addActivity({ user, action: 'وافق على مصروف', entity: updated.description, amount: updated.amount });
        return updated;
    },
    // رفض مصروف يحتاج موافقة (يُعامَل مثل الإلغاء لكن بسبب مختلف، ويبقى في السجل)
    rejectExpense(id) {
        const user = Utils.currentUserName();
        const exp = this.getExpenses().find(e => e.id === id);
        const updated = StorageService.update(STORAGE_KEYS.expenses, id, { status: 'مرفوض', reversed: true, rejectedBy: user, rejectedAt: new Date().toISOString() });
        if (updated) this.addActivity({ user, action: 'رفض مصروفاً', entity: exp ? exp.description : '' });
        return updated;
    },

    /* ---------------------- الطوابق ---------------------- */
    getFloors() {
        return (StorageService.get(STORAGE_KEYS.floors) || []).sort((a,b) => (a.order||0) - (b.order||0));
    },
    getFloor(id) {
        return this.getFloors().find(f => f.id === id);
    },
    addFloor(data) {
        const floors = StorageService.get(STORAGE_KEYS.floors) || [];
        const record = {
            id: Utils.uid('floor'),
            name: data.name || `الطابق ${floors.length + 1}`,
            order: Number(data.order) || (floors.length + 1),
            description: data.description || '',
            status: 'نشط',
            notes: data.notes || '',
            updates: [],
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.floors, record);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف طابقاً جديداً', entity: record.name });
        return record;
    },
    updateFloor(id, patch) {
        return StorageService.update(STORAGE_KEYS.floors, id, patch);
    },
    removeFloor(id) {
        const apts = this.getApartmentsByFloor(id);
        if (apts.length) return { error: 'لا يمكن حذف الطابق لوجود شقق مرتبطة به — احذف الشقق أولاً' };
        const floor = this.getFloor(id);
        const floors = (StorageService.get(STORAGE_KEYS.floors) || []).filter(f => f.id !== id);
        StorageService.set(STORAGE_KEYS.floors, floors);
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف طابقاً', entity: floor ? floor.name : '' });
        return { success: true };
    },

    /* ---------------------- الشقق ---------------------- */
    getApartments() {
        return StorageService.get(STORAGE_KEYS.apartments) || [];
    },
    getApartment(id) {
        return this.getApartments().find(a => a.id === id);
    },
    getApartmentsByFloor(floorId) {
        return this.getApartments().filter(a => a.floorId === floorId);
    },
    addApartment(data) {
        const apartments = this.getApartments();
        const number = (data.number || '').trim();
        if (number && apartments.some(a => a.number === number)) {
            return { error: `رقم الشقة "${number}" مستخدم بالفعل — لازم يكون رقم الشقة فريداً` };
        }
        const record = {
            id: Utils.uid('apt'),
            number: number || String(apartments.length + 1),
            name: data.name || '',
            floorId: data.floorId,
            status: 'نشطة',
            notes: data.notes || '',
            updates: [],
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.apartments, record);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف شقة جديدة', entity: `شقة ${record.number}` });
        return record;
    },
    updateApartment(id, patch) {
        return StorageService.update(STORAGE_KEYS.apartments, id, patch);
    },
    removeApartment(id) {
        const rooms = this.getRoomsByApartment(id);
        if (rooms.length) return { error: 'لا يمكن حذف الشقة لوجود غرف مرتبطة بها — احذف الغرف أولاً' };
        const apt = this.getApartment(id);
        const apartments = this.getApartments().filter(a => a.id !== id);
        StorageService.set(STORAGE_KEYS.apartments, apartments);
        const bathrooms = this.getBathrooms().filter(b => b.apartmentId !== id);
        StorageService.set(STORAGE_KEYS.bathrooms, bathrooms);
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف شقة', entity: apt ? `شقة ${apt.number}` : '' });
        return { success: true };
    },

    /* ---------------------- الحمامات ---------------------- */
    getBathrooms() {
        return StorageService.get(STORAGE_KEYS.bathrooms) || [];
    },
    getBathroomsByApartment(apartmentId) {
        return this.getBathrooms().filter(b => b.apartmentId === apartmentId);
    },
    addBathroom(data) {
        const bathrooms = this.getBathrooms();
        const record = {
            id: Utils.uid('bath'),
            name: data.name || `حمام ${bathrooms.length + 1}`,
            apartmentId: data.apartmentId,
            type: data.type || 'حمام مشترك',
            status: 'نشط',
            notes: data.notes || '',
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.bathrooms, record);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف حماماً', entity: record.name });
        return record;
    },
    removeBathroom(id) {
        const bathrooms = this.getBathrooms().filter(b => b.id !== id);
        StorageService.set(STORAGE_KEYS.bathrooms, bathrooms);
    },

    /* ---------------------- أنواع الغرف (افتراضية + مخصصة) ---------------------- */
    getCustomRoomTypes() {
        return StorageService.get(STORAGE_KEYS.roomTypes) || [];
    },
    getAllRoomTypes() {
        return [...DEFAULT_ROOM_TYPES, ...this.getCustomRoomTypes()];
    },
    addCustomRoomType(data) {
        const types = this.getCustomRoomTypes();
        const record = {
            key: data.name, label: data.name,
            capacity: Number(data.capacity) || 2,
            price: Number(data.price) || 0,
            description: data.description || '',
            amenities: data.amenities || '',
            status: 'نشط', custom: true
        };
        types.push(record);
        StorageService.set(STORAGE_KEYS.roomTypes, types);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف نوع غرفة مخصصاً', entity: record.label });
        return record;
    },

    /* ---------------------- الغرف ---------------------- */
    getRooms() {
        return StorageService.get(STORAGE_KEYS.rooms) || [];
    },
    getRoom(roomId) {
        return this.getRooms().find(r => r.id === roomId);
    },
    getRoomsByApartment(apartmentId) {
        return this.getRooms().filter(r => r.apartmentId === apartmentId);
    },
    // اشتقاق الموقع الكامل لغرفة: الشقة والطابق (بدون تكرار تخزين البيانات)
    getRoomLocation(roomId) {
        const room = this.getRoom(roomId);
        if (!room) return {};
        const apartment = this.getApartment(room.apartmentId);
        const floor = apartment ? this.getFloor(apartment.floorId) : null;
        return { room, apartment, floor };
    },
    updateRoomNotes(roomId, notes, description) {
        const room = this.getRoom(roomId);
        if (!room) return null;
        const user = Utils.currentUserName();
        const updates = [...(room.updates || []), {
            id: Utils.uid('upd'), date: Utils.todayISO(),
            description: description || 'تم تحديث ملاحظات الغرفة',
            by: user, timestamp: new Date().toISOString()
        }];
        const updated = StorageService.update(STORAGE_KEYS.rooms, roomId, { notes, updates });
        this.addActivity({ user, action: 'حدّث ملاحظات غرفة', entity: `غرفة ${room.number}` });
        return updated;
    },
    addRoom(data) {
        const rooms = this.getRooms();
        const beds = this.getBeds();
        const number = (data.number || '').trim() || String(rooms.length + 1).padStart(2, '0');
        const capacity = Math.max(1, Number(data.capacity) || 2);
        const roomId = Utils.uid('room');
        const room = {
            id: roomId, number, apartmentId: data.apartmentId,
            roomType: data.roomType || 'مزدوجة', capacity,
            price: Number(data.price) || 0,
            status: 'نشطة', notes: data.notes || '', updates: []
        };
        rooms.push(room);
        for (let i = 1; i <= capacity; i++) {
            beds.push({ id: Utils.uid('bed'), roomId, number: i, bedType: 'سرير عادي', status: 'متاح', notes: '', updates: [] });
        }
        StorageService.set(STORAGE_KEYS.rooms, rooms);
        StorageService.set(STORAGE_KEYS.beds, beds);
        this.saveSettings({ roomsCount: rooms.length, bedsCount: beds.length });
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف غرفة جديدة', entity: `غرفة ${number} (${capacity} سرير)` });
        return room;
    },
    removeRoom(roomId) {
        const hasResident = this.getResidents().some(r => r.roomId === roomId && !r.checkOut);
        if (hasResident) return { error: 'توجد طالبة مسكّنة في هذه الغرفة حالياً — لا يمكن حذفها' };
        const room = this.getRoom(roomId);
        const rooms = this.getRooms().filter(r => r.id !== roomId);
        const beds = this.getBeds().filter(b => b.roomId !== roomId);
        StorageService.set(STORAGE_KEYS.rooms, rooms);
        StorageService.set(STORAGE_KEYS.beds, beds);
        this.saveSettings({ roomsCount: rooms.length, bedsCount: beds.length });
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف غرفة', entity: room ? `غرفة ${room.number}` : '' });
        return { success: true };
    },
    // حالة الغرفة مُشتقّة من أسرّتها: شاغرة / مشغولة بالكامل / شاغرة جزئياً
    getRoomOccupancyState(roomId) {
        const beds = this.getBedsByRoom(roomId);
        const occupied = beds.filter(b => !this.isBedAvailableStatus(b.status) && b.status !== 'متاح').length;
        const available = beds.filter(b => b.status === 'متاح').length;
        if (!beds.length) return 'فارغة';
        if (available === beds.length) return 'شاغرة بالكامل';
        if (available === 0) return 'مشغولة بالكامل';
        return 'شاغرة جزئياً';
    },

    /* ---------------------- الأسرة ---------------------- */
    getBeds() {
        return StorageService.get(STORAGE_KEYS.beds) || [];
    },
    getBed(bedId) {
        return this.getBeds().find(b => b.id === bedId);
    },
    getBedsByRoom(roomId) {
        return this.getBeds().filter(b => b.roomId === roomId);
    },
    // اشتقاق الموقع الكامل لسرير: الغرفة، الشقة، الطابق
    getBedLocation(bedId) {
        const bed = this.getBed(bedId);
        if (!bed) return {};
        const { room, apartment, floor } = this.getRoomLocation(bed.roomId);
        return { bed, room, apartment, floor };
    },
    bedLocationLabel(bedId) {
        const { bed, room, apartment, floor } = this.getBedLocation(bedId);
        if (!bed) return '—';
        const parts = [];
        if (floor) parts.push(floor.name);
        if (apartment) parts.push(`شقة ${apartment.number}`);
        if (room) parts.push(`غرفة ${room.number}`);
        parts.push(`سرير ${bed.number}`);
        return parts.join(' ← ');
    },
    isBedAvailableStatus(status) {
        return status === BED_AVAILABLE_STATUS;
    },
    addBed(data) {
        const beds = this.getBeds();
        const room = this.getRoom(data.roomId);
        const number = data.number || (beds.filter(b => b.roomId === data.roomId).length + 1);
        const record = {
            id: Utils.uid('bed'), roomId: data.roomId, number,
            bedType: data.bedType || 'سرير عادي',
            status: data.status || 'متاح', notes: data.notes || '', updates: []
        };
        beds.push(record);
        StorageService.set(STORAGE_KEYS.beds, beds);
        if (room) StorageService.update(STORAGE_KEYS.rooms, room.id, { capacity: (room.capacity || 0) + 1 });
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف سريراً جديداً', entity: this.bedLocationLabel(record.id) });
        return record;
    },
    updateBedStatus(bedId, status, note) {
        const bed = this.getBed(bedId);
        if (!bed) return null;
        const user = Utils.currentUserName();
        const updates = [...(bed.updates || []), {
            id: Utils.uid('upd'), date: Utils.todayISO(),
            description: `تغييرت حالة السرير من "${bed.status}" إلى "${status}"${note ? ' — ' + note : ''}`,
            by: user, timestamp: new Date().toISOString()
        }];
        const updated = StorageService.update(STORAGE_KEYS.beds, bedId, { status, updates });
        this.addActivity({ user, action: `غيّر حالة سرير إلى "${status}"`, entity: this.bedLocationLabel(bedId) });
        return updated;
    },

    /* ---------------------- إحصاءات الإشغال على كل مستوى ---------------------- */
    occupancyStats() {
        const beds = this.getBeds();
        const total = beds.length;
        const occupied = beds.filter(b => b.status === 'مشغول').length;
        const reserved = beds.filter(b => b.status === 'محجوز' || b.status === 'محجوز مؤقتاً').length;
        const maintenance = beds.filter(b => b.status === 'صيانة' || b.status === 'خارج الخدمة' || b.status === 'تنظيف').length;
        const vacationHold = beds.filter(b => b.status === 'محجوز للإجازة').length;
        const available = beds.filter(b => b.status === 'متاح').length;
        const rate = total ? Math.round((occupied / total) * 1000) / 10 : 0;
        return { total, occupied, reserved, maintenance, vacationHold, available, rate };
    },
    getFloorStats(floorId) {
        const apartments = this.getApartmentsByFloor(floorId);
        const apartmentIds = apartments.map(a => a.id);
        const rooms = this.getRooms().filter(r => apartmentIds.includes(r.apartmentId));
        const roomIds = rooms.map(r => r.id);
        const beds = this.getBeds().filter(b => roomIds.includes(b.roomId));
        const occupied = beds.filter(b => b.status === 'مشغول').length;
        const available = beds.filter(b => b.status === 'متاح').length;
        const maintenance = beds.filter(b => b.status === 'صيانة' || b.status === 'خارج الخدمة' || b.status === 'تنظيف').length;
        const roomsAvailable = rooms.filter(r => this.getRoomOccupancyState(r.id) === 'شاغرة بالكامل').length;
        const roomsOccupied = rooms.filter(r => this.getRoomOccupancyState(r.id) === 'مشغولة بالكامل').length;
        return {
            apartmentsCount: apartments.length, roomsCount: rooms.length,
            roomsAvailable, roomsOccupied,
            bedsCount: beds.length, occupied, available, maintenance,
            rate: beds.length ? Math.round(occupied / beds.length * 1000) / 10 : 0
        };
    },
    getApartmentStats(apartmentId) {
        const rooms = this.getRoomsByApartment(apartmentId);
        const roomIds = rooms.map(r => r.id);
        const beds = this.getBeds().filter(b => roomIds.includes(b.roomId));
        const occupied = beds.filter(b => b.status === 'مشغول').length;
        const reserved = beds.filter(b => b.status === 'محجوز' || b.status === 'محجوز مؤقتاً').length;
        const maintenance = beds.filter(b => b.status === 'صيانة' || b.status === 'خارج الخدمة' || b.status === 'تنظيف').length;
        const available = beds.filter(b => b.status === 'متاح').length;
        const bathrooms = this.getBathroomsByApartment(apartmentId);
        return {
            roomsCount: rooms.length, bathroomsCount: bathrooms.length, bedsCount: beds.length,
            occupied, reserved, maintenance, available,
            rate: beds.length ? Math.round(occupied / beds.length * 1000) / 10 : 0
        };
    },

    /* ---------------------- الطالبات ---------------------- */
    getResidents() {
        return StorageService.get(STORAGE_KEYS.residents) || [];
    },
    getResident(id) {
        return this.getResidents().find(r => r.id === id);
    },
    addResident(r) {
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('res'),
            name: r.name || '',
            phone: r.phone || '',
            university: r.university || '',
            homeRegion: r.homeRegion || '',
            fatherName: r.fatherName || '',
            fatherPhone: r.fatherPhone || '',
            fatherJob: r.fatherJob || '',
            motherName: r.motherName || '',
            motherPhone: r.motherPhone || '',
            motherJob: r.motherJob || '',
            notes: r.notes || '',
            roomId: r.roomId, roomNumber: r.roomNumber, bedId: r.bedId, bedNumber: r.bedNumber,
            checkIn: r.checkIn || Utils.todayISO(), checkOut: r.checkOut || '',
            monthlyRent: Number(r.monthlyRent) || 0,
            paymentStatus: r.paymentStatus || 'مستحق',
            status: 'مقيمة',
            payments: [],
            updates: [{ id: Utils.uid('upd'), date: Utils.todayISO(), description: 'تم تسجيل الطالبة في النظام', by: user, timestamp: new Date().toISOString() }],
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.residents, record);
        if (record.bedId) this.updateBedStatus(record.bedId, 'مشغول', `تسكين الطالبة ${record.name}`);
        this.addActivity({ user, action: 'سجّل طالبة جديدة', entity: record.name, amount: record.monthlyRent });
        return record;
    },
    updateResidentProfile(id, patch, description) {
        const resident = this.getResident(id);
        if (!resident) return null;
        const user = Utils.currentUserName();
        const updates = [...(resident.updates || []), {
            id: Utils.uid('upd'), date: Utils.todayISO(),
            description: description || 'تم تحديث بيانات الطالبة',
            by: user, timestamp: new Date().toISOString()
        }];
        const result = StorageService.update(STORAGE_KEYS.residents, id, { ...patch, updates });
        // تحرير السرير تلقائياً أول مرة يُسجَّل فيها تاريخ خروج للطالبة
        if (patch.checkOut && !resident.checkOut && resident.bedId) {
            this.updateBedStatus(resident.bedId, 'متاح', `تحرَّر تلقائياً بعد خروج الطالبة ${resident.name}`);
        }
        return result;
    },
    // للاستخدام الداخلي السريع (بدون سجل تحديث) — مثل ربط سرير بالحالة فقط
    updateResident(id, patch) {
        return StorageService.update(STORAGE_KEYS.residents, id, patch);
    },
    addResidentPayment(residentId, payment) {
        const resident = this.getResident(residentId);
        if (!resident) return null;
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('pay'), date: payment.date || Utils.todayISO(),
            amount: Number(payment.amount) || 0, method: payment.method || 'نقدي',
            note: payment.note || '', by: user, timestamp: new Date().toISOString()
        };
        const payments = [...(resident.payments || []), record];
        const updates = [...(resident.updates || []), {
            id: Utils.uid('upd'), date: record.date,
            description: `تم تسجيل دفعة بمبلغ ${Utils.formatMoney(record.amount)}${record.note ? ' — ' + record.note : ''}`,
            by: user, timestamp: new Date().toISOString()
        }];
        StorageService.update(STORAGE_KEYS.residents, residentId, { payments, updates, paymentStatus: 'مسدد' });
        this.addTransaction({
            date: record.date, description: `تحصيل إيجار — ${resident.name}`,
            type: 'إيراد', category: 'إيراد سكن وإعاشة', amount: record.amount, partner: '',
            paymentSource: record.method, status: 'مسجلة', createdBy: user
        });
        this.addActivity({ user, action: 'سجّل دفعة من طالبة', entity: resident.name, amount: record.amount });
        return record;
    },
    // دفعة بتوزيع على أكثر من بند (سكن/طعام/إنترنت/مكتبة/ترحيل) بدل ما تكون كلها سكن فقط
    addAllocatedPayment(residentId, payment) {
        const resident = this.getResident(residentId);
        if (!resident) return null;
        const user = Utils.currentUserName();
        const allocation = payment.allocation || {};
        const total = Object.values(allocation).reduce((s, v) => s + (Number(v) || 0), 0);
        const record = {
            id: Utils.uid('pay'), date: payment.date || Utils.todayISO(),
            amount: total, method: payment.method || 'نقدي', allocation,
            note: payment.note || '', by: user, timestamp: new Date().toISOString()
        };
        const payments = [...(resident.payments || []), record];
        const updates = [...(resident.updates || []), {
            id: Utils.uid('upd'), date: record.date,
            description: `تم تسجيل دفعة موزّعة بمبلغ ${Utils.formatMoney(total)}`,
            by: user, timestamp: new Date().toISOString()
        }];
        StorageService.update(STORAGE_KEYS.residents, residentId, { payments, updates });
        const CATEGORY_LABELS = { accommodation: 'إيراد سكن وإعاشة', food: 'إيراد خدمة الطعام', internet: 'إيراد خدمة الإنترنت', library: 'إيراد المكتبة', transport: 'إيراد الترحيل', guest: 'إيراد استضافة' };
        Object.entries(allocation).forEach(([key, amt]) => {
            const amount = Number(amt) || 0;
            if (amount <= 0) return;
            this.addTransaction({
                date: record.date, description: `${CATEGORY_LABELS[key] || 'دفعة'} — ${resident.name}`,
                type: 'إيراد', category: CATEGORY_LABELS[key] || 'إيراد آخر', amount, partner: '',
                paymentSource: record.method, status: 'مسجلة', createdBy: user
            });
        });
        // تحديث حالة الدفع بناءً على المستحق الشهري
        const due = this.getResidentMonthlyDue(residentId);
        const paidThisPeriod = total;
        StorageService.update(STORAGE_KEYS.residents, residentId, { paymentStatus: paidThisPeriod >= due ? 'مسدد' : (paidThisPeriod > 0 ? 'مدفوع جزئياً' : 'مستحق') });
        this.addActivity({ user, action: 'سجّل دفعة موزّعة من طالبة', entity: resident.name, amount: total });
        return record;
    },
    // إجمالي المستحق الشهري لطالبة = السكن + كل الخدمات النشطة المرتبطة بها
    getResidentMonthlyDue(residentId) {
        const resident = this.getResident(residentId);
        if (!resident) return 0;
        const servicesTotal = this.getResidentServices(residentId)
            .filter(rs => rs.status === 'نشطة')
            .reduce((s, rs) => s + (Number(rs.price) || 0), 0);
        return (Number(resident.monthlyRent) || 0) + servicesTotal;
    },
    getResidentTotalPaid(residentId) {
        const resident = this.getResident(residentId);
        if (!resident) return 0;
        return (resident.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    },

    /* ---------------------- تغيير التسكين (نقل طالبة) ---------------------- */
    getTransfers() {
        return (StorageService.get(STORAGE_KEYS.transfers) || []).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    getTransfersByResident(residentId) {
        return this.getTransfers().filter(t => t.residentId === residentId);
    },
    transferResident(residentId, newBedId, reason, notes) {
        const resident = this.getResident(residentId);
        const newBed = this.getBed(newBedId);
        if (!resident || !newBed) return { error: 'بيانات غير مكتملة لإتمام النقل' };
        if (newBed.status !== 'متاح') return { error: 'السرير الجديد غير متاح حالياً' };

        const user = Utils.currentUserName();
        const oldLoc = this.getBedLocation(resident.bedId);
        const newLoc = this.getBedLocation(newBedId);

        const record = {
            id: Utils.uid('trf'), residentId, date: Utils.todayISO(),
            oldFloorId: oldLoc.floor?.id || '', oldApartmentId: oldLoc.apartment?.id || '',
            oldRoomId: oldLoc.room?.id || '', oldBedId: resident.bedId || '',
            newFloorId: newLoc.floor?.id || '', newApartmentId: newLoc.apartment?.id || '',
            newRoomId: newLoc.room?.id || '', newBedId,
            oldLocationLabel: resident.bedId ? this.bedLocationLabel(resident.bedId) : 'بدون تسكين سابق',
            newLocationLabel: this.bedLocationLabel(newBedId),
            reason: reason || 'أخرى', notes: notes || '',
            changedBy: user, timestamp: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.transfers, record);

        if (resident.bedId) this.updateBedStatus(resident.bedId, 'متاح', `انتقلت الطالبة ${resident.name} لموقع آخر`);
        this.updateBedStatus(newBedId, 'مشغول', `انتقلت إليه الطالبة ${resident.name}`);

        this.updateResidentProfile(residentId, {
            roomId: newLoc.room?.id, roomNumber: newLoc.room?.number,
            bedId: newBedId, bedNumber: newBed.number
        }, `تم نقل التسكين: من ${record.oldLocationLabel} إلى ${record.newLocationLabel} — السبب: ${record.reason}`);

        this.addActivity({ user, action: `غيّر تسكين الطالبة ${resident.name}`, entity: `من ${record.oldLocationLabel} إلى ${record.newLocationLabel}` });
        return { success: true, transfer: record };
    },

    /* ---------------------- الضيفات (استضافة مؤقتة) ---------------------- */
    getGuests() {
        return (StorageService.get(STORAGE_KEYS.guests) || []).sort((a,b) => new Date(b.checkIn) - new Date(a.checkIn));
    },
    getGuest(id) {
        return this.getGuests().find(g => g.id === id);
    },
    calcGuestTotal(checkIn, checkOut, dailyRate) {
        const inD = new Date(checkIn), outD = new Date(checkOut);
        const nights = Math.max(1, Math.round((outD - inD) / (1000*60*60*24)));
        return { nights, total: nights * (Number(dailyRate) || 0) };
    },
    addGuest(data) {
        const host = this.getResident(data.hostResidentId);
        if (!host) return { error: 'لازم تحدد الطالبة المستضيفة' };
        const { nights, total } = this.calcGuestTotal(data.checkIn, data.checkOut, data.dailyRate);
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('guest'), name: data.name || '', hostResidentId: data.hostResidentId,
            hostName: host.name, phone: data.phone || '', reference: data.reference || '',
            checkIn: data.checkIn, checkOut: data.checkOut, nights,
            dailyRate: Number(data.dailyRate) || 0, total,
            paymentStatus: 'مستحق', notes: data.notes || '',
            createdBy: user, createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.guests, record);
        this.addActivity({ user, action: 'سجّل ضيفة جديدة', entity: `${record.name} — ضيفة عند ${host.name}`, amount: total });
        return record;
    },
    markGuestPaid(id, method) {
        const guest = this.getGuest(id);
        if (!guest) return null;
        const user = Utils.currentUserName();
        StorageService.update(STORAGE_KEYS.guests, id, { paymentStatus: 'مدفوع' });
        this.addTransaction({
            date: Utils.todayISO(), description: `إيراد استضافة — ${guest.name} (ضيفة عند ${guest.hostName})`,
            type: 'إيراد', category: 'إيراد استضافة', amount: guest.total, partner: '',
            paymentSource: method || 'نقدي', status: 'مسجلة', createdBy: user
        });
        this.addActivity({ user, action: 'سجّل دفعة استضافة', entity: guest.name, amount: guest.total });
        return this.getGuest(id);
    },
    getGuestRevenueTotal() {
        return this.getGuests().filter(g => g.paymentStatus === 'مدفوع').reduce((s,g) => s + g.total, 0);
    },
    getGuestsToday() {
        const today = Utils.todayISO();
        return this.getGuests().filter(g => g.checkIn <= today && g.checkOut >= today);
    },

    /* ---------------------- الخدمات (طعام، إنترنت، مكتبة، ترحيل...) ---------------------- */
    getServices() {
        return StorageService.get(STORAGE_KEYS.services) || [];
    },
    getService(id) {
        return this.getServices().find(s => s.id === id);
    },
    addService(data) {
        const record = {
            id: Utils.uid('svc'), name: data.name || '', type: data.type || 'أخرى',
            billingCycle: data.billingCycle || 'شهري', // شهري / يومي
            price: Number(data.price) || 0, status: 'نشطة', notes: data.notes || ''
        };
        StorageService.add(STORAGE_KEYS.services, record);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف خدمة جديدة', entity: record.name });
        return record;
    },
    removeService(id) {
        StorageService.set(STORAGE_KEYS.services, this.getServices().filter(s => s.id !== id));
    },
    getResidentServices(residentId) {
        return (StorageService.get(STORAGE_KEYS.residentServices) || []).filter(rs => rs.residentId === residentId);
    },
    getAllResidentServices() {
        return StorageService.get(STORAGE_KEYS.residentServices) || [];
    },
    assignResidentService(residentId, serviceId, opts = {}) {
        const service = this.getService(serviceId);
        const resident = this.getResident(residentId);
        if (!service || !resident) return null;
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('rsvc'), residentId, serviceId, serviceName: service.name, serviceType: service.type,
            price: opts.price !== undefined ? Number(opts.price) : service.price,
            startDate: opts.startDate || Utils.todayISO(), endDate: opts.endDate || '',
            status: 'نشطة', createdBy: user, createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.residentServices, record);
        this.updateResidentProfile(residentId, {}, `تم تفعيل خدمة "${service.name}" لها`);
        this.addActivity({ user, action: `فعّل خدمة "${service.name}" لطالبة`, entity: resident.name, amount: record.price });
        return record;
    },
    cancelResidentService(id) {
        const rs = (this.getAllResidentServices()).find(x => x.id === id);
        const updated = StorageService.update(STORAGE_KEYS.residentServices, id, { status: 'ملغاة', endDate: Utils.todayISO() });
        if (rs) this.addActivity({ user: Utils.currentUserName(), action: `ألغى خدمة "${rs.serviceName}"`, entity: rs.residentId });
        return updated;
    },

    /* ---------------------- الإجازات ---------------------- */
    getVacations() {
        return (StorageService.get(STORAGE_KEYS.vacations) || []).sort((a,b) => new Date(b.startDate) - new Date(a.startDate));
    },
    getVacation(id) {
        return this.getVacations().find(v => v.id === id);
    },
    getActiveVacations() {
        return this.getVacations().filter(v => v.status === 'في إجازة' || v.status === 'معتمدة' || v.status === 'تم تمديدها');
    },
    calcVacationFee(residentId, percentage) {
        const resident = this.getResident(residentId);
        if (!resident) return 0;
        return Math.round((Number(resident.monthlyRent) || 0) * (Number(percentage) || 0) / 100);
    },
    addVacation(data) {
        const resident = this.getResident(data.residentId);
        if (!resident) return null;
        const user = Utils.currentUserName();
        const keepBed = !!data.keepBed;
        const percentage = keepBed ? (Number(data.percentage) || 50) : 0;
        const fee = keepBed ? this.calcVacationFee(data.residentId, percentage) : 0;
        const record = {
            id: Utils.uid('vac'), residentId: data.residentId, residentName: resident.name,
            startDate: data.startDate || Utils.todayISO(), expectedReturn: data.expectedReturn,
            actualReturn: '', keepBed, percentage, fee,
            paymentStatus: keepBed ? 'مستحق' : 'معفى',
            status: 'معتمدة', notes: data.notes || '',
            createdBy: user, createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.vacations, record);

        if (resident.bedId) {
            if (keepBed) {
                this.updateBedStatus(resident.bedId, 'محجوز للإجازة', `إجازة الطالبة ${resident.name} مع الاحتفاظ بالسرير`);
            } else {
                this.updateBedStatus(resident.bedId, 'متاح', `إجازة الطالبة ${resident.name} بدون الاحتفاظ بالسرير`);
            }
        }
        this.updateResidentProfile(data.residentId, { status: 'في إجازة' }, `بدأت إجازة (${keepBed ? 'مع الاحتفاظ بالسرير' : 'بدون الاحتفاظ بالسرير'})`);
        this.addActivity({ user, action: 'سجّل إجازة لطالبة', entity: resident.name, amount: fee });
        return record;
    },
    extendVacation(id, newExpectedReturn) {
        const v = this.getVacation(id);
        if (!v) return null;
        const updated = StorageService.update(STORAGE_KEYS.vacations, id, { expectedReturn: newExpectedReturn, status: 'تم تمديدها' });
        this.addActivity({ user: Utils.currentUserName(), action: 'مدّد إجازة طالبة', entity: v.residentName });
        return updated;
    },
    returnFromVacation(id) {
        const v = this.getVacation(id);
        if (!v) return null;
        const user = Utils.currentUserName();
        const resident = this.getResident(v.residentId);
        const updated = StorageService.update(STORAGE_KEYS.vacations, id, { status: 'تمت العودة', actualReturn: Utils.todayISO() });
        if (resident) {
            if (v.keepBed && resident.bedId) {
                this.updateBedStatus(resident.bedId, 'مشغول', `عادت الطالبة ${resident.name} من إجازتها`);
            }
            this.updateResidentProfile(v.residentId, { status: 'مقيمة' }, 'عادت من الإجازة');
        }
        this.addActivity({ user, action: 'سجّل عودة طالبة من الإجازة', entity: v.residentName });
        return updated;
    },
    markVacationPaid(id) {
        const v = this.getVacation(id);
        if (!v) return null;
        const user = Utils.currentUserName();
        StorageService.update(STORAGE_KEYS.vacations, id, { paymentStatus: 'مسدد' });
        this.addTransaction({
            date: Utils.todayISO(), description: `رسوم إجازة (احتفاظ بالسرير) — ${v.residentName}`,
            type: 'إيراد', category: 'إيراد سكن وإعاشة', amount: v.fee, partner: '',
            paymentSource: 'نقدي', status: 'مسجلة', createdBy: user
        });
        this.addActivity({ user, action: 'سجّل دفعة رسوم إجازة', entity: v.residentName, amount: v.fee });
        return this.getVacation(id);
    },

    /* ---------------------- الأصول ---------------------- */
    getAssets() {
        return StorageService.get(STORAGE_KEYS.assets) || [];
    },
    addAsset(a) {
        const record = { id: Utils.uid('ast'), createdAt: new Date().toISOString(), ...a };
        StorageService.add(STORAGE_KEYS.assets, record);
        this.addActivity({ user: Utils.currentUserName(), action: 'أضاف أصلاً', entity: record.name, amount: record.purchaseCost });
        return record;
    },

    /* ---------------------- سجل النشاط ---------------------- */
    getActivities() {
        return (StorageService.get(STORAGE_KEYS.activities) || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    addActivity(a) {
        const record = {
            id: Utils.uid('act'),
            user: a.user || Utils.currentUserName(),
            action: a.action,
            entity: a.entity || '',
            amount: a.amount || 0,
            timestamp: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.activities, record);
        return record;
    },

    /* ---------------------- الإغلاقات الشهرية ---------------------- */
    getClosings() {
        return StorageService.get(STORAGE_KEYS.closings) || [];
    },
    isMonthClosed(monthKey) {
        return this.getClosings().some(c => c.month === monthKey);
    },
    // فحص سريع: هل تاريخ مُعطى يقع داخل شهر مُغلق؟ (تُستخدم لمنع أي إضافة/تعديل في شهر مقفول)
    isDateInClosedMonth(dateStr) {
        return this.isMonthClosed(Utils.monthKey(dateStr));
    },
    closeMonth(monthKey, summary, user) {
        const record = { id: Utils.uid('close'), month: monthKey, ...summary, closedBy: user || Utils.currentUserName(), closedAt: new Date().toISOString() };
        StorageService.add(STORAGE_KEYS.closings, record);
        this.addActivity({ user: record.closedBy, action: 'أغلق الشهر', entity: Utils.monthLabel(monthKey), amount: summary.distributable });
        return record;
    },

    /* ---------------------- حسابات مالية ---------------------- */

    // إيرادات الفترة (من المعاملات من نوع إيراد + دفعات الطالبات المسجلة كمعاملات إيراد)
    getRevenueForMonth(monthKey) {
        const txs = this.getTransactions().filter(t => !t.reversed && t.type === 'إيراد' && Utils.monthKey(t.date) === monthKey);
        return txs.reduce((s, t) => s + t.amount, 0);
    },
    // مصروفات تشغيلية تجارية للفترة (لا تشمل الشخصي، وتستخدم المبلغ المحمل فقط)
    getOperatingExpensesForMonth(monthKey) {
        const exps = this.getExpenses().filter(e => !e.reversed && e.nature === 'تجاري' && Utils.monthKey(e.date) === monthKey);
        return exps.reduce((s, e) => s + (Number(e.chargedAmount) || 0), 0);
    },
    getExpensesTotalAllTime() {
        return this.getExpenses().filter(e => !e.reversed && e.nature === 'تجاري').reduce((s,e) => s + (Number(e.chargedAmount)||0), 0);
    },
    getRevenueTotalAllTime() {
        return this.getTransactions().filter(t => !t.reversed && t.type === 'إيراد').reduce((s,t) => s + t.amount, 0);
    },

    // آخر N شهر (بما فيها الشهر الحالي) لعرض اتجاه مالي في الرسوم البيانية
    getRecentMonthKeys(n = 6) {
        const keys = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
        }
        return keys;
    },
    getMonthlyFinancials(n = 6) {
        return this.getRecentMonthKeys(n).map(mk => {
            const revenue = this.getRevenueForMonth(mk);
            const expenses = this.getOperatingExpensesForMonth(mk);
            return { monthKey: mk, label: Utils.monthLabel(mk), revenue, expenses, profit: revenue - expenses };
        });
    },

    // إجمالي مساهمات رأس المال لكل شريك
    getContributionsByPartner(name) {
        return this.getTransactions()
            .filter(t => !t.reversed && t.type === 'مساهمة رأس مال' && t.partner === name)
            .reduce((s, t) => s + t.amount, 0);
    },
    // إجمالي سلف الشريك
    getAdvancesByPartner(name) {
        return this.getTransactions()
            .filter(t => !t.reversed && t.type === 'سلفة شريك' && t.partner === name)
            .reduce((s, t) => s + t.amount, 0);
    },
    // إجمالي المسدد من سلف الشريك
    getRepaymentsByPartner(name) {
        return this.getTransactions()
            .filter(t => !t.reversed && t.type === 'سداد سلفة' && t.partner === name)
            .reduce((s, t) => s + t.amount, 0);
    },
    // الأرباح المستلمة (موزعة فعلياً)
    getDistributionsPaidByPartner(name) {
        return this.getTransactions()
            .filter(t => !t.reversed && t.type === 'توزيع أرباح' && t.partner === name)
            .reduce((s, t) => s + t.amount, 0);
    },
    getTotalAdvancesAllPartners() {
        return this.getPartners().reduce((s,p) => s + this.getAdvancesByPartner(p.name) - this.getRepaymentsByPartner(p.name), 0);
    },
    // حالة مساهمة رأس المال لشريك: المطلوب مقابل المسدد فعلاً.
    // لو سدّد أكتر من المطلوب، الزيادة تُعتبر تلقائياً سلفة/ديناً على الداخلية لصالح هذا الشريك
    // (بالإضافة لأي سلف فعلية مسجلة له من نوع "سلفة شريك").
    getContributionStatus(partner) {
        const required = Number(partner.requiredContribution) || 0;
        const paid = this.getContributionsByPartner(partner.name);
        const remaining = Math.max(required - paid, 0);
        const surplus = Math.max(paid - required, 0); // مبلغ زائد عن المطلوب = دين على الداخلية لهذا الشريك
        return { required, paid, remaining, surplus, complete: required > 0 && paid >= required };
    },

    // الرصيد النقدي = كل الإيرادات + المساهمات + السلف - كل المصروفات (المحمّلة فعلياً) - التوزيعات المدفوعة - سداد السلف يخرج كخصم على السلفة لكنه ليس خروج نقدي فعلي إذا اعتبرناه تحويل. هنا نحسب صافي حركة نقدية.
    getCashBalance() {
        const txs = this.getTransactions().filter(t => !t.reversed);
        let cash = 0;
        txs.forEach(t => {
            switch (t.type) {
                case 'إيراد':
                case 'مساهمة رأس مال':
                case 'سلفة شريك':
                    cash += t.amount; break;
                case 'توزيع أرباح':
                case 'شراء أصل':
                case 'سداد سلفة':
                    // سداد سلفة = المشروع يرجع فلوساً كان قد اقترضها من الشريك = خروج نقدي من الخزينة
                    cash -= t.amount; break;
                case 'تسوية':
                    cash += t.amount; break; // قد تكون سالبة (إلغاء)
                default: break;
            }
        });
        const expenses = this.getExpenses().filter(e => !e.reversed);
        expenses.forEach(e => { cash -= (Number(e.chargedAmount) || 0); });
        return cash;
    },

    // حساب الربح لشهر معين
    calculateProfit(monthKey, opts = {}) {
        const revenue = this.getRevenueForMonth(monthKey);
        const operatingExpenses = this.getOperatingExpensesForMonth(monthKey);
        const obligations = Number(opts.obligations) || 0; // التزامات مستحقة (مثل الإيجار المستحق غير المدفوع بعد)
        const netOperatingProfit = revenue - operatingExpenses - obligations;

        const reinvestment = Number(opts.reinvestment) || 0;
        const reserve = Number(opts.reserve) || 0;
        const distributable = netOperatingProfit - reinvestment - reserve;

        const partners = this.getPartners();
        const shares = {};
        partners.forEach(p => {
            shares[p.name] = Math.round(distributable * (p.ownership / 100));
        });

        return { monthKey, revenue, operatingExpenses, obligations, netOperatingProfit, reinvestment, reserve, distributable, shares };
    },

    // حاسبة الإيجار
    calculateRent(baseRent, increasePercent, baseYear, targetYear) {
        let rent = baseRent;
        for (let y = baseYear + 1; y <= targetYear; y++) {
            rent = rent * (1 + increasePercent / 100);
        }
        return Math.round(rent);
    },

    // محاكاة الأرباح (What-If)
    simulateProfit({ occupiedBeds, bedPrice, monthlyExpenses, rent, reserve, reinvestment, servicesRevenue }) {
        const bedsRevenue = (Number(occupiedBeds) || 0) * (Number(bedPrice) || 0);
        const svcRevenue = Number(servicesRevenue) || 0;
        const revenue = bedsRevenue + svcRevenue;
        const totalExpenses = (Number(monthlyExpenses) || 0) + (Number(rent) || 0);
        const netProfit = revenue - totalExpenses;
        const distributable = netProfit - (Number(reserve) || 0) - (Number(reinvestment) || 0);
        const partners = this.getPartners();
        const shares = {};
        partners.forEach(p => { shares[p.name] = Math.round(distributable * (p.ownership / 100)); });
        // نقطة التعادل: عدد الأسرة التي تجعل إيراد الأسرة وحده (بدون الخدمات) = المصروفات
        const breakEvenBeds = bedPrice > 0 ? Math.ceil(Math.max(totalExpenses - svcRevenue, 0) / bedPrice) : 0;
        return { bedsRevenue, servicesRevenue: svcRevenue, revenue, totalExpenses, netProfit, distributable, shares, breakEvenBeds };
    },

    /* ---------------------- إعادة الاستثمار ---------------------- */
    getReinvestmentSummary() {
        const settings = this.getSettings();
        const setupBudget = Number(settings.setupBudget) || 0;
        const revenueCollected = this.getRevenueTotalAllTime();
        const operatingExpenses = this.getExpensesTotalAllTime();
        const assetsValue = this.getAssets().reduce((s,a) => s + (Number(a.purchaseCost)||0), 0);
        const reinvested = Math.min(Math.max(revenueCollected - operatingExpenses, 0), setupBudget);
        const remaining = Math.max(setupBudget - assetsValue, 0);
        return { setupBudget, revenueCollected, operatingExpenses, reinvested, assetsValue, remaining };
    },

    /* ---------------------- عناصر تحتاج انتباهاً (تُستخدم في اللوحة وجرس الإشعارات) ---------------------- */
    getAttentionItems() {
        const currentMonth = Utils.monthKey(Utils.todayISO());
        const settings = this.getSettings();
        const items = [];

        const needsAllocation = this.getExpenses().filter(e => !e.reversed && e.needsAllocation && !e.chargedAmount);
        if (needsAllocation.length) {
            items.push({ icon: 'bi-exclamation-triangle', color: 'bg-soft-warning', text: `${needsAllocation.length} مصروف يحتاج تحديد توزيع بين الداخلية والشخصي`, link: '#/expenses', linkText: 'مراجعة' });
        }

        const limit = Number(settings.approvalLimit) || 0;
        const pendingApproval = this.getExpenses().filter(e => !e.reversed && !e.approved && limit && e.amount >= limit);
        if (pendingApproval.length) {
            items.push({ icon: 'bi-patch-check', color: 'bg-soft-info', text: `${pendingApproval.length} مصروف كبير ينتظر اعتمادك (أكبر من ${Utils.formatMoney(limit)})`, link: '#/approvals', linkText: 'عرض' });
        }

        const overdueResidents = this.getResidents().filter(r => r.paymentStatus !== 'مسدد');
        if (overdueResidents.length) {
            items.push({ icon: 'bi-cash-stack', color: 'bg-soft-danger', text: `${overdueResidents.length} طالبة عليها مبالغ مستحقة`, link: '#/collection', linkText: 'التحصيل' });
        }

        if (!this.isMonthClosed(currentMonth)) {
            items.push({ icon: 'bi-calendar-x', color: 'bg-soft-navy', text: `شهر ${Utils.monthLabel(currentMonth)} لم يُغلق بعد`, link: '#/month-close', linkText: 'إغلاق الشهر' });
        }

        if (!this.getPartners().length) {
            items.push({ icon: 'bi-people', color: 'bg-soft-warning', text: 'لا يوجد شركاء مسجلون بعد', link: '#/settings', linkText: 'الإعدادات' });
        }
        if (!this.getRooms().length) {
            items.push({ icon: 'bi-door-closed', color: 'bg-soft-warning', text: 'لا توجد غرف مسجلة بعد', link: '#/settings', linkText: 'الإعدادات' });
        }

        const burden = this.getRecurringMonthlyBurden();
        const revenueMonth = this.getRevenueForMonth(currentMonth);
        if (burden && revenueMonth && burden >= revenueMonth * 0.8) {
            items.push({ icon: 'bi-graph-down', color: 'bg-soft-danger', text: `العبء الدوري الشهري (${Utils.formatMoney(burden)}) يقترب من إيرادات الشهر`, link: '#/recurring-expenses', linkText: 'مراجعة' });
        }

        return items;
    },

    /* ---------------------- المصروفات الدورية (يومي/أسبوعي/شهري/سنوي/مرة واحدة) ---------------------- */
    getRecurringExpenses() {
        return StorageService.get(STORAGE_KEYS.recurringExpenses) || [];
    },
    getRecurringExpense(id) {
        return this.getRecurringExpenses().find(t => t.id === id);
    },
    addRecurringExpense(data) {
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('rec'),
            description: data.description || '',
            category: data.category || 'أخرى',
            amount: Number(data.amount) || 0,
            nature: data.nature || 'تجاري',
            frequency: data.frequency || 'شهري', // يومي / أسبوعي / شهري / سنوي / مرة واحدة
            startDate: data.startDate || Utils.todayISO(),
            endDate: data.endDate || '',
            paidBy: data.paidBy || '',
            paymentSource: data.paymentSource || 'نقدي',
            status: 'نشط',
            lastGeneratedDate: null,
            createdBy: user,
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.recurringExpenses, record);
        this.addActivity({ user, action: 'أضاف مصروفاً دورياً جديداً', entity: `${record.description} (${record.frequency})`, amount: record.amount });
        return record;
    },
    updateRecurringExpense(id, patch) {
        return StorageService.update(STORAGE_KEYS.recurringExpenses, id, patch);
    },
    toggleRecurringExpenseStatus(id) {
        const t = this.getRecurringExpense(id);
        if (!t || t.status === 'مكتمل') return null;
        const newStatus = t.status === 'نشط' ? 'متوقف' : 'نشط';
        const updated = StorageService.update(STORAGE_KEYS.recurringExpenses, id, { status: newStatus });
        this.addActivity({ user: Utils.currentUserName(), action: `${newStatus === 'نشط' ? 'فعّل' : 'أوقف'} مصروفاً دورياً`, entity: t.description });
        return updated;
    },
    removeRecurringExpense(id) {
        const t = this.getRecurringExpense(id);
        const list = this.getRecurringExpenses().filter(x => x.id !== id);
        StorageService.set(STORAGE_KEYS.recurringExpenses, list);
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف مصروفاً دورياً', entity: t ? t.description : '' });
    },
    // العبء الشهري المُقدَّر لكل القوالب النشطة (بعد توحيد كل الترددات لمعادلها الشهري) — يقيس أثرها على العمل
    getRecurringMonthlyBurden() {
        const templates = this.getRecurringExpenses().filter(t => t.status === 'نشط' && t.nature === 'تجاري');
        let monthly = 0;
        templates.forEach(t => {
            switch (t.frequency) {
                case 'يومي': monthly += t.amount * 30; break;
                case 'أسبوعي': monthly += t.amount * 4.345; break;
                case 'شهري': monthly += t.amount; break;
                case 'سنوي': monthly += t.amount / 12; break;
                default: break; // مرة واحدة لا تُحتسب كعبء متكرر
            }
        });
        return Math.round(monthly);
    },
    // يضيف فترة واحدة (تردد) على تاريخ مُعطى
    _addRecurringPeriod(dateStr, freq) {
        const d = new Date(dateStr);
        switch (freq) {
            case 'يومي': d.setDate(d.getDate() + 1); break;
            case 'أسبوعي': d.setDate(d.getDate() + 7); break;
            case 'شهري': d.setMonth(d.getMonth() + 1); break;
            case 'سنوي': d.setFullYear(d.getFullYear() + 1); break;
            default: break;
        }
        return d.toISOString().slice(0, 10);
    },
    _materializeRecurringExpense(template, date) {
        this.addExpense({
            date,
            category: template.category,
            amount: template.amount,
            chargedAmount: template.nature === 'شخصي' ? 0 : template.amount,
            description: `${template.description} (دوري — ${template.frequency})`,
            paidBy: template.paidBy,
            paymentSource: template.paymentSource,
            nature: template.nature,
            needsAllocation: false,
            status: 'مسجل',
            createdBy: 'النظام (مصروف دوري)'
        });
    },
    // يفحص كل القوالب النشطة ويولّد المصروفات الفعلية المستحقة حتى اليوم (يُستدعى عند فتح النظام)
    generateDueExpenses() {
        const today = Utils.todayISO();
        const templates = this.getRecurringExpenses().filter(t => t.status === 'نشط');
        let generatedAny = false;

        templates.forEach(t => {
            if (t.frequency === 'مرة واحدة') {
                if (!t.lastGeneratedDate && t.startDate <= today) {
                    this._materializeRecurringExpense(t, t.startDate);
                    this.updateRecurringExpense(t.id, { lastGeneratedDate: t.startDate, status: 'مكتمل' });
                    generatedAny = true;
                }
                return;
            }
            let cursor = t.lastGeneratedDate ? this._addRecurringPeriod(t.lastGeneratedDate, t.frequency) : t.startDate;
            let safety = 0;
            while (cursor <= today && (!t.endDate || cursor <= t.endDate) && safety < 400) {
                this._materializeRecurringExpense(t, cursor);
                this.updateRecurringExpense(t.id, { lastGeneratedDate: cursor });
                cursor = this._addRecurringPeriod(cursor, t.frequency);
                safety++;
                generatedAny = true;
            }
        });
        return generatedAny;
    },

    /* ---------------------- مصادر الدخل الدورية (اشتراكات: مكتبة، إنترنت، إلخ) ---------------------- */
    getRecurringIncomes() {
        return StorageService.get(STORAGE_KEYS.recurringIncomes) || [];
    },
    getRecurringIncome(id) {
        return this.getRecurringIncomes().find(t => t.id === id);
    },
    addRecurringIncome(data) {
        const user = Utils.currentUserName();
        const record = {
            id: Utils.uid('reci'),
            description: data.description || '',
            category: data.category || 'إيراد آخر',
            amount: Number(data.amount) || 0,
            frequency: data.frequency || 'شهري', // يومي / أسبوعي / شهري / سنوي / مرة واحدة
            startDate: data.startDate || Utils.todayISO(),
            endDate: data.endDate || '',
            paymentSource: data.paymentSource || 'نقدي',
            status: 'نشط',
            lastGeneratedDate: null,
            createdBy: user,
            createdAt: new Date().toISOString()
        };
        StorageService.add(STORAGE_KEYS.recurringIncomes, record);
        this.addActivity({ user, action: 'أضاف مصدر دخل دورياً جديداً', entity: `${record.description} (${record.frequency})`, amount: record.amount });
        return record;
    },
    updateRecurringIncome(id, patch) {
        return StorageService.update(STORAGE_KEYS.recurringIncomes, id, patch);
    },
    toggleRecurringIncomeStatus(id) {
        const t = this.getRecurringIncome(id);
        if (!t || t.status === 'مكتمل') return null;
        const newStatus = t.status === 'نشط' ? 'متوقف' : 'نشط';
        const updated = StorageService.update(STORAGE_KEYS.recurringIncomes, id, { status: newStatus });
        this.addActivity({ user: Utils.currentUserName(), action: `${newStatus === 'نشط' ? 'فعّل' : 'أوقف'} مصدر دخل دورياً`, entity: t.description });
        return updated;
    },
    removeRecurringIncome(id) {
        const t = this.getRecurringIncome(id);
        const list = this.getRecurringIncomes().filter(x => x.id !== id);
        StorageService.set(STORAGE_KEYS.recurringIncomes, list);
        this.addActivity({ user: Utils.currentUserName(), action: 'حذف مصدر دخل دورياً', entity: t ? t.description : '' });
    },
    // الدخل الشهري المُقدَّر من كل مصادر الدخل الدورية النشطة (بعد توحيد الترددات)
    getRecurringMonthlyIncome() {
        const templates = this.getRecurringIncomes().filter(t => t.status === 'نشط');
        let monthly = 0;
        templates.forEach(t => {
            switch (t.frequency) {
                case 'يومي': monthly += t.amount * 30; break;
                case 'أسبوعي': monthly += t.amount * 4.345; break;
                case 'شهري': monthly += t.amount; break;
                case 'سنوي': monthly += t.amount / 12; break;
                default: break;
            }
        });
        return Math.round(monthly);
    },
    _materializeRecurringIncome(template, date) {
        this.addTransaction({
            date,
            description: `${template.description} (دوري — ${template.frequency})`,
            type: 'إيراد',
            category: template.category,
            amount: template.amount,
            partner: '',
            paymentSource: template.paymentSource,
            status: 'مسجلة',
            createdBy: 'النظام (دخل دوري)'
        });
    },
    generateDueIncomes() {
        const today = Utils.todayISO();
        const templates = this.getRecurringIncomes().filter(t => t.status === 'نشط');
        let generatedAny = false;

        templates.forEach(t => {
            if (t.frequency === 'مرة واحدة') {
                if (!t.lastGeneratedDate && t.startDate <= today) {
                    this._materializeRecurringIncome(t, t.startDate);
                    this.updateRecurringIncome(t.id, { lastGeneratedDate: t.startDate, status: 'مكتمل' });
                    generatedAny = true;
                }
                return;
            }
            let cursor = t.lastGeneratedDate ? this._addRecurringPeriod(t.lastGeneratedDate, t.frequency) : t.startDate;
            let safety = 0;
            while (cursor <= today && (!t.endDate || cursor <= t.endDate) && safety < 400) {
                this._materializeRecurringIncome(t, cursor);
                this.updateRecurringIncome(t.id, { lastGeneratedDate: cursor });
                cursor = this._addRecurringPeriod(cursor, t.frequency);
                safety++;
                generatedAny = true;
            }
        });
        return generatedAny;
    },

    /* ---------------------- إعادة التعيين ---------------------- */
    // إعادة تهيئة أولية (تُستخدم فقط أول مرة يُفتح فيها النظام إن لم تكن هناك بيانات)
    resetAllData() {
        Object.values(STORAGE_KEYS).forEach(k => StorageService.clear(k));
        seedDemoData();
    },
    // تصفير كامل للنظام: لا شركاء، لا طالبات، لا طوابق، لا شقق، لا غرف، لا أسرة، لا معاملات — كل شيء صفر
    factoryReset() {
        Object.values(STORAGE_KEYS).forEach(k => StorageService.clear(k));
        StorageService.set(STORAGE_KEYS.settings, {
            currentUser: 'المستخدم',
            ownership: {},
            roomsCount: 0,
            bedsCount: 0,
            bedPrice: 0,
            rent: 0,
            rentIncrease: 0,
            rentBaseYear: new Date().getFullYear(),
            currentYear: new Date().getFullYear(),
            approvalLimit: 1000000,
            setupBudget: 0,
            operatingReserveDefault: 0
        });
        StorageService.set(STORAGE_KEYS.partners, []);
        StorageService.set(STORAGE_KEYS.floors, []);
        StorageService.set(STORAGE_KEYS.apartments, []);
        StorageService.set(STORAGE_KEYS.bathrooms, []);
        StorageService.set(STORAGE_KEYS.rooms, []);
        StorageService.set(STORAGE_KEYS.beds, []);
        StorageService.set(STORAGE_KEYS.roomTypes, []);
        StorageService.set(STORAGE_KEYS.residents, []);
        StorageService.set(STORAGE_KEYS.guests, []);
        StorageService.set(STORAGE_KEYS.services, []);
        StorageService.set(STORAGE_KEYS.residentServices, []);
        StorageService.set(STORAGE_KEYS.vacations, []);
        StorageService.set(STORAGE_KEYS.transfers, []);
        StorageService.set(STORAGE_KEYS.transactions, []);
        StorageService.set(STORAGE_KEYS.expenses, []);
        StorageService.set(STORAGE_KEYS.recurringExpenses, []);
        StorageService.set(STORAGE_KEYS.recurringIncomes, []);
        StorageService.set(STORAGE_KEYS.assets, []);
        StorageService.set(STORAGE_KEYS.activities, []);
        StorageService.set(STORAGE_KEYS.closings, []);
        StorageService.set(STORAGE_KEYS.meta, { seeded: true, factory: true, seedDate: new Date().toISOString(), version: 4 });
    },

    /* ---------------------- تعبئة عشوائية للداخلية (بيانات تجريبية) ---------------------- */
    // ثابت: العلامة المستخدمة لتمييز المصروفات التي ولّدها هذا المولّد تلقائياً، عشان
    // resetDormitoryOnly() يقدر يشيلها بدقة دون المساس بأي مصروف حقيقي أدخله المستخدم يدوياً.
    SEEDED_EXPENSE_MARKER: 'النظام (بيانات تجريبية للداخلية)',
    // علامة ثانية لأي معاملة/أصل تولّده "نشاط الشهر الكامل" (مساهمات، سلف، توزيعات، أصول) —
    // منفصلة عن علامة المصروفات عشان resetDormitoryOnly() يقدر يشيل كل نوع بدقة.
    SEEDED_DEMO_MARKER: 'النظام (نشاط شهر تجريبي كامل)',

    // يولّد هيكل داخلية عشوائي كامل (طوابق ← شقق ← غرف ← أسرة) حسب "options" اللي يحددها
    // المستخدم (نطاق عدد الطوابق/الشقق/الغرف، نسبة الإشغال، نسبة الدفع، تفعيل/تعطيل الضيفات
    // والخدمات والمصروفات، الانتشار الزمني عبر عدة أيام، وتفعيل نشاط شهر كامل عبر كل صفحات
    // النظام: مساهمات رأس مال، سلف شركاء، توزيع أرباح، شراء أصل...)، بدل قيم ثابتة في الكود.
    // أي قيمة غير مُمرَّرة تأخذ نفس الافتراضي القديم (إشغال 100%، تاريخ اليوم فقط، بدون نشاط
    // شهر كامل) عشان الاستدعاء بدون options يبقى بنفس السلوك السابق بالضبط.
    // مخصص للتجربة فقط، ولا يمس الشركاء أنفسهم أو الإعدادات المالية العامة.
    seedRandomDormitoryData(options = {}) {
        const opts = {
            floorsMin: Math.max(1, Number(options.floorsMin) || 2),
            floorsMax: Math.max(1, Number(options.floorsMax) || 3),
            aptsPerFloorMin: Math.max(1, Number(options.aptsPerFloorMin) || 2),
            aptsPerFloorMax: Math.max(1, Number(options.aptsPerFloorMax) || 3),
            roomsPerAptMin: Math.max(1, Number(options.roomsPerAptMin) || 3),
            roomsPerAptMax: Math.max(1, Number(options.roomsPerAptMax) || 5),
            occupancyPercent: Math.min(100, Math.max(0, options.occupancyPercent !== undefined ? Number(options.occupancyPercent) : 100)),
            paymentPercent: Math.min(100, Math.max(0, options.paymentPercent !== undefined ? Number(options.paymentPercent) : 75)),
            fullPaymentPercent: Math.min(100, Math.max(0, options.fullPaymentPercent !== undefined ? Number(options.fullPaymentPercent) : 70)),
            generateGuests: options.generateGuests !== undefined ? !!options.generateGuests : true,
            guestsMin: Math.max(0, Number(options.guestsMin) || 1),
            guestsMax: Math.max(0, Number(options.guestsMax) || 3),
            generateServices: options.generateServices !== undefined ? !!options.generateServices : true,
            serviceSubscribePercent: Math.min(100, Math.max(0, options.serviceSubscribePercent !== undefined ? Number(options.serviceSubscribePercent) : 35)),
            generateExpenses: options.generateExpenses !== undefined ? !!options.generateExpenses : true,
            expensePercentMultiplier: Math.max(0, options.expensePercentMultiplier !== undefined ? Number(options.expensePercentMultiplier) : 1),
            // انتشار زمني: كل التواريخ (تسكين، دفعات، مصروفات) توزَّع عشوائياً خلال آخر N يوم
            // بدل ما تكون كلها "اليوم" فقط — عشان الرسوم البيانية وسجل النشاط يعكسوا شهراً
            // كاملاً من الحركة بدل لقطة يوم واحد. الافتراضي 0 = نفس السلوك القديم (اليوم فقط).
            spreadOverDays: Math.max(0, Number(options.spreadOverDays) || 0),
            // نشاط شهر كامل عبر كل صفحات النظام: مساهمات رأس مال، سلف شركاء وسداد جزئي،
            // شراء أصل، وتوزيع أرباح — كل ده مُعلَّم بعلامة منفصلة (SEEDED_DEMO_MARKER) عشان
            // إعادة التهيئة تقدر تشيله بدقة دون المساس بأي معاملة حقيقية.
            fullSystemActivity: options.fullSystemActivity !== undefined ? !!options.fullSystemActivity : false
        };
        // نضمن إن الحد الأقصى ما يقلّش عن الحد الأدنى (لو المستخدم كتب أرقام مقلوبة بالغلط)
        if (opts.floorsMax < opts.floorsMin) opts.floorsMax = opts.floorsMin;
        if (opts.aptsPerFloorMax < opts.aptsPerFloorMin) opts.aptsPerFloorMax = opts.aptsPerFloorMin;
        if (opts.roomsPerAptMax < opts.roomsPerAptMin) opts.roomsPerAptMax = opts.roomsPerAptMin;
        if (opts.guestsMax < opts.guestsMin) opts.guestsMax = opts.guestsMin;

        const user = Utils.currentUserName();
        const settings = this.getSettings();
        const basePrice = Number(settings.bedPrice) || 400000;

        const FIRST_NAMES = ['فاطمة','مريم','آمنة','سارة','هبة','ندى','رنا','ياسمين','ريم','أميرة','سلمى','دانة','لينا','جميلة','خلود','منى','إيمان','عبير','هالة','نور','آية','رغد'];
        const LAST_NAMES = ['أحمد','محمد','عبدالله','إبراهيم','الطيب','حسن','عثمان','بابكر','آدم','الأمين','الفاتح','موسى','خليل'];
        const UNIVERSITIES = ['جامعة الخرطوم','جامعة السودان للعلوم والتكنولوجيا','جامعة أفريقيا العالمية','جامعة النيلين','جامعة أمدرمان الإسلامية','جامعة بحري'];
        const REGIONS = ['أمدرمان','بحري','ود مدني','الأبيض','كسلا','بورتسودان','الفاشر','الدمازين','عطبرة','الجزيرة'];
        const ROOM_TYPES = ['مفردة','مزدوجة','ثلاثية','رباعية'];
        const ROOM_CAPACITY = { 'مفردة': 1, 'مزدوجة': 2, 'ثلاثية': 3, 'رباعية': 4 };
        const FLOOR_NAMES = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن'];

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randPhone = () => '09' + String(rand(10000000, 99999999));
        // تاريخ عشوائي بين (اليوم - daysBack) واليوم نفسه، أو اليوم فقط لو daysBack = 0
        const randomPastDate = (daysBack) => {
            if (!daysBack) return Utils.todayISO();
            const d = new Date();
            d.setDate(d.getDate() - rand(0, daysBack));
            return d.toISOString().slice(0, 10);
        };
        // تاريخ عشوائي بعد تاريخ مُعطى وحتى اليوم (لتواريخ الدفعات بعد تاريخ التسكين مثلاً)
        const randomDateAfter = (fromDateStr) => {
            const from = new Date(fromDateStr);
            const today = new Date();
            const maxDays = Math.max(0, Math.round((today - from) / (1000*60*60*24)));
            const d = new Date(from);
            d.setDate(d.getDate() + rand(0, maxDays));
            return d.toISOString().slice(0, 10);
        };

        const floorsCount = rand(opts.floorsMin, opts.floorsMax);
        let createdBeds = [];
        let apartmentsCount = 0, roomsCount = 0;

        for (let f = 1; f <= floorsCount; f++) {
            const floor = this.addFloor({ name: `الطابق ${FLOOR_NAMES[f-1] || f}`, order: f, description: 'تم إنشاؤه تلقائياً كبيانات تجريبية' });
            const aptsOnFloor = rand(opts.aptsPerFloorMin, opts.aptsPerFloorMax);
            for (let a = 1; a <= aptsOnFloor; a++) {
                const aptNumber = `${f}${String(a).padStart(2, '0')}`;
                const apartment = this.addApartment({ number: aptNumber, name: '', floorId: floor.id });
                if (apartment.error) continue;
                apartmentsCount++;
                this.addBathroom({ name: 'حمام مشترك', apartmentId: apartment.id, type: 'حمام مشترك' });
                const roomsOnApt = rand(opts.roomsPerAptMin, opts.roomsPerAptMax);
                for (let r = 1; r <= roomsOnApt; r++) {
                    const roomType = pick(ROOM_TYPES);
                    const price = Math.max(basePrice + rand(-50000, 100000), 50000);
                    const room = this.addRoom({
                        number: `${aptNumber}-${r}`, apartmentId: apartment.id,
                        roomType, capacity: ROOM_CAPACITY[roomType], price
                    });
                    roomsCount++;
                    createdBeds.push(...this.getBedsByRoom(room.id));
                }
            }
        }

        // نسكّن نسبة الإشغال المطلوبة فقط (100% افتراضياً، أو أي نسبة يحددها المستخدم)
        const shuffled = [...createdBeds].sort(() => Math.random() - 0.5);
        const bedsToFill = Math.round(shuffled.length * opts.occupancyPercent / 100);
        let residentsCreated = 0;
        let totalRevenueCollected = 0;

        for (let i = 0; i < bedsToFill; i++) {
            const bed = shuffled[i];
            const room = this.getRoom(bed.roomId);
            const checkInDate = randomPastDate(opts.spreadOverDays);
            const resident = this.addResident({
                name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
                phone: randPhone(),
                university: pick(UNIVERSITIES),
                homeRegion: pick(REGIONS),
                fatherName: `${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`,
                fatherPhone: randPhone(),
                fatherJob: pick(['تاجر','موظف حكومي','مزارع','معلم','متقاعد','عسكري']),
                motherName: pick(FIRST_NAMES),
                motherPhone: randPhone(),
                motherJob: pick(['ربة منزل','معلمة','موظفة','طبيبة']),
                roomId: room.id, roomNumber: room.number, bedId: bed.id, bedNumber: bed.number,
                checkIn: checkInDate, monthlyRent: room.price || basePrice,
                paymentStatus: 'مستحق', notes: 'بيانات تجريبية (تم توليدها تلقائياً)'
            });
            residentsCreated++;
            // نسبة الطالبات اللي بتدفع جزءاً أو كل المستحق قابلة للتحكم عبر options
            if (rand(1, 100) <= opts.paymentPercent) {
                const full = rand(1, 100) <= opts.fullPaymentPercent;
                const amount = full ? resident.monthlyRent : Math.max(Math.round(resident.monthlyRent * (rand(30, 80) / 100)), 1);
                const paymentDate = opts.spreadOverDays ? randomDateAfter(checkInDate) : Utils.todayISO();
                this.addResidentPayment(resident.id, { date: paymentDate, amount, method: pick(['نقدي','تحويل بنكي']) });
                totalRevenueCollected += amount;
            }
        }

        // خدمات تجريبية + اشتراكات عشوائية لبعض الطالبات (يمكن تعطيلها بالكامل)
        let servicesAssigned = 0;
        if (opts.generateServices) {
            const serviceDefs = [
                { name: 'اشتراك الإنترنت الشهري', type: 'الإنترنت', billingCycle: 'شهري', price: 15000 },
                { name: 'وجبات يومية', type: 'الطعام', billingCycle: 'شهري', price: 60000 },
                { name: 'اشتراك المكتبة', type: 'المكتبة', billingCycle: 'شهري', price: 8000 }
            ];
            const services = serviceDefs.map(s => this.addService(s));
            const activeResidents = this.getResidents().filter(r => !r.checkOut);
            activeResidents.forEach(r => {
                services.forEach(s => {
                    if (rand(1, 100) <= opts.serviceSubscribePercent) {
                        this.assignResidentService(r.id, s.id, { price: s.price });
                        servicesAssigned++;
                    }
                });
            });
        }

        // ضيفات تجريبية — نسجّل دفع البعض منها عشان تظهر كإيراد فعلي (إيراد استضافة) — قابلة للتعطيل
        let guestsCreated = 0;
        if (opts.generateGuests) {
            const activeResidents = this.getResidents().filter(r => !r.checkOut);
            const guestCount = Math.min(rand(opts.guestsMin, opts.guestsMax), activeResidents.length);
            const createdGuestIds = [];
            for (let i = 0; i < guestCount; i++) {
                const host = pick(activeResidents);
                const checkInDate = randomPastDate(opts.spreadOverDays);
                const checkOutDate = new Date(checkInDate);
                checkOutDate.setDate(checkOutDate.getDate() + rand(1, 5));
                const guest = this.addGuest({
                    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, hostResidentId: host.id, phone: randPhone(),
                    checkIn: checkInDate, checkOut: checkOutDate.toISOString().slice(0, 10), dailyRate: 50000
                });
                if (guest && guest.id) createdGuestIds.push(guest.id);
                guestsCreated++;
            }
            createdGuestIds.forEach(id => { if (Math.random() < 0.5) this.markGuestPaid(id); });
        }

        // ملاحظة: هذا المولّد عمداً لا يُنشئ إجازات تجريبية. أي إجازة — حتى مع الاحتفاظ
        // بالسرير — تضع حالة السرير على "محجوز للإجازة" وليس "مشغول"، وحساب نسبة الإشغال
        // الفعلي في التطبيق (occupancyStats) يحتسب "مشغول" فقط كأسرّة مُشغَلة، فإضافة إجازات
        // هنا كانت (بالاختبار الفعلي) تُنزِّل نسبة الإشغال المحسوبة رغم عدم توفر خيار تحكم لها هنا —
        // فتم إسقاطها من هذا المولّد تحديداً (الإجازات لسه متاحة عادي يدوياً من صفحة "الإجازات").
        const vacationsCreated = 0;

        // ---------------- مصروفات تشغيلية واقعية (قابلة للتعطيل، ونسبتها قابلة للتحكم) ----------------
        const EXPENSE_SEED_DEFS = [
            { category: 'الإيجار', min: 0.15, max: 0.25 },
            { category: 'المرتبات', min: 0.10, max: 0.18 },
            { category: 'الطعام', min: 0.08, max: 0.15 },
            { category: 'الكهرباء', min: 0.03, max: 0.07 },
            { category: 'المياه', min: 0.02, max: 0.04 },
            { category: 'الإنترنت', min: 0.01, max: 0.03 },
            { category: 'النظافة', min: 0.01, max: 0.03 },
            { category: 'الأمن', min: 0.02, max: 0.05 },
            { category: 'الصيانة', min: 0.02, max: 0.05 },
            { category: 'المشتريات', min: 0.01, max: 0.04 }
        ];
        let expensesCreated = 0, totalExpensesSeeded = 0;
        const partnersNames = this.getPartners().map(p => p.name);
        if (opts.generateExpenses) {
            // نضمن قاعدة إيراد معقولة حتى لو محدش دفع فعلياً (عشان المصروفات ما تفضلش صفر)
            const revenueBase = Math.max(totalRevenueCollected, residentsCreated * basePrice * 0.5, basePrice);

            EXPENSE_SEED_DEFS.forEach(def => {
                if (Math.random() < 0.85) {
                    const pct = (def.min + Math.random() * (def.max - def.min)) * opts.expensePercentMultiplier;
                    const amount = Math.max(Math.round(revenueBase * pct), 5000);
                    this.addExpense({
                        date: randomPastDate(opts.spreadOverDays),
                        category: def.category,
                        amount,
                        chargedAmount: amount,
                        description: `${def.category} (بيانات تجريبية للداخلية)`,
                        paidBy: partnersNames.length ? pick(partnersNames) : '',
                        paymentSource: pick(['نقدي','تحويل بنكي','الخزينة']),
                        nature: 'تجاري',
                        needsAllocation: false,
                        status: 'مسجل',
                        createdBy: this.SEEDED_EXPENSE_MARKER
                    });
                    expensesCreated++;
                    totalExpensesSeeded += amount;
                }
            });
        }

        // ---------------- نشاط شهر كامل عبر كل صفحات النظام (اختياري) ----------------
        // مساهمات رأس مال، سلف شركاء (مع سداد جزئي أحياناً)، شراء أصل، وتوزيع أرباح — كل ده
        // موزَّع على مدار الفترة الزمنية (spreadOverDays)، عشان صفحات "الشراكة" و"التأسيس
        // والتجهيز" و"الخزينة" ولوحة التحكم تعكس فعلاً حركة شهر كامل، مش بس هيكل الداخلية.
        let capitalContributed = 0, advancesCreated = 0, repaymentsCreated = 0, assetsCreated = 0, distributionsCreated = 0, distributionsTotal = 0;
        if (opts.fullSystemActivity) {
            const partners = this.getPartners();
            const spread = opts.spreadOverDays || 30; // لو النشاط الكامل مفعّل بدون انتشار زمني، نفترض شهراً عشان يبقى له معنى

            partners.forEach(p => {
                // مساهمة رأس مال: تجاه المساهمة المطلوبة لو محددة، وإلا مبلغ عشوائي معقول
                const targetContribution = Number(p.requiredContribution) > 0
                    ? Number(p.requiredContribution)
                    : rand(2000000, 5000000);
                const contributionAmount = Math.round(targetContribution * (rand(60, 100) / 100));
                if (contributionAmount > 0) {
                    this.addTransaction({
                        date: randomPastDate(spread), description: `مساهمة رأس مال — ${p.name} (بيانات تجريبية)`,
                        type: 'مساهمة رأس مال', category: 'رأس مال تأسيسي', amount: contributionAmount,
                        partner: p.name, paymentSource: pick(['نقدي','تحويل بنكي']), status: 'مسجلة',
                        createdBy: this.SEEDED_DEMO_MARKER, notes: 'بيانات تجريبية (نشاط شهر كامل)'
                    });
                    capitalContributed += contributionAmount;
                }

                // سلفة شريك، مع فرصة 50% لسداد جزء منها لاحقاً في نفس الفترة
                if (Math.random() < 0.7) {
                    const advanceDate = randomPastDate(spread);
                    const advanceAmount = rand(200000, 800000);
                    this.addTransaction({
                        date: advanceDate, description: `سلفة شريك — ${p.name} (بيانات تجريبية)`,
                        type: 'سلفة شريك', category: 'سلفة للشراكة', amount: advanceAmount,
                        partner: p.name, paymentSource: pick(['نقدي','تحويل بنكي']), status: 'مسجلة',
                        createdBy: this.SEEDED_DEMO_MARKER, notes: 'بيانات تجريبية (نشاط شهر كامل)'
                    });
                    advancesCreated++;
                    if (Math.random() < 0.5) {
                        const repayAmount = Math.round(advanceAmount * (rand(30, 70) / 100));
                        this.addTransaction({
                            date: randomDateAfter(advanceDate), description: `سداد سلفة — ${p.name} (بيانات تجريبية)`,
                            type: 'سداد سلفة', category: 'سداد سلفة شريك', amount: repayAmount,
                            partner: p.name, paymentSource: pick(['نقدي','تحويل بنكي']), status: 'مسجلة',
                            createdBy: this.SEEDED_DEMO_MARKER, notes: 'بيانات تجريبية (نشاط شهر كامل)'
                        });
                        repaymentsCreated++;
                    }
                }
            });

            // شراء أصل واحد على الأقل (يظهر في التأسيس والتجهيز + الأصول)
            if (Math.random() < 0.8) {
                const ASSET_SEED_DEFS = [
                    { name: 'أسرّة إضافية', category: 'الأسرة' }, { name: 'مراتب', category: 'المراتب' },
                    { name: 'مكيفات هواء', category: 'المكيفات' }, { name: 'أثاث غرف الطالبات', category: 'الأثاث' }
                ];
                const def = pick(ASSET_SEED_DEFS);
                const qty = rand(2, 10);
                const cost = qty * rand(50000, 300000);
                this.addAsset({
                    name: `${def.name} (بيانات تجريبية)`, category: def.category, quantity: qty,
                    purchaseCost: cost, purchaseDate: randomPastDate(spread),
                    paidBy: partnersNames.length ? pick(partnersNames) : '', condition: 'جيدة',
                    location: 'المخزن الرئيسي', createdBy: this.SEEDED_DEMO_MARKER
                });
                assetsCreated++;
            }

            // توزيع أرباح للشهر الحالي لو فيه أرباح قابلة للتوزيع فعلاً
            const currentMonth = Utils.monthKey(Utils.todayISO());
            const profitCalc = this.calculateProfit(currentMonth, { reserve: settings.operatingReserveDefault || 0 });
            if (profitCalc.distributable > 0) {
                partners.forEach(p => {
                    const share = profitCalc.shares[p.name] || 0;
                    if (share <= 0) return;
                    const paidShare = Math.round(share * (rand(40, 100) / 100));
                    if (paidShare <= 0) return;
                    this.addTransaction({
                        date: Utils.todayISO(), description: `توزيع أرباح ${Utils.monthLabel(currentMonth)} — ${p.name} (بيانات تجريبية)`,
                        type: 'توزيع أرباح', category: 'توزيع أرباح شهري', amount: paidShare,
                        partner: p.name, paymentSource: pick(['نقدي','تحويل بنكي']), status: 'مسجلة',
                        createdBy: this.SEEDED_DEMO_MARKER, notes: 'بيانات تجريبية (نشاط شهر كامل)'
                    });
                    distributionsCreated++;
                    distributionsTotal += paidShare;
                });
            }
        }

        // نعلّم في الإعدادات إن فيه بيانات تجريبية نشطة حالياً — تُستخدم لعرض تنبيه واضح في
        // كل صفحات النظام (مش بس داخل شاشة الإعدادات) طالما البيانات دي موجودة.
        this.saveSettings({ demoDataActive: true });

        const summary = {
            floors: floorsCount, apartments: apartmentsCount, rooms: roomsCount, beds: createdBeds.length,
            occupiedBeds: bedsToFill, occupancyPercent: opts.occupancyPercent, spreadOverDays: opts.spreadOverDays,
            residents: residentsCreated, guests: guestsCreated, vacations: vacationsCreated,
            servicesAssigned, expenses: expensesCreated, revenueCollected: totalRevenueCollected, expensesTotal: totalExpensesSeeded,
            fullSystemActivity: opts.fullSystemActivity, capitalContributed, advancesCreated, repaymentsCreated,
            assetsCreated, distributionsCreated, distributionsTotal
        };
        this.addActivity({
            user, action: `ولّد بيانات تجريبية للنظام (إشغال ${opts.occupancyPercent}%${opts.fullSystemActivity ? ' + نشاط شهر كامل عبر كل الصفحات' : ''})`,
            entity: `${summary.floors} طابق، ${summary.apartments} شقة، ${summary.rooms} غرفة، ${summary.residents} طالبة، ${summary.expenses} بند مصروف${opts.fullSystemActivity ? `، ${summary.advancesCreated} سلفة، ${summary.assetsCreated} أصل، ${summary.distributionsCreated} توزيع` : ''}`
        });
        return summary;
    },

    // إعادة تهيئة الداخلية والبيانات التجريبية المرتبطة بها من الصفر: يمسح الطوابق/الشقق/
    // الغرف/الأسرة/الطالبات/الضيفات/الخدمات/الإجازات/تغييرات التسكين، وأي إيرادات ناتجة عنها،
    // بالإضافة إلى المصروفات التي ولّدها مولّد البيانات التجريبية (SEEDED_EXPENSE_MARKER) وأي
    // معاملات/أصول ولّدها "نشاط الشهر الكامل" (SEEDED_DEMO_MARKER) — دون المساس بالشركاء أو
    // إعدادات المالية العامة أو أي بيانات حقيقية أدخلها المستخدم بنفسه.
    // مخصص لإعادة الاختبار من جديد بعد "تعبئة عشوائية للتجربة".
    resetDormitoryOnly() {
        const user = Utils.currentUserName();
        const DORM_REVENUE_CATEGORIES = ['إيراد سكن وإعاشة', 'إيراد خدمة الطعام', 'إيراد خدمة الإنترنت', 'إيراد المكتبة', 'إيراد الترحيل', 'إيراد استضافة'];

        StorageService.set(STORAGE_KEYS.floors, []);
        StorageService.set(STORAGE_KEYS.apartments, []);
        StorageService.set(STORAGE_KEYS.bathrooms, []);
        StorageService.set(STORAGE_KEYS.rooms, []);
        StorageService.set(STORAGE_KEYS.beds, []);
        StorageService.set(STORAGE_KEYS.roomTypes, []); // أنواع الغرف المخصصة فقط — الأنواع الافتراضية ثابتة في الكود
        StorageService.set(STORAGE_KEYS.residents, []);
        StorageService.set(STORAGE_KEYS.guests, []);
        StorageService.set(STORAGE_KEYS.services, []);
        StorageService.set(STORAGE_KEYS.residentServices, []);
        StorageService.set(STORAGE_KEYS.vacations, []);
        StorageService.set(STORAGE_KEYS.transfers, []);

        // إزالة إيرادات الداخلية المرتبطة بالطالبات/الضيفات/الخدمات، وأي معاملات ولّدها نشاط
        // الشهر الكامل (مساهمات/سلف/سداد/توزيعات تجريبية) — تبقى أي معاملة حقيقية أدخلها
        // المستخدم بنفسه كما هي تماماً.
        const remainingTransactions = (StorageService.get(STORAGE_KEYS.transactions) || [])
            .filter(t => !(t.type === 'إيراد' && DORM_REVENUE_CATEGORIES.includes(t.category)))
            .filter(t => t.createdBy !== this.SEEDED_DEMO_MARKER);
        StorageService.set(STORAGE_KEYS.transactions, remainingTransactions);

        // إزالة المصروفات التي ولّدها مولّد البيانات التجريبية فقط (عبر createdBy marker) —
        // أي مصروف حقيقي أدخله المستخدم يدوياً أو عبر قالب دوري حقيقي يبقى كما هو دون تأثر.
        const remainingExpenses = (StorageService.get(STORAGE_KEYS.expenses) || [])
            .filter(e => e.createdBy !== this.SEEDED_EXPENSE_MARKER);
        StorageService.set(STORAGE_KEYS.expenses, remainingExpenses);

        // إزالة الأصول التي ولّدها نشاط الشهر الكامل فقط — أي أصل حقيقي أضافه المستخدم يبقى كما هو.
        const remainingAssets = (StorageService.get(STORAGE_KEYS.assets) || [])
            .filter(a => a.createdBy !== this.SEEDED_DEMO_MARKER);
        StorageService.set(STORAGE_KEYS.assets, remainingAssets);

        this.saveSettings({ roomsCount: 0, bedsCount: 0, demoDataActive: false });
        this.addActivity({ user, action: 'أعاد تهيئة الداخلية والبيانات التجريبية المرتبطة بها بالكامل من الصفر', entity: 'دون التأثير على الشركاء أو الإعدادات المالية العامة أو أي بيانات حقيقية' });
    }
};


/* ==========================================================================
   بيانات تجريبية أولية (Seed Data)
   النظام يبدأ فارغاً تماماً: لا طوابق، لا شقق، لا غرف، لا أسرة، لا طالبات —
   المستخدم هو من يبني هيكل الداخلية بنفسه من صفحة "هيكل الداخلية".
   ========================================================================== */
function seedDemoData(force = false) {
    const already = StorageService.get(STORAGE_KEYS.meta);
    if (already && already.seeded && !force) return;

    /* ---------- الإعدادات ---------- */
    StorageService.set(STORAGE_KEYS.settings, {
        currentUser: 'أيمن',
        ownership: { 'أيمن': 50, 'الفاضل': 50 },
        roomsCount: 0,
        bedsCount: 0,
        bedPrice: 400000,
        rent: 8000000,
        rentIncrease: 25,
        rentBaseYear: 2025,
        currentYear: 2026,
        approvalLimit: 1000000,
        setupBudget: 20000000,
        operatingReserveDefault: 1000000
    });

    /* ---------- الشركاء ---------- */
    StorageService.set(STORAGE_KEYS.partners, [
        { id: 'p_ayman', name: 'أيمن', ownership: 50, role: 'شريك مؤسس' },
        { id: 'p_fadil', name: 'الفاضل', ownership: 50, role: 'شريك مؤسس' }
    ]);

    /* ---------- هيكل الداخلية: يبدأ فارغاً تماماً ---------- */
    StorageService.set(STORAGE_KEYS.floors, []);
    StorageService.set(STORAGE_KEYS.apartments, []);
    StorageService.set(STORAGE_KEYS.bathrooms, []);
    StorageService.set(STORAGE_KEYS.rooms, []);
    StorageService.set(STORAGE_KEYS.beds, []);
    StorageService.set(STORAGE_KEYS.roomTypes, []);
    StorageService.set(STORAGE_KEYS.residents, []);
    StorageService.set(STORAGE_KEYS.guests, []);
    StorageService.set(STORAGE_KEYS.services, []);
    StorageService.set(STORAGE_KEYS.residentServices, []);
    StorageService.set(STORAGE_KEYS.vacations, []);
    StorageService.set(STORAGE_KEYS.transfers, []);
    StorageService.set(STORAGE_KEYS.transactions, []);
    StorageService.set(STORAGE_KEYS.expenses, []);
    StorageService.set(STORAGE_KEYS.assets, []);
    StorageService.set(STORAGE_KEYS.activities, []);
    StorageService.set(STORAGE_KEYS.closings, []);

    StorageService.set(STORAGE_KEYS.meta, { seeded: true, seedDate: new Date().toISOString(), version: 4 });
}

// تشغيل البذر عند أول تحميل
seedDemoData();
