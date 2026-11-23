//! In-memory ETag cache for GET requests. Nothing is written to disk, so a new
//! run of the app starts with an empty cache.

use serde_json::Value;
use std::collections::{HashMap, VecDeque};

pub const DEFAULT_LIMIT: usize = 500;

pub struct EtagCache {
    limit: usize,
    entries: HashMap<String, (String, Value)>,
    order: VecDeque<String>,
}

impl EtagCache {
    pub fn new() -> Self {
        Self::with_limit(DEFAULT_LIMIT)
    }

    pub fn with_limit(limit: usize) -> Self {
        Self {
            limit,
            entries: HashMap::new(),
            order: VecDeque::new(),
        }
    }

    pub fn get(&self, key: &str) -> Option<(String, Value)> {
        self.entries.get(key).cloned()
    }

    pub fn put(&mut self, key: &str, etag: String, body: Value) {
        if self.entries.insert(key.to_string(), (etag, body)).is_none() {
            self.order.push_back(key.to_string());
        }
        while self.entries.len() > self.limit {
            let Some(oldest) = self.order.pop_front() else {
                break;
            };
            self.entries.remove(&oldest);
        }
    }
}
