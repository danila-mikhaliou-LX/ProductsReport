sap.ui.define(['sap/ui/core/mvc/Controller'], (Controller) => {
  'use strict';

  return Controller.extend('productsreport.controller.BaseController', {
    onInit() { },

    _navigate(sPath, oParams) {
      this.getOwnerComponent().getRouter().navTo(sPath, oParams);
    },

    _i18n(sText, sParams) {
      return this.getView()
        .getModel('i18n')
        .getResourceBundle()
        .getText(sText, (sText, sParams ? [sParams] : []));
    },

    async _handleValueHelp(sMultiInputId) {
      if (!this.oDialog) {
        this.oDialog = await this.loadFragment({
          name: 'productsreport.fragment.ValueHelpDialog',
        });
        const oTable = new sap.ui.table.Table({
          visibleRowCount: 10,
          selectionMode: 'MultiToggle',
        });
        oTable.addColumn(
          new sap.ui.table.Column({
            label: new sap.m.Label({ text: '{i18n>producerName}' }),
            template: new sap.m.Text({ text: '{data>ProducerName}' }),
          }),
        );
        oTable.bindRows('data>/Producers');
        this.oDialog.setTable(oTable);
      }
      this.oDialog.setTokens(this.byId(sMultiInputId).getTokens());
      this.oDialog.update();
      this.oDialog.open();
    },
  });
});
