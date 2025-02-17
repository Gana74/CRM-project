const SERVER_URL = "http://localhost:3000";

async function serverAddClient(obj) {
  let respons = await fetch(SERVER_URL + "/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  });

  if (!respons.ok) {
    throw new Error("Failed to add client: " + respons.status);
  }

  let data = await respons.json();

  return data;
}

async function getClients(searchQuery = "") {
  const response = await fetch(
    `${SERVER_URL}/api/clients?search=${searchQuery}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch clients: " + response.status);
  }

  return response.json();
}

async function serverGetClient() {
  let respons = await fetch(SERVER_URL + "/api/clients", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!respons.ok) {
    throw new Error("Failed to get clients: " + respons.status);
  }

  let data = await respons.json();

  return data;
}

async function getClientById(id) {
  let respons = await fetch(SERVER_URL + "/api/clients/" + id, {
    method: "GET",
  });

  if (!respons.ok) {
    throw new Error("Failed to get client by id: " + respons.status);
  }

  let data = await respons.json();

  return data;
}

async function updateClient(obj, id) {
  try {
    let response = await fetch(`${SERVER_URL}/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(obj),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to update client: " + response.status);
    }
  } catch (error) {
    console.error("Не удалось обновить клиента:", error);
  }
}

async function serverDeleteClient(id) {
  let respons = await fetch(SERVER_URL + "/api/clients/" + id, {
    method: "DELETE",
  });

  // if (!respons.ok) {
  //   throw new Error("Failed to delete client: " + respons.status);
  // }

  let data = await respons.json();

  return data;
}

let serverData = await serverGetClient();

// --------------------------------------------------------------------------------------база данных
let clientList = [];

if (serverData) {
  clientList = serverData;
}

/*-------------------------------------------------------- подготовка--------------------------------------------------------------*/

let sortDirection = 1; // Переменная для отслеживания направления сортировки (1 - по возрастанию, -1 - по убыванию)
let sortColumn = "id"; //Переменная сортировки

//----------------------------------------------------------------------------------------- Функция для удаления клиента

// async function deleteClient(id) {
//   try {
//     // Вызываем функцию serverDeleteClient с ID клиента
//     await serverDeleteClient(id);
//     // Обновляем список клиентов после удаления
//     const updatedClientList = await serverGetClient();
//     render(updatedClientList);
//   } catch (error) {
//     console.error("Ошибка при удалении клиента:", error);
//   }
// }

//-----------------функция для  удаления эфект затемнения
function removeModalBackdrop() {
  const elementToRemove = document.querySelector(".modal-backdrop");
  if (elementToRemove) {
    elementToRemove.remove();
  }
}

//-------------------- Функция сравнения для дат
function compareDate(a, b) {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (dateA - dateB) * sortDirection;
}

//------------------- Функция сравнения для числовых значений
function compareNumeric(a, b) {
  return (parseInt(a) - parseInt(b)) * sortDirection;
}

//-------------------- Функция сравнения для строковых значений
function compareString(a, b) {
  return a.localeCompare(b) * sortDirection;
}

//---------------- Функция для форматирования даты
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, "0"); // Добавляем ведущий ноль, если день состоит из одной цифры
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Добавляем ведущий ноль, если месяц состоит из одной цифры
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

//-------------------функция преобразования времени

function formatTime(time) {
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

//-------------------- Функция для изменения направления сортировки

function toggleSortDirection(column) {
  if (column === sortColumn) {
    sortDirection *= -1; // Изменяем направление, если сортируемый столбец не изменился
  } else {
    sortColumn = column; // Изменяем сортируемый столбец
    sortDirection = 1; // Сбрасываем направление сортировки для нового столбца
  }
  render(clientList); // Перерисовываем таблицу с учетом нового направления сортировки

  //инициализация подсказки при изменении сортировки
  tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );
}

//----------------визуал модального окна
const tableBody = document.getElementById("listclient"),
  $addForm = document.getElementById("addForm"),
  $nameInp = document.getElementById("addFormNameInp"),
  $surnameInp = document.getElementById("addFormSurenameInp"),
  $lastnameInp = document.getElementById("addFormLastnameInp"),
  $contactsInp = document.getElementById("addFormContactInp");

//----------------------визуал модального окна изменить клиента
const updateForm = document.getElementById("updateForm"),
  $idUpdate = document.getElementById("modalId"),
  $nameInpUpdate = document.getElementById("updateFormNameInp"),
  $surnameInpUpdate = document.getElementById("updateFormSurenameInp"),
  $lastnameInpUpdate = document.getElementById("updateFormLastnameInp"),
  $contactsInpUpdate = document.getElementById("updateFormContactInp");

const filterForm = document.getElementById("filterForm");
const searchContact = document.getElementById("searchContact");
const spinner = document.querySelector(".spinner");

