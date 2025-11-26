sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageBox',
    'productsreport/utils/formatter',
  ],
  (BaseController, Filter, FilterOperator, MessageBox, Formatter) => {
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
        this.onSearchAction();
      },

      onCloseValueHelp() {
        this.oDialog.close();
      },

      onAfterCloseValueHelp() {
        this.oDialog.setTokens([]);
      },

      onSearchAction() {
        const sValueSearchField = this.byId('searchFieldProducts').getValue();
        const aValueComboBox = this.byId('comboBoxProducts').getSelectedItems();
        const aValueMultiInput = this.byId('multiInputWithValueHelp').getTokens();

        const aFilter = [];

        aFilter.push(new Filter('ProductName', FilterOperator.Contains, sValueSearchField));
        aValueComboBox.forEach((oValueComboBox) =>
          aFilter.push(new Filter('Category', FilterOperator.EQ, oValueComboBox.getText())),
        );
        aValueMultiInput.forEach((oValueMultiInput) =>
          aFilter.push(
            new Filter('ProducerName', FilterOperator.EQ, oValueMultiInput.getText().slice(0, -4)),
          ),
        );
        this.byId('idProductsTable').getBinding('items').filter(aFilter);
      },

      onMultiInputTokenUpdate(oEvent) {
        const oTokensRemoved = oEvent.getParameter('removedTokens')[0];
        const aSelectedTokens = this.byId('multiInputWithValueHelp').getTokens();
        const aUpdatedTokens = aSelectedTokens.filter((token) => token.sId !== oTokensRemoved.sId);

        this.byId('multiInputWithValueHelp').setTokens(aUpdatedTokens);
        this.onSearchAction();
      },

      onSelectionChange(oEvent) {
        if (oEvent.getSource().getSelectedItems().length) {
          const oDeleteButton = this.byId('deleteProductBtn').setEnabled(true);

          oEvent
            .getSource()
            .getSelectedItems()
            .forEach(
              (selectedProduct) => selectedProduct.getBindingContext('data').getObject().ProductId,
            );
        } else {
          const oDeleteButton = this.byId('deleteProductBtn').setEnabled(false);
        }
      },

      onDeleteProducts() {
        const sProductDeleteConfirmationText = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('productDeleteConfirmation');
        const sProductMultiDeleteConfirmationText = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('productMultiDeleteConfirmation');
        const oProductModel = this.getView().getModel('data');
        const oProductTable = this.byId('idProductsTable');
        const aSelectedProducts = oProductTable
          .getSelectedItems()
          .map((oSelectedProduct) => oSelectedProduct.getBindingContext('data').getObject());

        let aProducts = oProductModel.getProperty('/Products');

        aSelectedProducts.forEach(
          (oSelectedProduct) =>
            (aProducts = aProducts.filter(
              (oProduct) => oProduct.ProductId !== oSelectedProduct.ProductId,
            )),
        );

        const sFormattedTextSingleConfirmation = Formatter.formatProductsCount(
          sProductDeleteConfirmationText,
          aSelectedProducts[0].ProductName,
        );

        const sFormattedTextMultiConfirmation = Formatter.formatProductsCount(
          sProductMultiDeleteConfirmationText,
          aSelectedProducts.length,
        );

        if (aSelectedProducts.length === 1) {
          MessageBox.confirm(sFormattedTextSingleConfirmation, {
            action: [MessageBox.Action.OK],
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oProductModel.setProperty('/Products', aProducts),
                  oProductTable.removeSelections(true);
              }
            },
          });
        } else {
          MessageBox.confirm(sFormattedTextMultiConfirmation, {
            action: [MessageBox.Action.OK],
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oProductModel.setProperty('/Products', aProducts),
                  oProductTable.removeSelections(true);
              }
            },
          });
        }
      },
    });
  },
);
