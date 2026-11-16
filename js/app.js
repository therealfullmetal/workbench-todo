/**
 * MINIMALIST TASK APP
 * Clean reactive controller with interactive onboarding, micro-haptics & intuitive UX
 */

import { Storage } from './storage.js';
import { sound } from './sound.js';

class TodoApp {
  constructor() {
    this.tasks = Storage.load();
    this.filter = 'all'; // all | pending | completed
    this.searchQuery = '';
    this.editingId = null;
    this.lastDeleted = null;
    this.isUrgentSelected = false;
    this.currentGuideStep = 0;

    this.cacheDOM();
    this.bindEvents();
    this.initSoundUI();
    this.initGuide();
    this.render();
  }

  cacheDOM() {
    // Header
    this.activeCountBadge = document.getElementById('activeCountBadge');
    this.openGuideBtn = document.getElementById('openGuideBtn');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIconOn = document.getElementById('soundIconOn');
    this.soundIconOff = document.getElementById('soundIconOff');

    // Form & Chips
    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.categorySelect = document.getElementById('categorySelect');
    this.dueDateInput = document.getElementById('dueDateInput');
    this.flagToggleBtn = document.getElementById('flagToggleBtn');

    // Filters & Search
    this.tabAll = document.getElementById('tabAll');
    this.tabPending = document.getElementById('tabPending');
    this.tabCompleted = document.getElementById('tabCompleted');
    this.countAll = document.getElementById('countAll');
    this.countPending = document.getElementById('countPending');
    this.countCompleted = document.getElementById('countCompleted');
    this.searchInput = document.getElementById('searchInput');

    // List & Empty State
    this.taskList = document.getElementById('taskList');
    this.emptyBox = document.getElementById('emptyBox');

    // Footer
    this.remainingSummary = document.getElementById('remainingSummary');
    this.clearCompletedBtn = document.getElementById('clearCompletedBtn');

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

    // Interactive demo elements
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

    // Sound Toggle
    this.soundToggleBtn.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      this.updateSoundIcon(isMuted);
    });

    // Filter tabs
    this.tabAll.addEventListener('click', () => this.setFilter('all'));
    this.tabPending.addEventListener('click', () => this.setFilter('pending'));
    this.tabCompleted.addEventListener('click', () => this.setFilter('completed'));

    // Search
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.render();
    });

    // Clear completed
    this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

    // Task list delegation
    this.taskList.addEventListener('click', (e) => this.handleListClick(e));
    this.taskList.addEventListener('dblclick', (e) => this.handleListDblClick(e));

    // Global keyboard handling
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea';

      if (!isInput) {
        if (e.key === 'n' || e.key === 'N' || e.key === '/') {
          e.preventDefault();
          this.taskInput.focus();
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
        if (this.guideModal && this.guideModal.classList.contains('open')) {
          this.closeGuide();
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

    // Progress dot navigation
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
          this.simDemoText.style.color = '#888892';
        } else {
          sound.playUncheck();
          this.simDemoText.style.textDecoration = 'none';
          this.simDemoText.style.color = '#f4f4f6';
        }
      });
    }
  }

  initSoundUI() {
    this.updateSoundIcon(sound.isMuted());
  }

  updateSoundIcon(isMuted) {
    if (this.soundIconOn && this.soundIconOff) {
      this.soundIconOn.style.display = isMuted ? 'none' : 'block';
      this.soundIconOff.style.display = isMuted ? 'block' : 'none';
    }
  }

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

    this.guideStepCounter.textContent = `Шаг ${step + 1} из ${total}`;
    this.guidePrevBtn.style.display = step > 0 ? 'inline-flex' : 'none';
    this.guideNextBtn.textContent = step === total - 1 ? 'Понятно, начать работу' : 'Далее';
  }

  addTask() {
    const title = this.taskInput.value.trim();
    if (!title) return;

    const newTask = {
      id: 't-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      title: title,
      completed: false,
      urgent: this.isUrgentSelected,
      category: this.categorySelect.value !== 'none' ? this.categorySelect.value : null,
      dueDate: this.dueDateInput.value || null,
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    this.save();
    this.render();

    sound.playAdd();

    // Reset inputs
    this.taskInput.value = '';
    this.categorySelect.value = 'none';
    this.dueDateInput.value = '';
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

    this.showToast('Задача удалена', () => {
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

    // Header & counters
    this.activeCountBadge.textContent = `${pending} активных`;
    this.countAll.textContent = total;
    this.countPending.textContent = pending;
    this.countCompleted.textContent = completed;
    this.remainingSummary.textContent = `Осталось задач: ${pending}`;

    // Tabs
    this.tabAll.classList.toggle('active', this.filter === 'all');
    this.tabPending.classList.toggle('active', this.filter === 'pending');
    this.tabCompleted.classList.toggle('active', this.filter === 'completed');

    this.tabAll.setAttribute('aria-selected', this.filter === 'all');
    this.tabPending.setAttribute('aria-selected', this.filter === 'pending');
    this.tabCompleted.setAttribute('aria-selected', this.filter === 'completed');

    // Clear completed button state
    this.clearCompletedBtn.style.visibility = completed > 0 ? 'visible' : 'hidden';

    // List rendering
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      this.taskList.style.display = 'none';
      this.emptyBox.style.display = 'flex';
      const emptyDesc = this.emptyBox.querySelector('.empty-desc');
      if (this.searchQuery) {
        emptyDesc.textContent = `По запросу «${this.searchQuery}» ничего не найдено`;
      } else if (this.filter === 'completed') {
        emptyDesc.textContent = 'Нет выполненных задач';
      } else if (this.filter === 'pending') {
        emptyDesc.textContent = 'Все задачи выполнены';
      } else {
        emptyDesc.textContent = 'Добавьте новую задачу с помощью поля выше';
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
          <input type="checkbox" class="checkbox-native" ${task.completed ? 'checked' : ''} aria-label="Отметить выполненной">
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
                <span class="flag-indicator" title="Важная задача">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
                <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                ${this.formatDate(task.dueDate)}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="task-actions">
          <button type="button" class="btn-icon btn-edit" title="Редактировать (или 2x клик)" aria-label="Редактировать">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-delete delete" title="Удалить" aria-label="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      const day = parts[2];
      const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      const monthIndex = parseInt(parts[1], 10) - 1;
      return `${parseInt(day, 10)} ${monthNames[monthIndex] || parts[1]}`;
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
      ${onUndo ? `<button type="button" class="btn-toast-undo">Отменить</button>` : ''}
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
