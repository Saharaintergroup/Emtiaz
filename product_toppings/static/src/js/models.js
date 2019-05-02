/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
odoo.define('pos_shop.pos_shop', function(require) {
	"use strict";
	var models = require('point_of_sale.models');
	var core = require('web.core');
	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var _t = core._t;
	var screens = require('point_of_sale.screens');
	var popup_widget = require('point_of_sale.popups');
	var SuperOrder = models.Order;
	var QWeb = core.qweb;
	var shop_ref_id;
	var exports = {};
	models.load_fields("product.product", ['has_toppings','norm_toppings','lux_toppings','available_in_pos','sale_ok','allowed']);




	models.load_models([{
		model: 'product.toppings',
		field: [],
		domain: null,
		loaded: function(self,result) {
//		    console.log("result",self.config.toppings[0]);
		    self.current_topping = self.config.toppings[0];
		},

	},
	{
		model:'product.toppings.line',
		field: [],
		domain: function(self){
			if (self.current_topping){
				return [['topping_id','=',self.current_topping]];
				}
		},
		loaded: function(self,result) {

            var prods = [];
			self.all_topping_line = result;
			 for (var i=0;i<result.length;i++){
            prods.push(result[i].name[0])

            }
            self.prod_ids = prods;



		}

	},



    ],{
			'after': 'product.product'
		}
	);

screens.ProductListWidget.include({

renderElement: function() {
        var el_str  = QWeb.render(this.template, {widget: this});
        var el_node = document.createElement('div');
            el_node.innerHTML = el_str;
            el_node = el_node.childNodes[1];

        if(this.el && this.el.parentNode){
            this.el.parentNode.replaceChild(el_node,this.el);
        }
        this.el = el_node;

        var list_container = el_node.querySelector('.product-list');
        for(var i = 0, len = this.product_list.length; i < len; i++){


         var product_node = this.render_product(this.product_list[i]);
            product_node.addEventListener('click',this.click_product_handler);
            product_node.addEventListener('keypress',this.keypress_product_handler);
            if(this.product_list[i].norm_toppings == true || this.product_list[i].lux_toppings==true){
            if(this.pos.prod_ids.includes(this.product_list[i].id)){
            list_container.appendChild(product_node);
            }

            }
            else{
            list_container.appendChild(product_node);
            }



        }
    },


});

screens.OrderWidget.include({

render_orderline: function(orderline){
        console.log("parent",orderline);
        var el_str  = QWeb.render('Orderline',{widget:this, line:orderline});
        var el_node = document.createElement('div');
            el_node.innerHTML = _.str.trim(el_str);
            el_node = el_node.childNodes[0];
            el_node.orderline = orderline;
            el_node.addEventListener('click',this.line_click_handler);
        var el_lot_icon = el_node.querySelector('.line-lot-icon');
        if(el_lot_icon){
            el_lot_icon.addEventListener('click', (function() {
                this.show_product_lot(orderline);
            }.bind(this)));



        }
        if(orderline.product.norm_toppings==true && el_node){
            if(orderline.flag==true){
                    el_node.setAttribute("style","padding-left:120px;color:blue;");
                    }
            else{
                    el_node.setAttribute("style","padding-left:120px;color:red;");
                    }

        }
        if(orderline.product.lux_toppings==true && el_node){
         el_node.setAttribute("style","padding-left:120px;color:green;");
        }
        orderline.node = el_node;

        return el_node;
    },



});

models.Order = models.Order.extend({

      add_product: function(product, options){
        if(this._printed){
            this.destroy();
            return this.pos.get_order().add_product(product, options);
        }

        this.assert_editable();
        options = options || {};
        var attr = JSON.parse(JSON.stringify(product));
        attr.pos = this.pos;
        attr.order = this;
        var line = new models.Orderline({}, {pos: this.pos, order: this, product: product});

        if(options.quantity !== undefined){
            line.set_quantity(options.quantity);
        }

        if(options.price !== undefined){
            line.set_unit_price(options.price);
        }

        //To substract from the unit price the included taxes mapped by the fiscal position
        this.fix_tax_included_price(line);

        if(options.discount !== undefined){
            line.set_discount(options.discount);
        }

        if(options.extras !== undefined){
            for (var prop in options.extras) {
                line[prop] = options.extras[prop];
            }
        }
        console.log("line data",line);
        var to_merge_orderline;
        for (var i = 0; i < this.orderlines.length; i++) {
            if(this.orderlines.at(i).can_be_merged_with(line) && options.merge !== false){
                to_merge_orderline = this.orderlines.at(i);
            }
        }

            if(this.get_last_orderline()==undefined){
                if(product.norm_toppings==true || product.lux_toppings==true){
                    alert("You can not add without a has toppings product");
                }
                else{
                    this.orderlines.add(line);
            }

            }
            else{
                if(line){

                      if(line.product.norm_toppings==true || line.product.lux_toppings==true){


                    if(this.get_last_orderline().product.norm_toppings==true || this.get_last_orderline().product.lux_toppings==true){
                        line.set_parent(this.get_last_orderline().parent);

                        if(line.parent){
                            if(line.product.norm_toppings==true){
                                if(line.parent.count==null){
                            line.parent.set_count(1);
                        }
                        else{
                            if(line.product.norm_toppings==true){
                            line.parent.set_count(line.parent.count+1);
                            }


                        }

                            }


                        }




                    }
                    else{


                    line.set_parent(this.get_last_orderline());
                    if(line.parent){
                         if(line.parent.count==null){
                            line.parent.set_count(1);
                        }
                        else{
                            if(line.product.norm_toppings==true){
                            line.parent.set_count(line.parent.count+1);
                            }

                        }

                    }

                    }

                }


                if(line.parent && line.product.norm_toppings==true){
                    if(line.parent.product.allowed < line.parent.count){
                    line.set_flag(true);
                    alert("The allowed products is exceeded. Going to add cost");
                    }
                   else{

                line.set_unit_price(0);
                }

                }

                this.orderlines.add(line);


            }

                }



        this.select_orderline(this.get_last_orderline());

        if(line.has_product_lot){
            this.display_lot_popup();
        }

    },

});

models.Orderline = models.Orderline.extend({

set_parent: function(parent){

        this.parent = parent;

    },

set_count: function(count){

        this.count = count;

    },

get_count: function(){

       return parseInt(this.count);

    },

set_flag: function(flag){

       this.flag=flag;

    },






});

});