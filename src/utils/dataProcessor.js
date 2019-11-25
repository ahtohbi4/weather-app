'use strict';

/**
 * @class
 */
function Store() {
  this.routes = null;
}

Store.prototype.config = function (config) {
  this.routes = config.routes;
};

/**
 * Requests data from the storage or the server.
 *
 * @param {string} dataType
 * @param {Object} [filters={}]
 * @param {function} cb
 */
Store.prototype.getData = function (dataType, filters, cb) {
  if (this.routes === null) {
    cb({ code: 'UNCONFIGURED_STORAGE' });

    return;
  }

  const route = this.routes[dataType];

  if (!route) {
    cb({ code: 'UNKNOWN_DATA_TYPE' });

    return;
  }

  filters = filters || {};

  if (indexedDB) {
    this._getStoredData(dataType, filters, cb);
  } else {
    this._fetchData(route, function (error, data) {
      if (error) {
        cb(error);
      } else {
        cb(null, Store.processData(data)); // @todo <- Filter the data.
      }
    });
  }
};

Store.prototype._getStoredData = function (dataType, filters, cb) {
  const _this = this;
  const openedDB = indexedDB.open(Store.DB_NAME, 1);

  openedDB.addEventListener('upgradeneeded', function (event) {
    const db = event.target.result;

    Object.keys(_this.routes).forEach(function (route) {
      if (!db.objectStoreNames.contains(route)) {
        db
          .createObjectStore(route, { keyPath: 't' })
          .createIndex('date', 't', { unique: true });
      }
    });
  });

  openedDB.addEventListener('error', function () {
    cb({
      code: 'UNKNOWN_ERROR',
      details: openedDB.error,
    });
  });

  openedDB.addEventListener('success', function (event) {
    const db = event.target.result;
    const objectStore = db
      .transaction(dataType, 'readonly')
      .objectStore(dataType);
    const countRequest = objectStore.count();

    countRequest.addEventListener('success', function (event) {
      const count = event.target.result;

      if (count === 0) {
        _this._fetchData(_this.routes[dataType], function (error, response) {
          if (error) {
            cb(error);

            return;
          }

          const objectStore = db
            .transaction(dataType, 'readwrite')
            .objectStore(dataType);

          response.forEach(function (item) {
            objectStore.add(item);
          });

          const dataRequest = objectStore.getAll(Store.getKeyRange(filters));

          dataRequest.addEventListener('success', function (event) {
            cb(null, Store.processData(event.target.result));
          });
        });
      } else {
        const dataRequest = objectStore.getAll(Store.getKeyRange(filters));

        dataRequest.addEventListener('success', function (event) {
          cb(null, Store.processData(event.target.result));
        });
      }
    });
  });
};

Store.prototype._fetchData = function (route, cb) {
  const xhr = new XMLHttpRequest();

  xhr.open('GET', route);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send();
  xhr.addEventListener('readystatechange', function () {
    if (this.readyState !== 4) {
      return;
    }

    if (this.status !== 200) {
      cb({
        code: 'NETWORK_ERROR',
        details: {
          status: this.status,
          statusText: this.statusText,
        },
      });
    } else {
      cb(null, JSON.parse(this.responseText));
    }
  });
};

Store.DB_NAME = 'weather';

Store.getKeyRange = function (filters) {
  const lowerBound = filters.from;
  const upperBound = filters.to ? (filters.to + 1) : filters.to;

  if (lowerBound && upperBound) {
    return IDBKeyRange.bound(lowerBound, upperBound, true, false);
  }

  if (lowerBound) {
    return IDBKeyRange.upperBound(lowerBound, true);
  }

  if (upperBound) {
    return IDBKeyRange.lowerBound(upperBound, false);
  }

  return undefined;
};

Store.processData = function (data) {
  data = data || [];

  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  data.forEach(function (item) {
    minValue = Math.min(minValue, item.v);
    maxValue = Math.max(maxValue, item.v);
  });

  return {
    data: data,
    meta: {
      minValue: minValue,
      maxValue: maxValue,
    },
  };
};

const storage = new Store();

self.addEventListener('message', function (event) {
  const action = event.data.action;

  switch (action) {
    case 'CONFIG': {
      const routes = event.data.payload.routes;
      storage.config({ routes: routes });

      break;
    }

    case 'GET_DATA': {
      const payload = event.data.payload;
      const dataType = payload.dataType;
      const filters = payload.filters || {};

      storage.getData(dataType, filters, function (error, data) {
        if (error) {
          self.postMessage({ status: 'ERROR', payload: error });
        } else {
          self.postMessage({ status: 'SUCCESS', payload: data });
        }
      });

      break;
    }

    case 'TERMINATE': {
      self.close();
      break;
    }

    default:
      break;
  }
});
