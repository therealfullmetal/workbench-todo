/**
 * WORKBENCH TASK REGISTRY — STORAGE MODULE
 * Handles localStorage persistence, JSON schema validation, backup/restore,
 * and realistic initial seed tasks.
 */

const STORAGE_KEY = 'workbench_tasks_v1';

const SEED_TASKS = [
  {
    id: 'task-101',
    title: 'Реализовать сохранение состояния в LocalStorage',
    completed: true,
    priority: 'p1',
    category: 'Engineering',
    dueDate: '2026-11-16',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'task-102',
    title: 'Сверить дизайн-токены с Notion (Quiet Workbench UI)',
    completed: true,
    priority: 'p1',
    category: 'Design',
    dueDate: '2026-11-16',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'task-103',
    title: 'Добавить фильтрацию по статусу, тегам и полнотекстовый поиск',
    completed: false,
    priority: 'p2',
    category: 'Engineering',
    dueDate: '2026-11-17',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: null
  },
  {
    id: 'task-104',
    title: 'Подготовить отчет об использовании AI-инструментов в разработке',
    completed: false,
    priority: 'p2',
    category: 'Research',
    dueDate: '2026-11-17',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: null
  },
  {
    id: 'task-105',
    title: 'Запустить локальный сервер и верифицировать отображение на localhost',
    completed: false,
    priority: 'p1',
    category: 'DevOps',
    dueDate: '2026-11-16',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    completedAt: null
  }
];

export const Storage = {
  loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveTasks(SEED_TASKS);
        return SEED_TASKS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return SEED_TASKS;
    } catch (err) {
      console.warn('Failed to parse tasks from localStorage, falling back to seed:', err);
      return SEED_TASKS;
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
      return false;
    }
  },

  resetToSeed() {
    this.saveTasks(SEED_TASKS);
    return SEED_TASKS;
  },

  exportJSON(tasks) {
    const payload = {
      app: 'Workbench Task Registry',
      version: '1.0.4',
      exportedAt: new Date().toISOString(),
      tasks: tasks
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `workbench_tasks_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          const importedTasks = Array.isArray(content) ? content : (content.tasks || []);
          if (!Array.isArray(importedTasks)) {
            throw new Error('Invalid JSON format: tasks array not found');
          }
          resolve(importedTasks);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};
