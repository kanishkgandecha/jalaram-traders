/**
 * Response Helper Utilities
 * ==========================
 * Standardized API response format for consistency
 * 
 * @module shared/utils/responsehelper
 */

/**
 * Send a success response
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of detailed errors (for validation)
 */
const sendError = (res, statusCode = 500, message = 'Server Error', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        message,
        data,
        meta: {
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        },
    });
};

/**
 * Standard HTTP status codes with messages
 */
const HttpStatus = {
    OK: { code: 200, message: 'OK' },
    CREATED: { code: 201, message: 'Created' },
    NO_CONTENT: { code: 204, message: 'No Content' },
    BAD_REQUEST: { code: 400, message: 'Bad Request' },
    UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
    FORBIDDEN: { code: 403, message: 'Forbidden' },
    NOT_FOUND: { code: 404, message: 'Not Found' },
    CONFLICT: { code: 409, message: 'Conflict' },
    UNPROCESSABLE: { code: 422, message: 'Unprocessable Entity' },
    SERVER_ERROR: { code: 500, message: 'Internal Server Error' },
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated,
    HttpStatus,
};
