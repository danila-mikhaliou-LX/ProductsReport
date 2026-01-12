sap.ui.define(['sap/ui/core/UIComponent'], (UIComponent) => {
  'use strict';

  return UIComponent.extend('productsreport.Component', {
    metadata: {
      manifest: 'json',
      interfaces: ['sap.ui.core.IAsyncContentCreation'],
    },

    init() {
      // call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // enable routing
      this.getRouter().initialize();
    },
  });
});
