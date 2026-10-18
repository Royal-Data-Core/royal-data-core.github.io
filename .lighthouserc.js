module.exports = {
  ci: {
    collect: {
      urls: ['http://localhost:3000']
    },
    assert: {
      finalUrl: 'http://localhost:3000',
      lighthouseFlags: {
        onlyCategories: ['performance'],
        thresholds: {
          performance: 95
        }
      }
    }
  }
};