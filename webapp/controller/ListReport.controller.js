sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageBox',
    'sap/m/Text',
    'sap/ui/core/Icon',
    'sap/m/ColumnListItem',
    'sap/m/RatingIndicator',
    'sap/m/ObjectNumber',
    'sap/m/ObjectStatus',
    'sap/m/MessageToast',
    'sap/ui/model/json/JSONModel',
  ],
  (
    BaseController,
    Filter,
    FilterOperator,
    MessageBox,
    Text,
    Icon,
    ColumnListItem,
    RatingIndicator,
    ObjectNumber,
    ObjectStatus,
    MessageToast,
    JSONModel,
  ) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ListReport', {
      onInit() {
        const oViewData = {
          statusTypes: ['OUT_OF_STOCK', 'OK', 'STORAGE', 'NONE'],
          productsCount: '',
        };
        this.getView().setModel(new JSONModel(oViewData), 'viewModel');
      },

      onProductsTableUpdateFinished(oEvent) {
        const iTotalItems = oEvent.getParameter('total');
        this.getView().getModel('viewModel').setProperty('/productsCount', iTotalItems);
      },

      createContentProducts(sId, oContext) {
        const sStatus = oContext.getProperty('Status');
        let oObjectStatus;
        switch (sStatus) {
          case 'OUT_OF_STOCK':
            oObjectStatus = new Icon({ src: 'sap-icon://alert', color: '#ff0000' });
            break;
          case 'OK':
            oObjectStatus = new Text({ text: 'OK' });
            break;
          case 'STORAGE':
            oObjectStatus = new ObjectStatus({ text: 'Storage', state: 'Warning', inverted: true });
            break;
          default:
            oObjectStatus = new Text({ text: 'None' });
        }
        return new ColumnListItem({
          type: 'Navigation',
          press: this.onPressNavigateToDetails.bind(this),
          cells: [
            new Text({ text: oContext.getProperty('Name') }),
            new Text({ text: oContext.getProperty('Specs'), maxLines: 3 }),
            new RatingIndicator({
              value: oContext.getProperty('Rating'),
              maxValue: 5,
              displayOnly: true,
            }),
            new Text({ text: oContext.getProperty('SupplierInfo'), maxLines: 3 }),
            new Text({ text: oContext.getProperty('MadeIn') }),
            new Text({ text: oContext.getProperty('ProductionCompanyName') }),
            new ObjectNumber({
              number: oContext.getProperty('Price_amount'),
              unit: oContext.getProperty('Price_currency'),
            }),
            oObjectStatus,
          ],
        });
      },

      onPressNavigateToDetails(oEvent) {
        const productId = oEvent.getSource().getBindingContext().getProperty('ID');
        this._navigate('ProductDetails', { productId });
      },

      onCreateProduct() {
        this._navigate('ProductDetails', { productId: crypto.randomUUID(), create: 'create' });
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
        const sRatingValue = this.byId('ratingProducts').getValue();
        const sValueMadeIn = this.byId('searchFieldMadeIn').getValue();
        const aFilter = [];
        aFilter.push(new Filter('Name', FilterOperator.Contains, sValueSearchField));
        aValueComboBox.forEach((oSelectedItem) => {
          aFilter.push(new Filter('Status', FilterOperator.EQ, oSelectedItem.getKey()));
        });
        aFilter.push(new Filter('Rating', FilterOperator.GE, sRatingValue));
        aFilter.push(new Filter('MadeIn', FilterOperator.Contains, sValueMadeIn));
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
              (selectedProduct) => selectedProduct.getBindingContext().getObject().ProductId,
            );
        } else {
          oDeleteButton.setEnabled(false);
        }
      },

      onDeleteProducts() {
        const oDataModel = this.getView().getModel();
        const oProductTable = this.byId('idProductsTable');
        const aSelectedProducts = oProductTable
          .getSelectedItems()
          .map((oSelectedProduct) => oSelectedProduct.getBindingContext().getObject());
        MessageBox.confirm(
          aSelectedProducts.length === 1
            ? this._i18n('productDeleteConfirmation', aSelectedProducts[0].Name)
            : this._i18n('productMultiDeleteConfirmation', aSelectedProducts.length),
          {
            action: [MessageBox.Action.OK],
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                aSelectedProducts.forEach((oSelectedProduct) => {
                  oDataModel.remove(`/Products('${oSelectedProduct.ID}')`, {
                    success: () => {
                      MessageToast.show(this._i18n('productDeleteSuccess'));
                    },
                  });
                });
              }
            },
          },
        );
      },

      onClearPress() {
        this.byId('searchFieldProducts').setValue('');
        this.byId('comboBoxProducts').removeAllSelectedItems();
        this.byId('ratingProducts').setValue('');
        this.byId('searchFieldMadeIn').setValue('');
        this.onSearchAction();
      },
    });
  },
);
