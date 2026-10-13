module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      budget: {
        performance: 95,
        accessibility: 100,
        bestPractices: 100,
        seo: 100,
        lcp: 2500,
        cls: 0.1,
        inp: 200
      }
    }
  }
};