/**
 * MINIMALIST TASK STORAGE
 * LocalStorage management & persistence
 */

const STORAGE_KEY = 'minimal_tasks_v2';

const SEED_TASKS = [
  {
    id: 't-1',
    title: 'Подготовить отчет о разработке проекта',
    completed: true,
    priority: 'high',
    category: 'Работа',
    dueDate: '2026-11-16',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 't-2',
    title: 'Проверить отображение на мобильных устройствах',
    completed: false,
    priority: 'med',
    category: 'Проект',
    dueDate: '2026-11-17',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 't-3',
    title: 'Опубликовать репозиторий на GitHub',
    completed: false,
    priority: 'high',
    category: 'Работа',
    dueDate: '2026-11-16',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.save(SEED_TASKS);
        return SEED_TASKS;
      }
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : SEED_TASKS;
    } catch {
      return SEED_TASKS;
    }
  },

  save(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch {
      return false;
    }
  }
};
