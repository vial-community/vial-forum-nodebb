<h1>FusionAuth Configuration</h1>
<hr/>

<p>This plugin is designed to work with FusionAuth. You can configure it via environment variables as shown below.</p>

<h3>Variables:</h3>
<pre><code>export AUTH_BASE_URL="URL of FusionAuth"
export AUTH_CLIENT_ID="FusionAuth application client id"
export AUTH_CLIENT_SECRET="FusionAuth application client secret"
export AUTH_CALLBACK_URL="callback URL for NodeBB"
</code></pre>

<h3>Instructions:</h3>
<p>
<ul>
	<li><strong>AUTH_BASE_URL</strong> is the URL of the FusionAuth service. Example: http://localhost:9011</li>
	<li><strong>AUTH_CLIENT_ID</strong>and<strong>AUTH_CLIENT_SECRET</strong> are the id and secret of the application that is setup in FusionAuth specifically for SSO with NodeBB</li>
	<li><strong>AUTH_CALLBACK_URL</strong> is the callback URL. It is [NodeBB URL] + '/auth/fusionauth-oidc/callback'. Example value: http://localhost:4567/auth/fusionauth-oidc/callback</li>
</ul>

<h3>Current plugin configuration:</h3>
<p>
<ul>
  <li><b>FusionAuth: </b> {base_URL}</li>
  <li><b>Authorization enpoint: </b> {authorizationEndpoint}</li>
  <li><b>Token endpoint: </b> {tokenEndpoint}</li>
  <li><b>User Info endpoint: </b> {userInfoEndpoint}</li>
  <li><b>Logout endpoint: </b> {logoutEndpoint}</li>  
  <li><b>Client Id: </b> {clientId}</li>
  <li><b>Client Secret: </b> {clientSecret}</li>
</ul>
</p>
