const Widget = (function () {
  'use strict';

  function Widget(config) {
    this.$block = document.querySelector(Widget.selectors.block);
    this.$elems = {
      dataTypesSelector: this.$block.querySelector(Widget.selectors.elems.dataTypesSelector),
      error: this.$block.querySelector(Widget.selectors.elems.error),
      filters: this.$block.querySelector(Widget.selectors.elems.filters),
      loader: this.$block.querySelector(Widget.selectors.elems.loader),
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

    const _this = this;
    const yearFrom = this.yearsRange[0];
    const yearTo = this.yearsRange[1];
    const renderYearSelect = function (name, label, selectedValue) {
      return Widget.templates.renderFilterYear({
        label: label,
        name: name,
        range: _this.yearsRange,
        selectedValue: selectedValue,
      });
    };

    this.$elems.filters.innerHTML =
      renderYearSelect('from', 'За период с (год)', yearFrom) +
      renderYearSelect('to', 'по (год)',  yearTo);

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

  Widget.prototype._showLoader = function () {
    this.$elems.loader.classList.remove(Widget.classNames.isHidden);
  };

  Widget.prototype._hideLoader = function () {
    this.$elems.loader.classList.add(Widget.classNames.isHidden);
  };

  /**
   * @private
   */
  Widget.prototype._drawChart = function () {
    const _this = this;

    this._showLoader();

    this.dataProvider.getData(this._getDataType(), this._getFilters(), function (error, data) {
      if (error) {
        _this._renderError(error);
      } else {
        _this.graph.draw(data);
      }

      _this._hideLoader();
    });
  };

  Widget.prototype._renderError = function (error) {
    const code = error.code;
    const message = code ? code : error.message;

    this.$elems.error.innerHTML = 'Ошибка: ' + message;
  };

  Widget.classNames = {
    isHidden: 'is-hidden',
  };

  Widget.selectors = {
    block: '.widget',
    elems: {
      dataTypeControl: '.widget__data-type-control',
      dataTypesSelector: '.widget__data-types-selector',
      error: '.widget__error',
      filters: '.widget__filters',
      loader: '.widget__loader',
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
                '<li class="widget__data-type widget__data-type_type_' + type.alias + '">' +
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
    renderFilterYear: function (params) {
      const years = [];
      const range = params.range;

      for (let year = Number(range[0]); year <= Number(range[1]); year++) {
        years.push(year);
      }

      return '' +
        '<select' +
          ' class="widget__filter" name="' + params.name + '"' +
          ' aria-label="' + params.label + '">' +
          years
            .map(function (year) {
              return '' +
                '<option' +
                  (year === params.selectedValue ? ' selected="selected"' : '') +
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
