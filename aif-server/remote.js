const connectManager = require('./connect-manager');

const countMap = new Map();
const invokeMap = new Map();
const queue = []
const TIME_OUT = 30000;


async function invoke(connectId, { path, parameters, id }, timestamp) {
  const connection = connectManager.get(connectId);
  let resultPromise;
  if (!id) {
    if (countMap.has(connectId)) {
      id = countMap.get(connectId) + 1;
    } else {
      id = 1;
    }
    countMap.set(id);
    resultPromise = new Promise((resolve, reject) => {
      invokeMap.set(id, { resolve, reject });
    });
  }
  if (id && timestamp && (Date.now() - timestamp) > TIME_OUT) {
    const a = invokeMap.get(id);
    if (a) {
      invokeMap.delete(id);
      a.reject(new Error('Time out'));
    }
  } else if (connection) {
    connection.sendUTF(JSON.stringify({ id, path, parameters }));
  } else {
    queue.push({ connectId, id, path, parameters, timestamp: Date.now() });
  }
  // TODO
  return await resultPromise
}

function returnInvoke(id, result) {
  const { resolve, reject } = invokeMap.get(id);
  resolve(result);
}

function flush() {
  queue.forEach(({ connectId, id, path, parameters, timestamp }) => {
    invoke(connectId, { id, path, parameters }, timestamp);
  })
}

module.exports = { invoke, returnInvoke, flush }