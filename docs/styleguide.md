# Contributing to the UI with Style

_Running and understanding the UI Code style rules_

Our rules are built and attempt to adhere to the following coding standards and tooling

- [Standards](https://standardjs.com/)
- [Prettier](https://prettier.io/)

All of the above aim to use familiar, proven rules from leading solutions and yet provide customizable rule overrides and additions

## Where can CSS be included

During Pull Request Reviews, we look for

- CSS **must** be in `.css` or `.scss`
- CSS _not_ allowed in `<style>` block within a `html` template
- Avoiding inline styles on `HTML` elements.

If any of the above must be broken, please explain the situation in your PR.

## Javascript Rules

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

Read our full list of rules at [StandardJS](https://standardjs.com/rules.html) and any overrides are in our `.eslintrc.json`.
In general, we seek to avoid modifications and use the rules provided by StandardsJS

## Reactive Programming Rules

[![rx-js](https://rxjs-dev.firebaseapp.com/assets/images/logos/logo.png)](https://rxjs-dev.firebaseapp.com/)

We gonna use RxJS for all kinds of reactive
