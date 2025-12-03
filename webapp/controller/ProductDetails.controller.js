sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox',
    'sap/ui/core/Messaging',
    'sap/base/util/deepEqual',
  ],
  (BaseController, JSONModel, MessageBox, Messaging, deepEqual) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ProductDetails', {
      onInit() {
        const oViewData = {
          selectedProduct: {},
          initialSelectedProduct: {},
          editMode: false,
          createMode: false,
          productId: '',
        };

        this.getView().setModel(Messaging.getMessageModel(), 'message');
        Messaging.registerObject(this.getView(), true);

        this.getView().setModel(new JSONModel(oViewData), 'viewModel');
        this.getOwnerComponent()
          .getRouter()
          .getRoute('ProductDetails')
          .attachPatternMatched(this.onPatternMatched, this);
      },

      onPatternMatched(oEvent) {
        const oViewModel = this.getView().getModel('viewModel');
        oViewModel.setProperty('/editMode', !!oEvent.getParameter('arguments').create);
        oViewModel.setProperty('/createMode', oEvent.getParameter('arguments').create);

        const sProductId = oEvent.getParameter('arguments').productId;
        oViewModel.setProperty('/productId', sProductId);

        const oSelectedProduct = this.getView()
          .getModel('data')
          .getProperty('/Products')
          .find((oProduct) => oProduct.ProductId === `${sProductId}`);

        oViewModel.setProperty('/selectedProduct', oSelectedProduct);
        oViewModel.setProperty('/initialSelectedProduct', { ...oSelectedProduct });
        this.byId('multiInputWithValueHelpEdit').setTokens([]);
        this.getOwnerComponent()
          .getEventBus()
          .subscribe('test', 'delivered', this.onPressTestEventBus, this);
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

        const aInputsEdit = this.getView()
          .getControlsByFieldGroupId('editInput')
          .filter((el) => el.isA('sap.m.Input'))
          .filter((el) => !el.getId().endsWith('-popup-input'))[0];
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

        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const oSelectedProduct = oViewModel.getProperty('/selectedProduct');

        if (deepEqual(oInitialSelectedProduct, oSelectedProduct)) {
          oViewModel.setProperty('/editMode', false);
        } else {
          MessageBox.confirm(this._i18n('resetAllChangesConfirmation'), {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oViewModel.setProperty('/initialSelectedProduct', {
                  ...oViewModel.getProperty('/selectedProduct'),
                });
                oViewModel.setProperty('/editMode', false);
              }
            },
          });
        }
      },

      onPressOkEdit() {
        const oViewModel = this.getView().getModel('viewModel');
        const oData = this.getView().getModel('data');
        const aProducts = oData.getProperty('/Products');
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const oSelectedProduct = oViewModel.getProperty('/selectedProduct');
        oViewModel.setProperty('/editMode', false);

        if (!oViewModel.getProperty('/createMode')) {
          oViewModel.setProperty('/selectedProduct', { ...oInitialSelectedProduct });
          const aFilteredProducts = aProducts.filter(
            (oProduct) => oProduct.ProductId !== oSelectedProduct.ProductId,
          );
          aFilteredProducts.push(oSelectedProduct);
          oData.setProperty('/Products', [...aFilteredProducts]);
          oData.refresh();
        } else {
          aProducts.push({
            ProductId: oViewModel.getProperty('/productId'),
            ...oInitialSelectedProduct,
          });
          oViewModel.setProperty('/selectedProduct', { ...oInitialSelectedProduct });
          this.byId('multiInputWithValueHelpEdit').setTokens([]);
          oData.setProperty('/Products', [...aProducts]);
          oData.refresh();
        }
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

      onChangeSuppliersSelect(oEvent) {
        const aRowItems = oEvent.getSource().getParent().getParent().getCells();
        const oKey = oEvent.getSource().getSelectedKey();
        const aSuppliers = this.getView().getModel('data').getProperty('/Suppliers');
        const oSelectedSupplierInfo = aSuppliers.filter(
          (oSupplier) => oSupplier.SupplierId === oKey,
        );
        aRowItems[0].getItems()[0].setText(oSelectedSupplierInfo[0].SupplierName);
        aRowItems[0].getItems()[1].setSelectedKey(oSelectedSupplierInfo[0].SupplierId);
        aRowItems[1].setText(oSelectedSupplierInfo[0].Location);
        aRowItems[2].setText(oSelectedSupplierInfo[0].Email);
      },

      onPressCreateSupplier() {
        const aSuppliers = this.getView()
          .getModel('viewModel')
          .getProperty('/initialSelectedProduct').Suppliers;
        const oNewSupplier = {
          SupplierId: '',
          SupplierName: '',
          Location: '',
          Email: '',
        };
        aSuppliers
          ? aSuppliers.push(oNewSupplier)
          : (this.getView().getModel('viewModel').getProperty('/initialSelectedProduct').Suppliers =
              [oNewSupplier]);
        this.getView().getModel('viewModel').refresh();
      },
      async handleMessagePopoverPress(oEvent) {
        const oSourceControl = oEvent.getSource();

        const oMessagePopover = await this.loadFragment({
          name: 'productsreport.fragment.MessagePopover',
        });
        oMessagePopover.openBy(oSourceControl);
        const oMessageModel = this.getView().getModel('message');
        const aMessages = oMessageModel.getData();

        aMessages.map((oMessage) => {
          oMessage.description = sap.ui
            .getCore()
            .byId(oMessage.controlIds)
            .getParent()
            .getParent()
            .getItems()[0]
            .getText();
        });
        oMessageModel.refresh();
      },
      onPressTestEventBus(channel, event, data) {
        console.log('delivered bus', data.name);
      },
    });
  },
);
