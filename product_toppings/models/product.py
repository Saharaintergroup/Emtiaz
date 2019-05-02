from odoo import models,fields,api


class ProductTemplate(models.Model):

    _inherit = 'product.template'

    has_toppings = fields.Boolean('Has Toppings')
    norm_toppings = fields.Boolean('Normal Toppings')
    lux_toppings = fields.Boolean('LuxuriousToppings')
    allowed = fields.Float('Allowed Toppings')


class Product(models.Model):

    _inherit = 'product.product'

    has_toppings = fields.Boolean('Has Toppings',related='product_tmpl_id.has_toppings')
    norm_toppings = fields.Boolean('Normal Toppings',related='product_tmpl_id.norm_toppings')
    lux_toppings = fields.Boolean('LuxuriousToppings',related='product_tmpl_id.lux_toppings')
    allowed = fields.Float(string='Allowed Toppings',related='product_tmpl_id.allowed')


class PosConfig(models.Model):

    _inherit= 'pos.config'

    toppings = fields.Many2one('product.toppings',string='Toppings')