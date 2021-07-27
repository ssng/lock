import React from 'react';
import Screen from '../../core/screen';
import SocialButtonsPane from '../../field/social/social_buttons_pane';
import LoginPane from '../../connection/database/login_pane';
import PaneSeparator from '../../core/pane_separator';
import {
  databaseConnection,
  databaseUsernameStyle,
  databaseUsernameValue,
  defaultDatabaseConnection,
  hasInitialScreen,
  hasScreen,
  signUpLink
} from '../../connection/database/index';
import { logIn as databaseLogIn } from '../../connection/database/actions';
import { renderSignedInConfirmation } from '../../core/signed_in_confirmation';
import LoginSignUpTabs from '../../connection/database/login_sign_up_tabs';
import * as l from '../../core/index';
import { logIn as enterpriseLogIn, startHRD } from '../../connection/enterprise/actions';
import {
  matchConnection, // SSH
  defaultEnterpriseConnection,
  findADConnectionWithoutDomain,
  isHRDDomain
} from '../../connection/enterprise';
import SingleSignOnNotice from '../../connection/enterprise/single_sign_on_notice';
import { hasOnlyClassicConnections, isSSOEnabled } from '../classic';
import * as i18n from '../../i18n';
// SSH
import { authButtonsTheme } from '../../connection/social/index';
import QuickAuthPane from '../../ui/pane/quick_auth_pane';
import { password } from '../../field/index';

function shouldRenderTabs(m) {
  if (isSSOEnabled(m)) return false;
  if (l.hasSomeConnections(m, 'database')) return hasScreen(m, 'signUp');
  if (l.hasSomeConnections(m, 'social') && hasInitialScreen(m, 'signUp'))
    return hasScreen(m, 'signUp');
}

// SSH
// TODO: handle this from CSS
function icon(strategy) {
  if (strategy === 'google-apps') return strategy;
  if (~['adfs', 'office365', 'waad'].indexOf(strategy)) return 'windows';
  return 'auth0';
}

