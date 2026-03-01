#!/usr/bin/env bash
set -euo pipefail

MAIN_BASE_URL="${MAIN_BASE_URL:-https://domain.com}"
BLOG_HOME_PATH="${BLOG_HOME_PATH:-/blog/}"
BLOG_POST_PATH="${BLOG_POST_PATH:-/blog/posts/%E5%B8%82%E5%A0%B4%E8%84%88%E5%8B%95-2026%E7%AC%AC%E4%B8%80%E5%AD%A3/}"
SITEMAP_PATH="${SITEMAP_PATH:-/blog/sitemap-index.xml}"
ROBOTS_PATH="${ROBOTS_PATH:-/blog/robots.txt}"
PAGES_DEV_URL="${PAGES_DEV_URL:-https://blog-origin.pages.dev}"

pass_count=0
fail_count=0

pass() {
  echo "[PASS] $1"
  pass_count=$((pass_count + 1))
}

fail() {
  echo "[FAIL] $1"
  fail_count=$((fail_count + 1))
}

fetch_status() {
  local url="$1"
  if ! curl --globoff -sS -o /tmp/smoke_body.txt -w "%{http_code}" "$url"; then
    echo "000"
  fi
}

fetch_headers() {
  local url="$1"
  curl --globoff -sSI "$url" || true
}

assert_http_ok_or_redirect() {
  local label="$1"
  local url="$2"
  local status
  status="$(fetch_status "$url")"
  if [[ "$status" =~ ^(2|3) ]]; then
    pass "${label}: status=${status}"
  else
    fail "${label}: unexpected status=${status} url=${url}"
  fi
}

assert_contains() {
  local label="$1"
  local needle="$2"
  if grep -q "$needle" /tmp/smoke_body.txt; then
    pass "${label}: contains '${needle}'"
  else
    fail "${label}: missing '${needle}'"
  fi
}

assert_redirect_to_blog_prefix() {
  local label="$1"
  local url="$2"
  local headers
  headers="$(fetch_headers "$url")"
  local status
  status="$(printf "%s\n" "$headers" | awk 'NR==1 {print $2}')"
  local location
  location="$(printf "%s\n" "$headers" | awk 'BEGIN{IGNORECASE=1} /^location:/ {print $2}' | tr -d '\r')"
  if [[ ! "$status" =~ ^30[1278]$ ]]; then
    fail "${label}: expected redirect status, got=${status:-unknown}"
    return
  fi
  if [[ -z "$location" ]]; then
    fail "${label}: no Location header"
    return
  fi
  if [[ "$location" =~ ^https://(www\.)?domain\.com/blog(/|$) ]]; then
    pass "${label}: location=${location}"
  else
    fail "${label}: unexpected location=${location}"
  fi
}

echo "Running smoke checks against MAIN_BASE_URL=${MAIN_BASE_URL}"

assert_http_ok_or_redirect "Blog home" "${MAIN_BASE_URL}${BLOG_HOME_PATH}"
assert_http_ok_or_redirect "Blog article" "${MAIN_BASE_URL}${BLOG_POST_PATH}"
assert_http_ok_or_redirect "Sitemap index" "${MAIN_BASE_URL}${SITEMAP_PATH}"
assert_http_ok_or_redirect "Robots" "${MAIN_BASE_URL}${ROBOTS_PATH}"

fetch_status "${MAIN_BASE_URL}${SITEMAP_PATH}" >/dev/null
assert_contains "Sitemap references blog path" "/blog/"

fetch_status "${MAIN_BASE_URL}${ROBOTS_PATH}" >/dev/null
assert_contains "Robots references sitemap" "Sitemap:"

assert_redirect_to_blog_prefix "pages.dev redirect" "${PAGES_DEV_URL}/"

if [[ "$fail_count" -gt 0 ]]; then
  echo "Smoke test finished with ${fail_count} failure(s), ${pass_count} pass(es)."
  exit 1
fi

echo "Smoke test passed: ${pass_count} checks."
