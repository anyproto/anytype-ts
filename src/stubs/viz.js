export const instance = {
  /**
   * Stubbed render function.
   * Real @viz-js/viz returns { output: string, ... }
   */
  render: async (src, options = {}) => {
    return {
      output: '',       // empty SVG or result
      errors: [],       // no errors
    };
  },

  /**
   * Optional helpers included in the real lib.
   * You can safely stub them to no-ops.
   */
  layout: async () => ({ output: '', errors: [] }),
  version: () => 'stubbed',
};

export default instance;