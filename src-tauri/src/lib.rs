use std::path::Path;

fn open_folder_with_file_selected(file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new(file_path);

    if !path.exists() {
        return Err("The specified file does not exist.".into());
    }

    // For Windows
    #[cfg(target_os = "windows")]
    {
        let mut command = std::process::Command::new("explorer");
        command.arg("/select,").arg(file_path);
        command.spawn()?;
    }

    // For macOS
    #[cfg(target_os = "macos")]
    {
        let mut command = std::process::Command::new("open");
        command.arg("-R").arg(file_path);
        command.spawn()?;
    }

    // For Linux (using xdg-open or default file managers)
    #[cfg(target_os = "linux")]
    {
        let parent_dir = path.parent().ok_or("File has no parent directory")?;
        std::process::Command::new("xdg-open")
            .arg(parent_dir)
            .spawn()?;
    }

    Ok(())
}

#[tauri::command]
fn open_file_in_explorer(path: &str) {
    let _ = open_folder_with_file_selected(&path);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![open_file_in_explorer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
