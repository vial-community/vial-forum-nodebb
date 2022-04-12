## Vial FusionAuth OpenID Connect

### Additional Configuration

If you want to skip the login page and always use the configured OpenID Connect identity provider for authentication you will need to disable Local Login and Local Registration.

#### To disable Local Login:
1. Select `Manage > Privileges` from the menu
1. Uncheck the appropriate boxes under the `Local Login` column in the `Group Privileges` table

#### To disable Local Registration:
1. Select `Settings > User` from the menu
1. Scroll down to the `User Registration` section and set `Registration Type` to `No Registration`
1. Click the Save icon

Once both Local Login and Local Registration have been disabled, the default login page will be skipped and the user will be automatically redirected to the FusionAuth OpenID Connect login page.

#### Recovery
If you need to login locally you can manually add the following parameter `/login?local=1` to your URL and you will be taken to the default login page.

#### Developer Notes

If you make changes to the plugin you will need to rebuild and reload. You can do this manually or via the UI.
