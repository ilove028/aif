(function() {
  const ws = new WebSocket('ws://localhost:7001');
  const componentManager = {
    invoke(context, name, parameters) {
      remote.invoke('actionA', ['9527']);
    }
  };
  Vue.use(function (Vue) {
    const origin = Vue.prototype.$emit;
    Vue.prototype.$emit = function(name, ...args) {
      componentManager.invoke(this, name, ...args);
      return origin.apply(this, [name].concat(args));
    }
  });

  const vm = new Vue({
    el: '#app',
    template:
      `
        <div id="app">
          <button @click="$emit('refresh')"></button>
          <ul>
            <li v-for="i of list" :key="i.id">
              {{ i.name }}
            </li>
          </ul>
        </div>
      `,
    data: { list: [] },
    methods: {
      setData(list) {
        this.list = list;
      }
    }
  });
  const global = {
    math: {
      add(...args) {
        return args.reduce((pre, current) => pre + current, 0);
      }
    },
    component: {
      invoke(id, name, parameters) {
        const fn = vm[name];
        if (fn) {
          fn.apply(null, parameters);
        }
      }
    }
  }

  const remote = {
    async invokeLocal(path, parameters) {
      const context = get(global, path.split('.').slice(0, -1).join('.'));
      const fun = get(global, path);
      if (fun) {
        return fun.apply(context, parameters);
      }
    },
    async invoke(path, parameters) {
      ws.send(JSON.stringify({ id: 2, path, parameters }));
    }
  };

  function get(object, path) {
    const paths = path.split('.');
    for(let p of paths) {
      if (object.hasOwnProperty(p)) {
        object = object[p];
      } else {
        return undefined;
      }
    }
    return object;
  }

  ws.addEventListener('open', function() {
    console.log('open');
  });

  ws.addEventListener('close', function() {
    console.log('Close');
  });

  ws.addEventListener('error', function() {
    console.log('error');
  });

  ws.addEventListener('message', function({ data }) {
    data = JSON.parse(data);
    const { id, path, parameters } = data;
    remote.invokeLocal(path, parameters)
    .then((result) => {
      ws.send(JSON.stringify({ id, result }));
    }).catch((err) => {
      ws.send(JSON.stringify({ id, err }));
    })
  });
})();