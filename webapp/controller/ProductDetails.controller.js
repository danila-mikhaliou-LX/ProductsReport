sap.ui.define(
  ['productsreport/controller/BaseController', 'sap/ui/model/json/JSONModel', 'sap/m/MessageBox'],
  (BaseController, JSONModel, MessageBox) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ProductDetails', {
      onInit() {
        const oViewData = {
          selectedProduct: {},
          initialSelectedProduct: {},
          editMode: false,
        };
        this.getView().setModel(new JSONModel(oViewData), 'viewModel');
        this.getOwnerComponent()
          .getRouter()
          .getRoute('ProductDetails')
          .attachPatternMatched(this.onPatternMatched, this);
      },

      onPatternMatched(oEvent) {
        this.getView().getModel('viewModel').setProperty('/editMode', false);

        const sProductId = oEvent.getParameter('arguments').productId;
        const oSelectedProduct = this.getView()
          .getModel('data')
          .getProperty('/Products')
          .find((oProduct) => oProduct.ProductId === `${sProductId}`);

        const oViewModel = this.getView().getModel('viewModel');

        oViewModel.setProperty('/selectedProduct', oSelectedProduct);
        oViewModel.setProperty('/initialSelectedProduct', { ...oSelectedProduct });
      },

      onDeleteProductPress() {
        const aProductModel = this.getView().getModel('data').getProperty('/Products');
        const oSelectedProductModel = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        MessageBox.confirm(
          this._i18n('productDeleteConfirmation', oSelectedProductModel.ProductName),
          {
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
          },
        );
      },

      onEditPress() {
        const oViewModel = this.getView().getModel('viewModel');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const oMultiInputEdit = this.byId('multiInputWithValueHelpEdit');
        oViewModel.setProperty('/editMode', true);

        const aSelectedProductTokens = [];

        if (oInitialSelectedProduct.ProducerId) {
          oInitialSelectedProduct.ProducerId.split(', ').forEach((sProducerId, index) => {
            const Token = new sap.m.Token({
              key: sProducerId,
              text: oInitialSelectedProduct.ProducerName.split(', ')[index],
              selected: true,
            });
            aSelectedProductTokens.push(Token);
          });
        }

        oMultiInputEdit.setTokens(aSelectedProductTokens);
      },

      async handleValueHelp() {
        await this._handleValueHelp('multiInputWithValueHelpEdit');
      },

      onMultiInputTokenUpdate(oEvent) {
        const oViewModel = this.getView().getModel('viewModel');
        const oMultiInputEdit = this.byId('multiInputWithValueHelpEdit');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');

        const oTokensRemoved = oEvent.getParameter('removedTokens')[0];
        const aSelectedTokens = oMultiInputEdit.getTokens();
        const aUpdatedTokens = aSelectedTokens.filter((token) => token.sId !== oTokensRemoved.sId);

        const aProducerId = [];
        const aProducerName = [];

        if (Array.isArray(aUpdatedTokens) && aUpdatedTokens.length >= 1) {
          aUpdatedTokens.forEach((oToken) => {
            aProducerId.push(oToken.getKey());
            aProducerName.push(oToken.getText());
            oInitialSelectedProduct.ProducerName = aProducerName
              .join(', ')
              .replace(/\s*\(\d+\)/g, '');
            oInitialSelectedProduct.ProducerId = aProducerId.join(', ');
          });
        } else {
          oInitialSelectedProduct.ProducerName = aUpdatedTokens.length
            ? aUpdatedTokens.getText()
            : '';
          oInitialSelectedProduct.ProducerId = aUpdatedTokens.length ? aUpdatedTokens.getKey() : '';
        }
        oViewModel.refresh();
        oMultiInputEdit.setTokens(aUpdatedTokens);
      },

      onValueHelpOkPress(oEvent) {
        const aTokens = oEvent.getParameter('tokens');
        const oMultiInput = this.byId('multiInputWithValueHelpEdit');
        const oViewModel = this.getView().getModel('viewModel');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');

        const aProducerName = [];
        const aProducerId = [];

        aTokens.forEach((oToken) => {
          aProducerName.push(oToken.getText());
          aProducerId.push(oToken.getKey());
        });

        oInitialSelectedProduct.ProducerId = aProducerId.join(', ');
        oInitialSelectedProduct.ProducerName = aProducerName.join(', ').replace(/\s*\(\d+\)/g, '');

        oViewModel.refresh();
        oMultiInput.setTokens(aTokens);
        this.oDialog.setTokens(aTokens);
        this.oDialog.close();
      },

      onCloseValueHelp() {
        this.oDialog.close();
      },

      onAfterCloseValueHelp() {
        this.oDialog.setTokens([]);
      },

      onSelectionChange(oEvent) {
        const oViewModel = this.getView().getModel('viewModel');
        const aSelectedItems = oEvent.getSource().getSelectedItems();
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');

        let aCategoryName = [];

        if (aSelectedItems.length >= 1) {
          aSelectedItems.forEach((oSelectedItems) => {
            aCategoryName.push(oSelectedItems.getText());
          });
        } else {
          aCategoryName = '';
        }

        oInitialSelectedProduct.Category = aCategoryName;
        oViewModel.refresh();
      },

      onPressCancelEdit() {
        const oViewModel = this.getView().getModel('viewModel');

        MessageBox.confirm(this._i18n('resetAllChangesConfirmation'), {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              oViewModel.setProperty('/editMode', false);

              oViewModel.setProperty(
                '/initialSelectedProduct',
                oViewModel.getProperty('/selectedProduct'),
              );
            }
          },
        });
      },

      onPressOkEdit() {
        const oViewModel = this.getView().getModel('viewModel');
        const oData = this.getView().getModel('data');

        oViewModel.setProperty('/editMode', false);

        const aProducts = oData.getProperty('/Products');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        oViewModel.setProperty('/selectedProduct', { ...oInitialSelectedProduct });
        const oSelectedProduct = oViewModel.getProperty('/selectedProduct');

        const aFilteredProducts = aProducts.filter(
          (oProduct) => oProduct.ProductId !== oSelectedProduct.ProductId,
        );
        aFilteredProducts.push(oSelectedProduct);
        oData.setProperty('/Products', [...aFilteredProducts]);
        oData.refresh();
      },

      onPressDeleteSupplier() {
        const oViewModel = this.getView().getModel('viewModel');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const oSuppliersTable = this.byId('suppliersTable');

        let aSupplier = oInitialSelectedProduct.Suppliers;

        const aSelectedSuppliers = oSuppliersTable
          .getSelectedItems()
          .map(
            (oSelectedSupplier) =>
              oSelectedSupplier.getBindingContext('viewModel').getObject().SupplierId,
          );

        MessageBox.confirm(
          aSelectedSuppliers.length === 1
            ? this._i18n(
                'supplierDeleteConfirmation',
                oSuppliersTable.getSelectedItems()[0].getBindingContext('viewModel').getObject()
                  .SupplierName,
              )
            : this._i18n('supplierMultiDeleteConfirmation', aSelectedSuppliers.length),
          {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                aSelectedSuppliers.forEach((sSupplierId) => {
                  aSupplier = aSupplier.filter((oSupplier) => oSupplier.SupplierId !== sSupplierId);
                });
                oInitialSelectedProduct.Suppliers = [...aSupplier];
                oSuppliersTable.removeSelections();
                oViewModel.refresh();
              }
            },
          },
        );
      },

      onSelectionSuppliersChange(oEvent) {
        const oDeleteSupplierButton = this.byId('deleteSupplierButton');

        oDeleteSupplierButton.setEnabled(!!oEvent.getSource().getSelectedItems().length);
      },
      onChangeSuppliersSelect() {
        const oSuppliersTable = this.byId('suppliersTable');
        const oSuppliersComboBox = this.byId('suppliersComboBox');
      },
    });
  },
);
