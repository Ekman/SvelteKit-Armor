# SvelteKit Armor

SvelteKit armor is a hihgly opinonated, low-config OAuth protection for SvelteKit. The purpose of this library is not to be highly customizable, but rather  get you up-and-running with a login for your SvelteKit app in no time. Register for Auth0 or spin up Cognito, write a minimal config and, abuse the fact that the `authorization_code` grant gives you a login page - voilà!

## Installation
Install with your favorite package manager:

```bash
npm install --save @nekm/sveltekit-armor
```

## Usage

Create a `src/hooks.server.ts` and write:

```js
import { armor } from '@nekm/sveltekit-armor';

export const handle = armor({
		oauth: {
      clientId: 'foo',
      clientSecret: 'bar',
      baseUrl: 'myapp.auth.eu-west-1.amazoncognito.com',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_ABC123xyz',
    }
});
```

The **entire** application is now protected by login!

## Examples

### Protect only certain routes

Assume you only want to protect routes prefixed by `admin`. Create a `src/hooks.server.ts` and write:

```js
import { armor } from '@nekm/sveltekit-armor';

const a = armor({
		oauth: {
      baseUrl: 'myapp.auth.eu-west-1.amazoncognito.com',
      clientId: 'foo',
      clientSecret: 'bar',
      issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_ABC123xyz',
    }
});

export const handle = ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		return a({ event, resolve });
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
