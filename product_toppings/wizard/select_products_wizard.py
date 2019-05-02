# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SelectProducts(models.TransientModel):

    _name = 'select.products'

    product_ids = fields.Many2many('product.product', string='Products',domain=['|',('norm_toppings','=',True),('lux_toppings','=',True)])
    flag_order = fields.Char('Flag Order')

    @api.multi
    def select_products(self):
        if self.flag_order == 'so':
            order_id = self.env['product.toppings'].browse(self._context.get('active_id', False))
            for product in self.product_ids:
                self.env['product.toppings.line'].create({
                    'name': product.id,
                    'topping_id': order_id.id
                })