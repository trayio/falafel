module.exports = {

	method: 'get',

	url: '{{url}}',

	afterSuccess: function (body, params) {
		return when.promise(function (resolve, reject) {

			falafel.files.upload({
				name: params.file_name,
				contents: new Buffer(body)
			})

			.done(resolve, reject)

		});
	}

}
