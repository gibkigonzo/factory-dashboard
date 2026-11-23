use super::allowlist::is_allowed;
use super::{GithubClient, GithubError, GithubRequest, GithubResponse, TokenSource};
use chrono::FixedOffset;
use serde_json::json;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use std::thread;

const TOKEN: &str = "ghp_secret_token_value";
const TOKEN_BODY: &str = r#"{"message":"ghp_secret_token_value"}"#;
const BLOCKED_MESSAGE: &str = "Ta operacja jest zablokowana w aplikacji";

struct MemoryToken(Option<String>);

impl TokenSource for MemoryToken {
    fn token(&self) -> Option<String> {
        self.0.clone()
    }
}

fn with_token() -> MemoryToken {
    MemoryToken(Some(TOKEN.to_string()))
}

#[derive(Debug, Clone)]
struct Recorded {
    method: String,
    path: String,
    authorization: Option<String>,
    if_none_match: Option<String>,
    body: String,
}

type Canned = (u16, &'static [(&'static str, &'static str)], &'static str);

struct TestServer {
    url: String,
    requests: Arc<Mutex<Vec<Recorded>>>,
}

impl TestServer {
    /// Serves every request with the same canned response, one request per connection.
    fn start(
        status: u16,
        headers: &'static [(&'static str, &'static str)],
        body: &'static str,
    ) -> Self {
        Self::start_sequence(vec![(status, headers, body)])
    }

    /// Serves the responses in order; the last one repeats when the list runs out.
    fn start_sequence(responses: Vec<Canned>) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        let requests = Arc::new(Mutex::new(Vec::new()));
        let log = Arc::clone(&requests);
        thread::spawn(move || {
            let mut served = 0usize;
            for stream in listener.incoming() {
                let Ok(mut stream) = stream else { continue };
                let mut reader = BufReader::new(stream.try_clone().unwrap());
                let mut request_line = String::new();
                if reader.read_line(&mut request_line).unwrap_or(0) == 0 {
                    continue;
                }
                let mut parts = request_line.split_whitespace();
                let method = parts.next().unwrap_or("").to_string();
                let path = parts.next().unwrap_or("").to_string();
                let mut authorization = None;
                let mut if_none_match = None;
                let mut length = 0usize;
                loop {
                    let mut line = String::new();
                    reader.read_line(&mut line).unwrap();
                    let line = line.trim_end();
                    if line.is_empty() {
                        break;
                    }
                    if let Some((name, value)) = line.split_once(':') {
                        match name.to_ascii_lowercase().as_str() {
                            "authorization" => authorization = Some(value.trim().to_string()),
                            "if-none-match" => if_none_match = Some(value.trim().to_string()),
                            "content-length" => length = value.trim().parse().unwrap_or(0),
                            _ => {}
                        }
                    }
                }
                let mut payload = vec![0u8; length];
                reader.read_exact(&mut payload).unwrap();
                log.lock().unwrap().push(Recorded {
                    method,
                    path,
                    authorization,
                    if_none_match,
                    body: String::from_utf8_lossy(&payload).to_string(),
                });
                let (status, headers, body) = responses[served.min(responses.len() - 1)];
                served += 1;
                let mut response = format!(
                    "HTTP/1.1 {status} X\r\nContent-Type: application/json\r\nConnection: close\r\nContent-Length: {}\r\n",
                    body.len()
                );
                for (name, value) in headers {
                    response.push_str(&format!("{name}: {value}\r\n"));
                }
                response.push_str("\r\n");
                response.push_str(body);
                let _ = stream.write_all(response.as_bytes());
            }
        });
        Self { url, requests }
    }

    fn recorded(&self) -> Vec<Recorded> {
        self.requests.lock().unwrap().clone()
    }
}

fn request(method: &str, path: &str) -> GithubRequest {
    let body = (method == "POST").then(|| json!({ "x": 1 }));
    GithubRequest {
        method: method.to_string(),
        path: path.to_string(),
        query: vec![],
        body,
    }
}

fn utc_plus_one() -> FixedOffset {
    FixedOffset::east_opt(3600).unwrap()
}

fn send(server: &TestServer, request: GithubRequest) -> Result<GithubResponse, GithubError> {
    GithubClient::new(&server.url).send_in(&with_token(), request, &utc_plus_one())
}

