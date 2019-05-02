from odoo import models,fields,api,_

class PosConfig(models.Model):

    _inherit = 'pos.config'

    is_kitchen = fields.Boolean('Is Kitchen')
    name = fields.Char(string='Name', index=True, required=True,
                       help="An internal identification of the point of sale.")
    pos_categories = fields.Many2many('pos.category', string='Categories')