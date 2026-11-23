//! Allowlist of GitHub API operations the app may perform (CLAUDE.md, Architektura).
//! Everything not listed here is blocked before any request is made.

const GET_PATTERNS: &[&str] = &[
    "/user/repos",
    "/repos/{}/{}",
    "/repos/{}/{}/contents",
    "/repos/{}/{}/contents/{path*}",
    "/repos/{}/{}/issues",
    "/repos/{}/{}/issues/{n}",
    "/repos/{}/{}/issues/{n}/comments",
    "/repos/{}/{}/issues/{n}/reactions",
    "/repos/{}/{}/issues/comments/{n}/reactions",
    "/repos/{}/{}/pulls",
    "/repos/{}/{}/pulls/{n}",
    "/repos/{}/{}/actions/runs",
    "/repos/{}/{}/actions/workflows/{}/runs",
];

const POST_PATTERNS: &[&str] = &[
    "/repos/{}/{}/issues",
    "/repos/{}/{}/issues/{n}/comments",
    "/repos/{}/{}/issues/{n}/reactions",
    "/repos/{}/{}/issues/{n}/labels",
    "/repos/{}/{}/issues/comments/{n}/reactions",
    "/repos/{}/{}/actions/workflows/{}/dispatches",
];

/// A path segment made only of safe characters; `.` and `..` are not allowed.
fn is_safe_segment(segment: &str) -> bool {
    !segment.is_empty()
        && segment != "."
        && segment != ".."
        && segment
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
}

fn is_number(segment: &str) -> bool {
    !segment.is_empty() && segment.len() <= 18 && segment.chars().all(|c| c.is_ascii_digit())
}

fn matches_pattern(pattern: &str, segments: &[&str]) -> bool {
    let parts: Vec<&str> = pattern.split('/').skip(1).collect();
    for (i, part) in parts.iter().enumerate() {
        if *part == "{path*}" {
            let rest = &segments[i.min(segments.len())..];
            return !rest.is_empty() && rest.iter().all(|s| is_safe_segment(s));
        }
        let Some(segment) = segments.get(i) else {
            return false;
        };
        let ok = match *part {
            "{}" => is_safe_segment(segment),
            "{n}" => is_number(segment),
            literal => literal == *segment,
        };
        if !ok {
            return false;
        }
    }
    parts.len() == segments.len()
}

/// Whether the method and path are on the allowlist. `path` has no query string.
pub fn is_allowed(method: &str, path: &str) -> bool {
    let patterns = match method {
        "GET" => GET_PATTERNS,
        "POST" => POST_PATTERNS,
        _ => return false,
    };
    let Some(rest) = path.strip_prefix('/') else {
        return false;
    };
    let segments: Vec<&str> = rest.split('/').collect();
    patterns.iter().any(|p| matches_pattern(p, &segments))
}