const btnModalDelet = document.getElementById("btnModalDelet");
const readyDeleteBtn = document.getElementById("readyDeleteBtn");
const readyCancelBtn = document.getElementById("readyCancelBtn");
//модальное окно удаления
const modalDeletClientId = document.getElementById("modalDeletClient");
//модальное окно изменения
const exampleModalUpdate = document.getElementById("exampleModalUpdate");
//модальное окно добавления
const exampleModal = document.getElementById("exampleModal");

/*----------------------------------------------------------------рендер   отрисовка-------------------------------------------------------------*/

function render(arrData) {
  let copyClientList = [...arrData]; // копия массива базы данных

  //--------------------------------------------------------------------- подготовка к отрисовки ФИО
  for (const oneUser of copyClientList) {
    oneUser.fio = oneUser.lastName + " " + oneUser.name + " " + oneUser.surname;
  }

  //------------------------------------------------------------------------ Функция сортировки
  copyClientList = copyClientList.sort(function (a, b) {
    if (sortColumn === "id") {
      return compareNumeric(a[sortColumn], b[sortColumn]);
    } else if (sortColumn === "fio") {
      return compareString(a[sortColumn], b[sortColumn]);
    } else if (sortColumn === "createdAt") {
      return compareDate(a[sortColumn], b[sortColumn]);
    } else if (sortColumn === "updatedAt") {
      return compareDate(a[sortColumn], b[sortColumn]);
    }
  });

  // фильтрация

  if (searchContact.value.trim() !== "") {
    let searchValue = searchContact.value.trim().toLowerCase(); // Приводим к нижнему регистру
    copyClientList = copyClientList.filter(function (oneUser) {
      if (oneUser.fio.toLowerCase().includes(searchValue)) return true; // Приводим к нижнему регистру
    });
  }

  // --------------------------------------------------------------------------создание визуала таблицы контактов

  tableBody.innerHTML = ""; // очистка предыдущего содержимого

  for (const oneUser of copyClientList) {
    // Скрываем спинер
    spinner.style.display = "none";

    //-------------Преобразование даты создания пользователя
    const dateCreated = new Date(oneUser.createdAt);
    const formattedDateCreate = formatDate(dateCreated);

    //---------------Преобразование даты обновления пользователя
    const dateUpdate = new Date(oneUser.updatedAt);
    const formattedDateUpdate = formatDate(dateUpdate);

    // --------------Преобразование времени создания пользователя

    const timeCreate = new Date(oneUser.createdAt);
    const formattedTimeCreate = formatTime(timeCreate);

    //---------------- Преобразование времени обнавления пользователя

    const timeUpdated = new Date(oneUser.updatedAt);
    const formattedTimeUpdate = formatTime(timeUpdated);

    //-----------------визуал таблицы

    const userTr = document.createElement("tr");
    userTr.classList.add("table__tr");

    const userID = document.createElement("td");
    userID.textContent = oneUser.id.slice(-6);
    userID.classList.add("table__id");

    const userFIO = document.createElement("td");
    userFIO.textContent = oneUser.fio;
    userFIO.classList.add("table__fio");

    const tableСreateСontainer = document.createElement("td");
    tableСreateСontainer.classList.add("table__create-container");

    const userCreateDate = document.createElement("td");
    userCreateDate.textContent = formattedDateCreate;
    userCreateDate.classList.add("table__create-date");

    const userCreateTime = document.createElement("td");
    userCreateTime.textContent = formattedTimeCreate;
    userCreateTime.classList.add("table__create-time");

    const tableUpdateСontainer = document.createElement("td");
    tableUpdateСontainer.classList.add("table__update-container");

    const userUpdateData = document.createElement("td");
    userUpdateData.textContent = formattedDateUpdate;
    userUpdateData.classList.add("table__update-date");

    const userUpdateTime = document.createElement("td");
    userUpdateTime.textContent = formattedTimeUpdate;
    userUpdateTime.classList.add("table__update-time");

    const userContact = document.createElement("td");
    userContact.classList.add("table__connection");

    const userAction = document.createElement("td");
    userAction.classList.add("table__th-action");

    // Добавляем дату и время создания в контейнер
    tableСreateСontainer.appendChild(userCreateDate);
    tableСreateСontainer.appendChild(userCreateTime);

    // Добавляем дату и время создания в контейнер
    tableUpdateСontainer.appendChild(userUpdateData);
    tableUpdateСontainer.appendChild(userUpdateTime);

    // ----------------------------------------------------------определение кнопки изменения

    const divChange = document.createElement("div");
    divChange.classList.add("table__div-change");

    const btnChange = document.createElement("button");
    btnChange.classList.add("btn-change", "btn");
    btnChange.textContent = "Изменить";
    btnChange.setAttribute("aria-label", "изменить клиента");

    divChange.appendChild(btnChange);

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------

    //---------------------------------------------- Обработчик события нажатия на кнопку "Изменить"

    btnChange.addEventListener("click", async function () {
      // Показываем иконку загрузки
      btnChange.style.backgroundImage = "url('./icons/loadupdate.svg')";

      // Устанавливаем задержку
      setTimeout(async () => {
        try {
          // Получаем данные клиента
          const clientData = await getClientById(oneUser.id);

          // Показываем модальное окно обновления
          const modal = new bootstrap.Modal(
            document.getElementById("exampleModalUpdate")
          );
          modal.show();
          // Показываем иконку
          btnChange.style.backgroundImage = "url('./icons/edit.svg')";

          //добавляем атрибут id клиента модальному окну удаления
          modalDeletClientId.setAttribute("data-client-id", clientData.id);

          // Заполняем форму модального окна обновления данными пользователя
          $nameInpUpdate.value = clientData.name;
          $surnameInpUpdate.value = clientData.surname;
          $lastnameInpUpdate.value = clientData.lastName;

          // Создаем элементы для контакта
          function getContactFormUpdate(type, value) {
            if (updateFormsContainer.childElementCount < maxUpdate) {
              const clonedFormUpdate = updateFormTemplate.cloneNode(true);
              clonedFormUpdate.removeAttribute("id");
              clonedFormUpdate.style.display = "block";
              clonedFormUpdate.classList.add("modal__update-clone");
              updateFormsContainer.appendChild(clonedFormUpdate);

              // Инициализируем Choices только внутри новой формы
              const choices = new Choices(
                clonedFormUpdate.querySelector(".modal__update-choice"),
                {
                  allowHTML: true,
                  searchEnabled: false,
                  itemSelectText: "",
                  position: "down",
                  allowHTML: true, // Разрешаем отображение HTML в опциях
                }
              );

              // Заполняем инпут значением, если оно передано
              if (value) {
                clonedFormUpdate.querySelector(".modal__update-value").value =
                  value;
              }

              // Вставляем значение в селект, если оно передано
              if (type) {
                choices.setChoiceByValue(type); // Установите значение по текстовому содержимому опции
              }

              addContactUpdateButtonVisibility();
            }
            // Функция для инициализации Tooltip
            tooltipTriggerList = document.querySelectorAll(
              '[data-bs-toggle="tooltip"]'
            );
            tooltipList = [...tooltipTriggerList].map(
              (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
            );
          }

          // Вызываем функцию с передачей значения в инпут и селект с небольшой задержкой
          setTimeout(() => {
            for (let i = 0; i < clientData.contacts.length; i++) {
              const contact = clientData.contacts[i];
              getContactFormUpdate(contact.type, contact.value);
            }
          }, 100);

          // Устанавливаем текст ID клиента в модальном окне
          $idUpdate.textContent = "ID: " + clientData.id;
        } catch (error) {
          console.error("Ошибка при получении данных клиента:", error);
          // Обработка ошибки, если необходимо
        }
      }, 500);

      // Закрываем модальное окно после успешного изменения
      exampleModalUpdate.style.display = "none";
      // убираем затемнение
      removeModalBackdrop();
    });

    // Показываем модальное окно подтверждения удаления
    btnModalDelet.addEventListener("click", () => {
      // убираем затемнение
      removeModalBackdrop();

      // Показываем модальное окно
      let modal = new bootstrap.Modal(
        document.getElementById("modalDeletClient")
      );
      modal.show();
    });

    // -------------------------------------------------------------------------------------определение кнопки удаления в таблице

    const divDelete = document.createElement("div");
    divDelete.classList.add("table__div-delete");

    const btnDelete = document.createElement("button");
    btnDelete.classList.add("btn-delete", "btn");
    btnDelete.textContent = "Удалить";
    // btnDelete.dataset.clientId = oneUser.id;
    btnDelete.setAttribute("aria-label", "удалить клиента");

    divDelete.appendChild(btnDelete);

    //-------------------------------------------------------------------------------------логика кнопки удаления в таблице

    // Показываем модальное окно подтверждения

    btnDelete.addEventListener("click", async function () {
      // Показываем иконку загрузки
      btnDelete.style.backgroundImage = "url('./icons/loadDelete.svg')";

      // Получаем данные клиента
      const clientData = await getClientById(oneUser.id);
      setTimeout(() => {
        // // Устанавливаем таймер на 3 секунды
        btnDelete.style.backgroundImage = "url('./icons/cancel.svg')";

        // Показываем модальное окно
        let modal = new bootstrap.Modal(
          document.getElementById("modalDeletClient")
        );
        modal.show();

        //добавляем атрибут id клиента модальному окну удаления
        modalDeletClientId.setAttribute("data-client-id", clientData.id);
      }, 500);
    });

    //-----------------------------------------------------------------------------логика кнопок   в модальном окне подтверждения удаления

    // Уничтожаем эфект затемнения  модалки "изменить" на кнопку "отмена" в окне "подтвержденния удаления"
    readyCancelBtn.addEventListener("click", () => {
      removeModalBackdrop();
    });

    // Логика кнопки подтвердить удаление
    readyDeleteBtn.addEventListener("click", function () {
      let deletID = modalDeletClientId.dataset.clientId;

      serverDeleteClient(deletID);

      // Закрываем модальное окно после успешного удаления
      modalDeletClientId.style.display = "none";
      // убираем затемнение
      removeModalBackdrop();
    });

    //----------------------------------------------------------------------------визуал контакта/тултип

    const maxVisibleContacts = 4; // Максимальное количество видимых контактов
    const hiddenContacts = oneUser.contacts.slice(maxVisibleContacts); // Список скрытых контактов

    for (let i = 0; i < oneUser.contacts.length; i++) {
      const contact = oneUser.contacts[i];
      const btnContact = document.createElement("button");
      btnContact.classList.add("table__contact");
      btnContact.setAttribute("data-bs-toggle", "tooltip");
      btnContact.setAttribute("data-bs-placement", "top");
      btnContact.setAttribute("data-bs-delay", '{"show": 300, "hide": 500}');
      btnContact.setAttribute("data-bs-offset", "0,10");

      switch (contact.type) {
        case "phone":
          btnContact.classList.add("table__phone");
          btnContact.setAttribute("data-bs-title", "Телефон: " + contact.value);
          btnContact.setAttribute("alt", "телефон клиента");
          btnContact.onclick = function () {
            location.href = "tel:" + contact.value;
          };
          break;
        case "fb":
          btnContact.classList.add("table__fb");
          btnContact.setAttribute("data-bs-html", "true");
          btnContact.setAttribute(
            "data-bs-title",
            `FaceBook: <a href="${contact.value}" target="_blank">${contact.value}</a>`
          );
          btnContact.setAttribute("alt", "FaceBook клиента");
          btnContact.onclick = function () {
            window.open(contact.value, "_blank");
          };
          break;
        case "tw":
          btnContact.classList.add("table__all");
          btnContact.setAttribute("data-bs-html", "true");
          btnContact.setAttribute(
            "data-bs-title",
            `Twitter: <a href="${contact.value}" target="_blank">${contact.value}</a>`
          );
          btnContact.setAttribute("alt", "Twitter клиента");
          btnContact.onclick = function () {
            window.open(contact.value, "_blank");
          };
          break;
        case "vk":
          btnContact.classList.add("table__vk");
          btnContact.setAttribute("data-bs-html", "true");
          btnContact.setAttribute(
            "data-bs-title",
            `VK: <a href="${contact.value}" target="_blank">${contact.value}</a>`
          );
          btnContact.setAttribute("alt", "вконтакте клиента");
          btnContact.onclick = function () {
            window.open(contact.value, "_blank");
          };
          break;
        case "phone2":
          btnContact.classList.add("table__phone");
          btnContact.setAttribute(
            "data-bs-title",
            "Доп.телефон: " + contact.value
          );
          btnContact.setAttribute("alt", "дополнительный телефон клиента");
          btnContact.onclick = function () {
            location.href = "tel:" + contact.value;
          };
          break;
        case "adress":
          btnContact.classList.add("table__all");
          btnContact.setAttribute("data-bs-title", "Адрес: " + contact.value);
          btnContact.setAttribute("alt", "Адрес клиента");

          break;
        case "country":
          btnContact.classList.add("table__all");
          btnContact.setAttribute("data-bs-title", "Страна: " + contact.value);
          btnContact.setAttribute("alt", "Страна клиента");

          break;
        case "city":
          btnContact.classList.add("table__all");
          btnContact.setAttribute("data-bs-title", "Город: " + contact.value);
          btnContact.setAttribute("alt", "Город клиента");

          break;
        case "index":
          btnContact.classList.add("table__all");
          btnContact.setAttribute("data-bs-title", "Индекс: " + contact.value);
          btnContact.setAttribute("alt", "Индекс клиента");

          break;
        case "Email":
          btnContact.classList.add("table__email");
          btnContact.setAttribute("data-bs-title", "Email: " + contact.value);
          btnContact.setAttribute("alt", "почта клиента");
          btnContact.onclick = function () {
            location.href = "mailto:" + contact.value;
          };
          break;
      }

      if (i >= maxVisibleContacts) {
        btnContact.classList.add("hidden-contact"); // Добавляем класс для скрытых контактов
        btnContact.setAttribute("data-user-id", oneUser.id); // Добавляем атрибут с идентификатором пользователя
      }

      userContact.appendChild(btnContact);
    }

    if (hiddenContacts.length > 0) {
      const btnShowHidden = document.createElement("button");
      btnShowHidden.textContent = `+${hiddenContacts.length} `;
      btnShowHidden.classList.add("table__contact-btn");
      btnShowHidden.setAttribute("data-user-id", oneUser.id); // Добавляем атрибут с идентификатором пользователя

      btnShowHidden.onclick = function () {
        const userId = this.getAttribute("data-user-id"); // Получаем идентификатор пользователя
        const hiddenButtons = document.querySelectorAll(
          `.hidden-contact[data-user-id="${userId}"]`
        );
        hiddenButtons.forEach((btn) => {
          btn.classList.remove("hidden-contact");
        });
        this.style.display = "none"; // Скрываем кнопку после отображения скрытых контактов
      };

      userContact.appendChild(btnShowHidden);
    }

    userAction.appendChild(divChange);
    userAction.appendChild(divDelete);

    userTr.append(userID, userFIO, userContact, userAction);

    userTr.insertBefore(tableUpdateСontainer, userContact);
    userTr.insertBefore(tableСreateСontainer, tableUpdateСontainer);

    tableBody.appendChild(userTr);
  }
}

render(clientList);

//--------------------------------tooltip

let tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
let tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// ------------------------------------------------------------------------------------------------Поиск

// Обработчик события отправки формы Поиска (может быть не нужен в данном контексте)
filterForm.addEventListener("submit", function (event) {
  event.preventDefault(); // останавливаем отправку формы
});

// Рендеринг списка клиентов на основе введенного поискового запроса
let timeoutId;
searchContact.addEventListener("input", function () {
  clearTimeout(timeoutId); // Сбрасываем предыдущий timeout, если он был установлен
  const searchQuery = searchContact.value.trim(); // Получаем текст из поля ввода, удаляем лишние пробелы
  timeoutId = setTimeout(async () => {
    try {
      const clients = await getClients(searchQuery); // Получаем список клиентов с учетом поискового запроса
      render(clients); // Рендерим таблицу клиентов
    } catch (error) {
      console.error("Не удалось обновить клиента:", error);
    }
    //повторяем инициализацию тултип

    tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }, 300); // Устанавливаем задержку в 300 мс перед отправкой запроса
});

//------------------------------------------------------------------------------------------------ событие добовления клиента

$addForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // Собираем данные клиента из формы
  let newClientObj = {
    name: $nameInp.value.trim(),
    surname: $surnameInp.value.trim(),
    lastName: $lastnameInp.value.trim(),
    contacts: [], // Создаем пустой массив для контактов
  };

  // Получаем все элементы с классом modal__contact-form
  const contactForms = document.querySelectorAll(".modal__contact-form");

  // Проходим по каждому элементу и собираем данные контактов
  contactForms.forEach((contactForm) => {
    const contactType = contactForm.querySelector(".modal__contact-type").value;
    const contactValue = contactForm
      .querySelector(".modal__contact-value")
      .value.trim();

    // Добавляем контакт в массив контактов newClientObj
    if (contactType && contactValue) {
      newClientObj.contacts.push({ type: contactType, value: contactValue });
    }
  });

  // Отправляем данные на сервер и получаем ответ
  let serverDataObj = await serverAddClient(newClientObj);

  // Очищаем поля формы
  $nameInp.value = "";
  $surnameInp.value = "";
  $lastnameInp.value = "";

  // Очищаем поля для контактов
  contactForms.forEach((contactForm) => {
    contactForm.querySelector(".modal__contact-type").value = "";
    contactForm.querySelector(".modal__contact-value").value = "";
  });
  // Закрываем модальное окно после успешного изменения
  exampleModal.style.display = "none";
  // убираем затемнение
  removeModalBackdrop();

  // Добавляем ответ от сервера в список клиентов и рендерим их
  clientList.push(serverDataObj);
  render(clientList);
});

