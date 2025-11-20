sap.ui.define(['productsreport/controller/BaseController'], (BaseController) => {
  'use strict';

  return BaseController.extend('productsreport.controller.Details', {
    onInit() {
      const router = this.getOwnerComponent().getRouter();
      router.getRoute('Details').attachPatternMatched(this.onPatternMatched, this);
    },
    onPatternMatched(oEvent) {
      const productId = oEvent.getParameter('arguments');
    },
  });
});
