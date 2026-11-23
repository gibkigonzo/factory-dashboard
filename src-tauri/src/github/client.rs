//! The single place where requests to GitHub are made.

use super::TokenSource;
use super::allowlist::is_allowed;
use chrono::{DateTime, Local, TimeZone};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;

pub const API_BASE: &str = "https://api.github.com";

#[derive(Debug, Deserialize)]
pub struct GithubRequest {
    pub method: String,
    pub path: String,
    #[serde(default)]
    pub query: Vec<(String, String)>,
    #[serde(default)]
    pub body: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct GithubResponse {
    pub status: u16,
    pub body: Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorKind {
    Blocked,
    NoToken,
    InvalidToken,
    RateLimited,
    Http,
    Network,
}

/// Error returned to the UI. Messages are fixed strings: nothing from the
/// transport layer (URLs, headers) is passed on, so the token cannot leak.
#[derive(Debug, Serialize)]
pub struct GithubError {
    pub kind: ErrorKind,
    pub message: String,
    pub status: Option<u16>,
}

impl GithubError {
    fn new(kind: ErrorKind, message: &str, status: Option<u16>) -> Self {
        Self {
            kind,
            message: message.to_string(),
            status,
        }
    }

    pub fn blocked() -> Self {
        Self::new(
            ErrorKind::Blocked,
            "Ta operacja jest zablokowana w aplikacji",
            None,
        )
    }

    pub fn no_token() -> Self {
        Self::new(ErrorKind::NoToken, "Brak tokenu GitHuba", None)
    }

    pub fn network() -> Self {
        Self::new(
            ErrorKind::Network,
            "Nie udało się połączyć z GitHubem",
            None,
        )
    }

    fn invalid_token() -> Self {
        Self::new(
            ErrorKind::InvalidToken,
            "Token GitHuba jest nieważny",
            Some(401),
        )
    }

    fn rate_limited(time: &str, status: u16) -> Self {
        Self {
            kind: ErrorKind::RateLimited,
            message: format!("Limit zapytań GitHuba, spróbuj o {time}"),
            status: Some(status),
        }
    }

    fn http(status: u16) -> Self {
        Self::new(ErrorKind::Http, "GitHub odpowiedział błędem", Some(status))
    }
}

/// Formats the reset time (unix seconds) as HH:MM in the given time zone.
pub fn format_reset<Tz: TimeZone>(reset: i64, tz: &Tz) -> Option<String>
where
    Tz::Offset: std::fmt::Display,
{
    let utc: DateTime<chrono::Utc> = DateTime::from_timestamp(reset, 0)?;
    Some(utc.with_timezone(tz).format("%H:%M").to_string())
}

pub struct GithubClient {
    base_url: String,
    agent: ureq::Agent,
}

impl GithubClient {
    pub fn new(base_url: &str) -> Self {
        let agent = ureq::AgentBuilder::new()
            .redirects(0)
            .timeout(Duration::from_secs(30))
            .build();
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            agent,
        }
    }

    pub fn send(
        &self,
        tokens: &dyn TokenSource,
        request: GithubRequest,
    ) -> Result<GithubResponse, GithubError> {
        self.send_in(tokens, request, &Local)
    }

    /// Like `send`, with the time zone used for the rate limit message.
    pub fn send_in<Tz: TimeZone>(
        &self,
        tokens: &dyn TokenSource,
        request: GithubRequest,
        tz: &Tz,
    ) -> Result<GithubResponse, GithubError>
    where
        Tz::Offset: std::fmt::Display,
    {
        if !is_allowed(&request.method, &request.path) {
            return Err(GithubError::blocked());
        }
        let token = tokens.token().ok_or_else(GithubError::no_token)?;

        let url = format!("{}{}", self.base_url, request.path);
        let mut call = self
            .agent
            .request(&request.method, &url)
            .set("Authorization", &format!("Bearer {token}"))
            .set("Accept", "application/vnd.github+json")
            .set("User-Agent", "factory-dashboard");
        for (key, value) in &request.query {
            call = call.query(key, value);
        }
        let result = match (request.method.as_str(), request.body) {
            ("POST", Some(body)) => call.send_json(body),
            _ => call.call(),
        };

        match result {
            Ok(response) => {
                let status = response.status();
                let text = response.into_string().map_err(|_| GithubError::network())?;
                let body = serde_json::from_str(&text).unwrap_or(Value::Null);
                Ok(GithubResponse { status, body })
            }
            Err(ureq::Error::Status(401, _)) => Err(GithubError::invalid_token()),
            Err(ureq::Error::Status(status, response)) => {
                if status == 403 || status == 429 {
                    let exhausted = response.header("x-ratelimit-remaining") == Some("0");
                    let reset = response
                        .header("x-ratelimit-reset")
                        .and_then(|v| v.trim().parse::<i64>().ok())
                        .and_then(|v| format_reset(v, tz));
                    if let (true, Some(time)) = (exhausted, reset) {
                        return Err(GithubError::rate_limited(&time, status));
                    }
                }
                Err(GithubError::http(status))
            }
            Err(ureq::Error::Transport(_)) => Err(GithubError::network()),
        }
    }
}
