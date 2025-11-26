sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox',
    'productsreport/utils/formatter',
  ],
  (BaseController, JSONModel, MessageBox, Formatter) => {
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
        this.byId('deleteSelectedProductButton').setEnabled(true);
        this.byId('editSelectedProductButton').setEnabled(true);
        const oProductInfo = this.byId('productInfo');
        const sProductId = oEvent.getParameter('arguments').productId;
        const oSelectedProduct = this.getView()
          .getModel('data')
          .getProperty('/Products')
          .find((oProduct) => oProduct.ProductId === `${sProductId}`);
        const oViewModel = this.getView().getModel('viewModel');
        oViewModel.setProperty('/selectedProduct', oSelectedProduct);
        const oProductEdit = this.byId('productEdit').setVisible(false);
        oProductInfo.setVisible(true);
      },

      onDeleteProductPress() {
        const sProductDeleteConfirmationText = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('productDeleteConfirmation');

        const aProductModel = this.getView().getModel('data').getProperty('/Products');
        const oSelectedProductModel = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        const sFormattedTextSingleConfirmation = Formatter.formatProductsCount(
          sProductDeleteConfirmationText,
          oSelectedProductModel.ProductName,
        );

        MessageBox.confirm(sFormattedTextSingleConfirmation, {
          action: [MessageBox.Action.OK],
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              const aFilteredProductsModel = aProductModel.filter(
                (oProductModel) => oProductModel.ProductId !== oSelectedProductModel.ProductId,
              );
              this.getView().getModel('data').setProperty('/Products', aFilteredProductsModel);
              this._navigate('ListReport');
            }
          },
        });
      },

      async onEditPress() {
        this.byId('deleteSelectedProductButton').setEnabled(false);
        this.byId('editSelectedProductButton').setEnabled(false);
        const oSelectedProduct = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        const oProductInfo = this.byId('productInfo').setVisible(false);
        const oProductEdit = this.byId('productEdit').setVisible(true);

        // if (!this.oFragmentEdit) {
        //   this.oFragmentEdit = await this.loadFragment({
        //     name: 'productsreport.fragment.EditProductInfo',
        //   });
        // }
        // oProductInfo.addItem(this.oFragmentEdit);

        const oMultiInputEdit = this.byId('multiInputWithValueHelpEdit');

        oMultiInputEdit.destroyTokens();

        const aSelectedProductTokens = [];

        if (Array.isArray(oSelectedProduct.ProducerId)) {
          oSelectedProduct.ProducerId.forEach((sProducerId, index) => {
            const Token = new sap.m.Token({
              key: sProducerId,
              text: oSelectedProduct.ProducerName[index],
              selected: true,
            });
            aSelectedProductTokens.push(Token);
          });
        } else {
          const Token = new sap.m.Token({
            key: oSelectedProduct.ProducerId,
            text: oSelectedProduct.ProducerName,
            selected: true,
          });
          aSelectedProductTokens.push(Token);
        }

        oMultiInputEdit.setTokens(aSelectedProductTokens);
      },

      async handleValueHelpEdit() {
        const oSelectedProduct = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');
        const oMultiInputEdit = this.byId('multiInputWithValueHelpEdit');

        if (!this.oDialogEdit) {
          this.oDialogEdit = await this.loadFragment({
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

          const Tokens = oMultiInputEdit.getTokens();
          this.oDialogEdit.setTokens(Tokens);
          this.oDialogEdit.setTable(oTable);
        }

        this.oDialogEdit.update();
        this.oDialogEdit.open();
      },

      onMultiInputTokenUpdate(oEvent) {
        const oSelectedProduct = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');
        const oTokensRemoved = oEvent.getParameter('removedTokens')[0];
        const aSelectedTokens = this.byId('multiInputWithValueHelpEdit').getTokens();
        const aUpdatedTokens = aSelectedTokens.filter((token) => token.sId !== oTokensRemoved.sId);

        const aProducerId = [];
        const aProducerName = [];

        if (Array.isArray(aUpdatedTokens) && aUpdatedTokens.length >= 1) {
          aUpdatedTokens.forEach((oToken) => {
            aProducerId.push(oToken.getKey());
            aProducerName.push(oToken.getText());
            oSelectedProduct.ProducerName = aProducerName;
            oSelectedProduct.ProducerId = aProducerId;
          });
        } else if (aUpdatedTokens.length === 0) {
          oSelectedProduct.ProducerName = '';
          oSelectedProduct.ProducerId = '';
        } else {
          oSelectedProduct.ProducerName = aUpdatedTokens.getText();
          oSelectedProduct.ProducerId = aUpdatedTokens.getKey();
        }
        this.getView().getModel('viewModel').refresh();
        this.byId('multiInputWithValueHelpEdit').setTokens(aUpdatedTokens);
      },

      onValueHelpOkPress(oEvent) {
        const aTokens = oEvent.getParameter('tokens');
        const oMultiInput = this.byId('multiInputWithValueHelpEdit');
        const oSelectedProductModel = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        const aTokensNormalizedText = aTokens.map((oToken) =>
          oToken.setText(oToken.getText().slice(0, -4)),
        );

        const aProducerName = [];
        const aProducerId = [];

        aTokensNormalizedText.forEach((oToken) => {
          aProducerName.push(oToken.getText());
          aProducerId.push(oToken.getKey());
        });

        oSelectedProductModel.ProducerId = aProducerId;
        oSelectedProductModel.ProducerName = aProducerName;

        this.getView().getModel('viewModel').refresh();
        oMultiInput.setTokens(aTokensNormalizedText);
        this.oDialogEdit.setTokens(aTokensNormalizedText);
        this.oDialogEdit.close();
      },

      onCloseValueHelp() {
        this.oDialogEdit.close();
      },

      onAfterCloseValueHelp() {
        this.oDialogEdit.setTokens([]);
      },

      onSelectionChange(oEvent) {
        const aSelectedItems = oEvent.getSource().getSelectedItems();
        const aSelectedKeys = oEvent.getSource().getSelectedKeys();

        const oSelectedProduct = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        let aCategoryName = [];
        const aCategoryId = [];

        if (aSelectedItems.length >= 1) {
          aSelectedItems.forEach((oSelectedItems) => {
            aCategoryName.push(oSelectedItems.getText());
          });
        } else {
          aCategoryName = '';
        }

        oSelectedProduct.Category = aCategoryName;
        this.getView().getModel('viewModel').refresh();

        const oComboBox = this.byId('comboBoxEditProducts');
      },
    });
  },
);
