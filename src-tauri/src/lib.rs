// Rust aplikacji: logowanie do GitHuba, token w pęku kluczy i komenda zapytań do API (CLAUDE.md, Architektura).
mod github;

#[cfg(test)]
mod tests;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(github::GithubState::production())
        .invoke_handler(tauri::generate_handler![github::github_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
