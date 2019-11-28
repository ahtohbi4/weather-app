window.addEventListener('load', function () {
  'use strict';

  new Widget({
    dataTypes: [
      {
        alias: 'temperature',
        label: 'Температура',
        route: 'data/temperature.json',
        units: '°C',
      },
      {
        alias: 'precipitation',
        label: 'Осадки',
        route: 'data/precipitation.json',
        units: '%',
      },
    ],
    yearsRange: [1881, 2006],
  });
});