const ALLOWED: &[(&str, &str)] = &[
    ("GET", "/user/repos"),
    ("GET", "/repos/o/r"),
    ("GET", "/repos/o/r/contents/docs/a.md"),
    ("GET", "/repos/o/r/issues"),
    ("GET", "/repos/o/r/issues/7"),
    ("GET", "/repos/o/r/issues/7/comments"),
    ("GET", "/repos/o/r/issues/7/reactions"),
    ("GET", "/repos/o/r/issues/comments/9/reactions"),
    ("GET", "/repos/o/r/pulls"),
    ("GET", "/repos/o/r/pulls/3"),
    ("GET", "/repos/o/r/actions/runs"),
    ("GET", "/repos/o/r/actions/workflows/ci.yml/runs"),
    ("POST", "/repos/o/r/issues"),
    ("POST", "/repos/o/r/issues/7/comments"),
    ("POST", "/repos/o/r/issues/7/reactions"),
    ("POST", "/repos/o/r/issues/comments/9/reactions"),
    ("POST", "/repos/o/r/issues/7/labels"),
    ("POST", "/repos/o/r/actions/workflows/ci.yml/dispatches"),
];

const BLOCKED: &[(&str, &str)] = &[
    ("DELETE", "/repos/o/r"),
    ("PATCH", "/repos/o/r"),
    ("PUT", "/repos/o/r/pulls/1/merge"),
    ("PUT", "/repos/o/r/contents/a.md"),
    ("POST", "/repos/o/r/pulls/1/merge"),
    ("POST", "/repos/o/r"),
    ("GET", "/repos/o/r/../../admin"),
    ("GET", "/repos/o/r/contents/../secret"),
    ("GET", "https://evil.example/repos/o/r"),
    ("GET", "//evil.example/repos/o/r"),
];

#[test]
fn allowed_operations_reach_test_server() {
    for (method, path) in ALLOWED {
        let server = TestServer::start(200, &[], "{\"ok\":true}");
        let response = send(&server, request(method, path))
            .unwrap_or_else(|e| panic!("{method} {path}: {e:?}"));
        assert_eq!(response.status, 200, "{method} {path}");
        assert_eq!(response.body, json!({ "ok": true }));
        let recorded = server.recorded();
        assert_eq!(recorded.len(), 1, "{method} {path}");
        assert_eq!(recorded[0].method, *method);
        assert_eq!(recorded[0].path, *path);
        assert_eq!(
            recorded[0].authorization.as_deref(),
            Some(format!("Bearer {TOKEN}").as_str())
        );
    }
}

#[test]
fn blocked_operations_never_reach_server() {
    let server = TestServer::start(200, &[], "{}");
    for (method, path) in BLOCKED {
        let error = send(&server, request(method, path)).unwrap_err();
        assert_eq!(error.message, BLOCKED_MESSAGE, "{method} {path}");
        assert_eq!(serde_json::to_value(&error).unwrap()["kind"], "blocked");
    }
    assert_eq!(server.recorded().len(), 0);
}

#[test]
fn allowlist_rejects_traversal_encoded_segments_and_unknown_methods() {
    let rejected = [
        ("GET", "repos/o/r"),
        ("GET", "/repos/o/r/"),
        ("GET", "/repos//r"),
        ("GET", "/repos/./r"),
        ("GET", "/repos/o/r/issues/%2e%2e"),
        ("GET", "/repos/o/r/issues/abc"),
        ("GET", "/repos/o/r/issues/7?x=1"),
        ("GET", "/repos/o/r/issues/7#frag"),
        ("GET", "/repos/o/r/contents/a\\b"),
        ("GET", "/repos/o/r/contents/a//b"),
        ("get", "/repos/o/r"),
        ("HEAD", "/repos/o/r"),
        ("OPTIONS", "/repos/o/r"),
        ("PUT", "/repos/o/r/issues/7/labels"),
    ];
    for (method, path) in rejected {
        assert!(!is_allowed(method, path), "{method} {path}");
    }
    for (method, path) in ALLOWED {
        assert!(is_allowed(method, path), "{method} {path}");
    }
}

