odoo.define('pos_toppings.pos_delete', function(require) {
"use strict";

var screens = require('point_of_sale.screens');
var gui = require('point_of_sale.gui');
var core = require('web.core');
var QWeb = core.qweb;
var rpc = require('web.rpc');
var _t = core._t;
var chrome = require('point_of_sale.chrome');
var PopupWidget = require('point_of_sale.popups');
var utils = require('web.utils');


screens.OrderLineDeleteButton = screens.ActionButtonWidget.extend({
        template: 'OrderLineDeleteButton',
        button_click: function () {
        console.log("click",this.pos.get('selectedOrder'));
        console.log("click",this.pos.get('selectedOrder').orderlines.models);
            return this.gui.show_popup('popup_return_pos_order_lines', {
                        order_lines: this.pos.get('selectedOrder').orderlines.models,
                        title:"Remove Order Line",
                    });
        },
    });
screens.define_action_button({
        'name': 'orders_delete_button',
        'widget': screens.OrderLineDeleteButton,
    });



var popup_return_pos_order_lines = PopupWidget.extend({
        template: 'popup_return_pos_order_lines',
        show: function (options) {
        var self = this;
        this.line_selected = [];
        this._super(options);

        this.$('.line-select').click(function () {
                    console.log(options['order_lines']);
                    var line_id = parseInt($(this).data('id'));
                    var line;
                    for (var i = 0; i < options['order_lines'].length; ++i) {
                        if (options['order_lines'][i].id == line_id){
                        line = options['order_lines'][i];
                        }

                    }
                    console.log(line_id);
                    var checked = this.checked;
                    if (checked == false) {
                        for (var i = 0; i < self.line_selected.length; ++i) {
                            if (self.line_selected[i] == line) {
                                self.line_selected.splice(i, 1);
                            }
                        }
                    } else {
                        self.line_selected.push(line);
                    }
                });
        this.$('.remove').click(function () {
        var same_lines = [];
        for (var i = 0; i < self.line_selected.length; ++i) {
        self.line_selected[i].set_quantity('remove');
        if(self.line_selected[i].parent){
         self.line_selected[i].parent.set_count(self.line_selected[i].parent-1);
        }
        if(! same_lines.includes(self.line_selected[i].parent)){
        same_lines.push(self.line_selected[i].parent)}
        self.gui.close_popup();


        }

        console.log("array",same_lines);
        for(var j=0;j<same_lines.length;++j){
        var child = [];
        for(var k=0;k<options['order_lines'].length;k++){
        if(options['order_lines'][k].parent && same_lines[j].id == options['order_lines'][k].parent.id){
        if(options['order_lines'][k].product.norm_toppings==true){
            child.push(options['order_lines'][k]);
        }

        }

        }
        console.log("child",child);
        console.log("allowed",same_lines[j].product.allowed);
        if(same_lines[j].product.allowed >= child.length){
        for(var l=0;l<child.length;++l){
           console.log("highr allowed",child[l]);
            child[l].set_unit_price(0);
            child[l].node.setAttribute("style","padding-left:120px;color:red;");

        }
        }
        if(same_lines[j].product.allowed < child.length){
        for(var m=0;m<same_lines[j].product.allowed;++m){
        console.log("highr child",child[m]);
            child[m].set_unit_price(0);
            child[m].node.setAttribute("style","padding-left:120px;color:red;");

        }

        }

        }


        });


//            var self = this;
//            this.line_selected = [];
//            var order_lines = options.order_lines;
//            for (var i = 0; i < order_lines.length; i++) {
//                var line = order_lines[i];
//                this.line_selected.push(line);
//            }
//            this.order = options.order;
//
//            var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=';
//            if (order_lines) {
//                self.$el.find('tbody').html(QWeb.render('return_pos_order_line', {
//                    order_lines: order_lines,
//                    image_url: image_url,
//                    widget: self
//                }));
//                this.$('.line-select').click(function () {
//                    var line_id = parseInt($(this).data('id'));
//                    var line = self.pos.db.order_line_by_id[line_id];
//                    var checked = this.checked;
//                    if (checked == false) {
//                        for (var i = 0; i < self.line_selected.length; ++i) {
//                            if (self.line_selected[i].id == line.id) {
//                                self.line_selected.splice(i, 1);
//                            }
//                        }
//                    } else {
//                        self.line_selected.push(line);
//                    }
//                });
//                this.$('.confirm_return_order').click(function () {
//                    if (self.line_selected == [] || !self.order) {
//                        self.pos.gui.show_popup('confirm', {
//                            title: _t('Error'),
//                            body: 'Please select lines need return from request of customer',
//                        });
//                    } else {
//                        self.pos.add_return_order(self.order, self.line_selected);
//                        return self.pos.gui.show_screen('payment');
//                    }
//                });
//                this.$('.cancel').click(function () {
//                    self.pos.gui.close_popup();
//                });
//                this.$('.qty_minus').click(function () {
//                    var line_id = parseInt($(this).data('id'));
//                    var line = self.pos.db.order_line_by_id[line_id];
//                    var quantity = parseFloat($(this).parent().find('.qty').text());
//                    if (quantity > 1) {
//                        var new_quantity = quantity - 1;
//                        $(this).parent().find('.qty').text(new_quantity);
//                        line['new_quantity'] = new_quantity;
//                    }
//                });
//                this.$('.qty_plus').click(function () {
//                    var line_id = parseInt($(this).data('id'));
//                    var line = self.pos.db.order_line_by_id[line_id];
//                    var quantity = parseFloat($(this).parent().find('.qty').text());
//                    if (line['qty'] >= (quantity + 1)) {
//                        var new_quantity = quantity + 1;
//                        $(this).parent().find('.qty').text(new_quantity);
//                        line['new_quantity'] = new_quantity;
//                    }
//                })
//            }
        }
    });
    gui.define_popup({
        name: 'popup_return_pos_order_lines',
        widget: popup_return_pos_order_lines
    });

});
