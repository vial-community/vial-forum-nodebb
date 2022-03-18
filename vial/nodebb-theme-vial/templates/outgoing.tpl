<div class="outgoing">

	<!-- IMPORT partials/breadcrumbs.tpl -->

	<div class="well">
        <center>
            <img src="https://media.tenor.co/images/a5e46f57117833444907d51041456733/raw">
            <h3>
                [[notifications:outgoing_link_message, {title}]]
            </h3>
            <p>Please make sure you trust this link!</p>
            <p>
                <a href="{outgoing}" rel="nofollow noopener noreferrer" class="btn btn-primary btn-lg">[[notifications:continue_to, {outgoing}]]</a>
                <a id="return-btn" href="#" class="btn btn-lg btn-warning">[[notifications:return_to, {title}]]</a>
            </p>
        </center>
	</div>
</div>

<script>
	$('#return-btn').on('click', function() {
		history.back();
		return false;
	});
</script>
