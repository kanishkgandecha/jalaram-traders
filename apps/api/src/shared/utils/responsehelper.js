/**
 * Response Helper
 * ================
 * Standardized API response utilities
 * 
 * @module shared/utils/responsehelper
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors (optional)
 */
const sendError = (res, statusCode = 500, message = 'Server Error', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null) {
        response.errors = errors;
    }

    res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info (page, limit, total, totalPages)
 */
const sendPaginated = (res, data, pagination) => {
    const totalPages = pagination.totalPages || Math.ceil(pagination.total / pagination.limit);
    const currentPage = pagination.page;

    res.status(200).json({
        success: true,
        data,
        meta: {
            pagination: {
                page: currentPage,
                limit: pagination.limit,
                total: pagination.total,
                totalPages,
                hasMore: currentPage < totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        },
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated,
};
