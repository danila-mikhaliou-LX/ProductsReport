/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["productsreport/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
