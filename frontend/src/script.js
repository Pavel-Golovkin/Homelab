// Адрес нашего бэкенда (для локального запуска через docker-compose)
const API_URL = 'http://localhost:3000/api/todos';

class TodoApp {
  constructor() {
    this.state = { items: [] };

    // Привязываем элементы DOM строго по твоим data-атрибутам и ID из HTML
    this.formAdd = document.querySelector('[data-js-todo-new-task-form]');
    this.inputAdd = document.querySelector('[data-js-todo-new-task-input]');

    this.formSearch = document.querySelector('[data-js-todo-search-task-form]');
    this.inputSearch = document.querySelector('[data-js-todo-search-task-input]');

    this.totalTasksEl = document.querySelector('[data-js-todo-total-tasks]');
    this.deleteAllBtn = document.querySelector('[data-js-todo-delete-all-button]');

    this.listEl = document.querySelector('[data-js-todo-list]');
    this.emptyMessageEl = document.querySelector('[data-js-todo-empty-message]');

    this.init();
  }

  async init() {
    await this.loadItems(); // Загружаем с сервера
    this.render();          // Отрисовываем
    this.bindEvents();      // Вешаем обработчики
  }

  // 1. ЗАМЕНА localStorage: Загрузка задач с бэкенда
  async loadItems() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      this.state.items = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Ошибка загрузки задач с сервера:', error);
      this.state.items = [];
    }
  }

  // 2. ЗАМЕНА localStorage: Добавление задачи через API
  async addItem(title) {
    if (!title.trim()) return;

    const newTodo = {
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title: title.trim(),
      is_checked: false,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });

      if (response.ok) {
        this.state.items.push(newTodo);
        this.inputAdd.value = ''; // Очищаем поле ввода
        this.render();
      }
    } catch (error) {
      console.error('Ошибка добавления задачи:', error);
    }
  }

  // 3. Обновление статуса (выполнено/нет) через API
  async toggleItem(id) {
    const item = this.state.items.find(i => i.id === id);
    if (!item) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_checked: !item.is_checked }),
      });

      if (response.ok) {
        item.is_checked = !item.is_checked;
        this.render();
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
    }
  }

  // 4. Удаление одной задачи через API
  async deleteItem(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        this.state.items = this.state.items.filter(i => i.id !== id);
        this.render();
      }
    } catch (error) {
      console.error('Ошибка удаления задачи:', error);
    }
  }

  // 5. Удаление всех задач (последовательно отправляем DELETE на сервер)
  async deleteAllItems() {
    if (!confirm('Вы уверены, что хотите удалить все задачи?')) return;

    // Создаем копию массива, чтобы безопасно удалять элементы во время итерации
    const itemsToDelete = [...this.state.items];
    for (const item of itemsToDelete) {
      await this.deleteItem(item.id);
    }
  }

  // 6. Отрисовка интерфейса (адаптирована под твой HTML)
  render(itemsToRender = this.state.items) {
    this.listEl.innerHTML = '';
    this.totalTasksEl.textContent = this.state.items.length;

    if (this.state.items.length === 0) {
      this.emptyMessageEl.style.display = 'block';
      this.emptyMessageEl.textContent = 'Список задач пуст. Добавьте новую задачу!';
    } else {
      this.emptyMessageEl.style.display = 'none';
    }

    itemsToRender.forEach(item => {
      const li = document.createElement('li');
      li.className = 'todo__item'; // Добавь этот класс в свой CSS для стилизации элемента списка

      // Чекбокс
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.is_checked;
      checkbox.addEventListener('change', () => this.toggleItem(item.id));

      // Текст задачи
      const span = document.createElement('span');
      span.textContent = item.title;
      if (item.is_checked) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.6';
      }

      // Кнопка удаления конкретной задачи
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Удалить';
      deleteBtn.className = 'todo__item-delete'; // Для стилизации в CSS
      deleteBtn.addEventListener('click', () => this.deleteItem(item.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      this.listEl.appendChild(li);
    });
  }

  // 7. Привязка событий к формам и кнопкам
  bindEvents() {
    // Добавление по отправке формы (работает и по клику, и по Enter)
    this.formAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addItem(this.inputAdd.value);
    });

    // Поиск (фильтрация на стороне клиента, так как бэкенд пока без поиска)
    this.formSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = this.state.items.filter(item =>
        item.title.toLowerCase().includes(query)
      );
      this.render(filtered);
    });

    // Удалить все
    this.deleteAllBtn.addEventListener('click', () => {
      this.deleteAllItems();
    });
  }
}

// Запуск приложения после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});