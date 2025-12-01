sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageBox',
  ],
  (BaseController, Filter, FilterOperator, MessageBox) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ListReport', {
      onInit() {},

      onPressNavigateToDetails(oEvent) {
        const productId = oEvent.getSource().getBindingContext('data').getProperty('ProductId');
        this._navigate('ProductDetails', { productId });
      },

      async handleValueHelp() {
        await this._handleValueHelp('multiInputWithValueHelp');
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
            new Filter('ProducerId', FilterOperator.Contains, oValueMultiInput.getKey()),
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
        const oDeleteButton = this.byId('deleteProductBtn');
        if (oEvent.getSource().getSelectedItems().length) {
          oDeleteButton.setEnabled(true);

          oEvent
            .getSource()
            .getSelectedItems()
            .forEach(
              (selectedProduct) => selectedProduct.getBindingContext('data').getObject().ProductId,
            );
        } else {
          oDeleteButton.setEnabled(false);
        }
      },

      onDeleteProducts() {
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

        MessageBox.confirm(
          aSelectedProducts.length === 1
            ? this._i18n('productDeleteConfirmation', aSelectedProducts[0].ProductName)
            : this._i18n('productMultiDeleteConfirmation', aSelectedProducts.length),
          {
            action: [MessageBox.Action.OK],
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oProductModel.setProperty('/Products', aProducts),
                  oProductTable.removeSelections(true);
              }
            },
          },
        );
      },

      onClearPress() {
        this.byId('searchFieldProducts').clear();
        this.byId('comboBoxProducts').removeAllSelectedItems();
        this.byId('comboBoxProducts').removeSelectedKeys();
        this.byId('multiInputWithValueHelp').destroyTokens();
        this.onSearchAction();
      },
    });
  },
);
