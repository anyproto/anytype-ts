#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import PurePosixPath

# Try importing PyYAML; install on the fly if missing (useful on CI)
try:
    import yaml
except ModuleNotFoundError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyYAML", "--quiet"])
    import yaml


def main():
    parser = argparse.ArgumentParser(
        description="Download and parse <channel>*.yml (win/mac/linux) and print absolute download URLs."
    )
    parser.add_argument(
        "--base-url",
        required=True,
        help="HTTPS base URL of the release directory, e.g. https://bucket.s3.region.amazonaws.com/my/app",
    )
    parser.add_argument(
        "--channel",
        default="latest",
        help="Channel name (default: 'latest'). Will look for <channel>.yml, <channel>-mac.yml, <channel>-linux.yml.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with non-zero status if no URLs are found.",
    )
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    files_map = {
        "win": f"{args.channel}.yml",
        "mac": f"{args.channel}-mac.yml",
        "linux": f"{args.channel}-linux.yml",
    }

    grouped = {"win": [], "mac": [], "linux": []}

    for plat, fname in files_map.items():
        url = f"{base}/{fname}"
        try:
            # Fetch YAML
            req = urllib.request.Request(url, headers={"User-Agent": "parse-all-urls/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                content = resp.read()

            data = yaml.safe_load(content) or {}

            # Build base dir URL for asset links
            parsed = urllib.parse.urlparse(url)
            parent = PurePosixPath(parsed.path).parent.as_posix().rstrip("/")
            dir_url = f"{parsed.scheme}://{parsed.netloc}{parent}"

            urls = []
            files = data.get("files") or []
            for entry in files:
                name = entry.get("url") or entry.get("name")
                if not name:
                    continue
                urls.append(f"{dir_url}/{urllib.parse.quote(name)}")

            # Fallback: single 'url' field at the root
            if not urls and isinstance(data.get("url"), str):
                urls.append(f"{dir_url}/{urllib.parse.quote(data['url'])}")

            if urls:
                grouped[plat] = urls
                print(f"[OK] {plat}: {len(urls)} from {url}", file=sys.stderr)
            else:
                print(f"[WARN] {plat}: no assets in {url}", file=sys.stderr)

        except Exception as e:
            # Missing file or network issues are not fatal for other platforms
            print(f"[INFO] {plat}: skipping {url}: {e}", file=sys.stderr)

    # Union without duplicates
    all_urls = sorted(set(sum(grouped.values(), [])))
    result = {"win": grouped["win"], "mac": grouped["mac"], "linux": grouped["linux"], "all": all_urls}

    # outputs
    outputs = list()
    for title, urls in result.items():
        outputs.append(f"*{title}*")
        for u in urls:
            outputs.append(f"- {u}")
        outputs.append("")  # empty line between sections
    message = "\n".join(outputs).rstrip()

    # GitHub Actions outputs
    gha = os.environ.get("GITHUB_OUTPUT")
    if gha:
        try:
            with open(gha, "a", encoding="utf-8") as f:
                f.write("message<<EOF\n")
                f.write(message + "\n")
                f.write("EOF\n")
        except Exception as e:
            print(f"[WARN] failed to write GitHub outputs: {e}", file=sys.stderr)

    # Stdout
    print(message)

    # failed exit
    if args.strict and not all_urls:
        sys.exit(4)


if __name__ == "__main__":
    main()
