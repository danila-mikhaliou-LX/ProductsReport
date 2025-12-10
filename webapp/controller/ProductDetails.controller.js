sap.ui.define(
  [
    'productsreport/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox',
    'sap/ui/core/Messaging',
    'sap/base/util/deepEqual',
    'sap/m/MessageToast',
  ],
  (BaseController, JSONModel, MessageBox, Messaging, deepEqual, MessageToast) => {
    'use strict';

    return BaseController.extend('productsreport.controller.ProductDetails', {
      onInit() {
        const oViewData = {
          selectedProduct: {},
          initialSelectedProduct: {},
          comments: [],
          editMode: false,
          createMode: false,
          productId: '',
          statusTypes: ['OUT_OF_STOCK', 'OK', 'STORAGE', 'NONE'],
          currency: ['USD', 'EUR', 'GBP', 'JPY'],
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
        const oDataModel = this.getView().getModel();
        const sProductId = oEvent.getParameter('arguments').productId;
        oViewModel.setProperty('/editMode', !!oEvent.getParameter('arguments').create);
        oViewModel.setProperty('/createMode', !!oEvent.getParameter('arguments').create);
        oViewModel.setProperty('/productId', sProductId);

        if (!oViewModel.getProperty('/createMode')) {
          oDataModel.read(`/Products(${sProductId})`, {
            success: function (oData) {
              oViewModel.setProperty('/selectedProduct', oData);
              oViewModel.setProperty('/initialSelectedProduct', { ...oData });
            }.bind(this),
          });
          oDataModel.read(`/Products(${sProductId})/Comment`, {
            success: function (oData) {
              oViewModel.setProperty('/comments', oData.results);
            }.bind(this),
          });
        } else {
          oViewModel.setProperty('/selectedProduct', {});
          oViewModel.setProperty('/initialSelectedProduct', {});
          oViewModel.setProperty('/comment', {});
        }
      },

      onDeleteProductPress() {
        const oViewModel = this.getView().getModel('viewModel');
        const sProductId = oViewModel.getProperty('/productId');
        const oDataModel = this.getView().getModel();
        const oSelectedProductModel = this.getView()
          .getModel('viewModel')
          .getProperty('/selectedProduct');

        MessageBox.confirm(this._i18n('productDeleteConfirmation', oSelectedProductModel.Name), {
          action: [MessageBox.Action.OK],
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              oDataModel.remove(`/Products(${sProductId})`);
              this._navigate('ListReport');
            }
          },
        });
      },

      onEditPress() {
        this.getView().getModel('viewModel').setProperty('/editMode', true);
      },

      onSelectionChange(oEvent) {
        const oViewModel = this.getView().getModel('viewModel');
        const oSelectedItem = oEvent.getSource().getSelectedItem();
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        oInitialSelectedProduct.Status = oSelectedItem.getKey();
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
        const oDataModel = this.getView().getModel();
        const oInitialSelectedProduct = oViewModel.getProperty('/initialSelectedProduct');
        const sProductId = oViewModel.getProperty('/productId');

        if (!oViewModel.getProperty('/createMode')) {
          MessageBox.confirm(this._i18n('saveEditChanges'), {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oViewModel.setProperty('/selectedProduct', {
                  ...oInitialSelectedProduct,
                  Rating: oInitialSelectedProduct.Rating,
                  Comment: {},
                });
                oDataModel.update(`/Products(${sProductId})`, oInitialSelectedProduct, {
                  success: function () {
                    MessageToast.show(this._i18n('editSaveSuccess'));
                  },
                });
              }
            },
          });
        } else {
          MessageBox.confirm(this._i18n('createProduct'), {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
              if (sAction === MessageBox.Action.OK) {
                oDataModel.read(`/Stores`, {
                  success: function (oData) {
                    const oPayload = {
                      ...oInitialSelectedProduct,
                      Store_ID: oData.results[0].ID,
                      Rating: oInitialSelectedProduct.Rating,
                      Comment: {},
                    };

                    oDataModel.create(`/Products`, oPayload, {
                      success: function () {
                        this._navigate('ListReport');
                        MessageToast.show(this._i18n('createProductSuccess'));
                      },
                    });
                  },
                });
              }
            },
          });
        }
        oViewModel.setProperty('/createMode', false);
        oViewModel.setProperty('/editMode', false);
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
            ?.getText();
        });
        oMessageModel.refresh();
      },

      onPost(oEvent) {
        const sPostMessage = oEvent.getSource().getValue();
        const sPostRating = this.byId('postRating').getValue();
        const oViewModel = this.getView().getModel('viewModel');
        const oDataModel = this.getView().getModel();

        oDataModel.create('/ProductComments', {
          Author: 'anonymous',
          Message: sPostMessage,
          Rating: sPostRating ? sPostRating : 0,
          Product_ID: oViewModel.getProperty('/productId'),
        });

        oDataModel.read(`/Products(${oViewModel.getProperty('/productId')})/Comment`, {
          success: function (oData) {
            oViewModel.setProperty('/comments', oData.results);
            this.byId('postRating').setValue('');
          }.bind(this),
        });
      },
    });
  },
);
