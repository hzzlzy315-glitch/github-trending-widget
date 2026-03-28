use anyhow::{Context, Result};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendingRepo {
    pub rank: usize,
    pub owner: String,
    pub name: String,
    pub url: String,
    pub description: String,
    pub language: Option<String>,
    pub stars: String,
    pub weekly_stars: String,
}

pub async fn fetch_trending() -> Result<Vec<TrendingRepo>> {
    let client = reqwest::Client::new();

    let html = client
        .get("https://github.com/trending?since=weekly")
        .header(
            "User-Agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        )
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.9")
        .send()
        .await
        .context("Failed to fetch GitHub trending page")?
        .error_for_status()
        .context("GitHub trending page returned an error status")?
        .text()
        .await
        .context("Failed to read response body")?;

    parse_trending_html(&html)
}

fn parse_trending_html(html: &str) -> Result<Vec<TrendingRepo>> {
    let document = Html::parse_document(html);

    let article_selector =
        Selector::parse("article.Box-row").expect("Invalid article selector");
    let repo_link_selector =
        Selector::parse("h2 a").expect("Invalid repo link selector");
    let description_selector =
        Selector::parse("p.col-9").expect("Invalid description selector");
    let language_selector =
        Selector::parse("span[itemprop=\"programmingLanguage\"]")
            .expect("Invalid language selector");
    let star_link_selector =
        Selector::parse("a.Link--muted").expect("Invalid star link selector");
    let weekly_star_selector =
        Selector::parse("span.d-inline-block.float-sm-right")
            .expect("Invalid weekly star selector");

    let mut repos = Vec::new();

    for (index, article) in document.select(&article_selector).enumerate() {
        if index >= 10 {
            break;
        }

        let (owner, name, url) = parse_repo_link(&article, &repo_link_selector)?;

        let description = article
            .select(&description_selector)
            .next()
            .map(|el| normalize_whitespace(&el.text().collect::<String>()))
            .unwrap_or_default();

        let language = article
            .select(&language_selector)
            .next()
            .map(|el| el.text().collect::<String>().trim().to_string())
            .filter(|s| !s.is_empty());

        let stars = article
            .select(&star_link_selector)
            .next()
            .map(|el| normalize_whitespace(&el.text().collect::<String>()))
            .unwrap_or_default();

        let weekly_stars = article
            .select(&weekly_star_selector)
            .next()
            .map(|el| normalize_whitespace(&el.text().collect::<String>()))
            .unwrap_or_default();

        repos.push(TrendingRepo {
            rank: index + 1,
            owner,
            name,
            url,
            description,
            language,
            stars,
            weekly_stars,
        });
    }

    if repos.is_empty() {
        anyhow::bail!("No trending repos found. GitHub may have changed their page structure.");
    }

    Ok(repos)
}

fn parse_repo_link(
    article: &scraper::ElementRef,
    selector: &Selector,
) -> Result<(String, String, String)> {
    let link = article
        .select(selector)
        .next()
        .context("Missing repo link in article")?;

    let href = link
        .value()
        .attr("href")
        .context("Missing href attribute on repo link")?
        .trim();

    let parts: Vec<&str> = href.trim_start_matches('/').split('/').collect();
    if parts.len() < 2 {
        anyhow::bail!("Invalid repo href format: {}", href);
    }

    let owner = parts[0].to_string();
    let name = parts[1].to_string();
    let url = format!("https://github.com/{}/{}", owner, name);

    Ok((owner, name, url))
}

fn normalize_whitespace(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_whitespace() {
        assert_eq!(normalize_whitespace("  hello   world  "), "hello world");
        assert_eq!(normalize_whitespace("\n  foo \n bar \n"), "foo bar");
    }

    #[test]
    fn test_parse_trending_html_empty() {
        let html = "<html><body></body></html>";
        let result = parse_trending_html(html);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_trending_html_single_repo() {
        let html = r#"
        <html><body>
        <article class="Box-row">
            <h2><a href="/rust-lang/rust">rust-lang / rust</a></h2>
            <p class="col-9">Empowering everyone to build reliable software.</p>
            <span itemprop="programmingLanguage">Rust</span>
            <a class="Link--muted" href="/rust-lang/rust/stargazers">98,000</a>
            <span class="d-inline-block float-sm-right">1,200 stars this week</span>
        </article>
        </body></html>
        "#;

        let repos = parse_trending_html(html).unwrap();
        assert_eq!(repos.len(), 1);
        assert_eq!(repos[0].rank, 1);
        assert_eq!(repos[0].owner, "rust-lang");
        assert_eq!(repos[0].name, "rust");
        assert_eq!(repos[0].url, "https://github.com/rust-lang/rust");
        assert_eq!(
            repos[0].description,
            "Empowering everyone to build reliable software."
        );
        assert_eq!(repos[0].language, Some("Rust".to_string()));
        assert_eq!(repos[0].stars, "98,000");
        assert_eq!(repos[0].weekly_stars, "1,200 stars this week");
    }
}
