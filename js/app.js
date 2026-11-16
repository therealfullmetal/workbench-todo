/**
 * WORKBENCH TASK REGISTRY // CORE APPLICATION CONTROLLER
 * Compliant with Notion Workbench UI Design Standard
 */

import { Storage } from './storage.js';

class WorkbenchApp {
  constructor() {
    this.tasks = Storage.loadTasks();
    this.currentFilter = 'all'; // all | pending | completed
    this.categoryFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'date-desc';
    this.editingTaskId = null;
    this.lastDeletedTask = null;
    this.undoTimeout = null;

    this.cacheDOM();
    this.bindEvents();
    this.render();
  }

  cacheDOM() {
    // Form & Input
    this.taskForm = document.getElementById('taskForm');
    this.taskInput = document.getElementById('taskInput');
    this.prioritySelect = document.getElementById('prioritySelect');
    this.categorySelect = document.getElementById('categorySelect');
    this.dueDateInput = document.getElementById('dueDateInput');

    // Metrics
    this.metricTotal = document.getElementById('metricTotal');
    this.metricActive = document.getElementById('metricActive');
    this.metricCompleted = document.getElementById('metricCompleted');
    this.metricRate = document.getElementById('metricRate');
    this.metricBarFill = document.getElementById('metricBarFill');

    // Tabs & Filters
    this.tabAll = document.getElementById('tabAll');
    this.tabPending = document.getElementById('tabPending');
    this.tabCompleted = document.getElementById('tabCompleted');
    this.countAll = document.getElementById('countAll');
    this.countPending = document.getElementById('countPending');
    this.countCompleted = document.getElementById('countCompleted');

    this.filterCategory = document.getElementById('filterCategory');
    this.sortSelect = document.getElementById('sortSelect');
    this.searchInput = document.getElementById('searchInput');

    // List & Container
    this.taskList = document.getElementById('taskList');
    this.emptyState = document.getElementById('emptyState');

    // Batch Actions
    this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.importBtn = document.getElementById('importBtn');
    this.fileInput = document.getElementById('fileInput');
    this.resetBtn = document.getElementById('resetBtn');

    // Modal
    this.shortcutsModal = document.getElementById('shortcutsModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.openShortcutsBtn = document.getElementById('openShortcutsBtn');

    // Toast
    this.toastContainer = document.getElementById('toastContainer');
  }

  bindEvents() {
    // Add task
    this.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Filter tabs
    this.tabAll.addEventListener('click', () => this.setFilter('all'));
    this.tabPending.addEventListener('click', () => this.setFilter('pending'));
    this.tabCompleted.addEventListener('click', () => this.setFilter('completed'));

    // Category & Sort & Search
    this.filterCategory.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.render();
    });

