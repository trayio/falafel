var assert      = require('assert');
var _ 	        = require('lodash');
var mergeSchemas = require('../../lib/bindConnectors/mergeSchemas.js');



describe.only('#mergeSchemas', function () {

    it('should merge two schemas', function () {

        var schemaA = {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "type": "object",
          "properties": {
            "success": {
              "type": "boolean"
            },
            "data": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "number"
                  },
                  "company_id": {
                    "type": "number"
                  },
                  "owner_id": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "number"
                      },
                      "name": {
                        "type": "string"
                      },
                      "email": {
                        "type": "string"
                      },
                      "value": {
                        "type": "number"
                      }
                    }
                  },
                  "org_id": {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "owner_id": {
                        "type": "number"
                      },
                      "value": {
                        "type": "number"
                      }
                    }
                  },
                  "name": {
                    "type": "string"
                  },
                  "participant_open_deals_count": {
                    "type": "number"
                  },
                  "email_messages_count": {
                    "type": "number"
                  },
                  "files_count": {
                    "type": "null"
                  },
                  "notes_count": {
                    "type": "number"
                  },
                  "followers_count": {
                    "type": "number"
                  },
                  "won_deals_count": {
                    "type": "number"
                  },
                  "lost_deals_count": {
                    "type": "number"
                  },
                  "active_flag": {
                    "type": "boolean"
                  },
                  "phone": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "label": {
                          "type": "string"
                        },
                        "value": {
                          "type": "string"
                        },
                        "primary": {
                          "type": "boolean"
                        }
                      }
                    }
                  },
                  "email": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "label": {
                          "type": "string"
                        },
                        "value": {
                          "type": "string"
                        },
                        "primary": {
                          "type": "boolean"
                        }
                      }
                    }
                  },
                  "first_char": {
                    "type": "string"
                  },
                  "update_time": {
                    "type": "string"
                  },
                  "add_time": {
                    "type": "string"
                  },
                  "last_incoming_mail_time": {
                    "type": "null"
                  },
                  "last_outgoing_mail_time": {
                    "type": "null"
                  },
                  "org_name": {
                    "type": "string"
                  },
                  "owner_name": {
                    "type": "string"
                  }
                },
                "required": []
              }
            },
            "additional_data": {
              "type": "object",
              "properties": {
                "pagination": {
                  "type": "object",
                  "properties": {
                    "start": {
                      "type": "number"
                    },
                    "limit": {
                      "type": "number"
                    },
                    "more_items_in_collection": {
                      "type": "boolean"
                    }
                  }
                }
              }
            },
            "related_objects": {
              "type": "object",
              "properties": {
                "organization": {
                  "type": "object",
                  "properties": {
                    "1": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "number"
                        },
                        "name": {
                          "type": "string"
                        },
                        "owner_id": {
                          "type": "number"
                        },
                        "address": {
                          "type": "null"
                        }
                      }
                    }
                  }
                },
                "user": {
                  "type": "object",
                  "properties": {
                    "570430": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "number"
                        },
                        "name": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string"
                        },
                        "has_pic": {
                          "type": "boolean"
                        },
                        "pic_hash": {
                          "type": "null"
                        },
                        "active_flag": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
      };

      var schemaB = {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "type": "object",
          "properties": {
            "success": {
              "type": "string"
            },
            "data": {
              "type": "string"
            },
            "additional_data": {
              "type": "object",
              "properties": {
                "pagination": {
                  "type": "object",
                  "properties": {
                    "start": {
                      "type": "number"
                    },
                    "limit": {
                      "type": "number"
                    },
                    "more_items_in_collection": {
                      "type": "boolean"
                    }
                  }
                }
              }
            },
            "related_objects": {
              "type": "object",
              "properties": {
                "organization": {
                  "type": "object",
                  "properties": {
                    "1": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "number"
                        },
                        "name": {
                          "type": "string"
                        },
                        "owner_id": {
                          "type": "number"
                        },
                        "address": {
                          "type": "null"
                        }
                      }
                    }
                  }
                },
                "user": {
                  "type": "object",
                  "properties": {
                    "570430": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "number"
                        },
                        "name": {
                          "type": "string"
                        },
                        "email": {
                          "type": "string"
                        },
                        "has_pic": {
                          "type": "boolean"
                        },
                        "pic_hash": {
                          "type": "null"
                        },
                        "active_flag": {
                          "type": "boolean"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
      };

        console.log(require('util').inspect(mergeSchemas(schemaA, schemaB), false, null));

    });



});
