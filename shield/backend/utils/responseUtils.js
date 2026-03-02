const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
};

const error = (res, message = 'Internal server error', statusCode = 500, details = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };
    if (details && process.env.NODE_ENV === 'development') {
        response.details = details;
    }
    return res.status(statusCode).json(response);
};

const paginated = (res, data, total, page, limit) => {
    return res.status(200).json({
        success: true,
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    });
};

module.exports = { success, error, paginated };
