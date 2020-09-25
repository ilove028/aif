const remote = require('./remote');
const { find } = require('./service');

module.exports = class Controller {
  async actionA(iid) {
    const list = await find(iid);
    remote.returnInvoke(this.connectId, )
    await remote.invoke('component.invoke', [1, 'setData' ,list]);
  }
}
