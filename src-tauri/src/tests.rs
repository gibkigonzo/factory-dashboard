use serde_json::Value;
use std::collections::HashMap;

const TAURI_CONF: &str = include_str!("../tauri.conf.json");
const CAPABILITY: &str = include_str!("../capabilities/default.json");

fn csp(key: &str) -> HashMap<String, Vec<String>> {
    let conf: Value = serde_json::from_str(TAURI_CONF).unwrap();
    conf["app"]["security"][key]
        .as_object()
        .unwrap_or_else(|| panic!("{key} must be an object of directives"))
        .iter()
        .map(|(name, value)| {
            let sources = value
                .as_str()
                .unwrap()
                .split_whitespace()
                .map(String::from)
                .collect();
            (name.clone(), sources)
        })
        .collect()
}

fn sources<'a>(policy: &'a HashMap<String, Vec<String>>, directive: &str) -> Vec<&'a str> {
    policy[directive].iter().map(String::as_str).collect()
}

#[test]
fn csp_scripts_and_styles_only_self_without_eval() {
    let policy = csp("csp");
    assert_eq!(sources(&policy, "default-src"), ["'self'"]);
    assert_eq!(sources(&policy, "script-src"), ["'self'"]);
    assert_eq!(sources(&policy, "style-src"), ["'self'"]);
    assert_eq!(sources(&policy, "object-src"), ["'none'"]);
    for sources in policy.values() {
        for forbidden in ["'unsafe-eval'", "'unsafe-inline'", "data:", "blob:"] {
            assert!(!sources.iter().any(|s| s == forbidden), "{forbidden}");
        }
    }
}

#[test]
fn csp_images_only_self_and_github_avatars() {
    let policy = csp("csp");
    assert_eq!(
        sources(&policy, "img-src"),
        ["'self'", "https://avatars.githubusercontent.com"]
    );
}

#[test]
fn csp_connect_only_ipc() {
    let policy = csp("csp");
    assert_eq!(
        sources(&policy, "connect-src"),
        ["ipc:", "http://ipc.localhost"]
    );
}

#[test]
fn dev_csp_has_no_eval_or_external_hosts() {
    let policy = csp("devCsp");
    for sources in policy.values() {
        assert!(!sources.iter().any(|s| s == "'unsafe-eval'"));
    }
    assert_eq!(
        sources(&policy, "img-src"),
        ["'self'", "https://avatars.githubusercontent.com"]
    );
    assert_eq!(
        sources(&policy, "connect-src"),
        ["ipc:", "http://ipc.localhost", "ws://localhost:1420"]
    );
}

/// Glob with `*` as the only wildcard, like the opener URL scope.
fn glob_matches(pattern: &str, text: &str) -> bool {
    let parts: Vec<&str> = pattern.split('*').collect();
    let (first, rest) = parts.split_first().unwrap();
    let Some(mut remaining) = text.strip_prefix(first) else {
        return false;
    };
    for (i, part) in rest.iter().enumerate() {
        if i == rest.len() - 1 {
            return remaining.ends_with(part);
        }
        match remaining.find(part) {
            Some(pos) => remaining = &remaining[pos + part.len()..],
            None => return false,
        }
    }
    remaining.is_empty()
}

#[test]
fn opener_allows_only_github_urls() {
    let capability: Value = serde_json::from_str(CAPABILITY).unwrap();
    let permissions = capability["permissions"].as_array().unwrap();

    assert!(permissions.iter().all(|p| {
        let id = p.as_str().or_else(|| p["identifier"].as_str()).unwrap();
        id != "opener:default" && id != "opener:allow-default-urls"
    }));

    let scopes: Vec<&Value> = permissions
        .iter()
        .filter(|p| p["identifier"] == "opener:allow-open-url")
        .collect();
    assert_eq!(scopes.len(), 1);
    let allow = scopes[0]["allow"].as_array().unwrap();
    assert_eq!(allow.len(), 1);
    let pattern = allow[0]["url"].as_str().unwrap();
    assert_eq!(pattern, "https://github.com/*");

    let cases = [
        ("https://github.com/owner/repo", true),
        ("https://github.com/gibkigonzo/factory", true),
        ("https://example.com", false),
        ("http://github.com/x", false),
        ("https://github.com.evil.com/x", false),
    ];
    for (url, allowed) in cases {
        assert_eq!(glob_matches(pattern, url), allowed, "{url}");
    }
}
