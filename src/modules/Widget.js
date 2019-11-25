const Widget = (function () {
  'use strict';

  function Widget(config) {
    this.$block = document.querySelector(Widget.selectors.block);
    this.$elems = {
      dataTypesSelector: this.$block.querySelector(Widget.selectors.elems.dataTypesSelector),
      filters: this.$block.querySelector(Widget.selectors.elems.filters),
      viewport: this.$block.querySelector(Widget.selectors.elems.viewport),
    };

    config = config || {};

    this.dataTypes = config.dataTypes;

    if (!this.dataTypes) {
      throw new TypeError('Required parameter "dataTypes" for Widget was missed.');
    }

    this.yearsRange = config.yearsRange || [];

    if (!Array.isArray(this.dataTypes)) {
      throw new TypeError('Required parameter "yearsRange" should be an array.');
    }

    this.dataProvider = new DataProvider({
      routes: this.dataTypes.reduce(function (result, dataType) {
        result[dataType.alias] = dataType.route;

        return result;
      }, {}),
    });
    this.graph = new Graph(this.$elems.viewport);

    this._handleChangeDataType = this._handleChangeDataType.bind(this);
    this._handleChangeFilter = this._handleChangeFilter.bind(this);

    this._init();
  }

  /**
   * @private
   */
  Widget.prototype._init = function () {
    this.$elems.dataTypesSelector.innerHTML = Widget.templates.renderDataTypesSelector(this.dataTypes);
    this.$elems.dataTypesSelector.onchange = this._handleChangeDataType;

    const yearFrom = this.yearsRange[0];
    const yearTo = this.yearsRange[1];
    const renderYearSelect = function (name, selectedValue) {
      return Widget.templates.renderFilterYear(name, yearFrom, yearTo, selectedValue);
    };

    this.$elems.filters.innerHTML = renderYearSelect('from', yearFrom) + renderYearSelect('to', yearTo);

    this.$elems.filters.onchange = this._handleChangeFilter;

    this._drawChart();
  };

  /**
   * @returns {string}
   * @private
   */
  Widget.prototype._getDataType = function () {
    const $dataTypeControl = Array.prototype.find.call(
      this.$block.querySelectorAll(Widget.selectors.elems.dataTypeControl),
      function ($dataTypeControl) {
        return $dataTypeControl.checked;
      }
    );

    return $dataTypeControl.value;
  };

  /**
   * @private
   */
  Widget.prototype._setFilters = function (filters) {
    const _this = this;
    let lastUpdatedElement;

    Object.keys(filters).forEach(function (name) {
      const value = filters[name];
      const element = Array.prototype.filter.call(_this.$elems.filters, function (element) {
        return (element.name === name);
      })[0];

      if (!element) {
        return;
      }

      const prevValue = element.value;

      if (filters[name] === prevValue) {
        return;
      }

      element.value = filters[name];
      lastUpdatedElement = element;
    });

    if (lastUpdatedElement) {
      lastUpdatedElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  /**
   * @returns {Object}
   * @private
   */
  Widget.prototype._getFilters = function () {
    return Array.prototype.reduce.call(this.$elems.filters.elements, function (result, element) {
      if (element.value) {
        result[element.name] = element.value;

        return result;
      }

      return result;
    }, {});
  };

  /**
   * @private
   */
  Widget.prototype._handleChangeDataType = function () {
    this._drawChart();
  };

  /**
   * @private
   */
  Widget.prototype._handleChangeFilter = function (event) {
    if (Array.prototype.includes.call(this.$elems.filters, event.target)) {
      const filters = this._getFilters();

      if (filters.from > filters.to) {
        filters.from = filters.to;

        this._setFilters(filters);
      }

      this._drawChart();
    }
  };

  /**
   * @private
   */
  Widget.prototype._drawChart = function () {
    const _this = this;

    this.dataProvider.getData(this._getDataType(), this._getFilters(), function (error, data) {
      if (error) {
        _this._renderError(error);
      } else {
        _this.graph.draw(data);
      }
    });
  };

  Widget.prototype._renderError = function (error) {
    console.log(error); // @todo Map and output the error.
  };

  Widget.selectors = {
    block: '.widget',
    elems: {
      dataTypeControl: '.widget__data-type-control',
      dataTypesSelector: '.widget__data-types-selector',
      filters: '.widget__filters',
      viewport: '.widget__viewport',
    },
  };

  Widget.templates = {
    renderDataTypesSelector: function (types) {
      return '' +
        '<ul class="widget__data-types">' +
          types
            .map(function (type, index) {
              return '' +
                '<li class="widget__data-type">' +
                  '<input' +
                    (index === 0 ? ' checked="checked"' : '') +
                    ' class="widget__data-type-control"' +
                    ' id="type.' + type.alias + '"' +
                    ' name="type"' +
                    ' type="radio"' +
                    ' value="' + type.alias + '">' +
                  '<label' +
                    ' class="widget__data-type-label"' +
                    ' for="type.' + type.alias + '">' +
                    type.label +
                  '</label>' +
                '</li>';
            })
            .join('') +
        '</ul>';
    },
    renderFilterYear: function (name, from, to, selectedValue) {
      const years = [];

      for (let year = Number(from); year <= Number(to); year++) {
        years.push(year);
      }

      return '' +
        '<select class="widget__filter" name="' + name + '">' +
          years
            .map(function (year) {
              return '' +
                '<option' +
                  (year === selectedValue ? ' selected="selected"' : '') +
                  ' value="' + year + '">' +
                  year +
                '</option>';
            })
            .join('') +
        '</select>';
    },
  };

  return Widget;
})();
