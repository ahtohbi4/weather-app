const Graph = (function () {
  'use strict';

  /**
   * Type of a data.
   *
   * @typedef {Object} DataType.
   * @property {Array} data
   * @property {Object.<{minValue: number, maxValue: number}>} meta
   */

  /**
   * @param {HTMLElement} $container
   * @constructor
   */
  function Graph($container) {
    this.$container = $container;

    const canvas = document.createElement('canvas');

    if (!canvas.getContext) {
      throw new Error('Canvas is not supported.');
    }

    this.$container.appendChild(canvas);

    this.canvas = canvas.getContext('2d');

    this._init();
  }

  /**
   * Visualizes the passing data.
   *
   * @param {DataType} data - A data for visualization.
   */
  Graph.prototype.draw = function (data) {
    this._clear();

    this._drawChart(data);
    this._drawAxis(data);
  };

  /**
   * Initializes a Graph.
   *
   * @private
   */
  Graph.prototype._init = function () {
    this._updateSize();
  };

  /**
   * Updates size of the canvas.
   *
   * @private
   */
  Graph.prototype._updateSize = function () {
    const containerSize = this.canvas.canvas.parentNode.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.canvas.width = containerSize.width * devicePixelRatio;
    this.canvas.canvas.style.width = String(containerSize.width) + 'px';
    this.canvas.canvas.height = containerSize.height * devicePixelRatio;
    this.canvas.canvas.style.height = String(containerSize.height) + 'px';
    this.canvas.scale(devicePixelRatio, devicePixelRatio);
  };

  /**
   * Gets the size of canvas.
   *
   * @returns {Object.<{width: number, height: number}>}
   * @private
   */
  Graph.prototype._getSize = function () {
    const rect = this.canvas.canvas.getBoundingClientRect();

    return {
      height: rect.height,
      width: rect.width,
    };
  };

  /**
   * Gets the size of the graph area and offsets of this area from the edges of the canvas.
   *
   * @returns {Array.<{top: number, left: number, bottom: number, width: number, right: number, height: number}>}
   * @private
   */
  Graph.prototype._getGraphContainer = function () {
    const offsetTop = 20;
    const offsetRight = 20;
    const offsetBottom = 20;
    const offsetLeft = 40;
    const size = this._getSize();

    return {
      bottom: (size.height - offsetBottom),
      left: offsetLeft,
      right: (size.width - offsetRight),
      top: offsetTop,

      width: (size.width - (offsetLeft + offsetRight)),
      height: (size.height - (offsetBottom + offsetTop)),
    };
  };

  /**
   * Clears the canvas.
   *
   * @private
   */
  Graph.prototype._clear = function () {
    const size = this._getSize();

    this.canvas.clearRect(0, 0, size.width, size.height);
  };

  /**
   * Draws a bar.
   *
   * @param {number} x - A start X coordinate.
   * @param {number} y - A start Y coordinate.
   * @param {number} width - A width of the bar.
   * @param {number} height - A height of the bar.
   * @private
   */
  Graph.prototype._drawBar = function (x, y, width, height) {
    const isPositive = (height >= 0);
    const color = isPositive ? Graph.COLORS.positive : Graph.COLORS.negative;
    const fromX = x;
    const fromY = isPositive ? (y - height) : y;

    this.canvas.fillStyle = color;
    this.canvas.fillRect(fromX, fromY, width, Math.abs(height));
  };

  /**
   * Draws a line.
   *
   * @param {number} fromX - A start X coordinate.
   * @param {number} fromY - A start Y coordinate.
   * @param {number} toX - An end X coordinate.
   * @param {number} toY - An end Y coordinate.
   * @private
   */
  Graph.prototype._drawLine = function (fromX, fromY, toX, toY) {
    this.canvas.beginPath();
    this.canvas.moveTo(fromX, fromY);
    this.canvas.lineTo(toX, toY);
    this.canvas.strokeStyle = Graph.COLORS.axis;
    this.canvas.stroke();
  };

  /**
   * Draws a text.
   *
   * @param {string} text - A text to draw.
   * @param {number} x - An X coordinate.
   * @param {number} y - An Y coordinate.
   * @private
   */
  Graph.prototype._drawText = function (text, x, y) {
    this.canvas.fillStyle = Graph.COLORS.axis;
    this.canvas.fillText(text, x, y);
  };

  /**
   * Calculates a scale of data to the canvas sizes.
   *
   * @param {DataType} data
   * @returns {Object.<{scaleY: number, amplitude: number}>}
   * @private
   */
  Graph.prototype._calculateScale = function (data) {
    const graphContainer = this._getGraphContainer();

    const amplitude = Math.max(Math.abs(data.meta.minValue), Math.abs(data.meta.maxValue));

    return {
      amplitude: amplitude,
      scaleY: (graphContainer.height / 2) / amplitude,
    };
  };

  /**
   * Draws the X-axis.
   *
   * @private
   */
  Graph.prototype._drawAxisX = function () {
    const graphContainer = this._getGraphContainer();
    const fromX = graphContainer.left;
    const fromY = graphContainer.top + (graphContainer.height / 2);
    const toX = graphContainer.left + graphContainer.width;

    this._drawLine(fromX, fromY, toX, fromY);
  };

  /**
   * Draw the Y-axis.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawAxisY = function (data) {
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);
    const fromX = graphContainer.left;
    const fromY = graphContainer.top;
    const toX = fromX;
    const toY = graphContainer.top + graphContainer.height;

    this._drawLine(fromX, fromY, toX, toY);

    const LABEL_COUNT = 11;
    const stepSize = graphContainer.height / (LABEL_COUNT - 1);

    for (let i = 0; i < LABEL_COUNT; i++) {
      const currentScale = i * (2 / (LABEL_COUNT - 1));
      const tickX = fromX;
      const tickY = graphContainer.top + (i * stepSize);
      const label = String(Math.round(scale.amplitude - (scale.amplitude * currentScale)));

      this._drawLine(tickX - 5, tickY, tickX, tickY);
      this._drawText(label, tickX - 20, tickY + 5);
    }
  };

  /**
   * Draws the axis.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawAxis = function (data) {
    this._drawAxisX(data);
    this._drawAxisY(data);
  };

  /**
   * Draw the chart.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawChart = function (data) {
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);
    const fromY = graphContainer.top + (graphContainer.height / 2);
    const dx = 0;
    const barWidth = (graphContainer.width - dx * (data.data.length + 1)) / data.data.length;

    for (let i = 0; i < data.data.length; i++) {
      const height = data.data[i].v * scale.scaleY;
      const barLeft = graphContainer.left + dx + (i * (dx + barWidth));

      this._drawBar(barLeft, fromY, barWidth, height);
    }
  };

  Graph.COLORS = {
    axis: '#fff',
    negative: '#008cff',
    positive: '#ff2e1c',
  };

  return Graph;
})();
