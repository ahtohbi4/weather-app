window.addEventListener('load', function () {
  'use strict';

  new Widget({
    dataTypes: [
      {
        alias: 'temperature',
        label: 'Температура',
        route: '/data/temperature.json',
      },
      {
        alias: 'precipitation',
        label: 'Осадки',
        route: '/data/precipitation.json',
      },
    ],
    yearsRange: [1881, 2006],
  });
});
