/**
 * Campus Helper — Timetable & "Free Hour Finder" Module
 * Parses student schedule, computes gaps, and dynamically renders productivity suggestions.
 */

const TimetableModule = {
    currentDay: 'Monday',
    activeFilter: 'all',

    init() {
        this.currentDay = this.getTodayName();
        const daySelector = document.getElementById('timetable-day-selector');
        if (daySelector) {
            daySelector.querySelectorAll('.day-pill').forEach(p => {
                if (p.dataset.day === this.currentDay) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });
        }
        this.bindEvents();
        this.render();
    },

    getTodayName() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(today) ? today : 'Monday';
    },

    bindEvents() {
        const daySelector = document.getElementById('timetable-day-selector');
        if (daySelector) {
            daySelector.addEventListener('click', (e) => {
                const btn = e.target.closest('.day-pill');
                if (btn) {
                    daySelector.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentDay = btn.dataset.day;
                    App.playSound('click');
                    this.render();
                }
            });
        }

        const addClassBtn = document.getElementById('btn-add-class');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => {
                App.openModal('modal-add-class');
            });
        }

        const addClassForm = document.getElementById('form-add-class');
        if (addClassForm) {
            addClassForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateClass(e.target);
            });
        }
    },

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    },

    minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH}:${displayM} ${period}`;
    },

    /**
     * The Free Hour Finder Algorithm
     * Takes raw class schedule, sorts chronologically, and calculates gaps.
     */
    findFreeGaps(classes) {
        if (!classes || classes.length === 0) {
            return [{
                startMin: 540, // 09:00 AM
                endMin: 1020, // 05:00 PM
                duration: 480,
                startFormatted: '9:00 AM',
                endFormatted: '5:00 PM',
                suggestions: this.getSuggestionsForDuration(480)
            }];
        }

        // Sort classes by start time
        const sorted = [...classes].sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));
        const gaps = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const currentClassEnd = this.timeToMinutes(sorted[i].end);
            const nextClassStart = this.timeToMinutes(sorted[i + 1].start);
            const gapDuration = nextClassStart - currentClassEnd;

            // Only recognize gaps of 30 minutes or more
            if (gapDuration >= 30) {
                gaps.push({
                    prevClass: sorted[i].name,
                    nextClass: sorted[i + 1].name,
                    startMin: currentClassEnd,
                    endMin: nextClassStart,
                    duration: gapDuration,
                    startFormatted: this.minutesToTime(currentClassEnd),
                    endFormatted: this.minutesToTime(nextClassStart),
                    suggestions: this.getSuggestionsForDuration(gapDuration)
                });
            }
        }

        return gaps;
    },

    getSuggestionsForDuration(duration) {
        if (duration <= 45) {
            return [
                { title: '⚡ Flashcard Sprint', desc: 'Revise 20 active recall flashcards on Quizlet or Anki', tag: 'High Yield', icon: 'zap' },
                { title: '💧 Mind Reset & Walk', desc: 'Hydrate, stretch, and 15m mental power walk across quad', tag: 'Wellness', icon: 'heart' },
                { title: '📝 Lecture Digestion', desc: 'Jot down 3 key takeaways from the lecture just finished', tag: 'Retention', icon: 'file-text' }
            ];
        } else if (duration <= 80) {
            return [
                { title: '🎯 Deep Work in Quiet Library', desc: 'Head to Library 3rd Floor quiet booth to solve 2 problem set questions', tag: 'Deep Work', icon: 'book-open' },
                { title: '💻 LeetCode Problem of the Day', desc: 'Solve 1 Medium difficulty graph or tree problem', tag: 'Coding', icon: 'code' },
                { title: '☕ Office Hours Prep', desc: 'Formulate specific questions for prof\'s afternoon office hours', tag: 'Academic', icon: 'help-circle' }
            ];
        } else {
            return [
                { title: '🚀 Hackathon Project Sprint', desc: 'Work on your Innovation Spark: implement core backend API', tag: 'Sparks', icon: 'cpu' },
                { title: '👥 Peer Group Study Lab', desc: 'Reserve Study Room 204 for deep dive into OS concurrency', tag: 'Collaboration', icon: 'users' },
                { title: '🏋️ Campus Recreation Workout', desc: 'Hit the university fitness center for an energizing training session', tag: 'Health', icon: 'activity' }
            ];
        }
    },

    render() {
        const schedule = Store.get(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        const dayClasses = schedule[this.currentDay] || [];
        const container = document.getElementById('timetable-schedule-flow');
        const statsSlot = document.getElementById('timetable-quick-metrics');

        // Calculate free gaps
        const gaps = this.findFreeGaps(dayClasses);
        const totalFreeMinutes = gaps.reduce((acc, g) => acc + g.duration, 0);
        const freeHours = Math.floor(totalFreeMinutes / 60);
        const freeRemainingMins = totalFreeMinutes % 60;

        // Render Quick Metrics
        if (statsSlot) {
            statsSlot.innerHTML = `
                <div class="metric-chip cyan-glow">
                    <span class="chip-label">Classes Scheduled</span>
                    <span class="chip-val">${dayClasses.length} lectures</span>
                </div>
                <div class="metric-chip purple-glow">
                    <span class="chip-label">Free Slots Found</span>
                    <span class="chip-val">${gaps.length} available</span>
                </div>
                <div class="metric-chip emerald-glow">
                    <span class="chip-label">Total Productive Free Time</span>
                    <span class="chip-val">${freeHours > 0 ? freeHours + 'h ' : ''}${freeRemainingMins}m</span>
                </div>
                <div class="metric-chip amber-glow status-pulse">
                    <span class="chip-label">Hour Finder Mode</span>
                    <span class="chip-val">AI Optimizer Active</span>
                </div>
            `;
        }

        // Render Interleaved Schedule (Classes + Detected Gaps)
        if (!container) return;
        container.innerHTML = '';

        if (dayClasses.length === 0) {
            container.innerHTML = `
                <div class="glass-panel text-center py-8">
                    <p class="text-muted">No classes scheduled for ${this.currentDay}! Enjoy your full free day.</p>
                </div>
            `;
            return;
        }

        const sortedClasses = [...dayClasses].sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));

        sortedClasses.forEach((cls, index) => {
            // Render class card
            const classCard = document.createElement('div');
            classCard.className = `schedule-item class-card border-${cls.color || 'cyan'}`;
            classCard.innerHTML = `
                <div class="class-time-badge">
                    <span class="time-range">${this.minutesToTime(this.timeToMinutes(cls.start))} – ${this.minutesToTime(this.timeToMinutes(cls.end))}</span>
                    <span class="class-type badge-${cls.color || 'cyan'}">${cls.type || 'Lecture'}</span>
                </div>
                <div class="class-details">
                    <div class="class-title-row">
                        <h4 class="class-name">${cls.name}</h4>
                        <span class="course-code">${cls.code}</span>
                    </div>
                    <div class="class-meta">
                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${cls.room}</span>
                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${cls.prof}</span>
                    </div>
                </div>
                <div class="class-actions">
                    <button class="btn-icon text-muted hover-cyan" title="Class Notes" onclick="App.navigateTo('study');">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </button>
                    <button class="btn-icon text-muted hover-red" title="Remove" onclick="TimetableModule.deleteClass('${cls.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(classCard);

            // Check if there is a gap between this class and the next
            if (index < sortedClasses.length - 1) {
                const curEnd = this.timeToMinutes(cls.end);
                const nextStart = this.timeToMinutes(sortedClasses[index + 1].start);
                const gapDuration = nextStart - curEnd;

                if (gapDuration >= 30) {
                    const gapHours = Math.floor(gapDuration / 60);
                    const gapM = gapDuration % 60;
                    const durationLabel = `${gapHours > 0 ? gapHours + 'h ' : ''}${gapM}m`;
                    const suggestions = this.getSuggestionsForDuration(gapDuration);

                    const gapCard = document.createElement('div');
                    gapCard.className = 'free-gap-slot glass-panel glowing-border-purple';
                    gapCard.innerHTML = `
                        <div class="free-gap-header">
                            <div class="gap-indicator">
                                <span class="gap-pulse"></span>
                                <span class="gap-title">⚡ FREE HOUR FINDER DETECTED GAP</span>
                                <span class="gap-time-tag">${this.minutesToTime(curEnd)} – ${this.minutesToTime(nextStart)} (${durationLabel} Free)</span>
                            </div>
                            <span class="badge-gap-ai">Smart Optimization</span>
                        </div>
                        <div class="gap-body">
                            <p class="gap-intro">Make every minute count! Recommended high-productivity activities for this ${durationLabel} window:</p>
                            <div class="gap-suggestions-grid">
                                ${suggestions.map((sug, i) => `
                                    <div class="suggestion-card" onclick="TimetableModule.claimSuggestion('${sug.title}', '${durationLabel}')">
                                        <div class="sug-header">
                                            <span class="sug-tag">${sug.tag}</span>
                                            <button class="btn-micro-action" title="Claim this suggestion">Claim</button>
                                        </div>
                                        <h5 class="sug-title">${sug.title}</h5>
                                        <p class="sug-desc">${sug.desc}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                    container.appendChild(gapCard);
                }
            }
        });
    },

    claimSuggestion(title, duration) {
        App.playSound('chime');
        App.showToast(`Productivity Slot Claimed!`, `⚡ "${title}" locked into your session (${duration}). +25 Study XP gained!`, 'success');
    },

    deleteClass(id) {
        const schedule = Store.get(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        if (schedule[this.currentDay]) {
            schedule[this.currentDay] = schedule[this.currentDay].filter(c => c.id !== id);
            Store.set(STORAGE_KEYS.SCHEDULE, schedule);
            App.playSound('pop');
            App.showToast('Class Removed', 'Schedule and Free Hour Finder re-calculated.', 'info');
            this.render();
            // Also refresh dashboard next class preview
            if (typeof DashboardModule !== 'undefined') DashboardModule.renderSchedulePreview();
        }
    },

    handleCreateClass(form) {
        const name = form.className.value.trim();
        const code = form.classCode.value.trim().toUpperCase();
        const room = form.classRoom.value.trim();
        const prof = form.classProf.value.trim();
        const start = form.classStart.value;
        const end = form.classEnd.value;
        const day = form.classDay.value;
        const color = form.classColor.value;

        if (!name || !start || !end) {
            App.showToast('Missing Fields', 'Please specify class name and times.', 'warning');
            return;
        }

        if (this.timeToMinutes(start) >= this.timeToMinutes(end)) {
            App.showToast('Invalid Times', 'Class end time must be after start time.', 'error');
            return;
        }

        const schedule = Store.get(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        if (!schedule[day]) schedule[day] = [];

        const newClass = {
            id: 'cls_' + Date.now(),
            name,
            code: code || 'COURSE',
            room: room || 'TBD',
            prof: prof || 'Professor',
            start,
            end,
            color,
            type: 'Lecture'
        };

        schedule[day].push(newClass);
        Store.set(STORAGE_KEYS.SCHEDULE, schedule);

        App.closeModal('modal-add-class');
        form.reset();
        App.playSound('success');
        App.showToast('Class Scheduled', `${name} successfully added. Gaps recalibrated!`, 'success');

        if (this.currentDay === day) {
            this.render();
        }
        if (typeof DashboardModule !== 'undefined') DashboardModule.renderSchedulePreview();
    }
};

if (typeof window !== 'undefined') {
    window.TimetableModule = TimetableModule;
}
