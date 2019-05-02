from odoo import models,fields,api

class ProductToppings(models.Model):

    _name = 'product.toppings'

    name = fields.Char('Name')
    topping_line = fields.One2many('product.toppings.line','topping_id',string='Topping Lines')


class ProductToppingsLine(models.Model):

    _name = 'product.toppings.line'

    name = fields.Many2one('product.product',string='Product',domain=['|',('norm_toppings','=',True),('lux_toppings','=',True)],required=True)
    topping_id = fields.Many2one('product.toppings',string='Topping')