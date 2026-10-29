/**
 * Campus Helper — Master Application Controller
 * Handles SPA navigation, Dashboard logic, Web Audio synthesizer, toasts, and modals.
 */

// Global Audio Feedback Synthesizer using Web Audio API (Zero external assets)
const SoundFx = {
    ctx: null,
    muted: false,

    init() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        } catch (e) {
            console.warn('Web Audio not supported');
        }
    },

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    play(type) {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        switch (type) {
            case 'click': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'pop': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
                break;
            }
            case 'chime': {
                // Dual harmonious tone (C6 & E6)
                [1046.5, 1318.5].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.06);
                    gain.gain.setValueAtTime(0.1, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.35);
                });
                break;
            }
            case 'success': {
                // Arpeggio (C5, G5, C6)
                [523.25, 783.99, 1046.5].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.12, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.45);
                });
                break;
            }
            case 'error': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(180, now + 0.08);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
                break;
            }
        }
    }
};

// Dashboard Sub-Controller
const DashboardModule = {
    priorityFilter: 'all',

    init() {
        this.bindEvents();
        this.renderStats();
        this.renderPriorities();
        this.renderSchedulePreview();
        this.initCountdowns();
        this.initScratchpad();
    },

    bindEvents() {
        // Priority filter buttons
        const filterBtns = document.querySelectorAll('.priority-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.priorityFilter = btn.dataset.filter;
                App.playSound('click');
                this.renderPriorities();
            });
        });

        // Quick add priority form
        const addPriorityForm = document.getElementById('form-add-priority');
        if (addPriorityForm) {
            addPriorityForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddPriority(e.target);
            });
        }
    },

    getPriorities() {
        return Store.get(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES);
    },

    savePriorities(priorities) {
        Store.set(STORAGE_KEYS.PRIORITIES, priorities);
        this.renderPriorities();
        this.renderStats();
    },

    renderPriorities() {
        const container = document.getElementById('dashboard-priorities-list');
        if (!container) return;

        let items = this.getPriorities();
        if (this.priorityFilter === 'pending') {
            items = items.filter(p => !p.completed);
        } else if (this.priorityFilter === 'completed') {
            items = items.filter(p => p.completed);
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state-card glass-panel text-center py-6">
                    <p class="text-muted">No priorities found for this filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = `priority-item-card glass-panel ${item.completed ? 'completed' : ''} priority-${item.priority}`;
            row.innerHTML = `
                <div class="priority-checkbox-wrap">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="DashboardModule.togglePriority('${item.id}')">
                        <span class="checkmark"></span>
                    </label>
                </div>
                <div class="priority-content">
                    <span class="priority-title ${item.completed ? 'line-through text-muted' : ''}">${item.title}</span>
                    <div class="priority-meta">
                        <span class="badge-tag course-tag">${item.course}</span>
                        <span class="badge-tag category-tag">${item.category || 'Study'}</span>
                        <span class="priority-due text-muted">⏰ ${item.dueDate}</span>
                    </div>
                </div>
                <div class="priority-actions">
                    <button class="btn-micro-icon text-muted hover-red" title="Delete" onclick="DashboardModule.deletePriority('${item.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });

        // Update progress bar
        const allItems = this.getPriorities();
        const doneCount = allItems.filter(p => p.completed).length;
        const total = allItems.length;
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

        const progressFill = document.getElementById('priority-progress-fill');
        const progressLabel = document.getElementById('priority-progress-label');
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressLabel) progressLabel.textContent = `${doneCount}/${total} Completed (${pct}%)`;
    },

    togglePriority(id) {
        const items = this.getPriorities();
        const item = items.find(p => p.id === id);
        if (item) {
            item.completed = !item.completed;
            if (item.completed) {
                App.playSound('chime');
                App.showToast('Priority Completed!', `Nice work finishing: "${item.title}"`, 'success');
            } else {
                App.playSound('pop');
            }
            this.savePriorities(items);
        }
    },

    deletePriority(id) {
        let items = this.getPriorities();
        items = items.filter(p => p.id !== id);
        App.playSound('pop');
        App.showToast('Priority Removed', 'Item deleted from your checklist.', 'info');
        this.savePriorities(items);
    },

    handleAddPriority(form) {
        const title = form.priorityTitle.value.trim();
        const course = form.priorityCourse.value.trim();
        const priority = form.priorityLevel.value;
        const due = form.priorityDue.value.trim() || 'Tomorrow, 5:00 PM';

        if (!title) {
            App.showToast('Empty Task', 'Please enter a task title.', 'warning');
            return;
        }

        const items = this.getPriorities();
        const newItem = {
            id: 'p_' + Date.now(),
            title,
            course: course || 'General',
            priority,
            dueDate: due,
            completed: false,
            category: 'Study'
        };

        items.unshift(newItem);
        this.savePriorities(items);

        form.reset();
        App.playSound('success');
        App.showToast('Priority Added', `Added "${title}" to daily goals.`, 'success');
    },

    renderStats() {
        // Attendance
        const attendanceEl = document.getElementById('dash-stat-attendance');
        if (attendanceEl) attendanceEl.textContent = '94.2%';

        // GPA
        const gpaEl = document.getElementById('dash-stat-gpa');
        if (gpaEl) gpaEl.textContent = '3.88 / 4.0';

        // Budget Remaining
        const finance = Store.get(STORAGE_KEYS.FINANCE, DEFAULT_FINANCE);
        let totalSpent = 0;
        if (finance && finance.categories) {
            Object.values(finance.categories).forEach(cat => totalSpent += cat.spent);
        }
        const remaining = (finance.budget || 800) - totalSpent;
        const budgetEl = document.getElementById('dash-stat-budget');
        if (budgetEl) budgetEl.textContent = `$${remaining.toFixed(2)}`;

        // Free Gap Hours Today
        const todayName = TimetableModule.getTodayName();
        const schedule = Store.get(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        const dayClasses = schedule[todayName] || [];
        const gaps = TimetableModule.findFreeGaps(dayClasses);
        const totalGapMins = gaps.reduce((acc, g) => acc + g.duration, 0);
        const h = Math.floor(totalGapMins / 60);
        const m = totalGapMins % 60;
        const freeGapEl = document.getElementById('dash-stat-free-hours');
        if (freeGapEl) freeGapEl.textContent = `${h > 0 ? h + 'h ' : ''}${m}m`;
    },

    renderSchedulePreview() {
        const previewSlot = document.getElementById('dash-schedule-preview');
        if (!previewSlot) return;

        const todayName = TimetableModule.getTodayName();
        const schedule = Store.get(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        const dayClasses = schedule[todayName] || [];

        if (dayClasses.length === 0) {
            previewSlot.innerHTML = `<div class="p-4 text-muted text-center">No scheduled lectures today!</div>`;
            return;
        }

        const sorted = [...dayClasses].sort((a, b) => TimetableModule.timeToMinutes(a.start) - TimetableModule.timeToMinutes(b.start));
        const first = sorted[0];

        previewSlot.innerHTML = `
            <div class="next-class-card glass-panel glowing-border-cyan">
                <div class="next-class-status">
                    <span class="live-beacon"></span>
                    <span class="text-xs uppercase tracking-wider text-cyan font-bold">Upcoming Next</span>
                </div>
                <h4 class="next-class-title">${first.name} (${first.code})</h4>
                <div class="next-class-details">
                    <span>⏰ ${TimetableModule.minutesToTime(TimetableModule.timeToMinutes(first.start))} – ${TimetableModule.minutesToTime(TimetableModule.timeToMinutes(first.end))}</span>
                    <span>📍 ${first.room}</span>
                    <span>👨‍🏫 ${first.prof}</span>
                </div>
                <button class="btn-sm btn-secondary mt-3 w-full" onclick="App.navigateTo('timetable')">
                    Open Full Timetable & Hour Finder →
                </button>
            </div>
        `;
    },

    initCountdowns() {
        const exams = [
            { id: 'cd-1', name: 'Distributed Systems Final Exam', targetDate: new Date(Date.now() + 4 * 86400000 + 18 * 3600000 + 32 * 60000), color: 'red' },
            { id: 'cd-2', name: 'Machine Learning Term Paper', targetDate: new Date(Date.now() + 8 * 86400000 + 6 * 3600000), color: 'cyan' },
            { id: 'cd-3', name: 'HackMIT 2026 Opening Pitch', targetDate: new Date(Date.now() + 12 * 86400000 + 20 * 3600000), color: 'purple' }
        ];

        const container = document.getElementById('dash-countdown-list');
        if (!container) return;

        const updateClocks = () => {
            const now = new Date().getTime();
            container.innerHTML = '';

            exams.forEach(exam => {
                const distance = exam.targetDate.getTime() - now;
                if (distance < 0) return;

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                const card = document.createElement('div');
                card.className = `countdown-card glass-panel border-${exam.color}`;
                card.innerHTML = `
                    <div class="countdown-header">
                        <span class="countdown-name">${exam.name}</span>
                        <span class="countdown-badge ${exam.color}">${days < 5 ? '⚠️ Urgent' : 'Approaching'}</span>
                    </div>
                    <div class="countdown-digits-row">
                        <div class="digit-box"><span class="num">${days}</span><span class="label">Days</span></div>
                        <span class="colon">:</span>
                        <div class="digit-box"><span class="num">${hours}</span><span class="label">Hrs</span></div>
                        <span class="colon">:</span>
                        <div class="digit-box"><span class="num">${minutes}</span><span class="label">Mins</span></div>
                        <span class="colon">:</span>
                        <div class="digit-box"><span class="num">${seconds}</span><span class="label">Secs</span></div>
                    </div>
                `;
                container.appendChild(card);
            });
        };

        updateClocks();
        setInterval(updateClocks, 1000);
    },

    initScratchpad() {
        const scratchTextarea = document.getElementById('dash-scratchpad-input');
        if (!scratchTextarea) return;

        scratchTextarea.value = Store.get(STORAGE_KEYS.SCRATCHPAD, '');

        scratchTextarea.addEventListener('input', (e) => {
            Store.set(STORAGE_KEYS.SCRATCHPAD, e.target.value);
            const statusEl = document.getElementById('scratchpad-save-status');
            if (statusEl) {
                statusEl.textContent = 'Saving...';
                clearTimeout(this._scratchTimer);
                this._scratchTimer = setTimeout(() => {
                    statusEl.textContent = 'Saved to Cloud';
                }, 400);
            }
        });

        const copyBtn = document.getElementById('btn-copy-scratchpad');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(scratchTextarea.value).then(() => {
                    App.playSound('chime');
                    App.showToast('Copied!', 'Notes copied to clipboard.', 'success');
                });
            });
        }

        const clearBtn = document.getElementById('btn-clear-scratchpad');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear scratchpad content?')) {
                    scratchTextarea.value = '';
                    Store.set(STORAGE_KEYS.SCRATCHPAD, '');
                    App.playSound('pop');
                    App.showToast('Scratchpad Cleared', 'Your scratchpad is now clean.', 'info');
                }
            });
        }
    }
};

// Master App Controller
const App = {
    currentSection: 'dashboard',

    init() {
        SoundFx.init();
        this.bindGlobalEvents();
        this.initClock();
        this.initSidebar();
        this.initAudioToggle();

        // Initialize sub-modules
        DashboardModule.init();
        TimetableModule.init();
        FinanceModule.init();
        StudyModule.init();
        InnovationModule.init();
        NewsModule.init();

        this.initGlobalSearch();
        this.initQuickAddModal();
    },

    playSound(type) {
        SoundFx.play(type);
    },

    initAudioToggle() {
        const btn = document.getElementById('btn-toggle-sound');
        if (btn) {
            btn.addEventListener('click', () => {
                SoundFx.muted = !SoundFx.muted;
                btn.innerHTML = SoundFx.muted ? 
                    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>` :
                    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
                this.showToast(SoundFx.muted ? 'Sound Muted' : 'Sound Enabled', 'Audio feedback updated.', 'info');
                if (!SoundFx.muted) this.playSound('chime');
            });
        }
    },

    initClock() {
        const clockEl = document.getElementById('campus-live-clock');
        const dateEl = document.getElementById('campus-live-date');

        const updateClock = () => {
            const now = new Date();
            if (clockEl) {
                clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    },

    initSidebar() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.navigateTo(section);
                }
            });
        });

        // Mobile sidebar toggle
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('app-sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                this.playSound('click');
            });
        }
    },

    navigateTo(sectionId) {
        if (this.currentSection === sectionId) return;

        this.playSound('click');

        // Update nav item active states
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide old section, reveal new section with fade
        const sections = document.querySelectorAll('.content-view-section');
        sections.forEach(sec => {
            if (sec.id === `section-${sectionId}`) {
                sec.classList.remove('hidden');
                sec.classList.add('fade-in');
            } else {
                sec.classList.add('hidden');
                sec.classList.remove('fade-in');
            }
        });

        // Update top title
        const titles = {
            dashboard: { title: 'Dashboard Overview', desc: 'Real-time student snapshot & daily priorities' },
            timetable: { title: 'Timetable & Free Hour Finder', desc: 'AI-driven schedule optimization & gap utilization' },
            finance: { title: 'Campus Finance Tracker', desc: 'Monthly budgets, spending limits & expense logs' },
            study: { title: 'Academic Study Hub', desc: 'Course notes, free textbook library & progress metrics' },
            innovation: { title: 'Innovation & Sparks Board', desc: 'Incubate campus projects, ideas & hackathon sparks' },
            news: { title: 'News & Opportunities Feed', desc: 'Curated tech internships, hackathons & research grants' }
        };

        const pageTitleEl = document.getElementById('page-title-display');
        const pageDescEl = document.getElementById('page-subtitle-display');
        if (pageTitleEl && titles[sectionId]) {
            pageTitleEl.textContent = titles[sectionId].title;
        }
        if (pageDescEl && titles[sectionId]) {
            pageDescEl.textContent = titles[sectionId].desc;
        }

        this.currentSection = sectionId;

        // Auto-close mobile sidebar if open
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }

        // Trigger view-specific re-renders
        if (sectionId === 'finance') FinanceModule.render();
        if (sectionId === 'timetable') TimetableModule.render();
        if (sectionId === 'study') StudyModule.renderCircularProgress();
        if (sectionId === 'innovation') InnovationModule.render();
        if (sectionId === 'news') NewsModule.render();
        if (sectionId === 'dashboard') DashboardModule.renderStats();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    bindGlobalEvents() {
        // Modal overlay click to close
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close buttons in modal
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) this.closeModal(modal.id);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => this.closeModal(m.id));
            }
            // Press '/' to focus global search if not inside an input
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                const s = document.getElementById('global-search-input');
                if (s) s.focus();
            }
        });
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.playSound('click');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.playSound('pop');
        }
    },

    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-item glass-panel toast-${type} fade-in`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f5a0" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3366" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon-wrap">${iconSvg}</div>
            <div class="toast-body">
                <h5 class="toast-title">${title}</h5>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 350);
        }, 4000);
    },

    initGlobalSearch() {
        const searchInput = document.getElementById('global-search-input');
        const resultsBox = document.getElementById('global-search-results');
        if (!searchInput || !resultsBox) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                resultsBox.classList.add('hidden');
                return;
            }

            const priorities = Store.get(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES);
            const resources = Store.get(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
            const ideas = Store.get(STORAGE_KEYS.IDEAS, DEFAULT_IDEAS);
            const opps = Store.get(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES);

            const matchedPriorities = priorities.filter(p => p.title.toLowerCase().includes(query));
            const matchedResources = resources.filter(r => r.title.toLowerCase().includes(query) || r.course.toLowerCase().includes(query));
            const matchedIdeas = ideas.filter(i => i.title.toLowerCase().includes(query));
            const matchedOpps = opps.filter(o => o.title.toLowerCase().includes(query) || o.org.toLowerCase().includes(query));

            const totalMatches = matchedPriorities.length + matchedResources.length + matchedIdeas.length + matchedOpps.length;

            if (totalMatches === 0) {
                resultsBox.innerHTML = `<div class="p-4 text-center text-muted">No campus matches found for "${query}"</div>`;
                resultsBox.classList.remove('hidden');
                return;
            }

            resultsBox.innerHTML = `
                <div class="search-results-list">
                    ${matchedPriorities.map(p => `
                        <div class="search-res-item" onclick="App.navigateTo('dashboard'); App.closeSearch();">
                            <span class="res-type-badge cyan">Priority</span>
                            <span class="res-title-text">${p.title}</span>
                        </div>
                    `).join('')}
                    ${matchedResources.map(r => `
                        <div class="search-res-item" onclick="App.navigateTo('study'); App.closeSearch();">
                            <span class="res-type-badge purple">Study Resource</span>
                            <span class="res-title-text">${r.title} (${r.course})</span>
                        </div>
                    `).join('')}
                    ${matchedIdeas.map(i => `
                        <div class="search-res-item" onclick="App.navigateTo('innovation'); App.closeSearch();">
                            <span class="res-type-badge emerald">Innovation Spark</span>
                            <span class="res-title-text">${i.title}</span>
                        </div>
                    `).join('')}
                    ${matchedOpps.map(o => `
                        <div class="search-res-item" onclick="App.navigateTo('news'); App.closeSearch();">
                            <span class="res-type-badge amber">Opportunity</span>
                            <span class="res-title-text">${o.title} — ${o.org}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            resultsBox.classList.remove('hidden');
        });

        // Click outside closes search
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
                resultsBox.classList.add('hidden');
            }
        });
    },

    closeSearch() {
        const resultsBox = document.getElementById('global-search-results');
        const searchInput = document.getElementById('global-search-input');
        if (resultsBox) resultsBox.classList.add('hidden');
        if (searchInput) searchInput.value = '';
    },

    initQuickAddModal() {
        const quickAddBtn = document.getElementById('btn-header-quick-add');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                this.openModal('modal-quick-add');
            });
        }
    }
};

// Launch App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

if (typeof window !== 'undefined') {
    window.DashboardModule = DashboardModule;
    window.App = App;
    window.SoundFx = SoundFx;
}
