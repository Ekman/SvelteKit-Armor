# SvelteKit Armor

> [!IMPORTANT]
> The library is being tested in production and will be tagged `1.0.0` once I'm confident it works.

Highly opinionated, minimal config OAuth protection for [SvelteKit](https://svelte.dev/) apps. Get login working in few lines of code - no complex setup, no custom UI, just secure authentication using your own OAuth 2.0/OIDC IdP hosted UI, such as [AWS Cognito](https://aws.amazon.com/pm/cognito/) or [auth0](https://auth0.com/).

## Installation
Install with your favorite package manager:

```bash
npm install --save @nekm/sveltekit-armor @sveltejs/kit
```

## Usage

Create a `src/hooks.server.ts` and write:

```js
import { armor } from '@nekm/sveltekit-armor';

export const handle = armor({
		oauth: {
      clientId: 'foo',
      clientSecret: 'bar',
      baseUrl: 'https://myapp.auth.eu-west-1.amazoncognito.com',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_ABC123xyz',
    }
});
```

Done. Entire app now requires login.

## Routes

Your app will now expose these routes:

* `/_armor/login` - Redirect the user here to initiate a login.
* `/_armor/redirect/login` - Configure your IdP to redirect here.
* `/_armor/logout` - Only if logout endpoint is configured.
* `/_armor/redirect/logout` - Only if logout endpoint is configured.

## Examples

### Protect only certain routes

Assume you only want to protect routes prefixed by `admin`. Create a `src/hooks.server.ts` and write:

```js
import { armor } from '@nekm/sveltekit-armor';

const protect = armor({ /* config */ });

export const handle = ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		return protect({ event, resolve });
	}

	return resolve(event);
}
```

## Versioning

This project complies with [Semantic Versioning](https://semver.org/).

## Changelog

For a complete list of changes, and how to migrate between major versions, see [releases page](https://github.com/Ekman/SvelteKit-Armor/releases).

## Buy me a coffee

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/nekman)

If you appreciate my work, then consider [buying me a coffee](https://buymeacoffee.com/nekman). Donations are completely voluntary.
