// Generic lookup that runs a particular message


module.exports = function (options) {
  return {
    url: "{{{step.ephemeral_url}}}",
    body: {
      message: options.message,
      auth_id: "{{{step.auth_id}}}",
      step_settings: {
        access_token: {
          type: "jsonpath",
          value: "$.auth.access_token"
        }
      }
    }
  }
};
