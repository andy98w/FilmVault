# FilmVault architecture notes

This document records the structure and operational decisions represented in the repository. It is not a claim that the original public deployment is still running.

## Request path

```text
Browser
  -> React client
  -> Express API
       -> TMDB API
       -> MySQL
       -> SendGrid or SMTP
       -> OCI Object Storage
```

The React client calls the Express API for catalog searches, account actions, profiles, ratings, and saved collections. The API augments local member data with TMDB metadata. Profile pictures can be processed with Sharp and written through the storage service.

## Client

The client lives in `client/` and uses React 19, TypeScript, React Router, and Axios. `AuthContext` owns the signed-in user state. Route pages live in `client/src/pages`; shared cards, navigation, tables, pagination, and status components live in `client/src/components`.

The current home screen is organized as a film archive rather than a streaming storefront:

- one catalog search for titles or people;
- horizontal lists for popular films, television, and member picks;
- a people rail sourced from TMDB;
- explicit offline states when the API is unavailable.

## API

The API lives in `server/src` and is compiled to `server/dist`.

| Route group | Responsibility |
| --- | --- |
| `/api/auth` | Registration, login, verification, and password reset |
| `/api/movies` | TMDB-backed catalog data, collections, and ratings |
| `/api/users` | Member profiles and activity |
| `/api/admin` | Administrative user operations |

Express middleware handles validation, authentication, admin authorization, CORS, cookies, and errors. MySQL access uses a connection pool from `server/src/config/db.ts`.

## Authentication

The API signs JWTs after successful authentication and accepts a token from the authentication cookie or authorization header. Passwords are hashed with bcrypt. Verification and password-reset messages are sent by the configured email provider.

The client currently supports JWT persistence for cross-origin deployments. Any production deployment should make one deliberate token-storage choice, keep cookies `HttpOnly` where possible, restrict allowed origins, and rotate the JWT secret independently of application releases.

## Data

The code works with four main concepts:

- users and profile information;
- cached title metadata;
- titles saved by a user;
- member ratings.

The database name still defaults to `myfavmovies` in Terraform for compatibility with the original schema. Renaming it requires a coordinated database migration and environment update.

## OCI infrastructure

Terraform configuration is under `server/terraform/`, not the repository root. The files define:

- a virtual cloud network and subnets;
- application and bastion compute instances;
- network security rules;
- OCI Vault secrets and IAM policy;
- an Object Storage bucket for profile pictures;
- optional monitoring and Nginx filtering configuration;
- cloud-init templates for instance setup.

The original layout put the API, static client, Nginx, and MySQL on small OCI compute instances to stay within a limited budget. That kept the bill small, but it has clear tradeoffs: the database shares failure and resource boundaries with the application, a bastion adds maintenance, and pre-authenticated Object Storage URLs require careful expiry and rotation.

Before applying the Terraform again, inspect every variable, confirm the tenancy and region, provide current SSH and domain values, and run `terraform plan`. State and `.tfvars` files are intentionally excluded from Git.

## Operations

The checked-in deployment guide describes the original systemd and Nginx workflow. A typical release is:

1. build the client and server;
2. transfer the artifacts to the application host;
3. install production server dependencies;
4. replace the client static files;
5. restart the API and reload Nginx;
6. verify the API health route and a signed-in browser flow.

Logs are available through systemd or PM2 depending on which checked-in provisioning template was used. The Terraform and deployment notes should be treated as a starting point and reconciled before a fresh deployment; they describe more than one iteration of the original host setup.

## Security boundaries

- Environment and Terraform variable files are ignored.
- MySQL is intended to accept local application traffic rather than public internet traffic.
- OCI Vault and IAM policies scope access to stored secrets.
- Nginx terminates TLS and fronts the application ports in the original deployment.
- Profile uploads are resized by the server before storage.

Pre-authenticated Object Storage URLs act like credentials. Never commit one, even as a frontend build variable. If one is exposed in Git history, revoke it in OCI and create a replacement with the shortest useful lifetime.

## Known maintenance work

- Create React App and several client dependencies need a planned upgrade.
- The client dependency audit currently reports vulnerable transitive packages.
- Automated API, browser, and Terraform validation should be added before another production deployment.
- Build output is intentionally ignored and should be produced in the deployment pipeline.
- The historical deployment instructions contain host-specific steps and should be parameterized before reuse.
