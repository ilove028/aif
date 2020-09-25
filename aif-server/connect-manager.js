const map = new Map();

function add(key, connection) {
  return map.set(key, connection);
}

function remove(key, connection) {
  return map.delete(key, connection);
}

function get(key) {
  return map.get(key);
}

function has(key) {
  return map.has(key);
}

function clear() {
  for(let id of map.keys()) {
    map.delete(id);
  }
}

module.exports = {
  add,
  remove,
  get,
  has,
  clear
}