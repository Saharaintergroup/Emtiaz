

{
    'name': 'POS Kitchen Screen',
    'category': 'Point of Sale',
    'summary': "POS Kitchen Screen",
    'description': "POS Kitchen Screen shows orders and their state to Cook and Manager",
	'author': "Sigb",
    'currency': 'EUR',
    'version': '1.0',
    'depends': ['point_of_sale',],
    'images': ['static/description/main_screenshot.png'],
    'data': [
        'views/res_users_view.xml',
        'views/pos_kitchen_screen.xml',
        'views/kitchen_screen_view.xml',
        'views/kitchen_room.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'auto_install': False
}

