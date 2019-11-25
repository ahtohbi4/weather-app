const Graph = (function () {
  'use strict';

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
   * @param data
   */
  Graph.prototype.draw = function (data) {
    this._clear();

    this._drawChart(data);
    this._drawAxis(data);
  };

  Graph.prototype._init = function () {
    this._updateSize();
  };

  Graph.prototype._updateSize = function () {
    const containerSize = this.canvas.canvas.parentNode.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.canvas.width = containerSize.width * devicePixelRatio;
    this.canvas.canvas.style.width = String(containerSize.width) + 'px';
    this.canvas.canvas.height = containerSize.height * devicePixelRatio;
    this.canvas.canvas.style.height = String(containerSize.height) + 'px';
    this.canvas.scale(devicePixelRatio, devicePixelRatio);
  };

  Graph.prototype._getSize = function () {
    const rect = this.canvas.canvas.getBoundingClientRect();

    return {
      height: rect.height,
      width: rect.width,
    };
  };

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

  Graph.prototype._clear = function () {
    const size = this._getSize();

    this.canvas.clearRect(0, 0, size.width, size.height);
  };

  Graph.prototype._drawBar = function (x, y, width, height) {
    const isPositive = (height >= 0);
    const color = isPositive ? Graph.COLORS.positive : Graph.COLORS.negative;
    const fromX = x;
    const fromY = isPositive ? (y - height) : y;

    this.canvas.fillStyle = color;
    this.canvas.fillRect(fromX, fromY, width, Math.abs(height));
  };

  Graph.prototype._drawLine = function (fromX, fromY, toX, toY) {
    this.canvas.beginPath();
    this.canvas.moveTo(fromX, fromY);
    this.canvas.lineTo(toX, toY);
    this.canvas.strokeStyle = Graph.COLORS.axis;
    this.canvas.stroke();
  };

  Graph.prototype._drawText = function (text, x, y) {
    this.canvas.fillStyle = Graph.COLORS.axis;
    this.canvas.fillText(text, x, y);
  };

  Graph.prototype._calculateScale = function (data) {
    const graphContainer = this._getGraphContainer();

    const amplitude = Math.max(Math.abs(data.meta.minValue), Math.abs(data.meta.maxValue));

    return {
      amplitude: amplitude,
      scaleY: (graphContainer.height / 2) / amplitude,
    };
  };

  Graph.prototype._drawAxisX = function (data) {
    const graphContainer = this._getGraphContainer();
    const fromX = graphContainer.left;
    const fromY = graphContainer.top + (graphContainer.height / 2);
    const toX = graphContainer.left + graphContainer.width;
    const toY = fromY;

    this._drawLine(fromX, fromY, toX, toY);
  };

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

  Graph.prototype._drawAxis = function (data) {
    this._drawAxisX(data);
    this._drawAxisY(data);
  };

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
