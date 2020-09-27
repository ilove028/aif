(function() {
  const ws = new WebSocket('ws://localhost:7001');
  const config = {
    triggerAction: {
      refresh: [{
        path: 'actionA',
        parameters: [
          [
            ['0', null]
          ],
          [
            ['1', 'page.index']
          ]
        ]
      }]
    }
  };

  function mapParameters(parameters, mapper) {
    return mapper.map((item) => {
      return toParameter(parameters, item);
    });
  }

  function toParameter(parameters, map) {
    let isFinished = false;
    return map.reduce((pre, [from, to]) => {
      if (isFinished) {
        return pre;
      } else {
        const value = get(parameters, from);
        if (to) {
          return set(pre, to, value);
        } else {
          isFinished = true;
          return value;
        }
      }
    }, {});
  } 

  const componentManager = {
    invoke(context, name, ...parameters) {
      // remote.invoke('actionA', ['9527']);
      const actions = config.triggerAction[name];
      actions.forEach((action) => {
        remote.invoke(action.path, mapParameters(parameters, action.parameters))
      })
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
          <button @click="$emit('refresh', 1, 'a')">1</button>
          <button @click="$emit('refresh', 2)">2</button>
          <button @click="$emit('refresh', 3)">3</button>
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

  function get(object = {}, path) {
    const paths = path.split('.');
    for(const p of paths) {
      if (object.hasOwnProperty(p)) {
        object = object[p];
      } else {
        return undefined;
      }
    }
    return object;
  }

  function set(object = {}, path, value) {
    const result = object;
    const paths = path.split('.');
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      if (i === paths.length - 1) {
        object[p] = value;
      } else {
        const pre = object[p];
        const type = typeof pre;
        if (type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined') {
          object = object[p] = {};
        } else {
          object = object[p];
        }
      }
    }
    return result;
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