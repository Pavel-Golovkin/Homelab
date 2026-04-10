/*
Пишем в ООП стиле на классах. Весь функционал упакован в один класс Todo.
Это позволяет инкапсулировать логику, данные и работу с DOM в одном месте, не засоряя
глобальную область видимости.
*/

/*
В самом начале класса объявлены два объекта и одна строка. Служат для хранения
настроект и констант, чтобы их было легко менять в одном месте.
*/

class Todo {
  // Объект хранит CSS-селекторы, для всех элементов интерфейса. Обращаемся через даты атрибуты
  selectors = {
    root: '[data-js-todo]',
    newTaskForm: '[data-js-todo-new-task-form]',
    newTaskInput: '[data-js-todo-new-task-input]',
    searchTaskForm: '[data-js-todo-search-task-form]',
    searchTaskInput: '[data-js-todo-search-task-input]',
    totalTasks: '[data-js-todo-total-tasks]',
    deleteAllButton: '[data-js-todo-delete-all-button]',
    list: '[data-js-todo-list]',
    item: '[data-js-todo-item]',
    itemCheckbox: '[data-js-todo-item-checkbox]',
    itemLabel: '[data-js-todo-item-label]',
    itemDeleteButton: '[data-js-todo-item-delete-button]',
    emptyMessage: '[data-js-todo-empty-message]',
  }

  // Объект хранит имена CSS-классов, которые отвечают за состояние.
  stateClasses = {
    isVisible: 'is-visible',
    isDisappearing: 'is-disappearing',
  }

  // По ней будем получать и сохранять данные из браузерного локального хранилища.
  localStorageKey = 'todo-items'

  /*
  Обязательный метод для класса. Код в нем автоматически выполняется при создании нового
  объекта ew Todo().
  */
  constructor() {
    // Здесь мы находим все нужные HTML-лементы и сохраняем ссылки на них в свойствах объекта.
    // Это нужно, чтобы потом не искать их заново, а просто использовать готовые переменные.
    this.rootElement = document.querySelector(this.selectors.root)
    this.newTaskFormElement = this.rootElement.querySelector(this.selectors.newTaskForm)
    this.newTaskInputElement = this.rootElement.querySelector(this.selectors.newTaskInput)
    this.searchTaskFormElement = this.rootElement.querySelector(this.selectors.searchTaskForm)
    this.searchTaskInputElement = this.rootElement.querySelector(this.selectors.searchTaskInput)
    this.totalTasksElement = this.rootElement.querySelector(this.selectors.totalTasks)
    this.deleteAllButtonElement = this.rootElement.querySelector(this.selectors.deleteAllButton)
    this.listElement = this.rootElement.querySelector(this.selectors.list)
    this.emptyMessageElement = this.rootElement.querySelector(this.selectors.emptyMessage)
    // Создаём бъект state для хранения текущего состояния приложения.
    this.state = {
      // Массив объектов данных (задач) для каждого элемента. Сразу при запуске
      // вызывается метод, чтобы загрузить старые задачи из браузера.
      items: this.getItemsFromLocalStorage(),
      // Используется для поиска. Сюда записывается отфильтрованный массив.
      filteredItems: null,
      // Текст, который ввёл пользователь в строку.
      searchQuery: '',
    }
    // Вызывается сразу, чтобы отобразить задачи, которые мы загрузили из памяти.
    this.render()
    // Реагируем на действия пользователя (клики, ввод текста)
    this.bindEvents()
  }


  /*
  Далее идут методы для работы с Local Storage. Методы отвечают за память приложения.
  */

  // Метод пытается достать данные по ключу из браузера.
  getItemsFromLocalStorage() {
    //Создаём переменную - сырые данные.
    const rawData = localStorage.getItem(this.localStorageKey)

    // Далее проверяем, если данных нет, то возвращаем пустой массив.
    if (!rawData) {
      return []
    }

    // Если данные есть, то пытаемся их распарсить из формата JSON в обычный JS массив.
    // Если JSON содержит ошибку, то выводим сообщение в консоль и возвращаем пустой массив,
    // чтобы приложение не сломалось.
    try {
      const parsedData = JSON.parse(rawData)
      return Array.isArray(parsedData) ? parsedData : []
    } catch {
      console.error('Todo items parse error')
      return []
    }
  }

