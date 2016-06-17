
module.exports = function (options) {
  return {
    url: "{{{step.ephemeral_url}}}",
    body: {
      message: 'private_list_users',
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