#[test]
fn post_body_and_query_reach_server() {
    let server = TestServer::start(200, &[], "{}");
    let mut post = request("POST", "/repos/o/r/issues");
    post.query = vec![("a".to_string(), "1".to_string())];
    send(&server, post).unwrap();
    let mut get = request("GET", "/repos/o/r/issues");
    get.query = vec![
        ("state".to_string(), "open".to_string()),
        ("page".to_string(), "2".to_string()),
    ];
    send(&server, get).unwrap();
    let recorded = server.recorded();
    assert_eq!(recorded[0].path, "/repos/o/r/issues?a=1");
    assert_eq!(recorded[0].body, r#"{"x":1}"#);
    assert_eq!(recorded[1].path, "/repos/o/r/issues?state=open&page=2");
    assert_eq!(recorded[1].body, "");
}

#[test]
fn redirects_are_not_followed() {
    let target = TestServer::start(200, &[], "{}");
    let location: &'static str = Box::leak(format!("{}/steal", target.url).into_boxed_str());
    let headers: &'static [(&'static str, &'static str)] =
        Box::leak(vec![("Location", location)].into_boxed_slice());
    let server = TestServer::start(302, headers, "");
    let result = send(&server, request("GET", "/user/repos"));
    if let Ok(response) = result {
        assert_eq!(response.status, 302);
    }
    assert_eq!(server.recorded().len(), 1);
    assert_eq!(target.recorded().len(), 0);
}

#[test]
fn unauthorized_maps_to_invalid_token() {
    let server = TestServer::start(401, &[], "{\"message\":\"Bad credentials\"}");
    let error = send(&server, request("GET", "/user/repos")).unwrap_err();
    assert_eq!(
        serde_json::to_value(&error).unwrap()["kind"],
        "invalid_token"
    );
    assert_eq!(server.recorded().len(), 1);
}

#[test]
fn rate_limit_reports_reset_time_without_retry() {
    let server = TestServer::start(
        403,
        &[
            ("x-ratelimit-remaining", "0"),
            ("x-ratelimit-reset", "1700000000"),
        ],
        "{}",
    );
    let error = send(&server, request("GET", "/user/repos")).unwrap_err();
    // 1700000000 is 22:13 UTC, 23:13 in the test time zone.
    assert_eq!(error.message, "Limit zapytań GitHuba, spróbuj o 23:13");
    assert_eq!(
        serde_json::to_value(&error).unwrap()["kind"],
        "rate_limited"
    );
    assert_eq!(server.recorded().len(), 1);
}

#[test]
fn rate_limit_429_same_message() {
    let server = TestServer::start(
        429,
        &[
            ("x-ratelimit-remaining", "0"),
            ("x-ratelimit-reset", "1700000000"),
        ],
        "{}",
    );
    let error = send(&server, request("POST", "/repos/o/r/issues")).unwrap_err();
    assert_eq!(error.message, "Limit zapytań GitHuba, spróbuj o 23:13");
    assert_eq!(server.recorded().len(), 1);
}

#[test]
fn forbidden_without_rate_limit_headers_is_plain_http_error() {
    let server = TestServer::start(403, &[], "{}");
    let error = send(&server, request("GET", "/user/repos")).unwrap_err();
    assert_eq!(serde_json::to_value(&error).unwrap()["kind"], "http");
    assert_eq!(error.status, Some(403));
}

#[test]
fn no_result_contains_token() {
    fn assert_clean<T: serde::Serialize>(result: &T) {
        let text = serde_json::to_string(result).unwrap();
        assert!(!text.contains(TOKEN), "{text}");
    }

    let cases: [(u16, &'static [(&'static str, &'static str)]); 4] = [
        (200, &[]),
        (401, &[]),
        (
            403,
            &[
                ("x-ratelimit-remaining", "0"),
                ("x-ratelimit-reset", "1700000000"),
            ],
        ),
        (500, &[]),
    ];
    for (status, headers) in cases {
        // Error responses echo the token, as a hostile or buggy upstream could.
        let body = if status == 200 { "{}" } else { TOKEN_BODY };
        let server = TestServer::start(status, headers, body);
        match send(&server, request("GET", "/user/repos")) {
            Ok(response) => assert_clean(&response),
            Err(error) => assert_clean(&error),
        }
    }

    let server = TestServer::start(200, &[], "{}");
    assert_clean(&send(&server, request("DELETE", "/repos/o/r")).unwrap_err());

    let no_token = GithubClient::new(&server.url)
        .send_in(
            &MemoryToken(None),
            request("GET", "/user/repos"),
            &utc_plus_one(),
        )
        .unwrap_err();
    assert_eq!(serde_json::to_value(&no_token).unwrap()["kind"], "no_token");
    assert_clean(&no_token);

    // Nothing listens on this port after the listener is dropped.
    let closed = {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        format!("http://{}", listener.local_addr().unwrap())
    };
    let unreachable = GithubClient::new(&closed)
        .send_in(
            &with_token(),
            request("GET", "/user/repos"),
            &utc_plus_one(),
        )
        .unwrap_err();
    assert_eq!(
        serde_json::to_value(&unreachable).unwrap()["kind"],
        "network"
    );
    assert_clean(&unreachable);
}

const ETAG_HEADERS: &[(&str, &str)] = &[("ETag", "\"v1\"")];

fn etag_sequence() -> TestServer {
    TestServer::start_sequence(vec![
        (200, ETAG_HEADERS, "{\"n\":1}"),
        (304, ETAG_HEADERS, ""),
    ])
}

fn get_repos(client: &GithubClient) -> Result<GithubResponse, GithubError> {
    client.send_in(
        &with_token(),
        request("GET", "/user/repos"),
        &utc_plus_one(),
    )
}

#[test]
fn second_get_sends_if_none_match_from_first_etag() {
    let server = etag_sequence();
    let client = GithubClient::new(&server.url);
    get_repos(&client).unwrap();
    get_repos(&client).unwrap();
    let recorded = server.recorded();
    assert_eq!(recorded[0].if_none_match, None);
    assert_eq!(recorded[1].if_none_match.as_deref(), Some("\"v1\""));
}

#[test]
fn not_modified_returns_cached_body() {
    let server = etag_sequence();
    let client = GithubClient::new(&server.url);
    let first = get_repos(&client).unwrap();
    let second = get_repos(&client).unwrap();
    assert_eq!(second.status, 200);
    assert_eq!(second.body, first.body);
    assert_eq!(second.body, json!({ "n": 1 }));
}

#[test]
fn write_requests_bypass_etag_cache() {
    let writes = [
        "/repos/o/r/issues/7/comments",
        "/repos/o/r/issues/7/reactions",
        "/repos/o/r/issues/7/labels",
        "/repos/o/r/issues",
        "/repos/o/r/actions/workflows/ci.yml/dispatches",
    ];
    for path in writes {
        let server = TestServer::start(200, ETAG_HEADERS, "{\"n\":1}");
        let client = GithubClient::new(&server.url);
        for _ in 0..2 {
            client
                .send_in(&with_token(), request("POST", path), &utc_plus_one())
                .unwrap();
        }
        let recorded = server.recorded();
        assert_eq!(recorded.len(), 2, "{path}");
        assert!(recorded.iter().all(|r| r.if_none_match.is_none()), "{path}");
    }
}

#[test]
fn new_client_sends_first_get_without_if_none_match() {
    let server = etag_sequence();
    get_repos(&GithubClient::new(&server.url)).unwrap();
    // A new client is a restarted app: its cache is empty.
    let _ = get_repos(&GithubClient::new(&server.url));
    assert_eq!(server.recorded()[1].if_none_match, None);
}

#[test]
fn same_path_with_different_query_has_separate_cache_entry() {
    let server = TestServer::start_sequence(vec![
        (200, ETAG_HEADERS, "{\"page\":1}"),
        (200, ETAG_HEADERS, "{\"page\":2}"),
        (304, ETAG_HEADERS, ""),
    ]);
    let client = GithubClient::new(&server.url);
    let with_page = |page: &str| {
        let mut req = request("GET", "/repos/o/r/issues");
        req.query = vec![("page".to_string(), page.to_string())];
        client.send_in(&with_token(), req, &utc_plus_one())
    };
    assert_eq!(with_page("1").unwrap().body, json!({ "page": 1 }));
    // A different page must not reuse the first page's ETag.
    assert_eq!(with_page("2").unwrap().body, json!({ "page": 2 }));
    assert_eq!(server.recorded()[1].if_none_match, None);
    // Repeating the first page revalidates against its own entry.
    assert_eq!(with_page("1").unwrap().body, json!({ "page": 1 }));
    assert_eq!(
        server.recorded()[2].if_none_match.as_deref(),
        Some("\"v1\"")
    );
}

#[test]
fn not_modified_without_cache_entry_is_http_error() {
    let server = TestServer::start(304, ETAG_HEADERS, "");
    let error = get_repos(&GithubClient::new(&server.url)).unwrap_err();
    let value = serde_json::to_value(&error).unwrap();
    assert_eq!(value["kind"], "http");
    assert_eq!(value["status"], 304);
}

#[test]
fn etag_cache_evicts_oldest_over_limit() {
    let mut cache = super::etag::EtagCache::with_limit(2);
    cache.put("a", "1".to_string(), json!(1));
    cache.put("b", "2".to_string(), json!(2));
    cache.put("c", "3".to_string(), json!(3));
    assert!(cache.get("a").is_none());
    assert!(cache.get("b").is_some());
    assert!(cache.get("c").is_some());
}
