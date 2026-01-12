sap.ui.define(['sap/base/strings/formatMessage'], function (formatMessage) {
  'use strict';

  return {
    formatProductsCount: function (title, count) {
      return formatMessage(title, [count]);
    },
  };
});
