#!/usr/bin/env python3
"""Hard-rule scan over the FULL TEXT of the files a change touched.

The point of scanning whole files rather than hunks: a cast or a missing pagination guard is
visible in the file, not necessarily in the diff, and a reviewer reading only the hunks cannot
see either. The rules themselves are the org's, not this script's.

  TS-1  a written cast (`as X`) or an `any`, outside tests
  TS-2  a `.js` file added to a non-theme repo
  GQL-1 a `nodes` selection with no `pageInfo` anywhere in the same file

Usage: hard-rules.py <file> [<file> ...]      paths relative to the cwd
Prints one line per hit and nothing else. Exit 0 always: it reports, it does not judge.

Comments and string literals are stripped before matching. Without that, `import * as db`,
`'... using email as UserFullName'` and a sentence in a doc comment all read as casts, and a
list of hundreds of false hits is the same as no list at all.
"""

import re
import sys

SKIP_DIR = re.compile(r"(^|/)(node_modules|dist|build|generated|\.next|coverage)/")
TEST_FILE = re.compile(r"\.(test|spec)\.tsx?$|(^|/)(tests?|__tests__)/")
TS_FILE = re.compile(r"\.tsx?$")
DTS_FILE = re.compile(r"\.d\.ts$")

# `as` followed by a type, but not `as const` and not an import/export alias.
CAST = re.compile(r"\bas\s+(?!const\b)[A-Za-z_$][\w$.<>\[\]]*")
ANY = re.compile(r":\s*any\b|<any>|\bany\[\]|\bas\s+any\b")
ALIAS_LINE = re.compile(r"^\s*(import|export)\b")


def strip_noise(text):
    """Blank out comments and string/template literals, keeping line numbers intact."""
    out = []
    i, n = 0, len(text)
    state = None  # None | '//' | '/*' | quote char
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        if state is None:
            if c == "/" and nxt == "/":
                state, i = "//", i + 2
                out.append("  ")
                continue
            if c == "/" and nxt == "*":
                state, i = "/*", i + 2
                out.append("  ")
                continue
            if c in "'\"`":
                state, i = c, i + 1
                out.append(" ")
                continue
            out.append(c)
            i += 1
            continue
        if state == "//":
            if c == "\n":
                state = None
                out.append("\n")
            else:
                out.append(" ")
            i += 1
            continue
        if state == "/*":
            if c == "*" and nxt == "/":
                state, i = None, i + 2
                out.append("  ")
                continue
            out.append("\n" if c == "\n" else " ")
            i += 1
            continue
        # inside a string or template literal
        if c == "\\":
            out.append("  ")
            i += 2
            continue
        if c == state:
            state = None
            out.append(" ")
            i += 1
            continue
        out.append("\n" if c == "\n" else " ")
        i += 1
    return "".join(out)


def scan(path):
    hits = []
    try:
        raw = open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return hits

    if TS_FILE.search(path) and not DTS_FILE.search(path):
        code = strip_noise(raw)
        lines = code.split("\n")
        original = raw.split("\n")

        if not TEST_FILE.search(path):
            for n, line in enumerate(lines, 1):
                if ALIAS_LINE.match(line):
                    continue
                if CAST.search(line) or ANY.search(line):
                    hits.append("  TS-1 %s:%d:%s" % (path, n, original[n - 1].strip()[:140]))
        else:
            # Tests may cast. A bare `any[]` in a test is still worth a look, nothing else is.
            for n, line in enumerate(lines, 1):
                if re.search(r"\bany\[\]", line):
                    hits.append("  TS-1 %s:%d:%s (test file: any[] only)" % (path, n, original[n - 1].strip()[:140]))

        if re.search(r"\bnodes\s*[({\n]", code) and "pageInfo" not in code:
            hits.append("  GQL-1 %s: selects nodes with no pageInfo anywhere in the file" % path)

    if path.endswith(".js"):
        hits.append("  TS-2 %s: .js file in a non-theme repo" % path)

    return hits


def main(argv):
    total = 0
    for path in argv:
        if SKIP_DIR.search(path):
            continue
        for line in scan(path):
            print(line)
            total += 1
    if total == 0:
        print("  none")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
