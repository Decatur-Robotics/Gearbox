# Gearbox: Intuitive, Powerful Scouting at [4026.org](https://4026.org)

The final incarnation of Scout Janssen.
Rewritten fully in Typescript, written to be easy to maintain and modular.
Features full feature parity with SJ2, whilst remaining simpler, faster and cooler.
Used by 190+ teams worldwide to collect 380,000+ datapoints across 230+ competitions.

## Features

- Automatic match generation
- Match assignment (both automatic and manual)
- Pre-generated forms
- Pit scouting
- Subjective scouting
- Picklist creation
- Scouter management
- Automatic check-in
- CSV export
- Public data sharing (optional)
- Sub-5-minute setup

## Status

![CI Checks](https://github.com/Decatur-Robotics/Gearbox/actions/workflows/ci.yml/badge.svg)<br/>
![Formatting](https://github.com/Decatur-Robotics/Gearbox/actions/workflows/format.yml/badge.svg)<br/>
![Autoversioning](https://github.com/Decatur-Robotics/Gearbox/actions/workflows/increment_version.yml/badge.svg)

## Setup

### Prerequisites

- Node.js
- NPM
- A MongoDB instance
  - We use Mongo Atlas
- An SSL certificate saved as `certs/key.pem` and `certs/cert.pem`
  - Can be generated with OpenSSL
- Secrets in a `.env` file (see [`environment.d.ts`](environment.d.ts) for a full list):
  - A Blue Alliance API key
  - An Orange Alliance API key
  - A Google OAuth client ID and secret
  - A Slack OAuth client ID and secret (amongst other secrets)
  - An SMTP host/username/password
  - A Google Analytics tracking ID
  - A Resend audience ID

### Installation

1. Clone the repository
1. Run `npm install`
1. Add the secrets to a `.env` file

### Running

#### Development

1. Run `npm run dev`

#### Production

1. Run `npm run build`
1. Run `npm run start`

##### Deployment

See the [Gearbox-Terraform](https://github.com/Decatur-Robotics/Gearbox-Terraform) repo.

#### Tests

Gearbox has both unit tests (via Jest) and E2E tests (via Playwright).

Unit tests are run with `npm run test`.
E2E tests are run with `npm run e2e`.

#### Scripts

There's a few scripts in the `/scripts` folder that can be run with `npx tsx scripts/<script_name>.ts`.

## Contributing

You've made it past set up and are ready to contribute to the future of scouting - here's how.

We recommend you start with issues labelled `good first issue` to get a feel for the codebase. Fork the repo (unless you're part of Decatur Robotics, in which case make a new branch) and then make a pull request to the main branch. We'll review it and, if it looks good, merge it.

## Other Repositories

Our Terraform code is in a separate repository, [Gearbox-Terraform](https://github.com/Decatur-Robotics/Gearbox-Terraform).

We've also developed several packages that we use (available through NPM):

- [mongo-anywhere](https://github.com/Decatur-Robotics/mongo-anywhere) - Provides dependency injection and mocks for MongoDB. Gearbox has wrappers around this package's `DbInterface` types.
- [unified-api](https://github.com/Decatur-Robotics/unified-api) - Provides handling and structure for API routes.
- [unified-api-nextjs](https://github.com/Decatur-Robotics/unified-api-nextjs) - Provides types and templates for Next.js API routes.
- [omit-call-signature](https://github.com/Decatur-Robotics/omit-call-signature) - Provides a type for removing call signatures from another type and a type for removing constructor signatures from a class type. Gearbox doesn't directly use this package, but the `unified-api` package does.

## Tools Used

### Codebase

- Typescript
- Next.js
- NextAuth
- MongoDB

### Testing

- Jest
- Playwright

### Dev Tools

- GitHub Actions
- Prettier
- ESLint

### Hosting & Infrastructure

See the [Gearbox-Terraform](https://github.com/Decatur-Robotics/Gearbox-Terraform) repository for more details.

- Terraform (stored in the [Gearbox-Terraform](https://github.com/Decatur-Robotics/Gearbox-Terraform) repository)
- HashiCorp Managed Terraform (to apply the Terraform code)
- AWS ECS
- AWS S3 (to store secrets)
- Cloudflare (for DNS)
- MongoDB Atlas
- Docker
- GitHub Actions
- GitHub Container Registry

### External APIs

- The Blue Alliance API (for match data)
- The Orange Alliance API (for match data)
- Rollbar (for error tracking and deployment notifications)
- Resend (for email sending)
- Google Analytics
- Google OAuth (for authentication)
- Slack OAuth (for authentication)

## Contibutors

<a href="https://github.com/Decatur-Robotics/Gearbox/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Decatur-Robotics/Gearbox" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Licensed under a CC BY-NC-SA 4.0 license

Read the license [here](LICENSE.md).
