const axios = require('axios');
const { isSsoEnabled } = require('../config/keycloak');

let adminToken = null;
let adminTokenExpiry = null;

/**
 * Keycloak Admin API 토큰 발급
 */
const getAdminToken = async () => {
  if (!isSsoEnabled()) {
    return null;
  }

  // 토큰이 아직 유효하면 재사용
  if (adminToken && adminTokenExpiry && Date.now() < adminTokenExpiry) {
    return adminToken;
  }

  try {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

    // Admin 토큰은 항상 master realm에서 발급
    const response = await axios.post(
      `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: adminUsername,
        password: adminPassword,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    adminToken = response.data.access_token;
    // 토큰 만료 5분 전에 갱신
    adminTokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    return adminToken;
  } catch (error) {
    console.error('Keycloak Admin 토큰 발급 실패:', error.message);
    return null;
  }
};

/**
 * Keycloak에 사용자 생성
 */
const createKeycloakUser = async (email, password, name) => {
  if (!isSsoEnabled()) {
    return null;
  }

  const token = await getAdminToken();
  if (!token) {
    throw new Error('Keycloak Admin 토큰을 발급할 수 없습니다');
  }

  try {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'master';

    // 1. 사용자 생성
    const createUserResponse = await axios.post(
      `${keycloakUrl}/admin/realms/${realm}/users`,
      {
        username: email,
        email: email,
        firstName: name,
        enabled: true,
        emailVerified: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 사용자 ID 추출 (Location 헤더에서)
    const userId = createUserResponse.headers.location?.split('/').pop();
    if (!userId) {
      throw new Error('사용자 ID를 가져올 수 없습니다');
    }

    // 2. 비밀번호 설정
    await axios.put(
      `${keycloakUrl}/admin/realms/${realm}/users/${userId}/reset-password`,
      {
        type: 'password',
        value: password,
        temporary: false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return userId;
  } catch (error) {
    if (error.response?.status === 409) {
      // 이미 존재하는 사용자
      throw new Error('Keycloak에 이미 등록된 이메일입니다');
    }
    console.error('Keycloak 사용자 생성 실패:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Keycloak에서 사용자 조회
 */
const findKeycloakUser = async (email) => {
  if (!isSsoEnabled()) {
    return null;
  }

  const token = await getAdminToken();
  if (!token) {
    return null;
  }

  try {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'master';

    const response = await axios.get(
      `${keycloakUrl}/admin/realms/${realm}/users`,
      {
        params: {
          email: email,
          exact: true,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Keycloak 사용자 조회 실패:', error.message);
    return null;
  }
};

module.exports = {
  createKeycloakUser,
  findKeycloakUser,
};

