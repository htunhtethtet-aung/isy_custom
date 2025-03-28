# Copyright 2015 LasLabs Inc.
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

import operator

from odoo import http
from odoo.http import request
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.addons.web.controllers.main import  Session
from odoo.addons.web.controllers.utils import ensure_db


from ..exceptions import PassError


class PasswordSecuritySession(Session):

    @http.route()
    def change_password(self, fields):
        new_password = operator.itemgetter('new_password')(
            dict(list(map(operator.itemgetter('name', 'value'), fields)))
        )
        user_id = request.env.user
        user_id._check_password(new_password)
        return super(PasswordSecuritySession, self).change_password(fields)


class PasswordSecurityHome(AuthSignupHome):

    def get_auth_signup_qcontext(self):
        res_users = request.env['res.users'].sudo()
        qcontext = super(PasswordSecurityHome, self).get_auth_signup_qcontext()
        login = qcontext.get('login')
        if login:
            user_ids = res_users.search(
                [('login', '=', login)],
                limit=1,
            )
            if not user_ids:
                user_ids = res_users.search(
                    [('email', '=', login)],
                    limit=1,
                )
            company = user_ids.company_id
        else:
            company = request.env['res.company'].sudo()._company_default_get()
        if company:
            data = {
                # re-write value from `auth_password_policy_signup`
                "password_minimum_length": company.password_length,
                # new values
                "password_length": company.password_length,
                "password_lower": company.password_lower,
                "password_upper": company.password_upper,
                "password_numeric": company.password_numeric,
                "password_special": company.password_special,
            }
        else:
            data = {
                # re-write value from `auth_password_policy_signup`
                "password_minimum_length": 8,
                # default values
                "password_length": 8,
                "password_lower": 1,
                "password_upper": 1,
                "password_numeric": 1,
                "password_special": 1,
            }
        qcontext.update(data)
        return qcontext

    def do_signup(self, qcontext):
        password = qcontext.get('password')
        user_id = request.env.user
        user_id._check_password(password)
        return super(PasswordSecurityHome, self).do_signup(qcontext)

    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        response = super(PasswordSecurityHome, self).web_login(*args, **kw)
        if not request.params.get("login_success"):
            return response
        # Now, I'm an authenticated user
        if not request.env.user._password_has_expired():
            return response
        # My password is expired, kick me out
        request.env.user.action_expire_password()
        request.session.logout(keep_db=True)
        redirect = request.env.user.partner_id.signup_url
        return http.redirect_with_hash(redirect)

    @http.route()
    def web_auth_signup(self, *args, **kw):
        try:
            return super(PasswordSecurityHome, self).web_auth_signup(
                *args, **kw
            )
        except PassError as e:
            qcontext = self.get_auth_signup_qcontext()
            qcontext['error'] = str(e)
            return request.render('auth_signup.signup', qcontext)

    @http.route()
    def web_auth_reset_password(self, *args, **kw):
        """ It provides hook to disallow front-facing resets inside of min
        Unfortuantely had to reimplement some core logic here because of
        nested logic in parent
        """
        qcontext = self.get_auth_signup_qcontext()
        if (
            request.httprequest.method == 'POST' and
            qcontext.get('login') and
            'error' not in qcontext and
            'token' not in qcontext
        ):
            login = qcontext.get('login')
            user_ids = request.env.sudo().search(
                [('login', '=', login)],
                limit=1,
            )
            if not user_ids:
                user_ids = request.env.sudo().search(
                    [('email', '=', login)],
                    limit=1,
                )
            user_ids._validate_pass_reset()
        return super(PasswordSecurityHome, self).web_auth_reset_password(
            *args, **kw
        )
