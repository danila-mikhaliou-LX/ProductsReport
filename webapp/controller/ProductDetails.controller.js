sap.ui.define(
  ['productsreport/controller/BaseController', 'sap/ui/model/json/JSONModel'],
  (BaseController, JSONModel) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ProductDetails', {
      onInit() {
        const oViewData = {
          selectedProduct: {},
        };
        this.getView().setModel(new JSONModel(oViewData), 'viewModel');
        this.getOwnerComponent()
          .getRouter()
          .getRoute('ProductDetails')
          .attachPatternMatched(this.onPatternMatched, this);
      },

      onPatternMatched(oEvent) {
        const sProductId = oEvent.getParameter('arguments').productId;
        const oSelectedProduct = this.getView()
          .getModel('data')
          .getProperty('/Products')
          .find((oProduct) => oProduct.ProductId === `${sProductId}`);
        const oViewModel = this.getView().getModel('viewModel');
        oViewModel.setProperty('/selectedProduct', oSelectedProduct);
      },
    });
  },
);
