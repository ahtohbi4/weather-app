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
   * @param {Object} [options={}]
   * @param {string} [options.units]
   */
  Graph.prototype.draw = function (data, options) {
    options = options || {};

    const units = options.units;

    this
      ._clear()
      ._drawChart(data)
      ._drawAxis(data, { units: units })
      ._drawGrid(data);
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
  Graph.prototype._getContainerSize = function () {
    const rect = this.canvas.canvas.getBoundingClientRect();

    return {
      height: rect.height,
      width: rect.width,
    };
  };

  /**
   * Gets the size of the graph area and offsets of this area from the edges of the canvas.
   *
   * @returns {Object.<{top: number, left: number, bottom: number, width: number, right: number, height: number}>}
   * @private
   */
  Graph.prototype._getGraphContainer = function () {
    const offsetTop = 20;
    const offsetRight = 20;
    const offsetBottom = 20;
    const offsetLeft = 40;
    const size = this._getContainerSize();

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
    const size = this._getContainerSize();

    this.canvas.clearRect(0, 0, size.width, size.height);

    return this;
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
    const color = isPositive ? Graph.COLORS.barPositive : Graph.COLORS.barNegative;
    const fromX = x;
    const fromY = isPositive ? (y - height) : y;

    this.canvas.fillStyle = color;
    this.canvas.fillRect(fromX, fromY, Math.ceil(width), Math.abs(height));

    return this;
  };

  /**
   * Draws a line.
   *
   * @param {number} fromX - A start X coordinate.
   * @param {number} fromY - A start Y coordinate.
   * @param {number} toX - An end X coordinate.
   * @param {number} toY - An end Y coordinate.
   * @param {Object} [options={}]
   * @param {string} [options.color='#fff']
   * @param {boolean} [options.isDashed=false]
   * @private
   */
  Graph.prototype._drawLine = function (fromX, fromY, toX, toY, options) {
    options = options || {};

    const color = options.color || '#fff';
    const isDashed = options.isDashed || false;

    this.canvas.beginPath();
    this.canvas.setLineDash(isDashed ? [3, 2] : []);
    this.canvas.moveTo(fromX, fromY);
    this.canvas.lineTo(toX, toY);
    this.canvas.strokeStyle = color;
    this.canvas.stroke();

    return this;
  };

  /**
   * Draws a text.
   *
   * @param {string} text - A text to draw.
   * @param {number} x - An X coordinate.
   * @param {number} y - An Y coordinate.
   * @param {Object} [options]
   * @param {'center'|'left'|'right'} [options.align='left'] - An alignment of text.
   * @param {'alphabetic'|'middle'|'top'} [options.baseLine='alphabetic'] - An alignment of text.
   * @private
   */
  Graph.prototype._drawText = function (text, x, y, options) {
    options = options || {};

    this.canvas.textAlign = options.align || 'left';
    this.canvas.textBaseline = options.baseLine || 'alphabetic';
    this.canvas.fillStyle = Graph.COLORS.axis;
    this.canvas.fillText(text, x, y);

    return this;
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

    const minValue = data.meta.minValue;
    const minDisplayedValue = (minValue > 0) ? 0 : minValue;
    const maxValue = data.meta.maxValue;
    const maxDisplayedValue = (maxValue < 0) ? 0 : maxValue;
    const amplitude = maxDisplayedValue - minDisplayedValue;

    return {
      amplitude: amplitude,
      maxDisplayedValue: maxDisplayedValue,
      minDisplayedValue: minDisplayedValue,
      scaleX: graphContainer.width / data.data.length,
      scaleY: graphContainer.height / amplitude,
    };
  };

  /**
   * Draws the X-axis.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawAxisX = function (data) {
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);
    const fromX = graphContainer.left;
    const fromY = graphContainer.top + (scale.maxDisplayedValue * scale.scaleY);
    const toX = graphContainer.left + graphContainer.width;

    this._drawLine(fromX, fromY, toX, fromY, { color: Graph.COLORS.axis });

    return this;
  };

  /**
   * Draw the Y-axis.
   *
   * @param {DataType} data
   * @param {Object} options
   * @param {string} [options.units]
   * @private
   */
  Graph.prototype._drawAxisY = function (data, options) {
    const graphContainer = this._getGraphContainer();
    const fromX = graphContainer.left;
    const fromY = graphContainer.top;
    const toX = fromX;
    const toY = graphContainer.top + graphContainer.height;

    this._drawLine(fromX, fromY, toX, toY, { color: Graph.COLORS.axis });

    const units = options.units;

    if (units) {
      const unitsX = 0;
      const unitsY = graphContainer.top + (graphContainer.height / 2);
      this._drawText(units, unitsX, unitsY, { baseLine: 'middle' });
    }

    return this;
  };

  /**
   * Draws the axis.
   *
   * @param {DataType} data
   * @param {Object} options
   * @private
   */
  Graph.prototype._drawAxis = function (data, options) {
    this
      ._drawAxisX(data)
      ._drawAxisY(data, options);

    return this;
  };

  /**
   * Draws the horizontal grid.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawHorizontalGrid = function (data) {
    const MIN_GRID_HEIGHT = 50;
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);
    const maxPeak = scale.scaleY * Math.max(Math.abs(scale.minDisplayedValue), Math.abs(scale.maxDisplayedValue));
    const maxGridCount = Math.floor(maxPeak / MIN_GRID_HEIGHT);
    const gridStep = maxPeak / maxGridCount;

    const centerY = graphContainer.top + (scale.maxDisplayedValue * scale.scaleY);
    const fromX = graphContainer.left;
    const toX = graphContainer.left + graphContainer.width;

    let negativeY = centerY;
    let positiveY = centerY;

    this._drawText('0', fromX - Graph.GRID_LABEL_OFFSET, centerY, {
      align: 'right',
      baseLine: 'middle',
    });

    for (let i = 1; i <= maxGridCount - 1; i++) {
      negativeY += gridStep;
      positiveY -= gridStep;

      if (negativeY <= graphContainer.top + graphContainer.height) {
        const label = '-' + String(Math.round(gridStep * i / scale.scaleY));

        this
          ._drawLine(fromX, negativeY, toX, negativeY, {
            color: Graph.COLORS.grid,
            isDashed: true,
          })
          ._drawText(label, fromX - Graph.GRID_LABEL_OFFSET, negativeY, {
            align: 'right',
            baseLine: 'middle',
          });
      }

      if (positiveY >= graphContainer.top) {
        const label = String(Math.round(gridStep * i / scale.scaleY));

        this
          ._drawLine(fromX, positiveY, toX, positiveY, {
            color: Graph.COLORS.grid,
            isDashed: true,
          })
          ._drawText(label, fromX - Graph.GRID_LABEL_OFFSET, positiveY, {
            align: 'right',
            baseLine: 'middle',
          });
      }
    }

    return this;
  };

  /**
   * Draws the vertical grid.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawVerticalGrid = function (data) {
    const _this = this;
    const MIN_GRID_WIDTH = 50;
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);

    let prevDisplayedYear = data.data[0].t.substr(0, 4);
    let prevGridLinePosition = graphContainer.left;

    data.data.forEach(function (item, i) {
      const year = item.t.substr(0, 4);

      if (year === prevDisplayedYear) {
        return;
      }

      prevDisplayedYear = year;

      const offsetFromLeft = graphContainer.left + (i * scale.scaleX);
      const relativeOffset = offsetFromLeft - prevGridLinePosition;

      if (relativeOffset >= MIN_GRID_WIDTH) {
        const fromX = offsetFromLeft;
        const fromY = graphContainer.top;
        const toX = offsetFromLeft;
        const toY = graphContainer.top + graphContainer.height;

        _this._drawLine(fromX, fromY, toX, toY, {
          color: Graph.COLORS.grid,
          isDashed: true,
        });
        _this._drawText(year, fromX, toY + Graph.GRID_LABEL_OFFSET, {
          align: 'center',
          baseLine: 'top',
        });

        prevGridLinePosition = offsetFromLeft;
      }
    });

    return this;
  };

  /**
   * Draws the grid.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawGrid = function (data) {
    this
      ._drawHorizontalGrid(data)
      ._drawVerticalGrid(data);

    return this;
  };

  /**
   * Draw the chart.
   *
   * @param {DataType} data
   * @private
   */
  Graph.prototype._drawChart = function (data) {
    const _this = this;
    const graphContainer = this._getGraphContainer();
    const scale = this._calculateScale(data);
    const centerY = graphContainer.top + (scale.maxDisplayedValue * scale.scaleY);
    const barWidth = scale.scaleX;

    data.data.forEach(function (item, i) {
      const barHeight = item.v * scale.scaleY;
      const fromX = graphContainer.left + (i * barWidth);

      _this._drawBar(fromX, centerY, barWidth, barHeight);
    });

    return this;
  };

  /**
   * The offset (horizontal or vertical) in pixels from an axis to a label.
   *
   * @type {number}
   */
  Graph.GRID_LABEL_OFFSET = 10;

  /**
   * The colors constants.
   *
   * @type {Object.<{axis: string, grid: string, barNegative: string, barPositive: string}>}
   */
  Graph.COLORS = {
    axis: '#fff',
    grid: 'rgba(255, 255, 255, 0.5)',
    barNegative: '#008cff',
    barPositive: '#ff2e1c',
  };

  return Graph;
})();