    this.sortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.render();
    });

    // Batch & Utility actions
    if (this.clearCompletedBtn) {
      this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => Storage.exportJSON(this.tasks));
    }

    if (this.importBtn && this.fileInput) {
      this.importBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (confirm('Сбросить список к эталонным задачам Workbench?')) {
          this.tasks = Storage.resetToSeed();
          this.render();
          this.showToast('Данные сброшены к исходным');
        }
      });
    }

    // Modal
    if (this.openShortcutsBtn && this.shortcutsModal) {
      this.openShortcutsBtn.addEventListener('click', () => this.toggleModal(true));
      this.closeModalBtn.addEventListener('click', () => this.toggleModal(false));
      this.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.shortcutsModal) this.toggleModal(false);
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea';

      if (!isInput) {
        if (e.key === 'n' || e.key === 'N' || e.key === '/') {
          e.preventDefault();
          this.taskInput.focus();
        } else if (e.key === '?') {
          e.preventDefault();
          this.toggleModal(true);
        }
      }

      if (e.key === 'Escape') {
        if (this.shortcutsModal && this.shortcutsModal.classList.contains('open')) {
          this.toggleModal(false);
        } else if (isInput) {
          document.activeElement.blur();
        }
        if (this.editingTaskId) {
          this.editingTaskId = null;
          this.render();
        }
      }
    });

    // Task list event delegation (click, double click)
    this.taskList.addEventListener('click', (e) => this.handleListClick(e));
    this.taskList.addEventListener('dblclick', (e) => this.handleListDblClick(e));
  }

  handleAddTask() {
    const title = this.taskInput.value.trim();
    if (!title) return;

    const newTask = {
      id: 'task-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      title: title,
      completed: false,
      priority: this.prioritySelect.value,
      category: this.categorySelect.value,
      dueDate: this.dueDateInput.value || null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.tasks.unshift(newTask);
    this.save();
    this.render();

    this.taskInput.value = '';
    this.taskInput.focus();
    this.showToast(`Задача добавлена [${newTask.priority.toUpperCase()}]`);
  }

  handleListClick(e) {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;

    // Checkbox toggle
    if (target.classList.contains('task-checkbox-input')) {
      this.toggleTaskCompletion(taskId);
      return;
    }

    // Delete button
    if (target.closest('.btn-delete')) {
      this.deleteTask(taskId);
      return;
    }

    // Edit button
    if (target.closest('.btn-edit')) {
      this.startEditing(taskId);
      return;
    }
  }

  handleListDblClick(e) {
    const taskItem = e.target.closest('.task-item');
    if (taskItem && !e.target.closest('button') && !e.target.closest('.task-checkbox-wrap')) {
      const taskId = taskItem.dataset.id;
      this.startEditing(taskId);
    }
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    this.save();
    this.render();
  }

  deleteTask(taskId) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    const [deleted] = this.tasks.splice(index, 1);
    this.lastDeletedTask = { task: deleted, index: index };
    
    this.save();
    this.render();

    this.showUndoToast(`Удалено: "${this.escapeHTML(deleted.title)}"`, () => {
      this.undoDelete();
    });
  }

  undoDelete() {
    if (!this.lastDeletedTask) return;
    this.tasks.splice(this.lastDeletedTask.index, 0, this.lastDeletedTask.task);
    this.lastDeletedTask = null;
    this.save();
    this.render();
    this.showToast('Действие отменено');
  }

  startEditing(taskId) {
    this.editingTaskId = taskId;
    this.render();
    const editInput = this.taskList.querySelector(`[data-id="${taskId}"] .task-edit-input`);
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      
      const saveEdit = () => {
        const val = editInput.value.trim();
        if (val) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) task.title = val;
          this.save();
        }
        this.editingTaskId = null;
        this.render();
      };

      editInput.addEventListener('blur', saveEdit, { once: true });
      editInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          editInput.blur();
        } else if (ev.key === 'Escape') {
          this.editingTaskId = null;
          this.render();
        }
      });
    }
  }

  clearCompleted() {
    const count = this.tasks.filter(t => t.completed).length;
    if (count === 0) return;

    if (confirm(`Удалить выполненные задачи (${count})?`)) {
      this.tasks = this.tasks.filter(t => !t.completed);
      this.save();
      this.render();
      this.showToast(`Очищено ${count} выполненных задач`);
    }
  }

  async handleFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const imported = await Storage.importJSON(file);
      this.tasks = imported;
      this.save();
      this.render();
      this.showToast(`Импортировано задач: ${imported.length}`);
    } catch (err) {
      alert('Ошибка при импорте JSON: ' + err.message);
    } finally {
      this.fileInput.value = '';
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  save() {
    Storage.saveTasks(this.tasks);
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      // Status filter
      if (this.currentFilter === 'pending' && task.completed) return false;
      if (this.currentFilter === 'completed' && !task.completed) return false;

      // Category filter
      if (this.categoryFilter !== 'all' && task.category !== this.categoryFilter) return false;

      // Search query
      if (this.searchQuery) {
        const matchesTitle = task.title.toLowerCase().includes(this.searchQuery);
        const matchesCategory = task.category.toLowerCase().includes(this.searchQuery);
        const matchesPriority = task.priority.toLowerCase().includes(this.searchQuery);
        if (!matchesTitle && !matchesCategory && !matchesPriority) return false;
      }

      return true;
    }).sort((a, b) => {
      if (this.sortBy === 'date-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (this.sortBy === 'date-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (this.sortBy === 'priority') {
        const pOrder = { p1: 1, p2: 2, p3: 3 };
        return (pOrder[a.priority] || 4) - (pOrder[b.priority] || 4);
      }
      if (this.sortBy === 'alpha') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }

  render() {
    // 1. Update Metrics
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.metricTotal.textContent = total;
    this.metricActive.textContent = pending;
    this.metricCompleted.textContent = completed;
    this.metricRate.textContent = `${rate}%`;
    this.metricBarFill.style.width = `${rate}%`;

    // 2. Update Tab Counts & Active States
    this.countAll.textContent = total;
    this.countPending.textContent = pending;
    this.countCompleted.textContent = completed;

    this.tabAll.classList.toggle('active', this.currentFilter === 'all');
    this.tabPending.classList.toggle('active', this.currentFilter === 'pending');
    this.tabCompleted.classList.toggle('active', this.currentFilter === 'completed');

    // 3. Render List
    const filtered = this.getFilteredTasks();

    if (filtered.length === 0) {
      this.taskList.style.display = 'none';
      this.emptyState.style.display = 'flex';
      
      const emptySubtitle = this.emptyState.querySelector('.empty-subtitle');
      if (this.searchQuery) {
        emptySubtitle.textContent = `По запросу «${this.searchQuery}» ничего не найдено`;
      } else if (this.currentFilter === 'completed') {
        emptySubtitle.textContent = 'Нет выполненных задач';
      } else if (this.currentFilter === 'pending') {
        emptySubtitle.textContent = 'Все задачи выполнены!';
      } else {
        emptySubtitle.textContent = 'Добавьте первую задачу с помощью формы выше или нажмите N';
      }
    } else {
      this.taskList.style.display = 'flex';
      this.emptyState.style.display = 'none';

      this.taskList.innerHTML = filtered.map(task => this.renderTaskItem(task)).join('');
    }
  }

  renderTaskItem(task) {
    const isEditing = this.editingTaskId === task.id;
    const priorityLabel = task.priority ? task.priority.toUpperCase() : 'P2';
    const formattedDate = task.dueDate ? this.formatDate(task.dueDate) : null;
    const createdTime = this.formatRelativeTime(task.createdAt);

    return `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-checkbox-wrap">
          <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} aria-label="Отметить выполненной">
          <div class="task-checkbox-custom">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <div class="task-content">
          ${isEditing ? `
            <input type="text" class="task-edit-input" value="${this.escapeHTML(task.title)}">
          ` : `
            <div class="task-title" title="Двойной клик для редактирования">${this.escapeHTML(task.title)}</div>
          `}
          
          <div class="task-meta">
            <span class="meta-pill ${task.priority}">${priorityLabel}</span>
            <span class="meta-pill">${this.escapeHTML(task.category || 'General')}</span>
            ${formattedDate ? `<span class="meta-pill mono">📅 ${formattedDate}</span>` : ''}
            <span class="mono" style="color: var(--wb-text-faint);">${createdTime}</span>
          </div>
        </div>

        <div class="task-actions">
          <button type="button" class="btn-ghost btn-edit" title="Редактировать [Enter]" aria-label="Редактировать">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-danger-ghost btn-delete" title="Удалить задачу" aria-label="Удалить">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} д назад`;
  }

  toggleModal(isOpen) {
    if (this.shortcutsModal) {
      this.shortcutsModal.classList.toggle('open', isOpen);
    }
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  }

  showUndoToast(message, onUndo) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="toast-undo-btn">Вернуть [Undo]</button>
    `;
    const undoBtn = toast.querySelector('.toast-undo-btn');
    undoBtn.addEventListener('click', () => {
      onUndo();
      toast.remove();
    });

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }
    }, 4500);
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.workbenchApp = new WorkbenchApp();
});
