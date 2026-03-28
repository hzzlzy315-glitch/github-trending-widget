mod ai;
mod trending;

use ai::AnalyzedRepo;
use tauri::image::Image;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;

#[tauri::command]
async fn fetch_trending_repos() -> Result<Vec<AnalyzedRepo>, String> {
    let repos = trending::fetch_trending()
        .await
        .map_err(|e| format!("Failed to fetch trending repos: {e}"))?;

    let analyzed = ai::analyze_repos(repos)
        .await
        .map_err(|e| format!("Failed to analyze repos: {e}"))?;

    Ok(analyzed)
}

fn toggle_window(window: &tauri::WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fetch_trending_repos])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Apply macOS vibrancy
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    Some(NSVisualEffectState::Active),
                    Some(16.0),
                )
                .expect("Failed to apply vibrancy");
            }

            // Create tray icon
            let tray_icon =
                Image::from_path("icons/tray-icon.png").unwrap_or_else(|_| {
                    Image::from_bytes(include_bytes!("../icons/tray-icon.png"))
                        .expect("Failed to load tray icon")
                });

            let window_clone = window.clone();
            TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(true)
                .tooltip("GitHub Trending")
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(&window_clone);
                    }
                })
                .build(app)?;

            // Don't show dock icon — pure menu bar app
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
