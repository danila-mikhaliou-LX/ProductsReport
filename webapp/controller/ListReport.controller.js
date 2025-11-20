sap.ui.define(['productsreport/controller/BaseController'], (BaseController) => {
  'use strict';

  return BaseController.extend('productsreport.controller.ListReport', {
    onInit() {},
    onPressNavigateToDetails(oEvent) {
      const productId = oEvent.getSource().getBindingContext('data').getProperty('ProductId');
      this.getOwnerComponent().getRouter().navTo('Details', { productId });
    },
  });
});
