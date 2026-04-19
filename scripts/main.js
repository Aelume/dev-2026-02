(function () {
  'use strict';

  var API_BASE = 'https://api.yangyus8.top/api';
  var STATUS_LABEL = { todo: '待开始', doing: '进行中', done: '已完成' };

  // 拿到页面上需要用的元素
  var loadTasksBtn = document.getElementById('loadTasksBtn');
  var taskForm = document.getElementById('taskForm');
  var statusFilter = document.getElementById('statusFilter');
  var taskList = document.getElementById('taskList');
  var formMessage = document.getElementById('formMessage');
  var listMessage = document.getElementById('listMessage');

  // 缓存任务列表，筛选的时候不用重新请求
  var allTasks = [];

  // 显示提示信息
  function showMessage(el, text, color) {
    el.textContent = text;
    el.style.color = color || '#6b7280';
  }

  // 转义 HTML，防止 XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 把任务数组渲染到页面
  function renderTasks(tasks) {
    taskList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      taskList.innerHTML = '<li style="color:#6b7280;padding:12px;">暂无任务数据</li>';
      return;
    }

    tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item';

      var dateStr = '';
      if (task.createdAt) {
        var d = new Date(task.createdAt);
        dateStr = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0') + ' ' +
          String(d.getHours()).padStart(2, '0') + ':' +
          String(d.getMinutes()).padStart(2, '0');
      }

      var safeStatus = STATUS_LABEL[task.status] ? task.status : 'todo';
      var statusLabel = STATUS_LABEL[task.status] || '未知';

      li.innerHTML =
        '<h3>' + escapeHTML(task.title) + '</h3>' +
        '<div class="task-meta">' +
          '<span>负责人：' + escapeHTML(task.owner) + '</span>' +
          '<span class="badge ' + safeStatus + '">' +
            escapeHTML(statusLabel) +
          '</span>' +
          (dateStr ? '<span>创建于：' + dateStr + '</span>' : '') +
        '</div>';

      taskList.appendChild(li);
    });
  }

  // 根据下拉框的值筛选并渲染
  function filterAndRender() {
    var val = statusFilter.value;
    if (val === 'all') {
      renderTasks(allTasks);
    } else {
      renderTasks(allTasks.filter(function (t) { return t.status === val; }));
    }
  }

  // 获取任务列表
  function fetchTasks() {
    showMessage(listMessage, '正在加载…', '#2563eb');

    fetch(API_BASE + '/tasks')
      .then(function (res) {
        if (!res.ok) throw new Error('请求失败，状态码：' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.success && Array.isArray(json.data)) {
          allTasks = json.data;
          filterAndRender();
          showMessage(listMessage, '加载成功，共 ' + allTasks.length + ' 条任务', '#16a34a');
        } else {
          throw new Error('返回数据格式异常');
        }
      })
      .catch(function (err) {
        showMessage(listMessage, '获取任务失败：' + err.message, '#dc2626');
      });
  }

  // 提交新任务
  function createTask(data) {
    showMessage(formMessage, '正在提交…', '#2563eb');

    fetch(API_BASE + '/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('提交失败，状态码：' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.success) {
          showMessage(formMessage, '提交成功！', '#16a34a');
          taskForm.reset();
          fetchTasks();
        } else {
          throw new Error(json.message || '提交失败');
        }
      })
      .catch(function (err) {
        showMessage(formMessage, '提交失败：' + err.message, '#dc2626');
      });
  }

  // 事件绑定
  loadTasksBtn.addEventListener('click', function () {
    fetchTasks();
  });

  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var title = taskForm.elements['title'].value.trim();
    var owner = taskForm.elements['owner'].value.trim();
    var status = taskForm.elements['status'].value;

    if (!title || !owner) {
      showMessage(formMessage, '请填写完整的任务名称和负责人', '#dc2626');
      return;
    }

    createTask({ title: title, owner: owner, status: status });
  });

  statusFilter.addEventListener('change', function () {
    filterAndRender();
  });

  // 页面加载完就拉一次数据
  fetchTasks();

})();
