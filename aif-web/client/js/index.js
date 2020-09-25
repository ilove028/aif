(function() {
  const ws = new WebSocket('ws://localhost:7001');

  const global = {
    math: {
      add(...args) {
        return args.reduce((pre, current) => pre + current, 0);
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