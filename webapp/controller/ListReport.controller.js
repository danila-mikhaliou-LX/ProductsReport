sap.ui.define(['productsreport/controller/BaseController'], (BaseController) => {
  'use strict';

  return BaseController.extend('productsreport.controller.ListReport', {
    onInit() {},

    onPressNavigateToDetails(oEvent) {
      const productId = oEvent.getSource().getBindingContext('data').getProperty('ProductId');
      this._navigate('ProductDetails', { productId });
    },

    async handleValueHelp() {
      if (!this.oDialog) {
        this.oDialog = await this.loadFragment({
          name: 'productsreport.fragment.ValueHelpDialog',
        });

        const oTable = new sap.ui.table.Table({
          visibleRowCount: 10,
          selectionMode: 'Multi',
        });

        oTable.addColumn(
          new sap.ui.table.Column({
            label: new sap.m.Label({ text: 'Producer Name' }),
            template: new sap.m.Text({ text: '{data>ProducerName}' }),
          }),
        );

        oTable.bindRows('data>/Producers');

        this.oDialog.setTable(oTable);
      }

      this.oDialog.setTokens(this.byId('multiInputWithValueHelp').getTokens());
      this.oDialog.update();
      this.oDialog.open();
    },

    onValueHelpOkPress(oEvent) {
      const aTokens = oEvent.getParameter('tokens');
      const oMultiInput = this.byId('multiInputWithValueHelp');
      oMultiInput.setTokens(aTokens);
      this.oDialog.close();
    },

    onCloseValueHelp() {
      this.oDialog.close();
    },

    onAfterCloseValueHelp() {
      this.oDialog.setTokens([]);
    },

    onMultiInputTokenUpdate(oEvent) {
      const aTokensRemoved = oEvent.getParameter('removedTokens')[0];
      const aSelectedTokens = this.byId('multiInputWithValueHelp').getTokens();
      const updatedTokens = aSelectedTokens.filter((token) => token.sId !== aTokensRemoved.sId);
      this.byId('multiInputWithValueHelp').setTokens(updatedTokens);
    },
  });
});
