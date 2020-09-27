module.exports = {
  async find(iid) {
    return new Promise((resolve) => {
      resolve([
        {
          id: 1,
          name: '加热'
        },
        {
          id: 2,
          name: '制冷'
        },
        {
          id: 3,
          name: '发电'
        }
      ].filter(i => i.id === iid));
    });
  }
}