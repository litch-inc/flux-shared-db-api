'use strict';

const ALPHA_NUMERIC_REGEX = {
  // eslint-disable-next-line no-useless-escape
  'en-US': /^[a-zA-Z0-9]+$/
};
const FILENAME_REGEX = {
  // eslint-disable-next-line no-useless-escape
  'en-US': /([a-zA-Z0-9\s_\\.\-\(\):])/
};
const NUMERIC_ONLY_REGEX = {
  // eslint-disable-next-line no-useless-escape
  'en-US': /^\d+$/
};
const LOGINPHRASE_MAX_HOURS = 30 * 60 * 1000;
const FIELD_ERROR_MESSAGE_BY_LOCALE = {
  filename: {
    notEmpty: {
      'en-US': 'Filename required'
    },
    isString: {
      'en-US': 'Filename must be a string'
    },
    matches: {
      'en-US': 'Filename does not match approved filename structure'
    }
  },
  loginPhrase: {
    notEmpty: {
      'en-US': 'Login phrase required'
    },
    isString: {
      'en-US': 'Login phrase must be a string'
    },
    isLength: {
      'en-US': 'Login phrase should be 6 to 60 characters'
    },
    matches: {
      'en-US': 'Login phrase does not match approved structure'
    },
    custom: {
      'en-US': 'Login phrase timestamp out of bounds parameters'
    }
  },
  seqNo: {
    notEmpty: {
      'en-US': 'Sequence number required'
    },
    isString: {
      'en-US': 'Sequence number must be a string'
    },
    numericOnly: {
      'en-US': 'Sequence number must be numeric characters only'
    }
  },
  signature: {
    notEmpty: {
      'en-US': 'Signature phrase required'
    },
    isString: {
      'en-US': 'Signature phrase must be a string'
    },
    matches: {
      'en-US': 'Signature phrase does not match approved structure'
    }
  }
};
const PARAMS_ERROR_MESSAGE_BY_LOCALE = {
  filename: {
    notEmpty: {
      'en-US': 'Filename required'
    },
    isString: {
      'en-US': 'Filename must be a string'
    },
    matches: {
      'en-US': 'Filename does not match approved filename structure'
    }
  }
};
const QUERY_ERROR_MESSAGE_BY_LOCALE = {
  logsLength: {
    notEmpty: {
      'en-US': 'Logs length required'
    },
    isString: {
      'en-US': 'Logs length must be a string'
    },
    numericOnly: {
      'en-US': 'Logs length must be numeric characters only'
    }
  },
  startTime: {
    notEmpty: {
      'en-US': 'Start time required'
    },
    isString: {
      'en-US': 'Start time must be a string'
    },
    numericOnly: {
      'en-US': 'Start time must be numeric characters only'
    }
  }
};

module.exports = {
  ALPHA_NUMERIC_REGEX,
  FILENAME_REGEX,
  NUMERIC_ONLY_REGEX,
  LOGINPHRASE_MAX_HOURS,
  FIELD_ERROR_MESSAGE_BY_LOCALE,
  PARAMS_ERROR_MESSAGE_BY_LOCALE,
  QUERY_ERROR_MESSAGE_BY_LOCALE
};
