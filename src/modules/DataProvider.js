const DataProvider = (function () {
  'use strict';

  /**
   * @callback getDataCallback
   * @param {ErrorEvent|null} error
   * @param {*} [data]
   */

  /**
   * @class
   */
  function DataProvider(config = {}) {
    this.routes = config.routes;

    this.dataProcessor = null;
  }

  /**
   * Provides a data.
   *
   * @param {string} dataType - Type of data.
   * @param {Object} filters - Filters for data.
   * @param {getDataCallback} cb - The callback that handles the response.
   */
  DataProvider.prototype.getData = function (dataType, filters, cb) {
    this._terminate();

    const _this = this;

    this.dataProcessor = new Worker(DataProvider.WORKER_PATH);
    this.dataProcessor.addEventListener('error', function (error) {
      cb(error);

      _this._terminate();
    });
    this.dataProcessor.addEventListener('message', function (event) {
      const payload = event.data.payload;
      const status = event.data.status;

      switch (status) {
        case 'ERROR': {
          cb(payload);
          break;
        }

        case 'SUCCESS':
        default: {
          cb(null, payload);
        }
      }

      _this._terminate();
    });

    this
      ._dispatch('CONFIG', {
        routes: this.routes,
      })
      ._dispatch('GET_DATA', {
        dataType: dataType,
        filters: filters,
      });
  };

  /**
   * Dispatches action with a payload to the worker.
   *
   * @param {'CONFIG'|'GET_DATA'|'TERMINATE'} action - A type of action.
   * @param {Object} [payload] - A payload to the action.
   * @private
   */
  DataProvider.prototype._dispatch = function (action, payload) {
    this.dataProcessor.postMessage({
      action: action,
      payload: payload,
    });

    return this;
  };

  /**
   * Terminates a started worker.
   *
   * @private
   */
  DataProvider.prototype._terminate = function () {
    if (this.dataProcessor) {
      this._dispatch('TERMINATE');

      this.dataProcessor = null;
    }

    return this;
  };

  DataProvider.WORKER_PATH = 'utils/dataProcessor.js';

  return DataProvider;
})();
