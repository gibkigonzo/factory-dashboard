// Rust aplikacji: logowanie do GitHuba, token w pęku kluczy i komenda zapytań do API (CLAUDE.md, Architektura).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
