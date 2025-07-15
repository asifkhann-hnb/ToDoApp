document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const pendingTasksList = document.getElementById('pendingTasks');
    const completedTasksList = document.getElementById('completedTasks');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Render all tasks
    renderTasks();

    // Add new task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addTask();
    });

    // Scroll to top button
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.style.opacity = '1';
            scrollTopBtn.style.visibility = 'visible';
            scrollTopBtn.style.transform = 'translateY(0)';
        } else {
            scrollTopBtn.style.opacity = '0';
            scrollTopBtn.style.visibility = 'hidden';
            scrollTopBtn.style.transform = 'translateY(20px)';
        }
    });

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            // Add shake animation to input
            taskInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                taskInput.style.animation = '';
            }, 500);
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();

        // Add animation class to new task
        const newTaskElement = document.querySelector(`.task[data-id="${newTask.id}"]`);
        if (newTaskElement) {
            newTaskElement.classList.add('task-enter');
        }
    }

    function renderTasks() {
        pendingTasksList.innerHTML = '';
        completedTasksList.innerHTML = '';

        if (tasks.length === 0) {
            pendingTasksList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <div>No tasks yet. Add one above!</div>
                        </div>
                    `;
            return;
        }

        // Sort tasks by creation date (newest first)
        const sortedTasks = [...tasks].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt));

        sortedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            if (task.completed) {
                completedTasksList.appendChild(taskElement);
            } else {
                pendingTasksList.appendChild(taskElement);
            }
        });

        // Show empty state if no pending tasks
        if (pendingTasksList.querySelectorAll('.task').length === 0) {
            pendingTasksList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle"></i>
                            <div>All tasks completed! Great job!</div>
                        </div>
                    `;
        }

        // Show empty state if no completed tasks
        if (completedTasksList.querySelectorAll('.task').length === 0) {
            completedTasksList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check"></i>
                            <div>No completed tasks yet.</div>
                        </div>
                    `;
        }
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const taskContentDiv = document.createElement('div');
        taskContentDiv.className = 'task-content';

        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        taskTextSpan.textContent = task.text;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        if (!task.completed) {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'task-btn complete-btn';
            completeBtn.innerHTML = '<i class="fas fa-check"></i>';
            completeBtn.title = 'Mark as complete';
            completeBtn.addEventListener('click', () => toggleTaskComplete(task.id));
            actionsDiv.appendChild(completeBtn);
        }

        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', () => editTask(task.id));
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        actionsDiv.appendChild(deleteBtn);

        taskContentDiv.appendChild(taskTextSpan);
        taskContentDiv.appendChild(actionsDiv);

        const metaDiv = document.createElement('div');
        metaDiv.className = 'task-meta';

        const createdAtSpan = document.createElement('span');
        createdAtSpan.innerHTML = `<i class="far fa-calendar-plus"></i> ${formatDate(task.createdAt)}`;

        metaDiv.appendChild(createdAtSpan);

        if (task.completed && task.completedAt) {
            const completedAtSpan = document.createElement('span');
            completedAtSpan.innerHTML = `<i class="far fa-calendar-check"></i> ${formatDate(task.completedAt)}`;
            metaDiv.appendChild(completedAtSpan);
        }

        li.appendChild(taskContentDiv);
        li.appendChild(metaDiv);

        return li;
    }

    function toggleTaskComplete(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    completed: !task.completed,
                    completedAt: task.completed ? null : new Date().toISOString()
                };
            }
            return task;
        });
        saveTasks();
        renderTasks();
    }

    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const taskElement = document.querySelector(`.task[data-id="${taskId}"]`);
        const taskTextSpan = taskElement.querySelector('.task-text');
        const actionsDiv = taskElement.querySelector('.task-actions');

        const originalText = task.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = originalText;

        // Replace text with input field
        taskTextSpan.replaceWith(input);
        input.focus();

        // Hide action buttons while editing
        actionsDiv.style.visibility = 'hidden';

        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                task.text = newText;
                saveTasks();
            }
            renderTasks();
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') saveEdit();
        });
    }

    function deleteTask(taskId) {
        // Add animation before deletion
        const taskElement = document.querySelector(`.task[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(0.9)';
            taskElement.style.opacity = '0';
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks();
                renderTasks();
            }, 300);
        } else {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
        }
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Add shake animation for empty input
    const style = document.createElement('style');
    style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); }
                    40%, 80% { transform: translateX(5px); }
                }
            `;
    document.head.appendChild(style);
});