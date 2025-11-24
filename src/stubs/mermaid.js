const mermaidStub = {
  initialize: () => {},

  init: () => {},

  /**
   * Stubbed render function
   * Real Mermaid returns { svg: string, bindFunctions?: () => void }
   */
  render: async () => ({
    svg: '',
    bindFunctions: () => {},
  }),

  /**
   * parse() normally validates Mermaid syntax.
   * Stub returns true to avoid throwing.
   */
  parse: () => true,

  /**
   * Mermaid's API includes version.
   */
  version: 'stubbed',

  /**
   * Optional helpers (Mermaid 10+)
   */
  registerExternalDiagrams: () => {},
  detectType: () => 'stubbed',
  getDiagramFromText: async () => null,
};

export default mermaidStub;