# -*- coding: utf-8 -*-
{
    'name': 'Product Toppings',
    'version': '1.1',
    'category': 'Product',
    'sequence': 1,
    "author": "",
    "mail": "",
    'summary': '',
    'description': """
    """,
    'depends': [
        'product','point_of_sale',
    ],
    'data': [
        'wizard/select_products_wizard_view.xml',
        'views/product.xml',
        'views/topping.xml',
        'views/pos_config.xml',
        'security/ir.model.access.csv',
        'views/template.xml',

    ],
    'qweb': [
        'static/src/xml/pos.xml',
        'static/src/xml/posticket.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': True,
}
