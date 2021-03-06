

let template_api_data = {
  tasks: [],
}

let local = {
  get $data() {
    let data = sessionStorage.getItem('api_data');
    if (!data) {
      data = JSON.stringify(template_api_data);
    }
    return JSON.parse(data);
  },
  set $data(value) {
    sessionStorage.setItem('api_data', JSON.stringify(value))
  },
  tasks: {
    async create(taskdata) {
      console.log('CREATING LOCAL TASK', taskdata);
      let data = local.$data;
      let maxid = Math.max(0, ...data.tasks.filter(o => o && o.id).map(o => Number(o.id)));
      taskdata.id = maxid + 1;
      data.tasks.push(taskdata);
      local.$data = data;
    },
    async update(task) {
      console.log('UPDATING LOCAL TASK', task);
      let data = local.$data;
      Object.assign(data.tasks.find(o => o.id == task.id), task.data);
      local.$data = data;
    },
    async delete(task) {
      console.log('DELETING LOCAL TASK', task);
      let data = local.$data;
      console.log(data.tasks.findIndex(o => o.id == task.data.id))
      delete data.tasks[data.tasks.findIndex(o => o.id == task.data.id)];
      data.tasks = data.tasks.filter(o => o)
      local.$data = data;
    },
    async get() {
      console.log('FETCHING LOCAL TASKS');
      let { tasks } = local.$data;
      console.log(tasks);
      return {
        tasks,
      }
    },
  },
  get task() { // alias
    return this.tasks;
  }
}

Object.defineProperty(window, 'cookies', {
  get() {
    return Object.fromEntries(decodeURIComponent(document.cookie).split(';').map(o => {
      let equal = o.indexOf('=');
      return [o.substr(0, equal), o.substr(equal + 1)]
    }));
  }
})

var API = {
  get offline() {
    // if we are logged in, return false
    // otherwise, return true
    // can test by adding ?offline to the url. example: localhost:8080/?offline
    //return new URLSearchParams(location.search).get('offline') !== null;
    //return true;
    let offline = !('taskbook_session' in window.cookies);
    let btn = document.querySelector('#login-route');
    if (offline) {
      btn.href = '/login';
      btn.innerHTML = 'Login';
    } else {
      btn.href = '/logout';
      btn.innerHTML = 'Logout';
    }
    return offline;
  },
  tasks: {
    create(data) {
      if (API.offline) {
        return local.tasks.create(data);
      }
      return fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': "application/json; charset=utf-8",
        },
        body: JSON.stringify(data),
      })
    },
    update(task) {
      if (API.offline) {
        return local.tasks.update(task);
      }
      return fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': "application/json; charset=utf-8",
        },
        body: JSON.stringify(task.data),
      })
    },
    delete(task) {
      Archives.create(task);
      //This is where you code the button to appear
      setTimeout(function() {
        $("#undo").show();
        $("#task-dlted").show();
      }, 1);
      setTimeout(function() {
        $("#undo").hide();
        $("#task-dlted").hide();
      }, 10000);
      if (API.offline) {
        return local.tasks.delete(task);
      }
      return fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': "application/json; charset=utf-8",
        },
        body: JSON.stringify({ id: task.data.id, }),
      })
    },
    get() {
      if (API.offline) {
        return local.tasks.get();
      }

      return fetch('/api/tasks').then(res => res.json());
    },
    count(day) {
      // This is the method I use to call on the server to serve us with the number of tasks
      // See the swift.py file for the calls

      if (API.offline) {
        // TODO add offline support
      }
      if (day !== 'today' && day !== 'tomorrow') {
        return fetch('/api/count')
          .then(res => res.json())

      } else {
        return fetch(`/api/count/${day}`)
          .then(res => res.json())
      }
    }
  },
  get task() { // alias
    return this.tasks;
  },
  archives: Archives,
  get archive() {
    return Archives;
  }
}
