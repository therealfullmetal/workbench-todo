/**
 * MINIMALIST TASK APP (v4.0)
 * Clean reactive controller with i18n, Theme Switcher, Convenient Date Popover,
 * Single-Icon Search, and Zero-Jitter Checkbox
 */

import { Storage } from './storage.js';
import { sound } from './sound.js';
import { i18n } from './i18n.js';

class TodoApp {
  constructor() {
    this.tasks = Storage.load();
    this.filter = 'all'; // all | pending | completed
    this.searchQuery = '';
    this.editingId = null;
    this.lastDeleted = null;
    this.isUrgentSelected = false;
    this.selectedDate = null;
    this.currentGuideStep = 0;

    // Load Theme
    this.theme = localStorage.getItem('todo_theme') || 'dark';

    this.cacheDOM();
    this.applyTheme(this.theme);
    this.bindEvents();
    this.initSoundUI();
    this.initGuide();
    this.applyI18n();
    this.render();
  }

  cacheDOM() {
    // Header
    this.siteTitle = document.getElementById('siteTitle');
    this.openGuideBtn = document.getElementById('openGuideBtn');
    this.guideBtnText = document.getElementById('guideBtnText');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIconOn = document.getElementById('soundIconOn');
    this.soundIconOff = document.getElementById('soundIconOff');

    // Form & Chips
    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.addTaskBtn = document.getElementById('addTaskBtn');
    this.addBtnText = document.getElementById('addBtnText');
    this.categorySelect = document.getElementById('categorySelect');
    this.flagToggleBtn = document.getElementById('flagToggleBtn');
    this.urgentChipText = document.getElementById('urgentChipText');

    // Date Popover & Chips
    this.dateChipBtn = document.getElementById('dateChipBtn');
    this.dateChipLabel = document.getElementById('dateChipLabel');
    this.dateClearBtn = document.getElementById('dateClearBtn');
    this.datePopover = document.getElementById('datePopover');
    this.presetToday = document.getElementById('presetToday');
    this.presetTomorrow = document.getElementById('presetTomorrow');
    this.presetWeek = document.getElementById('presetWeek');
    this.dateCustomInput = document.getElementById('dateCustomInput');

    // Toolbar (Tabs & Single Magnifying Glass Search)
    this.tabAll = document.getElementById('tabAll');
    this.tabPending = document.getElementById('tabPending');
    this.tabCompleted = document.getElementById('tabCompleted');
    this.tabAllText = document.getElementById('tabAllText');
    this.tabPendingText = document.getElementById('tabPendingText');
    this.tabCompletedText = document.getElementById('tabCompletedText');
    this.countAll = document.getElementById('countAll');
    this.countPending = document.getElementById('countPending');
    this.countCompleted = document.getElementById('countCompleted');

    this.searchToggleBtn = document.getElementById('searchToggleBtn');
    this.searchInput = document.getElementById('searchInput');

    // List & Empty State
    this.taskList = document.getElementById('taskList');
    this.emptyBox = document.getElementById('emptyBox');
    this.emptyTitle = document.getElementById('emptyTitle');
    this.emptyDesc = document.getElementById('emptyDesc');

    // Footer & Settings
    this.remainingSummary = document.getElementById('remainingSummary');
    this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
    this.openSettingsBtn = document.getElementById('openSettingsBtn');

    // Settings Modal
    this.settingsModal = document.getElementById('settingsModal');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.settingsTitle = document.getElementById('settingsTitle');
    this.labelTheme = document.getElementById('labelTheme');
    this.labelLanguage = document.getElementById('labelLanguage');
    this.labelSound = document.getElementById('labelSound');
    this.btnThemeDark = document.getElementById('btnThemeDark');
    this.btnThemeLight = document.getElementById('btnThemeLight');
    this.btnThemeAuto = document.getElementById('btnThemeAuto');
    this.btnLangRu = document.getElementById('btnLangRu');
    this.btnLangEn = document.getElementById('btnLangEn');
    this.btnSoundOn = document.getElementById('btnSoundOn');
    this.btnSoundOff = document.getElementById('btnSoundOff');

    // Toast
    this.toastWrap = document.getElementById('toastWrap');

    // Guide Modal
    this.guideModal = document.getElementById('guideModal');
    this.closeGuideBtn = document.getElementById('closeGuideBtn');
    this.guidePrevBtn = document.getElementById('guidePrevBtn');
    this.guideNextBtn = document.getElementById('guideNextBtn');
    this.guideStepCounter = document.getElementById('guideStepCounter');
    this.progressDots = document.querySelectorAll('.progress-dot');
    this.guideSlides = document.querySelectorAll('.guide-slide');

    // Guide Demo
    this.simDemoCheckbox = document.getElementById('simDemoCheckbox');
    this.simDemoText = document.getElementById('simDemoText');
  }