const Component = ({ i18n, model }) => {
  const sso = isSSOEnabled(model);
  const onlySocial = hasOnlyClassicConnections(model, 'social');

  const tabs = shouldRenderTabs(model) && (
    <LoginSignUpTabs
      key="loginsignup"
      lock={model}
      loginLabel={i18n.str('loginLabel')}
      signUpLink={signUpLink(model)}
      signUpLabel={i18n.str('signUpLabel')}
    />
  );

  const social = l.hasSomeConnections(model, 'social') && (
    <SocialButtonsPane
      instructions={i18n.html('socialLoginInstructions')}
      labelFn={i18n.str}
      lock={model}
      showLoading={onlySocial}
      signUp={false}
    />
  );

  // SSH
  const showPassword =
    l.hasSomeConnections(model, 'database') &&
    !l.hasSomeConnections(model, 'enterprise') &&
    !l.hasSomeConnections(model, 'social');
  // SSH   (l.hasSomeConnections(model, 'database') || !!findADConnectionWithoutDomain(model));
  // ORIGINAL    !sso && (l.hasSomeConnections(model, 'database') || !!findADConnectionWithoutDomain(model));

  const showForgotPasswordLink = showPassword && l.hasSomeConnections(model, 'database');

  const loginInstructionsKey = social
    ? 'databaseEnterpriseAlternativeLoginInstructions'
    : 'databaseEnterpriseLoginInstructions';

  // SSH replace 'or' with header for login panel
  //const loginPanelHeader = l.hasSomeConnections(model, 'database') ? 'Sharp Synappx Account' : social ? i18n.html(loginInstructionsKey) : 'Sharp Synappx Login';
  const loginPanelHeader = 'Sharp Synappx Account';

  const usernameInputPlaceholderKey =
    databaseUsernameStyle(model) === 'any' || l.countConnections(model, 'enterprise') > 1
      ? 'usernameOrEmailInputPlaceholder'
      : 'usernameInputPlaceholder';

  const usernameStyle = databaseUsernameStyle(model);

  const login = (sso ||
    l.hasSomeConnections(model, 'database') ||
    l.hasSomeConnections(model, 'enterprise')) && (
    <LoginPane
      emailInputPlaceholder={i18n.str('emailInputPlaceholder')}
      forgotPasswordAction={i18n.str('forgotPasswordAction')}
      i18n={i18n}
      //instructions={i18n.html(loginInstructionsKey)}
      instructions={loginPanelHeader}
      lock={model}
      passwordInputPlaceholder={i18n.str('passwordInputPlaceholder')}
      showForgotPasswordLink={showForgotPasswordLink}
      showPassword={showPassword}
      usernameInputPlaceholder={i18n.str(usernameInputPlaceholderKey)}
      usernameStyle={usernameStyle}
    />
  );

  const ssoNotice = sso && <SingleSignOnNotice>{i18n.str('ssoEnabled')}</SingleSignOnNotice>;

  const separator = social && login && <PaneSeparator />;

  // SSH
  const separator2 = sso && login && <PaneSeparator />;
  //const separator2 = sso && l.hasSomeConnections(model, 'database') && login && <PaneSeparator />;
  const ssoConnection = sso && matchConnection(model, databaseUsernameValue(model));
  const theme = authButtonsTheme(model);
  const buttonTheme = theme && ssoConnection && theme.get(ssoConnection.get('name'));
  const connectionDomain = ssoConnection && ssoConnection.getIn(['domains', 0]);
  const connectionStrategy =
    ssoConnection &&
    (ssoConnection.get('strategy') === 'waad' ? 'Microsoft 365' : 'Google Workspace');
  const buttonLabel =
    (buttonTheme && buttonTheme.get('displayName')) ||
    (connectionDomain && i18n.str('loginAtLabel', connectionStrategy));
  const primaryColor = buttonTheme && buttonTheme.get('primaryColor');
  const foregroundColor = buttonTheme && buttonTheme.get('foregroundColor');
  const buttonIcon = buttonTheme && buttonTheme.get('icon');

  const quickAuth = sso && (
    <QuickAuthPane
      buttonLabel={buttonLabel}
      buttonClickHandler={e => enterpriseLogIn(1)}
      //header={headerText}
      buttonIcon={buttonIcon}
      primaryColor={primaryColor}
      foregroundColor={foregroundColor}
      strategy={icon(ssoConnection.get('strategy'))}
    />
  );

  const dbConnections = l.connections(model, 'database'); // support multiple DB connections
  // first DB connection
  const dbSeparator = (l.hasSomeConnections(model, 'enterprise') ||
    l.hasSomeConnections(model, 'social')) &&
    l.hasSomeConnections(model, 'database') &&
    login && <PaneSeparator />;
  const dbConnection = l.hasSomeConnections(model, 'database') && dbConnections.get(0); // get first DB connection
  const dbButtonTheme = theme && dbConnection && theme.get(dbConnection.get('name'));
  const dbButtonLabel =
    (dbButtonTheme && dbButtonTheme.get('displayName')) ||
    (dbConnection && dbConnection.get('name'));
  const dbPrimaryColor = dbButtonTheme && dbButtonTheme.get('primaryColor');
  const dbForegroundColor = dbButtonTheme && dbButtonTheme.get('foregroundColor');
  const dbButtonIcon = dbButtonTheme && dbButtonTheme.get('icon');
  let dbUrlPart = '';
  for (const param in config.extraParams) {
    if (!param.startsWith('_') && param !== 'state') {
      if (dbUrlPart != '') {
        dbUrlPart += '&';
      }
      dbUrlPart += param === 'x_state' ? 'state' : param;
      dbUrlPart += '=';
      dbUrlPart += encodeURIComponent(config.extraParams[param]);
    }
  }
  const dbUrlLastPart =
    dbConnection &&
    '&redirect_uri=' +
      encodeURIComponent(config.callbackURL) +
      '&client_id=' +
      encodeURIComponent(config.clientID) +
      '&connection=' +
      encodeURIComponent(dbConnection.get('name')) +
      '&login_hint=' +
      encodeURIComponent(databaseUsernameValue(model));
  const dbClickUrl = config.authorizationServer.issuer + 'authorize?' + dbUrlPart + dbUrlLastPart;

  const dbAuth = (l.hasSomeConnections(model, 'enterprise') ||
    l.hasSomeConnections(model, 'social')) &&
    dbConnection && (
      <QuickAuthPane
        buttonLabel={dbButtonLabel}
        buttonClickHandler={e => (location.href = dbClickUrl)}
        //header={headerText}
        buttonIcon={dbButtonIcon}
        primaryColor={dbPrimaryColor}
        foregroundColor={dbForegroundColor}
        strategy={dbConnection.get('strategy')}
      />
    );

  // second DB connection
  const dbSeparator2 = (l.hasSomeConnections(model, 'enterprise') ||
    l.hasSomeConnections(model, 'social')) &&
    l.hasSomeConnections(model, 'database') &&
    login &&
    dbConnections.count() > 1 && <PaneSeparator />;
  const dbConnection2 =
    l.hasSomeConnections(model, 'database') && dbConnections.count() > 1 && dbConnections.get(1); // get second DB connection
  const dbButtonTheme2 = theme && dbConnection2 && theme.get(dbConnection2.get('name'));
  const dbButtonLabel2 =
    (dbButtonTheme2 && dbButtonTheme2.get('displayName')) ||
    (dbConnection2 && dbConnection2.get('name'));
  const dbPrimaryColor2 = dbButtonTheme2 && dbButtonTheme2.get('primaryColor');
  const dbForegroundColor2 = dbButtonTheme2 && dbButtonTheme2.get('foregroundColor');
  const dbButtonIcon2 = dbButtonTheme2 && dbButtonTheme2.get('icon');
  let dbUrlPart2 = '';
  for (const param in config.extraParams) {
    if (!param.startsWith('_') && param !== 'state') {
      if (dbUrlPart2 != '') {
        dbUrlPart2 += '&';
      }
      dbUrlPart2 += param;
      dbUrlPart2 += '=';
      dbUrlPart2 += encodeURIComponent(config.extraParams[param]);
    }
  }
  const dbUrlLastPart2 =
    dbConnection2 &&
    '&redirect_uri=' +
      encodeURIComponent(config.callbackURL) +
      '&client_id=' +
      encodeURIComponent(config.clientID) +
      '&connection=' +
      encodeURIComponent(dbConnection2.get('name')) +
      '&login_hint=' +
      encodeURIComponent(databaseUsernameValue(model));
  const dbClickUrl2 =
    config.authorizationServer.issuer + 'authorize?' + dbUrlPart2 + dbUrlLastPart2;

  const dbAuth2 = (l.hasSomeConnections(model, 'enterprise') ||
    l.hasSomeConnections(model, 'social')) &&
    dbConnection2 && (
      <QuickAuthPane
        buttonLabel={dbButtonLabel2}
        buttonClickHandler={e => (location.href = dbClickUrl2)}
        //header={headerText}
        buttonIcon={dbButtonIcon2}
        primaryColor={dbPrimaryColor2}
        foregroundColor={dbForegroundColor2}
        strategy={dbConnection2.get('strategy')}
      />
    );

  return (
    <div>
      {ssoNotice}
      {tabs}
      <div>
        {social}
        {separator}
        {dbAuth}
        {dbSeparator}
        {dbAuth2}
        {dbSeparator2}
        {quickAuth}
        {separator2}
        {login}
      </div>
    </div>
  );
};

