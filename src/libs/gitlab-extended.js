const Request = require("request-promise");

function defaultRequest(
  url,
  endpoint,
  { headers, body, qs, formData, resolveWithFullResponse = false }
) {
  const params = {
    url: `${url}${endpoint}`,
    headers,
    json: true
  };

  if (body) params.body = body;
  if (qs) params.qs = qs;
  if (formData) params.formData = formData;

  params.resolveWithFullResponse = resolveWithFullResponse;

  return params;
}

class API {
  constructor({ url, token, oauthToken }) {
    if (!url) {
      throw new Error("Url не установлен");
    }
    this.url = `${url}/api/v4/`;
    this.headers = {};

    if (oauthToken) {
      this.headers.Authorization = `Bearer ${oauthToken}`;
    } else if (token) {
      this.headers["private-token"] = token;
    } else {
      throw new Error("`token` (private-token) or `oauth_token` is mandatory");
    }
  }

  _get(endpoint) {
    const request = defaultRequest(this.url, endpoint, {
      headers: this.headers
    });
    return Request.get(request);
  }
  
  jobsByBuildname(projectId, buildName) {
    return this._get(`projects/${projectId}/pipelines/${buildName}/jobs`);
  }
  
  artifactsByJob(projectId, jobId) {
    return this._get(`projects/${projectId}/jobs/${jobId}/artifacts`);
  }
}

module.exports = API;
