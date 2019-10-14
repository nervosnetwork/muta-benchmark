wrk.method = "POST"
wrk.body   = "{\"query\":\"query {\\n  getLatestEpoch {\\n    header {\\n      epochId\\n    }\\n  }\\n}\"}"
wrk.headers["Content-Type"] = "application/json"