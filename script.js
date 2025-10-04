// Хранилище данных
let medications = JSON.parse(localStorage.getItem('medications')) || [];
let editingId = null;

// Добавление/обновление лекарства
function saveMedication() {
    const name = document.getElementById('medName').value;
    const dose = document.getElementById('medDose').value;
    const days = parseInt(document.getElementById('medDays').value);
    const whenTake = document.getElementById('whenTake').value;
    
    const timeCheckboxes = document.querySelectorAll('input[name="time"]:checked');
    const times = Array.from(timeCheckboxes).map(cb => cb.value);
    
    if (!name || !dose || !days || times.length === 0) {
        alert('Заполните все поля!');
        return;
    }
    
    const startDate = new Date().toISOString().split('T')[0];
    
    if (editingId) {
        // Редактируем существующее
        const medIndex = medications.findIndex(m => m.id === editingId);
        if (medIndex !== -1) {
            medications[medIndex] = {
                ...medications[medIndex],
                name,
                dose,
                days,
                times,
                whenTake,
                startDate
            };
        }
    } else {
        // Добавляем новое
        const medication = {
            id: Date.now(),
            name,
            dose,
            days,
            times,
            whenTake,
            startDate,
            inContainer: false
        };
        
        medications.push(medication);
    }
    
    saveToLocalStorage();
    renderAll();
    clearForm();
}

// Отметка для контейнера
function toggleContainer(id) {
    const med = medications.find(m => m.id === id);
    if (med) {
        med.inContainer = !med.inContainer;
        saveToLocalStorage();
        renderAll();
    }
}

// Очистка всего контейнера
function clearContainer() {
    if (confirm('Очистить весь контейнер? Снимутся все отметки.')) {
        medications.forEach(med => {
            med.inContainer = false;
        });
        saveToLocalStorage();
        renderAll();
    }
}

// Редактирование лекарства
function editMedication(id) {
    const med = medications.find(m => m.id === id);
    if (!med) return;
    
    editingId = id;
    
    // Заполняем форму данными
    document.getElementById('medName').value = med.name;
    document.getElementById('medDose').value = med.dose;
    document.getElementById('medDays').value = med.days;
    document.getElementById('whenTake').value = med.whenTake;
    
    // Сбрасываем чекбоксы
    document.querySelectorAll('input[name="time"]').forEach(cb => {
        cb.checked = med.times.includes(cb.value);
    });
    
    // Меняем интерфейс
    document.getElementById('formTitle').textContent = 'Редактировать лекарство';
    document.getElementById('saveBtn').textContent = '💾 Сохранить';
    document.getElementById('cancelBtn').style.display = 'block';
    
    // Прокручиваем к форме
    document.querySelector('.add-form').scrollIntoView({ behavior: 'smooth' });
}

// Отмена редактирования
function cancelEdit() {
    editingId = null;
    clearForm();
}

// Очистка формы
function clearForm() {
    document.getElementById('medName').value = '';
    document.getElementById('medDose').value = '';
    document.getElementById('medDays').value = '';
    document.getElementById('whenTake').value = 'до еды';
    document.querySelectorAll('input[name="time"]').forEach(cb => cb.checked = false);
    
    // Возвращаем исходный интерфейс
    document.getElementById('formTitle').textContent = 'Добавить лекарство';
    document.getElementById('saveBtn').textContent = '➕ Добавить';
    document.getElementById('cancelBtn').style.display = 'none';
}

// Сохранение в LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('medications', JSON.stringify(medications));
}

// Удаление лекарства
function deleteMedication(id) {
    if (confirm('Удалить это лекарство?')) {
        medications = medications.filter(m => m.id !== id);
        saveToLocalStorage();
        renderAll();
        
        // Если удаляем редактируемое, отменяем редактирование
        if (editingId === id) {
            cancelEdit();
        }
    }
}