//------------------------------------------------------------------------------------------------ событие изменения клиента

updateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Собираем обновленные данные клиента из формы
  const updatedClient = {
    name: $nameInpUpdate.value,
    surname: $surnameInpUpdate.value,
    lastName: $lastnameInpUpdate.value,
    contacts: [], // Создаем пустой массив для контактов
  };

  // Получаем все элементы с классом modal__update-form
  const updateForms = document.querySelectorAll(".modal__update-form");

  // Проходим по каждому элементу и собираем данные контактов
  updateForms.forEach((updateForm) => {
    const updateType = updateForm.querySelector(".modal__update-type").value;
    const updateValue = updateForm
      .querySelector(".modal__update-value")
      .value.trim();

    // Добавляем контакт в массив контактов updatedClient
    if (updateType && updateValue) {
      updatedClient.contacts.push({ type: updateType, value: updateValue });
    }
  });

  // Получаем идентификатор клиента из другого источника
  let clientId = $idUpdate.innerHTML;

  if (clientId.startsWith("ID: ")) {
    clientId = clientId.substring(4).trim(); // Удалить "ID: " и любые ведущие/завершающие пробелы
  }

  // Вызываем функцию updateClient с обновленными данными и идентификатором клиента
  await updateClient(updatedClient, clientId);

  // Закрываем модальное окно
  exampleModalUpdate.style.display = "none";
  // убираем затемнение
  removeModalBackdrop();
});

