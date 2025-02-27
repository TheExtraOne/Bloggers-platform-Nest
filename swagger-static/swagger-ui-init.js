
window.onload = function() {
  // Build a system
  let url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  let options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "paths": {
      "/": {
        "get": {
          "operationId": "AppController_getHello",
          "parameters": [],
          "responses": {
            "200": {
              "description": "",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "tags": [
            "App"
          ]
        }
      },
      "/users": {
        "get": {
          "description": "Returns a paginated list of all users. Requires basic authentication.",
          "operationId": "UserController_getAllUsers",
          "parameters": [
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "login",
                  "email"
                ]
              }
            },
            {
              "name": "searchLoginTerm",
              "required": true,
              "in": "query",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            },
            {
              "name": "searchEmailTerm",
              "required": true,
              "in": "query",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            },
            {
              "name": "sortDirection",
              "required": true,
              "in": "query",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "pageNumber",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved users.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedUsersResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Get all users",
          "tags": [
            "User"
          ]
        },
        "post": {
          "description": "Creates a new user with unique login and email. Requires basic authentication. Will not send a confirmation email.",
          "operationId": "UserController_createUser",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Successfully created user.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UserViewDto"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Create new user",
          "tags": [
            "User"
          ]
        }
      },
      "/users/{id}": {
        "delete": {
          "description": "Deletes a user by their ID. Requires basic authentication. This operation cannot be undone.",
          "operationId": "UserController_deleteUser",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "User ID to delete",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "Successfully deleted user."
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Not Found"
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Delete user",
          "tags": [
            "User"
          ]
        }
      },
      "/auth/me": {
        "get": {
          "description": "Returns information about the currently authenticated user. Requires JWT authentication.",
          "operationId": "AuthController_getUserInformation",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Successfully retrieved user information.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/MeResponse"
                  }
                }
              }
            },
            "401": {
              "description": "User is not authenticated."
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Get information about current user",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/login": {
        "post": {
          "description": "Authenticates user and returns JWT tokens. Access token in response body, refresh token in cookie.",
          "operationId": "AuthController_login",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginInputDto"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Successfully authenticated.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/LoginResponse"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Invalid credentials."
            }
          },
          "summary": "Login user",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/refresh-token": {
        "post": {
          "description": "Uses refresh token from cookie to generate new pair of access and refresh tokens",
          "operationId": "AuthController_refreshToken",
          "parameters": [],
          "responses": {
            "200": {
              "description": "Success. Returns new access token",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "object",
                    "properties": {
                      "accessToken": {
                        "type": "string",
                        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      }
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized. Invalid or expired refresh token"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Refresh JWT tokens",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/logout": {
        "post": {
          "description": "Terminates the current user session and invalidates the refresh token",
          "operationId": "AuthController_logout",
          "parameters": [],
          "responses": {
            "204": {
              "description": "User has been successfully logged out"
            },
            "401": {
              "description": "JWT refresh token is missing, expired or invalid",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Logout user from the system",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/registration": {
        "post": {
          "description": "Creates a new user account. An email with confirmation code will be sent.",
          "operationId": "AuthController_createUser",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "User successfully registered."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds."
            }
          },
          "summary": "Register new user",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/registration-confirmation": {
        "post": {
          "description": "Confirms user registration using the code received via email.",
          "operationId": "AuthController_confirmRegistration",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ConfirmRegistrationInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Registration successfully confirmed."
            },
            "400": {
              "description": "If the confirmation code is incorrect, expired or already been applied.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds."
            }
          },
          "summary": "Confirm user registration",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/registration-email-resending": {
        "post": {
          "description": "Resends the registration confirmation email with a new confirmation code.",
          "operationId": "AuthController_registrationEmailResending",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ResendRegistrationInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Confirmation email successfully resent."
            },
            "400": {
              "description": "Invalid email or email already confirmed.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds."
            }
          },
          "summary": "Resend registration confirmation email",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/password-recovery": {
        "post": {
          "description": "Initiates password recovery process. A recovery code will be sent to the provided email.",
          "operationId": "AuthController_passwordRecovery",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PasswordRecoveryInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Recovery email successfully sent."
            },
            "400": {
              "description": "Invalid email format.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds."
            }
          },
          "summary": "Request password recovery",
          "tags": [
            "Auth"
          ]
        }
      },
      "/auth/new-password": {
        "post": {
          "description": "Sets a new password using the recovery code received via email.",
          "operationId": "AuthController_newPassword",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NewPasswordInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Password successfully updated."
            },
            "400": {
              "description": "Invalid input data or recovery code.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "429": {
              "description": "More than 5 attempts from one IP-address during 10 seconds."
            }
          },
          "summary": "Set new password",
          "tags": [
            "Auth"
          ]
        }
      },
      "/security/devices": {
        "get": {
          "description": "Returns all active sessions for the authenticated user. Protected by JWT Refresh token which should be provided in cookies.",
          "operationId": "SecurityController_getAllActiveSessions",
          "parameters": [],
          "responses": {
            "200": {
              "description": "List of active sessions successfully returned",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/SessionsViewDto"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized - refresh token is missing, expired or invalid"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Get all active sessions for current user",
          "tags": [
            "Security"
          ]
        },
        "delete": {
          "description": "Terminates all user sessions except the one from which the request is made. Protected by JWT Refresh token which should be provided in cookies.",
          "operationId": "SecurityController_terminateAllActiveSessions",
          "parameters": [],
          "responses": {
            "204": {
              "description": "All sessions (except current) have been successfully terminated"
            },
            "401": {
              "description": "Unauthorized - refresh token is missing, expired or invalid"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Terminate all sessions except current",
          "tags": [
            "Security"
          ]
        }
      },
      "/security/devices/{id}": {
        "delete": {
          "description": "Terminates a specific session by its deviceId. User can only terminate their own sessions. Protected by JWT Refresh token which should be provided in cookies.",
          "operationId": "SecurityController_terminateSessionById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Device ID of the session to terminate",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "Session has been successfully terminated"
            },
            "401": {
              "description": "Unauthorized - refresh token is missing, expired or invalid"
            },
            "403": {
              "description": "Forbidden - attempting to terminate session that belongs to another user"
            },
            "404": {
              "description": "Session not found"
            }
          },
          "security": [
            {
              "refreshToken": []
            }
          ],
          "summary": "Terminate specific session by id",
          "tags": [
            "Security"
          ]
        }
      },
      "/testing/all-data": {
        "delete": {
          "description": "Removes all data from all collections in the database. Use only for testing purposes.",
          "operationId": "TestingController_deleteAll",
          "parameters": [],
          "responses": {
            "204": {
              "description": "All data has been successfully deleted."
            }
          },
          "summary": "Delete all data",
          "tags": [
            "Testing"
          ]
        }
      },
      "/blogs": {
        "get": {
          "description": "Returns a paginated list of all blogs. Can be filtered by name and sorted.",
          "operationId": "BlogsController_getAllBlogs",
          "parameters": [
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "name",
                  "description",
                  "websiteUrl",
                  "isMembership"
                ]
              }
            },
            {
              "name": "searchNameTerm",
              "required": true,
              "in": "query",
              "schema": {
                "nullable": true,
                "default": null,
                "type": "string"
              }
            },
            {
              "name": "sortDirection",
              "required": true,
              "in": "query",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "pageNumber",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved blogs.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedBlogsResponse"
                  }
                }
              }
            }
          },
          "summary": "Get all blogs",
          "tags": [
            "Blogs"
          ]
        },
        "post": {
          "description": "Creates a new blog. Requires basic authentication.",
          "operationId": "BlogsController_createBlog",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateBlogInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Blog successfully created.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/BlogsViewDto"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Create new blog",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/blogs/{id}": {
        "get": {
          "description": "Returns a single blog by its ID.",
          "operationId": "BlogsController_getBlogById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Blog ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved blog.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/BlogsViewDto"
                  }
                }
              }
            },
            "404": {
              "description": "Blog not found."
            }
          },
          "summary": "Get blog by ID",
          "tags": [
            "Blogs"
          ]
        },
        "put": {
          "description": "Updates an existing blog by ID. Requires basic authentication.",
          "operationId": "BlogsController_updateBlogById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Blog ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateBlogInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Blog successfully updated."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Blog not found."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Update blog",
          "tags": [
            "Blogs"
          ]
        },
        "delete": {
          "description": "Deletes a blog by ID. Requires basic authentication.",
          "operationId": "BlogsController_deleteBlogById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Blog ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "Blog successfully deleted."
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Blog not found."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Delete blog",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/blogs/{id}/posts": {
        "get": {
          "description": "Returns a paginated list of all posts for a specific blog. Posts will include like status if user is authenticated.",
          "operationId": "BlogsController_getPostsByBlogId",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Blog ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "title",
                  "shortDescription",
                  "content",
                  "blogId",
                  "blogName"
                ]
              }
            },
            {
              "name": "sortDirection",
              "required": true,
              "in": "query",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "pageNumber",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved posts.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedPostsResponse"
                  }
                }
              }
            },
            "404": {
              "description": "Blog not found."
            }
          },
          "summary": "Get all posts for a blog",
          "tags": [
            "Blogs"
          ]
        },
        "post": {
          "description": "Creates a new post for a specific blog. Requires basic authentication.",
          "operationId": "BlogsController_createPostByBlogId",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Blog ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreatePostFromBlogInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Post successfully created.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PostViewModel"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Blog not found."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Create new post for blog",
          "tags": [
            "Blogs"
          ]
        }
      },
      "/posts": {
        "get": {
          "description": "Returns a paginated list of all posts. Posts will include like status if user is authenticated.",
          "operationId": "PostsController_getAllPosts",
          "parameters": [
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "title",
                  "shortDescription",
                  "content",
                  "blogId",
                  "blogName"
                ]
              }
            },
            {
              "name": "sortDirection",
              "required": true,
              "in": "query",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "pageNumber",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved posts.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedPostsResponse"
                  }
                }
              }
            }
          },
          "summary": "Get all posts",
          "tags": [
            "Posts"
          ]
        },
        "post": {
          "description": "Creates a new post. Requires basic authentication.",
          "operationId": "PostsController_createPost",
          "parameters": [],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreatePostInputDto"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Post successfully created.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PostViewModel"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Create new post",
          "tags": [
            "Posts"
          ]
        }
      },
      "/posts/{id}": {
        "get": {
          "description": "Returns a single post by its ID. Post will include like status if user is authenticated.",
          "operationId": "PostsController_getPostById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved post.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PostViewModel"
                  }
                }
              }
            },
            "404": {
              "description": "Post not found."
            }
          },
          "summary": "Get post by ID",
          "tags": [
            "Posts"
          ]
        },
        "put": {
          "description": "Updates an existing post by ID. Requires basic authentication.",
          "operationId": "PostsController_updatePostById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdatePostInputDto"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Post successfully updated."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Post not found."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Update post",
          "tags": [
            "Posts"
          ]
        },
        "delete": {
          "description": "Deletes a post by ID. Requires basic authentication.",
          "operationId": "PostsController_deletePostById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "Post successfully deleted."
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Post not found."
            }
          },
          "security": [
            {
              "basicAuth": []
            }
          ],
          "summary": "Delete post",
          "tags": [
            "Posts"
          ]
        }
      },
      "/posts/{id}/comments": {
        "get": {
          "description": "Returns a paginated list of all comments for a specific post. Comments will include like status if user is authenticated.",
          "operationId": "PostsController_getAllCommentsForPostId",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "sortBy",
              "required": true,
              "in": "query",
              "schema": {
                "default": "createdAt",
                "type": "string",
                "enum": [
                  "createdAt",
                  "content"
                ]
              }
            },
            {
              "name": "sortDirection",
              "required": true,
              "in": "query",
              "schema": {
                "default": "desc",
                "type": "string",
                "enum": [
                  "asc",
                  "desc"
                ]
              }
            },
            {
              "name": "pageNumber",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 1,
                "type": "number"
              }
            },
            {
              "name": "pageSize",
              "required": true,
              "in": "query",
              "schema": {
                "minimum": 1,
                "default": 10,
                "type": "number"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Successfully retrieved comments.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/PaginatedCommentsResponse"
                  }
                }
              }
            },
            "404": {
              "description": "Post not found."
            }
          },
          "summary": "Get all comments for a post",
          "tags": [
            "Posts"
          ]
        },
        "post": {
          "description": "Creates a new comment for a specific post. Requires JWT authentication.",
          "operationId": "PostsController_createCommentByPostId",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "description": "Comment data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCommentInputModel"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Comment successfully created.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CommentViewModel"
                  }
                }
              }
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Post not found."
            }
          },
          "security": [
            {
              "JWT": []
            }
          ],
          "summary": "Create new comment for post",
          "tags": [
            "Posts"
          ]
        }
      },
      "/posts/{id}/like-status": {
        "put": {
          "description": "Updates like status for a post. Requires JWT authentication.",
          "operationId": "PostsController_updateLikeStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Post ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "description": "Like status data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateLikeStatusInputModel"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Like status successfully updated."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Post not found."
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Update post like status",
          "tags": [
            "Posts"
          ]
        }
      },
      "/comments/{id}": {
        "get": {
          "description": "Returns a comment by ID. Like status will be included if user is authenticated.",
          "operationId": "CommentsController_getCommentById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Comment ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Comment found and returned.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CommentViewModel"
                  }
                }
              }
            },
            "404": {
              "description": "Comment not found."
            }
          },
          "summary": "Get comment by ID",
          "tags": [
            "Comments"
          ]
        },
        "put": {
          "description": "Updates a comment by ID. Only the owner can update their comment.",
          "operationId": "CommentsController_updateCommentById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Comment ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "description": "Updated comment data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateCommentInputModel"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Comment successfully updated."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "403": {
              "description": "User is not the owner of the comment."
            },
            "404": {
              "description": "Comment not found."
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Update comment",
          "tags": [
            "Comments"
          ]
        },
        "delete": {
          "description": "Deletes a comment by ID. Only the owner can delete their comment.",
          "operationId": "CommentsController_deleteCommentById",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Comment ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "Comment successfully deleted."
            },
            "401": {
              "description": "Unauthorized."
            },
            "403": {
              "description": "User is not the owner of the comment."
            },
            "404": {
              "description": "Comment not found."
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Delete comment",
          "tags": [
            "Comments"
          ]
        }
      },
      "/comments/{id}/like-status": {
        "put": {
          "description": "Updates like status for a comment. Requires JWT authentication.",
          "operationId": "CommentsController_updateLikeStatus",
          "parameters": [
            {
              "name": "id",
              "required": true,
              "in": "path",
              "description": "Comment ID",
              "schema": {
                "type": "string"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "description": "Like status data",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateLikeStatusInputModel"
                }
              }
            }
          },
          "responses": {
            "204": {
              "description": "Like status successfully updated."
            },
            "400": {
              "description": "Invalid input data.",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/APIErrorResultResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized."
            },
            "404": {
              "description": "Comment not found."
            }
          },
          "security": [
            {
              "bearer": []
            }
          ],
          "summary": "Update comment like status",
          "tags": [
            "Comments"
          ]
        }
      }
    },
    "info": {
      "title": "BLOGGER API",
      "description": "",
      "version": "1.0",
      "contact": {}
    },
    "tags": [],
    "servers": [],
    "components": {
      "securitySchemes": {
        "bearer": {
          "scheme": "bearer",
          "bearerFormat": "JWT",
          "type": "http"
        },
        "basicAuth": {
          "type": "http",
          "scheme": "basic"
        }
      },
      "schemas": {
        "UserViewDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "login": {
              "type": "string"
            },
            "email": {
              "type": "string"
            },
            "createdAt": {
              "format": "date-time",
              "type": "string"
            }
          },
          "required": [
            "id",
            "login",
            "email",
            "createdAt"
          ]
        },
        "PaginatedUsersResponse": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/UserViewDto"
              }
            },
            "totalCount": {
              "type": "number"
            },
            "pagesCount": {
              "type": "number"
            },
            "page": {
              "type": "number"
            },
            "pageSize": {
              "type": "number"
            }
          },
          "required": [
            "items",
            "totalCount",
            "pagesCount",
            "page",
            "pageSize"
          ]
        },
        "CreateUserInputDto": {
          "type": "object",
          "properties": {
            "login": {
              "type": "string",
              "minLength": 3,
              "maxLength": 10,
              "pattern": "/^[a-zA-Z0-9_-]*$/",
              "description": "Must be unique"
            },
            "email": {
              "type": "string",
              "format": "email",
              "pattern": "/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/",
              "description": "Must be unique"
            },
            "password": {
              "type": "string",
              "minLength": 6,
              "maxLength": 20
            }
          },
          "required": [
            "login",
            "email",
            "password"
          ]
        },
        "ErrorMessageResponse": {
          "type": "object",
          "properties": {
            "message": {
              "type": "string"
            },
            "field": {
              "type": "string"
            }
          },
          "required": [
            "message",
            "field"
          ]
        },
        "APIErrorResultResponse": {
          "type": "object",
          "properties": {
            "errorsMessages": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ErrorMessageResponse"
              }
            }
          },
          "required": [
            "errorsMessages"
          ]
        },
        "MeResponse": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "example": "user@example.com"
            },
            "login": {
              "type": "string",
              "example": "johndoe"
            },
            "userId": {
              "type": "string",
              "example": "507f1f77bcf86cd799439011"
            }
          },
          "required": [
            "email",
            "login",
            "userId"
          ]
        },
        "LoginInputDto": {
          "type": "object",
          "properties": {
            "loginOrEmail": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "required": [
            "loginOrEmail",
            "password"
          ]
        },
        "LoginResponse": {
          "type": "object",
          "properties": {
            "accessToken": {
              "type": "string",
              "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              "description": "JWT access token"
            }
          },
          "required": [
            "accessToken"
          ]
        },
        "ConfirmRegistrationInputDto": {
          "type": "object",
          "properties": {
            "code": {
              "type": "string"
            }
          },
          "required": [
            "code"
          ]
        },
        "ResendRegistrationInputDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "format": "email",
              "pattern": "/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/"
            }
          },
          "required": [
            "email"
          ]
        },
        "PasswordRecoveryInputDto": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "format": "email",
              "pattern": "/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/"
            }
          },
          "required": [
            "email"
          ]
        },
        "NewPasswordInputDto": {
          "type": "object",
          "properties": {
            "newPassword": {
              "type": "string",
              "minLength": 6,
              "maxLength": 20
            },
            "recoveryCode": {
              "type": "string"
            }
          },
          "required": [
            "newPassword",
            "recoveryCode"
          ]
        },
        "SessionsViewDto": {
          "type": "object",
          "properties": {
            "ip": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "lastActiveDate": {
              "format": "date-time",
              "type": "string"
            },
            "deviceId": {
              "type": "string"
            }
          },
          "required": [
            "ip",
            "title",
            "lastActiveDate",
            "deviceId"
          ]
        },
        "BlogsViewDto": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "websiteUrl": {
              "type": "string"
            },
            "createdAt": {
              "format": "date-time",
              "type": "string"
            },
            "isMembership": {
              "type": "boolean"
            }
          },
          "required": [
            "id",
            "name",
            "description",
            "websiteUrl",
            "createdAt",
            "isMembership"
          ]
        },
        "PaginatedBlogsResponse": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/BlogsViewDto"
              }
            },
            "totalCount": {
              "type": "number"
            },
            "pagesCount": {
              "type": "number"
            },
            "page": {
              "type": "number"
            },
            "pageSize": {
              "type": "number"
            }
          },
          "required": [
            "items",
            "totalCount",
            "pagesCount",
            "page",
            "pageSize"
          ]
        },
        "NewestLikeInfo": {
          "type": "object",
          "properties": {
            "addedAt": {
              "format": "date-time",
              "type": "string",
              "description": "Date when the like was added"
            },
            "userId": {
              "type": "string",
              "description": "ID of the user who liked the post"
            },
            "login": {
              "type": "string",
              "description": "Login of the user who liked the post"
            }
          },
          "required": [
            "addedAt",
            "userId",
            "login"
          ]
        },
        "ExtendedLikesInfo": {
          "type": "object",
          "properties": {
            "likesCount": {
              "type": "number",
              "description": "Number of likes"
            },
            "dislikesCount": {
              "type": "number",
              "description": "Number of dislikes"
            },
            "myStatus": {
              "type": "string",
              "description": "Current user's like status",
              "enum": [
                "Like",
                "Dislike",
                "None"
              ],
              "example": "None"
            },
            "newestLikes": {
              "description": "List of the newest likes",
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/NewestLikeInfo"
              }
            }
          },
          "required": [
            "likesCount",
            "dislikesCount",
            "myStatus",
            "newestLikes"
          ]
        },
        "PostViewModel": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "Post ID"
            },
            "title": {
              "type": "string",
              "description": "Post title"
            },
            "shortDescription": {
              "type": "string",
              "description": "Short description of the post"
            },
            "content": {
              "type": "string",
              "description": "Post content"
            },
            "blogId": {
              "type": "string",
              "description": "Blog ID"
            },
            "blogName": {
              "type": "string",
              "description": "Blog name"
            },
            "createdAt": {
              "format": "date-time",
              "type": "string",
              "description": "Post creation date"
            },
            "extendedLikesInfo": {
              "description": "Extended information about likes",
              "allOf": [
                {
                  "$ref": "#/components/schemas/ExtendedLikesInfo"
                }
              ]
            }
          },
          "required": [
            "id",
            "title",
            "shortDescription",
            "content",
            "blogId",
            "blogName",
            "createdAt",
            "extendedLikesInfo"
          ]
        },
        "PaginatedPostsResponse": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/PostViewModel"
              }
            },
            "totalCount": {
              "type": "number"
            },
            "pagesCount": {
              "type": "number"
            },
            "page": {
              "type": "number"
            },
            "pageSize": {
              "type": "number"
            }
          },
          "required": [
            "items",
            "totalCount",
            "pagesCount",
            "page",
            "pageSize"
          ]
        },
        "CreateBlogInputDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "maxLength": 15
            },
            "description": {
              "type": "string",
              "maxLength": 500
            },
            "websiteUrl": {
              "type": "string",
              "maxLength": 100,
              "pattern": "/^(http|https):\\/\\/[a-z0-9]+([-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$/"
            }
          },
          "required": [
            "name",
            "description",
            "websiteUrl"
          ]
        },
        "CreatePostFromBlogInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "maxLength": 30
            },
            "shortDescription": {
              "type": "string",
              "maxLength": 100
            },
            "content": {
              "type": "string",
              "maxLength": 1000
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content"
          ]
        },
        "UpdateBlogInputDto": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "maxLength": 15
            },
            "description": {
              "type": "string",
              "maxLength": 500
            },
            "websiteUrl": {
              "type": "string",
              "maxLength": 100,
              "pattern": "/^(http|https):\\/\\/[a-z0-9]+([-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,5}(:[0-9]{1,5})?(\\/.*)?$/"
            }
          },
          "required": [
            "name",
            "description",
            "websiteUrl"
          ]
        },
        "CommentatorInfo": {
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "ID of the user who created the comment"
            },
            "userLogin": {
              "type": "string",
              "description": "Login of the user who created the comment"
            }
          },
          "required": [
            "userId",
            "userLogin"
          ]
        },
        "LikesInfo": {
          "type": "object",
          "properties": {
            "likesCount": {
              "type": "number",
              "description": "Number of likes"
            },
            "dislikesCount": {
              "type": "number",
              "description": "Number of dislikes"
            },
            "myStatus": {
              "type": "string",
              "description": "Current user's like status",
              "enum": [
                "Like",
                "Dislike",
                "None"
              ],
              "example": "None"
            }
          },
          "required": [
            "likesCount",
            "dislikesCount",
            "myStatus"
          ]
        },
        "CommentViewModel": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "Comment ID"
            },
            "content": {
              "type": "string",
              "description": "Comment content"
            },
            "commentatorInfo": {
              "description": "Information about the comment creator",
              "allOf": [
                {
                  "$ref": "#/components/schemas/CommentatorInfo"
                }
              ]
            },
            "createdAt": {
              "format": "date-time",
              "type": "string",
              "description": "Comment creation date"
            },
            "likesInfo": {
              "description": "Information about likes",
              "allOf": [
                {
                  "$ref": "#/components/schemas/LikesInfo"
                }
              ]
            }
          },
          "required": [
            "id",
            "content",
            "commentatorInfo",
            "createdAt",
            "likesInfo"
          ]
        },
        "PaginatedCommentsResponse": {
          "type": "object",
          "properties": {
            "items": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/CommentViewModel"
              }
            },
            "totalCount": {
              "type": "number"
            },
            "pagesCount": {
              "type": "number"
            },
            "page": {
              "type": "number"
            },
            "pageSize": {
              "type": "number"
            }
          },
          "required": [
            "items",
            "totalCount",
            "pagesCount",
            "page",
            "pageSize"
          ]
        },
        "CreatePostInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "maxLength": 30
            },
            "shortDescription": {
              "type": "string",
              "maxLength": 100
            },
            "content": {
              "type": "string",
              "maxLength": 1000
            },
            "blogId": {
              "type": "string"
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content",
            "blogId"
          ]
        },
        "CreateCommentInputModel": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string",
              "description": "Content of the comment",
              "minLength": 20,
              "maxLength": 300,
              "example": "This is a thoughtful comment that meets the minimum length requirement."
            }
          },
          "required": [
            "content"
          ]
        },
        "UpdatePostInputDto": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "maxLength": 30
            },
            "shortDescription": {
              "type": "string",
              "maxLength": 100
            },
            "content": {
              "type": "string",
              "maxLength": 1000
            },
            "blogId": {
              "type": "string"
            }
          },
          "required": [
            "title",
            "shortDescription",
            "content",
            "blogId"
          ]
        },
        "UpdateLikeStatusInputModel": {
          "type": "object",
          "properties": {
            "likeStatus": {
              "type": "string",
              "description": "The like status to set",
              "enum": [
                "Like",
                "Dislike",
                "None"
              ],
              "example": "Like"
            }
          },
          "required": [
            "likeStatus"
          ]
        }
      }
    }
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  let urls = options.swaggerUrls
  let customOptions = options.customOptions
  let spec1 = options.swaggerDoc
  let swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (let attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  let ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.initOAuth) {
    ui.initOAuth(customOptions.initOAuth)
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }
  
  window.ui = ui
}
