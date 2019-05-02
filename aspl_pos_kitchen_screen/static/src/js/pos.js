odoo.define('aspl_pos_kitchen_screen.pos',function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');
    var session = require('web.session');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var rpc = require('web.rpc');
//    var bus = require('bus.bus').bus;
    var bus = require('bus.Longpolling');
    var DB = require('point_of_sale.DB');
    var PopupWidget = require('point_of_sale.popups');
    var framework = require('web.framework');
    var _t = core._t;
    var QWeb = core.qweb;
//    Custom import
    var Backbone = window.Backbone;
//    var longpolling = require('pos_longpolling.connection');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
//    End

    models.load_fields("res.users", ['kitchen_screen_user','pos_category_ids']);
    models.load_fields("pos.order.line", ['state']);
    models.load_fields("pos.config", ['pos_categories']);

    var _super_posmodel = models.PosModel;
	 models.PosModel = models.PosModel.extend({

//	 initialize: function () {
//            _super_posmodel.initialize.apply(this, arguments);
//            console.log(this.bus);
//            this.bus.add_channel_callback("pos.order.line", this.mirror_kitchen_orders, this);

//        },

		load_server_data: function(){
		    var self = this;
		    console.log("load server",self);
//		    bus.LongpollingBus.addChannel(self.mirror_kitchen_orders);

//		    bus.updateOption('pos.order.line', session.uid);
//            bus.startPolling();
            var loaded_data = _super_posmodel.prototype.load_server_data.call(this);
			return loaded_data;
		},
		 mirror_kitchen_orders:function(new_order){
            rpc.query({
                model: 'pos.order',
                method: 'broadcast_order_data',
                args : [new_order]
            }).then(function(result) {});
        },
	});

    chrome.HeaderButtonWidget.include({
        renderElement: function(){
            var self = this;
            this._super();
            if(this.action){
                self.$el.click(function(){
                    if(self.pos.user.kitchen_screen_user === 'cook'){
                        self.gui.show_popup('confirm',{
                            'title': _t('Confirmation'),
                            'body': _t('Do you want to close screen ?'),
                            confirm: function(){
                                framework.redirect('/web/session/logout');
                            },
                        });
                    }
                });
            }
        },
    });

    chrome.Chrome.include({
          build_widgets:function(){
                var self = this;
                this._super(arguments);
                if(self.pos.user.kitchen_screen_user === 'cook'){
                    self.gui.set_startup_screen('kitchen_screen');
                    self.gui.show_screen('kitchen_screen');
                } else{
                    self.gui.show_screen('products');
                }
          },
     });

    var kitchenScreenButton = screens.ActionButtonWidget.extend({
        template: 'kitchenScreenButton',
        button_click: function(){
            this.gui.show_screen('kitchen_screen');
        },
    });

    screens.define_action_button({
        'name': 'kitchenScreenButton',
        'widget': kitchenScreenButton,
        'condition': function(){
			return this.pos.user.kitchen_screen_user === 'manager';
		},
    });



////    Send order to kitchen
//    var SendOrderToKitchenButton = screens.ActionButtonWidget.extend({
//	    template : 'SendOrderToKitchenButton',
//	    button_click : function() {
//	        var self = this;
//            var selectedOrder = this.pos.get_order();
//            selectedOrder.initialize_validation_date();
//            var currentOrderLines = selectedOrder.get_orderlines();
//            var orderLines = [];
//            _.each(currentOrderLines,function(item) {
//                return orderLines.push(item.export_as_JSON());
//            });
//            if (orderLines.length === 0) {
//                return alert ('Please select product !');
//            } else {
//                //console.log(selectedOrder);
//                var lines = selectedOrder.get_orderlines();
//
//                for (var i = 0; i < lines.length; i++) {
//                    if (lines[i].state =='waiting' ) {
//                        lines[i].state = 'delivering';
//
//                    }
//                }
//
//                //console.log(lines);
//                self.pos.push_order(selectedOrder);
//
//            }
//             console.log("pushed data",self.pos);
//	    },
//	});
//
//	screens.define_action_button({
//        'name': 'SendOrderToKitchen',
//        'widget': SendOrderToKitchenButton,
//    });

    var OrderLineNoteButton = screens.ActionButtonWidget.extend({
        template: 'OrderLineNoteButton',
        button_click: function(){
            var order    = this.pos.get_order();
            var lines    = order.get_orderlines();
            if(lines.length > 0) {
                var selected_line = order.get_selected_orderline();
                if (selected_line) {
                    this.gui.show_popup('orderline_note_popup');
                }
            } else {
                alert("Please select the product !");
            }
        },
    });

    screens.define_action_button({
        'name': 'ordernoteline',
        'widget': OrderLineNoteButton,
    });

    //    order line note for product screen
    var OrderLineNotePopupWidget = PopupWidget.extend({
	    template: 'OrderLineNotePopupWidget',
	    show: function(options){
	        var self = this;
	        options = options || {};
	        this._super(options);
	        this.renderElement();
	        var order    = this.pos.get_order();
	        var selected_line = order.get_selected_orderline();
	        if(selected_line && selected_line.get_line_note()){
	            var note = selected_line.get_line_note();
	            $('#textarea_note').text(note);
	        }else{
	            $('#textarea_note').text('');
	        }

	    },
	    click_confirm: function(){
	        var order    = this.pos.get_order();
	    	var selected_line = order.get_selected_orderline();
	    	var value = $('#textarea_note').val();
	    	selected_line.set_line_note(value);
	    	this.gui.close_popup();
	    },
	    renderElement: function(){
            this._super();
	    },
	});
	gui.define_popup({name:'orderline_note_popup', widget: OrderLineNotePopupWidget});

	var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({

        initialize: function(attr,options){
            this.line_note = '';
            this.state = 'waiting';
            _super_orderline.initialize.call(this, attr, options);
        },
        set_line_note: function(line_note) {
            this.set('order_line_note', line_note);
        },
        get_line_note: function() {
            return this.get('order_line_note');
        },
        can_be_merged_with: function(orderline){
            var result = _super_orderline.can_be_merged_with.call(this,orderline);
            if(orderline.product.id == this.product.id && this.state != 'waiting' ){
                return false;
            }
            return result;
        },
        export_as_JSON: function() {
            var lines = _super_orderline.export_as_JSON.call(this);
            var new_attr = {
                order_line_note : this.get_line_note(),
                state : this.state,
                pos_cid : this.cid,
            }
            $.extend(lines, new_attr);
            return lines;
        }
    });

    //    order note for order
     var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_order_note: function(order_note) {
            this.order_note = order_note;
        },
        get_order_note: function() {
            return this.order_note;
        },
        export_as_JSON: function() {
            var submitted_order = _super_order.export_as_JSON.call(this);
            var new_val = {
                order_note: this.get_order_note(),
            }
            $.extend(submitted_order, new_val);
            return submitted_order;
        },
        export_for_printing: function(){
        	var self = this;
            var orders = _super_order.export_for_printing.call(this);
            var new_val = {
            	order_note: this.get_order_note() || false,
            };
            $.extend(orders, new_val);
            return orders;
        },
    });

    screens.PaymentScreenWidget.include({
        show: function() {
            self = this;
            console.log(self);
            this._super();
            $("textarea#order_note").focus(function() {
            	 $('body').off('keypress', self.keyboard_handler);
                 $('body').off('keydown', self.keyboard_keydown_handler);
                 window.document.body.removeEventListener('keypress',self.keyboard_handler);
                 window.document.body.removeEventListener('keydown',self.keyboard_keydown_handler);
            });
            $("textarea#order_note").focusout(function() {
            	window.document.body.addEventListener('keypress',self.keyboard_handler);
                window.document.body.addEventListener('keydown',self.keyboard_keydown_handler);
            });
        },
        validate_order: function(force_validation) {
            var currentOrder = this.pos.get_order();
            currentOrder.set_order_note($('#order_note').val());
            this._super(force_validation);
        },
    });

    // Kitchen Screen
	var kitchenScreenWidget = screens.ScreenWidget.extend({
        template: 'kitchenScreenWidget',
        init: function(parent, options){
            var self = this;

            this._super(parent, options);
            this.categ_id = 0;
            this.category_list = []
            this.config_categ_ids = self.pos.config.pos_categories
            this.config_categ_ids.map(function(id){
                var object = self.pos.db.get_category_by_id(id);
                self.category_list.push(object);
            });
	    	self._onNotification(self);
        },
        show: function() {
        	this._super();
        	var self = this;
//        	this.categ_id = 0;
        	this.renderElement();
        	if(self.pos.user.kitchen_screen_user === 'cook'){
//                this.categ_id = self.pos.user.pos_category_ids[0];
                this.$el.find('span.category:first').addClass('selected');
            }else{
            	this.pos.mirror_kitchen_orders();
            	var data_id1 = 0

            	if(self.categ_id == 0){
                             var data_id1 = 0;
                        }else{
                            var data_id1 = self.categ_id;
                        }

                     setInterval(function(){
                     if(self.categ_id == 0){
                         rpc.query({
                                model: 'pos.order',
                                method: 'broadcast_order_data1',
//                                args : [self.categ_id]
                            }).then(function(result) {
                                if(result){
                                self.screen_data = result;
                                    self.render_screen_order_lines(result)

                                }
                            });

                     }else{
                            rpc.query({
                                model: 'pos.order',
                                method: 'broadcast_order_data2',
                                args : [{'categ':self.categ_id,'user':self.pos.user,'categories':[]}]
                            }).then(function(result) {
                                if(result){
                                self.screen_data = result;
                                    self.render_screen_order_lines(result)

                                }
                            });
                            }
                }, 3000);
                            }

//
            if(self.pos.user.kitchen_screen_user === 'cook'){

                 var arg = {};
                 if(typeof this.categ_id === 'undefined'){
                    console.log("no loop");
                 }
                else{
                    setInterval(function(){
                        if(self.categ_id == 0){
                             var data_id = 0;
                        }else{
                            var data_id = self.categ_id;
                        }
                        console.log("gdfdfdg",self.pos.config.pos_categories);
                        arg['categ']=data_id;
                        arg['user']=self.pos.user;
                        arg['categories'] = self.pos.config.pos_categories;
                        rpc.query({
                            model: 'pos.order',
                            method: 'broadcast_order_data2',
                            args : [arg],
                        }).then(function(result) {
                            if(result){
                            console.log("ssssss",result);
                            self.screen_data = result;
                                self.render_screen_order_lines(result);
                            }
                        });
                     }, 3000);
                }

        	}
        	if(self.pos.user.kitchen_screen_user === 'manager'){
        	    $('.order-list,.kitchen-buttons').addClass('disappear');
                $('.order-kanban').removeClass('disappear');
        	}
        },
        _onNotification: function(notifications){
//          console.log("data notifi arr",notifications[0][1][0]);
//	    	var self = this;
//	    	if(notifications[0][1][0] == "screen_display_data"){
//	    	    if(notifications[0][1][1].new_order){
//	    	        self.pos.gui.play_sound('bell');
//	    	    }
//                var screen_data = [];
//                _.each(notifications[0][1][1].orders,function(order){
//                    _.each(order.order_lines,function(line){
//                        if(line.state != 'done' && line.state != 'cancel'){
//                            screen_data.push(line);
//                        }
//                    });
//                });
//                this.set('screen_data',screen_data);
//                var screen_order_lines = [];
//                 _.each(notifications[0][1][1].orders,function(order){
//                    _.each(order.order_lines,function(line){
//                        if(self.categ_id == 0 && line.state != 'done' && line.state != 'cancel'){
//                            screen_order_lines.push(line);
//                        }else if(line.categ_id == self.categ_id && line.state != 'done' && line.state != 'cancel'){
//                             screen_order_lines.push(line);
//                        }
//                    });
//                 });
//                    this.render_screen_order_lines(screen_order_lines);
//                this.render_table_data(notifications[0][1][1].orders);
//            }else if(notifications[0][1][0] == "order_line_state"){
//                if(self.pos.get_order_list().length !== 0){
//                    var collection_orders = self.pos.get_order_list()[0].collection.models;
//                    for (var i = 0; i < collection_orders.length; i++) {
//                        var collection_order_lines = collection_orders[i].orderlines.models;
//                        _.each(collection_order_lines,function(line){
//                            if(line.cid === notifications[0][1][1].pos_cid && line.order.name ===  notifications[0][1][1].pos_reference){
//                               line.state = notifications[0][1][1].state;
//                               self.pos.gui.screen_instances.products.order_widget.renderElement();
//                            }
//                        });
//                    }
//                }
//            }
	    },
	    render_screen_order_lines: function(screen_data){
	        if(screen_data){
	            var contents = this.$el[0].querySelector('.order-list-contents');
	            contents.innerHTML = "";
	            for(var i = 0, len = Math.min(screen_data.length,500); i < len; i++){
	                var order_line_data    = screen_data[i];
	            	var orderline_html = QWeb.render('OrderlistLine',{widget: this, order_line_data:order_line_data});
	                var orderlines = document.createElement('div');
	                orderlines.innerHTML = orderline_html;
	                orderlines = orderlines.childNodes[1];
                    contents.appendChild(orderlines);
	            }
	        }
	    },
	    render_table_data: function(table_data){
	        if(table_data){
	            var contents = this.$el[0].querySelector('.table-order-contents');
	            contents.innerHTML = "";
	            for(var i = 0, len = Math.min(table_data.length,1000); i < len; i++){
	                var order_data = table_data[i];
	            	var order_html = QWeb.render('TableOrders',{widget: this, order_data:order_data});
	                var order = document.createElement('div');
	                order.innerHTML = order_html;
	                order = order.childNodes[1];
	                contents.appendChild(order);
	            }
	        }
	    },
	    events:{
	        'click .button.back':  'click_back',
            'click div.kitchen-buttons span.category':'click_categ_button',
            'click div.state-button ':'change_state_click',
            'click div.cancel-order ':'cancel_order_click',
            'click span#view_note ':'show_order_note',
            'click .btn-list':'list_view_click',
            'click .btn-kanban':'kanban_view_click',
            'click .kitchen-order-note':'show_order_note',
            'click .button.print':'print_order',//Chagui
        },
        /*Chagui*/
        print_order:function(event){
            var id=  parseInt($(event.currentTarget).context.dataset.id);
            var length=this.$el[0].querySelector('.table-order-contents').childNodes.length;
            var list=this.$el[0].querySelector('.table-order-contents').childNodes;
            var datas="";
            var find=false;
            for (var i=0;i<length;i++) {
                if(!find) {
                    var length_child = list[i].childNodes.length;
                    for (var j = 0; j < length_child; j++) {
                        if (j === 11) {
                            if (list[i].childNodes[j].dataset.id == id) {
                                datas = list[i];
                                find=true;
                                break;
                            }
                        }
                    }
                }
                else
                {break;}
            }
            this.imprimirElemento(datas)
        },

        click_back: function(){
        	this.gui.back();
        },
        imprimirElemento: function(elemento){
            var ventana = window.open('', 'PRINT', 'height=400,width=600');
            ventana.document.write('<html><head>');
            ventana.document.write('</head><body >');
            ventana.document.write(elemento.innerHTML);
            ventana.document.write('</body></html>');
            ventana.document.close();
            ventana.document.getElementById("print_button").remove();
            var length=ventana.document.getElementsByClassName("table-order-line").length;
            var datadiv=ventana.document.getElementsByClassName("table-order-line");
            for (var i=0;i<length;i++)
            {
                ventana.document.getElementById("table-line-state").remove();
            }
            ventana.focus();
            ventana.print();
            ventana.close();
            return true;
        },
        /*Chagui*/
        list_view_click: function(event){
            $(event.currentTarget).addClass('selected');
            $('.btn-kanban').removeClass('selected');
            $('.order-list,.kitchen-buttons').removeClass('disappear');
            $('.order-kanban').addClass('disappear');
        },
        kanban_view_click: function(event){
            $(event.currentTarget).addClass('selected');
            $('.btn-list').removeClass('selected');
            $('.order-list,.kitchen-buttons').addClass('disappear');
            $('.order-kanban').removeClass('disappear');
        },
        show_order_note:function(event){
            var self = this;
            var note = $(event.currentTarget).data('note');
            self.gui.show_popup('line_note_popup',{'note':note});
        },
        click_categ_button: function(event){
            var self = this;
            this.categ_id = parseInt($(event.currentTarget).data('id'));
            $('span.category').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            var screen_data = []
//            _.each(self.get('screen_data'),function(line){
//                console.log("data screen",line);
//                if(self.categ_id == 0){
//	    		    screen_data.push(line);
//	    		}else if(line.categ_id && line.categ_id == self.categ_id){
//	    	         screen_data.push(line);
//                }
//	    	 });

           if (self.screen_data){
           for(var i=0; i<self.screen_data.length; i++){
               if(self.categ_id == 0){
                       screen_data.push(self.screen_data[i]);
                }
                else if(self.screen_data[i].categ_id == self.categ_id){
                       screen_data.push(self.screen_data[i]);
                }

            }

           }

	    	 self.render_screen_order_lines(screen_data);
        },
        change_state_click:function(event){
            var self = this;
            var state_id = $(event.currentTarget).data('state');
            var order_line_id = parseInt($(event.currentTarget).data('id'));
            var route = $(event.currentTarget).data('route');


            if(route){
                if(state_id == 'waiting'){

                    rpc.query({
                        model: 'pos.order.line',
                        method: 'update_orderline_state',
                        args: [{'state': 'preparing','order_line_id':order_line_id}],
                    })
                    .then(function(result){
                        if(result){
                            self.pos.mirror_kitchen_orders();
                        }
                    });
                }else if(state_id == 'preparing'){
                    rpc.query({
                        model: 'pos.order.line',
                        method: 'update_orderline_state',
                        args: [{'state': 'delivering','order_line_id':order_line_id}],
                    })
                    .then(function(result) {
                        if(result){
                            self.pos.mirror_kitchen_orders();
                         }
                    });
                }else if(state_id == 'delivering'){
                    rpc.query({
                        model: 'pos.order.line',
                        method: 'update_orderline_state',
                        args: [{'state': 'done','order_line_id':order_line_id}],
                    })
                    .then(function(result) {
                        if(result){
                            self.pos.mirror_kitchen_orders();
                        }
                    });
                }
            }else{
                if(state_id == 'waiting'){
                    rpc.query({
                        model: 'pos.order.line',
                        method: 'update_orderline_state',
                        args: [{'state': 'delivering','order_line_id':order_line_id}],
                    })
                    .then(function(result) {
                        if(result){
                            self.pos.mirror_kitchen_orders();
                         }
                    });
                }else if(state_id == 'delivering'){
                    rpc.query({
                        model: 'pos.order.line',
                        method: 'update_orderline_state',
                        args: [{'state': 'done','order_line_id':order_line_id}],
                    })
                    .then(function(result) {
                        if(result){
                            self.pos.mirror_kitchen_orders();
                        }
                    });
                }
            }
        },
        cancel_order_click:function(event){
            var self = this;
            var order_line_id = parseInt($(event.currentTarget).data('id'));
            if(order_line_id){
                rpc.query({
                    model: 'pos.order.line',
                    method: 'update_orderline_state',
                    args: [{'state': 'cancel','order_line_id':order_line_id}],
                })
                .then(function(result){
                    if(result){
                        self.pos.mirror_kitchen_orders();
                    }
                });
            }
        },
        renderElement:function(){
            this._super();
            var self = this;
        },
    });
    gui.define_screen({name:'kitchen_screen', widget: kitchenScreenWidget});

     //    order note popup for kitchen screen
     var ProductNotePopupWidget = PopupWidget.extend({
	    template: 'ProductNotePopupWidget',
	    show: function(options){
	        var self = this;
	        options = options || {};
	        this._super(options);
	        this.renderElement();
	        var order_note = options.note || ' ';
	        if(order_note){
	            $('#Order_line_note').text(order_note);
	        }
	    },
	    click_confirm: function(){
	    	this.gui.close_popup();
	    },
	});
	gui.define_popup({name:'line_note_popup', widget: ProductNotePopupWidget});

});