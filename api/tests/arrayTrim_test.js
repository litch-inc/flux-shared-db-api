'use strict';

const UtilityFunction = require('../functions/utility.function');

const array1 = [
  '01-----------------------------------------------------------------------------------------------------------------------------------------',
  '02-----------------------------------------------------------------------------------------------------------------------------------------',
  '03-----------------------------------------------------------------------------------------------------------------------------------------',
  '03-----------------------------------------------------------------------------------------------------------------------------------------',
  '04-----------------------------------------------------------------------------------------------------------------------------------------',
  '05-----------------------------------------------------------------------------------------------------------------------------------------',
  '06-----------------------------------------------------------------------------------------------------------------------------------------',
  '07-----------------------------------------------------------------------------------------------------------------------------------------',
  '08-----------------------------------------------------------------------------------------------------------------------------------------',
  '09-----------------------------------------------------------------------------------------------------------------------------------------',
  '10-----------------------------------------------------------------------------------------------------------------------------------------',
  '11-----------------------------------------------------------------------------------------------------------------------------------------',
  '12-----------------------------------------------------------------------------------------------------------------------------------------',
  '13-----------------------------------------------------------------------------------------------------------------------------------------',
  '14-----------------------------------------------------------------------------------------------------------------------------------------',
  '15-----------------------------------------------------------------------------------------------------------------------------------------',
  '16-----------------------------------------------------------------------------------------------------------------------------------------',
  '17-----------------------------------------------------------------------------------------------------------------------------------------',
  '18-----------------------------------------------------------------------------------------------------------------------------------------',
  '19-----------------------------------------------------------------------------------------------------------------------------------------',
  '20-----------------------------------------------------------------------------------------------------------------------------------------'
];

console.log(UtilityFunction.trimArrayToSize(array1, 1024));
