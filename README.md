# Gearbox: Intuitive, Powerful Scouting at [4026.org](https://4026.org)
The final incarnation of Scout Janssen.

Rewritten fully in Typescript, written to be easy to maintain and modular.
Features full feature parity with SJ2, whilst remaining simpler, faster and cooler.

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

## Setup

### Prerequisites
- Node.js
- NPM
- A MongoDB instance
  - We use Atlas
- An SSL certificate saved as `certs/key.pem` and `certs/cert.pem`
  - Can be generated with OpenSSL
- Secrets:
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

#### Tests
1. Run `npm run test`

## Contributing
You've made it past set up and are ready to contibure to the future scouting - here's how.

We recommend you start with issues labelled `good first issue` to get a feel for the codebase. Fork the repo (unless you're part of Decatur Robotics, in which case make a new branch) and then make a pull request to the main branch. We'll review it and, if it looks good, merge it.

## Contibutors
<a href="https://github.com/Decatur-Robotics/Gearbox/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Decatur-Robotics/Gearbox" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Licensed under a CC BY-NC-SA 4.0 license
Read the license [here](LICENSE.md).