  // Метод берет текущий массив задач, преобразует его в строку с помощью
  // JSON.stringify и сохраняет обратно в браузер под тем же ключом.
  saveItemsToLocalStorage() {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.state.items)
    )
  }


  /*
Далее идет метод работы с DOM (Отображение). Наиболее важный. Берет текущее состояние из
this.state и рисует его на экране.
*/


  render() {
    //Обновляет счетчик задач
    this.totalTasksElement.textContent = this.state.items.length

    // Показыват или скрывает кнопку "Удалить все" в зависимости от наличия задач.
    this.deleteAllButtonElement.classList.toggle(
      this.stateClasses.isVisible,
      this.state.items.length > 0
    )

    // Определяет, какой список рисовать: отфильтрованный или полный
    const items = this.state.filteredItems ?? this.state.items

    // Генерирует HTML-код для каждой задачи
    this.listElement.innerHTML = items.map(({ id, title, isChecked }) => `
      <li class="todo__item todo-item" data-js-todo-item>
      <input
        type="checkbox"
        class="todo-item__checkbox"
        id="${id}"
        ${isChecked ? 'checked' : ''}
        data-js-todo-item-checkbox
      >
      <label
        for="${id}"
        class="todo-item__label"
        data-js-todo-item-label
      >
        ${title}
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
    `).join('')

    const isEmptyFilteredItems = this.state.filteredItems?.length === 0
    const isEmptyItems = this.state.items.length === 0

    // Показывает сообщение, если массивы пустые
    this.emptyMessageElement.textContent =
      isEmptyFilteredItems ? 'Tasks not found'
        : isEmptyItems ? 'There are no tasks yet'
          : ''
  }


  /*
 Далее идут методы управления данными (бизнес-логика). Эти методы меняют состояние
 (this.state), но не трогают DOM напрямую.
 */

  // Метод принимает текст новой задачи. Создаёт объект задачи с уникальным id,
  // заголовком и статусом (не выполнено)
  addItem(title) {
    this.state.items.push({
      id: crypto?.randomUUID() ?? Date.now().toString(),
      title,
      isChecked: false,
    })

    this.saveItemsToLocalStorage() // Обновит данные в локальном хранилище
    this.render() // Обновит дом дерево
  }

  // Принимает id задачи, которую нужно удалить. Фильтрует массив this.state.items,
  // создавая новый массив без задачи с этим id.
  deleteItem(id) {
    this.state.items = this.state.items.filter((item) => item.id !== id)
    this.saveItemsToLocalStorage() // Обновит данные в локальном хранилище
    this.render() // Обновит дом дерево
  }

  // Меняет статус выполнения задачи на противоположный
  toggleCheckedState(id) {
    this.state.items = this.state.items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          isChecked: !item.isChecked,
        }
      }

      return item
    })
    this.saveItemsToLocalStorage() // Обновит данные в локальном хранилище
    this.render() // Обновит дом дерево
  }

  // Отвечает за поиск задач.
  filter() {
    const queryFormatted = this.state.searchQuery.toLowerCase()

    this.state.filteredItems = this.state.items.filter(({ title }) => {
      const titleFormatted = title.toLowerCase()

      return titleFormatted.includes(queryFormatted)
    })

    this.render()
  }

  // Сбрасывает поиск.
  resetFilter() {
    this.state.filteredItems = null
    this.state.searchQuery = ''
    this.render()
  }


  /*
Далее идут методы обработчики событий (Event Listeners). Методы реагируют
на действия пользователя. Используем стрелочные функции для сохранения контекста this.
Обычная функция потеряла бы связь с классом.
*/

  // Обрабатывает отправку формы добавления новой задачи
  onNewTaskFormSubmit = (event) => {
    event.preventDefault()

    const newTodoItemTitle = this.newTaskInputElement.value

    if (newTodoItemTitle.trim().length > 0) {
      this.addItem(newTodoItemTitle)
      this.resetFilter()
      this.newTaskInputElement.value = ''
      this.newTaskInputElement.focus()
    }
  }

  // Обрабатывает отправку формы при поиске
  onSearchTaskFormSubmit = (event) => {
    event.preventDefault()
  }

  // Реагирует на ввод текста в поисковую строку и вызывает фильтрацию
  onSearchTaskInputChange = ({ target }) => {
    const value = target.value.trim()

    if (value.length > 0) {
      this.state.searchQuery = value
      this.filter()
    } else {
      this.resetFilter()
    }
  }

  // Спрашивает подтверждение и очищает весь список
  onDeleteAllButtonClick = () => {
    const isConfirmed = confirm('Are you sure you want to delete all?')

    if (isConfirmed) {
      this.state.items = []
      this.saveItemsToLocalStorage()
      this.render()
    }
  }

  // Универсальны обработчик кликов по списку
  onClick = ({ target }) => {
    if (target.matches(this.selectors.itemDeleteButton)) {
      const itemElement = target.closest(this.selectors.item)
      const itemCheckboxElement = itemElement.querySelector(this.selectors.itemCheckbox)

      itemElement.classList.add(this.stateClasses.isDisappearing)

      setTimeout(() => {
        this.deleteItem(itemCheckboxElement.id)
      }, 400)
    }
  }

  // Универсальный обработчик изменений (для чекбоксов)
  onChange = ({ target }) => {
    if (target.matches(this.selectors.itemCheckbox)) {
      this.toggleCheckedState(target.id)
    }
  }

  // Метод берет и вешает обработчики событий на соответствующие элементы DOM
  bindEvents() {
    this.newTaskFormElement.addEventListener('submit', this.onNewTaskFormSubmit)
    this.searchTaskFormElement.addEventListener('submit', this.onSearchTaskFormSubmit)
    this.searchTaskInputElement.addEventListener('input', this.onSearchTaskInputChange)
    this.deleteAllButtonElement.addEventListener('click', this.onDeleteAllButtonClick)
    this.listElement.addEventListener('click', this.onClick)
    this.listElement.addEventListener('change', this.onChange)
  }
}

new Todo()