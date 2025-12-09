/**
 * 성공 응답 생성
 * @param {Object} res - Express response 객체
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 응답 메시지
 * @param {Object} data - 응답 데이터
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * 에러 응답 생성
 * @param {Object} res - Express response 객체
 * @param {number} statusCode - HTTP 상태 코드
 * @param {string} message - 에러 메시지
 * @param {Array} errors - 상세 에러 목록
 * @param {string} code - 에러 코드
 */
const errorResponse = (res, statusCode, message, errors = null, code = null) => {
  const response = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse,
};

