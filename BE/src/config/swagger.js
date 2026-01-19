import swaggerJsdoc from "swagger-jsdoc";

const serverUrl = process.env.API_URL;

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Phonify API",
            version: "1.0.0",
            description: "API documentation for Phonify backend",
        },
        servers: [
            {
                url: serverUrl,
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "access_token",
                },
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT access token (lấy từ response login)",
                },
            },
        },
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