// Экспорт данных
function exportData() {
    const dataStr = JSON.stringify(medications, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'medications_backup.json';
    link.click();
}

// Импорт данных
function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm(`Импортировать ${importedData.length} лекарств? Текущие данные будут заменены.`)) {
                    medications = importedData;
                    saveToLocalStorage();
                    renderAll();
                    cancelEdit();
                    alert('Данные успешно импортированы!');
                }
            } catch (error) {
                alert('Ошибка при импорте файла!');
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
}

// Функция для правильного склонения слова "день"
function getDaysText(days) {
    if (days === 1) {
        return 'остался 1 день';
    } else if (days >= 2 && days <= 4) {
        return `осталось ${days} дня`;
    } else {
        return `осталось ${days} дней`;
    }
}

// Рендер расписания на сегодня
function renderTodaySchedule() {
    const container = document.getElementById('todaySchedule');
    const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    
    let html = `
        <div class="container-header">
            <p><strong>${today}</strong></p>
            <button onclick="clearContainer()" class="clear-container-btn">🗑️ Очистить контейнер</button>
        </div>
    `;
    
    const activeMeds = medications.filter(med => {
        const start = new Date(med.startDate);
        const today = new Date();
        const diffTime = today - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < med.days;
    });
    
    if (activeMeds.length === 0) {
        html += '<p>На сегодня лекарств нет</p>';
    } else {
        activeMeds.forEach(med => {
            const daysLeft = med.days - Math.floor((new Date() - new Date(med.startDate)) / (1000 * 60 * 60 * 24));
            
            html += `
                <div class="medication-card ${med.inContainer ? 'in-container' : ''}">
                    <div class="med-header">
                        <h4>${med.name} - ${med.dose}</h4>
                        <button class="container-toggle ${med.inContainer ? 'in-container' : ''}" 
                                onclick="toggleContainer(${med.id})">
                            ${med.inContainer ? '✅' : '📦'}
                        </button>
                    </div>
                    <p>Время: ${med.times.map(t => `<span class="time-badge">${t}</span>`).join('')}</p>
                    <p>Прием: <span class="when-badge ${med.whenTake === 'до еды' ? 'before-food' : 'after-food'}">${med.whenTake}</span></p>
                    <p>Осталось дней: ${daysLeft}</p>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// Рендер списка всех лекарств
function renderMedicationsList() {
    const container = document.getElementById('medicationsList');
    
    if (medications.length === 0) {
        container.innerHTML = '<p>Лекарств пока нет</p>';
        return;
    }
    
    let html = '';
    medications.forEach(med => {
        const daysPassed = Math.floor((new Date() - new Date(med.startDate)) / (1000 * 60 * 60 * 24));
        const daysLeft = med.days - daysPassed;
        
        html += `
            <div class="medication-card">
                <div class="med-header">
                    <h4>${med.name}</h4>
                    <div class="med-actions">
                        <button class="edit-btn" onclick="editMedication(${med.id})">✏️ Редактировать</button>
                        <button class="delete-btn" onclick="deleteMedication(${med.id})">🗑️ Удалить</button>
                    </div>
                </div>
                <p><strong>Доза:</strong> ${med.dose}</p>
                <p><strong>Время приема:</strong> ${med.times.map(t => `<span class="time-badge">${t}</span>`).join('')}</p>
                <p><strong>Когда принимать:</strong> <span class="when-badge ${med.whenTake === 'до еды' ? 'before-food' : 'after-food'}">${med.whenTake}</span></p>
                <p><strong>Курс:</strong> ${daysLeft > 0 ? getDaysText(daysLeft) : 'курс завершен'}</p>
                <p><strong>Начало:</strong> ${new Date(med.startDate).toLocaleDateString('ru-RU')}</p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Общий рендер
function renderAll() {
    renderTodaySchedule();
    renderMedicationsList();
}

// Инициализация
document.addEventListener('DOMContentLoaded', renderAll);

// PWA Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => console.log('SW registered'))
      .catch(err => console.log('SW registration failed'));
  });
}

// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Better touch handling
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });
