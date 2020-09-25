const remote = require('./remote');
const { find } = require('./service');

module.exports = class Controller {
  async actionA(iid) {
    const list = await find(iid);
    await remote.invoke(this.connectId, { path: 'component.invoke', parameters:  [1, 'setData' ,[list]] });
  }
}
