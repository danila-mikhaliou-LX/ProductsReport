sap.ui.define(['productsreport/controller/BaseController'], (BaseController) => {
  'use strict';

  return BaseController.extend('productsreport.controller.Details', {
    onInit() {
      const router = this.getOwnerComponent().getRouter();
      router.getRoute('Details').attachPatternMatched(this.onPatternMatched, this);
    },
    onPatternMatched(oEvent) {
      const productId = oEvent.getParameter('arguments').productId;
      const oModel = this.getView().getModel('data');
      const oSelectedProduct = oModel
        .getProperty('/Products')
        .find((el) => el.ProductId === `${productId}`);
      const oAppJSONModel = this.getOwnerComponent().getModel('appJSONModel');
      oAppJSONModel.setProperty('/selectedProduct', oSelectedProduct);
      const oProduct = oAppJSONModel.getProperty('/selectedProduct');
      console.log(oProduct.Suppliers);
    },
  });
});
