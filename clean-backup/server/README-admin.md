# FilmVault Admin API

## Overview

The FilmVault Admin API provides administrative functionality for managing users and system settings. These endpoints are only accessible to users with admin privileges.

## Setup

1. Run the admin migration script to add the required database columns:

```bash
npm run build
node dist/admin-migration.js
```

This will:
- Add the `is_admin` column to the users table (default: false)
- Add `created_at` and `updated_at` timestamp columns to the users table
- Make the first user in the database an admin

## Authentication

All admin endpoints require a valid JWT token with admin privileges. The token must be included in the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <token>
```

## Admin Routes

### Get All Users

```
GET /api/admin/users
```

Returns a list of all users in the system.

#### Response

```json
[
  {
    "id": 1,
    "Usernames": "admin",
    "Emails": "admin@example.com",
    "ProfilePic": "default.jpg",
    "email_verified_at": "2023-04-11T15:30:00.000Z",
    "is_admin": 1,
    "created_at": "2023-04-11T15:30:00.000Z"
  },
  {
    "id": 2,
    "Usernames": "user",
    "Emails": "user@example.com",
    "ProfilePic": "default.jpg",
    "email_verified_at": "2023-04-11T15:35:00.000Z",
    "is_admin": 0,
    "created_at": "2023-04-11T15:35:00.000Z"
  }
]
```

### Delete User

```
DELETE /api/admin/users/:id
```

Deletes a user and all associated data (ratings, saved movies).

#### Parameters

- `id` - The ID of the user to delete

#### Response

```json
{
  "message": "User username (ID: 2) has been deleted successfully",
  "deletedUser": {
    "id": 2,
    "username": "username",
    "email": "user@example.com"
  }
}
```

### Make User an Admin

```
POST /api/admin/users/:id/make-admin
```

Grants admin privileges to a user.

#### Parameters

- `id` - The ID of the user to make an admin

#### Response

```json
{
  "message": "User username (ID: 2) has been promoted to admin",
  "user": {
    "id": 2,
    "username": "username",
    "isAdmin": true
  }
}
```

### Remove Admin Privileges

```
POST /api/admin/users/:id/remove-admin
```

Removes admin privileges from a user.

#### Parameters

- `id` - The ID of the user to remove admin privileges from

#### Response

```json
{
  "message": "Admin privileges removed from user username (ID: 2)",
  "user": {
    "id": 2,
    "username": "username",
    "isAdmin": false
  }
}
```

## Testing the Admin API

A test script is provided to test the admin API endpoints:

```bash
# First login as an admin user and copy the JWT token
export ADMIN_TOKEN=your_jwt_token_here
# Then run the test script
./test-admin-api.sh
```

## Admin Features in the User Interface

When a user with admin privileges logs in, the user object returned from the login endpoint will include `isAdmin: true`. The client application can use this to display admin features in the UI.

## Security Considerations

- Admin endpoints are protected with the `authenticateAdmin` middleware
- Admins can't delete other admin users through the API
- Admins can't remove their own admin privileges
- JWT tokens include the `isAdmin` flag which is verified by the admin middleware