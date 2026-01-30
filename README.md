# Microservices Monorepo Overview

This repository contains several microservices, each responsible for a specific domain in the system. Below is a summary of each service and its purpose, along with basic setup instructions.

---

## Services

### 1. user-service

Handles user registration, authentication, and user data management.

- **Port:** 8081
- **Tech:** Node.js, Express, Prisma, MongoDB, RabbitMQ
- **.env:**
  - `PORT`, `JWT_SECRET`, `MESSAGE_BROKER_URL`, `MONGO_URI`, etc.

### 2. clien-file-service

Manages file uploads, downloads, and storage.

- **Port:** 8082
- **Tech:** Node.js, Express, Prisma, PostgreSQL, Redis
- **.env:**
  - `PORT`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, `INTERNAL_SECRET`, etc.

### 3. sap-note-service

Processes and stores SAP notes, including PDF parsing and extraction.

- **Port:** 8083
- **Tech:** Node.js, Express, Prisma, PostgreSQL, Redis
- **.env:**
  - `PORT`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, etc.

### 4. sap-core-service

Handles core SAP system data and operations.

- **Port:** 8084
- **Tech:** Node.js, Express, Prisma, PostgreSQL, Redis
- **.env:**
  - `PORT`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, etc.

### 5. gateway

API gateway that routes requests to the appropriate microservice and handles authentication.

- **Port:** 8080
- **Tech:** Node.js, Express
- **.env:**
  - `PORT`, `JWT_SECRET`, `INTERNAL_SECRET`, service URLs, etc.

### 6. web

Frontend application (Next.js) for user interaction.

- **Port:** 3000
- **Tech:** Next.js, React

### 7. docs

Documentation site (Next.js) for the project.

- **Port:** 3001
- **Tech:** Next.js

---

## Common Setup

1. **Install dependencies:**
   ```sh
   pnpm install
   ```
2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in each service directory and update values as needed.
3. **Run all services:**
   ```sh
   pnpm run dev
   ```
4. **Database migrations:**
   - For services using Prisma, run:
     ```sh
     pnpm prisma migrate dev --name init
     ```
     in the respective service directory.

---

## Notes

- Each service has its own README and .env.example for more details.
- Use Docker Compose for local development if available.
- Ensure all required databases and message brokers are running.

---

For more details, see the README in each service folder.

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo build
yarn dlx turbo build
pnpm exec turbo build

```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs

```

### Develop

To develop all apps and packages, run the following command:

```

cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev

```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web

```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```

cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo login
yarn exec turbo login
pnpm exec turbo login

```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)

turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager

npx turbo link
yarn exec turbo link
pnpm exec turbo link

```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
```
