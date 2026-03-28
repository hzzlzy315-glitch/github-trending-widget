use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::trending::TrendingRepo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoSummary {
    pub what_is_it: String,
    pub how_to_use: String,
    pub why_it_helps: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalizedSummary {
    pub zh: RepoSummary,
    pub en: RepoSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzedRepo {
    pub rank: usize,
    pub owner: String,
    pub name: String,
    pub url: String,
    pub description: String,
    pub language: Option<String>,
    pub stars: String,
    pub weekly_stars: String,
    pub category: String,
    pub summary: LocalizedSummary,
}

#[derive(Debug, Deserialize)]
struct ClaudeAnalysis {
    name: String,
    category: String,
    zh: RepoSummary,
    en: RepoSummary,
}

pub async fn analyze_repos(repos: Vec<TrendingRepo>) -> Result<Vec<AnalyzedRepo>> {
    let repo_list = build_repo_list(&repos);
    let prompt = build_prompt(&repo_list);

    let output = tokio::task::spawn_blocking(move || {
        run_claude_cli(&prompt)
    })
    .await
    .context("Claude CLI task panicked")??;

    let analyses = parse_claude_response(&output)?;
    let analyzed_repos = merge_repos_with_analyses(repos, analyses);

    Ok(analyzed_repos)
}

fn run_claude_cli(prompt: &str) -> Result<String> {
    let claude_path = find_claude_cli()?;

    let output = Command::new(&claude_path)
        .arg("-p")
        .arg(prompt)
        .arg("--output-format")
        .arg("text")
        .output()
        .context(format!("Failed to run Claude CLI at: {}", claude_path))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("Claude CLI failed (exit {}): {}", output.status, stderr);
    }

    let text = String::from_utf8(output.stdout)
        .context("Claude CLI output was not valid UTF-8")?;

    Ok(text)
}

fn find_claude_cli() -> Result<String> {
    // Check common locations for the claude CLI
    let candidates = [
        // User's local bin (most common for Claude Code)
        format!("{}/.local/bin/claude", std::env::var("HOME").unwrap_or_default()),
        // Homebrew
        "/opt/homebrew/bin/claude".to_string(),
        "/usr/local/bin/claude".to_string(),
        // Fallback: just "claude" and let PATH resolve it
        "claude".to_string(),
    ];

    for path in &candidates {
        if path == "claude" {
            // For the bare name, check if it's in PATH
            if Command::new("which").arg("claude").output().map(|o| o.status.success()).unwrap_or(false) {
                return Ok(path.clone());
            }
        } else if std::path::Path::new(path).exists() {
            return Ok(path.clone());
        }
    }

    anyhow::bail!(
        "Claude CLI not found. Please install Claude Code: https://claude.ai/claude-code"
    )
}

fn build_repo_list(repos: &[TrendingRepo]) -> String {
    repos
        .iter()
        .map(|repo| {
            format!(
                "{}. {}/{} - {} (Language: {}, Stars: {}, Weekly: {})",
                repo.rank,
                repo.owner,
                repo.name,
                repo.description,
                repo.language.as_deref().unwrap_or("Unknown"),
                repo.stars,
                repo.weekly_stars,
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn build_prompt(repo_list: &str) -> String {
    format!(
        r#"Analyze these GitHub trending repositories and return ONLY a valid JSON array, no markdown, no explanation, no code fences.

Repositories:
{repo_list}

For each repository, return an object with exactly these fields:
- "name": the repository name (just the repo name, not owner/name)
- "category": one of "AI Tools", "DevOps", "Frontend", "Backend", "Data", "Security", "Other"
- "zh": object with Chinese summaries
  - "what_is_it": 1 sentence describing what the project is (in Chinese, plain language)
  - "how_to_use": 2-3 sentences on practical usage scenarios (in Chinese)
  - "why_it_helps": 1-2 sentences on why it's useful for a developer (in Chinese)
- "en": object with English summaries
  - "what_is_it": 1 sentence describing what the project is
  - "how_to_use": 2-3 sentences on practical usage scenarios
  - "why_it_helps": 1-2 sentences on why it's useful for a developer

Return ONLY the raw JSON array. No markdown code fences, no extra text."#
    )
}

fn parse_claude_response(text: &str) -> Result<Vec<ClaudeAnalysis>> {
    let trimmed = text.trim();

    // Find the JSON array in the response — Claude might add some text before/after
    let json_str = extract_json_array(trimmed)
        .unwrap_or(trimmed);

    serde_json::from_str::<Vec<ClaudeAnalysis>>(json_str)
        .context("Failed to parse Claude response as JSON array of repo analyses")
}

fn extract_json_array(text: &str) -> Option<&str> {
    // Strip markdown code fences if present
    let stripped = if text.contains("```") {
        let without_prefix = text
            .strip_prefix("```json\n")
            .or_else(|| text.strip_prefix("```json"))
            .or_else(|| text.strip_prefix("```\n"))
            .or_else(|| text.strip_prefix("```"))
            .unwrap_or(text);
        without_prefix
            .strip_suffix("\n```")
            .or_else(|| without_prefix.strip_suffix("```"))
            .unwrap_or(without_prefix)
            .trim()
    } else {
        text
    };

    // Find the outermost [ ... ] in the text
    let start = stripped.find('[')?;
    let end = stripped.rfind(']')?;
    if start < end {
        Some(&stripped[start..=end])
    } else {
        None
    }
}

fn merge_repos_with_analyses(
    repos: Vec<TrendingRepo>,
    analyses: Vec<ClaudeAnalysis>,
) -> Vec<AnalyzedRepo> {
    repos
        .into_iter()
        .map(|repo| {
            let analysis = analyses
                .iter()
                .find(|a| a.name.eq_ignore_ascii_case(&repo.name));

            let (category, summary) = match analysis {
                Some(a) => (
                    a.category.clone(),
                    LocalizedSummary {
                        zh: a.zh.clone(),
                        en: a.en.clone(),
                    },
                ),
                None => (
                    "Other".to_string(),
                    LocalizedSummary {
                        zh: RepoSummary {
                            what_is_it: "暂无总结".to_string(),
                            how_to_use: "暂无总结".to_string(),
                            why_it_helps: "暂无总结".to_string(),
                        },
                        en: RepoSummary {
                            what_is_it: "No summary available".to_string(),
                            how_to_use: "No summary available".to_string(),
                            why_it_helps: "No summary available".to_string(),
                        },
                    },
                ),
            };

            AnalyzedRepo {
                rank: repo.rank,
                owner: repo.owner,
                name: repo.name,
                url: repo.url,
                description: repo.description,
                language: repo.language,
                stars: repo.stars,
                weekly_stars: repo.weekly_stars,
                category,
                summary,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_claude_response_valid_json() {
        let json = r#"[{
            "name": "rust",
            "category": "Backend",
            "zh": {
                "what_is_it": "Rust 是一门系统编程语言",
                "how_to_use": "通过 rustup 安装",
                "why_it_helps": "内存安全"
            },
            "en": {
                "what_is_it": "Rust is a systems language",
                "how_to_use": "Install via rustup",
                "why_it_helps": "Memory safety without GC"
            }
        }]"#;

        let result = parse_claude_response(json).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "rust");
        assert_eq!(result[0].category, "Backend");
    }

    #[test]
    fn test_parse_claude_response_with_code_fences() {
        let json = "```json\n[{\"name\":\"test\",\"category\":\"Other\",\"zh\":{\"what_is_it\":\"a\",\"how_to_use\":\"b\",\"why_it_helps\":\"c\"},\"en\":{\"what_is_it\":\"d\",\"how_to_use\":\"e\",\"why_it_helps\":\"f\"}}]\n```";

        let result = parse_claude_response(json).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "test");
    }

    #[test]
    fn test_parse_claude_response_with_surrounding_text() {
        let json = "Here is the analysis:\n[{\"name\":\"test\",\"category\":\"Other\",\"zh\":{\"what_is_it\":\"a\",\"how_to_use\":\"b\",\"why_it_helps\":\"c\"},\"en\":{\"what_is_it\":\"d\",\"how_to_use\":\"e\",\"why_it_helps\":\"f\"}}]\nDone!";

        let result = parse_claude_response(json).unwrap();
        assert_eq!(result.len(), 1);
    }

    #[test]
    fn test_extract_json_array() {
        assert_eq!(extract_json_array("[1,2,3]"), Some("[1,2,3]"));
        assert_eq!(extract_json_array("text [1,2] more"), Some("[1,2]"));
        assert_eq!(extract_json_array("no array"), None);
    }

    #[test]
    fn test_merge_repos_with_missing_analysis() {
        let repos = vec![TrendingRepo {
            rank: 1,
            owner: "foo".to_string(),
            name: "bar".to_string(),
            url: "https://github.com/foo/bar".to_string(),
            description: "A test repo".to_string(),
            language: Some("Rust".to_string()),
            stars: "100".to_string(),
            weekly_stars: "10 stars this week".to_string(),
        }];

        let analyses: Vec<ClaudeAnalysis> = vec![];
        let result = merge_repos_with_analyses(repos, analyses);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].category, "Other");
        assert_eq!(result[0].summary.en.what_is_it, "No summary available");
        assert_eq!(result[0].summary.zh.what_is_it, "暂无总结");
    }

    #[test]
    fn test_build_repo_list() {
        let repos = vec![TrendingRepo {
            rank: 1,
            owner: "rust-lang".to_string(),
            name: "rust".to_string(),
            url: "https://github.com/rust-lang/rust".to_string(),
            description: "A systems language".to_string(),
            language: Some("Rust".to_string()),
            stars: "98000".to_string(),
            weekly_stars: "1200 stars this week".to_string(),
        }];

        let list = build_repo_list(&repos);
        assert!(list.contains("rust-lang/rust"));
        assert!(list.contains("A systems language"));
    }
}
