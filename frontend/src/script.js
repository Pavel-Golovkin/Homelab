const API_URL = 'http://localhost:3000/api/todos';

class TodoApp {
  constructor() {
    this.state = { 
      items: [],
      searchQuery: ''
    };

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
    await this.loadItems(); 
    this.render();          
    this.bindEvents();      
  }

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
        this.inputAdd.value = '';
        this.state.searchQuery = ''; 
        this.inputSearch.value = '';
        this.render();
      }
    } catch (error) {
      console.error('Ошибка добавления задачи:', error);
    }
  }

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

  async deleteAllItems() {
    if (!confirm('Вы уверены, что хотите удалить все задачи?')) return;
    const itemsToDelete = [...this.state.items];
    for (const item of itemsToDelete) {
      await this.deleteItem(item.id);
    }
  }

  render() {
    const query = this.state.searchQuery.toLowerCase();
    const filteredItems = this.state.items.filter(item => 
      item.title.toLowerCase().includes(query)
    );

    this.totalTasksEl.textContent = this.state.items.length;

    if (this.deleteAllBtn) {
      this.deleteAllBtn.classList.toggle('is-visible', this.state.items.length > 0);
    }

    if (this.state.items.length === 0) {
      this.emptyMessageEl.textContent = 'There are no tasks yet';
      this.emptyMessageEl.style.display = 'block';
    } else if (filteredItems.length === 0) {
      this.emptyMessageEl.textContent = 'Tasks not found';
      this.emptyMessageEl.style.display = 'block';
    } else {
      this.emptyMessageEl.style.display = 'none';
    }

    this.listEl.innerHTML = filteredItems.map(item => `
      <li class="todo__item todo-item" data-js-todo-item>
        <input
          type="checkbox"
          class="todo-item__checkbox"
          id="${item.id}"
          ${item.is_checked ? 'checked' : ''}
          data-js-todo-item-checkbox
        >
        <label
          for="${item.id}"
          class="todo-item__label"
          data-js-todo-item-label
        >
          ${item.title}
        </label>
        <button
          class="todo-item__delete-button"
          aria-label="Delete"
          title="Delete"
          data-js-todo-item-delete-button
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </li>
    `).join('');
  }

  bindEvents() {
    this.formAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addItem(this.inputAdd.value);
    });

    this.inputSearch.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value;
      this.render();
    });

    this.listEl.addEventListener('change', (e) => {
      if (e.target.matches('[data-js-todo-item-checkbox]')) {
        this.toggleItem(e.target.id);
      }
    });

    this.listEl.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-js-todo-item-delete-button]');
      if (deleteBtn) {
        const itemEl = deleteBtn.closest('[data-js-todo-item]');
        const checkbox = itemEl.querySelector('[data-js-todo-item-checkbox]');
        
        itemEl.classList.add('is-disappearing');
        setTimeout(() => {
          this.deleteItem(checkbox.id);
        }, 400);
      }
    });

    this.deleteAllBtn.addEventListener('click', () => {
      this.deleteAllItems();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});