/*-----------------------------------------------------------модальное окно----------------------------------------------------------------------------*/

// ----------------------------------------------Валидация ввода формы клиента

// Получаем кнопку отправки формы
const submitButton = document.getElementById("submitButton");

// Добавляем обработчик события для клика на кнопку отправки формы
submitButton.addEventListener("click", function (event) {
  const nameInput = document.getElementById("addFormNameInp");
  const surnameInput = document.getElementById("addFormSurenameInp");
  const lastnameInput = document.getElementById("addFormLastnameInp");

  // Функция для проверки наличия цифр и специальных символов
  function containsInvalidCharacters(value) {
    return /[\d`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/.test(value);
  }

  // Функция для валидации поля
  function validateField(input) {
    let value = input.value.trim(); // Удаляем лишние пробелы в начале и в конце
    // Проверка наличия цифр и специальных символов, а также разрешение латинских и кириллических символов
    if (!value || containsInvalidCharacters(value)) {
      input.style.borderBottom = "1px solid red"; // Применяем стиль к бордеру
      input.style.borderColor = "rgb(240, 106, 77, 0.5)"; // Применяем прозрачность к бордеру
      event.preventDefault(); // Останавливаем отправку формы
    } else {
      input.style.borderBottom = "1px solid rgba(51, 51, 51, 0.1)"; // Убираем бордер с прозрачностью
    }
  }

  // Валидация каждого поля
  validateField(nameInput);
  validateField(surnameInput);
  validateField(lastnameInput);
});

//------------------------------------------------------------------------логика кнопки добавления контактов клиента в модальном окне изменить клиента

const maxUpdate = 10;
const openUpdateFormBtn = document.getElementById("openUpdateFormBtn"); //кнопка добавить
const updateFormsContainer = document.getElementById("updateFormsContainer");
const updateFormTemplate = document.getElementById("updateFormTemplate");
const btnCloseModalUpdate = document.getElementById("btnCloseModalUpdate");

// функция сокрытия кнопки при достижении 10 контактов

function addContactUpdateButtonVisibility() {
  if (updateFormsContainer.childElementCount >= maxUpdate) {
    openUpdateFormBtn.style.display = "none";
  } else {
    openUpdateFormBtn.style.display = "block";
  }
}

// функция открытия кнопки

function showOpenContactUpdateFormButton() {
  openContactFormBtn.style.display = "block";
}

//функция инициализации choise

function initializeChoicesUpdateInClonedForm(clonedFormUpdate) {
  const choiceElements = clonedFormUpdate.querySelectorAll(
    ".modal__update-choice"
  );
  choiceElements.forEach(function (element) {
    new Choices(element, {
      allowHTML: true,
      searchEnabled: false,
      itemSelectText: "",
      position: "down",
    });
  });
}

//создание клона

function addContactFormUpdate() {
  if (updateFormsContainer.childElementCount < maxUpdate) {
    let clonedFormUpdate = updateFormTemplate.cloneNode(true);
    clonedFormUpdate.removeAttribute("id");
    clonedFormUpdate.style.display = "block";
    clonedFormUpdate.classList.add("modal__update-clone");
    updateFormsContainer.appendChild(clonedFormUpdate);

    // Инициализируем Choices только внутри новой формы
    initializeChoicesUpdateInClonedForm(clonedFormUpdate);

    // Функция для инициализации Tooltip
    tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    addContactUpdateButtonVisibility();
  }
}

//добавление элемента контакта

openUpdateFormBtn.addEventListener("click", function () {
  openUpdateFormBtn.classList.add("modal__btn-plus");
  addContactFormUpdate();
});

//закрытие элемента контакта

const modalUpdateBtnDelete = document.getElementById("modalUpdateBtnClose");
modalUpdateBtnDelete.setAttribute("data-bs-toggle", "tooltip");
modalUpdateBtnDelete.setAttribute("data-bs-placement", "top");
modalUpdateBtnDelete.setAttribute("data-bs-offset", "0,10");
modalUpdateBtnDelete.setAttribute("data-bs-title", "Удалить контакт");
updateFormsContainer.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal__btn-close")) {
    event.target.closest(".modal__update-clone").remove();
    addContactUpdateButtonVisibility();
  }
});

// Функция для инициализации Tooltip
function initializeTooltip() {
  const tooltip = new bootstrap.Tooltip(modalAddBtnDelete);
}

// Добавление слушателя события для инициализации Tooltip после добавления элемента на страницу

openUpdateFormBtn.addEventListener("click", function () {
  addContactUpdateButtonVisibility();
  initializeTooltip();
});

//отчистка поля контактов

document.querySelector(".modal__btn-end ").onclick = function () {
  updateFormsContainer.innerHTML = "";
  // Закрываем модальное окно после успешного удаления
  modal.style.display = "none";
};

document.querySelector(".btn-close ").onclick = function () {
  updateFormsContainer.innerHTML = "";
  // Закрываем модальное окно после успешного удаления
  modal.style.display = "none";
};

//удаление клонов при закрытии модалки

function removeAllContactFormUpdates() {
  let clonedForms = updateFormsContainer.querySelectorAll(
    ".modal__update-clone"
  );
  clonedForms.forEach((form) => {
    updateFormsContainer.removeChild(form);
  });
}
btnCloseModalUpdate.addEventListener("click", function () {
  removeAllContactFormUpdates();
});

//------------------------------------------------------------------------------логика кнопки добавление контактов клиента в модальном окне нового клиента

const maxContacts = 10;
const openContactFormBtn = document.getElementById("openContactFormBtn"); //кнопка добавить
const contactFormsContainer = document.getElementById("contactFormsContainer"); //
const contactFormTemplate = document.getElementById("contactFormTemplate");
const btnCloseModal = document.getElementById("btnCloseModal");

// функция сокрытия кнопки при достижении 10 контактов

function addContactButtonVisibility() {
  if (contactFormsContainer.childElementCount >= maxContacts) {
    openContactFormBtn.style.display = "none";
  } else {
    openContactFormBtn.style.display = "block";
  }
}

// функция открытия кнопки

function showOpenContactFormButton() {
  openContactFormBtn.style.display = "block";
}

//функция инициализации choise

function initializeChoicesInClonedForm(clonedForm) {
  const choiceElements = clonedForm.querySelectorAll(".js-choice");
  choiceElements.forEach(function (element) {
    new Choices(element, {
      allowHTML: true,
      searchEnabled: false,
      itemSelectText: "",
      position: "down",
    });
  });
}

//создание клона

function addContactForm() {
  if (contactFormsContainer.childElementCount < maxContacts) {
    let clonedForm = contactFormTemplate.cloneNode(true);
    clonedForm.removeAttribute("id");
    clonedForm.style.display = "block";
    clonedForm.classList.add("modal__clone");
    contactFormsContainer.appendChild(clonedForm);

    // Инициализируем Choices только внутри новой формы
    initializeChoicesInClonedForm(clonedForm);

    // Функция для инициализации Tooltip
    tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    addContactButtonVisibility();
  }
}

//создание кнопки добавить контакт при открытии модалки добавить клиента

const btnOpenModalAdd = document.getElementById("btnOpenModalAdd");
btnOpenModalAdd.addEventListener("click", function () {
  addContactButtonVisibility();
});

//добавление элемента контакта

openContactFormBtn.addEventListener("click", function () {
  openContactFormBtn.classList.add("modal__btn-plus");
  addContactForm();
});

//закрытие элемента контакта

const modalAddBtnDelete = document.getElementById("modalAddBtnClose");
modalAddBtnDelete.setAttribute("data-bs-toggle", "tooltip");
modalAddBtnDelete.setAttribute("data-bs-placement", "top");
modalAddBtnDelete.setAttribute("data-bs-offset", "0,10");
modalAddBtnDelete.setAttribute("data-bs-title", "Удалить контакт");

contactFormsContainer.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal__btn-close")) {
    event.target.closest(".modal__clone").remove();
    addContactButtonVisibility();
  }
});

// Добавление слушателя события для инициализации Tooltip после добавления элемента на страницу

openContactFormBtn.addEventListener("click", function () {
  addContactButtonVisibility();
  initializeTooltip();
});

// отчистка поля контактов

document.querySelector(".modal__btn-end ").onclick = function () {
  contactFormsContainer.innerHTML = "";
  // Закрываем модальное окно после успешного удаления
  modal.style.display = "none";
};

document.querySelector(".btn-close ").onclick = function () {
  contactFormsContainer.innerHTML = "";
  // Закрываем модальное окно после успешного удаления
  modal.style.display = "none";
};

//удаление клонов при закрытии модалки

function removeAllContactForm() {
  let clonedForms = contactFormsContainer.querySelectorAll(".modal__clone");
  clonedForms.forEach((form) => {
    contactFormsContainer.removeChild(form);
  });
}

btnCloseModal.addEventListener("click", function () {
  removeAllContactForm();
});

/*---------------------------------------------------------------сортировка------------------------------------------------------------------*/

const sortId = document.getElementById("sortId");
sortId.addEventListener("click", function () {
  // Определите элементы SVG для иконок
  const idIconUp = document.querySelector(".btn__id-up");
  const idIconDown = document.querySelector(".btn__id-dw");

  // Проверяем текущий класс и меняем на противоположный
  if (idIconUp.classList.contains("active")) {
    idIconUp.classList.remove("active");
    idIconDown.classList.add("active");
    idIconUp.style.display = "none"; // Скрываем иконку вверх
    idIconDown.style.display = "inline-block"; // Показываем иконку вниз
  } else {
    idIconUp.classList.add("active");
    idIconDown.classList.remove("active");
    idIconUp.style.display = "inline-block"; // Показываем иконку вверх
    idIconDown.style.display = "none"; // Скрываем иконку вниз
  }

  toggleSortDirection("id");
});

const sortFio = document.getElementById("sortFio");
sortFio.addEventListener("click", function () {
  // Определите элементы SVG для иконок
  const fioIconUp = document.querySelector(".btn-fio__up");
  const fioIconDown = document.querySelector(".btn-fio__dw");
  const fioSortUp = document.querySelector(".btn-fio__subtitle-up ");
  const fioSortDown = document.querySelector(".btn-fio__subtitle-dw");

  // Проверяем текущий класс и меняем на противоположный
  if (
    fioIconUp.classList.contains("fio__active") &&
    fioSortUp.classList.contains("fio__active-sort")
  ) {
    fioIconUp.classList.remove("fio__active");
    fioSortUp.classList.remove("fio__active-sort");
    fioIconDown.classList.add("fio__active");
    fioSortDown.classList.add("fio__active-sort");
    fioIconUp.style.display = "none"; // Скрываем иконку вверх
    fioSortUp.style.display = "none"; // Скрываем буквы вверх
    fioIconDown.style.display = "inline-block"; // Показываем иконку вниз
    fioSortDown.style.display = "inline-block"; // Показываем буквы вниз
  } else {
    fioIconUp.classList.add("fio__active");
    fioIconDown.classList.remove("fio__active");
    fioIconUp.style.display = "inline-block"; // Показываем иконку вверх
    fioIconDown.style.display = "none"; // Скрываем иконку вниз
    fioSortUp.classList.add("fio__active-sort");
    fioSortDown.classList.remove("fio__active-sort");
    fioSortUp.style.display = "inline-block"; // Показываем буквы вверх
    fioSortDown.style.display = "none"; // Скрываем буквы вниз
  }

  toggleSortDirection("fio");
});

const sortCreated = document.getElementById("sortCreated");
sortCreated.addEventListener("click", function () {
  // Определите элементы SVG для иконок
  const createIconUp = document.querySelector(".btn-create__up");
  const createIconDown = document.querySelector(".btn-create__dw");

  // Проверяем текущий класс и меняем на противоположный
  if (createIconUp.classList.contains("create__active")) {
    createIconUp.classList.remove("create__active");
    createIconDown.classList.add("create__active");
    createIconUp.style.display = "none"; // Скрываем иконку вверх
    createIconDown.style.display = "inline"; // Показываем иконку вниз
  } else {
    createIconUp.classList.add("create__active");
    createIconDown.classList.remove("create__active");
    createIconUp.style.display = "inline"; // Показываем иконку вверх
    createIconDown.style.display = "none"; // Скрываем иконку вниз
  }

  toggleSortDirection("createdAt");
});

const sortUpdate = document.getElementById("sortUpdate");
sortUpdate.addEventListener("click", function () {
  // Определите элементы SVG для иконок
  const updateIconUp = document.querySelector(".btn-update__up");
  const updateIconDown = document.querySelector(".btn-update__dw");

  // Проверяем текущий класс и меняем на противоположный
  if (updateIconUp.classList.contains("update__active")) {
    updateIconUp.classList.remove("update__active");
    updateIconDown.classList.add("update__active");
    updateIconUp.style.display = "none"; // Скрываем иконку вверх
    updateIconDown.style.display = "inline-block"; // Показываем иконку вниз
  } else {
    updateIconUp.classList.add("update__active");
    updateIconDown.classList.remove("update__active");
    updateIconUp.style.display = "inline-block"; // Показываем иконку вверх
    updateIconDown.style.display = "none"; // Скрываем иконку вниз
  }

  toggleSortDirection("updatedAt");
});
