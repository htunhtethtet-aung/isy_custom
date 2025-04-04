# -*- coding: utf-8 -*-
# Part of AktivSoftware See LICENSE file for full copyright
# and licensing details.
{
    'name': "User Activity Log",

    'summary': """
        The module will show the recent activity of users""",

    'description': """
        The module will show the recent activity of users""",

    'author': "Aktiv Software",
    'website': "http://www.aktivsoftware.com",
    'category': 'web',
    'version': '1.0.0',
    'license': "AGPL-3",

    # any module necessary for this one to work correctly
    'depends': ['base'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'security/user_log_security.xml',
        'views/user_activity_view.xml',
        'views/custom_xml.xml',

    ],
    'qweb': ['static/src/xml/user_menu_template.xml'],
    'images': [
        'static/description/banner.jpg',
    ],
    #'assets': {
    #    'web.assets_backend': [
    #        'user_recent_log/static/src/js/custom_rpc.js',
    #        'user_recent_log/static/src/js/user_menu_custom.js',
    #    ],
    #},
    'installable': True,
    'application': True
}