export default class Login extends Screen {
  constructor() {
    super('main.login');
  }

  renderAuxiliaryPane(lock) {
    return renderSignedInConfirmation(lock);
  }

  renderTabs(model) {
    return shouldRenderTabs(model);
  }

  submitButtonLabel(m) {
    return i18n.str(m, ['loginSubmitLabel']);
  }

  isSubmitDisabled(m) {
    // it should disable the submit button if there is any connection that
    // requires username/password and there is no enterprise with domain
    // that matches with the email domain entered for HRD
    return (
      // SSH disable login button until password field is not empty
      (l.hasSomeConnections(m, 'database') && password(m) === '') ||
      (!l.hasSomeConnections(m, 'database') && // no database connection
      !findADConnectionWithoutDomain(m) && // no enterprise without domain
        !isSSOEnabled(m))
    ); // no matching domain
  }

  submitHandler(model) {
    // SSH hide login button on first page
    if (l.hasSomeConnections(model, 'enterprise') || l.hasSomeConnections(model, 'social')) {
      return null;
    }

    if (hasOnlyClassicConnections(model, 'social')) {
      return null;
    }

    if (isHRDDomain(model, databaseUsernameValue(model))) {
      return id => startHRD(id, databaseUsernameValue(model));
    }

    const useDatabaseConnection =
      !isSSOEnabled(model) &&
      databaseConnection(model) &&
      (defaultDatabaseConnection(model) || !defaultEnterpriseConnection(model));

    // SSH
    return l.hasSomeConnections(model, 'database') ? databaseLogIn : enterpriseLogIn;
    //    return useDatabaseConnection ? databaseLogIn : enterpriseLogIn;
  }

  render() {
    return Component;
  }
}