  bindEvents() {
    // Add task
    this.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Urgent Flag toggle in creator
    this.flagToggleBtn.addEventListener('click', () => {
      this.isUrgentSelected = !this.isUrgentSelected;
      this.flagToggleBtn.classList.toggle('active', this.isUrgentSelected);
      sound.playCheck();
    });

    // Date Popover controls
    this.dateChipBtn.addEventListener('click', (e) => {
      if (e.target === this.dateClearBtn) {
        this.clearDate();
        return;
      }
      this.datePopover.classList.toggle('open');
    });

    this.presetToday.addEventListener('click', () => {
      this.setDate(this.getTodayISO());
    });

    this.presetTomorrow.addEventListener('click', () => {
      this.setDate(this.getTomorrowISO());
    });

    this.presetWeek.addEventListener('click', () => {
      this.setDate(this.getOffsetISO(7));
    });

    this.dateCustomInput.addEventListener('change', (e) => {
      if (e.target.value) {
        this.setDate(e.target.value);
      }
    });

    // Close date popover on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.date-selector-container')) {
        this.datePopover.classList.remove('open');
      }
    });

    // Single Magnifying Glass Search Toggle
    this.searchToggleBtn.addEventListener('click', () => {
      const isOpen = this.searchInput.classList.toggle('open');
      this.searchToggleBtn.classList.toggle('active', isOpen);
      if (isOpen) {
        this.searchInput.focus();
      } else {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.render();
      }
    });

    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.render();
    });

    this.searchInput.addEventListener('blur', () => {
      if (!this.searchInput.value.trim()) {
        this.searchInput.classList.remove('open');
        this.searchToggleBtn.classList.remove('active');
      }
    });

    // Sound Toggles
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.updateSoundIcon(isMuted);
    });

    this.btnSoundOn.addEventListener('click', () => {
      if (sound.isMuted()) sound.toggleMute();
      this.updateSoundIcon(false);
    });

    this.btnSoundOff.addEventListener('click', () => {
      if (!sound.isMuted()) sound.toggleMute();
      this.updateSoundIcon(true);
    });

    // Filter tabs
    this.tabAll.addEventListener('click', () => this.setFilter('all'));
    this.tabPending.addEventListener('click', () => this.setFilter('pending'));
    this.tabCompleted.addEventListener('click', () => this.setFilter('completed'));

    // Clear completed
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

    // Task list delegation
    this.taskList.addEventListener('click', (e) => this.handleListClick(e));
    this.taskList.addEventListener('dblclick', (e) => this.handleListDblClick(e));

    // Settings Modal
    this.openSettingsBtn.addEventListener('click', () => this.openSettings());
    this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });

    // Theme Switchers
    this.btnThemeDark.addEventListener('click', () => this.applyTheme('dark'));
    this.btnThemeLight.addEventListener('click', () => this.applyTheme('light'));
    this.btnThemeAuto.addEventListener('click', () => this.applyTheme('auto'));

    // Language Switchers
    this.btnLangRu.addEventListener('click', () => this.setLanguage('ru'));
    this.btnLangEn.addEventListener('click', () => this.setLanguage('en'));

    // Global keyboard handling
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea';

      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          this.taskInput.focus();
        } else if (e.key === '/') {
          e.preventDefault();
          this.searchInput.classList.add('open');
          this.searchToggleBtn.classList.add('active');
          this.searchInput.focus();
        } else if (e.key === '1') {
          e.preventDefault();
          this.setFilter('all');
        } else if (e.key === '2') {
          e.preventDefault();
          this.setFilter('pending');
        } else if (e.key === '3') {
          e.preventDefault();
          this.setFilter('completed');
        } else if (e.key === '?') {
          e.preventDefault();
          this.openGuide(0);
        }
      }

      if (e.key === 'Escape') {
        if (this.settingsModal.classList.contains('open')) {
          this.closeSettings();
        } else if (this.guideModal.classList.contains('open')) {
          this.closeGuide();
        } else if (this.datePopover.classList.contains('open')) {
          this.datePopover.classList.remove('open');
        } else if (this.editingId) {
          this.editingId = null;
          this.render();
        } else if (isInput) {
          document.activeElement.blur();
        }
      }
    });

    // Guide Navigation
    this.openGuideBtn.addEventListener('click', () => this.openGuide(0));
    this.closeGuideBtn.addEventListener('click', () => this.closeGuide());
    this.guideModal.addEventListener('click', (e) => {
      if (e.target === this.guideModal) this.closeGuide();
    });

    this.guidePrevBtn.addEventListener('click', () => {
      if (this.currentGuideStep > 0) this.setGuideStep(this.currentGuideStep - 1);
    });

    this.guideNextBtn.addEventListener('click', () => {
      if (this.currentGuideStep < this.guideSlides.length - 1) {
        this.setGuideStep(this.currentGuideStep + 1);
      } else {
        this.closeGuide();
      }
    });

    this.progressDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step, 10);
        this.setGuideStep(step);
      });
    });

    // Interactive Demo in slide 2
    if (this.simDemoCheckbox && this.simDemoText) {
      this.simDemoCheckbox.addEventListener('click', () => {
        const isChecked = this.simDemoCheckbox.classList.toggle('checked');
        if (isChecked) {
          sound.playCheck();
          this.simDemoText.style.textDecoration = 'line-through';
          this.simDemoText.style.color = 'var(--text-secondary)';
        } else {
          sound.playUncheck();
          this.simDemoText.style.textDecoration = 'none';
          this.simDemoText.style.color = 'var(--text-bright)';
        }
      });
    }
  }

  // --- Theme Controller ---
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('todo_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    this.btnThemeDark.classList.toggle('active', theme === 'dark');
    this.btnThemeLight.classList.toggle('active', theme === 'light');
    this.btnThemeAuto.classList.toggle('active', theme === 'auto');
  }

  // --- I18n Controller ---
  setLanguage(lang) {
    i18n.setLang(lang);
    this.applyI18n();
    this.render();
    sound.playCheck();
  }

  applyI18n() {
    const curLang = i18n.getLang();
    this.btnLangRu.classList.toggle('active', curLang === 'ru');
    this.btnLangEn.classList.toggle('active', curLang === 'en');

    // Text translations
    this.siteTitle.textContent = i18n.t('appTitle');
    this.guideBtnText.textContent = i18n.t('guide');
    this.taskInput.placeholder = i18n.t('inputPlaceholder');
    this.addBtnText.textContent = i18n.t('addBtn');
    this.urgentChipText.textContent = i18n.t('urgent');
    this.tabAllText.textContent = i18n.t('tabAll');
    this.tabPendingText.textContent = i18n.t('tabPending');
    this.tabCompletedText.textContent = i18n.t('tabCompleted');
    this.searchInput.placeholder = i18n.t('searchPlaceholder');
    this.emptyTitle.textContent = i18n.t('emptyTitle');
    this.clearCompletedBtn.textContent = i18n.t('clearCompleted');

    // Date Popover texts
    this.presetToday.textContent = i18n.t('dateToday');
    this.presetTomorrow.textContent = i18n.t('dateTomorrow');
    this.presetWeek.textContent = curLang === 'ru' ? 'Через неделю' : 'In a week';

    // Settings Modal
    this.settingsTitle.textContent = i18n.t('settingsTitle');
    this.labelTheme.textContent = i18n.t('themeLabel');
    this.btnThemeDark.textContent = i18n.t('themeDark');
    this.btnThemeLight.textContent = i18n.t('themeLight');
    this.btnThemeAuto.textContent = i18n.t('themeAuto');
    this.labelLanguage.textContent = i18n.t('languageLabel');
    this.labelSound.textContent = i18n.t('soundLabel');
    this.btnSoundOn.textContent = i18n.t('soundOn');
    this.btnSoundOff.textContent = i18n.t('soundOff');

    // Category options
    this.updateCategoryOptions();
    this.updateDateChipLabel();
  }

  updateCategoryOptions() {
    const curLang = i18n.getLang();
    const isRu = curLang === 'ru';
    this.categorySelect.options[0].text = isRu ? 'Категория' : 'Category';
    this.categorySelect.options[1].text = isRu ? 'Работа' : 'Work';
    this.categorySelect.options[2].text = isRu ? 'Личное' : 'Personal';
    this.categorySelect.options[3].text = isRu ? 'Проект' : 'Project';
    this.categorySelect.options[4].text = isRu ? 'Учеба' : 'Study';
  }

  // --- Date Helpers ---
  getTodayISO() {
    return new Date().toISOString().split('T')[0];
  }

  getTomorrowISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  getOffsetISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  setDate(isoStr) {
    this.selectedDate = isoStr;
    this.datePopover.classList.remove('open');
    this.updateDateChipLabel();
    sound.playCheck();
  }

  clearDate() {
    this.selectedDate = null;
    this.dateCustomInput.value = '';
    this.updateDateChipLabel();
  }

  updateDateChipLabel() {
    if (!this.selectedDate) {
      this.dateChipLabel.textContent = i18n.t('dueDate');
      this.dateChipBtn.classList.remove('has-date');
      this.dateClearBtn.style.display = 'none';
      return;
    }

    const todayISO = this.getTodayISO();
    const tomorrowISO = this.getTomorrowISO();

    if (this.selectedDate === todayISO) {
      this.dateChipLabel.textContent = i18n.t('dateToday');
    } else if (this.selectedDate === tomorrowISO) {
      this.dateChipLabel.textContent = i18n.t('dateTomorrow');
    } else {
      this.dateChipLabel.textContent = this.formatDate(this.selectedDate);
    }

    this.dateChipBtn.classList.add('has-date');
    this.dateClearBtn.style.display = 'inline-block';
  }

  // --- Settings Controller ---
  openSettings() {
    this.settingsModal.classList.add('open');
  }

  closeSettings() {
    this.settingsModal.classList.remove('open');
  }

  // --- Sound Controller ---
  initSoundUI() {
    this.updateSoundIcon(sound.isMuted());
  }

  updateSoundIcon(isMuted) {
    if (this.soundIconOn && this.soundIconOff) {
      this.soundIconOn.style.display = isMuted ? 'none' : 'block';
      this.soundIconOff.style.display = isMuted ? 'block' : 'none';
    }
    this.btnSoundOn.classList.toggle('active', !isMuted);
    this.btnSoundOff.classList.toggle('active', isMuted);
  }

  // --- Guide Controller ---
  initGuide() {
    const seen = localStorage.getItem('todo_guide_seen');
    if (!seen) {
      setTimeout(() => {
        this.openGuide(0);
        localStorage.setItem('todo_guide_seen', 'true');
      }, 400);
    }
  }

  openGuide(step = 0) {
    this.setGuideStep(step);
    this.guideModal.classList.add('open');
  }

  closeGuide() {
    this.guideModal.classList.remove('open');
  }

  setGuideStep(step) {
    this.currentGuideStep = step;
    const total = this.guideSlides.length;

    this.guideSlides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === step);
    });

    this.progressDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx <= step);
    });

    this.guideStepCounter.textContent = i18n.t('stepCounter', step + 1, total);
    this.guidePrevBtn.style.display = step > 0 ? 'inline-flex' : 'none';
    this.guidePrevBtn.textContent = i18n.t('guidePrev');
    this.guideNextBtn.textContent = step === total - 1 ? i18n.t('guideDone') : i18n.t('guideNext');
  }

  // --- Task CRUD & Rendering ---
  addTask() {
    const title = this.taskInput.value.trim();
    if (!title) return;

    const newTask = {
      id: 't-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      title: title,
      completed: false,
      urgent: this.isUrgentSelected,
      category: this.categorySelect.value !== 'none' ? this.categorySelect.value : null,
      dueDate: this.selectedDate || null,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    this.save();
    this.render();

    sound.playAdd();

    // Reset inputs
    this.taskInput.value = '';
    this.categorySelect.value = 'none';
    this.clearDate();
    this.isUrgentSelected = false;
    this.flagToggleBtn.classList.remove('active');
    this.taskInput.focus();
  }

  handleListClick(e) {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;

    // Checkbox toggle
    if (target.classList.contains('checkbox-native')) {
      this.toggleTask(taskId);
      return;
    }

    // Delete
    if (target.closest('.btn-delete')) {
      this.deleteTask(taskId);
      return;
    }

    // Edit
    if (target.closest('.btn-edit')) {
      this.startEditing(taskId);
      return;
    }
  }

  handleListDblClick(e) {
    const taskItem = e.target.closest('.task-item');
    if (taskItem && !e.target.closest('button') && !e.target.closest('.checkbox-wrap')) {
      this.startEditing(taskItem.dataset.id);
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      sound.playCheck();
    } else {
      sound.playUncheck();
    }

    this.save();
    this.render();
  }

  deleteTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    const [deleted] = this.tasks.splice(index, 1);
    this.lastDeleted = { task: deleted, index: index };

    sound.playDelete();
    this.save();
    this.render();

    this.showToast(i18n.t('taskDeleted'), () => {
      this.undoDelete();
    });
  }

  undoDelete() {
    if (!this.lastDeleted) return;
    this.tasks.splice(this.lastDeleted.index, 0, this.lastDeleted.task);
    this.lastDeleted = null;
    sound.playAdd();
    this.save();
    this.render();
  }

  startEditing(taskId) {
    this.editingId = taskId;
    this.render();

    const input = this.taskList.querySelector(`[data-id="${taskId}"] .edit-input`);
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);

      const finishEdit = () => {
        const val = input.value.trim();
        if (val) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) task.title = val;
          this.save();
        }
        this.editingId = null;
        this.render();
      };

      input.addEventListener('blur', finishEdit, { once: true });
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') input.blur();
        if (ev.key === 'Escape') {
          this.editingId = null;
          this.render();
        }
      });
    }
  }

  clearCompleted() {
    const hasCompleted = this.tasks.some(t => t.completed);
    if (!hasCompleted) return;

    this.tasks = this.tasks.filter(t => !t.completed);
    sound.playDelete();
    this.save();
    this.render();
  }

  setFilter(filter) {
    this.filter = filter;
    this.render();
  }

  save() {
    Storage.save(this.tasks);
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      if (this.filter === 'pending' && task.completed) return false;
      if (this.filter === 'completed' && !task.completed) return false;

      if (this.searchQuery) {
        const titleMatch = task.title.toLowerCase().includes(this.searchQuery);
        const catMatch = task.category && task.category.toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !catMatch) return false;
      }

      return true;
    });
  }

  render() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Counters
    this.countAll.textContent = total;
    this.countPending.textContent = pending;
    this.countCompleted.textContent = completed;
    this.remainingSummary.textContent = `${i18n.t('remaining')} ${pending}`;

    // Tabs
    this.tabAll.classList.toggle('active', this.filter === 'all');
    this.tabPending.classList.toggle('active', this.filter === 'pending');
    this.tabCompleted.classList.toggle('active', this.filter === 'completed');

    this.tabAll.setAttribute('aria-selected', this.filter === 'all');
    this.tabPending.setAttribute('aria-selected', this.filter === 'pending');
    this.tabCompleted.setAttribute('aria-selected', this.filter === 'completed');

    this.clearCompletedBtn.style.visibility = completed > 0 ? 'visible' : 'hidden';

    // List rendering
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      this.taskList.style.display = 'none';
      this.emptyBox.style.display = 'flex';
      if (this.searchQuery) {
        this.emptyDesc.textContent = i18n.t('searchEmptyDesc');
      } else if (this.filter === 'completed') {
        this.emptyDesc.textContent = i18n.t('completedEmptyDesc');
      } else if (this.filter === 'pending') {
        this.emptyDesc.textContent = i18n.t('pendingEmptyDesc');
      } else {
        this.emptyDesc.textContent = i18n.t('emptyDesc');
      }
    } else {
      this.taskList.style.display = 'flex';
      this.emptyBox.style.display = 'none';
      this.taskList.innerHTML = filtered.map(task => this.renderTask(task)).join('');
    }
  }

  renderTask(task) {
    const isEditing = this.editingId === task.id;

    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="checkbox-wrap">
          <input type="checkbox" class="checkbox-native" ${task.completed ? 'checked' : ''} aria-label="Toggle completed">
          <div class="checkbox-custom">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7.5L5.5 10L11 4"/>
            </svg>
          </div>
        </div>

        <div class="task-main">
          ${isEditing ? `
            <input type="text" class="edit-input" value="${this.escapeHTML(task.title)}">
          ` : `
            <div class="task-title-row">
              <span class="task-title">${this.escapeHTML(task.title)}</span>
              ${task.urgent ? `
                <span class="flag-indicator" title="${i18n.t('urgent')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </span>
              ` : ''}
            </div>
          `}
          
          <div class="task-meta">
            ${task.category ? `
              <span class="tag-badge">
                ${this.escapeHTML(task.category)}
              </span>
            ` : ''}

            ${task.dueDate ? `
              <span class="tag-badge">
                <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                ${this.formatDate(task.dueDate)}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="task-actions">
          <button type="button" class="btn-icon-sm btn-edit" title="Edit (2x click)" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-icon-sm btn-delete delete" title="Delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const isRu = i18n.getLang() === 'ru';
      const monthsRu = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = isRu ? monthsRu[monthIdx] : monthsEn[monthIdx];
      return `${day} ${m || parts[1]}`;
    }
    return dateStr;
  }

  showToast(text, onUndo) {
    if (!this.toastWrap) return;
    this.toastWrap.innerHTML = '';

    const pill = document.createElement('div');
    pill.className = 'toast-pill';
    pill.innerHTML = `
      <span>${text}</span>
      ${onUndo ? `<button type="button" class="btn-toast-undo">${i18n.t('undo')}</button>` : ''}
    `;

    if (onUndo) {
      pill.querySelector('.btn-toast-undo').addEventListener('click', () => {
        onUndo();
        pill.remove();
      });
    }

    this.toastWrap.appendChild(pill);
    setTimeout(() => {
      if (pill.parentNode) pill.remove();
    }, 4000);
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.todoApp = new TodoApp();
});
