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
        this.byId('deleteSelectedProductButton').setEnabled(true);
        this.byId('editSelectedProductButton').setEnabled(true);
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
        const oViewModel = this.getView().getModel('viewModel');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const oMultiInputEdit = this.byId('multiInputWithValueHelpEdit');
        oViewModel.setProperty('/editMode', true);
        this.byId('deleteSelectedProductButton').setEnabled(false);
        this.byId('editSelectedProductButton').setEnabled(false);

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

      async handleValueHelpEdit() {
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

          const aTokens = oMultiInputEdit.getTokens();

          this.oDialogEdit.setTokens(aTokens);
          this.oDialogEdit.setTable(oTable);
        } else {
          this.oDialogEdit.setTokens(oMultiInputEdit.getTokens());
        }

        this.oDialogEdit.update();
        this.oDialogEdit.open();
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
        } else if (aUpdatedTokens.length === 0) {
          oInitialSelectedProduct.ProducerName = '';
          oInitialSelectedProduct.ProducerId = '';
        } else {
          oInitialSelectedProduct.ProducerName = aUpdatedTokens.getText();
          oInitialSelectedProduct.ProducerId = aUpdatedTokens.getKey();
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
        this.oDialogEdit.setTokens(aTokens);
        this.oDialogEdit.close();
      },

      onCloseValueHelp() {
        this.oDialogEdit.close();
      },

      onAfterCloseValueHelp() {
        this.oDialogEdit.setTokens([]);
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
        const sResetAllChangesConfirmation = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('resetAllChangesConfirmation');

        MessageBox.confirm(sResetAllChangesConfirmation, {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              oViewModel.setProperty('/editMode', false);
              this.byId('deleteSelectedProductButton').setEnabled(true);
              this.byId('editSelectedProductButton').setEnabled(true);

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
        this.byId('deleteSelectedProductButton').setEnabled(true);
        this.byId('editSelectedProductButton').setEnabled(true);

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
        const sDeleteSupplierConfirmation = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('supplierDeleteConfirmation');
        const sMultiDeleteSupplierConfirmation = this.getView()
          .getModel('i18n')
          .getResourceBundle()
          .getText('supplierMultiDeleteConfirmation');
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
        const sFormattedDeleteSupplier = Formatter.formatProductsCount(
          sDeleteSupplierConfirmation,
          oSuppliersTable.getSelectedItems()[0].getBindingContext('viewModel').getObject()
            .SupplierName,
        );
        const sFormattedMultiDeleteSupplier = Formatter.formatProductsCount(
          sMultiDeleteSupplierConfirmation,
          aSelectedSuppliers.length,
        );

        if (aSelectedSuppliers === 1) {
          MessageBox.confirm(sFormattedDeleteSupplier, {
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
          });
        } else {
          MessageBox.confirm(sFormattedMultiDeleteSupplier, {
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
          });
        }
      },

      onSelectionSuppliersChange(oEvent) {
        const oDeleteSupplierButton = this.byId('deleteSupplierButton');

        if (oEvent.getSource().getSelectedItems().length) {
          oDeleteSupplierButton.setEnabled(true);
        } else {
          oDeleteSupplierButton.setEnabled(false);
        }
      },
      onChangeSuppliersSelect() {
        const oSuppliersTable = this.byId('suppliersTable');
        const oSuppliersComboBox = this.byId('suppliersComboBox');
      },
    });
  },
);
