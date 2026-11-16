/**
 * MINIMALIST I18N MODULE
 * Seamless Russian & English dictionary and reactive switcher
 */

export const translations = {
  ru: {
    appTitle: 'Задачи',
    inputPlaceholder: 'Что нужно сделать?',
    addBtn: 'Добавить',
    category: 'Категория',
    catNone: 'Категория',
    catWork: 'Работа',
    catPersonal: 'Личное',
    catProject: 'Проект',
    catStudy: 'Учеба',
    dueDate: 'Срок',
    dateToday: 'Сегодня',
    dateTomorrow: 'Завтра',
    dateCustom: 'Календарь',
    clearDate: 'Сбросить срок',
    urgent: 'Важно',
    tabAll: 'Все',
    tabPending: 'Активные',
    tabCompleted: 'Завершенные',
    searchPlaceholder: 'Поиск...',
    emptyTitle: 'Задач пока нет',
    emptyDesc: 'Нажмите N или начните вводить задачу выше',
    searchEmptyDesc: 'По вашему запросу ничего не найдено',
    completedEmptyDesc: 'Нет выполненных задач',
    pendingEmptyDesc: 'Все задачи выполнены',
    remaining: 'Осталось задач:',
    clearCompleted: 'Очистить завершенные',
    taskDeleted: 'Задача удалена',
    undo: 'Отменить',
    guide: 'Инструкция',
    settingsTitle: 'Настройки',
    themeLabel: 'Тема оформления',
    themeDark: 'Тёмная',
    themeLight: 'Светлая',
    themeAuto: 'Системная',
    languageLabel: 'Язык интерфейса',
    soundLabel: 'Звуковые эффекты',
    soundOn: 'Вкл',
    soundOff: 'Выкл',
    guideTitle: 'Руководство',
    guideStep1Title: '1. Быстрое добавление задач',
    guideStep1Desc: 'Введите текст и нажмите Enter. Опционально выберите категорию, срок или отметьте задачу флажком «Важно».',
    guideStep2Title: '2. Тактильное выполнение и правки',
    guideStep2Desc: 'Кликните по чекбоксу для завершения задачи с приятным звуком. Дважды кликните по тексту для мгновенного редактирования.',
    guideStep3Title: '3. Горячие клавиши и навигация',
    guideStep3Desc: 'Управляйте списком мгновенно прямо с клавиатуры: N — новая задача, 1 / 2 / 3 — фильтры, Esc — отмена.',
    guideStep4Title: '4. Безопасное удаление с отменой',
    guideStep4Desc: 'Случайно удалили задачу? Всплывающее уведомление позволяет в один клик отменить действие («Отменить»).',
    guideClose: 'Закрыть',
    guideNext: 'Далее',
    guidePrev: 'Назад',
    guideDone: 'Понятно, начать работу',
    stepCounter: (s, t) => `Шаг ${s} из ${t}`
  },
  en: {
    appTitle: 'Tasks',
    inputPlaceholder: 'What needs to be done?',
    addBtn: 'Add',
    category: 'Category',
    catNone: 'Category',
    catWork: 'Work',
    catPersonal: 'Personal',
    catProject: 'Project',
    catStudy: 'Study',
    dueDate: 'Due date',
    dateToday: 'Today',
    dateTomorrow: 'Tomorrow',
    dateCustom: 'Calendar',
    clearDate: 'Clear date',
    urgent: 'Urgent',
    tabAll: 'All',
    tabPending: 'Active',
    tabCompleted: 'Completed',
    searchPlaceholder: 'Search...',
    emptyTitle: 'No tasks yet',
    emptyDesc: 'Press N or start typing a task above',
    searchEmptyDesc: 'No tasks found matching your search',
    completedEmptyDesc: 'No completed tasks',
    pendingEmptyDesc: 'All tasks completed',
    remaining: 'Tasks remaining:',
    clearCompleted: 'Clear completed',
    taskDeleted: 'Task deleted',
    undo: 'Undo',
    guide: 'Guide',
    settingsTitle: 'Settings',
    themeLabel: 'Appearance',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeAuto: 'System',
    languageLabel: 'Language',
    soundLabel: 'Sound effects',
    soundOn: 'On',
    soundOff: 'Off',
    guideTitle: 'Quick Guide',
    guideStep1Title: '1. Fast task creation',
    guideStep1Desc: 'Type a task and hit Enter. Optionally pick a category, due date or mark as Urgent.',
    guideStep2Title: '2. Completion & inline edit',
    guideStep2Desc: 'Click the checkbox to complete with tactile sound. Double click title to edit directly.',
    guideStep3Title: '3. Shortcuts & Navigation',
    guideStep3Desc: 'Keyboard friendly: N for new task, 1 / 2 / 3 for filters, Esc to blur/close.',
    guideStep4Title: '4. Safe deletion with Undo',
    guideStep4Desc: 'Deleted by mistake? Instant toast notification lets you undo with one click.',
    guideClose: 'Close',
    guideNext: 'Next',
    guidePrev: 'Back',
    guideDone: 'Got it, let’s go',
    stepCounter: (s, t) => `Step ${s} of ${t}`
  }
};

class I18n {
  constructor() {
    this.lang = localStorage.getItem('todo_lang') || 'ru';
    if (!translations[this.lang]) this.lang = 'ru';
  }

  getLang() {
    return this.lang;
  }

  setLang(newLang) {
    if (translations[newLang]) {
      this.lang = newLang;
      localStorage.setItem('todo_lang', newLang);
      document.documentElement.lang = newLang;
    }
  }

  t(key, ...args) {
    const dict = translations[this.lang] || translations.ru;
    const val = dict[key];
    if (typeof val === 'function') {
      return val(...args);
    }
    return val !== undefined ? val : (translations.ru[key] || key);
  }
}

export const i18n = new I18n();
