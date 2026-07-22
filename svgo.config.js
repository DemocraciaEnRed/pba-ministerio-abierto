export default {
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ fill: 'currentColor' }]
      }
    }
  ]
}
