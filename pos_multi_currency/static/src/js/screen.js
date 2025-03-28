// odoo.define('pos_multi_currency.screen', function (require) {
// var PaymentScreen = require('point_of_sale.PaymentScreen');
// var core = require('web.core');
// const NumberBuffer = require('point_of_sale.NumberBuffer');
// const Registries = require('point_of_sale.Registries');
// var QWeb = core.qweb;

// // PaymentScreen.extend({
// // //     click_paymentmethods: function (){
// // //         this._super.apply(this, arguments);
// // //         this.$('.currency-buttons').empty();
// // //         var $currency_buttons = $(QWeb.render('PyamentCurrecy', {widget: this}));
// // //         $currency_buttons.appendTo(this.$('.currency-buttons'));
// // //     }
//         // addNewPaymentLine({ detail: paymentMethod }) {
//         //     // original function: click_paymentmethods
//         //     let result = this.currentOrder.add_paymentline(paymentMethod);
//         //     console.log('addNewPaymentLine');
//         //     console.log(result);
//         //     console.log(this.currentOrder);
//         //     if (result){
//         //         NumberBuffer.reset();
//         //         return true;
//         //     }
//         //     else{
//         //         this.showPopup('ErrorPopup', {
//         //             title: this.env._t('Error'),
//         //             body: this.env._t('There is already an electronic payment in progress.'),
//         //         });
//         //         return false;
//         //     }
//         // }

// // });

// //     const PaymentScreen1 = PaymentScreen => class extends PaymentScreen {
// //         addNewPaymentLine({ detail: paymentMethod }) {
// //             // original function: click_paymentmethods

// //             console.log('addNewPaymentLine');
// //             // add_paymentline 
// //             var paymentlines = this.currentOrder.get_paymentlines();
// //             var is_multi_currency = false;
// //             _.each(paymentlines, function (line) {
// //                 if (line.payment_method.currency_id[0] !== paymentMethod.currency_id[0]) {
// //                     is_multi_currency = true;
// //                 }
// //             });
// //             if (is_multi_currency) {
// //                 this.showPopup('ErrorPopup', {
// //                     title : this.env._t("Payment Error"),
// //                     body  : this.env._t("Payment of order should be in same currency. Payment could not be done with two different currency"),
// //                 });
// //                 return false;
// //             } else {
// //                 var journal_currency_id = paymentMethod.currency_id[0];
// //                 if (this.currentOrder.currency.id !== journal_currency_id) {
// //                     var currency = _.findWhere(this.env.pos.multi_currencies, {id:journal_currency_id})
// //                     if (currency){
// //                         this.currentOrder.set_currency(currency);
// //                     }
// //                 }
            
// //                 // add_paymentline

// //                 let result = this.currentOrder.add_paymentline(paymentMethod);
// //                 // var $currency_buttons = $(QWeb.render('PyamentCurrecy', {widget: this}));
// //                 if (result){
// //                     NumberBuffer.reset();
// //                 }
// //                 else{
// //                     this.showPopup('ErrorPopup', {
// //                         title: this.env._t('Error'),
// //                         body: this.env._t('There is already an electronic payment in progress.'),
// //                     });
// //                 }
// //             }

// //             $('.currency-buttons').empty();
// //             var $currency_buttons = $(QWeb.render('PyamentCurrecy', {env: this.env}));
// //             $currency_buttons.appendTo($('.currency-buttons'));
// //         }
// //     };

// //     Registries.Component.extend(PaymentScreen, PaymentScreen1);

// //     return PaymentScreen;

// // });

//     const PaymentScreen1 = PaymentScreen => class extends PaymentScreen {
//         addNewPaymentLine({ detail: paymentMethod }) {
//             console.log('🔹 addNewPaymentLine Triggered', paymentMethod);

//             let paymentlines = this.currentOrder.get_paymentlines();
//             let is_multi_currency = false;

//             _.each(paymentlines, function (line) {
//                 if (line.payment_method.currency_id[0] !== paymentMethod.currency_id[0]) {
//                     is_multi_currency = true;
//                 }
//             });

//             if (is_multi_currency) {
//                 this.showPopup('ErrorPopup', {
//                     title: this.env._t("Payment Error"),
//                     body: this.env._t("Payments must be in the same currency."),
//                 });
//                 return false;
//             } else {
//                 let journal_currency_id = paymentMethod.currency_id[0];
//                 let current_currency = this.currentOrder.currency;

//                 // 🔹 Change currency if different from order currency
//                 if (current_currency.id !== journal_currency_id) {
//                     let currency = _.findWhere(this.env.pos.multi_currencies, { id: journal_currency_id });
//                     if (currency) {
//                         console.log('🔹 Changing Order Currency to:', currency.name);
//                         this.currentOrder.set_currency(currency);
//                         this.render(); // 🔥 Ensure the UI updates
//                     }
//                 }

//                 // 🔹 Add Payment Line
//                 let result = this.currentOrder.add_paymentline(paymentMethod);
//                 if (result) {
//                     NumberBuffer.reset();
//                     this.render();
//                 } else {
//                     this.showPopup('ErrorPopup', {
//                         title: this.env._t('Error'),
//                         body: this.env._t('Electronic payment already in progress.'),
//                     });
//                 }
//             }

//             // 🔹 Re-render currency buttons
//             $('.currency-buttons').empty();
//             let $currency_buttons = $(QWeb.render('PyamentCurrecy', { env: this.env }));
//             $currency_buttons.appendTo($('.currency-buttons'));

//             console.log('🔹 Currency Buttons Updated');
//         }
//     };

//     Registries.Component.extend(PaymentScreen, PaymentScreen1);

//     return PaymentScreen;

// });

/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { registry } from "@web/core/registry";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { MultiCurrencyPopup } from "../Popups/MultiCurrencyPopup"

patch(PaymentScreen.prototype, {
    setup() {
        super.setup(...arguments);
        this.popup = useService("popup");
    },
    async payMultipleCurrency() {
        if(this.pos.multicurrencypayment.length > 0){
            var payment_method_data = []
            this.payment_methods_from_config.forEach(function(id) {
                payment_method_data.push(id);
            });
            const { confirmed, payload } = await this.popup.add(MultiCurrencyPopup, {
                'payment_method': payment_method_data
            });
            if (confirmed) {
                if ($(".pay_amount").val()){
                    var payment_method = parseInt($(".payment-method-select").val())
                    var currency_amount = $(".pay_amount").val()
                    var get_amount = currency_amount / payload.inverse_rate
                    if(this.pos.config.cash_rounding){
                        var cash_rounding = this.pos.cash_rounding[0].rounding;
                        get_amount = round_pr(get_amount, cash_rounding);
                    }

                    let result = this.currentOrder.add_paymentline(this.env.services.pos.payment_methods_by_id[payment_method]);
                    this.selectedPaymentLine.set_amount(get_amount);
                    this.selectedPaymentLine.set_selected_currency(payload.currency_name);
                    this.selectedPaymentLine.set_currency_symbol(payload.symbol);
                    this.selectedPaymentLine.set_currency_rate(payload.inverse_rate);
                    this.selectedPaymentLine.set_currency_amount_paid(currency_amount);
                }
                else {
                    this.env.services.popup.add(ErrorPopup, { title: 'Amount Not Added',
                                            body: 'Please Enter the Amount!!' });
                }
            }
            else{
                return
            }
        }
        else{
            this.env.services.popup.add(ErrorPopup, { title: 'Currency Not Configured',
                                            body: 'Please Configure The Currency For Multi-Currency Payment.' });
            return;
        }
      }
})