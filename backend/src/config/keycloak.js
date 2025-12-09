const session = require('express-session');
const Keycloak = require('keycloak-connect');

let keycloak = null;
let memoryStore = null;

/**
 * SSO 활성화 여부 확인
 */
const isSsoEnabled = () => {
  return process.env.SSO_ENABLED === 'true';
};

/**
 * Keycloak 초기화
 */
const initKeycloak = () => {
  if (!isSsoEnabled()) {
    console.log('ℹ️  SSO 비활성화 상태 (SSO_ENABLED=false)');
    return null;
  }

  if (keycloak) {
    return keycloak;
  }

  memoryStore = new session.MemoryStore();

  const keycloakConfig = {
    realm: process.env.KEYCLOAK_REALM || 'master',
    'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080/',
    'ssl-required': process.env.NODE_ENV === 'production' ? 'all' : 'external',
    resource: process.env.KEYCLOAK_CLIENT_ID || 'my-app',
    'public-client': true,
    'confidential-port': 0,
  };

  keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
  
  console.log('✅ Keycloak SSO 초기화 완료');
  console.log(`   📌 Realm: ${keycloakConfig.realm}`);
  console.log(`   📌 URL: ${keycloakConfig['auth-server-url']}`);
  console.log(`   📌 Client: ${keycloakConfig.resource}`);

  return keycloak;
};

/**
 * 세션 미들웨어 반환
 */
const getSessionMiddleware = () => {
  if (!memoryStore) {
    memoryStore = new session.MemoryStore();
  }

  return session({
    secret: process.env.SESSION_SECRET || 'my-session-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  });
};

/**
 * Keycloak 인스턴스 반환
 */
const getKeycloak = () => {
  if (!keycloak) {
    initKeycloak();
  }
  return keycloak;
};

module.exports = {
  isSsoEnabled,
  initKeycloak,
  getKeycloak,
  getSessionMiddleware,
};

