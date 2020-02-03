wrk.method = "POST"
wrk.body   = "{\"query\":\"query {\\n  getLatestBlock {\\n    header {\\n      height\\n    }\\n  }\\n}\"}"
wrk.headers["Content-Type"] = "application/json"