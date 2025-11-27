sap.ui.define(['sap/ui/core/mvc/Controller'], (Controller) => {
  'use strict';

  return Controller.extend('productsreport.controller.BaseController', {
    onInit() {},

    _navigate(sPath, oParams) {
      this.getOwnerComponent().getRouter().navTo(sPath, oParams);
    },
  });
});
