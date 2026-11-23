//! Command for GitHub API requests: allowlist of endpoints and methods, token kept native-side.

mod allowlist;
mod client;

pub use client::{GithubClient, GithubError, GithubRequest, GithubResponse};

use std::sync::Arc;

#[cfg(test)]
mod tests;

/// Where the token comes from. The token never leaves the native side.
pub trait TokenSource: Send + Sync {
    fn token(&self) -> Option<String>;
}

/// Placeholder until the login task adds the keychain-backed source.
pub struct NoToken;

impl TokenSource for NoToken {
    fn token(&self) -> Option<String> {
        None
    }
}

pub struct GithubState {
    client: Arc<GithubClient>,
    tokens: Arc<dyn TokenSource>,
}

impl GithubState {
    pub fn new(client: GithubClient, tokens: Arc<dyn TokenSource>) -> Self {
        Self {
            client: Arc::new(client),
            tokens,
        }
    }

    pub fn production() -> Self {
        Self::new(GithubClient::new(client::API_BASE), Arc::new(NoToken))
    }
}

#[tauri::command]
pub async fn github_request(
    state: tauri::State<'_, GithubState>,
    request: GithubRequest,
) -> Result<GithubResponse, GithubError> {
    let client = Arc::clone(&state.client);
    let tokens = Arc::clone(&state.tokens);
    tauri::async_runtime::spawn_blocking(move || client.send(tokens.as_ref(), request))
        .await
        .map_err(|_| GithubError::network())?
}
